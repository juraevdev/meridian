import { motion } from 'framer-motion'
import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../store'
import { GhostButton, PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { IntegrationFormModal } from '../components/EntityForms'
import type { Integration } from '../types'

export function IntegrationsPage() {
  const { integrations, projectName, removeIntegration, ready, projects } = useStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Integration | null>(null)

  if (!ready) return null

  return (
    <div>
      <PageHeader
        index="006 / Integrations"
        title="Connected stack"
        description="Git, payments, analytics, auth — loyihaga biriktirilgan."
        action={
          <GhostButton
            onClick={() => {
              setEditing(null)
              setOpen(true)
            }}
            disabled={projects.length === 0}
          >
            New integration →
          </GhostButton>
        }
      />

      {integrations.length === 0 ? (
        <div className="border border-dashed border-line-strong px-6 py-14 text-center text-sm text-mute">
          Integratsiya qo‘shilmagan.
        </div>
      ) : (
        <div className="divide-y divide-line border border-line">
          {integrations.map((item, i) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="grid gap-4 px-5 py-5 sm:grid-cols-[auto_1fr_auto_auto] sm:items-center"
            >
              <span className="font-display text-2xl font-semibold tracking-[-0.04em] text-dim">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="font-display text-xl font-semibold tracking-[-0.03em]">
                  {item.name}
                </h3>
                <p className="mt-1 text-sm capitalize text-mute">
                  {item.category} · {projectName(item.projectId)}
                </p>
              </div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-dim">
                since {item.connectedAt}
              </p>
              <div className="flex items-center gap-2">
                <StatusBadge status={item.status} />
                <button
                  type="button"
                  aria-label="Edit"
                  onClick={() => {
                    setEditing(item)
                    setOpen(true)
                  }}
                  className="grid size-8 place-items-center border border-line text-mute hover:text-bone"
                >
                  <Pencil className="size-3.5" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  aria-label="Delete"
                  onClick={() => removeIntegration(item.id)}
                  className="grid size-8 place-items-center border border-line text-mute hover:text-bone"
                >
                  <Trash2 className="size-3.5" strokeWidth={1.5} />
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      )}

      <IntegrationFormModal
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
