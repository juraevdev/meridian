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
import { STATUS_OPTIONS, type Bot, type Status } from '../types'

function BotForm({
  open,
  onClose,
  initial,
}: {
  open: boolean
  onClose: () => void
  initial?: Bot | null
}) {
  const { addBot, updateBot, projects } = useStore()
  const [name, setName] = useState('')
  const [projectId, setProjectId] = useState('')
  const [handle, setHandle] = useState('')
  const [platform, setPlatform] = useState<Bot['platform']>('telegram')
  const [status, setStatus] = useState<Status>('online')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    setName(initial?.name ?? '')
    setProjectId(initial?.projectId ?? projects[0]?.id ?? '')
    setHandle(initial?.handle ?? '')
    setPlatform(initial?.platform ?? 'telegram')
    setStatus(initial?.status ?? 'online')
    setNotes(initial?.notes ?? '')
  }, [open, initial, projects])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!projectId) return
    const payload = {
      name: name.trim(),
      projectId,
      handle: handle.trim(),
      platform,
      status,
      notes: notes.trim() || undefined,
    }
    if (initial) updateBot(initial.id, payload)
    else addBot(payload)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit bot' : 'New bot'}>
      <FormGrid onSubmit={submit}>
        <Field label="Name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Handle">
          <TextInput
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="@BotName"
            required
          />
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Platform">
            <TextSelect
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Bot['platform'])}
            >
              <option value="telegram">telegram</option>
              <option value="other">other</option>
            </TextSelect>
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
        </div>
        <Field label="Notes">
          <TextInput value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <FormActions onCancel={onClose} submitLabel={initial ? 'Update' : 'Add'} />
      </FormGrid>
    </Modal>
  )
}

export function BotsPage() {
  const { bots, projectName, removeBot, ready } = useStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Bot | null>(null)

  if (!ready) return null

  return (
    <div>
      <PageHeader
        index="008 / Bots"
        title="Bots"
        description="Telegram va boshqa botlar — loyihalarga biriktirilgan."
        action={
          <GhostButton
            onClick={() => {
              setEditing(null)
              setOpen(true)
            }}
          >
            New bot →
          </GhostButton>
        }
      />

      <div className="divide-y divide-line border border-line">
        {bots.map((bot, i) => (
          <motion.article
            key={bot.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="grid gap-3 px-5 py-5 sm:grid-cols-[auto_1.4fr_1fr_auto] sm:items-center"
          >
            <span className="font-display text-2xl font-semibold text-dim">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div>
              <p className="font-display text-xl font-semibold tracking-[-0.03em]">{bot.name}</p>
              <p className="mt-1 text-sm text-mute">{bot.handle}</p>
              {bot.notes ? <p className="mt-1 text-xs text-dim">{bot.notes}</p> : null}
            </div>
            <p className="text-sm capitalize text-mute">
              {bot.platform}
              <span className="mt-1 block text-xs text-dim">{projectName(bot.projectId)}</span>
            </p>
            <div className="flex items-center gap-2">
              <StatusBadge status={bot.status} />
              <button
                type="button"
                aria-label="Edit"
                onClick={() => {
                  setEditing(bot)
                  setOpen(true)
                }}
                className="grid size-8 place-items-center border border-line text-mute hover:text-bone"
              >
                <Pencil className="size-3.5" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                aria-label="Delete"
                onClick={() => removeBot(bot.id)}
                className="grid size-8 place-items-center border border-line text-mute hover:text-bone"
              >
                <Trash2 className="size-3.5" strokeWidth={1.5} />
              </button>
            </div>
          </motion.article>
        ))}
      </div>

      <BotForm
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
