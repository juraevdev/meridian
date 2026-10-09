import type { Domain, Status } from './types'

export type DomainCheck = {
  name: string
  rootDomain: string
  checkedAt: string
  registrar?: string
  expiresAt?: string
  sslExpiresAt?: string
  ssl: Domain['ssl']
  dns: 'ok' | 'error'
  status: Status
  error?: string
}

async function post(path: string, domains: string[]) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domains }),
  })
  const data = (await res.json().catch(() => ({}))) as {
    results?: Record<string, DomainCheck>
    error?: string
  }
  if (!res.ok || !data.results) throw new Error(data.error ?? `HTTP ${res.status}`)
  return data.results
}

export function fetchDomainStatus(domains: string[]) {
  return post('/api/domains/status', domains)
}

export function refreshDomainStatus(domains: string[]) {
  return post('/api/domains/refresh', domains)
}

export function normalizeDomainName(name: string) {
  return name.trim().toLowerCase().replace(/\.$/, '')
}

export function daysUntil(isoDate?: string) {
  if (!isoDate) return null
  const time = Date.parse(isoDate)
  if (Number.isNaN(time)) return null
  return Math.floor((time - Date.now()) / 86_400_000)
}
