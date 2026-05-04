import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import countries110m from 'world-atlas/countries-110m.json'
import { feature } from 'topojson-client'
import {
  geoMercator,
  geoPath,
  interpolateRgb,
  max,
  scaleLinear,
  tsvParse,
  type DSVRowString,
} from 'd3'
import type { Feature, FeatureCollection, Geometry, GeoJsonProperties } from 'geojson'
import { mockLayoffs } from '../data/mockLayoffs'
import type { Industry, LayoffRecord, Region, Stage } from '../types'

type SortOption = 'newest' | 'most-affected' | 'alphabetical'
type TrendGranularity = 'monthly' | 'quarterly' | 'yearly'
type SortDirection = 'asc' | 'desc'
type TableSortField =
  | 'company'
  | 'industry'
  | 'location'
  | 'date'
  | 'count'
  | 'percent_of_workforce'
  | 'stage'
  | 'status'

const industries: Industry[] = [
  'Tech',
  'Finance',
  'Retail',
  'Media',
  'Healthcare',
  'Automotive',
  'Other',
]

const stages: Stage[] = ['Seed', 'Series A', 'Series B', 'Series C', 'Late', 'Post-IPO']

const redPalette = ['#f7b4a8', '#ef8d7d', '#e36857', '#d94e3f', '#c0392b', '#9f2f24']
const industryColor: Record<Industry, string> = {
  Tech: '#e74c3c',
  Finance: '#f39c12',
  Retail: '#d35400',
  Media: '#9b3326',
  Healthcare: '#27ae60',
  Automotive: '#e67e22',
  Other: '#7f8c8d',
}

const countryAliasMap: Record<string, string> = {
  'united states of america': 'united states',
  russia: 'russian federation',
  korea: 'south korea',
  'korea, republic of': 'south korea',
}

const normalize = (value: string) => value.trim().toLowerCase()

const formatNumber = (value: number) => value.toLocaleString('en-US')

const formatPct = (value: number) => `${value.toFixed(1)}%`

const bucketLabel = (isoDate: string, granularity: TrendGranularity) => {
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

const compareBySortOption = (a: LayoffRecord, b: LayoffRecord, option: SortOption) => {
  if (option === 'most-affected') {
    return b.count - a.count
  }

  if (option === 'alphabetical') {
    return a.company.localeCompare(b.company)
  }

  return new Date(b.date).getTime() - new Date(a.date).getTime()
}

const compareByTableField = (
  a: LayoffRecord,
  b: LayoffRecord,
  field: TableSortField,
  direction: SortDirection,
) => {
  const dir = direction === 'asc' ? 1 : -1

  switch (field) {
    case 'company':
      return a.company.localeCompare(b.company) * dir
    case 'industry':
      return a.industry.localeCompare(b.industry) * dir
    case 'location':
      return `${a.location.city}, ${a.location.country}`.localeCompare(
        `${b.location.city}, ${b.location.country}`,
      ) * dir
    case 'date':
      return (new Date(a.date).getTime() - new Date(b.date).getTime()) * dir
    case 'count':
      return (a.count - b.count) * dir
    case 'percent_of_workforce':
      return (a.percent_of_workforce - b.percent_of_workforce) * dir
    case 'stage':
      return a.stage.localeCompare(b.stage) * dir
    case 'status':
      return a.status.localeCompare(b.status) * dir
    default:
      return 0
  }
}

const monthKey = (date: Date) => `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}`

const AnimatedValue = ({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) => {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const durationMs = 1500
    const startTime = performance.now()
    const startValue = 0

    const step = (timestamp: number) => {
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / durationMs, 1)
      const eased = 1 - (1 - progress) ** 3
      const nextValue = Math.round(startValue + (value - startValue) * eased)
      setDisplayValue(nextValue)

      if (progress < 1) {
        requestAnimationFrame(step)
      }
    }

    const handle = requestAnimationFrame(step)
    return () => cancelAnimationFrame(handle)
  }, [value])

  return (
    <span className="font-mono text-3xl font-semibold tracking-tight text-[var(--color-text-primary)] md:text-4xl">
      {prefix}
      {formatNumber(displayValue)}
      {suffix}
    </span>
  )
}

const WorldMap = ({
  countryTotals,
  onCountryClick,
}: {
  countryTotals: Record<string, number>
  onCountryClick: (countryName: string) => void
}) => {
  const [idToName, setIdToName] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    let isActive = true

    const loadCountryNames = async () => {
      try {
        const response = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/country-names.tsv')
        if (!response.ok) {
          return
        }

        const text = await response.text()
        const rows = tsvParse(text)
        const map = new Map<string, string>()
        rows.forEach((row: DSVRowString) => {
          if (row.id && row.name) {
            map.set(row.id, row.name)
          }
        })

        if (isActive) {
          setIdToName(map)
        }
      } catch {
        // Keep a blank map if the label fetch fails.
      }
    }

    loadCountryNames()

    return () => {
      isActive = false
    }
  }, [])

  const countries = useMemo(() => {
    const world = countries110m as unknown as {
      objects: {
        countries: object
      }
    }

    const geoJson = feature(world as never, world.objects.countries as never)
    return (geoJson as unknown as FeatureCollection<Geometry, GeoJsonProperties>).features
  }, [])

  const normalizedTotals = useMemo(() => {
    const entries: Array<[string, number]> = Object.entries(countryTotals).map(([country, count]) => [
      normalize(country),
      count,
    ])
    return new Map<string, number>(entries)
  }, [countryTotals])

  const [hover, setHover] = useState<{ x: number; y: number; label: string } | null>(null)

  const boundsWidth = 960
  const boundsHeight = 460

  const projection = useMemo(
    () => geoMercator().fitSize([boundsWidth, boundsHeight], { type: 'FeatureCollection', features: countries }),
    [countries],
  )

  const pathGenerator = useMemo(() => geoPath(projection), [projection])

  const maxTotal = max(Object.values(countryTotals)) ?? 0
  const colorScale = useMemo(() => {
    return scaleLinear<string>()
      .domain([0, Math.max(1, maxTotal)])
      .range(['#241311', '#c0392b'])
      .interpolate(interpolateRgb)
  }, [maxTotal])

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-serif text-xl text-[#f0f0f0]">Global Layoff Intensity</h3>
        <span className="rounded-full border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-1 font-mono text-xs text-[#888888]">
          Click a country to filter the table
        </span>
      </div>
      <svg
        className="h-[360px] w-full md:h-[440px]"
        viewBox={`0 0 ${boundsWidth} ${boundsHeight}`}
        role="img"
        aria-label="World map showing layoffs by country"
      >
        <rect width={boundsWidth} height={boundsHeight} fill="var(--color-surface)" rx={16} />
        {countries.map((countryFeature: Feature<Geometry, GeoJsonProperties>) => {
          const id = String(countryFeature.id)
          const rawName = idToName.get(id) ?? `Country ${id}`
          const normalizedName = countryAliasMap[normalize(rawName)] ?? normalize(rawName)
          const total = normalizedTotals.get(normalizedName) ?? 0
          const fill = total > 0 ? colorScale(total) : '#171717'
          const path = pathGenerator(countryFeature)

          if (!path) {
            return null
          }

          const centroid = pathGenerator.centroid(countryFeature)
          const delayMs = Math.max(0, Math.round((centroid[0] / boundsWidth) * 900))

          return (
            <path
              key={id}
              d={path}
              fill={fill}
              stroke="#2a2a2a"
              strokeWidth={0.5}
              className="cursor-pointer transition-all duration-200 hover:stroke-[#f0f0f0]"
              style={{
                animation: `fade-map 700ms ease-out ${delayMs}ms both`,
              }}
              onMouseEnter={(event: ReactMouseEvent<SVGPathElement>) => {
                const container = event.currentTarget.ownerSVGElement?.getBoundingClientRect()
                if (!container) {
                  return
                }
                setHover({
                  x: event.clientX - container.left,
                  y: event.clientY - container.top,
                  label: `${rawName}: ${formatNumber(total)} jobs`,
                })
              }}
              onMouseMove={(event: ReactMouseEvent<SVGPathElement>) => {
                const container = event.currentTarget.ownerSVGElement?.getBoundingClientRect()
                if (!container) {
                  return
                }
                setHover((current) =>
                  current
                    ? {
                        ...current,
                        x: event.clientX - container.left,
                        y: event.clientY - container.top,
                      }
                    : null,
                )
              }}
              onMouseLeave={() => setHover(null)}
              onClick={() => onCountryClick(rawName)}
            />
          )
        })}
      </svg>
      {hover ? (
        <div
          className="pointer-events-none absolute z-20 rounded-md border border-[#2a2a2a] bg-[#0f0f0f] px-2 py-1 text-xs text-[#f0f0f0]"
          style={{ left: hover.x + 16, top: hover.y + 16 } as CSSProperties}
        >
          {hover.label}
        </div>
      ) : null}
    </div>
  )
}

const DashboardPage = () => {
  const [darkMode, setDarkMode] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [search, setSearch] = useState('')
  const [selectedIndustries, setSelectedIndustries] = useState<Industry[]>([])
  const [selectedRegion, setSelectedRegion] = useState<'all' | Region>('all')
  const [selectedCountry, setSelectedCountry] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedStage, setSelectedStage] = useState<'all' | Stage>('all')
  const [sortOption, setSortOption] = useState<SortOption>('newest')
  const [trendGranularity, setTrendGranularity] = useState<TrendGranularity>('monthly')
  const [currentPage, setCurrentPage] = useState(1)
  const [activeRecord, setActiveRecord] = useState<LayoffRecord | null>(null)
  const [tableSort, setTableSort] = useState<{ field: TableSortField; direction: SortDirection } | null>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light'
  }, [darkMode])

  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdated(new Date())
    }, 15000)
    return () => clearInterval(timer)
  }, [])

  const countryOptions = useMemo(() => {
    const countries = new Set(mockLayoffs.map((item) => item.location.country))
    return Array.from(countries).sort((a, b) => a.localeCompare(b))
  }, [])

  const filteredLayoffs = useMemo(() => {
    const searchLower = search.trim().toLowerCase()

    return mockLayoffs.filter((record) => {
      if (!record.source_url) {
        return false
      }

      if (
        searchLower &&
        !`${record.company} ${record.location.city} ${record.location.country} ${record.notes}`
          .toLowerCase()
          .includes(searchLower)
      ) {
        return false
      }

      if (selectedIndustries.length > 0 && !selectedIndustries.includes(record.industry)) {
        return false
      }

      if (selectedRegion !== 'all' && record.location.region !== selectedRegion) {
        return false
      }

      if (selectedCountry !== 'all' && record.location.country !== selectedCountry) {
        return false
      }

      if (selectedStage !== 'all' && record.stage !== selectedStage) {
        return false
      }

      if (fromDate && new Date(record.date) < new Date(fromDate)) {
        return false
      }

      if (toDate && new Date(record.date) > new Date(toDate)) {
        return false
      }

      return true
    })
  }, [fromDate, search, selectedCountry, selectedIndustries, selectedRegion, selectedStage, toDate])

  const sortedLayoffs = useMemo(() => {
    const copy = [...filteredLayoffs]

    if (tableSort) {
      copy.sort((a, b) => compareByTableField(a, b, tableSort.field, tableSort.direction))
      return copy
    }

    copy.sort((a, b) => compareBySortOption(a, b, sortOption))
    return copy
  }, [filteredLayoffs, sortOption, tableSort])

  const pageSize = 20
  const totalPages = Math.max(1, Math.ceil(sortedLayoffs.length / pageSize))

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1)
    }
  }, [currentPage, totalPages])

  const pagedLayoffs = useMemo(
    () => sortedLayoffs.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, sortedLayoffs],
  )

  const summary = useMemo(() => {
    const totalJobs = filteredLayoffs.reduce((sum, record) => sum + record.count, 0)
    const companies = new Set(filteredLayoffs.map((record) => record.company)).size
    const countries = new Set(filteredLayoffs.map((record) => record.location.country)).size

    const now = new Date()
    const thisMonth = monthKey(now)
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const previousMonth = monthKey(prevDate)

    const monthTotals = filteredLayoffs.reduce(
      (acc, record) => {
        const key = monthKey(new Date(record.date))
        acc[key] = (acc[key] ?? 0) + record.count
        return acc
      },
      {} as Record<string, number>,
    )

    const thisMonthTotal = monthTotals[thisMonth] ?? 0
    const prevMonthTotal = monthTotals[previousMonth] ?? 0

    const thisYear = now.getFullYear()
    const thisYearTotal = filteredLayoffs
      .filter((record) => new Date(record.date).getFullYear() === thisYear)
      .reduce((sum, record) => sum + record.count, 0)

    const monthChange = prevMonthTotal > 0 ? ((thisMonthTotal - prevMonthTotal) / prevMonthTotal) * 100 : 0

    return {
      totalJobs,
      companies,
      countries,
      thisMonthTotal,
      thisYearTotal,
      monthChange,
    }
  }, [filteredLayoffs])

  const trendData = useMemo(() => {
    const bucketMap = new Map<string, { key: string; jobs: number; companies: Record<string, number> }>()

    filteredLayoffs.forEach((record) => {
      const key = bucketLabel(record.date, trendGranularity)
      const existing = bucketMap.get(key) ?? { key, jobs: 0, companies: {} }
      existing.jobs += record.count
      existing.companies[record.company] = (existing.companies[record.company] ?? 0) + record.count
      bucketMap.set(key, existing)
    })

    return Array.from(bucketMap.values())
      .map((bucket) => ({
        label: bucket.key,
        jobs: bucket.jobs,
        topCompanies: Object.entries(bucket.companies)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name, count]) => `${name} (${formatNumber(count)})`),
      }))
      .sort((a, b) => {
        if (trendGranularity === 'yearly') {
          return Number(a.label) - Number(b.label)
        }

        if (trendGranularity === 'quarterly') {
          const [aQuarter, aYear] = a.label.split(' ')
          const [bQuarter, bYear] = b.label.split(' ')
          if (aYear !== bYear) {
            return Number(aYear) - Number(bYear)
          }
          return Number(aQuarter.slice(1)) - Number(bQuarter.slice(1))
        }

        return new Date(a.label).getTime() - new Date(b.label).getTime()
      })
  }, [filteredLayoffs, trendGranularity])

  const industryStats = useMemo(() => {
    const grouped = filteredLayoffs.reduce(
      (acc, record) => {
        const stats = acc[record.industry] ?? { industry: record.industry, jobs: 0, events: 0 }
        stats.jobs += record.count
        stats.events += 1
        acc[record.industry] = stats
        return acc
      },
      {} as Record<Industry, { industry: Industry; jobs: number; events: number }>,
    )

    return Object.values(grouped).sort((a, b) => b.jobs - a.jobs)
  }, [filteredLayoffs])

  const companyStats = useMemo(() => {
    const grouped = filteredLayoffs.reduce(
      (acc, record) => {
        const current = acc[record.company] ?? {
          company: record.company,
          industry: record.industry,
          jobs: 0,
        }
        current.jobs += record.count
        acc[record.company] = current
        return acc
      },
      {} as Record<string, { company: string; industry: Industry; jobs: number }>,
    )

    return Object.values(grouped)
      .sort((a, b) => b.jobs - a.jobs)
      .slice(0, 10)
  }, [filteredLayoffs])

  const countryTotals = useMemo(() => {
    return filteredLayoffs.reduce(
      (acc, record) => {
        acc[record.location.country] = (acc[record.location.country] ?? 0) + record.count
        return acc
      },
      {} as Record<string, number>,
    )
  }, [filteredLayoffs])

  const exportVisibleCsv = () => {
    const header = [
      'Company',
      'Industry',
      'City',
      'Country',
      'Region',
      'Date',
      'Jobs Cut',
      '% Workforce',
      'Stage',
      'Status',
      'Source',
      'Notes',
    ]

    const rows = pagedLayoffs.map((record) => [
      record.company,
      record.industry,
      record.location.city,
      record.location.country,
      record.location.region,
      record.date,
      `${record.count}`,
      `${record.percent_of_workforce}`,
      record.stage,
      record.status,
      record.source_url,
      record.notes,
    ])

    const csv = [header, ...rows]
      .map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'layoff-visible-data.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedIndustries([])
    setSelectedRegion('all')
    setSelectedCountry('all')
    setFromDate('')
    setToDate('')
    setSelectedStage('all')
    setSortOption('newest')
    setTableSort(null)
    setCurrentPage(1)
  }

  const statusStyle = (status: LayoffRecord['status']) => {
    if (status === 'Confirmed') {
      return 'text-[#27ae60]'
    }
    if (status === 'Rumored') {
      return 'text-[#f39c12]'
    }
    return 'text-[#888888]'
  }

  const onHeaderSort = (field: TableSortField) => {
    setTableSort((current) => {
      if (!current || current.field !== field) {
        return { field, direction: 'asc' }
      }

      if (current.direction === 'asc') {
        return { field, direction: 'desc' }
      }

      return null
    })
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-8 md:py-8">
        <header className="mb-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="Global Layoff Tracker" className="h-12 w-auto object-contain" />
              <div>
                <h1 className="font-serif text-2xl md:text-3xl text-[var(--color-text-primary)]">Global Layoff Tracker</h1>
                <p className="text-sm text-[var(--color-text-muted)]">Real-time data</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1 text-xs text-[var(--color-text-muted)]">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full" style={{ backgroundColor: 'var(--color-primary)' }} />
                Live · Updated {lastUpdated.toLocaleTimeString()}
              </div>
              <button
                type="button"
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-xs text-[var(--color-text-muted)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-text-primary)]"
                onClick={() => setDarkMode((value) => !value)}
              >
                {darkMode ? 'Switch to Light' : 'Switch to Dark'}
              </button>
            </div>
          </div>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Total Jobs Lost</p>
            <AnimatedValue value={summary.totalJobs} />
          </article>
          <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Companies Affected</p>
            <AnimatedValue value={summary.companies} />
          </article>
          <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">This Month</p>
            <AnimatedValue value={summary.thisMonthTotal} />
            <p className={`mt-2 text-xs ${summary.monthChange >= 0 ? 'text-[#f39c12]' : 'text-[#27ae60]'}`}>
              {summary.monthChange >= 0 ? '+' : ''}
              {summary.monthChange.toFixed(1)}% vs last month
            </p>
          </article>
          <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">This Year</p>
            <AnimatedValue value={summary.thisYearTotal} />
          </article>
          <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Countries Affected</p>
            <AnimatedValue value={summary.countries} />
          </article>
        </section>

        <section className="sticky top-2 z-30 mb-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/95 p-4 backdrop-blur">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-1 text-xs text-[var(--color-text-muted)]">
              Search
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Company, location, keyword"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[#e74c3c]"
              />
            </label>

            <details className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-xs text-[var(--color-text-muted)]">
              <summary className="cursor-pointer text-sm text-[var(--color-text-primary)]">
                Industry ({selectedIndustries.length || 'All'})
              </summary>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                {industries.map((industry) => (
                  <label key={industry} className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedIndustries.includes(industry)}
                      onChange={(event) => {
                        setSelectedIndustries((current) =>
                          event.target.checked
                            ? [...current, industry]
                            : current.filter((entry) => entry !== industry),
                        )
                      }}
                    />
                    {industry}
                  </label>
                ))}
              </div>
            </details>

            <label className="space-y-1 text-xs text-[var(--color-text-muted)]">
              Country / Region
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedRegion}
                  onChange={(event) => setSelectedRegion(event.target.value as Region | 'all')}
                  className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-2 text-sm text-[var(--color-text-primary)]"
                >
                  <option value="all">All Regions</option>
                  <option value="North America">North America</option>
                  <option value="Europe">Europe</option>
                  <option value="Asia">Asia</option>
                  <option value="Other">Other</option>
                </select>
                <select
                  value={selectedCountry}
                  onChange={(event) => setSelectedCountry(event.target.value)}
                  className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-2 text-sm text-[var(--color-text-primary)]"
                >
                  <option value="all">All Countries</option>
                  {countryOptions.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <label className="space-y-1 text-xs text-[var(--color-text-muted)]">
              Date Range
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                  className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-2 text-sm text-[var(--color-text-primary)]"
                />
                <input
                  type="date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                  className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-2 text-sm text-[var(--color-text-primary)]"
                />
              </div>
            </label>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="space-y-1 text-xs text-[var(--color-text-muted)]">
              Stage
              <select
                value={selectedStage}
                onChange={(event) => setSelectedStage(event.target.value as Stage | 'all')}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-2 text-sm text-[var(--color-text-primary)]"
              >
                <option value="all">All Stages</option>
                {stages.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-xs text-[var(--color-text-muted)]">
              Sort
              <select
                value={sortOption}
                onChange={(event) => {
                  setSortOption(event.target.value as SortOption)
                  setTableSort(null)
                }}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-2 text-sm text-[var(--color-text-primary)]"
              >
                <option value="newest">Newest</option>
                <option value="most-affected">Most Affected</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </label>

            <button
              type="button"
              onClick={clearFilters}
              className="self-end rounded-lg border border-[#3f1f1f] bg-[#2a0f0f] px-3 py-2 text-sm text-[#f0f0f0] transition hover:bg-[#3a1515]"
            >
              Clear filters
            </button>
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-2xl">Layoff Trend</h2>
            <div className="inline-flex rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-1 text-xs">
              {(['monthly', 'quarterly', 'yearly'] as TrendGranularity[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`rounded-md px-3 py-1 capitalize transition ${
                    trendGranularity === item ? 'bg-[#c0392b] text-white' : 'text-[var(--color-text-muted)]'
                  }`}
                  onClick={() => setTrendGranularity(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer>
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid stroke="#252525" strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke="#888888" tick={{ fontSize: 12 }} />
                <YAxis stroke="#888888" tickFormatter={(value) => formatNumber(value)} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: 12 }}
                  formatter={(value) => [`${formatNumber(Number(value))} jobs`, 'Layoffs']}
                  labelFormatter={(label, payload) => {
                    const data = payload?.[0]?.payload as { topCompanies?: string[] } | undefined
                    const companies = data?.topCompanies?.join(' · ') ?? 'No company breakout available'
                    return `${label} | Top: ${companies}`
                  }}
                />
                <Bar dataKey="jobs" radius={[8, 8, 0, 0]} animationDuration={800}>
                  {trendData.map((entry, index) => {
                    const intensity = entry.jobs / Math.max(1, summary.totalJobs)
                    const paletteIndex = Math.min(redPalette.length - 1, Math.floor(intensity * redPalette.length * 2))
                    return <Cell key={`${entry.label}-${index}`} fill={redPalette[paletteIndex]} />
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-6">
            <h3 className="mb-4 font-serif text-xl">Industry Breakdown</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={industryStats}
                    dataKey="jobs"
                    nameKey="industry"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={110}
                    paddingAngle={2}
                  >
                    {industryStats.map((entry) => (
                      <Cell key={entry.industry} fill={industryColor[entry.industry]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: 12 }}
                    formatter={(value) => `${formatNumber(Number(value))} jobs`}
                  />
                  <Legend
                    formatter={(value, _, index) => {
                      const entry = industryStats[index]
                      if (!entry) {
                        return value
                      }
                      const pct = summary.totalJobs > 0 ? (entry.jobs / summary.totalJobs) * 100 : 0
                      return `${value} · ${formatNumber(entry.jobs)} (${pct.toFixed(1)}%)`
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-6">
            <h3 className="mb-4 font-serif text-xl">Top 10 Companies</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer>
                <BarChart layout="vertical" data={companyStats} margin={{ top: 8, right: 16, left: 24, bottom: 8 }}>
                  <CartesianGrid stroke="#252525" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#888888" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="company" width={130} stroke="#888888" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: 12 }}
                    formatter={(value) => `${formatNumber(Number(value))} jobs`}
                  />
                  <Bar dataKey="jobs" radius={[0, 8, 8, 0]} animationDuration={900}>
                    {companyStats.map((entry) => (
                      <Cell key={entry.company} fill={industryColor[entry.industry]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
        </section>

        <section className="mb-8">
          <WorldMap
            countryTotals={countryTotals}
            onCountryClick={(country) => {
              const normalizedClicked = normalize(country)
              const mapped = countryAliasMap[normalizedClicked] ?? normalizedClicked
              const match = countryOptions.find((entry) => {
                const normalizedOption = normalize(entry)
                return normalizedOption === mapped || countryAliasMap[normalizedOption] === mapped
              })
              if (match) {
                setSelectedCountry(match)
                setCurrentPage(1)
              }
            }}
          />
        </section>

        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-serif text-2xl">Layoff Events</h3>
            <button
              type="button"
              onClick={exportVisibleCsv}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-text-primary)] transition hover:border-[#e74c3c]"
            >
              Export visible data (CSV)
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-xs uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  {[
                    ['Company', 'company'],
                    ['Industry', 'industry'],
                    ['Location', 'location'],
                    ['Date', 'date'],
                    ['Jobs Cut', 'count'],
                    ['% Workforce', 'percent_of_workforce'],
                    ['Stage', 'stage'],
                    ['Status', 'status'],
                  ].map(([label, field]) => {
                    const sortField = field as TableSortField
                    const isActive = tableSort?.field === sortField
                    const arrow = isActive ? (tableSort?.direction === 'asc' ? ' ▲' : ' ▼') : ''
                    return (
                      <th key={label} className="px-2 py-3">
                        <button
                          type="button"
                          className="font-medium transition hover:text-[#f0f0f0]"
                          onClick={() => onHeaderSort(sortField)}
                        >
                          {label}
                          {arrow}
                        </button>
                      </th>
                    )
                  })}
                  <th className="px-2 py-3">Source</th>
                </tr>
              </thead>
              <tbody>
                {pagedLayoffs.map((record, index) => {
                  const rowHighlight =
                    record.count > 10000
                      ? 'bg-[#3a0d0a]'
                      : record.count > 1000
                        ? 'bg-[#332312]'
                        : 'bg-transparent'

                  return (
                    <tr
                      key={record.id}
                      className={`cursor-pointer border-b border-[var(--color-border)] ${rowHighlight} opacity-0 animate-[fade-row_280ms_ease_forwards]`}
                      style={{ animationDelay: `${index * 24}ms` }}
                      onClick={() => setActiveRecord(record)}
                    >
                      <td className="px-2 py-3 font-medium text-[#f0f0f0]">{record.company}</td>
                      <td className="px-2 py-3">{record.industry}</td>
                      <td className="px-2 py-3">{record.location.city}, {record.location.country}</td>
                      <td className="px-2 py-3">{record.date}</td>
                      <td className="px-2 py-3 font-mono">{formatNumber(record.count)}</td>
                      <td className="px-2 py-3 font-mono">{formatPct(record.percent_of_workforce)}</td>
                      <td className="px-2 py-3">{record.stage}</td>
                      <td className={`px-2 py-3 ${statusStyle(record.status)}`}>{record.status}</td>
                      <td className="px-2 py-3">
                        <a
                          href={record.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#e74c3c] hover:text-[#f0f0f0]"
                          onClick={(event) => event.stopPropagation()}
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-text-muted)]">
            <span>
              Showing {pagedLayoffs.length} of {sortedLayoffs.length} records
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`rounded-md border px-2 py-1 ${
                    currentPage === page
                      ? 'border-[#e74c3c] bg-[#c0392b] text-white'
                      : 'border-[var(--color-border)] bg-[var(--color-card)]'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      {activeRecord ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4" onClick={() => setActiveRecord(null)}>
          <div
            className="w-full max-w-2xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h4 className="font-serif text-2xl">{activeRecord.company}</h4>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {activeRecord.location.city}, {activeRecord.location.country}
                </p>
              </div>
              <button type="button" onClick={() => setActiveRecord(null)} className="text-sm text-[var(--color-text-muted)]">
                Close
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3">
                <p className="text-xs text-[var(--color-text-muted)]">Jobs cut</p>
                <p className="font-mono text-lg">{formatNumber(activeRecord.count)}</p>
              </div>
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3">
                <p className="text-xs text-[var(--color-text-muted)]">% Workforce</p>
                <p className="font-mono text-lg">{formatPct(activeRecord.percent_of_workforce)}</p>
              </div>
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3">
                <p className="text-xs text-[var(--color-text-muted)]">Industry</p>
                <p>{activeRecord.industry}</p>
              </div>
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3">
                <p className="text-xs text-[var(--color-text-muted)]">Stage</p>
                <p>{activeRecord.stage}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-[var(--color-text-muted)]">{activeRecord.notes}</p>
            <a
              className="mt-4 inline-flex rounded-lg border border-[#3f1f1f] bg-[#2a0f0f] px-3 py-2 text-sm text-[#f0f0f0] hover:bg-[#3a1515]"
              href={activeRecord.source_url}
              target="_blank"
              rel="noreferrer"
            >
              Open Source
            </a>
          </div>
        </div>
      ) : null}
    </main>
  )
}

export default DashboardPage
