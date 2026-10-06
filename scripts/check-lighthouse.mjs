// THE LIGHTHOUSE MOBILE GATE — `npm run check:lighthouse` (PLAN P5.3; PLAN §1 item 10)
//
// Runs Lighthouse 12 (mobile preset: mobile form factor, Moto-G-class screen emulation, simulated
// slow-4G throttling) against the PRODUCTION build served with GitHub Pages semantics at the
// project base `/hygieia/` (e2e/support/pages-server.mjs, the same server the e2e suite uses) for
// every route in e2e/support/routes.ts, and fails when a category score is below threshold:
//
//   performance     >= 85   (locally AND in CI — one bar, no tolerance; ADR-0006, below)
//   accessibility   >= 90
//   best-practices  >= 90
//   seo             informational only (printed, never gating; a project site under a user's
//                   github.io has no robots/sitemap story of its own)
//
// Lighthouse 12 removed the PWA category, so the spec's "PWA/perf >= 90" is encoded as the three
// thresholds above; installability stays `npm run check:pwa` (manifest, icons, service worker).
//
// COLD FIRST VISIT, BY CONSTRUCTION (ADR-0006, DECISIONS.md 2026-10-06). Every audit runs with
// Lighthouse's `blockedUrlPatterns` set to BLOCKED_URL_PATTERNS (`*/registerSW.js`, `*/sw.js`), so
// the service worker never registers during an audit and every byte the page needs comes over the
// (simulated slow-4G) network. Why: with the SW allowed, it installs ~300 ms into the audit and the
// route's lazily-imported seed chunks requested AFTER that moment are served from its precache
// (transferSize 0 in the LHR) — LCP 2.9 s, performance 91 — while the same chunks served from the
// network give LCP 3.5 s and 87. Which side of the race a run lands on is decided inside the
// audit, not by the artifact: P5/P6 QA saw 3 of 7 runs red on an unchanged build. A gate must be a
// function of the artifact alone, so the gate measures the cold visit — the honest first-visit
// number of every content route today, 87–88 — and its performance bar is set at that measured
// cold floor, 85, identical locally and in CI (a deterministic measurement needs no CI
// tolerance; if shared runners measure lower, the gate says so honestly instead of hiding it
// behind −5). 90 performance remains the recorded TARGET (PLAN §1 item 10; levers: seed bytes
// behind LCP on content routes, server-side content once configured mode ships). Accessibility
// and best-practices are deterministic checklists and keep 90. Every LHR is checked for the cold
// property (`verifyColdVisit`): `sw.js` never requested, `registerSW.js` never delivered, every
// `/assets/*.js` request with a non-zero transferSize; a run where the SW got through is NOT a
// valid measurement and exits 2, not 0 or 1. (Lighthouse 12 carries no `service-worker` audit and
// no `fromServiceWorker` flag on `network-requests` items, so transferSize is the signal.) The
// offline / repeat-visit behaviour of the SW stays proven by `npm run e2e` (offline.spec.ts).
// Determinism proof (documented, not scripted — run after a fresh `npm run build`):
//   for i in 1 2 3; do npm run check:lighthouse || echo "RUN $i FAILED"; done
// The three tables must agree within ±1 on every cell.
//
// Chrome: CHROME_PATH, else PLAYWRIGHT_CHROMIUM, else the FULL Chromium Playwright installed
// (`@playwright/test` → chromium.executablePath()), else Playwright's headless shell, whose binary
// lives next to the full build's path (`chromium_headless_shell-<rev>/chrome-headless-shell-<platform>/
// chrome-headless-shell`). The full build is preferred on purpose: on ubuntu-latest the shell driven
// by chrome-launcher never exposed its DevTools port (`waiting for dynamic debugging port in
// chrome-err.log`, exit 2 — P5.3 follow-up), so CI now installs the full build too
// (`playwright install --with-deps chromium`, which brings the shell along for the e2e suite) and
// the shell stays a local fallback for a machine that only has `--only-shell`.
//
// Chrome flags (`chromeFlags`): headless, no first-run / default-browser prompts, no GPU. Under
// `CI` two more: `--no-sandbox` — Chrome's sandbox wants unprivileged user namespaces, which the
// hardened kernels/AppArmor of GitHub-hosted runners (Ubuntu 24.04+) can refuse, and then Chrome
// exits before the port is ever opened — and `--disable-dev-shm-usage`, because `/dev/shm` is tiny
// on containerised runners and a renderer that fills it crashes mid-audit. Neither is set locally
// (`--no-sandbox` weakens isolation and a developer machine does not need either).
//
// Startup self-check: the resolved binary and flags are printed before the first launch, and a
// launch failure dumps the last CHROME_ERR_TAIL lines of chrome-launcher's `chrome-err.log` (the
// temp profile is created here so its path is known), so the next CI failure is diagnosable from
// the job log instead of needing a reproduction.
//
// The audit server reuses pages-server's `resolveRequest` (a file, else the 301 for a directory,
// else 404.html; outside the base a plain 404), with two deliberate differences from the e2e
// server, both to make the audit measure what a visitor of the DEPLOYED site experiences:
//
//   1. Text responses are gzip-compressed when the browser accepts it, because GitHub Pages
//      serves text gzipped and the e2e server does not; on the uncompressed 500 kB bundle
//      Lighthouse's simulation reports ~1.9 s more LCP than production ever sees.
//   2. The deep-link fallback (404.html, a byte copy of index.html) is served with STATUS 200.
//      Pages answers a deep link with status 404 (PLAN §4; the e2e suite asserts exactly that) and
//      Lighthouse refuses to audit an errored document (ERRORED_DOCUMENT_REQUEST: no scores at
//      all), so every route but `/hygieia/` would be un-auditable. The bytes are identical; only
//      the status differs. The 404 contract itself stays proven by `npm run e2e`.
//
// Output: a table `route · perf · a11y · bp · seo`, then `lighthouse-report/<name>.html` and
// `<name>.json` per route (gitignored; CI uploads the directory as an artifact). On failure, each
// failing route/category is named with its top 3 failing audits (highest weight first).
//
// Exit codes: 0 every route at or above every threshold · 1 at least one below (or a category that
// produced no score) · 2 setup or run failed (no Chrome, build failed, port 4175 taken, or an audit
// that was not a cold visit — see `verifyColdVisit`). The CLI sets `process.exitCode` and never
// calls `process.exit()`.
//
// Usage: node scripts/check-lighthouse.mjs [--build]   (builds when dist/index.html is missing, or
// always with --build; the build is local-only: the Supabase env names are blanked like
// playwright.config.ts does, and the fonts are self-hosted (src/index.css, P5.3), so no request
// leaves the machine: every byte comes from the audit server over the simulated network).

import { spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { ROUTES, ROUTE_BASE } from '../e2e/support/routes.ts'
import { resolveRequest } from '../e2e/support/pages-server.mjs'

/**
 * @typedef {'performance' | 'accessibility' | 'best-practices' | 'seo'} Category
 * @typedef {{ path: string, name: string }} Route
 * @typedef {Record<Category, number | null>} Scores
 * @typedef {{ id: string, title: string, score: number, weight: number, displayValue: string }} FailingAudit
 * @typedef {{ scores: Scores, failingAudits: Record<Category, FailingAudit[]> }} Summary
 * @typedef {{ route: Route, category: Category, score: number | null, threshold: number }} Failure
 * @typedef {{ log: (line: string) => void, error: (line: string) => void, env: NodeJS.ProcessEnv }} Io
 */

export const ROOT = fileURLToPath(new URL('..', import.meta.url))
export const DIST = path.join(ROOT, 'dist')
export const REPORT_DIR = path.join(ROOT, 'lighthouse-report')
export const PORT = 4175
export const BASE = ROUTE_BASE

/** @type {readonly Category[]} */
export const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo']

/**
 * Gating thresholds (0–100), the same locally and in CI. `seo` is absent on purpose:
 * informational. Performance 85 = the measured cold-visit floor (ADR-0006, header); 90 is the target.
 */
export const THRESHOLDS = Object.freeze({
  performance: 85,
  accessibility: 90,
  'best-practices': 90,
})

/** The target the artifact is still working towards on performance (PLAN §1 item 10). Not gating. */
export const PERFORMANCE_TARGET = 90

/**
 * Lighthouse `blockedUrlPatterns` for every audit: the service-worker registration script and the
 * worker itself (vite-plugin-pwa emits both at the Pages base). Blocked → no SW during an audit →
 * a cold first visit by construction (header: why). Patterns are Chrome `Network.setBlockedURLs`
 * wildcards.
 */
export const BLOCKED_URL_PATTERNS = Object.freeze(['*/registerSW.js', '*/sw.js'])

/** The startup line that names the measurement mode (header). */
export const MODE_LINE = `mode: cold first visit (service worker blocked: ${BLOCKED_URL_PATTERNS.join(', ')})`

/** How many failing audits to name per failing route/category. */
export const TOP_AUDITS = 3

/** How many trailing lines of chrome-err.log a launch failure reports. */
export const CHROME_ERR_TAIL = 20

/** Flags every launch gets (a fresh temp profile is added per launch by `launchChrome`). */
export const BASE_CHROME_FLAGS = Object.freeze([
  '--headless=new',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
])

/** Added under CI only (header: why). */
export const CI_CHROME_FLAGS = Object.freeze(['--no-sandbox', '--disable-dev-shm-usage'])

/** Short column labels for the table. */
const LABEL = { performance: 'perf', accessibility: 'a11y', 'best-practices': 'bp', seo: 'seo' }

const NAME_RE = /^[a-z][a-z0-9-]*$/

// --- Pure parts (unit-tested in check-lighthouse.test.ts) -----------------------------------------

/**
 * Validate the route list: a non-empty array of `{ path, name }` where every path starts with the
 * base (`/hygieia/`), every name is kebab-case (it becomes a file name), and both are unique.
 * @param {unknown} list
 * @param {string} [base]
 * @returns {Route[]}
 */
export function parseRoutes(list, base = BASE) {
  if (!Array.isArray(list) || list.length === 0)
    throw new Error('routes: expected a non-empty array')
  const names = new Set()
  const paths = new Set()
  return list.map((entry, i) => {
    if (typeof entry !== 'object' || entry === null) throw new Error(`routes[${i}]: not an object`)
    const { path: p, name } = /** @type {Record<string, unknown>} */ (entry)
    if (typeof p !== 'string' || !p.startsWith(`${base}/`)) {
      throw new Error(`routes[${i}].path: ${JSON.stringify(p)} must start with ${base}/`)
    }
    if (typeof name !== 'string' || !NAME_RE.test(name)) {
      throw new Error(`routes[${i}].name: ${JSON.stringify(name)} must match ${NAME_RE}`)
    }
    if (names.has(name)) throw new Error(`routes[${i}].name: duplicate ${JSON.stringify(name)}`)
    if (paths.has(p)) throw new Error(`routes[${i}].path: duplicate ${JSON.stringify(p)}`)
    names.add(name)
    paths.add(p)
    return { path: p, name }
  })
}

/**
 * Every (route, gating category) pair whose score is below its threshold, or missing (null: the
 * category produced no score, which must not pass silently). `seo` never fails. One set of
 * thresholds everywhere — there is no CI variant (ADR-0006).
 * @param {Array<{ route: Route, scores: Scores }>} results
 * @returns {Failure[]}
 */
export function evaluate(results) {
  /** @type {Failure[]} */
  const failures = []
  for (const { route, scores } of results) {
    for (const category of /** @type {(keyof typeof THRESHOLDS)[]} */ (Object.keys(THRESHOLDS))) {
      const threshold = THRESHOLDS[category]
      const score = scores[category]
      if (score === null || score === undefined || Number.isNaN(score) || score < threshold) {
        failures.push({ route, category, score: score ?? null, threshold })
      }
    }
  }
  return failures
}

/**
 * The Lighthouse flags every audit runs with: mobile preset spelled out (so the gate does not move
 * if Lighthouse's defaults do), the four categories, both report formats, and the service-worker
 * block that makes the audit a cold first visit (header, ADR-0006). Pure, so the test can assert
 * the block is present in what the script actually passes to Lighthouse.
 * @param {{ port: number }} opts
 */
export function lighthouseFlags({ port }) {
  return {
    port,
    output: ['html', 'json'],
    logLevel: 'error',
    onlyCategories: [...CATEGORIES],
    formFactor: 'mobile',
    screenEmulation: {
      mobile: true,
      width: 412,
      height: 823,
      deviceScaleFactor: 1.75,
      disabled: false,
    },
    throttlingMethod: 'simulate',
    blockedUrlPatterns: [...BLOCKED_URL_PATTERNS],
  }
}

/**
 * @typedef {{ url: string, transferSize?: number, statusCode?: number, finished?: boolean }} NetworkItem
 * @typedef {{ ok: true, assets: number } | { ok: false, reasons: string[] }} ColdVerdict
 */

/**
 * Prove from an LHR that the audit was a cold first visit, i.e. the service worker never took part:
 *   - no request for `sw.js` at all (the worker was never fetched);
 *   - `registerSW.js` was never DELIVERED (absent, or blocked: not status 200 / transferSize 0);
 *   - every `/assets/*.js` request (the entry, the route chunk, the lazily-imported seed chunks)
 *     has a non-zero transferSize — the signature of the SW serving a chunk is transferSize 0 with
 *     status 200 (P5/P6 QA's LHR evidence; Lighthouse 12 has no `fromServiceWorker` field).
 * A missing `network-requests` audit is a failure too: no evidence is not evidence.
 * @param {{ audits: Record<string, { details?: { items?: NetworkItem[] } }> }} lhr
 * @returns {ColdVerdict}
 */
export function verifyColdVisit(lhr) {
  const items = lhr.audits['network-requests']?.details?.items
  if (!Array.isArray(items)) return { ok: false, reasons: ['network-requests audit has no items'] }
  /** @type {string[]} */
  const reasons = []
  let assets = 0
  for (const item of items) {
    const file = item.url.split('?')[0].split('/').pop() ?? ''
    if (file === 'sw.js') reasons.push(`sw.js was requested (${item.url})`)
    if (file === 'registerSW.js' && item.statusCode === 200 && (item.transferSize ?? 0) > 0)
      reasons.push(`registerSW.js was delivered (status 200, ${item.transferSize} bytes)`)
    if (/\/assets\/[^/]+\.js$/.test(item.url.split('?')[0])) {
      assets += 1
      if (!((item.transferSize ?? 0) > 0))
        reasons.push(
          `${file} transferSize ${item.transferSize ?? 'missing'} (served by a service worker?)`,
        )
    }
  }
  if (assets === 0) reasons.push('no /assets/*.js request recorded')
  return reasons.length === 0 ? { ok: true, assets } : { ok: false, reasons }
}

/**
 * Lighthouse marks an audit "passed" at score >= 0.9 for numeric audits and == 1 for binary ones;
 * anything else is failing or "needs improvement". Informative / manual / not-applicable / errored
 * audits carry no score and are not failures.
 * @param {{ score: number | null, scoreDisplayMode?: string }} audit
 */
export function isFailingAudit(audit) {
  if (typeof audit.score !== 'number') return false
  if (audit.scoreDisplayMode === 'binary') return audit.score < 1
  if (audit.scoreDisplayMode === 'numeric' || audit.scoreDisplayMode === 'metricSavings')
    return audit.score < 0.9
  return false
}

/**
 * Reduce a Lighthouse result (LHR) to the four 0–100 scores and, per category, the top failing
 * audits (highest weight first, then lowest score), at most TOP_AUDITS.
 * @param {{ categories: Record<string, { score: number | null, auditRefs: Array<{ id: string, weight: number }> }>, audits: Record<string, { title: string, score: number | null, scoreDisplayMode?: string, displayValue?: string }> }} lhr
 * @returns {Summary}
 */
export function summarise(lhr) {
  /** @type {Scores} */
  const scores = { performance: null, accessibility: null, 'best-practices': null, seo: null }
  /** @type {Record<Category, FailingAudit[]>} */
  const failingAudits = { performance: [], accessibility: [], 'best-practices': [], seo: [] }
  for (const category of CATEGORIES) {
    const cat = lhr.categories[category]
    if (!cat) continue
    scores[category] = typeof cat.score === 'number' ? Math.round(cat.score * 100) : null
    failingAudits[category] = cat.auditRefs
      .flatMap((ref) => {
        const audit = lhr.audits[ref.id]
        if (!audit || !isFailingAudit(audit)) return []
        return [
          {
            id: ref.id,
            title: audit.title,
            score: /** @type {number} */ (audit.score),
            weight: ref.weight,
            displayValue: audit.displayValue ?? '',
          },
        ]
      })
      .sort((a, b) => b.weight - a.weight || a.score - b.score || a.id.localeCompare(b.id))
      .slice(0, TOP_AUDITS)
  }
  return { scores, failingAudits }
}

/** @param {number | null} score */
const cell = (score) => (score === null ? '–' : String(score))

/**
 * The table: a header `route · perf · a11y · bp · seo` and one row per route, columns padded.
 * @param {Array<{ route: Route, scores: Scores }>} results
 * @returns {string[]}
 */
export function formatTable(results) {
  const header = ['route', ...CATEGORIES.map((c) => LABEL[c])]
  const rows = results.map(({ route, scores }) => [
    `${route.path} (${route.name})`,
    ...CATEGORIES.map((c) => cell(scores[c])),
  ])
  const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)))
  const line = (/** @type {string[]} */ cols) =>
    cols.map((c, i) => (i === 0 ? c.padEnd(widths[i]) : c.padStart(widths[i]))).join(' · ')
  return [line(header), ...rows.map(line)]
}

/**
 * Lines for one failure: the route and category with its score vs threshold, then the top failing
 * audits for that category.
 * @param {Failure} failure
 * @param {FailingAudit[]} audits
 * @returns {string[]}
 */
export function formatFailure(failure, audits) {
  const { route, category, score, threshold } = failure
  const head =
    score === null
      ? `FAIL  ${route.path} (${route.name}): ${category} produced no score (want >= ${threshold})`
      : `FAIL  ${route.path} (${route.name}): ${category} ${score} < ${threshold}`
  const lines = [head]
  if (audits.length === 0) {
    lines.push('      (no failing audit recorded for this category)')
  } else {
    lines.push(`      top ${audits.length} failing audit(s):`)
    for (const a of audits) {
      const dv = a.displayValue ? ` — ${a.displayValue}` : ''
      lines.push(
        `      - ${a.id} (score ${a.score.toFixed(2)}, weight ${a.weight}): ${a.title}${dv}`,
      )
    }
  }
  return lines
}

/**
 * The chrome-launcher flags for this environment: BASE_CHROME_FLAGS, plus CI_CHROME_FLAGS under CI.
 * @param {{ ci: boolean }} opts
 * @returns {string[]}
 */
export function chromeFlags({ ci }) {
  return ci ? [...BASE_CHROME_FLAGS, ...CI_CHROME_FLAGS] : [...BASE_CHROME_FLAGS]
}

/**
 * The last `n` non-empty lines of `text` (a log tail), in order. Empty text → [].
 * @param {string} text
 * @param {number} [n]
 * @returns {string[]}
 */
export function tailLines(text, n = CHROME_ERR_TAIL) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '')
  return lines.slice(Math.max(0, lines.length - n))
}

/**
 * Where Playwright's headless shell would be, given the full Chromium path it reports:
 * `…/ms-playwright/chromium-<rev>/…/chrome` → `…/ms-playwright/chromium_headless_shell-<rev>`.
 * Pure; null when the path has no `chromium-<rev>` segment.
 * @param {string} fullChromiumPath
 * @returns {string | null}
 */
export function headlessShellDir(fullChromiumPath) {
  const segments = fullChromiumPath.split(/[\\/]/)
  const i = segments.findIndex((s) => /^chromium-\d+$/.test(s))
  if (i < 0) return null
  const sep = fullChromiumPath.includes('\\') ? '\\' : '/'
  return [
    ...segments.slice(0, i),
    segments[i].replace(/^chromium-/, 'chromium_headless_shell-'),
  ].join(sep)
}

/** Content types of what dist/ holds (pages-server keeps its own list private). */
const TYPES = /** @type {Record<string, string>} */ ({
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
})

/** @param {string} file */
export const contentTypeOf = (file) =>
  TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream'

/**
 * What Pages gzips: text, scripts, styles, JSON-ish, SVG. Images and fonts are already compressed.
 * @param {string} type a Content-Type value
 */
export const isCompressible = (type) =>
  /^(text\/|application\/(javascript|json|manifest\+json)|image\/svg\+xml)/.test(type)

/**
 * The status the AUDIT server sends for a resolved request (header: why 404+file becomes 200).
 * @param {{ status: number, file?: string }} resolved pages-server's `resolveRequest` result
 */
export const auditStatus = (resolved) =>
  resolved.status === 404 && resolved.file ? 200 : resolved.status

// --- Runtime parts -------------------------------------------------------------------------------

/**
 * The audit server: pages-server's resolution, gzip for text, the SPA fallback as 200 (header).
 * @param {{ root: string, port: number, base: string, host?: string }} opts
 * @returns {Promise<import('node:http').Server>}
 */
export function startAuditServer({ root: rawRoot, port, base, host = '127.0.0.1' }) {
  // pages-server guards `target.startsWith(root + sep)` with the platform separator, so the root
  // must be a native absolute path (a forward-slash root on Windows would 404 every asset).
  const root = path.resolve(rawRoot)
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    resolveRequest(root, url.pathname, base)
      .then(async (r) => {
        if (r.location) {
          res.writeHead(r.status, { Location: r.location + url.search })
          res.end()
          return
        }
        if (!r.file) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
          res.end('404 Not found\n')
          return
        }
        const type = contentTypeOf(r.file)
        let body = await readFile(r.file)
        /** @type {Record<string, string | number>} */
        const headers = {
          'Content-Type': type,
          'Cache-Control': 'no-store',
          Vary: 'Accept-Encoding',
        }
        if (isCompressible(type) && /\bgzip\b/.test(req.headers['accept-encoding'] ?? '')) {
          body = gzipSync(body)
          headers['Content-Encoding'] = 'gzip'
        }
        headers['Content-Length'] = body.length
        res.writeHead(auditStatus(r), headers)
        res.end(req.method === 'HEAD' ? undefined : body)
      })
      .catch((err) => {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
        res.end(`500 ${String(err)}\n`)
      })
  })
  return new Promise((resolvePromise, reject) => {
    server.once('error', reject)
    server.listen(port, host, () => resolvePromise(server))
  })
}

/**
 * Find the headless shell binary inside its directory (`chrome-headless-shell-<platform>/chrome-headless-shell[.exe]`).
 * @param {string} dir
 * @returns {string | null}
 */
function findHeadlessShellBinary(dir) {
  if (!existsSync(dir)) return null
  for (const sub of readdirSync(dir, { withFileTypes: true })) {
    if (!sub.isDirectory() || !sub.name.startsWith('chrome-headless-shell')) continue
    for (const bin of [
      'chrome-headless-shell',
      'chrome-headless-shell.exe',
      'headless_shell',
      'headless_shell.exe',
    ]) {
      const candidate = path.join(dir, sub.name, bin)
      if (existsSync(candidate)) return candidate
    }
  }
  return null
}

/**
 * The Chrome binary to drive: CHROME_PATH, PLAYWRIGHT_CHROMIUM, Playwright's full Chromium, or its
 * headless shell (CI installs only the shell).
 * @param {NodeJS.ProcessEnv} env
 * @returns {Promise<string>}
 */
export async function resolveChrome(env) {
  for (const name of ['CHROME_PATH', 'PLAYWRIGHT_CHROMIUM']) {
    const value = env[name]
    if (value) {
      if (!existsSync(value)) throw new Error(`${name}=${value} does not exist`)
      return value
    }
  }
  const { chromium } = await import('@playwright/test')
  const full = chromium.executablePath()
  if (existsSync(full)) return full
  const shellDir = headlessShellDir(full)
  const shell = shellDir ? findHeadlessShellBinary(shellDir) : null
  if (shell) return shell
  throw new Error(
    `no Chromium found: ${full} is missing and no headless shell beside it. Run \`npx playwright install chromium\` (or set CHROME_PATH).`,
  )
}

/**
 * Launch Chrome with a temp profile created HERE (so chrome-launcher's `chrome-err.log` inside it
 * can be read back on failure); the returned `kill` also removes the profile, which chrome-launcher
 * leaves alone when the directory was supplied. A launch failure rethrows with the tail of
 * chrome-err.log appended, so the CI log says why Chrome never opened its port.
 * @param {{ chromePath: string, flags: readonly string[] }} opts
 * @returns {Promise<{ port: number, kill: () => Promise<void> }>}
 */
export async function launchChrome({ chromePath, flags }) {
  const { launch } = await import('chrome-launcher')
  const userDataDir = mkdtempSync(path.join(tmpdir(), 'hygieia-lighthouse-'))
  // Best effort, like chrome-launcher's own: Windows keeps the profile locked for a moment after
  // the process dies (EPERM), so retry, and a profile that still will not go is left to the OS
  // temp dir rather than failing a run whose audits all succeeded.
  const cleanup = () => {
    try {
      rmSync(userDataDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 250 })
    } catch {
      /* temp profile left behind; harmless */
    }
  }
  try {
    const chrome = await launch({ chromePath, chromeFlags: [...flags], userDataDir })
    return {
      port: chrome.port,
      kill: async () => {
        await chrome.kill()
        cleanup()
      },
    }
  } catch (err) {
    const errLog = path.join(userDataDir, 'chrome-err.log')
    const tail = existsSync(errLog) ? tailLines(readFileSync(errLog, 'utf-8')) : []
    cleanup()
    const detail =
      tail.length === 0
        ? '(chrome-err.log is empty or missing)'
        : `last ${tail.length} line(s) of chrome-err.log:\n${tail.map((l) => `    | ${l}`).join('\n')}`
    throw new Error(
      `Chrome failed to launch (${chromePath}): ${err instanceof Error ? err.message : String(err)}\n  ${detail}`,
    )
  }
}

/**
 * `npm run build` in local-only mode (Supabase names blanked, like playwright.config.ts).
 * @param {Io} io
 */
function build(io) {
  io.log('check:lighthouse: building dist/ (npm run build, local-only mode)')
  // One command string through the shell (npm is `npm.cmd` on Windows, which Node will not spawn directly).
  const r = spawnSync('npm run build', {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' },
  })
  if (r.status !== 0) throw new Error(`npm run build exited ${r.status}`)
}

/**
 * Run Lighthouse (mobile preset) on one URL through an already-launched Chrome and write both
 * report formats under `outDir/<name>.{html,json}`.
 * @param {string} url
 * @param {{ port: number, outDir: string, name: string }} opts
 * @returns {Promise<Parameters<typeof summarise>[0]>}
 */
export async function auditUrl(url, { port, outDir, name }) {
  const { default: lighthouse } = await import('lighthouse')
  const result = await lighthouse(url, lighthouseFlags({ port }))
  if (!result) throw new Error(`lighthouse returned no result for ${url}`)
  const [html, json] = /** @type {string[]} */ (result.report)
  mkdirSync(outDir, { recursive: true })
  writeFileSync(path.join(outDir, `${name}.html`), html)
  writeFileSync(path.join(outDir, `${name}.json`), json)
  return /** @type {Parameters<typeof summarise>[0]} */ (/** @type {unknown} */ (result.lhr))
}

/**
 * @param {string[]} argv
 * @param {Io} [io]
 * @returns {Promise<0 | 1 | 2>}
 */
export async function main(
  argv = [],
  io = { log: console.log, error: console.error, env: process.env },
) {
  const ci = Boolean(io.env.CI)
  /** @type {Route[]} */
  let routes
  /** @type {string} */
  let chromePath
  try {
    routes = parseRoutes(ROUTES)
    if (argv.includes('--build') || !existsSync(path.join(DIST, 'index.html'))) build(io)
    chromePath = await resolveChrome(io.env)
  } catch (err) {
    io.error(`check:lighthouse: setup failed — ${err instanceof Error ? err.message : String(err)}`)
    return 2
  }

  const flags = chromeFlags({ ci })
  /** @type {import('node:http').Server | undefined} */
  let server
  /** @type {Array<{ route: Route, scores: Scores, failingAudits: Summary['failingAudits'] }>} */
  const results = []
  try {
    server = await startAuditServer({ root: DIST, port: PORT, base: BASE })
    io.log(
      `check:lighthouse: Lighthouse mobile on ${routes.length} route(s) at http://127.0.0.1:${PORT}${BASE}/`,
    )
    // The startup self-check (header): what will be launched, before it is.
    io.log(`  chrome: ${chromePath}`)
    io.log(`  flags:  ${flags.join(' ')}${ci ? '  (CI: sandbox off, /dev/shm off)' : ''}`)
    io.log(`  ${MODE_LINE}`)
    for (const route of routes) {
      // A FRESH Chrome (new temp profile) per route, so every row is the same cold visit: no route
      // inherits the previous one's storage (the "stored data" run warning), HTTP cache or warm
      // connection (Lighthouse feeds observed per-origin latency into its simulated FCP, so a warm
      // origin would flatter later rows). The only thing the cold gate BLOCKS is the service worker
      // (`BLOCKED_URL_PATTERNS`); the fonts are self-hosted and audited like any other asset.
      const chrome = await launchChrome({ chromePath, flags })
      try {
        const url = `http://127.0.0.1:${PORT}${route.path}`
        const lhr = await auditUrl(url, { port: chrome.port, outDir: REPORT_DIR, name: route.name })
        // The measurement is only valid if it was the cold visit the gate claims to measure.
        const cold = verifyColdVisit(
          /** @type {Parameters<typeof verifyColdVisit>[0]} */ (/** @type {unknown} */ (lhr)),
        )
        if (!cold.ok) {
          throw new Error(
            `${url} was not a cold visit — the service worker took part:\n    ${cold.reasons.join('\n    ')}`,
          )
        }
        const summary = summarise(lhr)
        results.push({ route, ...summary })
        io.log(
          `  audited ${url} → lighthouse-report/${route.name}.{html,json}  (cold: ${cold.assets} /assets/*.js from the network, no SW)`,
        )
        for (const w of lhr.runWarnings ?? []) io.log(`    warning: ${w}`)
      } finally {
        await chrome.kill()
      }
    }
  } catch (err) {
    io.error(`check:lighthouse: run failed — ${err instanceof Error ? err.message : String(err)}`)
    return 2
  } finally {
    if (server) await new Promise((resolve) => server?.close(() => resolve(undefined)))
  }

  io.log('')
  for (const line of formatTable(results)) io.log(line)
  io.log('')
  io.log(
    `thresholds (mobile, cold first visit, same locally and in CI — ADR-0006): performance >= ${THRESHOLDS.performance} (target ${PERFORMANCE_TARGET}) · accessibility >= ${THRESHOLDS.accessibility} · best-practices >= ${THRESHOLDS['best-practices']} · seo informational`,
  )
  const failures = evaluate(results)
  if (failures.length === 0) {
    io.log(
      `check:lighthouse OK — ${results.length} route(s) at or above every threshold; reports in lighthouse-report/`,
    )
    return 0
  }
  for (const failure of failures) {
    const result = results.find((r) => r.route === failure.route)
    for (const line of formatFailure(failure, result?.failingAudits[failure.category] ?? []))
      io.error(line)
  }
  io.error(
    `check:lighthouse FAILED — ${failures.length} route/category pair(s) below threshold; reports in lighthouse-report/`,
  )
  return 1
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2))
}
