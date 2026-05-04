import { useState } from 'react'
import PageShell from '../components/PageShell'
import { industries } from '../lib/analytics'

export default function AlertsPage() {
  const [saved, setSaved] = useState(false)

  return (
    <PageShell title="Alert Setup" subtitle="Subscribe to new layoff events and digest notifications">
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm text-[var(--color-text-muted)]">
              Email address
              <input className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-[var(--color-text-primary)]" placeholder="name@company.com" />
            </label>
            <label className="space-y-1 text-sm text-[var(--color-text-muted)]">
              Company
              <input className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-[var(--color-text-primary)]" placeholder="Optional company filter" />
            </label>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-[var(--color-text-muted)]">
              Alert triggers
              <div className="space-y-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3">
                {['Any new event', 'Company match', 'Industry match', 'Country match', '> N jobs'].map((item) => (
                  <label key={item} className="flex items-center gap-2 text-[var(--color-text-primary)]">
                    <input type="checkbox" /> {item}
                  </label>
                ))}
              </div>
            </label>
            <div className="space-y-3">
              <label className="space-y-1 text-sm text-[var(--color-text-muted)]">
                Frequency
                <select className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-[var(--color-text-primary)]">
                  <option>Instant</option>
                  <option>Daily digest</option>
                  <option>Weekly digest</option>
                </select>
              </label>
              <label className="space-y-1 text-sm text-[var(--color-text-muted)]">
                Minimum jobs
                <input type="range" min="100" max="50000" defaultValue="1000" className="w-full" />
              </label>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSaved(true)}
            className="mt-6 rounded-lg bg-[var(--color-primary)] px-4 py-2 font-medium text-white"
          >
            Save alert
          </button>
          {saved ? <p className="mt-3 text-sm text-[var(--color-success)]">Confirmation email queued.</p> : null}
        </article>

        <aside className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="font-serif text-2xl">Popular industries</h3>
          <div className="mt-4 space-y-3">
            {industries.map((industry) => (
              <div key={industry} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 flex items-center justify-between">
                <span>{industry}</span>
                <input type="checkbox" />
              </div>
            ))}
          </div>
        </aside>
      </section>
    </PageShell>
  )
}
