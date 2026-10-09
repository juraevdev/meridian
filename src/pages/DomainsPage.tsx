import { motion } from 'framer-motion'
import { Pencil, RefreshCw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../store'
import { GhostButton, PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { DomainFormModal } from '../components/EntityForms'
import { daysUntil } from '../domainCheck'
import type { Domain } from '../types'

const sslLabel: Record<Domain['ssl'], string> = {
  valid: 'Valid',
  expiring: 'Expiring',
  invalid: 'Invalid',
  none: 'No HTTPS',
}

function DaysLeft({ date, warnDays }: { date?: string; warnDays: number }) {
  const days = daysUntil(date)
  if (days === null) return null
  const tone = days < 0 ? 'text-bone' : days <= warnDays ? 'text-bone' : 'text-dim'
  return (
    <span className={`mt-1 block text-[11px] ${tone}`}>
      {days < 0 ? `expired ${-days}d ago` : `${days} days left`}
    </span>
  )
}

function formatCheckedAt(domains: Domain[]) {
  const times = domains.map((d) => (d.checkedAt ? Date.parse(d.checkedAt) : NaN)).filter((t) => !Number.isNaN(t))
  if (times.length === 0) return null
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tashkent',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(Math.min(...times))
}

export function DomainsPage() {
  const { domains, projectName, removeDomain, ready, projects, domainSync, syncDomains } =
    useStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Domain | null>(null)

  if (!ready) return null

  const checkedAt = formatCheckedAt(domains)

  return (
    <div>
      <PageHeader
        index="004 / Domains"
        title="DNS & SSL"
        description="Registrars, certificates, expiry — WHOIS va SSL kuniga bir marta avtomatik tekshiriladi."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <GhostButton
              onClick={() => void syncDomains(true)}
              disabled={domainSync.syncing || domains.length === 0}
            >
              <RefreshCw
                className={`size-3 ${domainSync.syncing ? 'animate-spin' : ''}`}
                strokeWidth={1.5}
              />
              {domainSync.syncing ? 'Checking…' : 'Refresh'}
            </GhostButton>
            <GhostButton
              onClick={() => {
                setEditing(null)
                setOpen(true)
              }}
              disabled={projects.length === 0}
            >
              New domain →
            </GhostButton>
          </div>
        }
      />

      <div className="-mt-6 mb-6 text-[11px] uppercase tracking-[0.16em] text-dim">
        {domainSync.error ? (
          <span className="text-bone">Tekshiruv xizmati javob bermadi: {domainSync.error}</span>
        ) : checkedAt ? (
          <span>Last checked {checkedAt}</span>
        ) : (
          <span>Not checked yet</span>
        )}
      </div>

      {domains.length === 0 ? (
        <div className="border border-dashed border-line-strong px-6 py-14 text-center text-sm text-mute">
          Domain qo‘shilmagan.
        </div>
      ) : (
        <div className="divide-y divide-line border border-line">
          {domains.map((domain, i) => (
            <motion.article
              key={domain.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.4) }}
              className="grid gap-6 px-5 py-6 md:grid-cols-[auto_1.2fr_1.4fr_auto] md:items-center"
            >
              <span className="font-display text-2xl font-semibold tracking-[-0.04em] text-dim">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0">
                <p className="font-display text-xl font-semibold tracking-[-0.03em]">
                  {domain.name}
                </p>
                <p className="mt-2 text-sm text-mute">{projectName(domain.projectId)}</p>
                {domain.checkError ? (
                  <p className="mt-2 text-xs text-dim">{domain.checkError}</p>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm sm:grid-cols-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-dim">Registrar</p>
                  <p className="mt-1 break-words text-bone">{domain.registrar || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-dim">Domain expires</p>
                  <p className="mt-1 text-bone">{domain.expiresAt || '—'}</p>
                  <DaysLeft date={domain.expiresAt} warnDays={30} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-dim">SSL</p>
                  <p className="mt-1 text-bone">{sslLabel[domain.ssl] ?? domain.ssl}</p>
                  {domain.sslExpiresAt ? (
                    <>
                      <span className="mt-1 block text-[11px] text-mute">{domain.sslExpiresAt}</span>
                      <DaysLeft date={domain.sslExpiresAt} warnDays={14} />
                    </>
                  ) : null}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-dim">DNS</p>
                  <p className="mt-1 uppercase text-bone">{domain.dns}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={domain.status} />
                <button
                  type="button"
                  aria-label="Edit"
                  onClick={() => {
                    setEditing(domain)
                    setOpen(true)
                  }}
                  className="grid size-8 place-items-center border border-line text-mute hover:text-bone"
                >
                  <Pencil className="size-3.5" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  aria-label="Delete"
                  onClick={() => removeDomain(domain.id)}
                  className="grid size-8 place-items-center border border-line text-mute hover:text-bone"
                >
                  <Trash2 className="size-3.5" strokeWidth={1.5} />
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      )}

      <DomainFormModal
        open={open}
        initial={editing}
        onClose={() => {
          setOpen(false)
          setEditing(null)
        }}
      />
    </div>
  )
}
