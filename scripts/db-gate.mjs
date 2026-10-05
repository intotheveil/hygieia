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
// Sections:
//   P1.1  the static guard (./check-migrations.mjs) before anything is applied
//   P1.2  apply + re-apply (idempotency), the bootstrap's own contract
//   P1.8  the structural sweep over every hygieia object; catalogue coverage (every table has an
//         entry, every entry a table); the committed fixture; the orphan scan over every FK; the
//         per-kind isolation + role matrix from ./db-gate/catalogue.mjs; the "Alyssos's side is
//         untouched" invariance last (the fixture must not have moved it either).

import { PGlite } from '@electric-sql/pglite'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { installShim, foreignSnapshot, ALYSSOS_MIGRATION_ROWS } from './db-gate/shim.mjs'
import { runGuard } from './check-migrations.mjs'
import {
  CATALOGUE,
  ENUM_COLUMNS,
  KIND_OF_TS,
  checkValues,
  checksFor,
  createHarness,
  seedFixture,
  tablePrivs,
} from './db-gate/catalogue.mjs'

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
 * Apply the archive twice, then every contract, sweep, fixture and matrix check.
 * @param {PGlite} db a fresh in-memory database, closed by the caller
 * @returns {Promise<number>} 0 = GATE PASSED, 1 = red
 */
async function runGate(db) {
  /** @param {string} sql @param {unknown[]} [params] */
  const q = (sql, params) => db.query(sql, params)
  let failures = 0
  let passes = 0
  /** @param {string} name @param {boolean} ok @param {string} [detail] */
  const check = (name, ok, detail = '') => {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`)
    if (ok) passes++
    else failures++
  }
  const errMsg = (/** @type {unknown} */ e) => (e instanceof Error ? e.message : String(e))
  /** Run a check whose body may throw (a missing table, a bad column): a throw is a FAIL, not a crash. */
  const guarded = async (
    /** @type {string} */ name,
    /** @type {() => Promise<[boolean, string?]>} */ fn,
  ) => {
    try {
      const [ok, detail] = await fn()
      check(name, ok, detail ?? '')
    } catch (e) {
      check(name, false, `threw: ${errMsg(e)}`)
    }
  }
  const list = (/** @type {string[]} */ xs) => (xs.length ? xs.join(', ') : '')

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

  // --- bootstrap contract (P1.2) -----------------------------------------------------------------
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

  // =================================================================================================
  // P1.8 — STRUCTURAL SWEEP over every object in schema `hygieia`
  // =================================================================================================
  console.log('\n--- structural sweep ---')

  const tableRows = (
    await q(
      `select c.relname,
              exists (select 1 from pg_attribute a where a.attrelid = c.oid and a.attname = 'status' and not a.attisdropped) as has_status,
              exists (select 1 from pg_attribute a where a.attrelid = c.oid and a.attname = 'updated_at' and not a.attisdropped) as has_updated_at,
              exists (select 1 from pg_attribute a where a.attrelid = c.oid and a.attname = 'created_at' and not a.attisdropped) as has_created_at,
              (select pg_get_expr(d.adbin, d.adrelid) from pg_attrdef d join pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum
                where d.adrelid = c.oid and a.attname = 'user_id') as user_id_default
         from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'hygieia' and c.relkind in ('r', 'p') order by 1`,
    )
  ).rows
  const tables = tableRows.map((r) => String(r.relname))

  // RLS on every table.
  const noRls = (
    await q(
      `select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'hygieia' and c.relkind in ('r', 'p') and not c.relrowsecurity order by 1`,
    )
  ).rows.map((r) => String(r.relname))
  check(`RLS is enabled on every hygieia table (${tables.length})`, noRls.length === 0, list(noRls))

  // A view runs with its OWNER's rights unless security_invoker: it would read around RLS.
  const badViews = (
    await q(
      `select c.relname || case c.relkind when 'm' then ' (materialized)' else '' end as v
         from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'hygieia' and c.relkind in ('v', 'm')
          and (c.relkind = 'm' or not coalesce('security_invoker=true' = any (c.reloptions), false)
                                and not coalesce('security_invoker=on' = any (c.reloptions), false))
        order by 1`,
    )
  ).rows.map((r) => String(r.v))
  check(
    'no hygieia view bypasses RLS (views are security_invoker, no materialized views)',
    badViews.length === 0,
    list(badViews),
  )

  // Every table has a policy set, except the service-only tables, which must hold ZERO API grants.
  const SERVICE_ONLY = CATALOGUE.filter((e) => e.kind === 'service-only').map((e) => e.table)
  const noPolicy = (
    await q(
      `select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'hygieia' and c.relkind in ('r', 'p')
          and not exists (select 1 from pg_policy p where p.polrelid = c.oid)
        order by 1`,
    )
  ).rows.map((r) => String(r.relname))
  const noPolicyUnexpected = noPolicy.filter((t) => !SERVICE_ONLY.includes(t))
  check(
    `every hygieia table has at least one policy (service-only exceptions: ${SERVICE_ONLY.join(', ')})`,
    noPolicyUnexpected.length === 0,
    list(noPolicyUnexpected),
  )
  const policyOnServiceOnly = SERVICE_ONLY.filter((t) => !noPolicy.includes(t))
  check(
    'no service-only table has a policy (nothing for any API role)',
    policyOnServiceOnly.length === 0,
    list(policyOnServiceOnly),
  )

  // Timestamps and triggers: every table has created_at + updated_at and a touch trigger; every
  // status-bearing table has the review-stamp trigger and the pending default.
  const triggers = (
    await q(
      `select c.relname as tbl, t.tgname, p.proname as fn, t.tgtype::int as tgtype
         from pg_trigger t join pg_class c on c.oid = t.tgrelid
         join pg_namespace n on n.oid = c.relnamespace join pg_proc p on p.oid = t.tgfoid
        where n.nspname = 'hygieia' and not t.tgisinternal order by 1, 2`,
    )
  ).rows
  // tgtype bits: 1 = ROW, 2 = BEFORE, 16 = UPDATE.
  const hasBeforeUpdateRow = (/** @type {string} */ tbl, /** @type {string} */ fnName) =>
    triggers.some(
      (t) => t.tbl === tbl && t.fn === fnName && (Number(t.tgtype) & (1 | 2 | 16)) === (1 | 2 | 16),
    )
  const noTimestamps = tableRows
    .filter((r) => !SERVICE_ONLY.includes(String(r.relname)))
    .filter((r) => !(r.has_created_at && r.has_updated_at))
    .map((r) => String(r.relname))
  check(
    `every hygieia table has created_at and updated_at (${tables.length - SERVICE_ONLY.length}; the ledger has applied_at)`,
    noTimestamps.length === 0,
    list(noTimestamps),
  )
  const noTouch = tableRows
    .filter((r) => r.has_updated_at && !hasBeforeUpdateRow(String(r.relname), 'touch_updated_at'))
    .map((r) => String(r.relname))
  check(
    'every table with updated_at has a BEFORE UPDATE touch_updated_at trigger',
    noTouch.length === 0,
    list(noTouch),
  )
  const statusTables = tableRows.filter((r) => r.has_status).map((r) => String(r.relname))
  const noStamp = statusTables.filter((t) => !hasBeforeUpdateRow(t, 'stamp_review'))
  check(
    `every status-bearing table has a BEFORE UPDATE stamp_review trigger (${statusTables.length})`,
    noStamp.length === 0,
    list(noStamp),
  )
  await guarded(
    `every status-bearing table defaults status to 'pending' and has reviewed_at + reviewed_by`,
    async () => {
      const bad = []
      for (const t of statusTables) {
        const r = (
          await q(
            `select (select pg_get_expr(d.adbin, d.adrelid) from pg_attrdef d join pg_attribute a
                        on a.attrelid = d.adrelid and a.attnum = d.adnum
                      where d.adrelid = $1::regclass and a.attname = 'status') as def,
                    exists (select 1 from pg_attribute a where a.attrelid = $1::regclass and a.attname = 'reviewed_at') as ra,
                    exists (select 1 from pg_attribute a where a.attrelid = $1::regclass and a.attname = 'reviewed_by') as rb`,
            [`hygieia.${t}`],
          )
        ).rows[0]
        if (!/^'pending'::text$/.test(String(r.def)) || !r.ra || !r.rb) bad.push(`${t} (${r.def})`)
      }
      return [bad.length === 0, list(bad)]
    },
  )

  // Functions: search_path pinned everywhere; definers never on a path an attacker can write;
  // EXECUTE for neither anon nor PUBLIC. The bootstrap's per-schema `alter default privileges …
  // revoke execute … from public` does NOT achieve this on its own (per-schema defaults are ADDED
  // to the hardwired global default, which grants PUBLIC — proven here in PGlite, 2026-10-05), and
  // a global revoke would be project-wide (ADR-0003). So each migration revokes explicitly and
  // this sweep is the control. proacl NULL means the DEFAULT acl, which grants PUBLIC.
  const fns = (
    await q(
      `select p.oid, p.oid::regprocedure::text as sig, p.prosecdef as definer,
              coalesce(p.proconfig, '{}') as config,
              has_function_privilege('anon', p.oid, 'EXECUTE') as anon_exec,
              exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
                       where a.grantee = 0 and a.privilege_type = 'EXECUTE') as public_exec
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'hygieia' order by 2`,
    )
  ).rows
  const pathOf = (/** @type {{ config: unknown }} */ f) =>
    /** @type {string[]} */ (f.config).find((c) => String(c).startsWith('search_path='))
  const unpinned = fns.filter((f) => !pathOf(f)).map((f) => String(f.sig))
  check(
    `search_path is pinned on every hygieia function (${fns.length})`,
    unpinned.length === 0,
    list(unpinned),
  )
  const loosePath = fns
    .filter((f) => f.definer && pathOf(f) && /public|\$user|pg_temp/.test(String(pathOf(f))))
    .map((f) => `${f.sig} ${pathOf(f)}`)
  check(
    'no SECURITY DEFINER function has public/$user/pg_temp on its search_path',
    loosePath.length === 0,
    list(loosePath),
  )
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

  // Policies: never TO PUBLIC; anon only ever reads; no write policy admits anon or PUBLIC.
  const policies = (
    await q(
      `select c.relname || '.' || p.polname as name, c.relname as tbl, p.polcmd::text as cmd,
              p.polroles::regrole[]::text as roles,
              (0::oid = any (p.polroles)) as admits_public,
              ('anon'::regrole::oid = any (p.polroles)) as admits_anon
         from pg_policy p join pg_class c on c.oid = p.polrelid
         join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'hygieia' order by 1`,
    )
  ).rows
  const toPublic = policies.filter((p) => p.admits_public).map((p) => String(p.name))
  check(
    `no hygieia policy is TO PUBLIC (every policy names anon or authenticated) (${policies.length})`,
    toPublic.length === 0,
    list(toPublic),
  )
  const writeAnon = policies
    .filter((p) => p.cmd !== 'r' && (p.admits_anon || p.admits_public))
    .map((p) => `${p.name} (${p.cmd} ${p.roles})`)
  check('no write policy admits anon or PUBLIC', writeAnon.length === 0, list(writeAnon))
  const anonNotSelectOnly = policies
    .filter((p) => p.admits_anon && p.roles !== '{anon}')
    .map((p) => `${p.name} (${p.roles})`)
  check(
    'every anon policy is TO anon alone (per-role policies, PLAN §1.4)',
    anonNotSelectOnly.length === 0,
    list(anonNotSelectOnly),
  )

  // Privilege shape per kind, derived from the catalogue: anon holds exactly SELECT on content and
  // child tables and nothing anywhere else; authenticated never INSERTs/DELETEs content; no client
  // role holds TRUNCATE/REFERENCES/TRIGGER anywhere.
  await guarded(
    'anon holds exactly SELECT on content and child tables and nothing else',
    async () => {
      const bad = []
      for (const e of CATALOGUE) {
        const got = await tablePrivs(db, 'anon', e.table)
        const want = e.kind === 'content' || e.kind === 'child' ? ['SELECT'] : []
        if (JSON.stringify(got) !== JSON.stringify(want))
          bad.push(`${e.table}: ${list(got) || 'nothing'}`)
      }
      return [bad.length === 0, list(bad)]
    },
  )
  await guarded(
    'authenticated holds no INSERT, DELETE or TRUNCATE on any content table',
    async () => {
      const bad = []
      for (const e of CATALOGUE.filter((x) => x.kind === 'content')) {
        const got = (await tablePrivs(db, 'authenticated', e.table)).filter((p) =>
          ['INSERT', 'DELETE', 'TRUNCATE'].includes(p),
        )
        if (got.length) bad.push(`${e.table}: ${list(got)}`)
      }
      return [bad.length === 0, list(bad)]
    },
  )
  await guarded(
    'no client role holds TRUNCATE, REFERENCES or TRIGGER on any hygieia table',
    async () => {
      const bad = []
      for (const t of tables)
        for (const role of ['anon', 'authenticated']) {
          const got = (await tablePrivs(db, role, t)).filter((p) =>
            ['TRUNCATE', 'REFERENCES', 'TRIGGER'].includes(p),
          )
          if (got.length) bad.push(`${role}:${t}: ${list(got)}`)
        }
      return [bad.length === 0, list(bad)]
    },
  )
  await guarded(
    'service_role holds full DML on every hygieia table except the ledger',
    async () => {
      const bad = []
      for (const t of tables.filter((x) => !SERVICE_ONLY.includes(x))) {
        const got = await tablePrivs(db, 'service_role', t)
        for (const p of ['SELECT', 'INSERT', 'UPDATE', 'DELETE'])
          if (!got.includes(p)) bad.push(`${t}: no ${p}`)
      }
      return [bad.length === 0, list(bad)]
    },
  )

  // Foreign keys: all validated (NOT VALID would skip the existing rows) and every FK column indexed.
  const fkRows = (
    await q(
      `select c.conname, c.conrelid::regclass::text as child, c.confrelid::regclass::text as parent,
              c.convalidated as validated, c.conrelid as relid, c.conkey as conkey,
              array(select a.attname from unnest(c.conkey) with ordinality k(n, i)
                      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.n order by k.i)::text[] as ccols,
              array(select a.attname from unnest(c.confkey) with ordinality k(n, i)
                      join pg_attribute a on a.attrelid = c.confrelid and a.attnum = k.n order by k.i)::text[] as pcols,
              exists (select 1 from pg_index i where i.indrelid = c.conrelid
                        and (i.indkey::int2[])[0:cardinality(c.conkey)-1] = c.conkey) as indexed
         from pg_constraint c join pg_class t on t.oid = c.conrelid
         join pg_namespace n on n.oid = t.relnamespace
        where n.nspname = 'hygieia' and c.contype = 'f' order by 1`,
    )
  ).rows
  const unvalidated = fkRows.filter((f) => !f.validated).map((f) => `${f.child}.${f.conname}`)
  check(
    `every hygieia foreign key is validated (convalidated) (${fkRows.length})`,
    unvalidated.length === 0,
    list(unvalidated),
  )
  const unindexed = fkRows.filter((f) => !f.indexed).map((f) => `${f.child}.${f.conname}`)
  check(
    `every hygieia foreign key column is indexed (${fkRows.length})`,
    unindexed.length === 0,
    list(unindexed),
  )

  // The DB CHECK literals equal src/content/enums.ts (order and length); the contract test repeats it.
  for (const ec of ENUM_COLUMNS) {
    await guarded(`${ec.table}.${ec.column} CHECK admits exactly enums.ts ${ec.name}`, async () => {
      const got = await checkValues(db, ec.table, ec.column)
      return [
        JSON.stringify(got) === JSON.stringify([...ec.values]),
        `db ${got ? got.join('|') : 'no single CHECK'} vs ts ${ec.values.join('|')}`,
      ]
    })
  }

  // =================================================================================================
  // P1.8 — COVERAGE: every hygieia table has a catalogue entry, every entry a table, kinds agree
  // =================================================================================================
  console.log('\n--- catalogue coverage ---')
  const inCatalogue = CATALOGUE.map((e) => e.table)
  const uncovered = tables.filter((t) => !inCatalogue.includes(t))
  check(
    `every hygieia table has a catalogue entry (${tables.length})`,
    uncovered.length === 0,
    uncovered.length
      ? `NO ENTRY: ${uncovered.join(', ')} — add it to scripts/db-gate/catalogue.mjs`
      : '',
  )
  const stale = inCatalogue.filter((t) => !tables.includes(t))
  check('every catalogue entry names an existing hygieia table', stale.length === 0, list(stale))
  const dupes = inCatalogue.filter((t, i) => inCatalogue.indexOf(t) !== i)
  check('the catalogue names each table once', dupes.length === 0, list(dupes))
  const kindMismatch = []
  for (const e of CATALOGUE) {
    const r = tableRows.find((x) => x.relname === e.table)
    if (!r) continue
    if (e.kind === 'content' && !r.has_status)
      kindMismatch.push(`${e.table}: content without status`)
    if (e.kind === 'child' && r.has_status) kindMismatch.push(`${e.table}: child with status`)
    if (
      e.kind === 'child' &&
      !fkRows.some((f) => f.child === `hygieia.${e.table}` && f.parent === `hygieia.${e.parent}`)
    )
      kindMismatch.push(`${e.table}: no FK to ${e.parent}`)
    if ((e.kind === 'user' || e.kind === 'profiles') && r.has_status)
      kindMismatch.push(`${e.table}: per-user with status`)
    if (e.kind === 'user' && r.user_id_default !== 'auth.uid()')
      kindMismatch.push(`${e.table}: user_id default ${r.user_id_default}`)
    if (e.kind === 'service-only' && !noPolicy.includes(e.table))
      kindMismatch.push(`${e.table}: service-only with a policy`)
  }
  check(
    'every catalogue kind matches the table shape (status / parent FK / user_id default)',
    kindMismatch.length === 0,
    list(kindMismatch),
  )
  const tsMismatch = []
  for (const [kind, ts] of Object.entries(KIND_OF_TS)) {
    const cat = CATALOGUE.filter((e) => e.kind === kind)
      .map((e) => e.table)
      .sort()
    if (JSON.stringify(cat) !== JSON.stringify([...ts].sort()))
      tsMismatch.push(`${kind}: catalogue ${cat.join('|')} vs enums.ts ${ts.join('|')}`)
  }
  check(
    'catalogue kinds agree with CONTENT_TABLES / CHILD_TABLES / USER_TABLES in src/content/enums.ts',
    tsMismatch.length === 0,
    list(tsMismatch),
  )

  // =================================================================================================
  // P1.8 — FIXTURE + ORPHAN SCAN
  // =================================================================================================
  console.log('\n--- fixture and orphan scan ---')
  try {
    await seedFixture(db)
    check(
      'fixture seeded (UA, UB, ADMIN, NEW; approved + pending content with children; rows of A and B)',
      true,
    )
  } catch (e) {
    check(
      'fixture seeded (UA, UB, ADMIN, NEW; approved + pending content with children; rows of A and B)',
      false,
      errMsg(e),
    )
    console.log(`\nGATE FAILED — ${failures} check(s) red; the catalogue checks need the fixture.`)
    return 1
  }

  await guarded(
    'orphan scan: zero dangling references over every hygieia foreign key',
    async () => {
      const orphans = []
      for (const fk of fkRows) {
        const cc = /** @type {string[]} */ (fk.ccols)
        const pc = /** @type {string[]} */ (fk.pcols)
        const r = await q(
          `select count(*)::int as n from ${fk.child} c
          where ${cc.map((x) => `c.${x} is not null`).join(' and ')}
            and not exists (select 1 from ${fk.parent} p where ${cc.map((x, i) => `p.${pc[i]} = c.${x}`).join(' and ')})`,
        )
        const n = Number(r.rows[0].n)
        if (n > 0) orphans.push(`${fk.conname}: ${n}`)
      }
      return [
        fkRows.length > 0 && orphans.length === 0,
        orphans.length ? list(orphans) : `${fkRows.length} FKs clean`,
      ]
    },
  )

  // =================================================================================================
  // P1.8 — THE CATALOGUE MATRIX: per table, the checks its kind demands
  // =================================================================================================
  const h = createHarness(db)
  for (const e of CATALOGUE) {
    console.log(`\n--- ${e.kind}: hygieia.${e.table} ---`)
    for (const c of checksFor(e, h)) await guarded(c.name, c.run)
  }

  // --- Alyssos's side: untouched (after the fixture too) ---------------------------------------------
  console.log('\n--- the shared project ---')
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
    console.log(`GATE FAILED — ${failures} check(s) red, ${passes} green.`)
    return 1
  }
  console.log(
    `GATE PASSED — ${passes} checks green: migrations apply (twice) on a fresh copy of the shared project; the structural sweep, catalogue coverage, orphan scan and isolation + role matrix hold; Alyssos is untouched.`,
  )
  return 0
}
