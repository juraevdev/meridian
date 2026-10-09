export type Status = 'online' | 'degraded' | 'offline' | 'pending' | 'active' | 'expiring'

export type Project = {
  id: string
  name: string
  slug: string
  description: string
  status: Status
  stack: string[]
  updatedAt: string
}

export type Application = {
  id: string
  name: string
  projectId: string
  type: 'web' | 'api' | 'worker' | 'mobile'
  url?: string
  status: Status
  version: string
  deploys: number
  latencyMs: number
}

export type Domain = {
  id: string
  name: string
  projectId: string
  registrar: string
  ssl: 'valid' | 'expiring' | 'invalid' | 'none'
  expiresAt: string
  sslExpiresAt?: string
  dns: 'ok' | 'warn' | 'error'
  status: Status
  checkedAt?: string
  checkError?: string
}

export type Server = {
  id: string
  name: string
  projectId: string
  provider: string
  region: string
  ip: string
  status: Status
  cpu: number
  ram: number
  disk: number
  uptime: string
}

export type Container = {
  id: string
  name: string
  projectId: string
  serverId: string
  image: string
  status: Status
  ports: string
  notes?: string
}

export type Bot = {
  id: string
  name: string
  projectId: string
  platform: 'telegram' | 'other'
  handle: string
  status: Status
  notes?: string
}

export type Integration = {
  id: string
  name: string
  provider: string
  projectId: string
  category: 'git' | 'payment' | 'analytics' | 'storage' | 'auth' | 'email' | 'ci' | 'sms' | 'pos' | 'ai'
  status: Status
  connectedAt: string
}

export type StoreData = {
  projects: Project[]
  applications: Application[]
  domains: Domain[]
  servers: Server[]
  containers: Container[]
  bots: Bot[]
  integrations: Integration[]
}

export const emptyStore: StoreData = {
  projects: [],
  applications: [],
  domains: [],
  servers: [],
  containers: [],
  bots: [],
  integrations: [],
}

export const STATUS_OPTIONS: Status[] = [
  'online',
  'active',
  'degraded',
  'expiring',
  'offline',
  'pending',
]

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}
