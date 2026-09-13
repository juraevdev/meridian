import { motion } from 'framer-motion'
import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../store'
import { GhostButton, PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { ServerFormModal } from '../components/EntityForms'
import type { Server } from '../types'

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-[10px] font-medium uppercase tracking-[0.18em] text-mute">
        <span>{label}</span>
        <span className="text-bone">{value}%</span>
      </div>
      <div className="h-px bg-line">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="h-px bg-bone"
        />
      </div>
    </div>
  )
}

export function ServersPage() {
  const { servers, projectName, removeServer, ready, projects } = useStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Server | null>(null)

  if (!ready) return null

  return (
    <div>
      <PageHeader
        index="005 / Servers"
        title="Compute"
        description="Provider, region, resources, uptime."
        action={
          <GhostButton
            onClick={() => {
              setEditing(null)
              setOpen(true)
            }}
            disabled={projects.length === 0}
          >
            New server →
          </GhostButton>
        }
      />

      {servers.length === 0 ? (
        <div className="border border-dashed border-line-strong px-6 py-14 text-center text-sm text-mute">
          Server qo‘shilmagan.
        </div>
      ) : (
        <div className="grid gap-px bg-line lg:grid-cols-2">
          {servers.map((server, i) => (
            <motion.article
              key={server.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-surface p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] tracking-[0.2em] text-dim">
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <p className="mt-2 font-display text-xl font-semibold tracking-[-0.03em]">
                    {server.name}
                  </p>
                  <p className="mt-2 text-sm text-mute">
                    {server.provider} · {server.region}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={server.status} />
                  <button
                    type="button"
                    aria-label="Edit"
                    onClick={() => {
                      setEditing(server)
                      setOpen(true)
                    }}
                    className="grid size-8 place-items-center border border-line text-mute hover:text-bone"
                  >
                    <Pencil className="size-3.5" strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete"
                    onClick={() => removeServer(server.id)}
                    className="grid size-8 place-items-center border border-line text-mute hover:text-bone"
                  >
                    <Trash2 className="size-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] uppercase tracking-[0.14em] text-dim">
                <span>{server.ip}</span>
                <span>Uptime {server.uptime}</span>
                <span>{projectName(server.projectId)}</span>
              </div>

              <div className="mt-6 space-y-4">
                <Bar label="CPU" value={server.cpu} />
                <Bar label="RAM" value={server.ram} />
                <Bar label="Disk" value={server.disk} />
              </div>
            </motion.article>
          ))}
        </div>
      )}

      <ServerFormModal
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
