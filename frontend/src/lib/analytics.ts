import type { Industry, LayoffRecord } from '../types'

export type TrendGranularity = 'monthly' | 'quarterly' | 'yearly'

export const industries: Industry[] = [
  'Tech',
  'Finance',
  'Retail',
  'Media',
  'Healthcare',
  'Automotive',
  'Other',
]

export const stages = ['Seed', 'Series A', 'Series B', 'Series C', 'Late', 'Post-IPO'] as const

export const industryColors: Record<Industry, string> = {
  Tech: '#e74c3c',
  Finance: '#f39c12',
  Retail: '#d35400',
  Media: '#9b3326',
  Healthcare: '#27ae60',
  Automotive: '#e67e22',
  Other: '#7f8c8d',
}

export const normalize = (value: string) => value.trim().toLowerCase()

export const formatNumber = (value: number) => value.toLocaleString('en-US')

export const formatPct = (value: number) => `${value.toFixed(1)}%`

export const monthKey = (date: Date) => `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}`

export const bucketLabel = (isoDate: string, granularity: TrendGranularity) => {
  const date = new Date(isoDate)
  const month = date.toLocaleString('en-US', { month: 'short' })

  if (granularity === 'yearly') {
    return `${date.getFullYear()}`
  }

  if (granularity === 'quarterly') {
    const quarter = Math.floor(date.getMonth() / 3) + 1
    return `Q${quarter} ${date.getFullYear()}`
  }

  return `${month} ${date.getFullYear()}`
}

export const companySlug = (company: string) => company.toLowerCase().replace(/\s+/g, '-')

export const groupedByCompany = (records: LayoffRecord[]) => {
  return records.reduce(
    (acc, record) => {
      const current = acc[record.company] ?? {
        company: record.company,
        industry: record.industry,
        city: record.location.city,
        country: record.location.country,
        region: record.location.region,
        totalJobs: 0,
        events: 0,
        largestCut: 0,
      }

      current.totalJobs += record.count
      current.events += 1
      current.largestCut = Math.max(current.largestCut, record.count)
      acc[record.company] = current
      return acc
    },
    {} as Record<string, { company: string; industry: Industry; city: string; country: string; region: string; totalJobs: number; events: number; largestCut: number }>,
  )
}

export const summaryStats = (records: LayoffRecord[]) => {
  const totalJobs = records.reduce((sum, record) => sum + record.count, 0)
  const companies = new Set(records.map((record) => record.company)).size
  const countries = new Set(records.map((record) => record.location.country)).size
  const currentYear = new Date().getFullYear()
  const yearJobs = records
    .filter((record) => new Date(record.date).getFullYear() === currentYear)
    .reduce((sum, record) => sum + record.count, 0)

  return { totalJobs, companies, countries, yearJobs }
}

export const monthlyStats = (records: LayoffRecord[]) => {
  const byMonth = records.reduce(
    (acc, record) => {
      const key = monthKey(new Date(record.date))
      const current = acc[key] ?? { month: key, count: 0, jobs: 0, companies: [] as string[] }
      current.count += 1
      current.jobs += record.count
      current.companies.push(record.company)
      acc[key] = current
      return acc
    },
    {} as Record<string, { month: string; count: number; jobs: number; companies: string[] }>,
  )

  return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month))
}

export const industryStats = (records: LayoffRecord[]) => {
  const grouped = records.reduce(
    (acc, record) => {
      const current = acc[record.industry] ?? { industry: record.industry, count: 0, jobs: 0 }
      current.count += 1
      current.jobs += record.count
      acc[record.industry] = current
      return acc
    },
    {} as Record<Industry, { industry: Industry; count: number; jobs: number }>,
  )

  return Object.values(grouped).sort((a, b) => b.jobs - a.jobs)
}

export const countryStats = (records: LayoffRecord[]) => {
  return records.reduce(
    (acc, record) => {
      acc[record.location.country] = (acc[record.location.country] ?? 0) + record.count
      return acc
    },
    {} as Record<string, number>,
  )
}

export const topCompanies = (records: LayoffRecord[], limit = 10) => {
  return Object.values(groupedByCompany(records))
    .sort((a, b) => b.totalJobs - a.totalJobs)
    .slice(0, limit)
}

export const heatmapDays = (records: LayoffRecord[]) => {
  const days = records.reduce(
    (acc, record) => {
      acc[record.date] = (acc[record.date] ?? 0) + record.count
      return acc
    },
    {} as Record<string, number>,
  )

  return Object.entries(days)
    .map(([date, jobs]) => ({ date, jobs, day: new Date(date).getDate(), month: new Date(date).getMonth(), year: new Date(date).getFullYear() }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export const findCompany = (records: LayoffRecord[], companyName: string) => {
  const normalizedName = normalize(companyName)
  return records.filter((record) => normalize(record.company) === normalizedName)
}
