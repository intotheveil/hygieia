// THE LIVE SMOKE — `npm run smoke:live` (PLAN P6.3; CLAUDE.md §5 "running the real thing is a gate")
//
// HTTP only, no browser. Proves the DEPLOYED artifact at `SMOKE_BASE_URL` (default
// https://intotheveil.github.io/hygieia/) is the installable, deep-linkable PWA that `check:pwa`
// verified in dist/ — as actually served — and, when the anon credentials are in the environment,
// that the real backing service exposes schema `hygieia` to anon the way the policies promise.
//
//   static (always)
//     1. GET /                       200; <html lang="el">, the Greek title, <div id="root">, rel="manifest"
//     2. GET manifest.webmanifest    200; JSON; start_url + scope /hygieia/; display standalone; ≥ 3 icons,
//                                    each icon URL → 200 image/png
//     3. GET sw.js                   200 JavaScript
//     4. GET registerSW.js           200
//     5. GET recipes/deep-link-probe-<random>
//                                    404 AND the body is the SPA fallback document (<div id="root"> + the
//                                    manifest link). A 200 means the server is NOT Pages-like (no 404.html
//                                    semantics); a bare 404 means 404.html is missing or not index.html.
//     6. GET favicon.svg             200 image/svg+xml
//     7. every <script src> and <link rel="stylesheet"> index.html references
//                                    200, and `scanText` (check-bundle-secrets.mjs) finds nothing in it
//     8. GET brand/og-hygieia.jpg    200 (the og:image the home page advertises)
//   backend (only with VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY; else one `SKIPPED (backend)` line)
//     9. GET /rest/v1/recipes?select=slug&status=eq.approved&limit=1  (Accept-Profile: hygieia)
//                                    200 + JSON array; ≥ 1 row → PASS "approved rows: N"; 0 rows → WARN
//                                    (approval is the operator's step, OP4.b — not a defect of the deploy)
//    10. GET /rest/v1/recipes?select=id&status=eq.pending             200 [] (db-live-check's REST_PROBES)
//    11. GET /rest/v1/profiles?select=user_id                          200 []
//
// Every probe prints one `PASS`/`WARN`/`FAIL` line; all probes run (nothing short-circuits) and the
// summary names the FIRST failure: `SMOKE PASSED — N probes against <base> (<ms> ms)` exit 0, or
// `SMOKE FAILED — <first failing probe>` exit 1. Usage error / malformed base URL → exit 2, nothing
// sent. Each request has a 15 s timeout with a clear message. The anon key is redacted from every
// line. No .env file is read. No `process.exit()`: the CLI sets `process.exitCode`.
//
// Usage: node scripts/smoke-live.mjs [baseUrl]      (baseUrl overrides SMOKE_BASE_URL)
// Import `runSmoke({ baseUrl, env, fetch, log, error, timeoutMs })` to run it in-process (tests).

import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { scanText, formatFinding } from './check-bundle-secrets.mjs'
import {
  ENV_ANON_KEY,
  ENV_URL,
  PROFILE_HEADER,
  REST_PROBES,
  SCHEMA,
  classifyRestAnswer,
  parseRestBody,
  restProbe,
} from './db-live-check.mjs'
import { redact } from './lib/mgmt-api.mjs'

export const ENV_BASE_URL = 'SMOKE_BASE_URL'
export const DEFAULT_BASE_URL = 'https://intotheveil.github.io/hygieia/'
export const REQUEST_TIMEOUT_MS = 15_000
export const USAGE = `usage: node scripts/smoke-live.mjs [baseUrl]   (default: $${ENV_BASE_URL} or ${DEFAULT_BASE_URL})`

/** What the served home document must contain. */
export const HTML_MARKERS = /** @type {const} */ ({
  lang: '<html lang="el"',
  title: '<title>Hygieia · Υγίεια</title>',
  root: '<div id="root">',
  manifest: 'rel="manifest"',
})
/** The manifest fields the installed app depends on (mirrors scripts/check-pwa.mjs). */
export const MANIFEST_EXPECT = /** @type {const} */ ({
  start_url: '/hygieia/',
  scope: '/hygieia/',
  display: 'standalone',
  minIcons: 3,
})
export const BACKEND_SKIPPED = `SKIPPED (backend) — set ${ENV_URL} and ${ENV_ANON_KEY}`
export const APPROVED_PATH = '/rest/v1/recipes?select=slug&status=eq.approved&limit=1'

/**
 * Normalise a base URL: trimmed, http(s), origin + path, trailing slash guaranteed, no query/hash.
 * @param {string | undefined} raw
 * @returns {string | null} null when it is not an absolute http(s) URL
 */
export function normaliseBaseUrl(raw) {
  const s = (raw ?? '').trim()
  if (!s) return null
  /** @type {URL} */
  let u
  try {
    u = new URL(s)
  } catch {
    return null
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
  if (u.search || u.hash) return null
  if (!u.pathname.endsWith('/')) u.pathname = `${u.pathname}/`
  return u.href
}

/**
 * Pull the same-document asset references out of the served HTML: every `<script src>` and every
 * `<link rel="stylesheet" href>` (attribute order free), resolved against `baseUrl`. Pure.
 * @param {string} html
 * @param {string} baseUrl
 * @returns {{ kind: 'script' | 'stylesheet', url: string, src: string }[]}
 */
export function extractAssets(html, baseUrl) {
  /** @type {{ kind: 'script' | 'stylesheet', url: string, src: string }[]} */
  const out = []
  const attr = (/** @type {string} */ tag, /** @type {string} */ name) =>
    new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, 'i').exec(tag)?.[1] ??
    new RegExp(`\\s${name}\\s*=\\s*'([^']*)'`, 'i').exec(tag)?.[1] ??
    null
  for (const m of html.matchAll(/<script\b[^>]*>/gi)) {
    const src = attr(m[0], 'src')
    if (src) out.push({ kind: 'script', src, url: new URL(src, baseUrl).href })
  }
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const rel = attr(m[0], 'rel')
    const href = attr(m[0], 'href')
    if (href && rel && rel.split(/\s+/).includes('stylesheet')) {
      out.push({ kind: 'stylesheet', src: href, url: new URL(href, baseUrl).href })
    }
  }
  return out
}

/**
 * @typedef {{ status: number, contentType: string, text: string }} Answer
 * @typedef {'PASS' | 'WARN' | 'FAIL'} Verdict
 * @typedef {{ verdict: Verdict, label: string, detail: string }} ProbeResult
 */

/**
 * One GET with a timeout. Throws an Error with a clear message on timeout or network failure.
 * @param {typeof fetch} fetchImpl
 * @param {string} url
 * @param {{ headers?: Record<string, string>, timeoutMs: number }} o
 * @returns {Promise<Answer>}
 */
export async function getWithTimeout(fetchImpl, url, o) {
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), o.timeoutMs)
  try {
    const res = await fetchImpl(url, {
      method: 'GET',
      headers: o.headers ?? {},
      redirect: 'follow',
      signal: ac.signal,
    })
    const text = await res.text()
    return { status: res.status, contentType: res.headers.get('content-type') ?? '', text }
  } catch (e) {
    if (ac.signal.aborted) {
      throw new Error(`request to ${url} timed out after ${o.timeoutMs} ms (no response)`)
    }
    throw new Error(`network error for ${url}: ${e instanceof Error ? e.message : String(e)}`)
  } finally {
    clearTimeout(timer)
  }
}

/** @param {string} contentType @param {RegExp} want */
const typeIs = (contentType, want) => want.test(contentType)
const shortType = (/** @type {string} */ ct) => ct.split(';')[0].trim() || '(no content-type)'

/**
 * @typedef {object} SmokeOptions
 * @property {string} [baseUrl]                       overrides env SMOKE_BASE_URL and the default
 * @property {Record<string, string | undefined>} [env]
 * @property {typeof fetch} [fetch]
 * @property {(line: string) => void} [log]          stdout
 * @property {(line: string) => void} [error]        stderr
 * @property {number} [timeoutMs]                    per request (default 15 000)
 * @property {() => string} [probeToken]             the random deep-link suffix (tests pin it)
 */

/**
 * The whole smoke. Returns the exit code (0 passed, 1 a probe failed, 2 bad base URL); never calls
 * process.exit and sends nothing but GETs.
 * @param {SmokeOptions} [opts]
 * @returns {Promise<0 | 1 | 2>}
 */
export async function runSmoke(opts = {}) {
  const env = opts.env ?? process.env
  const fetchImpl = opts.fetch ?? globalThis.fetch
  const timeoutMs = opts.timeoutMs ?? REQUEST_TIMEOUT_MS
  const anonKey = (env[ENV_ANON_KEY] ?? '').trim()
  const supabaseUrl = (env[ENV_URL] ?? '').trim().replace(/\/+$/, '')
  const scrub = (/** @type {string} */ s) => redact(s, [anonKey])
  const log = (/** @type {string} */ s) => (opts.log ?? console.log)(scrub(s))
  const error = (/** @type {string} */ s) => (opts.error ?? console.error)(scrub(s))

  const rawBase = opts.baseUrl ?? env[ENV_BASE_URL] ?? DEFAULT_BASE_URL
  const base = normaliseBaseUrl(rawBase)
  if (!base) {
    error(
      `smoke:live: base URL must be an absolute http(s) URL without query/hash, got "${rawBase}"`,
    )
    error(USAGE)
    return 2
  }
  const at = (/** @type {string} */ rel) => new URL(rel, base).href
  const started = performance.now()
  log(`smoke:live — HTTP only · ${base} · timeout ${timeoutMs} ms per request`)

  /** @type {ProbeResult[]} */
  const results = []
  /** @param {ProbeResult} r */
  const record = (r) => {
    results.push(r)
    log(
      r.verdict === 'FAIL'
        ? `FAIL  ${r.label}: ${r.detail}`
        : `${r.verdict.padEnd(4)}  ${r.label} → ${r.detail}`,
    )
  }
  const pass = (/** @type {string} */ label, /** @type {string} */ detail) =>
    record({ verdict: 'PASS', label, detail })
  const warn = (/** @type {string} */ label, /** @type {string} */ detail) =>
    record({ verdict: 'WARN', label, detail })
  const fail = (/** @type {string} */ label, /** @type {string} */ detail) =>
    record({ verdict: 'FAIL', label, detail })

  /**
   * GET and hand the answer to `check`; a thrown fetch error (timeout, network) is a FAIL.
   * @param {string} label @param {string} url @param {(a: Answer) => void | Promise<void>} check
   * @param {Record<string, string>} [headers]
   */
  const probe = async (label, url, check, headers) => {
    /** @type {Answer} */
    let a
    try {
      a = await getWithTimeout(fetchImpl, url, { headers, timeoutMs })
    } catch (e) {
      fail(label, e instanceof Error ? e.message : String(e))
      return null
    }
    await check(a)
    return a
  }

  // 1. the home document
  /** @type {Answer | null} */
  let home = null
  await probe('GET /', base, (a) => {
    if (a.status !== 200) return fail('GET /', `HTTP ${a.status} (${shortType(a.contentType)})`)
    home = a
    const missing = Object.entries(HTML_MARKERS)
      .filter(([, marker]) => !a.text.includes(marker))
      .map(([k, marker]) => `${k} ${marker}`)
    if (missing.length > 0)
      return fail('GET /', `200 but the document lacks: ${missing.join('; ')}`)
    pass('GET /', `200, lang="el", title "Hygieia · Υγίεια", #root, manifest linked`)
  })

  // 2. the manifest and its icons
  await probe('GET manifest.webmanifest', at('manifest.webmanifest'), async (a) => {
    const label = 'GET manifest.webmanifest'
    if (a.status !== 200) return fail(label, `HTTP ${a.status}`)
    /** @type {unknown} */
    let m
    try {
      m = JSON.parse(a.text)
    } catch {
      return fail(label, `200 but the body is not JSON (${shortType(a.contentType)})`)
    }
    if (!m || typeof m !== 'object' || Array.isArray(m))
      return fail(label, '200 but not a JSON object')
    const o = /** @type {Record<string, unknown>} */ (m)
    /** @type {string[]} */
    const problems = []
    for (const k of /** @type {const} */ (['start_url', 'scope', 'display'])) {
      if (o[k] !== MANIFEST_EXPECT[k]) {
        problems.push(`${k} is ${JSON.stringify(o[k] ?? null)}, want "${MANIFEST_EXPECT[k]}"`)
      }
    }
    const icons = Array.isArray(o.icons) ? /** @type {unknown[]} */ (o.icons) : []
    if (icons.length < MANIFEST_EXPECT.minIcons) {
      problems.push(`${icons.length} icon(s), want ≥ ${MANIFEST_EXPECT.minIcons}`)
    }
    if (problems.length > 0) return fail(label, problems.join('; '))
    pass(label, `200, start_url + scope /hygieia/, display standalone, ${icons.length} icons`)
    const manifestUrl = at('manifest.webmanifest')
    for (const icon of icons) {
      const src =
        icon &&
        typeof icon === 'object' &&
        typeof (/** @type {{ src?: unknown }} */ (icon).src) === 'string'
          ? /** @type {{ src: string }} */ (icon).src
          : null
      const iconLabel = `GET icon ${src ?? JSON.stringify(icon)}`
      if (!src) {
        fail(iconLabel, 'manifest icon has no src')
        continue
      }
      await probe(iconLabel, new URL(src, manifestUrl).href, (ia) => {
        if (ia.status !== 200) return fail(iconLabel, `HTTP ${ia.status}`)
        if (!typeIs(ia.contentType, /^image\/png\b/i)) {
          return fail(
            iconLabel,
            `200 but content-type ${shortType(ia.contentType)}, want image/png`,
          )
        }
        pass(iconLabel, `200 image/png`)
      })
    }
  })

  // 3. the service worker
  await probe('GET sw.js', at('sw.js'), (a) => {
    if (a.status !== 200) return fail('GET sw.js', `HTTP ${a.status}`)
    if (!typeIs(a.contentType, /javascript|ecmascript/i)) {
      return fail('GET sw.js', `200 but content-type ${shortType(a.contentType)}, want JavaScript`)
    }
    pass('GET sw.js', `200 ${shortType(a.contentType)}`)
  })

  // 4. the SW registration shim
  await probe('GET registerSW.js', at('registerSW.js'), (a) => {
    if (a.status !== 200) return fail('GET registerSW.js', `HTTP ${a.status}`)
    pass('GET registerSW.js', `200 ${shortType(a.contentType)}`)
  })

  // 5. the deep-link fallback
  const token = (opts.probeToken ?? (() => Math.random().toString(36).slice(2, 10)))()
  const deepRel = `recipes/deep-link-probe-${token}`
  const deepLabel = `GET ${deepRel}`
  await probe(deepLabel, at(deepRel), (a) => {
    if (a.status === 200) {
      return fail(
        deepLabel,
        'HTTP 200 — the server is NOT Pages-like (a missing file must answer 404 with the 404.html fallback); the deployed origin is not what this smoke expects',
      )
    }
    if (a.status !== 404) return fail(deepLabel, `HTTP ${a.status}, want 404 + the SPA document`)
    const isSpa = a.text.includes(HTML_MARKERS.root) && a.text.includes(HTML_MARKERS.manifest)
    if (!isSpa) {
      return fail(
        deepLabel,
        '404 but the body is not the SPA fallback document (404.html missing or not a copy of index.html) — deep links will not boot the app',
      )
    }
    pass(deepLabel, '404 with the SPA fallback document (#root + manifest link)')
  })

  // 6. favicon
  await probe('GET favicon.svg', at('favicon.svg'), (a) => {
    if (a.status !== 200) return fail('GET favicon.svg', `HTTP ${a.status}`)
    if (!typeIs(a.contentType, /^image\/svg\+xml\b/i)) {
      return fail(
        'GET favicon.svg',
        `200 but content-type ${shortType(a.contentType)}, want image/svg+xml`,
      )
    }
    pass('GET favicon.svg', '200 image/svg+xml')
  })

  // 7. every script and stylesheet the home document references: 200 and secret-free
  if (home !== null) {
    const assets = extractAssets(/** @type {Answer} */ (home).text, base)
    if (assets.length === 0) {
      fail('index.html assets', 'the home document references no <script src> or stylesheet')
    }
    for (const asset of assets) {
      const label = `GET ${asset.kind} ${asset.src}`
      await probe(label, asset.url, (a) => {
        if (a.status !== 200) return fail(label, `HTTP ${a.status}`)
        const findings = scanText(a.text, { file: asset.src })
        if (findings.length > 0) {
          return fail(
            label,
            `200 but the served ${asset.kind} contains ${findings.length} secret-looking finding(s): ${formatFinding(findings[0])}`,
          )
        }
        pass(label, `200, ${a.text.length} chars, no secret-looking value or server-only name`)
      })
    }
  } else {
    fail('index.html assets', 'skipped — the home document did not load')
  }

  // 8. the og:image
  await probe('GET brand/og-hygieia.jpg', at('brand/og-hygieia.jpg'), (a) => {
    if (a.status !== 200) return fail('GET brand/og-hygieia.jpg', `HTTP ${a.status}`)
    pass('GET brand/og-hygieia.jpg', `200 ${shortType(a.contentType)}`)
  })

  // 9–11. the backing service, as anon, only with the credentials in the environment
  if (!supabaseUrl || !anonKey) {
    log(BACKEND_SKIPPED)
  } else if (!/^https?:\/\/[^/\s]+$/.test(supabaseUrl)) {
    fail('backend', `${ENV_URL} must be an origin like https://<ref>.supabase.co`)
  } else {
    const headers = {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      Accept: 'application/json',
      [PROFILE_HEADER]: SCHEMA,
    }
    const approvedLabel = `anon GET ${APPROVED_PATH} (${PROFILE_HEADER}: ${SCHEMA})`
    await probe(
      approvedLabel,
      `${supabaseUrl}${APPROVED_PATH}`,
      (a) => {
        const parsed = parseRestBody(a.text)
        if (a.status === 200 && parsed.rows !== null) {
          if (parsed.rows.length === 0) {
            return warn(
              approvedLabel,
              '200 [] — approved rows: 0 (no recipe approved yet; approval is the operator step OP4.b, not a deploy defect)',
            )
          }
          return pass(approvedLabel, `200, approved rows: ${parsed.rows.length}`)
        }
        fail(approvedLabel, classifyRestAnswer(a.status, parsed, 'recipes', 'unexpected rows'))
      },
      headers,
    )
    for (const p of REST_PROBES) {
      const label = `anon GET ${p.path} (${PROFILE_HEADER}: ${SCHEMA})`
      const mismatch = await restProbe({ url: supabaseUrl, anonKey, fetch: fetchImpl }, p)
      if (mismatch === '') pass(label, '200 []')
      else fail(label, mismatch)
    }
  }

  const ms = Math.round(performance.now() - started)
  const failures = results.filter((r) => r.verdict === 'FAIL')
  const ran = results.filter((r) => r.verdict !== 'FAIL').length
  if (failures.length > 0) {
    error(
      `SMOKE FAILED — ${failures[0].label}: ${failures[0].detail}${failures.length > 1 ? ` (+${failures.length - 1} more)` : ''} (${ran} of ${results.length} probes ok, ${ms} ms)`,
    )
    return 1
  }
  const warns = results.filter((r) => r.verdict === 'WARN').length
  log(
    `SMOKE PASSED — ${results.length} probes against ${base} (${ms} ms)${warns > 0 ? ` · ${warns} WARN` : ''}`,
  )
  return 0
}

/**
 * The CLI body: parses argv, runs the smoke, returns the exit code.
 * @param {string[]} argv arguments after the script path
 * @param {SmokeOptions} [opts]
 * @returns {Promise<0 | 1 | 2>}
 */
export async function main(argv, opts = {}) {
  const error = opts.error ?? console.error
  if (argv.some((a) => a.startsWith('-')) || argv.length > 1) {
    error(USAGE)
    return 2
  }
  return runSmoke({ ...opts, ...(argv[0] !== undefined ? { baseUrl: argv[0] } : {}) })
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exitCode = await main(process.argv.slice(2))
}
