import { motion } from 'framer-motion'
import { Pencil, Trash2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useStore } from '../store'
import { GhostButton, PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import {
  Field,
  FormActions,
  FormGrid,
  Modal,
  TextInput,
  TextSelect,
} from '../components/FormUI'
import { STATUS_OPTIONS, type Container, type Status } from '../types'

function ContainerForm({
  open,
  onClose,
  initial,
}: {
  open: boolean
  onClose: () => void
  initial?: Container | null
}) {
  const { addContainer, updateContainer, projects, servers } = useStore()
  const [name, setName] = useState('')
  const [projectId, setProjectId] = useState('')
  const [serverId, setServerId] = useState('')
  const [image, setImage] = useState('')
  const [ports, setPorts] = useState('')
  const [status, setStatus] = useState<Status>('online')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    setName(initial?.name ?? '')
    setProjectId(initial?.projectId ?? projects[0]?.id ?? '')
    setServerId(initial?.serverId ?? servers[0]?.id ?? '')
    setImage(initial?.image ?? '')
    setPorts(initial?.ports ?? '')
    setStatus(initial?.status ?? 'online')
    setNotes(initial?.notes ?? '')
  }, [open, initial, projects, servers])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!projectId || !serverId) return
    const payload = {
      name: name.trim(),
      projectId,
      serverId,
      image: image.trim(),
      ports: ports.trim() || '—',
      status,
      notes: notes.trim() || undefined,
    }
    if (initial) updateContainer(initial.id, payload)
    else addContainer(payload)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit container' : 'New container'}>
      <FormGrid onSubmit={submit}>
        <Field label="Name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Image">
          <TextInput value={image} onChange={(e) => setImage(e.target.value)} required />
        </Field>
        <Field label="Project">
          <TextSelect value={projectId} onChange={(e) => setProjectId(e.target.value)} required>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </TextSelect>
        </Field>
        <Field label="Server">
          <TextSelect value={serverId} onChange={(e) => setServerId(e.target.value)} required>
            {servers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </TextSelect>
        </Field>
        <Field label="Ports">
          <TextInput value={ports} onChange={(e) => setPorts(e.target.value)} />
        </Field>
        <Field label="Status">
          <TextSelect value={status} onChange={(e) => setStatus(e.target.value as Status)}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </TextSelect>
        </Field>
        <Field label="Notes">
          <TextInput value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <FormActions onCancel={onClose} submitLabel={initial ? 'Update' : 'Add'} />
      </FormGrid>
    </Modal>
  )
}

export function ContainersPage() {
  const { containers, projectName, serverName, removeContainer, ready } = useStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Container | null>(null)

  if (!ready) return null

  return (
    <div>
      <PageHeader
        index="007 / Containers"
        title="Containers"
        description="Docker compose servislari — serverlar bo‘yicha."
        action={
          <GhostButton
            onClick={() => {
              setEditing(null)
              setOpen(true)
            }}
          >
            New container →
          </GhostButton>
        }
      />

      <div className="divide-y divide-line border border-line">
        {containers.map((c, i) => (
          <motion.article
            key={c.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.02, 0.4) }}
            className="grid gap-3 px-5 py-4 md:grid-cols-[auto_1.2fr_1fr_1fr_auto] md:items-center"
          >
            <span className="font-display text-xl font-semibold text-dim">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div>
              <p className="font-medium text-bone">{c.name}</p>
              <p className="mt-1 text-xs text-mute">{c.image}</p>
              {c.notes ? <p className="mt-1 text-xs text-dim">{c.notes}</p> : null}
            </div>
            <p className="text-sm text-mute">
              {serverName(c.serverId)}
              <span className="mt-1 block text-xs text-dim">{projectName(c.projectId)}</span>
            </p>
            <p className="font-mono text-xs text-mute">{c.ports}</p>
            <div className="flex items-center gap-2">
              <StatusBadge status={c.status} />
              <button
                type="button"
                aria-label="Edit"
                onClick={() => {
                  setEditing(c)
                  setOpen(true)
                }}
                className="grid size-8 place-items-center border border-line text-mute hover:text-bone"
              >
                <Pencil className="size-3.5" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                aria-label="Delete"
                onClick={() => removeContainer(c.id)}
                className="grid size-8 place-items-center border border-line text-mute hover:text-bone"
              >
                <Trash2 className="size-3.5" strokeWidth={1.5} />
              </button>
            </div>
          </motion.article>
        ))}
      </div>

      <ContainerForm
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
