import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { cloudeSeed, SEED_VERSION } from './seed'
import {
  emptyStore,
  slugify,
  uid,
  type Application,
  type Bot,
  type Container,
  type Domain,
  type Integration,
  type Project,
  type Server,
  type StoreData,
} from './types'

const STORAGE_KEY = 'meridian.store.v2'
const SEED_KEY = 'meridian.seed.version'

type StoreApi = StoreData & {
  ready: boolean
  getProject: (idOrSlug: string) => Project | undefined
  projectName: (id: string) => string
  serverName: (id: string) => string
  fleetStats: {
    projects: number
    apps: number
    domains: number
    servers: number
    containers: number
    bots: number
    integrations: number
    healthy: number
    attention: number
  }
  addProject: (input: Omit<Project, 'id' | 'slug' | 'updatedAt'> & { slug?: string }) => Project
  updateProject: (id: string, patch: Partial<Project>) => void
  removeProject: (id: string) => void
  addApplication: (input: Omit<Application, 'id'>) => Application
  updateApplication: (id: string, patch: Partial<Application>) => void
  removeApplication: (id: string) => void
  addDomain: (input: Omit<Domain, 'id'>) => Domain
  updateDomain: (id: string, patch: Partial<Domain>) => void
  removeDomain: (id: string) => void
  addServer: (input: Omit<Server, 'id'>) => Server
  updateServer: (id: string, patch: Partial<Server>) => void
  removeServer: (id: string) => void
  addContainer: (input: Omit<Container, 'id'>) => Container
  updateContainer: (id: string, patch: Partial<Container>) => void
  removeContainer: (id: string) => void
  addBot: (input: Omit<Bot, 'id'>) => Bot
  updateBot: (id: string, patch: Partial<Bot>) => void
  removeBot: (id: string) => void
  addIntegration: (input: Omit<Integration, 'id'>) => Integration
  updateIntegration: (id: string, patch: Partial<Integration>) => void
  removeIntegration: (id: string) => void
  clearAll: () => void
  replaceAll: (data: StoreData) => void
  reseedFromDisk: () => void
}

const StoreContext = createContext<StoreApi | null>(null)

function normalize(parsed: Partial<StoreData>): StoreData {
  return {
    projects: parsed.projects ?? [],
    applications: parsed.applications ?? [],
    domains: parsed.domains ?? [],
    servers: parsed.servers ?? [],
    containers: parsed.containers ?? [],
    bots: parsed.bots ?? [],
    integrations: parsed.integrations ?? [],
  }
}

function loadStore(): StoreData {
  try {
    const seeded = localStorage.getItem(SEED_KEY)
    const raw = localStorage.getItem(STORAGE_KEY)
    if (seeded !== SEED_VERSION || !raw) {
      localStorage.setItem(SEED_KEY, SEED_VERSION)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudeSeed))
      return cloudeSeed
    }
    return normalize(JSON.parse(raw) as StoreData)
  } catch {
    return cloudeSeed
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<StoreData>(emptyStore)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setData(loadStore())
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data, ready])

  const set = useCallback((updater: (prev: StoreData) => StoreData) => {
    setData(updater)
  }, [])

  const api = useMemo<StoreApi>(() => {
    const getProject = (idOrSlug: string) =>
      data.projects.find((p) => p.id === idOrSlug || p.slug === idOrSlug)

    const projectName = (id: string) =>
      data.projects.find((p) => p.id === id)?.name ?? '—'

    const serverName = (id: string) =>
      data.servers.find((s) => s.id === id)?.name ?? '—'

    const healthy = [...data.applications, ...data.servers, ...data.containers, ...data.bots].filter(
      (x) => x.status === 'online' || x.status === 'active',
    ).length

    const attention = [
      ...data.applications,
      ...data.servers,
      ...data.domains,
      ...data.containers,
      ...data.bots,
      ...data.integrations,
    ].filter((x) => ['degraded', 'expiring', 'offline'].includes(x.status)).length

    return {
      ...data,
      ready,
      getProject,
      projectName,
      serverName,
      fleetStats: {
        projects: data.projects.length,
        apps: data.applications.length,
        domains: data.domains.length,
        servers: data.servers.length,
        containers: data.containers.length,
        bots: data.bots.length,
        integrations: data.integrations.length,
        healthy,
        attention,
      },
      addProject: (input) => {
        const base = slugify(input.slug || input.name) || uid('project')
        let slug = base
        let n = 2
        while (data.projects.some((p) => p.slug === slug)) slug = `${base}-${n++}`
        const project: Project = {
          id: uid('p'),
          name: input.name,
          slug,
          description: input.description,
          status: input.status,
          stack: input.stack,
          updatedAt: new Date().toISOString(),
        }
        set((prev) => ({ ...prev, projects: [project, ...prev.projects] }))
        return project
      },
      updateProject: (id, patch) => {
        set((prev) => ({
          ...prev,
          projects: prev.projects.map((p) =>
            p.id === id
              ? {
                  ...p,
                  ...patch,
                  slug: patch.slug ? slugify(patch.slug) || p.slug : p.slug,
                  updatedAt: new Date().toISOString(),
                }
              : p,
          ),
        }))
      },
      removeProject: (id) => {
        set((prev) => ({
          projects: prev.projects.filter((p) => p.id !== id),
          applications: prev.applications.filter((a) => a.projectId !== id),
          domains: prev.domains.filter((d) => d.projectId !== id),
          servers: prev.servers.filter((s) => s.projectId !== id),
          containers: prev.containers.filter((c) => c.projectId !== id),
          bots: prev.bots.filter((b) => b.projectId !== id),
          integrations: prev.integrations.filter((i) => i.projectId !== id),
        }))
      },
      addApplication: (input) => {
        const item: Application = { ...input, id: uid('a') }
        set((prev) => ({ ...prev, applications: [item, ...prev.applications] }))
        return item
      },
      updateApplication: (id, patch) => {
        set((prev) => ({
          ...prev,
          applications: prev.applications.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        }))
      },
      removeApplication: (id) => {
        set((prev) => ({
          ...prev,
          applications: prev.applications.filter((a) => a.id !== id),
        }))
      },
      addDomain: (input) => {
        const item: Domain = { ...input, id: uid('d') }
        set((prev) => ({ ...prev, domains: [item, ...prev.domains] }))
        return item
      },
      updateDomain: (id, patch) => {
        set((prev) => ({
          ...prev,
          domains: prev.domains.map((d) => (d.id === id ? { ...d, ...patch } : d)),
        }))
      },
      removeDomain: (id) => {
        set((prev) => ({
          ...prev,
          domains: prev.domains.filter((d) => d.id !== id),
        }))
      },
      addServer: (input) => {
        const item: Server = { ...input, id: uid('s') }
        set((prev) => ({ ...prev, servers: [item, ...prev.servers] }))
        return item
      },
      updateServer: (id, patch) => {
        set((prev) => ({
          ...prev,
          servers: prev.servers.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        }))
      },
      removeServer: (id) => {
        set((prev) => ({
          ...prev,
          servers: prev.servers.filter((s) => s.id !== id),
          containers: prev.containers.filter((c) => c.serverId !== id),
        }))
      },
      addContainer: (input) => {
        const item: Container = { ...input, id: uid('c') }
        set((prev) => ({ ...prev, containers: [item, ...prev.containers] }))
        return item
      },
      updateContainer: (id, patch) => {
        set((prev) => ({
          ...prev,
          containers: prev.containers.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        }))
      },
      removeContainer: (id) => {
        set((prev) => ({
          ...prev,
          containers: prev.containers.filter((c) => c.id !== id),
        }))
      },
      addBot: (input) => {
        const item: Bot = { ...input, id: uid('b') }
        set((prev) => ({ ...prev, bots: [item, ...prev.bots] }))
        return item
      },
      updateBot: (id, patch) => {
        set((prev) => ({
          ...prev,
          bots: prev.bots.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        }))
      },
      removeBot: (id) => {
        set((prev) => ({
          ...prev,
          bots: prev.bots.filter((b) => b.id !== id),
        }))
      },
      addIntegration: (input) => {
        const item: Integration = { ...input, id: uid('i') }
        set((prev) => ({ ...prev, integrations: [item, ...prev.integrations] }))
        return item
      },
      updateIntegration: (id, patch) => {
        set((prev) => ({
          ...prev,
          integrations: prev.integrations.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        }))
      },
      removeIntegration: (id) => {
        set((prev) => ({
          ...prev,
          integrations: prev.integrations.filter((i) => i.id !== id),
        }))
      },
      clearAll: () => set(() => emptyStore),
      replaceAll: (next) => set(() => next),
      reseedFromDisk: () => {
        localStorage.setItem(SEED_KEY, SEED_VERSION)
        set(() => cloudeSeed)
      },
    }
  }, [data, ready, set])

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
