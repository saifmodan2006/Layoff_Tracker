export type Industry =
  | 'Tech'
  | 'Finance'
  | 'Retail'
  | 'Media'
  | 'Healthcare'
  | 'Automotive'
  | 'Other'

export type Region = 'North America' | 'Europe' | 'Asia' | 'Other'

export type Stage =
  | 'Seed'
  | 'Series A'
  | 'Series B'
  | 'Series C'
  | 'Late'
  | 'Post-IPO'

export type Status = 'Confirmed' | 'Rumored' | 'Denied'

export interface LayoffRecord {
  id: string
  company: string
  industry: Industry
  location: {
    city: string
    country: string
    region: Region
  }
  date: string
  count: number
  percent_of_workforce: number
  stage: Stage
  status: Status
  source_url: string
  notes: string
}