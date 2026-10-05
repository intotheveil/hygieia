// @vitest-environment node
//
// P2.6 — `npm run db:live-check`, the read-only live probe. Everything runs against a FAKE fetch
// that plays both endpoints by URL: the Management API query endpoint (a JSON array of rows, or
// `{message}` + 4xx) and PostgREST (`[]`, rows, or a PostgREST error object). No network, no live
// project, no real credential: the token and anon key below are made-up markers, and every test
// asserts neither reaches any output line.

import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ENV_REF, ENV_TOKEN, LEDGER, checksum, loadMigrations } from './db-apply.mjs'
import { REDACTED } from './lib/mgmt-api.mjs'
import {
  ENV_ANON_KEY,
  ENV_URL,
  LEDGER_ABSENT,
  PROFILE_HEADER,
  REQUIRED_ENV,
  REST_PROBES,
  SCHEMA_NOT_EXPOSED,
  classifyRestAnswer,
  compareLedger,
  missingEnv,
  parseRestBody,
  runLiveCheck,
} from './db-live-check.mjs'

const ARCHIVE = fileURLToPath(new URL('../supabase/migrations', import.meta.url))
const TOKEN = 'sbp_FAKE_TOKEN_0123456789abcdef_never_real'
const ANON = 'eyJ_FAKE_ANON_KEY_never_real_0123456789'
const REF = 'abcdefghijklmnopqrst'
const URL_ = `https://${REF}.supabase.co`
const ENV = { [ENV_TOKEN]: TOKEN, [ENV_REF]: REF, [ENV_URL]: URL_, [ENV_ANON_KEY]: ANON }

type Row = { version: string; name: string; checksum: string }
type Answer = { status: number; body: unknown }
type Call = { url: string; method: string; headers: Record<string, string>; query?: string }

const OK: Answer = { status: 200, body: [] }

/**
 * A fake of both endpoints. `ledger === null` models "hygieia.schema_migrations does not exist".
 * `rest.recipes` / `rest.profiles` are the PostgREST answers (default `200 []`).
 */
function fakeLive(
  opts: {
    ledger?: Row[] | null
    rest?: Partial<Record<(typeof REST_PROBES)[number]['id'], Answer>>
    mgmtError?: Answer
    throwOn?: RegExp
  } = {},
) {
  const calls: Call[] = []
  const json = (a: Answer) =>
    new Response(JSON.stringify(a.body), {
      status: a.status,
      headers: { 'content-type': 'application/json' },
    })

  const fetchImpl: typeof fetch = async (input, init) => {
    const url = String(input)
    const headers = { ...(init?.headers as Record<string, string>) }
    if (opts.throwOn?.test(url)) throw new Error(`connect ECONNREFUSED (Bearer ${TOKEN})`)
    if (url.startsWith('https://api.supabase.com/')) {
      const query = (JSON.parse(String(init?.body)) as { query: string }).query
      calls.push({ url, method: String(init?.method), headers, query })
      if (opts.mgmtError) return json(opts.mgmtError)
      if (query.includes('to_regclass'))
        return json({ status: 201, body: [{ present: opts.ledger != null }] })
      if (query.startsWith(`select version, name, checksum from ${LEDGER}`)) {
        return json({ status: 201, body: opts.ledger ?? [] })
      }
      return json({ status: 400, body: { message: `unexpected query: ${query}` } })
    }
    calls.push({ url, method: String(init?.method), headers })
    const probe = REST_PROBES.find((p) => url === `${URL_}${p.path}`)
    if (!probe) return json({ status: 404, body: { message: `unexpected url: ${url}` } })
    return json(opts.rest?.[probe.id] ?? OK)
  }
  const mgmt = () => calls.filter((c) => c.query !== undefined)
  const rest = () => calls.filter((c) => c.query === undefined)
  return { fetch: fetchImpl, calls, mgmt, rest }
}

let dirs: string[] = []
const tempDir = () => {
  const d = mkdtempSync(path.join(tmpdir(), 'hygieia-db-live-check-'))
  dirs = [...dirs, d]
  return d
}
const archiveCopy = () => {
  const d = tempDir()
  cpSync(ARCHIVE, d, { recursive: true })
  return d
}
const OK_SQL = (t: string) => `create table if not exists hygieia.${t} (id int);\n`
const fixture = (files: Record<string, string>) => {
  const d = tempDir()
  for (const [f, sql] of Object.entries(files)) writeFileSync(path.join(d, f), sql)
  return d
}
const rowsOf = (dir: string): Row[] =>
  loadMigrations(dir).map((x) => ({ version: x.version, name: x.name, checksum: x.checksum }))

beforeEach(() => {
  dirs = []
})
afterEach(() => {
  for (const d of dirs) rmSync(d, { recursive: true, force: true })
})

async function runIt(o: {
  env?: Record<string, string | undefined>
  live?: ReturnType<typeof fakeLive>
  archiveDir?: string
}) {
  const out: string[] = []
  const err: string[] = []
  const live = o.live ?? fakeLive({ ledger: rowsOf(ARCHIVE) })
  const code = await runLiveCheck({
    env: o.env ?? ENV,
    fetch: live.fetch,
    archiveDir: o.archiveDir ?? archiveCopy(),
    log: (s) => out.push(s),
    error: (s) => err.push(s),
  })
  const all = [...out, ...err].join('\n')
  // Neither credential may surface, whatever happened.
  expect(all).not.toContain(TOKEN)
  expect(all).not.toContain(ANON)
  return { code, out, err, all, live }
}

describe('the skip path (no credential = nothing sent, exit 0, not a pass)', () => {
  it('requires exactly the four names of PLAN P2.6', () => {
    expect([...REQUIRED_ENV]).toEqual([
      'SUPABASE_ACCESS_TOKEN',
      'HYGIEIA_SUPABASE_PROJECT_REF',
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
    ])
  })

  it('with no env: SKIPPED, all four names listed, exit 0, zero fetch calls', async () => {
    const r = await runIt({ env: {} })
    expect(r.code).toBe(0)
    expect(r.live.calls).toHaveLength(0)
    expect(r.out).toHaveLength(1)
    expect(r.out[0]).toMatch(/^LIVE-CHECK SKIPPED — missing: /)
    for (const name of REQUIRED_ENV) expect(r.out[0]).toContain(name)
    expect(r.out[0]).toMatch(/Skipped is NOT passed/)
    expect(r.all).not.toContain('LIVE-CHECK PASSED')
  })

  it('with some env: names only the missing ones as missing, still exit 0 and no request', async () => {
    const r = await runIt({ env: { [ENV_TOKEN]: TOKEN, [ENV_URL]: URL_ } })
    expect(r.code).toBe(0)
    expect(r.live.calls).toHaveLength(0)
    const missingPart = /missing: ([^.]+)\./.exec(r.out[0])?.[1] ?? ''
    expect(missingPart.split(', ')).toEqual([ENV_REF, ENV_ANON_KEY])
  })

  it('a blank value counts as missing', () => {
    expect(missingEnv({ ...ENV, [ENV_ANON_KEY]: '   ' })).toEqual([ENV_ANON_KEY])
    expect(missingEnv(ENV)).toEqual([])
  })
})

describe('the happy path', () => {
  it('ledger matches the real archive, anon sees nothing → LIVE-CHECK PASSED, exit 0', async () => {
    const r = await runIt({})
    expect(r.code).toBe(0)
    expect(r.err).toEqual([])
    expect(r.out[0]).toMatch(/^db:live-check — READ-ONLY · project abcdefghijklmnopqrst/)
    const files = loadMigrations(ARCHIVE).length
    expect(r.out).toContain(
      `PASS  ledger: ${files} version(s) applied — every one of the ${files} archive file(s) present with its sha256, no extra version`,
    )
    expect(r.out).toContain(
      `PASS  anon GET ${REST_PROBES[0].path} (${PROFILE_HEADER}: hygieia) → 200 []`,
    )
    expect(r.out).toContain(
      `PASS  anon GET ${REST_PROBES[1].path} (${PROFILE_HEADER}: hygieia) → 200 []`,
    )
    expect(r.out.at(-1)).toBe(
      'LIVE-CHECK PASSED — 3 read-only probe(s) against project abcdefghijklmnopqrst',
    )
    expect(r.out.filter((l) => l.startsWith('PASS'))).toHaveLength(3)
  })

  it('is read-only: every Management API query is a SELECT, nothing else is sent', async () => {
    const r = await runIt({})
    const mgmt = r.live.mgmt()
    expect(mgmt.length).toBeGreaterThan(0)
    for (const c of mgmt) {
      expect(c.url).toBe(`https://api.supabase.com/v1/projects/${REF}/database/query`)
      expect(c.method).toBe('POST')
      expect(c.headers.Authorization).toBe(`Bearer ${TOKEN}`)
      expect(c.query).toMatch(/^select /)
      expect(c.query).not.toMatch(
        /\b(insert|update|delete|create|alter|drop|begin|commit|truncate)\b/i,
      )
    }
    for (const c of r.live.rest()) expect(c.method).toBe('GET')
  })

  it('the PostgREST probes carry the anon key and Accept-Profile: hygieia, in order', async () => {
    const r = await runIt({})
    const rest = r.live.rest()
    expect(rest.map((c) => c.url)).toEqual([
      `${URL_}/rest/v1/recipes?select=id&status=eq.pending`,
      `${URL_}/rest/v1/profiles?select=user_id`,
    ])
    for (const c of rest) {
      expect(c.headers[PROFILE_HEADER]).toBe('hygieia')
      expect(c.headers.apikey).toBe(ANON)
      expect(c.headers.Authorization).toBe(`Bearer ${ANON}`)
      expect(c.headers.Authorization).not.toContain(TOKEN)
    }
  })

  it('a trailing slash on the URL is tolerated', async () => {
    const r = await runIt({ env: { ...ENV, [ENV_URL]: `${URL_}/` } })
    expect(r.code).toBe(0)
    expect(r.live.rest()[0].url).toBe(`${URL_}/rest/v1/recipes?select=id&status=eq.pending`)
  })
})

describe('ledger mismatches', () => {
  it('a changed checksum fails', async () => {
    const dir = archiveCopy()
    const ledger = rowsOf(dir) // the ledger holds the ORIGINAL hashes
    const file = path.join(dir, loadMigrations(dir)[0].file)
    writeFileSync(file, readFileSync(file, 'utf8') + '\n-- an innocent-looking edit\n')
    const r = await runIt({ live: fakeLive({ ledger }), archiveDir: dir })
    expect(r.code).toBe(1)
    expect(r.out.find((l) => l.startsWith('FAIL  ledger'))).toMatch(
      /CHECKSUM MISMATCH: 20261006000100_hygieia_schema\.sql was applied with sha256 [0-9a-f]{64} but the file now hashes to [0-9a-f]{64}/,
    )
    expect(r.err.at(-1)).toMatch(/^LIVE-CHECK FAILED — ledger: CHECKSUM MISMATCH/)
    expect(r.all).not.toContain('LIVE-CHECK PASSED')
  })

  it('an extra live version fails', async () => {
    const ledger = [
      ...rowsOf(ARCHIVE),
      { version: '20991231000000', name: 'future', checksum: 'f'.repeat(64) },
    ]
    const r = await runIt({ live: fakeLive({ ledger }) })
    expect(r.code).toBe(1)
    expect(r.all).toMatch(
      /FAIL {2}ledger: EXTRA: live ledger holds version 20991231000000 \(future\) which has no file in this archive/,
    )
    expect(r.err.at(-1)).toMatch(/^LIVE-CHECK FAILED — ledger: EXTRA/)
  })

  it('a missing live version fails', async () => {
    const dir = fixture({
      '20260101000000_hygieia_a.sql': OK_SQL('a'),
      '20260102000000_hygieia_b.sql': OK_SQL('b'),
    })
    const r = await runIt({ live: fakeLive({ ledger: rowsOf(dir).slice(0, 1) }), archiveDir: dir })
    expect(r.code).toBe(1)
    expect(r.all).toMatch(
      /FAIL {2}ledger: MISSING: 20260102000000_hygieia_b\.sql is in the archive but not in the live ledger/,
    )
  })

  it('an absent ledger table is the mismatch "ledger absent — nothing applied yet"', async () => {
    const r = await runIt({ live: fakeLive({ ledger: null }) })
    expect(r.code).toBe(1)
    expect(r.out).toContain(`FAIL  ledger: ${LEDGER_ABSENT}`)
    expect(LEDGER_ABSENT).toMatch(/^ledger absent — nothing applied yet/)
    // only the to_regclass probe was sent; the rows query never ran
    expect(r.live.mgmt()).toHaveLength(1)
    expect(r.live.mgmt()[0].query).toContain('to_regclass')
  })

  it('compareLedger() is pure and reports every problem, archive order first, extras last', () => {
    const local = loadMigrations(
      fixture({
        '20260101000000_hygieia_a.sql': OK_SQL('a'),
        '20260102000000_hygieia_b.sql': OK_SQL('b'),
      }),
    )
    expect(compareLedger(local, null)).toEqual([LEDGER_ABSENT])
    expect(
      compareLedger(local, [
        { version: '20260101000000', name: 'a', checksum: checksum(OK_SQL('a')) },
        { version: '20260102000000', name: 'b', checksum: checksum(OK_SQL('b')) },
      ]),
    ).toEqual([])
    const problems = compareLedger(local, [
      { version: '20260101000000', name: 'a', checksum: '0'.repeat(64) },
      { version: '20260103000000', name: 'c', checksum: '1'.repeat(64) },
    ])
    expect(problems).toHaveLength(3)
    expect(problems[0]).toMatch(/^CHECKSUM MISMATCH: 20260101000000_hygieia_a\.sql/)
    expect(problems[1]).toMatch(/^MISSING: 20260102000000_hygieia_b\.sql/)
    expect(problems[2]).toMatch(/^EXTRA: live ledger holds version 20260103000000 \(c\)/)
  })

  it('a Management API error is a ledger FAIL, the anon probes still run, exit 1', async () => {
    const live = fakeLive({ mgmtError: { status: 500, body: { message: 'upstream unavailable' } } })
    const r = await runIt({ live })
    expect(r.code).toBe(1)
    expect(r.all).toMatch(/FAIL {2}ledger: HTTP 500: upstream unavailable/)
    expect(r.out.filter((l) => l.startsWith('PASS  anon GET'))).toHaveLength(2)
    expect(r.err.at(-1)).toBe('LIVE-CHECK FAILED — ledger: HTTP 500: upstream unavailable')
  })
})

describe('anon exposure mismatches (PostgREST)', () => {
  it('pending recipe rows visible to anon fail', async () => {
    const live = fakeLive({
      ledger: rowsOf(ARCHIVE),
      rest: { recipes: { status: 200, body: [{ id: 'x' }, { id: 'y' }] } },
    })
    const r = await runIt({ live })
    expect(r.code).toBe(1)
    expect(r.all).toMatch(
      /FAIL {2}anon GET \/rest\/v1\/recipes\?select=id&status=eq\.pending .*: anon can see pending recipe row\(s\) live .* \(2 row\(s\) returned\)/,
    )
    expect(r.err.at(-1)).toMatch(
      /^LIVE-CHECK FAILED — recipes: anon can see pending recipe row\(s\)/,
    )
    // the ledger and profiles probes still PASS
    expect(r.out.filter((l) => l.startsWith('PASS'))).toHaveLength(2)
  })

  it('profile rows visible to anon fail', async () => {
    const live = fakeLive({
      ledger: rowsOf(ARCHIVE),
      rest: {
        profiles: { status: 200, body: [{ user_id: '00000000-0000-0000-0000-000000000000' }] },
      },
    })
    const r = await runIt({ live })
    expect(r.code).toBe(1)
    expect(r.all).toMatch(
      /FAIL {2}anon GET \/rest\/v1\/profiles\?select=user_id .*: anon can see profile row\(s\) live/,
    )
    expect(r.err.at(-1)).toMatch(/^LIVE-CHECK FAILED — profiles: /)
  })

  it('406 PGRST106 (schema not in Accept-Profile list) is reported as "schema hygieia is not exposed"', async () => {
    const pgrst106 = {
      status: 406,
      body: {
        code: 'PGRST106',
        details: null,
        hint: null,
        message: 'The schema must be one of the following: public, graphql_public',
      },
    }
    const live = fakeLive({
      ledger: rowsOf(ARCHIVE),
      rest: { recipes: pgrst106, profiles: pgrst106 },
    })
    const r = await runIt({ live })
    expect(r.code).toBe(1)
    expect(SCHEMA_NOT_EXPOSED).toBe(
      'schema hygieia is not exposed in the Data API (ADR-0003 rule 5 / BRAIN O1)',
    )
    const fails = r.out.filter((l) => l.startsWith('FAIL  anon GET'))
    expect(fails).toHaveLength(2)
    for (const l of fails) {
      expect(l).toContain(SCHEMA_NOT_EXPOSED)
      expect(l).toContain('HTTP 406: The schema must be one of the following')
    }
    expect(r.err.at(-1)).toContain(`recipes: ${SCHEMA_NOT_EXPOSED}`)
  })

  it('a 404 whose message names the schema is the same mismatch; a PGRST205 404 is a missing table', () => {
    expect(
      classifyRestAnswer(
        404,
        parseRestBody('{"message":"Invalid schema: hygieia"}'),
        'recipes',
        'leak',
      ),
    ).toBe(`${SCHEMA_NOT_EXPOSED} — HTTP 404: Invalid schema: hygieia`)
    expect(
      classifyRestAnswer(
        404,
        parseRestBody(
          '{"code":"PGRST205","message":"Could not find the table \'hygieia.recipes\' in the schema cache"}',
        ),
        'recipes',
        'leak',
      ),
    ).toMatch(/^table hygieia\.recipes is not in the live Data API — its migration is not applied/)
    // other statuses are plain HTTP failures
    expect(
      classifyRestAnswer(401, parseRestBody('{"message":"Invalid API key"}'), 'recipes', 'leak'),
    ).toBe('HTTP 401: Invalid API key')
    expect(
      classifyRestAnswer(502, parseRestBody('<html>bad gateway</html>'), 'recipes', 'leak'),
    ).toBe('HTTP 502: <html>bad gateway</html>')
    // 200 with a non-array body is not "[]"
    expect(classifyRestAnswer(200, parseRestBody('{"hello":1}'), 'recipes', 'leak')).toMatch(
      /^HTTP 200: unexpected response payload/,
    )
    expect(classifyRestAnswer(200, parseRestBody('[]'), 'recipes', 'leak')).toBe('')
  })

  it('a network error on a probe is a FAIL with exit 1', async () => {
    const live = fakeLive({ ledger: rowsOf(ARCHIVE), throwOn: /\/rest\/v1\/profiles/ })
    const r = await runIt({ live }) // runIt asserts the token (echoed by the error) is absent
    expect(r.code).toBe(1)
    expect(r.all).toMatch(
      /FAIL {2}anon GET \/rest\/v1\/profiles.*: network error calling PostgREST: connect ECONNREFUSED/,
    )
    expect(r.all).toContain(`Bearer ${REDACTED}`)
  })
})

describe('neither credential ever appears in any output', () => {
  it('a Management API error that echoes the token is redacted', async () => {
    const live = fakeLive({
      mgmtError: { status: 401, body: { message: `invalid credentials for Bearer ${TOKEN}` } },
    })
    const r = await runIt({ live }) // runIt asserts TOKEN and ANON are absent from every line
    expect(r.code).toBe(1)
    expect(r.all).toContain(`FAIL  ledger: HTTP 401: invalid credentials for Bearer ${REDACTED}`)
  })

  it('a PostgREST error that echoes the anon key is redacted', async () => {
    const live = fakeLive({
      ledger: rowsOf(ARCHIVE),
      rest: { recipes: { status: 401, body: { message: `Invalid API key ${ANON}` } } },
    })
    const r = await runIt({ live })
    expect(r.code).toBe(1)
    expect(r.all).toContain(`HTTP 401: Invalid API key ${REDACTED}`)
  })

  it('a malformed ref or URL is refused with exit 2 before any request, without echoing the token', async () => {
    const bad = await runIt({ env: { ...ENV, [ENV_REF]: 'not a ref' } })
    expect(bad.code).toBe(2)
    expect(bad.live.calls).toHaveLength(0)
    expect(bad.err.join('\n')).toMatch(/project ref/)
    const badUrl = await runIt({ env: { ...ENV, [ENV_URL]: 'supabase.co' } })
    expect(badUrl.code).toBe(2)
    expect(badUrl.live.calls).toHaveLength(0)
    expect(badUrl.err.join('\n')).toMatch(/VITE_SUPABASE_URL must be an origin/)
  })
})
