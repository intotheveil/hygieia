// @vitest-environment node
//
// P1.3 — `npm run db:apply`, the Management-API applier. Everything runs against a FAKE fetch
// that models the endpoint (a JSON array of rows on success, `{message}` + 4xx on a SQL error) and
// a tiny in-memory ledger, and (last block) against a fake fetch backed by PGlite + the db:gate
// shim, so the generated batches are proven to run on real Postgres. No network, no live project,
// no real token: the token below is a made-up marker, and every test asserts it never reaches any
// output line or error.
//
// Lifted from Themis (scripts/db-apply.test.ts). Hygieia's archive is one file at P1.3 and has no
// PAIRED group, so every multi-file scenario runs on a synthetic fixture archive (`fixture`), never
// on hard-coded sizes of the real one (Themis BRAIN §5).

import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  ENV_REF,
  ENV_TOKEN,
  LEDGER,
  PAIRED,
  buildBatch,
  checksum,
  findTransactionControl,
  loadMigrations,
  plan,
  run,
} from './db-apply.mjs'
import { MgmtApiError, REDACTED, createMgmtClient, redact } from './lib/mgmt-api.mjs'
import { PGlite } from '@electric-sql/pglite'
import { ALYSSOS_MIGRATION_ROWS, installShim } from './db-gate/shim.mjs'

const ARCHIVE = fileURLToPath(new URL('../supabase/migrations', import.meta.url))
const BOOTSTRAP = '20261006000100_hygieia_schema.sql'
const TOKEN = 'sbp_FAKE_TOKEN_0123456789abcdef_never_real'
const REF = 'abcdefghijklmnopqrst'
const ENV = { [ENV_TOKEN]: TOKEN, [ENV_REF]: REF }

type Row = { version: string; name: string; checksum: string }
type Call = { url: string; method: string; headers: Record<string, string>; query: string }

/**
 * A fake Management API. `ledger === null` models "hygieia.schema_migrations does not exist".
 * A committed batch appends its ledger inserts; a rolled-back one changes nothing. `failWhen`
 * turns a batch whose SQL matches into a 400 SQL error.
 */
function fakeApi(opts: { ledger?: Row[] | null; failWhen?: RegExp; failMessage?: string } = {}) {
  const state = { ledger: opts.ledger === undefined ? null : opts.ledger }
  const calls: Call[] = []
  const json = (body: unknown, status = 201) =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

  const fetchImpl: typeof fetch = async (input, init) => {
    const query = (JSON.parse(String(init?.body)) as { query: string }).query
    calls.push({
      url: String(input),
      method: String(init?.method),
      headers: { ...(init?.headers as Record<string, string>) },
      query,
    })
    if (query.includes('to_regclass')) return json([{ present: state.ledger !== null }])
    if (query.startsWith(`select version, name, checksum from ${LEDGER}`)) {
      return json(state.ledger ?? [])
    }
    if (opts.failWhen?.test(query)) {
      return json(
        { message: opts.failMessage ?? 'Failed to run sql query: ERROR:  42601: syntax error' },
        400,
      )
    }
    if (query.trimEnd().endsWith('commit;')) {
      const ins =
        /insert into hygieia\.schema_migrations \(version, name, checksum\) values \('(\d+)', '([a-z0-9_]+)', '([0-9a-f]+)'\)/g
      for (const m of query.matchAll(ins)) {
        state.ledger = [...(state.ledger ?? []), { version: m[1], name: m[2], checksum: m[3] }]
      }
    }
    return json([])
  }
  const batches = () => calls.filter((c) => c.query.startsWith('begin;'))
  return { fetch: fetchImpl, calls, batches, state }
}

let dirs: string[] = []
const tempDir = () => {
  const d = mkdtempSync(path.join(tmpdir(), 'hygieia-db-apply-'))
  dirs = [...dirs, d]
  return d
}
/** A copy of the real archive. */
const archiveCopy = () => {
  const d = tempDir()
  cpSync(ARCHIVE, d, { recursive: true })
  return d
}
/** The real archive's size, as the applier must report it. */
const realArchive = () => {
  const local = loadMigrations(ARCHIVE)
  const units = plan(local, []).units
  // Every pair merges two files into one transaction; nothing else is merged.
  expect(units).toHaveLength(local.length - PAIRED.length)
  return { local, units, files: local.length, txs: units.length }
}
/** A fixture archive: name → sql. */
const fixture = (files: Record<string, string>) => {
  const d = tempDir()
  for (const [f, sql] of Object.entries(files)) writeFileSync(path.join(d, f), sql)
  return d
}
const OK_SQL = (t: string) => `create table if not exists hygieia.${t} (id int);\n`
/** The frozen bootstrap followed by three synthetic files: exact multi-file scenarios run here. */
const FOUR = [
  BOOTSTRAP,
  '20261006010000_hygieia_b.sql',
  '20261006020000_hygieia_c.sql',
  '20261006030000_hygieia_d.sql',
]
const fourFileArchive = () => {
  const d = fixture({
    [FOUR[1]]: OK_SQL('b'),
    [FOUR[2]]: OK_SQL('c'),
    [FOUR[3]]: OK_SQL('d'),
  })
  cpSync(path.join(ARCHIVE, BOOTSTRAP), path.join(d, BOOTSTRAP))
  expect(loadMigrations(d).map((m) => m.file)).toEqual(FOUR)
  return d
}
const rowsOf = (dir: string) =>
  loadMigrations(dir).map((x) => ({ version: x.version, name: x.name, checksum: x.checksum }))

beforeEach(() => {
  dirs = []
})
afterEach(() => {
  for (const d of dirs) rmSync(d, { recursive: true, force: true })
})

/** Run the applier, capturing stdout/stderr. */
async function runIt(o: {
  argv?: string[]
  env?: Record<string, string | undefined>
  api?: ReturnType<typeof fakeApi>
  dir?: string
}) {
  const out: string[] = []
  const err: string[] = []
  const api = o.api ?? fakeApi()
  const code = await run({
    argv: o.argv ?? [],
    env: o.env ?? ENV,
    fetch: api.fetch,
    dir: o.dir ?? archiveCopy(),
    log: (s) => out.push(s),
    error: (s) => err.push(s),
  })
  const all = [...out, ...err].join('\n')
  // The token must never surface, whatever happened.
  expect(all).not.toContain(TOKEN)
  return { code, out, err, all, api }
}

describe('credentials', () => {
  it('names the two env vars of ADR-0003', () => {
    expect(ENV_TOKEN).toBe('SUPABASE_ACCESS_TOKEN')
    expect(ENV_REF).toBe('HYGIEIA_SUPABASE_PROJECT_REF')
    expect(LEDGER).toBe('hygieia.schema_migrations')
  })

  it.each([
    ['both', {}],
    ['the token', { [ENV_REF]: REF }],
    ['the ref', { [ENV_TOKEN]: TOKEN }],
  ])('exits 2 and sends nothing when %s is missing', async (_label, env) => {
    const r = await runIt({ env })
    expect(r.code).toBe(2)
    expect(r.api.calls).toHaveLength(0)
    expect(r.err.join('\n')).toMatch(/missing env/)
    // The message names BOTH variables every time (the missing one(s) and the export hint).
    expect(r.err.join('\n')).toContain(ENV_TOKEN)
    expect(r.err.join('\n')).toContain(ENV_REF)
  })

  it('treats an empty value as missing', async () => {
    const r = await runIt({ env: { [ENV_TOKEN]: '', [ENV_REF]: REF } })
    expect(r.code).toBe(2)
    expect(r.api.calls).toHaveLength(0)
  })

  it('exits 2 on an unknown flag, before any request', async () => {
    const r = await runIt({ argv: ['--commit'] })
    expect(r.code).toBe(2)
    expect(r.api.calls).toHaveLength(0)
    expect(r.err.join('\n')).toContain('npm run db:apply [-- --apply]')
  })

  it('sends the token only as a Bearer header, to the query endpoint of the ref', async () => {
    const r = await runIt({})
    expect(r.code).toBe(0)
    expect(r.api.calls.length).toBeGreaterThan(0)
    for (const c of r.api.calls) {
      expect(c.url).toBe(`https://api.supabase.com/v1/projects/${REF}/database/query`)
      expect(c.method).toBe('POST')
      expect(c.headers.Authorization).toBe(`Bearer ${TOKEN}`)
      expect(c.url).not.toContain(TOKEN)
      expect(c.query).not.toContain(TOKEN)
    }
  })
})

describe('dry-run (the default)', () => {
  it('prints the plan, rolls back every batch, and commits nothing', async () => {
    const { files, txs } = realArchive()
    const r = await runIt({})
    expect(r.code).toBe(0)
    expect(r.out[0]).toMatch(/DRY-RUN .*nothing is committed.*project abcdefghijklmnopqrst/)
    expect(r.out).toContain(
      `PASS  migration guard: ${files} migration(s) stay inside schema hygieia`,
    )
    expect(r.out).toContain(`ledger: ${LEDGER} does not exist — nothing applied yet`)
    expect(r.out).toContain(`PLAN  ${files} pending file(s) in ${txs} transaction(s):`)
    expect(r.all).toContain(BOOTSTRAP)
    expect(r.out.at(-1)).toMatch(new RegExp(`^DRY-RUN PASSED — ${files} pending file\\(s\\)`))
    const batches = r.api.batches()
    expect(batches).toHaveLength(txs)
    for (const b of batches) {
      expect(b.query.trimEnd().endsWith('rollback;')).toBe(true)
      expect(b.query).not.toMatch(/\bcommit;/)
    }
    expect(r.api.state.ledger).toBeNull()
  })

  it('tries each unit on top of the pending units before it (cumulative, rolled back)', async () => {
    const dir = fourFileArchive()
    const r = await runIt({ dir })
    expect(r.code).toBe(0)
    const batches = r.api.batches()
    expect(batches).toHaveLength(FOUR.length)
    // batch k holds units 1..k: a later file is tried with the bootstrap's schema present.
    expect(batches[1].query.indexOf(`-- >>> ${FOUR[0]}`)).toBeGreaterThan(-1)
    expect(batches[1].query.indexOf(`-- >>> ${FOUR[1]}`)).toBeGreaterThan(
      batches[1].query.indexOf(`-- >>> ${FOUR[0]}`),
    )
    // ...and exactly those: batch k carries units 1..k, in order, and nothing later.
    batches.forEach((b, k) => {
      const sent = [...b.query.matchAll(/^-- >>> (\S+)$/gm)].map((m) => m[1])
      expect(sent).toEqual(FOUR.slice(0, k + 1))
      expect(b.query.trimEnd().endsWith('rollback;')).toBe(true)
    })
  })

  it('reports the failing unit, exits 1, and never commits', async () => {
    const api = fakeApi({ failWhen: /-- >>> 20261006020000/ })
    const r = await runIt({ api, dir: fourFileArchive() })
    expect(r.code).toBe(1)
    expect(r.all).toMatch(
      /FAIL {2}dry-run 20261006020000_hygieia_c\.sql: HTTP 400: Failed to run sql query/,
    )
    expect(r.err.join('\n')).toMatch(/DRY-RUN FAILED at 20261006020000_hygieia_c\.sql/)
    expect(api.batches()).toHaveLength(3) // stopped at the first failure
    expect(api.state.ledger).toBeNull()
  })
})

describe('the transaction wrapping', () => {
  const m = loadMigrations(ARCHIVE)[0]

  it('wraps a file and its ledger insert in ONE transaction with local timeouts', () => {
    for (const end of ['commit', 'rollback'] as const) {
      const b = buildBatch([m], end)
      const lines = b.split('\n')
      expect(lines.slice(0, 3)).toEqual([
        'begin;',
        "set local lock_timeout = '5s';",
        "set local statement_timeout = '60s';",
      ])
      expect(lines.at(-1)).toBe(`${end};`)
      const sqlAt = b.indexOf(m.sql.replace(/\r\n/g, '\n').trimEnd())
      const insertAt = b.indexOf(
        `insert into hygieia.schema_migrations (version, name, checksum) values ('${m.version}', '${m.name}', '${m.checksum}');`,
      )
      expect(sqlAt).toBeGreaterThan(b.indexOf("statement_timeout = '60s'"))
      expect(insertAt).toBeGreaterThan(sqlAt)
      expect(b.lastIndexOf(`${end};`)).toBeGreaterThan(insertAt)
      expect(b.match(/^begin;$/gm)).toHaveLength(1)
      // what the applier adds never names Alyssos's ledger (the file's own comments may)
      expect(b.replace(m.sql.replace(/\r\n/g, '\n').trimEnd(), '')).not.toContain(
        'supabase_migrations',
      )
    }
  })

  it('the ledger row carries the sha256 of the LF-normalised file text', () => {
    const b = buildBatch([m], 'commit')
    const hex = /values \('\d{14}', '[a-z0-9_]+', '([0-9a-f]{64})'\)/.exec(b)?.[1]
    expect(hex).toBe(checksum(readFileSync(path.join(ARCHIVE, m.file), 'utf8')))
  })

  it('--apply sends one committed batch per unit, each carrying its own ledger rows', async () => {
    const { files, txs } = realArchive()
    const api = fakeApi()
    const r = await runIt({ argv: ['--apply'], api })
    expect(r.code).toBe(0)
    expect(r.out[0]).toMatch(/APPLY \(each batch COMMITs\)/)
    const batches = api.batches()
    expect(batches).toHaveLength(txs)
    for (const b of batches) expect(b.query.trimEnd().endsWith('commit;')).toBe(true)
    expect(api.state.ledger).toEqual(rowsOf(ARCHIVE))
    expect(r.out.at(-1)).toBe(
      `APPLY PASSED — ${files} file(s) committed and recorded in ${LEDGER}.`,
    )
  })

  it('prints the plan before sending any migration batch', async () => {
    const order: string[] = []
    const api = fakeApi()
    const inner = api.fetch
    const spy: typeof fetch = async (input, init) => {
      const q = (JSON.parse(String(init?.body)) as { query: string }).query
      if (q.startsWith('begin;')) order.push('batch')
      return inner(input, init)
    }
    await run({
      argv: ['--apply'],
      env: ENV,
      fetch: spy,
      dir: archiveCopy(),
      log: (s) => {
        if (s.startsWith('PLAN')) order.push('plan')
      },
      error: () => {},
    })
    expect(order[0]).toBe('plan')
    expect(order.filter((x) => x === 'batch')).toHaveLength(realArchive().txs)
  })

  it('an already-applied archive is a no-op', async () => {
    const api = fakeApi({ ledger: rowsOf(ARCHIVE) })
    const r = await runIt({ argv: ['--apply'], api })
    expect(r.code).toBe(0)
    expect(r.all).toMatch(/PLAN {2}nothing pending/)
    expect(api.batches()).toHaveLength(0)
  })
})

describe('pending detection', () => {
  it('only the versions missing from the ledger are pending', async () => {
    const dir = fourFileArchive()
    const applied = rowsOf(dir).slice(0, 2)
    const api = fakeApi({ ledger: applied })
    const r = await runIt({ argv: ['--apply'], api, dir })
    expect(r.code).toBe(0)
    expect(r.out).toContain('ledger: 2 version(s) applied')
    expect(r.out).toContain('PLAN  2 pending file(s) in 2 transaction(s):')
    const sent = api
      .batches()
      .map((b) => [...b.query.matchAll(/^-- >>> (\S+)$/gm)].map((m) => m[1]))
    expect(sent).toEqual([[FOUR[2]], [FOUR[3]]])
    expect(api.state.ledger?.map((x) => x.version)).toEqual(FOUR.map((f) => f.slice(0, 14)))
  })

  it('plan() is pure: an absent ledger makes every file pending, in order, one unit each', () => {
    const local = loadMigrations(ARCHIVE)
    const p = plan(local, [])
    expect(p.problems).toEqual([])
    expect(p.pending.map((m) => m.file)).toEqual(local.map((m) => m.file))
    expect(p.units.map((u) => u.length)).toEqual(local.map(() => 1))
    expect(PAIRED).toEqual([])
  })
})

describe('refusals (nothing but reads is sent)', () => {
  it('refuses when an applied file checksum changed', async () => {
    const dir = fourFileArchive()
    const local = loadMigrations(dir)
    const applied = rowsOf(dir).slice(0, 2)
    const edited = path.join(dir, local[1].file)
    writeFileSync(edited, readFileSync(edited, 'utf8') + '\n-- an innocent-looking edit\n')
    const api = fakeApi({ ledger: applied })
    const r = await runIt({ argv: ['--apply'], api, dir })
    expect(r.code).toBe(1)
    expect(r.all).toContain(`CHECKSUM CHANGED: ${local[1].file}`)
    expect(r.err.join('\n')).toMatch(/REFUSED/)
    expect(api.batches()).toHaveLength(0)
  })

  it('a CRLF checkout of the same file is NOT a checksum change', () => {
    const lf = 'create table if not exists hygieia.a (id int);\n-- x\n'
    expect(checksum(lf.replace(/\n/g, '\r\n'))).toBe(checksum(lf))
  })

  it('refuses when an applied version has no file in the archive', async () => {
    const dir = fixture({ '20260101000000_hygieia_a.sql': OK_SQL('a') })
    const api = fakeApi({
      ledger: [
        { version: '20260101000000', name: 'a', checksum: checksum(OK_SQL('a')) },
        { version: '20260102000000', name: 'gone', checksum: 'f'.repeat(64) },
      ],
    })
    const r = await runIt({ argv: ['--apply'], api, dir })
    expect(r.code).toBe(1)
    expect(r.all).toMatch(/applied version 20260102000000 \(gone\) has no file/)
    expect(api.batches()).toHaveLength(0)
  })

  it('refuses a pending file older than the newest applied one', async () => {
    const dir = fixture({
      '20260101000000_hygieia_a.sql': OK_SQL('a'),
      '20260103000000_hygieia_c.sql': OK_SQL('c'),
    })
    const api = fakeApi({
      ledger: [{ version: '20260103000000', name: 'c', checksum: checksum(OK_SQL('c')) }],
    })
    const r = await runIt({ argv: ['--apply'], api, dir })
    expect(r.code).toBe(1)
    expect(r.all).toMatch(/OUT OF ORDER: 20260101000000_hygieia_a\.sql/)
    expect(api.batches()).toHaveLength(0)
  })

  it('refuses to run, with no request at all, when db:check fails', async () => {
    const dir = fixture({ '20260101000000_hygieia_a.sql': 'create table public.leak (id int);\n' })
    const api = fakeApi()
    const r = await runIt({ api, dir })
    expect(r.code).toBe(1)
    expect(r.all).toMatch(/FAIL {2}20260101000000_hygieia_a\.sql:1 {2}\[forbidden-schema\]/)
    expect(r.err.join('\n')).toMatch(/static migration guard \(db:check\) is red/)
    expect(api.calls).toHaveLength(0)
  })

  it('refuses a themis-named file (the donor’s name is not a hygieia migration)', async () => {
    const dir = fixture({ '20260101000000_themis_a.sql': OK_SQL('a') })
    const api = fakeApi()
    const r = await runIt({ api, dir })
    expect(r.code).toBe(1)
    expect(r.all).toMatch(/\[filename\]/)
    expect(api.calls).toHaveLength(0)
  })

  it('refuses a pending file that carries its own transaction control', async () => {
    const dir = fixture({ '20260101000000_hygieia_a.sql': OK_SQL('a') + 'commit;\n' })
    const api = fakeApi()
    const r = await runIt({ api, dir })
    expect(r.code).toBe(1)
    expect(r.all).toMatch(/TRANSACTION CONTROL in 20260101000000_hygieia_a\.sql \(commit\)/)
    expect(api.batches()).toHaveLength(0)
  })

  it('findTransactionControl ignores plpgsql begin/end, strings and comments', () => {
    expect(
      findTransactionControl(
        [
          '-- commit;',
          "comment on table hygieia.a is 'begin; commit;';",
          'create or replace function hygieia.f() returns trigger language plpgsql as $fn$',
          'begin',
          '  return new;',
          'end;',
          '$fn$;',
          'do $$ begin perform 1; end $$;',
        ].join('\n'),
      ),
    ).toEqual([])
    expect(findTransactionControl('select 1;\nend;')).toEqual(['end'])
    expect(findTransactionControl('rollback;')).toEqual(['rollback'])
    expect(findTransactionControl('begin;\nselect 1;\ncommit;')).toEqual(['begin', 'commit'])
    // the real archive is clean
    for (const m of loadMigrations(ARCHIVE)) expect(findTransactionControl(m.sql)).toEqual([])
  })
})

describe('--apply stops at the first failure', () => {
  it('commits the units before, attempts none after, exits 1', async () => {
    const api = fakeApi({ failWhen: /-- >>> 20261006020000/ })
    const r = await runIt({ argv: ['--apply'], api, dir: fourFileArchive() })
    expect(r.code).toBe(1)
    expect(api.batches()).toHaveLength(3)
    expect(api.state.ledger?.map((x) => x.version)).toEqual(['20261006000100', '20261006010000'])
    expect(r.err.join('\n')).toMatch(
      /APPLY FAILED at 20261006020000_hygieia_c\.sql — its transaction was not committed\. 2 file\(s\) committed before it; 1 later file\(s\) not attempted\./,
    )
  })

  it('an error payload on a 2xx status is still an error', async () => {
    const base = fakeApi()
    const api = {
      ...base,
      fetch: (async (input, init) => {
        const q = (JSON.parse(String(init?.body)) as { query: string }).query
        if (q.startsWith('begin;')) {
          base.calls.push({ url: String(input), method: 'POST', headers: {}, query: q })
          return new Response(JSON.stringify({ message: 'ERROR: relation x does not exist' }), {
            status: 200,
          })
        }
        return base.fetch(input, init)
      }) as typeof fetch,
    }
    const r = await runIt({ argv: ['--apply'], api })
    expect(r.code).toBe(1)
    expect(r.all).toMatch(/HTTP 200: ERROR: relation x does not exist/)
    expect(base.batches()).toHaveLength(1)
  })
})

describe('the token never appears in any output or error', () => {
  it('an API error that echoes the token is redacted', async () => {
    const api = fakeApi({
      failWhen: new RegExp(`-- >>> ${BOOTSTRAP.slice(0, 14)}`),
      failMessage: `invalid credentials for Bearer ${TOKEN}`,
    })
    const r = await runIt({ argv: ['--apply'], api }) // runIt asserts the token is absent
    expect(r.code).toBe(1)
    expect(r.all).toContain(`Bearer ${REDACTED}`)
  })

  it('a network error that echoes the token is redacted', async () => {
    const boom: typeof fetch = async () => {
      throw new Error(`connect ECONNREFUSED (Authorization: Bearer ${TOKEN})`)
    }
    const out: string[] = []
    const code = await run({
      env: ENV,
      fetch: boom,
      dir: archiveCopy(),
      log: (s) => out.push(s),
      error: (s) => out.push(s),
    })
    expect(code).toBe(1)
    expect(out.join('\n')).not.toContain(TOKEN)
    expect(out.join('\n')).toMatch(/network error calling the Management API/)
  })

  it('the client throws a redacted MgmtApiError with the status', async () => {
    const client = createMgmtClient({
      token: TOKEN,
      ref: REF,
      fetch: async () => new Response(JSON.stringify({ message: `bad ${TOKEN}` }), { status: 401 }),
    })
    const e = await client.query('select 1').catch((x: unknown) => x)
    expect(e).toBeInstanceOf(MgmtApiError)
    expect((e as MgmtApiError).status).toBe(401)
    expect((e as MgmtApiError).message).toBe(`HTTP 401: bad ${REDACTED}`)
  })

  it('redact() replaces every occurrence and ignores empty secrets', () => {
    expect(redact(`a${TOKEN}b${TOKEN}`, [TOKEN, '', undefined])).toBe(`a${REDACTED}b${REDACTED}`)
  })

  it('a malformed ref is refused without echoing the token', () => {
    expect(() => createMgmtClient({ token: TOKEN, ref: 'not a ref' })).toThrow(/project ref/)
    try {
      createMgmtClient({ token: TOKEN, ref: 'not a ref' })
    } catch (x) {
      expect(String(x)).not.toContain(TOKEN)
    }
  })
})

// The batches are not only well-formed text: they run on real Postgres. A fake fetch backed by
// PGlite dressed as the shared project (the db:gate shim) executes each request the way the
// endpoint does (one request = one session; an error rolls the open transaction back).
describe('the batches execute on real Postgres (PGlite + the db:gate shim)', () => {
  const pgliteApi = async () => {
    const db = new PGlite()
    await installShim(db)
    const fetchImpl: typeof fetch = async (_input, init) => {
      const query = (JSON.parse(String(init?.body)) as { query: string }).query
      try {
        const results = await db.exec(query)
        return new Response(JSON.stringify(results.at(-1)?.rows ?? []), { status: 201 })
      } catch (e) {
        await db.exec('rollback;').catch(() => undefined)
        const msg = e instanceof Error ? e.message : String(e)
        return new Response(JSON.stringify({ message: `Failed to run sql query: ${msg}` }), {
          status: 400,
        })
      }
    }
    return { db, fetch: fetchImpl }
  }
  const quiet = { log: () => undefined, error: () => undefined }
  const count = async (db: PGlite, sql: string) =>
    Number((await db.query<{ n: number }>(sql)).rows[0].n)

  it('dry-run leaves nothing behind; --apply records every file; a re-run is a no-op', async () => {
    const { db, fetch: f } = await pgliteApi()
    const dir = archiveCopy()

    expect(await run({ env: ENV, fetch: f, dir, ...quiet })).toBe(0)
    expect(
      await count(db, "select count(*)::int as n from pg_namespace where nspname = 'hygieia'"),
    ).toBe(0)

    expect(await run({ argv: ['--apply'], env: ENV, fetch: f, dir, ...quiet })).toBe(0)
    const rows = (
      await db.query<{ version: string; name: string; checksum: string }>(
        'select version, name, checksum from hygieia.schema_migrations order by version',
      )
    ).rows
    expect(rows).toEqual(rowsOf(dir))
    // Alyssos's ledger is untouched
    expect(
      await count(db, 'select count(*)::int as n from supabase_migrations.schema_migrations'),
    ).toBe(ALYSSOS_MIGRATION_ROWS)

    const out: string[] = []
    expect(
      await run({
        argv: ['--apply'],
        env: ENV,
        fetch: f,
        dir,
        log: (s) => out.push(s),
        error: () => undefined,
      }),
    ).toBe(0)
    expect(out.join('\n')).toMatch(/PLAN {2}nothing pending/)
    await db.close()
  }, 60_000)

  it('a SQL error in a later file leaves it and its ledger row uncommitted; the earlier files stand', async () => {
    const { db, fetch: f } = await pgliteApi()
    const dir = fourFileArchive()
    const file = path.join(dir, FOUR[2])
    writeFileSync(file, readFileSync(file, 'utf8') + '\nselect hygieia.no_such_function();\n')

    expect(await run({ argv: ['--apply'], env: ENV, fetch: f, dir, ...quiet })).toBe(1)
    const versions = (
      await db.query<{ version: string }>(
        'select version from hygieia.schema_migrations order by 1',
      )
    ).rows.map((r) => r.version)
    expect(versions).toEqual([FOUR[0].slice(0, 14), FOUR[1].slice(0, 14)])
    expect(await count(db, "select count(*)::int as n from pg_class where relname = 'c'")).toBe(0)
    expect(await count(db, "select count(*)::int as n from pg_class where relname = 'd'")).toBe(0)
    expect(await count(db, "select count(*)::int as n from pg_class where relname = 'b'")).toBe(1)
    await db.close()
  }, 60_000)
})
