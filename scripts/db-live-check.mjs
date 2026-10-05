// THE LIVE READ-ONLY CHECK — `npm run db:live-check` (PLAN P2.6, ADR-0003)
//
// Proves that the LIVE shared Supabase project matches this checkout's migration archive and
// exposes schema `hygieia` to anon the way the policies promise — WITHOUT a credential in the repo
// and without writing anything. Three probes, each read-only:
//
//   1. ledger      Management API (`SUPABASE_ACCESS_TOKEN` + `HYGIEIA_SUPABASE_PROJECT_REF`):
//                  `to_regclass` first (an absent `hygieia.schema_migrations` = nothing applied yet
//                  = a mismatch), then every archive version must be present with the SAME sha256
//                  and the ledger must hold no version the archive lacks.
//   2. recipes     PostgREST as anon (`VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`, header
//                  `Accept-Profile: hygieia`): GET /rest/v1/recipes?select=id&status=eq.pending
//                  → HTTP 200 and `[]` — anon cannot see a pending row live.
//   3. profiles    GET /rest/v1/profiles?select=user_id → 200 and `[]` — anon sees no profile.
//                  A 404/406 whose PostgREST message is about the schema means `hygieia` is not in
//                  the project's exposed schemas (ADR-0003 rule 5 / BRAIN O1) and is reported so.
//
// Without EVERY env name above it prints `LIVE-CHECK SKIPPED — missing: …` and exits 0: a skip,
// not a pass (the line says so), so CI and a machine without credentials never reach the live
// project by accident (the Themis e2e:live pattern). With them all: one `PASS`/`FAIL` line per
// probe, then `LIVE-CHECK PASSED` (exit 0) or `LIVE-CHECK FAILED — <first mismatch>` (exit 1).
// Exit 2 = malformed ref/URL (nothing sent). Values are never printed: every line is redacted of
// the token and the anon key. No .env file is read. No `process.exit()`: the CLI sets exitCode.
//
// Reuses the applier's archive + ledger readers (`scripts/db-apply.mjs`) and the Management-API
// client (`scripts/lib/mgmt-api.mjs`); P6.3's smoke test reuses the PostgREST probes from here.

import { existsSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  DEFAULT_DIR,
  ENV_REF,
  ENV_TOKEN,
  LEDGER,
  loadMigrations,
  readApplied,
} from './db-apply.mjs'
import { createMgmtClient, redact } from './lib/mgmt-api.mjs'

export const ENV_URL = 'VITE_SUPABASE_URL'
export const ENV_ANON_KEY = 'VITE_SUPABASE_ANON_KEY'
/** Every name the check requires; one missing = SKIPPED. Never give one a default. */
export const REQUIRED_ENV = /** @type {const} */ ([ENV_TOKEN, ENV_REF, ENV_URL, ENV_ANON_KEY])

export const SCHEMA = 'hygieia'
export const PROFILE_HEADER = 'Accept-Profile'
export const SCHEMA_NOT_EXPOSED = `schema ${SCHEMA} is not exposed in the Data API (ADR-0003 rule 5 / BRAIN O1)`
export const LEDGER_ABSENT = `ledger absent — nothing applied yet (${LEDGER} does not exist on the live project)`

/** The anon PostgREST probes: each must answer HTTP 200 with an empty JSON array. */
export const REST_PROBES = /** @type {const} */ ([
  {
    id: 'recipes',
    path: '/rest/v1/recipes?select=id&status=eq.pending',
    leak: 'anon can see pending recipe row(s) live — the select policy must hide status <> approved',
  },
  {
    id: 'profiles',
    path: '/rest/v1/profiles?select=user_id',
    leak: 'anon can see profile row(s) live — profiles must be invisible to anon',
  },
])

/**
 * The required names that are unset or blank in `env`.
 * @param {Record<string, string | undefined>} env
 * @returns {string[]}
 */
export function missingEnv(env) {
  return REQUIRED_ENV.filter((name) => !(env[name] ?? '').trim())
}

/**
 * Compare the archive with the live ledger. Pure. Returns every mismatch, first = the one reported
 * as THE mismatch; empty = the ledger matches the archive exactly.
 * @param {import('./db-apply.mjs').Migration[]} local
 * @param {import('./db-apply.mjs').AppliedRow[] | null} applied  null = ledger table absent
 * @returns {string[]}
 */
export function compareLedger(local, applied) {
  if (applied === null) return [LEDGER_ABSENT]
  /** @type {string[]} */
  const problems = []
  const byVersion = new Map(applied.map((r) => [r.version, r]))
  for (const m of local) {
    const row = byVersion.get(m.version)
    if (!row) {
      problems.push(
        `MISSING: ${m.file} is in the archive but not in the live ledger — apply it (npm run db:apply, operator's go)`,
      )
    } else if (row.checksum !== m.checksum) {
      problems.push(
        `CHECKSUM MISMATCH: ${m.file} was applied with sha256 ${row.checksum} but the file now hashes to ${m.checksum}`,
      )
    }
  }
  const localVersions = new Set(local.map((m) => m.version))
  for (const row of applied) {
    if (!localVersions.has(row.version)) {
      problems.push(
        `EXTRA: live ledger holds version ${row.version} (${row.name}) which has no file in this archive`,
      )
    }
  }
  return problems
}

/**
 * Pull PostgREST's `{ code, message, hint, details }` out of a response body, or the raw text.
 * @param {string} text
 * @returns {{ code: string | null, message: string, rows: unknown[] | null }}
 */
export function parseRestBody(text) {
  /** @type {unknown} */
  let body
  try {
    body = text === '' ? [] : JSON.parse(text)
  } catch {
    return { code: null, message: text.slice(0, 300), rows: null }
  }
  if (Array.isArray(body)) return { code: null, message: '', rows: body }
  if (body && typeof body === 'object') {
    const o = /** @type {Record<string, unknown>} */ (body)
    const code = typeof o.code === 'string' ? o.code : null
    const message =
      typeof o.message === 'string' && o.message
        ? o.message
        : `unexpected response payload: ${JSON.stringify(body).slice(0, 300)}`
    return { code, message, rows: null }
  }
  return {
    code: null,
    message: `unexpected response payload: ${String(body).slice(0, 300)}`,
    rows: null,
  }
}

/**
 * Decide what a non-`200 []` PostgREST answer means. PostgREST answers an unknown `Accept-Profile`
 * with 406 `PGRST106` ("The schema must be one of the following: …"); older builds and some proxies
 * say 404 with a message naming the schema. A `PGRST205` 404 is a different thing: the schema is
 * exposed but the TABLE is not there (its migration is not applied, or the schema cache is stale).
 * @param {number} status
 * @param {{ code: string | null, message: string, rows: unknown[] | null }} parsed
 * @param {string} table
 * @param {string} leak  the message for "rows came back"
 * @returns {string}
 */
export function classifyRestAnswer(status, parsed, table, leak) {
  if (status === 200 && parsed.rows !== null) {
    if (parsed.rows.length === 0) return ''
    return `${leak} (${parsed.rows.length} row(s) returned)`
  }
  const detail = parsed.message || `HTTP ${status}`
  if (status === 404 || status === 406) {
    const aboutSchema =
      parsed.code === 'PGRST106' || (/\bschema\b/i.test(detail) && !/schema cache/i.test(detail))
    if (aboutSchema) return `${SCHEMA_NOT_EXPOSED} — HTTP ${status}: ${detail}`
    if (parsed.code === 'PGRST205') {
      return `table ${SCHEMA}.${table} is not in the live Data API — its migration is not applied (or the schema cache is stale) — HTTP ${status}: ${detail}`
    }
  }
  return `HTTP ${status}: ${detail}`
}

/**
 * One anon GET against PostgREST. Returns '' on `200 []`, else the mismatch text.
 * @param {{ url: string, anonKey: string, fetch: typeof fetch }} rest
 * @param {(typeof REST_PROBES)[number]} probe
 * @returns {Promise<string>}
 */
export async function restProbe(rest, probe) {
  /** @type {Response} */
  let res
  try {
    res = await rest.fetch(`${rest.url}${probe.path}`, {
      method: 'GET',
      headers: {
        apikey: rest.anonKey,
        Authorization: `Bearer ${rest.anonKey}`,
        Accept: 'application/json',
        [PROFILE_HEADER]: SCHEMA,
      },
    })
  } catch (e) {
    return `network error calling PostgREST: ${e instanceof Error ? e.message : String(e)}`
  }
  return classifyRestAnswer(res.status, parseRestBody(await res.text()), probe.id, probe.leak)
}

/**
 * @typedef {object} LiveCheckOptions
 * @property {Record<string, string | undefined>} [env]
 * @property {typeof fetch} [fetch]
 * @property {string} [archiveDir]              migrations dir (default supabase/migrations)
 * @property {(line: string) => void} [log]     stdout
 * @property {(line: string) => void} [error]   stderr
 */

/**
 * The whole check. Returns the exit code (0 passed or skipped, 1 mismatch, 2 bad config); never
 * calls process.exit and never sends anything but reads.
 * @param {LiveCheckOptions} [opts]
 * @returns {Promise<number>}
 */
export async function runLiveCheck(opts = {}) {
  const env = opts.env ?? process.env
  const fetchImpl = opts.fetch ?? globalThis.fetch
  const token = (env[ENV_TOKEN] ?? '').trim()
  const anonKey = (env[ENV_ANON_KEY] ?? '').trim()
  const scrub = (/** @type {string} */ s) => redact(s, [token, anonKey])
  const log = (/** @type {string} */ s) => (opts.log ?? console.log)(scrub(s))
  const error = (/** @type {string} */ s) => (opts.error ?? console.error)(scrub(s))

  const missing = missingEnv(env)
  if (missing.length > 0) {
    log(
      `LIVE-CHECK SKIPPED — missing: ${missing.join(', ')}. Needs every one of: ${REQUIRED_ENV.join(', ')}. Skipped is NOT passed; set them in the shell (values from the Zeus Vault) and re-run. Nothing was sent.`,
    )
    return 0
  }

  const ref = /** @type {string} */ (env[ENV_REF]).trim()
  const url = /** @type {string} */ (env[ENV_URL]).trim().replace(/\/+$/, '')
  if (!/^https?:\/\/[^/\s]+$/.test(url)) {
    error(`db:live-check: ${ENV_URL} must be an origin like https://<ref>.supabase.co`)
    return 2
  }
  let client
  try {
    client = createMgmtClient({ token, ref, fetch: fetchImpl })
  } catch (e) {
    error(`db:live-check: ${e instanceof Error ? e.message : String(e)}`)
    return 2
  }
  const archiveDir = opts.archiveDir ?? DEFAULT_DIR
  if (!existsSync(archiveDir)) {
    error(`db:live-check: no such migrations directory: ${archiveDir}`)
    return 2
  }

  log(`db:live-check — READ-ONLY · project ${ref} · ledger ${LEDGER} · Data API ${url} as anon`)

  /** @type {string[]} the first mismatch of each failed probe, in probe order */
  const failures = []

  // 1. ledger
  try {
    const local = loadMigrations(archiveDir)
    const applied = await readApplied(client)
    const problems = compareLedger(local, applied)
    if (problems.length === 0) {
      log(
        `PASS  ledger: ${applied?.length ?? 0} version(s) applied — every one of the ${local.length} archive file(s) present with its sha256, no extra version`,
      )
    } else {
      log(`FAIL  ledger: ${problems[0]}`)
      for (const p of problems.slice(1)) log(`      ledger: ${p}`)
      failures.push(`ledger: ${problems[0]}`)
    }
  } catch (e) {
    const msg = `ledger: ${e instanceof Error ? e.message : String(e)}`
    log(`FAIL  ${msg}`)
    failures.push(msg)
  }

  // 2 + 3. anon through PostgREST
  for (const probe of REST_PROBES) {
    const label = `anon GET ${probe.path} (${PROFILE_HEADER}: ${SCHEMA})`
    const mismatch = await restProbe({ url, anonKey, fetch: fetchImpl }, probe)
    if (mismatch === '') {
      log(`PASS  ${label} → 200 []`)
    } else {
      log(`FAIL  ${label}: ${mismatch}`)
      failures.push(`${probe.id}: ${mismatch}`)
    }
  }

  if (failures.length > 0) {
    error(
      `LIVE-CHECK FAILED — ${failures[0]}${failures.length > 1 ? ` (+${failures.length - 1} more)` : ''}`,
    )
    return 1
  }
  log(`LIVE-CHECK PASSED — ${1 + REST_PROBES.length} read-only probe(s) against project ${ref}`)
  return 0
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exitCode = await runLiveCheck()
}
