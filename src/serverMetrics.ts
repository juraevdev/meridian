import type { Server, Status } from './types'

export type ServerReport = {
  serverId: string
  name?: string
  hostname?: string
  os?: string
  kernel?: string
  cores?: number
  cpu: number
  ram: number
  disk: number
  memTotalKb?: number
  memUsedKb?: number
  diskTotalKb?: number
  diskUsedKb?: number
  load?: number[]
  uptimeSec?: number
  containers?: number | null
  reportedAt: string
  status: Status
}

export async function fetchServerStatus() {
  const res = await fetch('/api/servers/status')
  const data = (await res.json().catch(() => ({}))) as {
    servers?: Record<string, ServerReport>
    error?: string
  }
  if (!res.ok || !data.servers) throw new Error(data.error ?? `HTTP ${res.status}`)
  return data.servers
}

export function formatUptime(seconds?: number) {
  if (seconds === undefined) return '—'
  const days = Math.floor(seconds / 86_400)
  const hours = Math.floor((seconds % 86_400) / 3_600)
  const minutes = Math.floor((seconds % 3_600) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function formatKb(kb?: number) {
  if (kb === undefined) return '—'
  const gb = kb / 1024 / 1024
  return gb >= 1000 ? `${(gb / 1024).toFixed(1)} TB` : `${gb >= 10 ? gb.toFixed(0) : gb.toFixed(1)} GB`
}

export function formatAgo(iso?: string) {
  if (!iso) return null
  const seconds = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3_600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86_400) return `${Math.floor(seconds / 3_600)}h ago`
  return `${Math.floor(seconds / 86_400)}d ago`
}

export function applyReport(server: Server, report: ServerReport): Server {
  return {
    ...server,
    status: report.status,
    cpu: report.cpu,
    ram: report.ram,
    disk: report.disk,
    uptime: formatUptime(report.uptimeSec),
    hostname: report.hostname,
    os: report.os,
    kernel: report.kernel,
    cores: report.cores,
    memTotalKb: report.memTotalKb,
    memUsedKb: report.memUsedKb,
    diskTotalKb: report.diskTotalKb,
    diskUsedKb: report.diskUsedKb,
    load: report.load,
    containersRunning: report.containers ?? undefined,
    lastSeen: report.reportedAt,
  }
}
