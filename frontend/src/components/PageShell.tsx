import { Link, NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/trends', label: 'Trends' },
  { to: '/alerts', label: 'Alerts' },
  { to: '/admin', label: 'Admin' },
]

const activeClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-full px-4 py-2 text-sm transition',
    isActive
      ? 'bg-[var(--color-primary)] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.05)]'
      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]',
  ].join(' ')

export default function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <header className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.svg" alt="Global Layoff Tracker" className="h-12 w-auto" />
              <div>
                <h1 className="font-serif text-2xl text-[var(--color-text-primary)] md:text-3xl">{title}</h1>
                <p className="text-sm text-[var(--color-text-muted)]">{subtitle}</p>
              </div>
            </Link>
            <nav className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={activeClass}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>
        {children}
      </div>
    </main>
  )
}
