import dns from 'node:dns/promises'
import fs from 'node:fs/promises'
import http from 'node:http'
import net from 'node:net'
import path from 'node:path'
import tls from 'node:tls'
import { fileURLToPath } from 'node:url'
import { agentFromAuthHeader, initMetrics, recordReport, serverStatuses } from './metrics.mjs'

const PORT = Number(process.env.PORT ?? 8790)
const HOST = process.env.HOST ?? '127.0.0.1'
const DATA_DIR =
  process.env.DATA_DIR ?? path.join(path.dirname(fileURLToPath(import.meta.url)), 'data')
const DATA_FILE = path.join(DATA_DIR, 'domain-status.json')

const DAY_MS = 24 * 60 * 60 * 1000
const STALE_SCAN_INTERVAL_MS = 60 * 60 * 1000
const DOMAIN_WARN_DAYS = 30
const SSL_WARN_DAYS = 14
const MAX_DOMAINS_PER_REQUEST = 100
const MAX_WATCHED = 500
const MAX_BODY_BYTES = 64 * 1024
const CONCURRENCY = 4
const HOSTNAME_RE = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/

const WHOIS_SERVERS = { uz: 'whois.cctld.uz' }
const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}
const EXPIRY_PATTERNS = [
  /Registry Expiry Date:\s*(.+)/i,
  /Registrar Registration Expiration Date:\s*(.+)/i,
  /Expiration Date:\s*(.+)/i,
  /Expiry Date:\s*(.+)/i,
  /paid-till:\s*(.+)/i,
  /expires:\s*(.+)/i,
]
const REGISTRAR_PATTERNS = [/^\s*Registrar:\s*(.+)$/im, /^\s*registrar:\s*(.+)$/im]

/** @type {{ domains: Record<string, any> }} */
let state = { domains: {} }
const inflight = new Map()

async function loadState() {
  try {
    state = JSON.parse(await fs.readFile(DATA_FILE, 'utf8'))
    state.domains ??= {}
  } catch {
    state = { domains: {} }
  }
}

let saveChain = Promise.resolve()
function saveState() {
  saveChain = saveChain.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true })
    const tmp = `${DATA_FILE}.tmp`
    await fs.writeFile(tmp, JSON.stringify(state, null, 2))
    await fs.rename(tmp, DATA_FILE)
  })
  return saveChain
}

function whoisQuery(server, query) {
  return new Promise((resolve, reject) => {
    const chunks = []
    const socket = net.connect({ host: server, port: 43 })
    socket.setTimeout(15_000)
    socket.on('connect', () => socket.write(`${query}\r\n`))
    socket.on('data', (chunk) => chunks.push(chunk))
    socket.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    socket.on('timeout', () => socket.destroy(new Error(`${server} timed out`)))
    socket.on('error', reject)
  })
}

const whoisServerCache = new Map()
async function whoisServerFor(tld) {
  if (WHOIS_SERVERS[tld]) return WHOIS_SERVERS[tld]
  if (!whoisServerCache.has(tld)) {
    whoisServerCache.set(
      tld,
      whoisQuery('whois.iana.org', tld).then((text) => {
        const match = text.match(/^whois:\s*(\S+)/im)
        if (!match) throw new Error(`no WHOIS server for .${tld}`)
        return match[1]
      }),
    )
  }
  return whoisServerCache.get(tld)
}

function rootDomainOf(name) {
  return name.split('.').slice(-2).join('.')
}

function toIsoDate(value) {
  if (!value) return undefined
  const text = value.trim()
  const dmy = text.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})/)
  if (dmy) {
    const month = MONTHS[dmy[2].toLowerCase()]
    if (month === undefined) return undefined
    return new Date(Date.UTC(Number(dmy[3]), month, Number(dmy[1]))).toISOString().slice(0, 10)
  }
  const parsed = Date.parse(text)
  return Number.isNaN(parsed) ? undefined : new Date(parsed).toISOString().slice(0, 10)
}

function firstMatch(patterns, text) {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1].trim()
  }
  return undefined
}

async function lookupWhois(root) {
  const tld = root.split('.').pop()
  const text = await whoisQuery(await whoisServerFor(tld), root)
  return {
    registrar: firstMatch(REGISTRAR_PATTERNS, text),
    expiresAt: toIsoDate(firstMatch(EXPIRY_PATTERNS, text)),
  }
}

function daysUntil(isoDate, now) {
  if (!isoDate) return undefined
  return Math.floor((Date.parse(isoDate) - now) / DAY_MS)
}

function checkSsl(host) {
  return new Promise((resolve) => {
    const socket = tls.connect({ host, port: 443, servername: host, rejectUnauthorized: false })
    socket.setTimeout(10_000)
    socket.on('secureConnect', () => {
      const cert = socket.getPeerCertificate()
      const validTo = cert?.valid_to ? toIsoDate(cert.valid_to) : undefined
      const result = socket.authorized
        ? { sslExpiresAt: validTo }
        : { sslExpiresAt: validTo, invalid: true, error: `SSL: ${socket.authorizationError}` }
      socket.end()
      resolve(result)
    })
    socket.on('timeout', () => {
      socket.destroy()
      resolve({ none: true, error: 'SSL: port 443 timed out' })
    })
    socket.on('error', (err) => resolve({ none: true, error: `SSL: ${err.code ?? err.message}` }))
  })
}

async function checkDomain(name, whoisCache) {
  const now = Date.now()
  const root = rootDomainOf(name)
  const errors = []

  let dnsState = 'ok'
  try {
    await dns.lookup(name)
  } catch (err) {
    dnsState = 'error'
    errors.push(`DNS: ${err.code ?? err.message}`)
  }

  if (!whoisCache.has(root)) {
    whoisCache.set(
      root,
      lookupWhois(root).catch((err) => ({ error: `WHOIS: ${err.message}` })),
    )
  }
  const whois = await whoisCache.get(root)
  if (whois.error) errors.push(whois.error)

  const sslResult = dnsState === 'ok' ? await checkSsl(name) : { none: true }
  if (sslResult.error) errors.push(sslResult.error)

  const sslDays = daysUntil(sslResult.sslExpiresAt, now)
  const ssl = sslResult.none
    ? 'none'
    : sslResult.invalid || (sslDays !== undefined && sslDays < 0)
      ? 'invalid'
      : sslDays !== undefined && sslDays <= SSL_WARN_DAYS
        ? 'expiring'
        : 'valid'

  const domainDays = daysUntil(whois.expiresAt, now)
  const status =
    dnsState === 'error' || (domainDays !== undefined && domainDays < 0)
      ? 'offline'
      : ssl === 'invalid'
        ? 'degraded'
        : (domainDays !== undefined && domainDays <= DOMAIN_WARN_DAYS) || ssl === 'expiring'
          ? 'expiring'
          : 'active'

  return {
    name,
    rootDomain: root,
    checkedAt: new Date(now).toISOString(),
    registrar: whois.registrar,
    expiresAt: whois.expiresAt,
    sslExpiresAt: sslResult.sslExpiresAt,
    ssl,
    dns: dnsState,
    status,
    error: errors.length ? errors.join('; ') : undefined,
  }
}

async function mapLimit(items, limit, fn) {
  const results = []
  let next = 0
  async function worker() {
    while (next < items.length) {
      const index = next++
      results[index] = await fn(items[index])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

async function checkMany(names) {
  const whoisCache = new Map()
  await mapLimit(names, CONCURRENCY, (name) => {
    if (!inflight.has(name)) {
      inflight.set(
        name,
        checkDomain(name, whoisCache)
          .then((result) => {
            state.domains[name] = result
          })
          .finally(() => inflight.delete(name)),
      )
    }
    return inflight.get(name)
  })
  await saveState()
}

function normalizeNames(input) {
  if (!Array.isArray(input)) throw new HttpError(400, 'domains must be an array')
  const names = [
    ...new Set(
      input
        .filter((v) => typeof v === 'string')
        .map((v) => v.trim().toLowerCase().replace(/\.$/, '')),
    ),
  ].filter((v) => HOSTNAME_RE.test(v))
  if (names.length > MAX_DOMAINS_PER_REQUEST) {
    throw new HttpError(400, `at most ${MAX_DOMAINS_PER_REQUEST} domains per request`)
  }
  const unknown = names.filter((n) => !state.domains[n])
  if (Object.keys(state.domains).length + unknown.length > MAX_WATCHED) {
    throw new HttpError(400, 'watch list is full')
  }
  return names
}

function pick(names) {
  return Object.fromEntries(names.filter((n) => state.domains[n]).map((n) => [n, state.domains[n]]))
}

async function checkStale() {
  const now = Date.now()
  const stale = Object.values(state.domains)
    .filter((d) => !d.checkedAt || now - Date.parse(d.checkedAt) >= DAY_MS)
    .map((d) => d.name)
  if (stale.length) {
    console.log(`[meridian-api] daily check: ${stale.length} domains`)
    await checkMany(stale)
  }
}

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new HttpError(413, 'body too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {})
      } catch {
        reject(new HttpError(400, 'invalid JSON'))
      }
    })
    req.on('error', reject)
  })
}

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(body))
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost')

    if (req.method === 'GET' && url.pathname === '/api/health') {
      return send(res, 200, { ok: true, watched: Object.keys(state.domains).length })
    }

    if (req.method === 'POST' && url.pathname === '/api/domains/status') {
      const names = normalizeNames((await readJson(req)).domains)
      const unchecked = names.filter((n) => !state.domains[n])
      if (unchecked.length) await checkMany(unchecked)
      return send(res, 200, { results: pick(names) })
    }

    if (req.method === 'POST' && url.pathname === '/api/domains/refresh') {
      const names = normalizeNames((await readJson(req)).domains)
      await checkMany(names)
      return send(res, 200, { results: pick(names) })
    }

    if (req.method === 'GET' && url.pathname === '/api/servers/status') {
      return send(res, 200, { servers: serverStatuses() })
    }

    if (req.method === 'POST' && url.pathname === '/api/agent/report') {
      const serverId = agentFromAuthHeader(req.headers.authorization)
      if (!serverId) throw new HttpError(401, 'invalid agent token')
      recordReport(serverId, await readJson(req))
      return send(res, 200, { ok: true })
    }

    send(res, 404, { error: 'not found' })
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500
    if (status === 500) console.error('[meridian-api]', err)
    send(res, status, { error: err.message })
  }
})

await loadState()
await initMetrics(DATA_DIR)
server.listen(PORT, HOST, () => {
  console.log(`[meridian-api] listening on http://${HOST}:${PORT} (data: ${DATA_FILE})`)
})
setTimeout(() => void checkStale().catch(console.error), 5_000)
setInterval(() => void checkStale().catch(console.error), STALE_SCAN_INTERVAL_MS)
