// PROVE THE GATE RED — `npm run db:gate:prove-red` (PLAN.md P1.14)
//
// A gate nobody has ever seen fail is not a gate. This script sabotages a COPY of the migration
// archive in many known-bad ways, one sabotage per run, runs `scripts/db-gate.mjs` against each copy
// (env DB_GATE_MIGRATIONS), and asserts that the gate
//   (1) exits 1, and
//   (2) prints the EXPECTED FAIL line(s) for that sabotage, so a failure for the wrong reason
//       (a crash, an unrelated check) does not count as proof.
// A CONTROL run on the untouched copy must exit 0 with `GATE PASSED` and zero FAIL lines, which
// proves the harness itself does not turn everything red.
//
// Two sabotage shapes:
//   sql     appended as ONE new migration file (sorted last, named by the guard's filename rule), so
//           it runs on the real archive state, twice (the gate re-applies the archive for idempotency);
//           sabotage SQL is therefore written idempotently wherever idempotency is not the point.
//   mutate  a copied migration file with ONE exact string replaced (a deletion, e.g. a `revoke` line
//           removed); the string must occur exactly once, or prove-red stops before running anything.
// The committed archive in `supabase/migrations/` is only READ. Copies live under os.tmpdir() and are
// removed on every exit path.
//
// Every expected line below is the gate's REAL output, read from a manual run of that sabotage
// (BUILD_LOG.md P1.14). The static guard (`npm run db:check`) runs INSIDE the gate before anything is
// applied, so a guard-level sabotage (`public.x`, a trigger on auth.users, search_path = public) is
// expected to go red on the guard's line, not on a database check.
//
// Exit 0 only if the control is green AND every sabotage went red on its expected line. The exit code
// is set via process.exitCode on every path; nothing calls process.exit() (CLAUDE.md / BRAIN §5).
//
// Usage: node scripts/db-gate-prove-red.mjs [--jobs N] [--only id,id,...] [--verbose]
//   --jobs     parallel gate runs (default: min(4, available cores); env PROVE_RED_JOBS)
//   --only     run just these sabotage ids (plus the control), for debugging one sabotage
//   --verbose  also print every red line the gate produced under each RED ok sabotage
//
// Harness lifted from Themis scripts/db-gate-prove-red.mjs; the sabotages are Hygieia's.

import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { availableParallelism, tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ARCHIVE = fileURLToPath(new URL('../supabase/migrations', import.meta.url))
const GATE = fileURLToPath(new URL('./db-gate.mjs', import.meta.url))
// Sorts after every real migration and matches the guard's filename rule.
const SABOTAGE_FILE = '29991231235959_hygieia_zz_sabotage.sql'
const PROFILES = '20261006000200_hygieia_profiles.sql'
const RUN_TIMEOUT_MS = 300_000
// The lines by which the gate (and the static guard it runs first) reports red.
const RED_LINE = /^(FAIL|GATE FAILED|APPLY FAILED|MIGRATION GUARD FAILED)/
const SAB = SABOTAGE_FILE.replace(/\./g, '\\.')

/**
 * One sabotage: what is done to the copy of the archive, and the FAIL line(s) it must produce.
 * Each `expect` item must match at least one of the gate's RED lines (`RED_LINE`: a `FAIL  …` check
 * line — two spaces — or the `GATE FAILED` / `APPLY FAILED` / `MIGRATION GUARD FAILED` verdict); a
 * string is a substring match, a RegExp is tested against the whole line.
 * @typedef {object} Sabotage
 * @property {string} id
 * @property {string} what
 * @property {string} [sql]  appended as SABOTAGE_FILE
 * @property {{ file: string, from: string, to: string }} [mutate]  exactly-once replacement in a copied file
 * @property {(string | RegExp)[]} expect
 */

/** @type {Sabotage[]} */
const SABOTAGES = [
  // --- leaks through policies -------------------------------------------------------------------
  {
    id: 'recipes-select-true-anon',
    what: 'recipes SELECT policy for anon rewritten as using (true): pending recipes leak',
    sql: `drop policy if exists recipes_select_anon on hygieia.recipes;
create policy recipes_select_anon on hygieia.recipes for select to anon using (true);`,
    expect: [
      /^FAIL {2}hygieia\.recipes: anon reads exactly N approved rows and 0 pending — N = 1 approved of 2; read 2, pending 1$/,
    ],
  },
  {
    id: 'fridge-lists-select-true',
    what: 'fridge_lists SELECT policy using (true): UB reads A',
    sql: `drop policy if exists fridge_lists_select_own on hygieia.fridge_lists;
create policy fridge_lists_select_own on hygieia.fridge_lists
  for select to authenticated using (true);`,
    expect: [/^FAIL {2}hygieia\.fridge_lists: UB reads ZERO rows of A — 1 rows$/],
  },
  {
    // Was a GATE GAP (2026-10-05): the filtered probe `where user_id = A` let the correct SELECT
    // policy mask the open UPDATE policy. The catalogue now probes blind as well.
    id: 'saved-plans-update-true',
    what: 'saved_plans UPDATE policy using (true) with check (true): UB can rewrite A',
    sql: `drop policy if exists saved_plans_update_own on hygieia.saved_plans;
create policy saved_plans_update_own on hygieia.saved_plans
  for update to authenticated using (true) with check (true);`,
    expect: [/^FAIL {2}hygieia\.saved_plans: UB's UPDATE of A's rows has no effect — /],
  },
  {
    // Same gap, DELETE side.
    id: 'favourites-delete-true',
    what: 'favourites DELETE policy using (true): UB can delete A',
    sql: `drop policy if exists favourites_delete_own on hygieia.favourites;
create policy favourites_delete_own on hygieia.favourites for delete to authenticated using (true);`,
    expect: [/^FAIL {2}hygieia\.favourites: UB's DELETE of A's rows has no effect — /],
  },
  {
    id: 'recipe-ingredients-select-true',
    what: 'recipe_ingredients SELECT policy for anon using (true): children of pending parents leak',
    sql: `drop policy if exists recipe_ingredients_select_anon on hygieia.recipe_ingredients;
create policy recipe_ingredients_select_anon on hygieia.recipe_ingredients
  for select to anon using (true);`,
    expect: [
      /^FAIL {2}hygieia\.recipe_ingredients: anon reads only children of approved parents — 4\/4 \(approved parents: 2\)$/,
    ],
  },
  {
    id: 'favourites-rls-disabled',
    what: 'alter table hygieia.favourites disable row level security',
    sql: `alter table hygieia.favourites disable row level security;`,
    expect: [
      /^FAIL {2}RLS is enabled on every hygieia table \(14\) — favourites$/,
      /^FAIL {2}hygieia\.favourites: UB reads ZERO rows of A — 1 rows$/,
    ],
  },

  // --- admin primitives -------------------------------------------------------------------------
  {
    id: 'is-admin-update-grant',
    what: 'grant update (is_admin) on hygieia.profiles to authenticated',
    sql: `grant update (is_admin) on table hygieia.profiles to authenticated;`,
    expect: [
      /^FAIL {2}hygieia\.profiles: UA's update of is_admin is refused \(no column grant\) — /,
      /^FAIL {2}hygieia\.profiles: authenticated holds no INSERT or UPDATE privilege on is_admin — .*UPDATE on: .*is_admin/,
    ],
  },
  {
    id: 'is-admin-returns-true',
    what: 'hygieia.is_admin() replaced by `select true` (structurally perfect, functionally open)',
    sql: `create or replace function hygieia.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $fn$ select true $fn$;`,
    expect: [
      /^FAIL {2}hygieia\.profiles: hygieia\.is_admin\(\) is true for ADMIN, false for UA, false without a profile \(NEW\) — \[true,true,true\]$/,
      /^FAIL {2}hygieia\.recipes: UA \(signed in, not admin\) reads exactly N approved rows and 0 pending — .*pending 1$/,
      /^FAIL {2}hygieia\.recipes: UA's status update has no effect — /,
    ],
  },
  {
    id: 'execute-is-admin-to-anon',
    what: 'grant execute on function hygieia.is_admin() to anon',
    sql: `grant execute on function hygieia.is_admin() to anon;`,
    expect: [
      /^FAIL {2}anon has EXECUTE on no hygieia function \(3\) — hygieia\.is_admin\(\)$/,
      /^FAIL {2}hygieia\.profiles: anon cannot execute hygieia\.is_admin\(\) — /,
    ],
  },
  {
    id: 'is-admin-revoke-deleted',
    what: 'the `revoke execute on function hygieia.is_admin() from public, anon` line deleted (mutation)',
    mutate: {
      file: PROFILES,
      from: 'revoke execute on function hygieia.is_admin() from public, anon;',
      to: '-- (prove-red: the revoke line was deleted here)',
    },
    expect: [
      /^FAIL {2}anon has EXECUTE on no hygieia function \(3\) — hygieia\.is_admin\(\)$/,
      /^FAIL {2}PUBLIC has EXECUTE on no hygieia function \(3\) — hygieia\.is_admin\(\)$/,
      /^FAIL {2}hygieia\.profiles: anon cannot execute hygieia\.is_admin\(\) — /,
    ],
  },
  {
    id: 'drop-stamp-review-trigger',
    what: 'drop trigger recipes_stamp_review: an admin review leaves reviewed_by unset',
    sql: `drop trigger if exists recipes_stamp_review on hygieia.recipes;`,
    expect: [
      /^FAIL {2}every status-bearing table has a BEFORE UPDATE stamp_review trigger \(6\) — recipes$/,
      /^FAIL {2}hygieia\.recipes: ADMIN's status update takes effect and is stamped \(reviewed_by = ADMIN, reviewed_at > fixture\) — .*"reviewed_by":null/,
    ],
  },

  // --- functions --------------------------------------------------------------------------------
  {
    id: 'definer-no-search-path',
    what: 'a SECURITY DEFINER function with no search_path and default EXECUTE',
    sql: `create or replace function hygieia.leak_fn() returns int
language sql security definer as $fn$ select 1 $fn$;`,
    expect: [
      /^FAIL {2}search_path is pinned on every hygieia function \(4\) — hygieia\.leak_fn\(\)$/,
      /^FAIL {2}anon has EXECUTE on no hygieia function \(4\) — hygieia\.leak_fn\(\)$/,
      /^FAIL {2}PUBLIC has EXECUTE on no hygieia function \(4\) — hygieia\.leak_fn\(\)$/,
    ],
  },
  {
    id: 'definer-search-path-public',
    what: 'a SECURITY DEFINER function in hygieia with search_path = public (the static guard catches it)',
    sql: `create or replace function hygieia.leak_fn() returns int
language sql security definer set search_path = public as $fn$ select 1 $fn$;
revoke execute on function hygieia.leak_fn() from public, anon;`,
    expect: [
      new RegExp(
        `^FAIL {2}${SAB}:2 {2}\\[forbidden-schema\\] {2}search_path includes public — pin it to '' and qualify names$`,
      ),
      /^GATE FAILED — the static migration guard is red/,
    ],
  },
  {
    id: 'definer-search-path-pg-temp',
    what: 'a SECURITY DEFINER function with search_path = pg_temp, hygieia (guard-clean, sweep-red)',
    sql: `create or replace function hygieia.leak_fn() returns int
language sql security definer set search_path = pg_temp, hygieia as $fn$ select 1 $fn$;
revoke execute on function hygieia.leak_fn() from public, anon;`,
    expect: [
      /^FAIL {2}no SECURITY DEFINER function has public\/\$user\/pg_temp on its search_path — hygieia\.leak_fn\(\) search_path=pg_temp, hygieia$/,
    ],
  },

  // --- grants -----------------------------------------------------------------------------------
  {
    id: 'anon-insert-recipes',
    what: 'grant insert on hygieia.recipes to anon',
    sql: `grant insert on table hygieia.recipes to anon;`,
    expect: [
      /^FAIL {2}anon holds exactly SELECT on content and child tables and nothing else — recipes: SELECT, INSERT$/,
      /^FAIL {2}hygieia\.recipes: anon and authenticated hold no INSERT or DELETE privilege — anon:INSERT$/,
    ],
  },
  {
    id: 'ledger-select-to-authenticated',
    what: 'grant select on the migration ledger hygieia.schema_migrations to authenticated',
    sql: `grant select on table hygieia.schema_migrations to authenticated;`,
    expect: [
      /^FAIL {2}authenticated holds no privilege on hygieia\.schema_migrations — SELECT$/,
      /^FAIL {2}hygieia\.schema_migrations: service-only — anon and authenticated hold no privilege and cannot SELECT — authenticated:SELECT$/,
    ],
  },

  // --- the static guard (nothing is applied) ----------------------------------------------------
  {
    id: 'public-table',
    what: 'create table public.x (the static guard catches it first; nothing is applied)',
    sql: `create table if not exists public.x (id int);`,
    expect: [
      new RegExp(`^FAIL {2}${SAB}:1 {2}\\[forbidden-schema\\] {2}reference to public\\.x — `),
      /^GATE FAILED — the static migration guard is red/,
    ],
  },
  {
    id: 'auth-users-trigger',
    what: 'create trigger … on auth.users (the static guard catches it first)',
    sql: `create trigger hygieia_leak_trg after insert on auth.users
  for each row execute function hygieia.touch_updated_at();`,
    expect: [
      new RegExp(`^FAIL {2}${SAB}:1 {2}\\[auth-users-trigger\\] {2}trigger on auth\\.users`),
      /^GATE FAILED — the static migration guard is red/,
    ],
  },

  // --- coverage, shape, contract ----------------------------------------------------------------
  {
    id: 'orphan-table-no-catalogue',
    what: 'a new table hygieia.orphan_table with no catalogue entry (and no RLS)',
    sql: `create table if not exists hygieia.orphan_table (id int);`,
    expect: [
      /^FAIL {2}every hygieia table has a catalogue entry \(15\) — NO ENTRY: orphan_table — add it to scripts\/db-gate\/catalogue\.mjs$/,
      /^FAIL {2}RLS is enabled on every hygieia table \(15\) — orphan_table$/,
    ],
  },
  {
    id: 'table-dropped-stale-entry',
    what: 'hygieia.favourites dropped after the archive (its catalogue entry goes stale)',
    sql: `drop table if exists hygieia.favourites cascade;`,
    expect: [
      /^FAIL {2}every catalogue entry names an existing hygieia table — favourites$/,
      /^FAIL {2}fixture seeded /,
    ],
  },
  {
    id: 'view-owner-rights',
    what: 'a hygieia view without security_invoker (reads around RLS)',
    sql: `create or replace view hygieia.v_recipes as select id, slug, status from hygieia.recipes;`,
    expect: [
      /^FAIL {2}no hygieia view bypasses RLS \(views are security_invoker, no materialized views\) — v_recipes$/,
    ],
  },
  {
    id: 'enum-mismatch',
    what: "exercises.level CHECK admits 'elite', which enums.ts LEVELS does not know",
    sql: `alter table hygieia.exercises drop constraint if exists exercises_level_check;
alter table hygieia.exercises add constraint exercises_level_check
  check (level in ('beginner', 'intermediate', 'advanced', 'elite'));`,
    expect: [
      /^FAIL {2}exercises\.level CHECK admits exactly enums\.ts LEVELS — db beginner\|intermediate\|advanced\|elite vs ts beginner\|intermediate\|advanced$/,
    ],
  },
  {
    id: 'seed-random-id',
    what: 'a fixture-shaped content row inserted with a RANDOM id (the md5 seed-id rule)',
    sql: `insert into hygieia.health_tips (id, slug, topic, title_el, title_en, body_el, body_en, source_url, needs_source)
values (gen_random_uuid(), 'zz-random-id', 'sleep', 'zz el', 'zz en', 'zz body el', 'zz body en', null, true)
on conflict (slug) do nothing;`,
    expect: [
      /^FAIL {2}hygieia\.health_tips: every row id = md5\('hygieia:health_tips:' \|\| slug\)::uuid \(seed-id rule\) — 3 rows checked, 1 off-formula$/,
    ],
  },

  // --- the apply contract: fresh-DB apply and idempotency ---------------------------------------
  {
    id: 'not-idempotent',
    what: 'create table hygieia.twice (id int) without IF NOT EXISTS (fails on the second apply)',
    sql: `create table hygieia.twice (id int);`,
    expect: [
      new RegExp(
        `^FAIL {2}re-apply ${SAB} \\(idempotent-safe\\) — relation "twice" already exists$`,
      ),
    ],
  },
  {
    id: 'apply-error',
    what: 'alter table hygieia.no_such add column x int (errors on a fresh DB)',
    sql: `alter table hygieia.no_such add column x int;`,
    expect: [
      new RegExp(`^FAIL {2}apply ${SAB} — relation "hygieia\\.no_such" does not exist$`),
      /^APPLY FAILED — stopping\.$/,
    ],
  },
]

// --- CLI ----------------------------------------------------------------------------------------
const argv = process.argv.slice(2)
const flag = (/** @type {string} */ name) => {
  const i = argv.indexOf(name)
  return i >= 0 ? argv[i + 1] : undefined
}
const JOBS = Math.max(
  1,
  Number(flag('--jobs') ?? process.env.PROVE_RED_JOBS ?? Math.min(4, availableParallelism())) || 1,
)
const VERBOSE = argv.includes('--verbose')

/** @type {string | null} the temp root holding every archive copy; removed on every exit path */
let root = null
const cleanup = () => {
  if (root) rmSync(root, { recursive: true, force: true })
  root = null
}

/** Gate child processes in flight (killed on SIGINT/SIGTERM). @type {Set<import('node:child_process').ChildProcess>} */
const children = new Set()
let aborted = false
for (const sig of /** @type {const} */ (['SIGINT', 'SIGTERM'])) {
  process.on(sig, () => {
    aborted = true
    for (const c of children) c.kill()
  })
}

// --- the archive and its copies ------------------------------------------------------------------
const archiveFiles = readdirSync(ARCHIVE)
  .filter((f) => f.endsWith('.sql'))
  .sort()
/** @type {Map<string, string>} committed file → text (read once) */
const archiveText = new Map(
  archiveFiles.map((f) => [f, readFileSync(path.join(ARCHIVE, f), 'utf8')]),
)

/**
 * Validate a mutation against the committed archive: the file exists and `from` occurs exactly once,
 * so an edited migration cannot turn a deletion-sabotage into a silent no-op.
 * @param {Sabotage} s @returns {string | null} an error, or null when fine
 */
const mutationError = (s) => {
  if (!s.mutate) return null
  const text = archiveText.get(s.mutate.file)
  if (text === undefined) return `${s.id}: mutate.file ${s.mutate.file} is not in the archive`
  const hits = text.split(s.mutate.from).length - 1
  if (hits !== 1)
    return `${s.id}: ${JSON.stringify(s.mutate.from)} occurs ${hits}× in ${s.mutate.file} (need 1)`
  return null
}

/**
 * Copy the archive into a fresh dir under `root`, applying the sabotage (appended file and/or the
 * exactly-once mutation of a copied file).
 * @param {string} name @param {Sabotage | undefined} s
 */
const prepare = (name, s) => {
  const dir = path.join(/** @type {string} */ (root), name)
  mkdirSync(dir)
  for (const f of archiveFiles) {
    let text = /** @type {string} */ (archiveText.get(f))
    const m = s?.mutate
    if (m && m.file === f) text = text.replace(m.from, () => m.to)
    writeFileSync(path.join(dir, f), text)
  }
  if (s?.sql !== undefined) writeFileSync(path.join(dir, SABOTAGE_FILE), s.sql + '\n')
  return dir
}

/**
 * Run the gate against `dir`; resolve with its exit code and combined stdout+stderr.
 * @param {string} dir
 * @returns {Promise<{ code: number | null, out: string, ms: number }>}
 */
const runGate = (dir) =>
  new Promise((resolve) => {
    const t0 = performance.now()
    const child = spawn(process.execPath, [GATE], {
      env: { ...process.env, DB_GATE_MIGRATIONS: dir },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    children.add(child)
    let out = ''
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (out += d))
    const timer = setTimeout(() => {
      out += `\n[prove-red] timed out after ${RUN_TIMEOUT_MS / 1000}s`
      child.kill()
    }, RUN_TIMEOUT_MS)
    child.on('close', (code) => {
      clearTimeout(timer)
      children.delete(child)
      resolve({ code, out, ms: performance.now() - t0 })
    })
  })

/** @typedef {{ id: string, ok: boolean, line: string, detail: string[] }} Verdict */

const secs = (/** @type {number} */ ms) => `${(ms / 1000).toFixed(1)}s`
const tail = (/** @type {string} */ out, /** @type {number} */ n) =>
  out
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(-n)
    .map((l) => `tail: ${l}`)

/** @param {Sabotage} s @returns {Promise<Verdict>} */
const prove = async (s) => {
  const r = await runGate(prepare(s.id, s))
  const redLines = r.out.split(/\r?\n/).filter((l) => RED_LINE.test(l))
  const failCount = redLines.filter((l) => l.startsWith('FAIL')).length
  const missing = s.expect.filter((e) =>
    typeof e === 'string' ? !redLines.some((l) => l.includes(e)) : !redLines.some((l) => e.test(l)),
  )
  const passed = r.code === 0 || /GATE PASSED/.test(r.out)
  const ok = r.code === 1 && !passed && missing.length === 0
  if (ok)
    return {
      id: s.id,
      ok,
      line: `RED ok      ${s.id} — exit 1, ${failCount} FAIL line(s), ${s.expect.length}/${s.expect.length} expected matched (${secs(r.ms)})`,
      detail: VERBOSE ? redLines.map((l) => `saw: ${l}`) : [],
    }
  const detail = [`sabotage: ${s.what}`]
  let verdict
  if (passed) {
    verdict = `NOT RED     ${s.id} — the gate PASSED (exit ${r.code}): the sabotage was not caught`
  } else if (r.code !== 1) {
    verdict = `CRASH       ${s.id} — exit ${r.code} (expected 1)`
    detail.push(...tail(r.out, 5))
  } else {
    verdict = `WRONG LINE  ${s.id} — exit 1 but the expected FAIL line is missing`
  }
  detail.push(...missing.map((m) => `missing expected red line: ${String(m)}`))
  detail.push(...(redLines.length ? redLines.map((l) => `saw: ${l}`) : ['saw no red line']))
  return { id: s.id, ok, line: `${verdict} (${secs(r.ms)})`, detail }
}

/** @returns {Promise<Verdict>} */
const control = async () => {
  const r = await runGate(prepare('control', undefined))
  const failLines = r.out.split(/\r?\n/).filter((l) => /^FAIL/.test(l))
  const ok = r.code === 0 && /GATE PASSED/.test(r.out) && failLines.length === 0
  const passCount = (r.out.match(/^PASS/gm) ?? []).length
  return {
    id: 'control',
    ok,
    line: ok
      ? `GREEN       control — the untouched archive copy: exit 0, GATE PASSED, ${passCount} PASS (${secs(r.ms)})`
      : `NOT GREEN   control — the untouched archive copy did not pass: exit ${r.code} (${secs(r.ms)})`,
    detail: ok ? [] : [...failLines.map((l) => `saw: ${l}`), ...tail(r.out, 5)],
  }
}

/** Run `tasks` with at most `n` in flight, keeping input order; starts nothing new once aborted. */
const pool = async (/** @type {(() => Promise<Verdict>)[]} */ tasks, /** @type {number} */ n) => {
  /** @type {Verdict[]} */
  const results = new Array(tasks.length)
  let next = 0
  const worker = async () => {
    while (!aborted && next < tasks.length) {
      const i = next++
      results[i] = await tasks[i]()
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, tasks.length) }, worker))
  return results.filter(Boolean)
}

// --- run ----------------------------------------------------------------------------------------
/** @returns {Promise<number>} the exit code */
async function main() {
  const only = flag('--only')?.split(',').filter(Boolean)
  const selected = only ? SABOTAGES.filter((s) => only.includes(s.id)) : SABOTAGES
  if (only && selected.length !== only.length) {
    const known = new Set(SABOTAGES.map((s) => s.id))
    console.log(`unknown sabotage id(s): ${only.filter((x) => !known.has(x)).join(', ')}`)
    return 2
  }
  const ids = SABOTAGES.map((s) => s.id)
  const dupIds = ids.filter((x, i) => ids.indexOf(x) !== i)
  if (dupIds.length) {
    console.log(`duplicate sabotage id(s): ${dupIds.join(', ')}`)
    return 2
  }
  const shapeless = SABOTAGES.filter((s) => s.sql === undefined && !s.mutate).map((s) => s.id)
  if (shapeless.length) {
    console.log(`sabotage(s) with neither sql nor mutate: ${shapeless.join(', ')}`)
    return 2
  }
  const mutationErrors = SABOTAGES.map(mutationError).filter((e) => e !== null)
  if (mutationErrors.length) {
    for (const e of mutationErrors) console.log(`prove-red: cannot build the sabotages — ${e}`)
    return 2
  }
  if (archiveFiles.length === 0) {
    console.log(`no migrations in ${ARCHIVE} — nothing to sabotage`)
    return 1
  }

  root = mkdtempSync(path.join(tmpdir(), 'hygieia-prove-red-'))
  const t0 = performance.now()
  console.log(
    `prove-red: ${selected.length} sabotage(s) + 1 control against a copy of ${archiveFiles.length} migration(s), ${JOBS} parallel job(s)\n`,
  )

  const results = await pool([control, ...selected.map((s) => () => prove(s))], JOBS)
  for (const v of results) {
    console.log(v.line)
    for (const d of v.detail) console.log(`            ${d}`)
  }

  const wall = secs(performance.now() - t0)
  console.log('')
  if (aborted) {
    console.log(`PROVE-RED ABORTED — interrupted after ${results.length} run(s). Wall ${wall}.`)
    return 130
  }
  const controlOk = results.find((v) => v.id === 'control')?.ok === true
  const sabotageResults = results.filter((v) => v.id !== 'control')
  const red = sabotageResults.filter((v) => v.ok).length
  if (controlOk && red === selected.length) {
    console.log(
      `PROVE-RED PASSED — ${red}/${selected.length} sabotages went RED on the expected FAIL line; control GREEN. Wall ${wall} (${JOBS} jobs).`,
    )
    return 0
  }
  const offenders = sabotageResults.filter((v) => !v.ok).map((v) => v.id)
  console.log(
    `PROVE-RED FAILED — ${red}/${selected.length} sabotages RED on the expected line; control ${controlOk ? 'GREEN' : 'NOT GREEN'}` +
      (offenders.length ? `; offenders: ${offenders.join(', ')}` : '') +
      `. Wall ${wall} (${JOBS} jobs).`,
  )
  return 1
}

try {
  process.exitCode = await main()
} catch (e) {
  console.log(`prove-red: crashed — ${e instanceof Error ? (e.stack ?? e.message) : String(e)}`)
  process.exitCode = 2
} finally {
  cleanup()
}
