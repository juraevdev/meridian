import type { Status } from '../types'

const labels: Record<Status, string> = {
  online: 'Online',
  active: 'Active',
  degraded: 'Degraded',
  expiring: 'Expiring',
  offline: 'Offline',
  pending: 'Pending',
}

export function StatusBadge({ status }: { status: Status }) {
  const solid = status === 'online' || status === 'active'
  const soft = status === 'degraded' || status === 'expiring'

  return (
    <span className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.22em] text-mute">
      <span
        className={`size-1.5 rounded-full ${
          solid ? 'bg-bone' : soft ? 'bg-mute' : 'bg-dim'
        }`}
      />
      {labels[status]}
    </span>
  )
}
