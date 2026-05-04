export const slugify = (value) => value.toLowerCase().replace(/\s+/g, '-')

export const normalize = (value) => value.trim().toLowerCase()

export const paginate = (items, page = 1, limit = 20) => {
  const pageNumber = Math.max(1, Number(page) || 1)
  const pageSize = Math.max(1, Number(limit) || 20)
  const offset = (pageNumber - 1) * pageSize
  return {
    page: pageNumber,
    limit: pageSize,
    total: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
    items: items.slice(offset, offset + pageSize),
  }
}

export const sortLayoffs = (items, sort = 'newest') => {
  const copy = [...items]
  if (sort === 'mostAffected') {
    copy.sort((a, b) => b.count - a.count)
  } else if (sort === 'alphabetical') {
    copy.sort((a, b) => a.company.localeCompare(b.company))
  } else {
    copy.sort((a, b) => new Date(b.date) - new Date(a.date))
  }
  return copy
}

export const statsByMonth = (items) => {
  const grouped = new Map()
  items.forEach((item) => {
    const key = item.date.slice(0, 7)
    const current = grouped.get(key) ?? { month: key, count: 0, jobs: 0 }
    current.count += 1
    current.jobs += item.count
    grouped.set(key, current)
  })
  return [...grouped.values()].sort((a, b) => a.month.localeCompare(b.month))
}

export const statsByIndustry = (items) => {
  const grouped = new Map()
  items.forEach((item) => {
    const current = grouped.get(item.industry) ?? { industry: item.industry, count: 0, jobs: 0 }
    current.count += 1
    current.jobs += item.count
    grouped.set(item.industry, current)
  })
  return [...grouped.values()].sort((a, b) => b.jobs - a.jobs)
}

export const statsByCountry = (items) => {
  const grouped = new Map()
  items.forEach((item) => {
    grouped.set(item.location.country, (grouped.get(item.location.country) ?? 0) + item.count)
  })
  return Object.fromEntries(grouped)
}

export const topCompanies = (items, limit = 10) => {
  const grouped = new Map()
  items.forEach((item) => {
    const current = grouped.get(item.company) ?? { company: item.company, industry: item.industry, count: 0 }
    current.count += item.count
    grouped.set(item.company, current)
  })
  return [...grouped.values()].sort((a, b) => b.count - a.count).slice(0, limit)
}

export const summary = (items) => ({
  totalCount: items.length,
  totalJobs: items.reduce((sum, item) => sum + item.count, 0),
  companies: new Set(items.map((item) => item.company)).size,
  countries: new Set(items.map((item) => item.location.country)).size,
})
