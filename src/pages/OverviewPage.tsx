import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useStore } from '../store'
import { Metric, PageHeader, SectionLabel } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { ProjectFormModal } from '../components/EntityForms'

export function OverviewPage() {
  const {
    projects,
    applications,
    domains,
    servers,
    fleetStats,
    ready,
  } = useStore()
  const [openProject, setOpenProject] = useState(false)

  const alerts = [
    ...servers.filter((s) => s.status === 'degraded'),
    ...applications.filter((a) => a.status === 'degraded'),
    ...domains.filter((d) => ['expiring', 'degraded', 'offline'].includes(d.status)),
  ]

  if (!ready) return null

  const empty = projects.length === 0

  return (
    <div>
      <PageHeader
        index="001 / Overview"
        title={empty ? 'Start with your real stack.' : 'Your Cloude fleet.'}
        description={
          empty
            ? 'Demo yo‘q. Avval loyiha qo‘shing — keyin ilova, domain, server va integratsiyalar.'
            : 'D:\\Cloude\\projects inventari: serverlar, domainlar, konteynerlar, botlar, integratsiyalar.'
        }
        action={
          empty ? (
            <button
              type="button"
              onClick={() => setOpenProject(true)}
              className="inline-flex items-center gap-2 rounded-full border border-bone/30 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.22em] text-bone transition hover:border-bone hover:bg-bone hover:text-void"
            >
              Add project →
            </button>
          ) : (
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 rounded-full border border-bone/30 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.22em] text-bone transition hover:border-bone hover:bg-bone hover:text-void"
            >
              Open projects →
            </Link>
          )
        }
      />

      <div className="mb-12 grid gap-px bg-line sm:grid-cols-2 xl:grid-cols-4">
        <Metric index="01" label="Projects" value={fleetStats.projects} delay={0.05} />
        <Metric index="02" label="Servers" value={fleetStats.servers} delay={0.1} />
        <Metric index="03" label="Containers" value={fleetStats.containers} delay={0.15} />
        <Metric index="04" label="Attention" value={fleetStats.attention} delay={0.2} />
      </div>

      <div className="mb-12 grid gap-px bg-line sm:grid-cols-2 xl:grid-cols-4">
        <Metric index="05" label="Domains" value={fleetStats.domains} delay={0.22} />
        <Metric index="06" label="Apps" value={fleetStats.apps} delay={0.24} />
        <Metric index="07" label="Bots" value={fleetStats.bots} delay={0.26} />
        <Metric index="08" label="Integrations" value={fleetStats.integrations} delay={0.28} />
      </div>

      {empty ? (
        <div className="border border-line bg-surface px-6 py-12 text-center">
          <p className="font-display text-2xl font-semibold tracking-[-0.03em]">Empty control plane</p>
          <p className="mx-auto mt-3 max-w-md font-serif text-sm italic text-mute">
            Ma’lumotlar shu brauzerda saqlanadi. Loyiha → ilova / domain / server / integratsiya tartibida
            kiriting.
          </p>
        </div>
      ) : (
        <div className="grid gap-12 xl:grid-cols-[1.35fr_1fr]">
          <section>
            <SectionLabel index="A / Portfolio">Projects</SectionLabel>
            <div className="divide-y divide-line border border-line">
              {projects.map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * i, duration: 0.4 }}
                >
                  <Link
                    to={`/projects/${project.slug}`}
                    className="group flex items-start justify-between gap-4 px-5 py-5 transition hover:bg-bone/[0.03]"
                  >
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-3">
                        <span className="text-[10px] tracking-[0.2em] text-dim">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <StatusBadge status={project.status} />
                      </div>
                      <h3 className="font-display text-xl font-semibold tracking-[-0.03em] text-bone">
                        {project.name}
                      </h3>
                      <p className="mt-2 max-w-xl text-sm text-mute">{project.description}</p>
                      {project.stack.length > 0 ? (
                        <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-dim">
                          {project.stack.join(' / ')}
                        </p>
                      ) : null}
                    </div>
                    <span className="mt-1 text-mute transition group-hover:text-bone">→</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>

          <section>
            <SectionLabel index="B / Signals">Alerts</SectionLabel>
            <div className="space-y-px bg-line">
              {alerts.length === 0 ? (
                <div className="border border-line bg-surface px-5 py-6">
                  <p className="font-display text-lg font-semibold tracking-[-0.03em]">All clear</p>
                  <p className="mt-2 font-serif text-sm italic text-mute">
                    Nothing needs attention right now.
                  </p>
                </div>
              ) : (
                alerts.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + i * 0.05 }}
                    className="bg-surface px-5 py-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] tracking-[0.2em] text-dim">
                        {String(i + 1).padStart(2, '0')}
                      </p>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="mt-3 font-display text-lg font-semibold tracking-[-0.03em]">
                      {item.name}
                    </p>
                    <p className="mt-2 text-sm text-mute">
                      {'cpu' in item
                        ? `CPU ${item.cpu}% — elevated load`
                        : 'ssl' in item
                          ? (item.checkError ??
                            `Domain ${item.expiresAt} · SSL ${item.sslExpiresAt ?? '—'}`)
                          : `Latency ${'latencyMs' in item ? item.latencyMs : '—'} ms`}
                    </p>
                  </motion.div>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      <ProjectFormModal open={openProject} onClose={() => setOpenProject(false)} />
    </div>
  )
}
