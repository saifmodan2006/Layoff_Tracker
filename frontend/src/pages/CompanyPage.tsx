import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { mockLayoffs } from '../data/mockLayoffs'
import PageShell from '../components/PageShell'
import { companySlug, findCompany, formatNumber, formatPct, groupedByCompany, normalize } from '../lib/analytics'

export default function CompanyPage() {
  const { name } = useParams()
  const records = useMemo(() => {
    const slug = decodeURIComponent(name ?? '')
    const exact = findCompany(mockLayoffs, slug)
    if (exact.length > 0) {
      return exact
    }

    return mockLayoffs.filter((record) => companySlug(record.company) === normalize(slug))
  }, [name])
  const company = records[0]?.company ?? 'Unknown Company'
  const summary = groupedByCompany(records)[company]
  const chartData = records
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((record) => ({ date: record.date, jobs: record.count }))

  return (
    <PageShell title={company} subtitle="Company history, event timeline, and related companies">
      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-[var(--color-text-muted)]">Company detail</p>
              <h2 className="font-serif text-3xl">{company}</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {summary?.city}, {summary?.country} · {summary?.industry}
              </p>
            </div>
            <Link
              to={`/company/${companySlug(company)}`}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm"
            >
              Permalink
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Total laid off</p>
              <p className="mt-2 font-mono text-3xl">{formatNumber(summary?.totalJobs ?? 0)}</p>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Layoff events</p>
              <p className="mt-2 font-mono text-3xl">{summary?.events ?? 0}</p>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Largest cut</p>
              <p className="mt-2 font-mono text-3xl">{formatNumber(summary?.largestCut ?? 0)}</p>
            </div>
          </div>

          <div className="mt-6 h-80">
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ left: 8, right: 12, top: 10, bottom: 10 }}>
                <CartesianGrid stroke="#2a2a2a" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis stroke="#888" tickFormatter={(value) => formatNumber(value)} />
                <Tooltip contentStyle={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 12 }} />
                <Line type="monotone" dataKey="jobs" stroke="#e74c3c" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <aside className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="font-serif text-2xl">Related companies</h3>
          <div className="mt-4 space-y-3">
            {Object.values(groupedByCompany(mockLayoffs))
              .filter((item) => item.company !== company && item.industry === summary?.industry)
              .slice(0, 5)
              .map((item) => (
                <div key={item.company} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                  <p className="font-medium">{item.company}</p>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {formatNumber(item.totalJobs)} jobs · {item.events} events · {formatPct((item.largestCut / Math.max(1, item.totalJobs)) * 100)} max cut share
                  </p>
                </div>
              ))}
          </div>
        </aside>
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h3 className="font-serif text-2xl">Layoff events</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
                <th className="px-2 py-3">Date</th>
                <th className="px-2 py-3">Jobs cut</th>
                <th className="px-2 py-3">% Workforce</th>
                <th className="px-2 py-3">Stage</th>
                <th className="px-2 py-3">Source</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b border-[var(--color-border)]">
                  <td className="px-2 py-3">{record.date}</td>
                  <td className="px-2 py-3 font-mono">{formatNumber(record.count)}</td>
                  <td className="px-2 py-3 font-mono">{formatPct(record.percent_of_workforce)}</td>
                  <td className="px-2 py-3">{record.stage}</td>
                  <td className="px-2 py-3">
                    <a className="text-[#e74c3c]" href={record.source_url} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PageShell>
  )
}
