import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const OFFLINE_AFTER_MS = 3 * 60_000
const SELF_INTERVAL_MS = 60_000
const HIGH_USAGE = 90
const MAX_SERVERS = 100

const SELF_SERVER_ID = process.env.SELF_SERVER_ID
const SELF_NAME = process.env.SELF_SERVER_NAME ?? 'meridian-host'

/** @type {Record<string, any>} */
let reports = {}
/** @type {Map<string, Buffer>} serverId -> sha256(token) */
let agentTokens = new Map()
let dataFile = ''
let saveChain = Promise.resolve()

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest()
}

function agentsFile(dataDir) {
  if (process.env.CREDENTIALS_DIRECTORY) {
    return path.join(process.env.CREDENTIALS_DIRECTORY, 'agents')
  }
  return process.env.AGENTS_FILE ?? path.join(dataDir, 'agents.json')
}

async function loadAgents(dataDir) {
  try {
    const parsed = JSON.parse(await fs.readFile(agentsFile(dataDir), 'utf8'))
    agentTokens = new Map(
      Object.entries(parsed)
        .filter(([, token]) => typeof token === 'string' && token.length >= 32)
        .map(([id, token]) => [id, sha256(token)]),
    )
  } catch {
    agentTokens = new Map()
  }
}

export function agentFromAuthHeader(header) {
  const match = /^Bearer\s+(\S+)$/.exec(header ?? '')
  if (!match) return null
  const digest = sha256(match[1])
  for (const [id, expected] of agentTokens) {
    if (crypto.timingSafeEqual(digest, expected)) return id
  }
  return null
}

function num(value, max) {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? Math.min(n, max) : undefined
}

function text(value, max = 120) {
  return typeof value === 'string' ? value.replace(/[\u0000-\u001f]/g, '').slice(0, max) : undefined
}

function percent(used, total) {
  return used !== undefined && total ? Math.round((used / total) * 100) : undefined
}

function normalizeReport(serverId, body) {
  const memTotalKb = num(body.memTotalKb, 1e12)
  const memAvailableKb = num(body.memAvailableKb, 1e12)
  const diskTotalKb = num(body.diskTotalKb, 1e15)
  const diskUsedKb = num(body.diskUsedKb, 1e15)
  const memUsedKb =
    memTotalKb !== undefined && memAvailableKb !== undefined
      ? Math.max(memTotalKb - memAvailableKb, 0)
      : undefined
  const load = Array.isArray(body.load) ? body.load.slice(0, 3).map((v) => num(v, 1e4) ?? 0) : undefined
  return {
    serverId,
    name: text(body.name, 80),
    hostname: text(body.hostname, 120),
    os: text(body.os),
    kernel: text(body.kernel),
    cores: num(body.cores, 4096),
    cpu: Math.round(num(body.cpu, 100) ?? 0),
    memTotalKb,
    memUsedKb,
    ram: percent(memUsedKb, memTotalKb) ?? 0,
    diskTotalKb,
    diskUsedKb,
    disk: percent(diskUsedKb, diskTotalKb) ?? 0,
    load,
    uptimeSec: num(body.uptimeSec, 1e10),
    containers: num(body.containers, 1e5),
    reportedAt: new Date().toISOString(),
  }
}

function save() {
  saveChain = saveChain
    .then(async () => {
      await fs.mkdir(path.dirname(dataFile), { recursive: true })
      const tmp = `${dataFile}.tmp`
      await fs.writeFile(tmp, JSON.stringify(reports, null, 2))
      await fs.rename(tmp, dataFile)
    })
    .catch((err) => console.error('[meridian-api] save servers', err))
  return saveChain
}

export function recordReport(serverId, body) {
  if (!reports[serverId] && Object.keys(reports).length >= MAX_SERVERS) return
  reports[serverId] = normalizeReport(serverId, body ?? {})
  void save()
}

function statusOf(report, now) {
  if (now - Date.parse(report.reportedAt) > OFFLINE_AFTER_MS) return 'offline'
  if (report.cpu >= HIGH_USAGE || report.ram >= HIGH_USAGE || report.disk >= HIGH_USAGE) {
    return 'degraded'
  }
  return 'online'
}

export function serverStatuses() {
  const now = Date.now()
  return Object.fromEntries(
    Object.entries(reports).map(([id, report]) => [id, { ...report, status: statusOf(report, now) }]),
  )
}

async function readOsName() {
  try {
    const release = await fs.readFile('/etc/os-release', 'utf8')
    return /^PRETTY_NAME="?([^"\n]+)"?/m.exec(release)?.[1]
  } catch {
    return `${os.type()} ${os.release()}`
  }
}

function cpuTimes() {
  return os.cpus().reduce(
    (acc, cpu) => {
      const t = cpu.times
      acc.idle += t.idle
      acc.total += t.user + t.nice + t.sys + t.idle + t.irq
      return acc
    },
    { idle: 0, total: 0 },
  )
}

async function memAvailableKb() {
  try {
    const info = await fs.readFile('/proc/meminfo', 'utf8')
    const match = /^MemAvailable:\s+(\d+)\s+kB/m.exec(info)
    if (match) return Number(match[1])
  } catch {
    // not Linux
  }
  return os.freemem() / 1024
}

let lastCpu = cpuTimes()
async function collectSelf() {
  const current = cpuTimes()
  const totalDelta = current.total - lastCpu.total
  const cpu = totalDelta > 0 ? 100 * (1 - (current.idle - lastCpu.idle) / totalDelta) : 0
  lastCpu = current

  const disk = await fs.statfs('/').catch(() => null)
  const diskTotalKb = disk ? (disk.blocks * disk.bsize) / 1024 : undefined
  const diskUsedKb = disk ? ((disk.blocks - disk.bfree) * disk.bsize) / 1024 : undefined

  recordReport(SELF_SERVER_ID, {
    name: SELF_NAME,
    hostname: os.hostname(),
    os: await readOsName(),
    kernel: os.release(),
    cores: os.cpus().length,
    cpu,
    memTotalKb: os.totalmem() / 1024,
    memAvailableKb: await memAvailableKb(),
    diskTotalKb,
    diskUsedKb,
    load: os.loadavg(),
    uptimeSec: os.uptime(),
  })
}

export async function initMetrics(dataDir) {
  dataFile = path.join(dataDir, 'servers.json')
  try {
    reports = JSON.parse(await fs.readFile(dataFile, 'utf8'))
  } catch {
    reports = {}
  }
  await loadAgents(dataDir)
  console.log(`[meridian-api] agents configured: ${agentTokens.size}`)
  if (!SELF_SERVER_ID) return
  setTimeout(() => void collectSelf().catch(console.error), 2_000)
  setInterval(() => void collectSelf().catch(console.error), SELF_INTERVAL_MS)
}
