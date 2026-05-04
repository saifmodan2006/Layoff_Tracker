import { randomUUID } from 'node:crypto'

const companySeeds = [
  ['Nimbus Systems', 'Tech', 'San Francisco', 'United States', 'North America', 'Post-IPO', 'Confirmed', 1800],
  ['PayBridge', 'Finance', 'New York', 'United States', 'North America', 'Late', 'Confirmed', 900],
  ['Cartly', 'Retail', 'Seattle', 'United States', 'North America', 'Post-IPO', 'Confirmed', 2800],
  ['Pulse Media Group', 'Media', 'Los Angeles', 'United States', 'North America', 'Series C', 'Rumored', 420],
  ['Helix BioCare', 'Healthcare', 'Boston', 'United States', 'North America', 'Series B', 'Confirmed', 760],
  ['VoltDrive', 'Automotive', 'Berlin', 'Germany', 'Europe', 'Post-IPO', 'Confirmed', 3100],
  ['ByteForge', 'Tech', 'Dublin', 'Ireland', 'Europe', 'Series C', 'Confirmed', 620],
  ['Northstar Payments', 'Finance', 'London', 'United Kingdom', 'Europe', 'Late', 'Confirmed', 1300],
  ['Skyline Networks', 'Tech', 'Toronto', 'Canada', 'North America', 'Post-IPO', 'Confirmed', 2200],
  ['Zenith Mobility', 'Automotive', 'Tokyo', 'Japan', 'Asia', 'Late', 'Confirmed', 1600],
  ['Sun Harbor Retail', 'Retail', 'Singapore', 'Singapore', 'Asia', 'Series B', 'Confirmed', 780],
  ['MediCore AI', 'Healthcare', 'Bengaluru', 'India', 'Asia', 'Series A', 'Rumored', 350],
  ['BroadcastWave', 'Media', 'Sydney', 'Australia', 'Other', 'Late', 'Confirmed', 480],
  ['CoreStack', 'Tech', 'Austin', 'United States', 'North America', 'Series B', 'Confirmed', 510],
  ['LedgerAxis', 'Finance', 'Zurich', 'Switzerland', 'Europe', 'Series C', 'Confirmed', 430],
  ['Apex Clinics', 'Healthcare', 'Sao Paulo', 'Brazil', 'Other', 'Late', 'Confirmed', 1100],
  ['UrbanRail EV', 'Automotive', 'Seoul', 'South Korea', 'Asia', 'Series C', 'Confirmed', 840],
  ['Mercury Cloud', 'Tech', 'Amsterdam', 'Netherlands', 'Europe', 'Post-IPO', 'Confirmed', 2600],
]

const multipliers = [1, 1.12, 0.88]

const isoDate = (year, month, day) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

export const seedLayoffs = companySeeds.flatMap((seed, companyIndex) =>
  multipliers.map((multiplier, eventIndex) => {
    const [company, industry, city, country, region, stage, status, baseCount] = seed
    const year = 2024 + ((companyIndex + eventIndex) % 3)
    const month = ((companyIndex * 2 + eventIndex * 5) % 12) + 1
    const day = ((companyIndex + 7 + eventIndex * 3) % 27) + 1
    const count = Math.round(baseCount * multiplier)
    const percent = Math.min(45, Math.max(4, Math.round((count / (baseCount * 8 + 2000)) * 100)))

    return {
      id: randomUUID(),
      company,
      industry,
      location: { city, country, region },
      date: isoDate(year, month, day),
      count,
      percent_of_workforce: percent,
      stage,
      status,
      source_url: `https://example.com/layoff/${company.toLowerCase().replace(/\s+/g, '-')}`,
      notes: `${company} restructuring tied to cost optimization and regional demand changes.`,
    }
  }),
)

export const alerts = []
export const logs = [
  { id: randomUUID(), level: 'info', message: 'Scraper boot completed', at: new Date().toISOString() },
]

export const subscribers = []
