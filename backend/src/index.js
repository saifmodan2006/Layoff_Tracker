import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { alerts, logs, seedLayoffs, subscribers } from './data.js'
import {
  normalize,
  paginate,
  sortLayoffs,
  statsByCountry,
  statsByIndustry,
  statsByMonth,
  summary,
  topCompanies,
  slugify,
} from './utils.js'

const app = express()
const port = Number(process.env.PORT ?? 4000)
const jwtSecret = process.env.JWT_SECRET ?? 'dev-secret'
const adminUser = process.env.ADMIN_USER ?? 'admin'
const adminPassword = process.env.ADMIN_PASSWORD ?? 'password'

app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? true }))
app.use(express.json({ limit: '2mb' }))
app.use(morgan('dev'))
app.use(rateLimit({ windowMs: 60_000, limit: 100 }))

const requireAdmin = (req, res, next) => {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null

  if (!token) {
    return res.status(401).json({ error: 'Missing admin token' })
  }

  try {
    jwt.verify(token, jwtSecret)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

let layoffs = [...seedLayoffs]

app.get('/health', (_, res) => res.json({ ok: true, service: 'layoff-tracker-api' }))

app.post('/api/auth/login', (req, res) => {
  const schema = z.object({ username: z.string(), password: z.string() })
  const body = schema.safeParse(req.body)
  if (!body.success) {
    return res.status(400).json({ error: 'Invalid payload' })
  }

  if (body.data.username !== adminUser || body.data.password !== adminPassword) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const token = jwt.sign({ sub: body.data.username, role: 'admin' }, jwtSecret, { expiresIn: '8h' })
  res.json({ token })
})

app.get('/api/layoffs', (req, res) => {
  const { industry, country, year, stage, search, sort, page, limit } = req.query
  const filtered = layoffs.filter((item) => {
    if (industry && item.industry !== industry) return false
    if (country && item.location.country !== country) return false
    if (year && String(new Date(item.date).getFullYear()) !== String(year)) return false
    if (stage && item.stage !== stage) return false
    if (search) {
      const q = normalize(String(search))
      const haystack = `${item.company} ${item.location.city} ${item.location.country} ${item.notes}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })

  const ordered = sortLayoffs(filtered, String(sort ?? 'newest'))
  res.json(paginate(ordered, page, limit))
})

app.get('/api/layoffs/:id', (req, res) => {
  const record = layoffs.find((item) => item.id === req.params.id)
  if (!record) return res.status(404).json({ error: 'Not found' })
  res.json(record)
})

app.post('/api/layoffs', requireAdmin, (req, res) => {
  const schema = z.object({
    company: z.string(),
    industry: z.string(),
    location: z.object({ city: z.string(), country: z.string(), region: z.string() }),
    date: z.string(),
    count: z.number(),
    percent_of_workforce: z.number(),
    stage: z.string(),
    status: z.string(),
    source_url: z.string().url(),
    notes: z.string().optional(),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload' })

  const created = { id: randomUUID(), ...parsed.data, notes: parsed.data.notes ?? '' }
  layoffs.unshift(created)
  res.status(201).json(created)
})

app.put('/api/layoffs/:id', requireAdmin, (req, res) => {
  const index = layoffs.findIndex((item) => item.id === req.params.id)
  if (index === -1) return res.status(404).json({ error: 'Not found' })
  layoffs[index] = { ...layoffs[index], ...req.body }
  res.json(layoffs[index])
})

app.delete('/api/layoffs/:id', requireAdmin, (req, res) => {
  layoffs = layoffs.filter((item) => item.id !== req.params.id)
  res.status(204).send()
})

app.get('/api/stats/summary', (_, res) => res.json(summary(layoffs)))
app.get('/api/stats/monthly', (_, res) => res.json(statsByMonth(layoffs)))
app.get('/api/stats/industry', (_, res) => res.json(statsByIndustry(layoffs)))
app.get('/api/stats/country', (_, res) => res.json(statsByCountry(layoffs)))
app.get('/api/stats/top-companies', (_, res) => res.json(topCompanies(layoffs)))

app.get('/api/companies', (_, res) => {
  const grouped = new Map()
  layoffs.forEach((item) => {
    const current = grouped.get(item.company) ?? {
      company: item.company,
      industry: item.industry,
      totalJobs: 0,
      events: 0,
    }
    current.totalJobs += item.count
    current.events += 1
    grouped.set(item.company, current)
  })
  res.json([...grouped.values()].sort((a, b) => b.totalJobs - a.totalJobs))
})

app.get('/api/companies/:name', (req, res) => {
  const name = req.params.name.replace(/-/g, ' ')
  const records = layoffs.filter((item) => slugify(item.company) === req.params.name || normalize(item.company) === normalize(name))
  if (!records.length) return res.status(404).json({ error: 'Not found' })
  const totalJobs = records.reduce((sum, record) => sum + record.count, 0)
  const largestCut = Math.max(...records.map((record) => record.count))
  res.json({
    company: records[0].company,
    summary: {
      ...summary(records),
      events: records.length,
      totalJobs,
      largestCut,
      industry: records[0].industry,
      city: records[0].location.city,
      country: records[0].location.country,
      region: records[0].location.region,
    },
    records,
    related: layoffs.filter((item) => item.industry === records[0].industry && item.company !== records[0].company).slice(0, 5),
  })
})

app.post('/api/alerts/subscribe', (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    company: z.string().optional(),
    industries: z.array(z.string()).optional(),
    countries: z.array(z.string()).optional(),
    minJobs: z.number().optional(),
    frequency: z.enum(['Instant', 'Daily', 'Weekly']),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload' })
  const item = { id: randomUUID(), ...parsed.data, createdAt: new Date().toISOString() }
  subscribers.push(item)
  alerts.push({ id: randomUUID(), email: parsed.data.email, status: 'queued' })
  res.status(201).json(item)
})

app.delete('/api/alerts/unsubscribe', (req, res) => {
  const email = String(req.body?.email ?? '')
  const index = subscribers.findIndex((item) => item.email === email)
  if (index >= 0) subscribers.splice(index, 1)
  res.json({ ok: true })
})

app.post('/api/admin/scrape', requireAdmin, (_, res) => {
  const log = { id: randomUUID(), level: 'info', message: 'Manual scraper run triggered', at: new Date().toISOString() }
  logs.unshift(log)
  res.json({ ok: true, log })
})

app.get('/api/admin/logs', requireAdmin, (_, res) => res.json(logs))

app.listen(port, () => {
  console.log(`Layoff tracker API running on http://localhost:${port}`)
})
