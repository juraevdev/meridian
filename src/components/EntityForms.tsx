import { useEffect, useState, type FormEvent } from 'react'
import {
  Field,
  FormActions,
  FormGrid,
  Modal,
  TextArea,
  TextInput,
  TextSelect,
} from './FormUI'
import { useStore } from '../store'
import {
  STATUS_OPTIONS,
  type Application,
  type Domain,
  type Integration,
  type Project,
  type Server,
  type Status,
} from '../types'

function ProjectSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const { projects } = useStore()
  return (
    <TextSelect value={value} onChange={(e) => onChange(e.target.value)} required>
      <option value="">Select project</option>
      {projects.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </TextSelect>
  )
}

export function ProjectFormModal({
  open,
  onClose,
  initial,
}: {
  open: boolean
  onClose: () => void
  initial?: Project | null
}) {
  const { addProject, updateProject } = useStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<Status>('online')
  const [stack, setStack] = useState('')

  useEffect(() => {
    if (!open) return
    setName(initial?.name ?? '')
    setDescription(initial?.description ?? '')
    setStatus(initial?.status ?? 'online')
    setStack(initial?.stack.join(', ') ?? '')
  }, [open, initial])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const payload = {
      name: name.trim(),
      description: description.trim(),
      status,
      stack: stack
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    }
    if (initial) updateProject(initial.id, payload)
    else addProject(payload)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit project' : 'New project'}
      index={initial ? 'Edit' : 'Create'}
    >
      <FormGrid onSubmit={submit}>
        <Field label="Name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Description">
          <TextArea value={description} onChange={(e) => setDescription(e.target.value)} />
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
        <Field label="Stack (comma separated)">
          <TextInput
            value={stack}
            onChange={(e) => setStack(e.target.value)}
            placeholder="Next.js, Postgres, Redis"
          />
        </Field>
        <FormActions onCancel={onClose} submitLabel={initial ? 'Update' : 'Add project'} />
      </FormGrid>
    </Modal>
  )
}

export function ApplicationFormModal({
  open,
  onClose,
  initial,
  defaultProjectId = '',
}: {
  open: boolean
  onClose: () => void
  initial?: Application | null
  defaultProjectId?: string
}) {
  const { addApplication, updateApplication, projects } = useStore()
  const [name, setName] = useState('')
  const [projectId, setProjectId] = useState('')
  const [type, setType] = useState<Application['type']>('web')
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<Status>('online')
  const [version, setVersion] = useState('1.0.0')
  const [latencyMs, setLatencyMs] = useState('0')
  const [deploys, setDeploys] = useState('0')

  useEffect(() => {
    if (!open) return
    setName(initial?.name ?? '')
    setProjectId(initial?.projectId ?? defaultProjectId)
    setType(initial?.type ?? 'web')
    setUrl(initial?.url ?? '')
    setStatus(initial?.status ?? 'online')
    setVersion(initial?.version ?? '1.0.0')
    setLatencyMs(String(initial?.latencyMs ?? 0))
    setDeploys(String(initial?.deploys ?? 0))
  }, [open, initial, defaultProjectId])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!projectId) return
    const payload = {
      name: name.trim(),
      projectId,
      type,
      url: url.trim() || undefined,
      status,
      version: version.trim() || '1.0.0',
      latencyMs: Number(latencyMs) || 0,
      deploys: Number(deploys) || 0,
    }
    if (initial) updateApplication(initial.id, payload)
    else addApplication(payload)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit application' : 'New application'}
      index={initial ? 'Edit' : 'Create'}
    >
      {projects.length === 0 ? (
        <p className="text-sm text-mute">Avval loyiha yarating.</p>
      ) : (
        <FormGrid onSubmit={submit}>
          <Field label="Name">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Project">
            <ProjectSelect value={projectId} onChange={setProjectId} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type">
              <TextSelect
                value={type}
                onChange={(e) => setType(e.target.value as Application['type'])}
              >
                <option value="web">web</option>
                <option value="api">api</option>
                <option value="worker">worker</option>
                <option value="mobile">mobile</option>
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
          <Field label="URL">
            <TextInput
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Version">
              <TextInput value={version} onChange={(e) => setVersion(e.target.value)} />
            </Field>
            <Field label="Latency (ms)">
              <TextInput
                type="number"
                min={0}
                value={latencyMs}
                onChange={(e) => setLatencyMs(e.target.value)}
              />
            </Field>
            <Field label="Deploys">
              <TextInput
                type="number"
                min={0}
                value={deploys}
                onChange={(e) => setDeploys(e.target.value)}
              />
            </Field>
          </div>
          <FormActions onCancel={onClose} submitLabel={initial ? 'Update' : 'Add app'} />
        </FormGrid>
      )}
    </Modal>
  )
}

export function DomainFormModal({
  open,
  onClose,
  initial,
  defaultProjectId = '',
}: {
  open: boolean
  onClose: () => void
  initial?: Domain | null
  defaultProjectId?: string
}) {
  const { addDomain, updateDomain, projects } = useStore()
  const [name, setName] = useState('')
  const [projectId, setProjectId] = useState('')
  const [registrar, setRegistrar] = useState('')
  const [ssl, setSsl] = useState<Domain['ssl']>('valid')
  const [expiresAt, setExpiresAt] = useState('')
  const [dns, setDns] = useState<Domain['dns']>('ok')
  const [status, setStatus] = useState<Status>('active')

  useEffect(() => {
    if (!open) return
    setName(initial?.name ?? '')
    setProjectId(initial?.projectId ?? defaultProjectId)
    setRegistrar(initial?.registrar ?? '')
    setSsl(initial?.ssl ?? 'valid')
    setExpiresAt(initial?.expiresAt ?? '')
    setDns(initial?.dns ?? 'ok')
    setStatus(initial?.status ?? 'active')
  }, [open, initial, defaultProjectId])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!projectId) return
    const payload = {
      name: name.trim(),
      projectId,
      registrar: registrar.trim(),
      ssl,
      expiresAt: expiresAt.trim() || '—',
      dns,
      status,
    }
    if (initial) updateDomain(initial.id, payload)
    else addDomain(payload)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit domain' : 'New domain'}
      index={initial ? 'Edit' : 'Create'}
    >
      {projects.length === 0 ? (
        <p className="text-sm text-mute">Avval loyiha yarating.</p>
      ) : (
        <FormGrid onSubmit={submit}>
          <Field label="Domain">
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="example.uz"
              required
            />
          </Field>
          <Field label="Project">
            <ProjectSelect value={projectId} onChange={setProjectId} />
          </Field>
          <Field label="Registrar">
            <TextInput value={registrar} onChange={(e) => setRegistrar(e.target.value)} required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="SSL">
              <TextSelect value={ssl} onChange={(e) => setSsl(e.target.value as Domain['ssl'])}>
                <option value="valid">valid</option>
                <option value="expiring">expiring</option>
                <option value="none">none</option>
              </TextSelect>
            </Field>
            <Field label="DNS">
              <TextSelect value={dns} onChange={(e) => setDns(e.target.value as Domain['dns'])}>
                <option value="ok">ok</option>
                <option value="warn">warn</option>
                <option value="error">error</option>
              </TextSelect>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Expires">
              <TextInput
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
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
          <FormActions onCancel={onClose} submitLabel={initial ? 'Update' : 'Add domain'} />
        </FormGrid>
      )}
    </Modal>
  )
}

export function ServerFormModal({
  open,
  onClose,
  initial,
  defaultProjectId = '',
}: {
  open: boolean
  onClose: () => void
  initial?: Server | null
  defaultProjectId?: string
}) {
  const { addServer, updateServer, projects } = useStore()
  const [name, setName] = useState('')
  const [projectId, setProjectId] = useState('')
  const [provider, setProvider] = useState('')
  const [region, setRegion] = useState('')
  const [ip, setIp] = useState('')
  const [status, setStatus] = useState<Status>('online')
  const [cpu, setCpu] = useState('0')
  const [ram, setRam] = useState('0')
  const [disk, setDisk] = useState('0')
  const [uptime, setUptime] = useState('')

  useEffect(() => {
    if (!open) return
    setName(initial?.name ?? '')
    setProjectId(initial?.projectId ?? defaultProjectId)
    setProvider(initial?.provider ?? '')
    setRegion(initial?.region ?? '')
    setIp(initial?.ip ?? '')
    setStatus(initial?.status ?? 'online')
    setCpu(String(initial?.cpu ?? 0))
    setRam(String(initial?.ram ?? 0))
    setDisk(String(initial?.disk ?? 0))
    setUptime(initial?.uptime ?? '')
  }, [open, initial, defaultProjectId])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!projectId) return
    const payload = {
      name: name.trim(),
      projectId,
      provider: provider.trim(),
      region: region.trim(),
      ip: ip.trim(),
      status,
      cpu: Math.min(100, Math.max(0, Number(cpu) || 0)),
      ram: Math.min(100, Math.max(0, Number(ram) || 0)),
      disk: Math.min(100, Math.max(0, Number(disk) || 0)),
      uptime: uptime.trim() || '—',
    }
    if (initial) updateServer(initial.id, payload)
    else addServer(payload)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit server' : 'New server'}
      index={initial ? 'Edit' : 'Create'}
    >
      {projects.length === 0 ? (
        <p className="text-sm text-mute">Avval loyiha yarating.</p>
      ) : (
        <FormGrid onSubmit={submit}>
          <Field label="Name">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Project">
            <ProjectSelect value={projectId} onChange={setProjectId} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Provider">
              <TextInput value={provider} onChange={(e) => setProvider(e.target.value)} required />
            </Field>
            <Field label="Region">
              <TextInput value={region} onChange={(e) => setRegion(e.target.value)} required />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="IP">
              <TextInput value={ip} onChange={(e) => setIp(e.target.value)} required />
            </Field>
            <Field label="Uptime">
              <TextInput
                value={uptime}
                onChange={(e) => setUptime(e.target.value)}
                placeholder="47 kun"
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="CPU %">
              <TextInput type="number" min={0} max={100} value={cpu} onChange={(e) => setCpu(e.target.value)} />
            </Field>
            <Field label="RAM %">
              <TextInput type="number" min={0} max={100} value={ram} onChange={(e) => setRam(e.target.value)} />
            </Field>
            <Field label="Disk %">
              <TextInput type="number" min={0} max={100} value={disk} onChange={(e) => setDisk(e.target.value)} />
            </Field>
          </div>
          <Field label="Status">
            <TextSelect value={status} onChange={(e) => setStatus(e.target.value as Status)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </TextSelect>
          </Field>
          <FormActions onCancel={onClose} submitLabel={initial ? 'Update' : 'Add server'} />
        </FormGrid>
      )}
    </Modal>
  )
}

export function IntegrationFormModal({
  open,
  onClose,
  initial,
  defaultProjectId = '',
}: {
  open: boolean
  onClose: () => void
  initial?: Integration | null
  defaultProjectId?: string
}) {
  const { addIntegration, updateIntegration, projects } = useStore()
  const [name, setName] = useState('')
  const [provider, setProvider] = useState('')
  const [projectId, setProjectId] = useState('')
  const [category, setCategory] = useState<Integration['category']>('git')
  const [status, setStatus] = useState<Status>('active')
  const [connectedAt, setConnectedAt] = useState('')

  useEffect(() => {
    if (!open) return
    setName(initial?.name ?? '')
    setProvider(initial?.provider ?? '')
    setProjectId(initial?.projectId ?? defaultProjectId)
    setCategory(initial?.category ?? 'git')
    setStatus(initial?.status ?? 'active')
    setConnectedAt(initial?.connectedAt ?? new Date().toISOString().slice(0, 10))
  }, [open, initial, defaultProjectId])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!projectId) return
    const payload = {
      name: name.trim(),
      provider: provider.trim() || name.trim().toLowerCase(),
      projectId,
      category,
      status,
      connectedAt: connectedAt.trim(),
    }
    if (initial) updateIntegration(initial.id, payload)
    else addIntegration(payload)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit integration' : 'New integration'}
      index={initial ? 'Edit' : 'Create'}
    >
      {projects.length === 0 ? (
        <p className="text-sm text-mute">Avval loyiha yarating.</p>
      ) : (
        <FormGrid onSubmit={submit}>
          <Field label="Name">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Provider key">
            <TextInput
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="github"
            />
          </Field>
          <Field label="Project">
            <ProjectSelect value={projectId} onChange={setProjectId} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category">
              <TextSelect
                value={category}
                onChange={(e) => setCategory(e.target.value as Integration['category'])}
              >
                <option value="git">git</option>
                <option value="payment">payment</option>
                <option value="analytics">analytics</option>
                <option value="storage">storage</option>
                <option value="auth">auth</option>
                <option value="email">email</option>
                <option value="ci">ci</option>
                <option value="sms">sms</option>
                <option value="pos">pos</option>
                <option value="ai">ai</option>
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
          <Field label="Connected at">
            <TextInput
              type="date"
              value={connectedAt}
              onChange={(e) => setConnectedAt(e.target.value)}
            />
          </Field>
          <FormActions onCancel={onClose} submitLabel={initial ? 'Update' : 'Add integration'} />
        </FormGrid>
      )}
    </Modal>
  )
}
