import { useState } from 'react'
import PageShell from '../components/PageShell'
import { stages } from '../lib/analytics'

export default function AdminPage() {
  const [message, setMessage] = useState('')

  return (
    <PageShell title="Admin Panel" subtitle="Manual import, scraping control, and moderation tools">
      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="font-serif text-2xl">Manual add layoff event</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {['Company', 'City', 'Country', 'Jobs cut', '% Workforce'].map((item) => (
              <input key={item} placeholder={item} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-[var(--color-text-primary)]" />
            ))}
            <select className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-[var(--color-text-primary)]">
              {stages.map((stage) => <option key={stage}>{stage}</option>)}
            </select>
            <select className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-[var(--color-text-primary)]">
              {['Confirmed', 'Rumored', 'Denied'].map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>
        </article>

        <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="font-serif text-2xl">Scraper controls</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {['Run layoffs.fyi scrape', 'Run WARN scrape', 'Run RSS scrape', 'Sync alerts'].map((item) => (
              <button key={item} type="button" className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-left">
                {item}
              </button>
            ))}
          </div>
          <textarea
            className="mt-4 h-32 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3 text-sm text-[var(--color-text-primary)]"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Scraper logs will appear here"
          />
        </article>
      </section>
    </PageShell>
  )
}
