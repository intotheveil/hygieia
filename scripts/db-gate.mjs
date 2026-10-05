// THE MIGRATION GATE — `npm run db:gate`
//
// CLAUDE.md §9 says P1 is not claimed until its migrations "apply on a FRESH db with zero errors"
// and isolation is proven. This file IS that gate, re-runnable by anyone on any checkout.
//
// It runs the committed migrations against REAL PostgreSQL (PGlite is Postgres compiled to wasm,
// not an emulation) in a throwaway in-memory database. It NEVER touches the live Supabase project
// and needs no credential. Pattern: Themis scripts/db-gate.mjs (itself from argus-news).
//
// Hygieia shares Alyssos's live project (ADR-0003), so the database is first dressed as THAT
// project by ./db-gate/shim.mjs (Supabase roles + auth, Alyssos's `public` and migration ledger),
// and nothing is pre-granted on schema `hygieia`: a grant a migration forgot must fail a
// positive-path check here, not surface live.
//
// P1.1 runs the static guard (./check-migrations.mjs) before anything is applied.
// P1.2 scope (this file): the harness, apply + re-apply (idempotency), the bootstrap's own
// contract, and the "Alyssos's side is untouched" invariance.
// P1.8 adds the structural sweep over every hygieia table and object, the catalogue coverage
// check, the seeded fixture with its orphan scan, and the isolation + role matrix.

import { PGlite } from '@electric-sql/pglite'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { installShim, foreignSnapshot, ALYSSOS_MIGRATION_ROWS } from './db-gate/shim.mjs'
import { runGuard } from './check-migrations.mjs'

// Overridable so the gate can be pointed at a MUTATED copy of the archive and proven to go red
// (P1.14). A gate nobody has ever seen fail is not a gate.
const MIG =
  process.env.DB_GATE_MIGRATIONS ??
  fileURLToPath(new URL('../supabase/migrations', import.meta.url))

// Every exit path RETURNS its code; nothing calls process.exit(). On Windows an immediate
// process.exit() after PGlite work can crash node (libuv `!(handle->flags & UV_HANDLE_CLOSING)`,
// 0xC0000409) instead of exiting 1, which prove-red then reads as a WRONG sabotage (Themis BRAIN
// §5). So PGlite is closed on every path and `process.exitCode` is set once, here.
process.exitCode = await main()

/** @returns {Promise<number>} the exit code */
async function main() {
  // --- static guard first (P1.1): nothing outside schema `hygieia`, well-formed names -----------
  // A migration that reaches into Alyssos's schemas must never even be executed, not even in wasm.
  if (!runGuard(MIG)) {
    console.log(
      '\nGATE FAILED — the static migration guard is red (npm run db:check); nothing was applied.',
    )
    return 1
  }
  console.log('')

  const db = new PGlite()
  try {
    return await runGate(db)
  } finally {
    await db.close()
  }
}

/**
 * Apply the archive twice, then every bootstrap-contract and invariance check.
 * @param {PGlite} db a fresh in-memory database, closed by the caller
 * @returns {Promise<number>} 0 = GATE PASSED, 1 = red
 */
async function runGate(db) {
  /** @param {string} sql @param {unknown[]} [params] */
  const q = (sql, params) => db.query(sql, params)
  let failures = 0
  /** @param {string} name @param {boolean} ok @param {string} [detail] */
  const check = (name, ok, detail = '') => {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`)
    if (!ok) failures++
  }
  const errMsg = (/** @type {unknown} */ e) => (e instanceof Error ? e.message : String(e))

  // --- the shared project, as Hygieia finds it ----------------------------------------------------
  await installShim(db)
  // Taken BEFORE the archive runs: the invariance check diffs Alyssos's schemas against it.
  const foreignBefore = await foreignSnapshot(db)
  check(
    `shim: Alyssos migration ledger holds ${ALYSSOS_MIGRATION_ROWS} rows`,
    foreignBefore.alyssos_ledger_rows === ALYSSOS_MIGRATION_ROWS,
    `${foreignBefore.alyssos_ledger_rows} rows`,
  )
  check(
    'shim: public.spatial_ref_sys has RLS OFF (as live)',
    foreignBefore.spatial_rls === false,
    String(foreignBefore.spatial_rls),
  )

  // --- apply, in order, zero errors --------------------------------------------------------------
  const files = existsSync(MIG)
    ? readdirSync(MIG)
        .filter((f) => f.endsWith('.sql'))
        .sort()
    : []
  if (files.length === 0) {
    console.log(`FAIL  no migrations found in ${MIG} — the gate has nothing to prove`)
    return 1
  }
  for (const f of files) {
    try {
      await db.exec(readFileSync(path.join(MIG, f), 'utf8'))
      console.log(`applied  ${f}`)
    } catch (e) {
      check(`apply ${f}`, false, errMsg(e))
      console.log('\nAPPLY FAILED — stopping.')
      return 1
    }
  }

  // --- idempotent-safe: the whole archive runs a second time without error (CLAUDE.md §3.3) -------
  for (const f of files) {
    try {
      await db.exec(readFileSync(path.join(MIG, f), 'utf8'))
      check(`re-apply ${f} (idempotent-safe)`, true)
    } catch (e) {
      check(`re-apply ${f} (idempotent-safe)`, false, errMsg(e))
    }
  }
  console.log('')

  // --- bootstrap contract ------------------------------------------------------------------------
  const schema = await q(`select 1 from pg_namespace where nspname = 'hygieia'`)
  check('schema hygieia exists', schema.rows.length === 1)

  const cols = await q(
    `select a.attname, format_type(a.atttypid, a.atttypmod) as type
       from pg_attribute a
      where a.attrelid = to_regclass('hygieia.schema_migrations') and a.attnum > 0
        and not a.attisdropped
      order by a.attnum`,
  )
  const gotCols = cols.rows.map((r) => `${r.attname}:${r.type}`).join(',')
  check(
    'hygieia.schema_migrations has (version text, name text, checksum text, applied_at timestamptz)',
    gotCols === 'version:text,name:text,checksum:text,applied_at:timestamp with time zone',
    gotCols || 'table missing',
  )

  const pk = await q(
    `select a.attname from pg_constraint c
       join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
      where c.conrelid = to_regclass('hygieia.schema_migrations') and c.contype = 'p'`,
  )
  check(
    'hygieia.schema_migrations primary key is version',
    pk.rows.length === 1 && pk.rows[0].attname === 'version',
    pk.rows.map((r) => r.attname).join(','),
  )

  const ledgerRls = await q(
    `select c.relrowsecurity,
            (select count(*)::int from pg_policy p where p.polrelid = c.oid) as policies
       from pg_class c where c.oid = to_regclass('hygieia.schema_migrations')`,
  )
  check('hygieia.schema_migrations has RLS enabled', ledgerRls.rows[0]?.relrowsecurity === true)
  check(
    'hygieia.schema_migrations has NO policies',
    ledgerRls.rows[0]?.policies === 0,
    `${ledgerRls.rows[0]?.policies ?? '?'} policies`,
  )

  for (const role of ['anon', 'authenticated']) {
    const priv = await q(
      `select p.priv from unnest(array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) as p(priv)
        where has_table_privilege($1, 'hygieia.schema_migrations', p.priv)`,
      [role],
    )
    check(
      `${role} holds no privilege on hygieia.schema_migrations`,
      priv.rows.length === 0,
      priv.rows.map((r) => r.priv).join(','),
    )
  }

  // Positive path: the API roles must be able to USE the schema, or every later grant is dead.
  for (const role of ['anon', 'authenticated', 'service_role']) {
    const u = await q(`select has_schema_privilege($1, 'hygieia', 'USAGE') as ok`, [role])
    check(`${role} has USAGE on schema hygieia`, u.rows[0].ok === true)
  }

  const fn = await q(
    `select p.oid, p.proconfig, p.prorettype::regtype::text as rettype from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'hygieia' and p.proname = 'touch_updated_at'`,
  )
  check(
    'hygieia.touch_updated_at() exists and returns trigger',
    fn.rows.length === 1 && fn.rows[0].rettype === 'trigger',
  )
  check(
    'hygieia.touch_updated_at() has search_path pinned',
    fn.rows.length === 1 &&
      /** @type {unknown[]} */ (fn.rows[0].proconfig ?? []).some((c) =>
        String(c).startsWith('search_path='),
      ),
    String(fn.rows[0]?.proconfig ?? 'none'),
  )
  if (fn.rows.length === 1) {
    const anonExec = await q(`select has_function_privilege('anon', $1::oid, 'EXECUTE') as ok`, [
      fn.rows[0].oid,
    ])
    check('anon holds no EXECUTE on hygieia.touch_updated_at()', anonExec.rows[0].ok === false)
    // proacl NULL means the DEFAULT acl, which grants PUBLIC; aclexplode over acldefault sees it.
    const publicExec = await q(
      `select exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
                       where a.grantee = 0 and a.privilege_type = 'EXECUTE') as ok
         from pg_proc p where p.oid = $1::oid`,
      [fn.rows[0].oid],
    )
    check('PUBLIC holds no EXECUTE on hygieia.touch_updated_at()', publicExec.rows[0].ok === false)
  }

  // Functional: the trigger function actually bumps updated_at (on a temp table, not in hygieia).
  try {
    await db.exec(`
      create temp table gate_touch (id int primary key, v int, updated_at timestamptz);
      create trigger gate_touch_bump before update on gate_touch
        for each row execute function hygieia.touch_updated_at();
      insert into gate_touch values (1, 0, '2000-01-01T00:00:00Z');
    `)
    await q(`update gate_touch set v = 1 where id = 1`)
    const bumped = await q(
      `select updated_at > timestamptz '2000-01-02' as ok from gate_touch where id = 1`,
    )
    check('hygieia.touch_updated_at() sets updated_at on UPDATE', bumped.rows[0]?.ok === true)
    await db.exec(`drop table gate_touch`)
  } catch (e) {
    check('hygieia.touch_updated_at() sets updated_at on UPDATE', false, errMsg(e))
  }

  // EVERY function in schema hygieia: EXECUTE for neither anon nor PUBLIC. The bootstrap's
  // per-schema `alter default privileges … revoke execute … from public` does NOT achieve this on
  // its own (per-schema defaults are ADDED to the hardwired global default, which grants PUBLIC —
  // proven here in PGlite, 2026-10-05), and a global revoke would be project-wide (ADR-0003). So
  // each migration revokes explicitly and this sweep is the control. proacl NULL means the
  // DEFAULT acl, which grants PUBLIC; aclexplode over acldefault sees it. P1.8 extends the sweep.
  const fns = (
    await q(
      `select p.oid::regprocedure::text as sig,
              has_function_privilege('anon', p.oid, 'EXECUTE') as anon_exec,
              exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
                       where a.grantee = 0 and a.privilege_type = 'EXECUTE') as public_exec,
              coalesce(p.proconfig, '{}') as config
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'hygieia' order by 1`,
    )
  ).rows
  const list = (/** @type {string[]} */ xs) => (xs.length ? xs.join(', ') : '')
  const anonExecFns = fns.filter((f) => f.anon_exec).map((f) => String(f.sig))
  check(
    `anon has EXECUTE on no hygieia function (${fns.length})`,
    anonExecFns.length === 0,
    list(anonExecFns),
  )
  const publicExecFns = fns.filter((f) => f.public_exec).map((f) => String(f.sig))
  check(
    `PUBLIC has EXECUTE on no hygieia function (${fns.length})`,
    publicExecFns.length === 0,
    list(publicExecFns),
  )
  const unpinned = fns
    .filter(
      (f) => !/** @type {unknown[]} */ (f.config).some((c) => String(c).startsWith('search_path=')),
    )
    .map((f) => String(f.sig))
  check(
    `search_path is pinned on every hygieia function (${fns.length})`,
    unpinned.length === 0,
    list(unpinned),
  )

  // --- Alyssos's side: untouched ------------------------------------------------------------------
  const foreignAfter = await foreignSnapshot(db)
  check(
    `supabase_migrations.schema_migrations still holds ${ALYSSOS_MIGRATION_ROWS} rows`,
    foreignAfter.alyssos_ledger_rows === ALYSSOS_MIGRATION_ROWS,
    `${foreignAfter.alyssos_ledger_rows} rows`,
  )
  const changed = /** @type {(keyof typeof foreignAfter)[]} */ (Object.keys(foreignAfter)).filter(
    (k) => foreignAfter[k] !== foreignBefore[k],
  )
  check(
    'zero objects in public/auth/supabase_migrations changed (relations, policies, functions, triggers, spatial_ref_sys RLS)',
    changed.length === 0,
    changed.length ? `changed: ${changed.join(', ')}` : '',
  )
  const authTriggers = (
    await q(
      `select tgname from pg_trigger where tgrelid = 'auth.users'::regclass and not tgisinternal`,
    )
  ).rows.map((r) => String(r.tgname))
  check('no trigger on auth.users', authTriggers.length === 0, authTriggers.join(', '))

  console.log('')
  if (failures > 0) {
    console.log(`GATE FAILED — ${failures} check(s) red.`)
    return 1
  }
  console.log(
    'GATE PASSED — migrations apply (twice) on a fresh copy of the shared project; the bootstrap contract holds and Alyssos is untouched.',
  )
  return 0
}
