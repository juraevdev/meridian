import { motion } from 'framer-motion'
import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../store'
import { GhostButton, PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { ServerFormModal } from '../components/EntityForms'
import { formatAgo, formatKb } from '../serverMetrics'
import type { Server } from '../types'

function Bar({ label, value, detail }: { label: string; value?: number; detail?: string }) {
  const known = value !== undefined
  return (
    <div>
      <div className="mb-2 flex justify-between gap-3 text-[10px] font-medium uppercase tracking-[0.18em] text-mute">
        <span>{label}</span>
        <span className="text-right">
          {detail ? <span className="mr-3 normal-case tracking-normal text-dim">{detail}</span> : null}
          <span className="text-bone">{known ? `${value}%` : '—'}</span>
        </span>
      </div>
      <div className="h-px bg-line">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value ?? 0}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="h-px bg-bone"
        />
      </div>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-[0.18em] text-dim">{label}</p>
      <p className="mt-1 truncate text-sm text-bone" title={value}>
        {value}
      </p>
    </div>
  )
}

function ServerCard({
  server,
  index,
  projectName,
  onEdit,
  onDelete,
}: {
  server: Server
  index: number
  projectName: string
  onEdit: () => void
  onDelete: () => void
}) {
  const reporting = Boolean(server.lastSeen)

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="bg-surface p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] tracking-[0.2em] text-dim">{String(index + 1).padStart(2, '0')}</p>
          <p className="mt-2 font-display text-xl font-semibold tracking-[-0.03em]">{server.name}</p>
          <p className="mt-2 text-sm text-mute">
            {[server.provider, server.region].filter((v) => v && v !== '—').join(' · ')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={reporting ? server.status : 'pending'} />
          <button
            type="button"
            aria-label="Edit"
            onClick={onEdit}
            className="grid size-8 place-items-center border border-line text-mute hover:text-bone"
          >
            <Pencil className="size-3.5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            aria-label="Delete"
            onClick={onDelete}
            className="grid size-8 place-items-center border border-line text-mute hover:text-bone"
          >
            <Trash2 className="size-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] uppercase tracking-[0.14em] text-dim">
        <span>{server.ip}</span>
        {projectName !== '—' ? <span>{projectName}</span> : null}
        <span>{reporting ? `Seen ${formatAgo(server.lastSeen)}` : `Agent ID ${server.id}`}</span>
      </div>

      {reporting ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 2xl:grid-cols-4">
            <Fact label="OS" value={server.os ?? '—'} />
            <Fact label="Uptime" value={server.uptime} />
            <Fact label="CPU cores" value={server.cores ? String(server.cores) : '—'} />
            <Fact
              label="Load avg"
              value={server.load?.length ? server.load.map((v) => v.toFixed(2)).join(' · ') : '—'}
            />
          </div>
          <div className="mt-6 space-y-4">
            <Bar label="CPU" value={server.cpu} />
            <Bar
              label="RAM"
              value={server.ram}
              detail={`${formatKb(server.memUsedKb)} / ${formatKb(server.memTotalKb)}`}
            />
            <Bar
              label="Disk"
              value={server.disk}
              detail={`${formatKb(server.diskUsedKb)} / ${formatKb(server.diskTotalKb)}`}
            />
          </div>
          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-dim">
            {server.hostname ? <span>host {server.hostname}</span> : null}
            {server.kernel ? <span>kernel {server.kernel}</span> : null}
            {server.containersRunning !== undefined ? (
              <span>{server.containersRunning} containers running</span>
            ) : null}
          </div>
        </>
      ) : (
        <div className="mt-6 border border-dashed border-line-strong px-4 py-5 text-sm text-mute">
          Agent hali ma’lumot yubormagan. Haqiqiy CPU, RAM va disk ko‘rinishi uchun serverga
          Meridian agentini o‘rnating.
        </div>
      )}
    </motion.article>
  )
}

export function ServersPage() {
  const { servers, projectName, removeServer, ready, projects, metricsError } = useStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Server | null>(null)

  if (!ready) return null

  return (
    <div>
      <PageHeader
        index="005 / Servers"
        title="Compute"
        description="Har bir serverdagi agent har daqiqada CPU, RAM, disk va uptime yuboradi."
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

      {metricsError ? (
        <p className="-mt-6 mb-6 text-[11px] uppercase tracking-[0.16em] text-bone">
          Metrika xizmati javob bermadi: {metricsError}
        </p>
      ) : null}

      {servers.length === 0 ? (
        <div className="border border-dashed border-line-strong px-6 py-14 text-center text-sm text-mute">
          Server qo‘shilmagan.
        </div>
      ) : (
        <div className="grid gap-px border border-line bg-line lg:grid-cols-2 lg:[&>*:last-child:nth-child(odd)]:col-span-2">
          {servers.map((server, i) => (
            <ServerCard
              key={server.id}
              server={server}
              index={i}
              projectName={projectName(server.projectId)}
              onEdit={() => {
                setEditing(server)
                setOpen(true)
              }}
              onDelete={() => removeServer(server.id)}
            />
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
