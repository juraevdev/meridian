import { motion } from 'framer-motion'
import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../store'
import { GhostButton, PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { DomainFormModal } from '../components/EntityForms'
import type { Domain } from '../types'

export function DomainsPage() {
  const { domains, projectName, removeDomain, ready, projects } = useStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Domain | null>(null)

  if (!ready) return null

  return (
    <div>
      <PageHeader
        index="004 / Domains"
        title="DNS & SSL"
        description="Registrars, certificates, expiry."
        action={
          <GhostButton
            onClick={() => {
              setEditing(null)
              setOpen(true)
            }}
            disabled={projects.length === 0}
          >
            New domain →
          </GhostButton>
        }
      />

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
              transition={{ delay: i * 0.05 }}
              className="grid gap-6 px-5 py-6 md:grid-cols-[auto_1.4fr_1fr_auto] md:items-center"
            >
              <span className="font-display text-2xl font-semibold tracking-[-0.04em] text-dim">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <p className="font-display text-xl font-semibold tracking-[-0.03em]">
                  {domain.name}
                </p>
                <p className="mt-2 text-sm text-mute">{projectName(domain.projectId)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-dim">Registrar</p>
                  <p className="mt-1 text-bone">{domain.registrar}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-dim">Expires</p>
                  <p className="mt-1 text-bone">{domain.expiresAt}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-dim">SSL</p>
                  <p className="mt-1 capitalize text-bone">{domain.ssl}</p>
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
