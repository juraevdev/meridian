import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import { GhostButton, PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { ProjectFormModal } from '../components/EntityForms'
import type { Project } from '../types'

export function ProjectsPage() {
  const { projects, applications, domains, servers, containers, bots, integrations, removeProject, ready } =
    useStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)

  if (!ready) return null

  const counts = (id: string) => ({
    apps: applications.filter((a) => a.projectId === id).length,
    domains: domains.filter((d) => d.projectId === id).length,
    servers: servers.filter((s) => s.projectId === id).length,
    containers: containers.filter((c) => c.projectId === id).length,
    bots: bots.filter((b) => b.projectId === id).length,
    integrations: integrations.filter((i) => i.projectId === id).length,
  })

  return (
    <div>
      <PageHeader
        index="002 / Projects"
        title="Portfolio"
        description="Har bir loyiha — ilovalar, domainlar, serverlar, integratsiyalar."
        action={
          <GhostButton
            onClick={() => {
              setEditing(null)
              setOpen(true)
            }}
          >
            New project →
          </GhostButton>
        }
      />

      {projects.length === 0 ? (
        <div className="border border-dashed border-line-strong px-6 py-14 text-center">
          <p className="font-display text-xl font-semibold">Hali loyiha yo‘q</p>
          <p className="mt-2 text-sm text-mute">Haqiqiy loyihangizni qo‘shing.</p>
        </div>
      ) : (
        <div className="divide-y divide-line border border-line">
          {projects.map((project, i) => {
            const c = counts(project.id)
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.45 }}
                className="group grid gap-4 px-5 py-7 md:grid-cols-[auto_1fr_auto] md:items-center"
              >
                <Link
                  to={`/projects/${project.slug}`}
                  className="contents"
                >
                  <span className="font-display text-3xl font-semibold tracking-[-0.04em] text-dim transition group-hover:text-bone">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <h2 className="font-display text-2xl font-semibold tracking-[-0.03em]">
                        {project.name}
                      </h2>
                      <StatusBadge status={project.status} />
                    </div>
                    <p className="max-w-2xl text-sm text-mute">{project.description}</p>
                    {project.stack.length > 0 ? (
                      <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-dim">
                        {project.stack.join(' / ')}
                      </p>
                    ) : null}
                  </div>
                </Link>
                <div className="flex flex-wrap items-center gap-4 md:justify-end">
                  <div className="flex items-center gap-5 text-center">
                    {[
                      ['Apps', c.apps],
                      ['Domains', c.domains],
                      ['Ctr', c.containers],
                      ['Bots', c.bots],
                    ].map(([label, value]) => (
                      <div key={label as string}>
                        <p className="font-display text-xl font-semibold">{value}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-mute">
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Edit"
                      onClick={() => {
                        setEditing(project)
                        setOpen(true)
                      }}
                      className="grid size-9 place-items-center border border-line text-mute transition hover:border-bone hover:text-bone"
                    >
                      <Pencil className="size-3.5" strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete"
                      onClick={() => {
                        if (
                          confirm(
                            `"${project.name}" va unga bog‘langan barcha ma’lumotlar o‘chirilsinmi?`,
                          )
                        ) {
                          removeProject(project.id)
                        }
                      }}
                      className="grid size-9 place-items-center border border-line text-mute transition hover:border-bone hover:text-bone"
                    >
                      <Trash2 className="size-3.5" strokeWidth={1.5} />
                    </button>
                    <Link
                      to={`/projects/${project.slug}`}
                      className="text-mute transition hover:text-bone"
                    >
                      →
                    </Link>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <ProjectFormModal
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
