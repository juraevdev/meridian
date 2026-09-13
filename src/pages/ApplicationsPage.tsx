import { motion } from 'framer-motion'
import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../store'
import { GhostButton, PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { ApplicationFormModal } from '../components/EntityForms'
import type { Application } from '../types'

const typeLabel = {
  web: 'Web',
  api: 'API',
  worker: 'Worker',
  mobile: 'Mobile',
}

export function ApplicationsPage() {
  const { applications, projectName, removeApplication, ready, projects } = useStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Application | null>(null)

  if (!ready) return null

  return (
    <div>
      <PageHeader
        index="003 / Applications"
        title="Runtime"
        description="Deployed services — haqiqiy ma’lumotlaringiz."
        action={
          <GhostButton
            onClick={() => {
              setEditing(null)
              setOpen(true)
            }}
            disabled={projects.length === 0}
          >
            New app →
          </GhostButton>
        }
      />

      {applications.length === 0 ? (
        <div className="border border-dashed border-line-strong px-6 py-14 text-center text-sm text-mute">
          Hali ilova yo‘q. Avval loyiha, keyin ilova qo‘shing.
        </div>
      ) : (
        <div className="border border-line">
          <div className="hidden grid-cols-[1.5fr_1fr_0.7fr_0.7fr_0.7fr_auto] gap-3 border-b border-line px-5 py-3 text-[10px] font-medium uppercase tracking-[0.2em] text-mute md:grid">
            <span>App</span>
            <span>Project</span>
            <span>Type</span>
            <span>Version</span>
            <span>Latency</span>
            <span>Actions</span>
          </div>
          <ul className="divide-y divide-line">
            {applications.map((app, i) => (
              <motion.li
                key={app.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="grid gap-2 px-5 py-4 md:grid-cols-[1.5fr_1fr_0.7fr_0.7fr_0.7fr_auto] md:items-center md:gap-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-bone">{app.name}</p>
                  {app.url ? (
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block truncate text-xs text-mute transition hover:text-bone"
                    >
                      {app.url.replace('https://', '')}
                    </a>
                  ) : (
                    <p className="mt-1 text-xs text-dim">Internal</p>
                  )}
                </div>
                <p className="text-sm text-mute">{projectName(app.projectId)}</p>
                <p className="text-sm text-mute">{typeLabel[app.type]}</p>
                <p className="font-mono text-sm text-bone">v{app.version}</p>
                <p className="text-sm text-bone">
                  {app.latencyMs ? `${app.latencyMs} ms` : '—'}
                </p>
                <div className="flex items-center gap-2">
                  <StatusBadge status={app.status} />
                  <button
                    type="button"
                    aria-label="Edit"
                    onClick={() => {
                      setEditing(app)
                      setOpen(true)
                    }}
                    className="grid size-8 place-items-center border border-line text-mute hover:text-bone"
                  >
                    <Pencil className="size-3.5" strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete"
                    onClick={() => removeApplication(app.id)}
                    className="grid size-8 place-items-center border border-line text-mute hover:text-bone"
                  >
                    <Trash2 className="size-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      )}

      <ApplicationFormModal
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
