import { useMemo } from 'react'
import { Area, AreaChart, Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import PageShell from '../components/PageShell'
import { mockLayoffs } from '../data/mockLayoffs'
import {
  bucketLabel,
  formatNumber,
  heatmapDays,
  industryColors,
  industryStats,
  monthlyStats,
  stages,
} from '../lib/analytics'

export default function TrendsPage() {
  const monthSeries = useMemo(() => monthlyStats(mockLayoffs), [])
  const industries = useMemo(() => industryStats(mockLayoffs), [])
  const heatmap = useMemo(() => heatmapDays(mockLayoffs), [])
  const stageSeries = useMemo(() => {
    return monthSeries.map((entry) => {
      const date = new Date(`${entry.month}-01`)
      const bucket = bucketLabel(date.toISOString(), 'monthly')
      const parts = stages.reduce(
        (acc, stage, index) => {
          acc[stage] = Math.round(entry.jobs * (0.18 + index * 0.08))
          return acc
        },
        {} as Record<(typeof stages)[number], number>,
      )
      return { month: bucket, ...parts }
    })
  }, [monthSeries])

  return (
    <PageShell title="Trends & Analytics" subtitle="Heatmaps, surge detection, industry races, and stage distribution">
      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="font-serif text-2xl">Heatmap calendar</h3>
          <div className="mt-4 grid gap-1 overflow-x-auto pb-2" style={{ gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }}>
            {heatmap.map((day) => {
              const opacity = Math.min(1, day.jobs / 5000)
              return (
                <div
                  key={day.date}
                  title={`${day.date}: ${formatNumber(day.jobs)} jobs`}
                  className="h-6 w-6 rounded-sm"
                  style={{ backgroundColor: `rgba(231, 76, 60, ${0.15 + opacity * 0.85})` }}
                />
              )
            })}
          </div>
        </article>

        <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="font-serif text-2xl">Layoff wave detector</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <AreaChart data={monthSeries} margin={{ left: 8, right: 12, top: 10, bottom: 10 }}>
                <XAxis dataKey="month" stroke="#888" />
                <YAxis stroke="#888" tickFormatter={(value) => formatNumber(value)} />
                <Tooltip contentStyle={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 12 }} />
                <Area type="monotone" dataKey="jobs" stroke="#e74c3c" fill="#e74c3c" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="font-serif text-2xl">Industry race chart</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <BarChart data={industries} layout="vertical" margin={{ left: 24, right: 12 }}>
                <XAxis type="number" stroke="#888" tickFormatter={(value) => formatNumber(value)} />
                <YAxis type="category" dataKey="industry" stroke="#888" width={100} />
                <Tooltip contentStyle={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 12 }} />
                <Bar dataKey="jobs" radius={[0, 10, 10, 0]}>
                  {industries.map((entry) => (
                    <Cell key={entry.industry} fill={industryColors[entry.industry]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="font-serif text-2xl">Stage distribution over time</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <BarChart data={stageSeries} margin={{ left: 8, right: 12, top: 10, bottom: 10 }}>
                <XAxis dataKey="month" stroke="#888" />
                <YAxis stroke="#888" tickFormatter={(value) => formatNumber(value)} />
                <Tooltip contentStyle={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 12 }} />
                {stages.map((stage, index) => (
                  <Bar key={stage} dataKey={stage} stackId="stage" fill={['#c0392b', '#e67e22', '#f39c12', '#d35400', '#9b3326', '#7f8c8d'][index]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h3 className="font-serif text-2xl">Geographic flow</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            ['North America', 'Tech', 14800],
            ['Europe', 'Finance', 9200],
            ['Asia', 'Automotive', 6900],
          ].map(([region, industry, jobs]) => (
            <div key={`${region}-${industry}`} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
              <p className="text-sm text-[var(--color-text-muted)]">{region}</p>
              <p className="font-serif text-xl">{industry}</p>
              <p className="mt-2 font-mono text-3xl">{formatNumber(Number(jobs))}</p>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  )
}
