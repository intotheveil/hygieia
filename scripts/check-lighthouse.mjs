// THE LIGHTHOUSE MOBILE GATE — `npm run check:lighthouse` (PLAN P5.3; PLAN §1 item 10)
//
// Runs Lighthouse 12 (mobile preset: mobile form factor, Moto-G-class screen emulation, simulated
// slow-4G throttling) against the PRODUCTION build served with GitHub Pages semantics at the
// project base `/hygieia/` (e2e/support/pages-server.mjs, the same server the e2e suite uses) for
// every route in e2e/support/routes.ts, and fails when a category score is below threshold:
//
//   performance     >= 90   (CI: >= 85, see below)
//   accessibility   >= 90
//   best-practices  >= 90
//   seo             informational only (printed, never gating; a project site under a user's
//                   github.io has no robots/sitemap story of its own)
//
// Lighthouse 12 removed the PWA category, so the spec's "PWA/perf >= 90" is encoded as the three
// thresholds above; installability stays `npm run check:pwa` (manifest, icons, service worker).
//
// CI TOLERANCE (performance only): when `process.env.CI` is set the performance threshold is
// lowered by CI_PERFORMANCE_TOLERANCE (5 points). Performance is the only category whose score is
// a MEASUREMENT (LCP, TBT, Speed Index, …) rather than a pass/fail checklist: the simulated
// throttling model still anchors on observed CPU time, and shared GitHub-hosted runners have
// noisy, slower CPUs than a developer machine, so the same build scores a few points lower there
// and varies run to run. Accessibility and best-practices are deterministic checklists and get no
// tolerance. The local run (no CI env) holds the full 90, which is the number recorded in
// BUILD_LOG.md.
//
// Chrome: CHROME_PATH, else PLAYWRIGHT_CHROMIUM, else the Chromium Playwright installed
// (`@playwright/test` → chromium.executablePath()). CI installs only the headless shell
// (`playwright install --only-shell chromium`), whose binary lives next to the full build's path
// (`chromium_headless_shell-<rev>/chrome-headless-shell-<platform>/chrome-headless-shell`), so when the
// full binary is absent that sibling is used. Lighthouse drives the shell over CDP like any Chrome.
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
// produced no score) · 2 setup failed (no Chrome, build failed, port 4175 taken). The CLI sets
// `process.exitCode` and never calls `process.exit()`.
//
// Usage: node scripts/check-lighthouse.mjs [--build]   (builds when dist/index.html is missing, or
// always with --build; the build is local-only: the Supabase env names are blanked like
// playwright.config.ts does, so no request leaves the machine apart from the Google Fonts CSS).

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
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

/** Gating thresholds (0–100). `seo` is absent on purpose: informational. */
export const THRESHOLDS = Object.freeze({
  performance: 90,
  accessibility: 90,
  'best-practices': 90,
})

/** Points taken off the PERFORMANCE threshold only, only when `CI` is set (header: why). */
export const CI_PERFORMANCE_TOLERANCE = 5

/** How many failing audits to name per failing route/category. */
export const TOP_AUDITS = 3

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
 * The thresholds in force: THRESHOLDS, with the CI tolerance applied to performance only.
 * @param {{ ci: boolean }} opts
 * @returns {Record<keyof typeof THRESHOLDS, number>}
 */
export function effectiveThresholds({ ci }) {
  return {
    ...THRESHOLDS,
    performance: ci ? THRESHOLDS.performance - CI_PERFORMANCE_TOLERANCE : THRESHOLDS.performance,
  }
}

/**
 * Every (route, gating category) pair whose score is below its threshold, or missing (null: the
 * category produced no score, which must not pass silently). `seo` never fails.
 * @param {Array<{ route: Route, scores: Scores }>} results
 * @param {{ ci: boolean }} opts
 * @returns {Failure[]}
 */
export function evaluate(results, { ci }) {
  const thresholds = effectiveThresholds({ ci })
  /** @type {Failure[]} */
  const failures = []
  for (const { route, scores } of results) {
    for (const category of /** @type {(keyof typeof THRESHOLDS)[]} */ (Object.keys(thresholds))) {
      const threshold = thresholds[category]
      const score = scores[category]
      if (score === null || score === undefined || Number.isNaN(score) || score < threshold) {
        failures.push({ route, category, score: score ?? null, threshold })
      }
    }
  }
  return failures
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
  const result = await lighthouse(url, {
    port,
    output: ['html', 'json'],
    logLevel: 'error',
    onlyCategories: [...CATEGORIES],
    // Lighthouse 12's mobile defaults, spelled out so the gate does not move if the defaults do.
    formFactor: 'mobile',
    screenEmulation: {
      mobile: true,
      width: 412,
      height: 823,
      deviceScaleFactor: 1.75,
      disabled: false,
    },
    throttlingMethod: 'simulate',
  })
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

  const { launch } = await import('chrome-launcher')
  /** @type {import('node:http').Server | undefined} */
  let server
  /** @type {Array<{ route: Route, scores: Scores, failingAudits: Summary['failingAudits'] }>} */
  const results = []
  try {
    server = await startAuditServer({ root: DIST, port: PORT, base: BASE })
    io.log(
      `check:lighthouse: Lighthouse mobile on ${routes.length} route(s) at http://127.0.0.1:${PORT}${BASE}/ (chrome: ${chromePath})`,
    )
    for (const route of routes) {
      // A FRESH Chrome (new temp profile) per route: the first route must not pay the cold DNS/TLS
      // to fonts.googleapis.com alone while later ones ride the warm connection (Lighthouse's model
      // feeds observed per-origin latency into the simulated FCP, so that skewed the first row by
      // ~1.5 s), and no route inherits the previous one's storage (the "stored data" run warning).
      const chrome = await launch({
        chromePath,
        chromeFlags: [
          '--headless=new',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-gpu',
        ],
      })
      try {
        const url = `http://127.0.0.1:${PORT}${route.path}`
        const lhr = await auditUrl(url, { port: chrome.port, outDir: REPORT_DIR, name: route.name })
        const summary = summarise(lhr)
        results.push({ route, ...summary })
        io.log(`  audited ${url} → lighthouse-report/${route.name}.{html,json}`)
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
  const thresholds = effectiveThresholds({ ci })
  io.log(
    `thresholds (mobile): performance >= ${thresholds.performance}${
      ci
        ? ` (CI: ${THRESHOLDS.performance} − ${CI_PERFORMANCE_TOLERANCE} tolerance, see header)`
        : ''
    } · accessibility >= ${thresholds.accessibility} · best-practices >= ${thresholds['best-practices']} · seo informational`,
  )
  const failures = evaluate(results, { ci })
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
