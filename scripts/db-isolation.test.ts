// @vitest-environment node
//
// P1.8 — CROSS-USER ISOLATION under `npm test` (CLAUDE.md §3.2: every tenant table has an RLS policy
// AND a test proving cross-tenant isolation). The tenant is the user (`auth.uid()`).
//
// Runs the REAL committed archive (supabase/migrations, applied twice like `npm run db:gate`) against
// real Postgres (PGlite) dressed as Alyssos's shared project by ./db-gate/shim.mjs, seeds the SAME
// fixture the gate uses and runs the SAME per-kind checks (`checksFor` from ./db-gate/catalogue.mjs)
// for every `user` table and for `profiles`, each as its own Vitest case. One copy of the checks, so
// the gate and this suite cannot disagree about what "UA's rows" means. Every check runs in a
// transaction that is ROLLED BACK, so the fixture is identical for every case and the cases are
// order-independent. The content/child matrix and the structural sweep stay gate-only
// (`npm run db:gate`); the `user` + `profiles` kinds are what §3.2 names.
//
// Mutation knob: DB_GATE_MIGRATIONS points this suite (like the gate) at a mutated COPY of the
// archive, so a sabotaged migration can be shown to turn these tests RED without touching the
// committed files.

import { PGlite } from '@electric-sql/pglite'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { installShim } from './db-gate/shim.mjs'
import {
  ANON,
  CATALOGUE,
  U,
  applyArchive,
  checksFor,
  createHarness,
  refused,
  seedFixture,
} from './db-gate/catalogue.mjs'
import type { Check, Harness } from './db-gate/catalogue.mjs'
import { USER_TABLES } from '../src/content/enums.ts'

const MIG =
  process.env.DB_GATE_MIGRATIONS ??
  fileURLToPath(new URL('../supabase/migrations', import.meta.url))

const TENANT_ENTRIES = CATALOGUE.filter((e) => e.kind === 'user' || e.kind === 'profiles')

let db: PGlite
let h: Harness
/** Checks are built once the DB is up; the `it` names below are fixed from the catalogue shape. */
const built = new Map<string, Check[]>()

beforeAll(async () => {
  db = new PGlite()
  await installShim(db)
  await applyArchive(db, MIG, 2)
  await seedFixture(db)
  h = createHarness(db)
  for (const e of TENANT_ENTRIES) built.set(e.table, checksFor(e, h))
}, 120_000)

afterAll(async () => {
  await db?.close()
})

describe('the tenant tables of §3.2', () => {
  it('are the USER_TABLES plus profiles, each RLS-enabled', async () => {
    expect(TENANT_ENTRIES.map((e) => e.table).sort()).toEqual([...USER_TABLES, 'profiles'].sort())
    const rls = await db.query<{ relname: string; on: boolean }>(
      `select c.relname, c.relrowsecurity as "on" from pg_class c
         join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'hygieia' and c.relname = any ($1::text[])`,
      [TENANT_ENTRIES.map((e) => e.table)],
    )
    expect(rls.rows.length).toBe(TENANT_ENTRIES.length)
    for (const r of rls.rows) expect(r.on, `${r.relname} RLS`).toBe(true)
  })

  it('every tenant table has one policy per verb (select, insert, update, delete) TO authenticated only', async () => {
    for (const e of TENANT_ENTRIES) {
      const pol = await db.query<{ cmd: string; roles: string }>(
        `select p.polcmd::text as cmd, p.polroles::regrole[]::text as roles
           from pg_policy p where p.polrelid = $1::regclass order by 1`,
        [`hygieia.${e.table}`],
      )
      const cmds = pol.rows.map((p) => p.cmd).sort()
      if (e.kind === 'user') expect(cmds, e.table).toEqual(['a', 'd', 'r', 'w'])
      else expect(cmds, e.table).toEqual(['a', 'r', 'w']) // profiles: no client DELETE
      for (const p of pol.rows) expect(p.roles, e.table).toBe('{authenticated}')
    }
  })

  it('anon cannot read any tenant table', async () => {
    for (const e of TENANT_ENTRIES) {
      const o = await h.actAs(ANON, (s) => s.attempt(`select 1 from hygieia.${e.table} limit 1`))
      expect(refused(o), `${e.table}: ${JSON.stringify(o)}`).toBe(true)
    }
  })
})

// The per-kind checks, one Vitest case each. The names come from the catalogue, so a new check
// added there is a new case here without editing this file. `user`: 12 checks × 8 tables (plus a
// table's `clientWrites`: fridge_lists 2, goals 1);
// `profiles`: 12 checks. The fixture is UA/UB/ADMIN/NEW from the catalogue (U).
describe.each(TENANT_ENTRIES.map((e) => [e.table, e.kind] as const))('hygieia.%s (%s)', (table) => {
  // The list is read lazily (built in beforeAll); the number of cases per kind is pinned here so
  // the acceptance bar (≥ 3 tables × 6 checks) is a tested fact, not a hope.
  it('has at least six catalogue checks', () => {
    expect(built.get(table)?.length ?? 0).toBeGreaterThanOrEqual(6)
  })

  const kind = CATALOGUE.find((e) => e.table === table)?.kind
  const NAMES =
    kind === 'user'
      ? [
          'fixture is non-vacuous (A and B both have rows)',
          'UB reads ZERO rows of A',
          "UB reads all of B's own rows (not locked out)",
          "UB's UPDATE of A's rows has no effect",
          "UB's DELETE of A's rows has no effect",
          "UB's INSERT of a row of A is refused",
          "control — the same INSERT without user_id succeeds as UA and lands as A's row",
          "UB's INSERT without user_id lands as B's own row, never A's",
          'anon reads nothing and holds no privilege',
          "UA reads all of A's rows",
          "UA's UPDATE and DELETE of own rows take effect",
          'authenticated holds no INSERT or UPDATE privilege on user_id (it comes from default auth.uid())',
        ]
      : [
          'fixture holds UA, UB (is_admin = false) and ADMIN (is_admin = true)',
          "UB reads ZERO rows of A (UA's profile)",
          'UA reads exactly own row',
          "UA's update of is_admin is refused (no column grant)",
          "UA's insert with is_admin = true is refused",
          "NEW user's self-insert succeeds and lands with is_admin = false",
          "NEW user's insert of someone else's profile (UA's id) is refused",
          "UA's update of display_name takes effect",
          "UB's UPDATE and DELETE of UA's row have no effect",
          'anon reads nothing and holds no privilege',
          'hygieia.is_admin() is true for ADMIN, false for UA, false without a profile (NEW)',
          'anon cannot execute hygieia.is_admin()',
          'authenticated holds no INSERT or UPDATE privilege on is_admin',
        ]

  // Table-specific client-write checks (the exact statements the app sends, against the real grants).
  const entry = CATALOGUE.find((e) => e.table === table)
  if (entry?.kind === 'user') NAMES.push(...(entry.clientWrites ?? []).map((w) => w.name))

  it.each(NAMES)('%s', async (name) => {
    const check = built.get(table)?.find((c) => c.name === `hygieia.${table}: ${name}`)
    expect(check, `catalogue has "${name}"`).toBeDefined()
    const [ok, detail] = await check!.run()
    expect(ok, detail).toBe(true)
  })

  it('the catalogue has no check this file does not run', () => {
    const names = (built.get(table) ?? []).map((c) => c.name.replace(`hygieia.${table}: `, ''))
    expect(names.sort()).toEqual([...NAMES].sort())
  })
})

describe('fixture identities', () => {
  it('UA, UB, ADMIN and NEW are distinct auth users; NEW has no profile', async () => {
    const ids = Object.values(U)
    expect(new Set(ids).size).toBe(ids.length)
    const r = await db.query<{ n: number }>(
      `select count(*)::int as n from auth.users where id = any ($1::uuid[])`,
      [ids],
    )
    expect(r.rows[0].n).toBe(ids.length)
    const p = await db.query<{ n: number }>(
      `select count(*)::int as n from hygieia.profiles where user_id = $1`,
      [U.NEW],
    )
    expect(p.rows[0].n).toBe(0)
  })
})
