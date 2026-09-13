import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../store'
import { EmptyHint, GhostButton, PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import {
  ApplicationFormModal,
  DomainFormModal,
  IntegrationFormModal,
  ProjectFormModal,
  ServerFormModal,
} from '../components/EntityForms'

export function ProjectDetailPage() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const {
    getProject,
    applications,
    domains,
    servers,
    integrations,
    removeProject,
    removeApplication,
    removeDomain,
    removeServer,
    removeIntegration,
    ready,
  } = useStore()

  const project = getProject(slug)
  const [editProject, setEditProject] = useState(false)
  const [appOpen, setAppOpen] = useState(false)
  const [domainOpen, setDomainOpen] = useState(false)
  const [serverOpen, setServerOpen] = useState(false)
  const [intOpen, setIntOpen] = useState(false)

  if (!ready) return null

  if (!project) {
    return (
      <div>
        <PageHeader index="404" title="Project not found" />
        <Link to="/projects" className="text-sm text-mute hover:text-bone">
          ← Back to projects
        </Link>
      </div>
    )
  }

  const apps = applications.filter((a) => a.projectId === project.id)
  const doms = domains.filter((d) => d.projectId === project.id)
  const svrs = servers.filter((s) => s.projectId === project.id)
  const ints = integrations.filter((i) => i.projectId === project.id)

  return (
    <div>
      <Link
        to="/projects"
        className="mb-6 inline-flex text-[10px] uppercase tracking-[0.22em] text-mute transition hover:text-bone"
      >
        ← Projects
      </Link>

      <PageHeader
        index={`Project / ${project.slug}`}
        title={project.name}
        description={project.description}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={project.status} />
            <button
              type="button"
              onClick={() => setEditProject(true)}
              className="grid size-9 place-items-center border border-line text-mute transition hover:border-bone hover:text-bone"
              aria-label="Edit"
            >
              <Pencil className="size-3.5" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm(`"${project.name}" o‘chirilsinmi?`)) {
                  removeProject(project.id)
                  navigate('/projects')
                }
              }}
              className="grid size-9 place-items-center border border-line text-mute transition hover:border-bone hover:text-bone"
              aria-label="Delete"
            >
              <Trash2 className="size-3.5" strokeWidth={1.5} />
            </button>
          </div>
        }
      />

      {project.stack.length > 0 ? (
        <div className="mb-10 flex flex-wrap gap-x-4 gap-y-2 border-b border-line pb-6 text-[11px] uppercase tracking-[0.16em] text-mute">
          {project.stack.map((tech) => (
            <span key={tech}>{tech}</span>
          ))}
        </div>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-2">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-5 flex items-end justify-between gap-3 border-b border-line pb-3">
            <div>
              <span className="mr-3 text-[10px] uppercase tracking-[0.24em] text-mute">01</span>
              <h2 className="inline font-display text-lg font-semibold tracking-[-0.03em] text-bone">
                Applications
              </h2>
            </div>
            <GhostButton onClick={() => setAppOpen(true)}>Add</GhostButton>
          </div>
          {apps.length === 0 ? (
            <EmptyHint>No apps yet</EmptyHint>
          ) : (
            <ul className="divide-y divide-line border border-line">
              {apps.map((app) => (
                <li key={app.id} className="flex items-center justify-between gap-3 px-4 py-4">
                  <div>
                    <p className="font-medium text-bone">{app.name}</p>
                    <p className="mt-1 text-xs text-mute">
                      {app.type} · v{app.version}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={app.status} />
                    <button
                      type="button"
                      className="text-dim hover:text-bone"
                      onClick={() => removeApplication(app.id)}
                      aria-label="Delete"
                    >
                      <Trash2 className="size-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="mb-5 flex items-end justify-between gap-3 border-b border-line pb-3">
            <div>
              <span className="mr-3 text-[10px] uppercase tracking-[0.24em] text-mute">02</span>
              <h2 className="inline font-display text-lg font-semibold tracking-[-0.03em] text-bone">
                Domains
              </h2>
            </div>
            <GhostButton onClick={() => setDomainOpen(true)}>Add</GhostButton>
          </div>
          {doms.length === 0 ? (
            <EmptyHint>No domains yet</EmptyHint>
          ) : (
            <ul className="divide-y divide-line border border-line">
              {doms.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-4">
                  <div>
                    <p className="font-medium text-bone">{d.name}</p>
                    <p className="mt-1 text-xs text-mute">
                      SSL {d.ssl} · DNS {d.dns}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={d.status} />
                    <button
                      type="button"
                      className="text-dim hover:text-bone"
                      onClick={() => removeDomain(d.id)}
                      aria-label="Delete"
                    >
                      <Trash2 className="size-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="mb-5 flex items-end justify-between gap-3 border-b border-line pb-3">
            <div>
              <span className="mr-3 text-[10px] uppercase tracking-[0.24em] text-mute">03</span>
              <h2 className="inline font-display text-lg font-semibold tracking-[-0.03em] text-bone">
                Servers
              </h2>
            </div>
            <GhostButton onClick={() => setServerOpen(true)}>Add</GhostButton>
          </div>
          {svrs.length === 0 ? (
            <EmptyHint>No servers yet</EmptyHint>
          ) : (
            <ul className="divide-y divide-line border border-line">
              {svrs.map((s) => (
                <li key={s.id} className="px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-bone">{s.name}</p>
                      <p className="mt-1 text-xs text-mute">
                        {s.provider} · {s.region} · {s.ip}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={s.status} />
                      <button
                        type="button"
                        className="text-dim hover:text-bone"
                        onClick={() => removeServer(s.id)}
                        aria-label="Delete"
                      >
                        <Trash2 className="size-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="mb-5 flex items-end justify-between gap-3 border-b border-line pb-3">
            <div>
              <span className="mr-3 text-[10px] uppercase tracking-[0.24em] text-mute">04</span>
              <h2 className="inline font-display text-lg font-semibold tracking-[-0.03em] text-bone">
                Integrations
              </h2>
            </div>
            <GhostButton onClick={() => setIntOpen(true)}>Add</GhostButton>
          </div>
          {ints.length === 0 ? (
            <EmptyHint>No integrations yet</EmptyHint>
          ) : (
            <ul className="divide-y divide-line border border-line">
              {ints.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-4">
                  <div>
                    <p className="font-medium text-bone">{item.name}</p>
                    <p className="mt-1 text-xs capitalize text-mute">{item.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={item.status} />
                    <button
                      type="button"
                      className="text-dim hover:text-bone"
                      onClick={() => removeIntegration(item.id)}
                      aria-label="Delete"
                    >
                      <Trash2 className="size-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.section>
      </div>

      <ProjectFormModal
        open={editProject}
        initial={project}
        onClose={() => setEditProject(false)}
      />
      <ApplicationFormModal
        open={appOpen}
        defaultProjectId={project.id}
        onClose={() => setAppOpen(false)}
      />
      <DomainFormModal
        open={domainOpen}
        defaultProjectId={project.id}
        onClose={() => setDomainOpen(false)}
      />
      <ServerFormModal
        open={serverOpen}
        defaultProjectId={project.id}
        onClose={() => setServerOpen(false)}
      />
      <IntegrationFormModal
        open={intOpen}
        defaultProjectId={project.id}
        onClose={() => setIntOpen(false)}
      />
    </div>
  )
}
