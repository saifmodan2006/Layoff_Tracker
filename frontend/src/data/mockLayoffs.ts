import type { Industry, LayoffRecord, Region, Stage, Status } from '../types'

type CompanySeed = {
  company: string
  industry: Industry
  city: string
  country: string
  region: Region
  stage: Stage
  status: Status
  baseCount: number
}

const companySeeds: CompanySeed[] = [
  {
    company: 'Nimbus Systems',
    industry: 'Tech',
    city: 'San Francisco',
    country: 'United States',
    region: 'North America',
    stage: 'Post-IPO',
    status: 'Confirmed',
    baseCount: 1800,
  },
  {
    company: 'PayBridge',
    industry: 'Finance',
    city: 'New York',
    country: 'United States',
    region: 'North America',
    stage: 'Late',
    status: 'Confirmed',
    baseCount: 900,
  },
  {
    company: 'Cartly',
    industry: 'Retail',
    city: 'Seattle',
    country: 'United States',
    region: 'North America',
    stage: 'Post-IPO',
    status: 'Confirmed',
    baseCount: 2800,
  },
  {
    company: 'Pulse Media Group',
    industry: 'Media',
    city: 'Los Angeles',
    country: 'United States',
    region: 'North America',
    stage: 'Series C',
    status: 'Rumored',
    baseCount: 420,
  },
  {
    company: 'Helix BioCare',
    industry: 'Healthcare',
    city: 'Boston',
    country: 'United States',
    region: 'North America',
    stage: 'Series B',
    status: 'Confirmed',
    baseCount: 760,
  },
  {
    company: 'VoltDrive',
    industry: 'Automotive',
    city: 'Berlin',
    country: 'Germany',
    region: 'Europe',
    stage: 'Post-IPO',
    status: 'Confirmed',
    baseCount: 3100,
  },
  {
    company: 'ByteForge',
    industry: 'Tech',
    city: 'Dublin',
    country: 'Ireland',
    region: 'Europe',
    stage: 'Series C',
    status: 'Confirmed',
    baseCount: 620,
  },
  {
    company: 'Northstar Payments',
    industry: 'Finance',
    city: 'London',
    country: 'United Kingdom',
    region: 'Europe',
    stage: 'Late',
    status: 'Confirmed',
    baseCount: 1300,
  },
  {
    company: 'Agora Commerce',
    industry: 'Retail',
    city: 'Paris',
    country: 'France',
    region: 'Europe',
    stage: 'Series C',
    status: 'Rumored',
    baseCount: 540,
  },
  {
    company: 'Skyline Networks',
    industry: 'Tech',
    city: 'Toronto',
    country: 'Canada',
    region: 'North America',
    stage: 'Post-IPO',
    status: 'Confirmed',
    baseCount: 2200,
  },
  {
    company: 'Zenith Mobility',
    industry: 'Automotive',
    city: 'Tokyo',
    country: 'Japan',
    region: 'Asia',
    stage: 'Late',
    status: 'Confirmed',
    baseCount: 1600,
  },
  {
    company: 'Sun Harbor Retail',
    industry: 'Retail',
    city: 'Singapore',
    country: 'Singapore',
    region: 'Asia',
    stage: 'Series B',
    status: 'Confirmed',
    baseCount: 780,
  },
  {
    company: 'MediCore AI',
    industry: 'Healthcare',
    city: 'Bengaluru',
    country: 'India',
    region: 'Asia',
    stage: 'Series A',
    status: 'Rumored',
    baseCount: 350,
  },
  {
    company: 'BroadcastWave',
    industry: 'Media',
    city: 'Sydney',
    country: 'Australia',
    region: 'Other',
    stage: 'Late',
    status: 'Confirmed',
    baseCount: 480,
  },
  {
    company: 'CoreStack',
    industry: 'Tech',
    city: 'Austin',
    country: 'United States',
    region: 'North America',
    stage: 'Series B',
    status: 'Confirmed',
    baseCount: 510,
  },
  {
    company: 'LedgerAxis',
    industry: 'Finance',
    city: 'Zurich',
    country: 'Switzerland',
    region: 'Europe',
    stage: 'Series C',
    status: 'Confirmed',
    baseCount: 430,
  },
  {
    company: 'PixelPort',
    industry: 'Media',
    city: 'Madrid',
    country: 'Spain',
    region: 'Europe',
    stage: 'Series B',
    status: 'Denied',
    baseCount: 220,
  },
  {
    company: 'Apex Clinics',
    industry: 'Healthcare',
    city: 'Sao Paulo',
    country: 'Brazil',
    region: 'Other',
    stage: 'Late',
    status: 'Confirmed',
    baseCount: 1100,
  },
  {
    company: 'UrbanRail EV',
    industry: 'Automotive',
    city: 'Seoul',
    country: 'South Korea',
    region: 'Asia',
    stage: 'Series C',
    status: 'Confirmed',
    baseCount: 840,
  },
  {
    company: 'Mercury Cloud',
    industry: 'Tech',
    city: 'Amsterdam',
    country: 'Netherlands',
    region: 'Europe',
    stage: 'Post-IPO',
    status: 'Confirmed',
    baseCount: 2600,
  },
]

const growthMultipliers = [1, 1.12, 0.88]

const toIsoDate = (year: number, month: number, day: number) => {
  const paddedMonth = `${month}`.padStart(2, '0')
  const paddedDay = `${day}`.padStart(2, '0')
  return `${year}-${paddedMonth}-${paddedDay}`
}

export const mockLayoffs: LayoffRecord[] = companySeeds.flatMap((seed, companyIndex) =>
  growthMultipliers.map((multiplier, eventIndex) => {
    const year = 2024 + ((companyIndex + eventIndex) % 3)
    const month = ((companyIndex * 2 + eventIndex * 5) % 12) + 1
    const day = ((companyIndex + 7 + eventIndex * 3) % 27) + 1
    const count = Math.round(seed.baseCount * multiplier)
    const percent = Math.min(
      45,
      Math.max(4, Math.round((count / (seed.baseCount * 8 + 2000)) * 100)),
    )

    return {
      id: `${seed.company.toLowerCase().replace(/\s+/g, '-')}-${year}-${month}-${eventIndex}`,
      company: seed.company,
      industry: seed.industry,
      location: {
        city: seed.city,
        country: seed.country,
        region: seed.region,
      },
      date: toIsoDate(year, month, day),
      count,
      percent_of_workforce: percent,
      stage: seed.stage,
      status: seed.status,
      source_url: `https://example.com/layoff/${seed.company.toLowerCase().replace(/\s+/g, '-')}`,
      notes: `${seed.company} restructuring tied to cost optimization and regional demand changes.`,
    }
  }),
)