import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store'

const nav = [
  { to: '/', label: 'Overview', index: '01', end: true },
  { to: '/projects', label: 'Projects', index: '02' },
  { to: '/applications', label: 'Apps', index: '03' },
  { to: '/domains', label: 'Domains', index: '04' },
  { to: '/servers', label: 'Servers', index: '05' },
  { to: '/containers', label: 'Containers', index: '06' },
  { to: '/bots', label: 'Bots', index: '07' },
  { to: '/integrations', label: 'Integrations', index: '08' },
]

function Clock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tashkent',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now)

  return <span className="tabular-nums">TAS {time}</span>
}

export function Shell() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const { fleetStats } = useStore()

  return (
    <div className="dot-grid min-h-screen bg-void text-bone">
      <div className="pointer-events-none fixed inset-3 z-50 border border-bone/15 md:inset-4" />

      <header className="sticky top-0 z-40 border-b border-line bg-cream text-void">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex min-w-0 items-baseline gap-3">
            <NavLink to="/" className="font-display text-sm font-semibold tracking-tight">
              Meridian
            </NavLink>
            <span className="hidden font-serif text-sm italic text-void/55 sm:inline">
              Control plane
            </span>
          </div>

          <div className="flex items-center gap-4 text-[10px] font-medium uppercase tracking-[0.2em] text-void/55">
            <span className="hidden md:inline">
              {String(fleetStats.attention).padStart(2, '0')} alerts
            </span>
            <span className="hidden sm:inline">
              <Clock />
            </span>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 text-void transition hover:opacity-70"
              aria-label="Menu"
            >
              Menu
              <Menu className="size-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      <div className="relative mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-[1440px]">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-[240px] shrink-0 flex-col border-r border-line px-5 py-8 lg:flex">
          <p className="mb-6 text-[10px] uppercase tracking-[0.28em] text-mute">
            000 / Navigation
          </p>
          <nav className="flex flex-1 flex-col gap-1">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `group flex items-center justify-between border-b border-transparent py-3 text-sm transition ${
                    isActive
                      ? 'border-bone/20 text-bone'
                      : 'text-mute hover:text-bone'
                  }`
                }
              >
                <span>{item.label}</span>
                <span className="text-[10px] tracking-[0.2em] text-dim group-hover:text-mute">
                  {item.index}
                </span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-8 border border-line p-4">
            <p className="text-[10px] uppercase tracking-[0.24em] text-mute">Fleet</p>
            <p className="mt-3 font-display text-2xl font-semibold tracking-[-0.04em]">
              {fleetStats.servers}
              <span className="text-mute"> srv · {fleetStats.containers} ctr</span>
            </p>
            <p className="mt-2 font-serif text-sm italic text-mute">
              {fleetStats.bots} bots · {fleetStats.attention} alerts
            </p>
          </div>
        </aside>

        <main className="scroll-thin relative min-w-0 flex-1 overflow-auto px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <Outlet key={location.pathname} />
        </main>
      </div>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              aria-label="Close"
              className="fixed inset-0 z-[60] bg-void/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ y: '-100%' }}
              animate={{ y: 0 }}
              exit={{ y: '-100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 34 }}
              className="fixed inset-x-0 top-0 z-[70] border-b border-void/10 bg-cream text-void"
            >
              <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-4 md:px-6">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-sm font-semibold">Meridian</span>
                  <span className="font-serif text-sm italic text-void/55">
                    Technology & software
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em]"
                >
                  Close
                  <X className="size-4" strokeWidth={1.5} />
                </button>
              </div>
              <nav className="mx-auto max-w-[1440px] px-4 pb-10 pt-4 md:px-6">
                {nav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between border-b border-void/10 py-4"
                  >
                    <span className="font-display text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
                      {item.label}
                    </span>
                    <span className="text-sm text-void/40">{item.index}</span>
                  </NavLink>
                ))}
              </nav>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
