// THE CATALOGUE, its fixture and its checks — shared by `npm run db:gate` (scripts/db-gate.mjs)
// and the Vitest twin (scripts/db-isolation.test.ts). One fixture, one harness, one list of checks:
// the gate and the tests cannot drift apart on what "UA's rows" or "an approved row" means.
//
// CATALOGUE has ONE entry per table in schema `hygieia`, with a `kind`:
//   content       status-bearing content (PLAN §1.3): anon/authenticated read `approved`, an admin
//                 reads everything and may UPDATE; no client INSERT/DELETE; seeded ids are
//                 md5('hygieia:<table>:' || slug)::uuid (§1.6).
//   child         no status of its own; visible iff the parent is approved (or admin); admins edit.
//   user          per-user data (§1.7): `user_id = auth.uid()` on every verb; user_id never named.
//   profiles      the identity row (§1.8): self-only; `is_admin` has no client grant.
//   service-only  nothing for any API role (the migration ledger).
// The gate derives the table list from pg_class and FAILS on a table without an entry (and on an
// entry without a table), so a new table cannot be silently skipped. Adding a table = adding its
// entry here, its fixture rows to seedFixture, and its reference seed count to SEED_COUNTS /
// SEED_CHILD_COUNTS (P1.12: asserted over the generator's rows, `fx-` fixture rows excluded).
//
// Fixture (committed as the superuser; every check runs in a transaction that is ROLLED BACK):
//   users UA, UB (profiles, is_admin = false), ADMIN (is_admin = true), NEW (signed up, no profile).
//   Per content table >= 1 approved and >= 1 pending row (slugs prefixed `fx-`, ids by the seed-id
//   formula), children under both an approved and a pending parent, per user table rows of A and B.
//   Seeds (P1.12) land `pending`; the fixture rows are the gate's own and never ship.
//   EXCEPTION — workout_templates: `unique (workout_type, level, intensity)` and the P4.8 seed fills
//   all 63 cells, so there is NO free cell for an `fx-` row (a fixture must not fight a unique
//   constraint that real data saturates). The fixture instead ADOPTS two seeded rows — the two
//   lowest slugs of src/content/seed/workouts.ts — and flips the first to `approved` with the fixture
//   review stamp (triggers bypassed via session_replication_role, so reviewed_by/updated_at are the
//   fixture's, not now()/null); the second stays `pending` and is the row ADMIN's review flips. Both
//   keep their seeded slugs, so they still count as seeded rows (= 63) in the P1.12 count check.
//
// Harness: `createHarness(db).actAs(who, s => …)` runs `fn` in a transaction that is always rolled
// back, as a signed-in user (uuid, `request.jwt.claim.sub`), ANON, SERVICE (BYPASSRLS) or SUPERUSER.
// `s.attempt` wraps one statement in a savepoint, so a refused write does not abort the session.
// Lifted from Themis scripts/db-gate/leak-matrix.mjs.

import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import {
  AUDIENCES,
  BLOCKS,
  CARE_AREAS,
  CHILD_TABLES,
  CONTENT_STATUSES,
  CONTENT_TABLES,
  INTENSITIES,
  LEVELS,
  MEAL_TYPES,
  PRICE_BANDS,
  PRICE_PER,
  REGIONS,
  ROUTINE_TIMES,
  SKINCARE_CATEGORIES,
  SKIN_CONCERNS,
  SKIN_TYPES,
  STEP_TIMES,
  TIP_TOPICS,
  UNITS,
  USER_TABLES,
  WORKOUT_TYPES,
} from '../../src/content/enums.ts'
import { WORKOUT_TEMPLATES } from '../../src/content/seed/workouts.ts'
// P8.1 per-user enums live with the user-data contract, not with the content enums.
import {
  CADENCES,
  ENTRY_KINDS,
  ENTRY_UNITS,
  GOAL_KINDS,
  PLAN_STATUSES,
  SAVED_ITEM_KINDS,
} from '../../src/user/source.ts'

// --- identities ----------------------------------------------------------------------------------
export const U = Object.freeze({
  UA: '00000000-0000-4000-8000-0000000000a1',
  UB: '00000000-0000-4000-8000-0000000000b1',
  ADMIN: '00000000-0000-4000-8000-0000000000ad',
  NEW: '00000000-0000-4000-8000-0000000000c1', // signed up, no profile yet
})
/** Fixture `updated_at` / `reviewed_at`, so a trigger bump or a review stamp is unmistakable. */
export const OLD = '2000-01-01T00:00:00Z'

/**
 * The seed-id rule (PLAN §1.6): `md5('hygieia:<table>:' || slug)::uuid`, computed the way the
 * generator (P1.12) does, so fixture rows obey the rule the gate asserts over every row.
 * @param {string} table @param {string} slug
 */
export const sid = (table, slug) => {
  const h = createHash('md5').update(`hygieia:${table}:${slug}`).digest('hex')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

/**
 * Reference seed counts (PLAN P1.12): what `npm run seed:gen` ships per content table, asserted by
 * the gate over the rows the GENERATOR wrote — the fixture's `fx-` rows (inserted after the archive)
 * are excluded, so the check reads the seed, not the gate's own rows. `min` is a floor; `exact` is
 * asserted equal. `pendingTask` marks a kind whose seed module does not exist yet: ZERO seeded rows
 * PASS with a note until the module lands, after which the count binds.
 * @typedef {{ min: number, exact?: undefined, pendingTask?: string } | { exact: number, min?: undefined, pendingTask?: string }} SeedCount
 */
/** @type {Readonly<Record<string, SeedCount>>} */
export const SEED_COUNTS = Object.freeze({
  ingredients: { min: 160 },
  diets: { min: 8 },
  recipes: { min: 40 },
  exercises: { min: 60 },
  health_tips: { min: 30 },
  // P4.8 landed: the module exists, so the count BINDS (no pendingTask — zero rows is red).
  workout_templates: { exact: 63 },
  // P7.1 skincare (+ nails): floors are the brief's minimums plus the nail items.
  skincare_product_types: { min: 36 },
  skincare_routines: { min: 28 },
  skincare_tips: { min: 55 },
})
/** Child tables: seeded rows under NON-fixture parents (parent slug not `fx-`). */
/** @type {Readonly<Record<string, { min: number, pendingTask?: string }>>} */
export const SEED_CHILD_COUNTS = Object.freeze({
  recipe_ingredients: { min: 1 },
  recipe_diets: { min: 1 },
  workout_template_exercises: { min: 1 },
})

/**
 * The two seeded workout templates the fixture adopts (see the header): the two lowest slugs of the
 * P4.8 seed, code-unit order — deterministic, and the same rows the generator wrote to the archive.
 * [0] is flipped to `approved` by the fixture; [1] stays `pending`.
 */
export const ADOPTED_TEMPLATE_SLUGS = Object.freeze(
  WORKOUT_TEMPLATES.map((t) => t.slug)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    .slice(0, 2),
)
if (ADOPTED_TEMPLATE_SLUGS.length !== 2)
  throw new Error('catalogue: src/content/seed/workouts.ts must ship at least two templates')

/**
 * Fixture slugs per content table; the first `approved` and `pending` slug is the one the checks
 * mutate. Every slug is `fx-` (the gate's own rows) EXCEPT workout_templates, whose two slugs are
 * ADOPTED seeded rows (no free unique cell — header).
 */
export const FX = Object.freeze({
  ingredients: { approved: ['fx-tomato', 'fx-olive-oil'], pending: ['fx-feta'] },
  diets: { approved: ['fx-mediterranean'], pending: ['fx-keto'] },
  recipes: { approved: ['fx-greek-salad'], pending: ['fx-feta-omelette'] },
  exercises: { approved: ['fx-squat'], pending: ['fx-pushup'] },
  workout_templates: {
    approved: [ADOPTED_TEMPLATE_SLUGS[0]],
    pending: [ADOPTED_TEMPLATE_SLUGS[1]],
  },
  health_tips: { approved: ['fx-drink-water'], pending: ['fx-sleep-early'] },
  skincare_product_types: { approved: ['fx-gel-cleanser'], pending: ['fx-retinol-serum'] },
  skincare_routines: { approved: ['fx-face-men-oily-am'], pending: ['fx-nails-weekly'] },
  skincare_tips: { approved: ['fx-face-spf-daily'], pending: ['fx-nails-file-one-way'] },
})
export const ID = Object.freeze({
  tomato: sid('ingredients', 'fx-tomato'),
  oliveOil: sid('ingredients', 'fx-olive-oil'),
  feta: sid('ingredients', 'fx-feta'),
  mediterranean: sid('diets', 'fx-mediterranean'),
  keto: sid('diets', 'fx-keto'),
  greekSalad: sid('recipes', 'fx-greek-salad'),
  omelette: sid('recipes', 'fx-feta-omelette'),
  squat: sid('exercises', 'fx-squat'),
  pushup: sid('exercises', 'fx-pushup'),
  // Adopted SEEDED templates (ids by the same formula the generator used, so they resolve in the DB).
  tplApproved: sid('workout_templates', ADOPTED_TEMPLATE_SLUGS[0]),
  tplPending: sid('workout_templates', ADOPTED_TEMPLATE_SLUGS[1]),
  fridgeA: '20000000-0000-4000-8000-00000000000a',
  fridgeB: '20000000-0000-4000-8000-00000000000b',
  planA: '30000000-0000-4000-8000-00000000000a',
  planB: '30000000-0000-4000-8000-00000000000b',
  // P8.1 profile fixture rows (one of A, one of B per table).
  entryA: '40000000-0000-4000-8000-00000000000a',
  entryB: '40000000-0000-4000-8000-00000000000b',
  wplanA: '50000000-0000-4000-8000-00000000000a',
  wplanB: '50000000-0000-4000-8000-00000000000b',
  wsessA: '60000000-0000-4000-8000-00000000000a',
  wsessB: '60000000-0000-4000-8000-00000000000b',
  drinkWater: sid('health_tips', 'fx-drink-water'),
})

// --- archive -------------------------------------------------------------------------------------
/** Sorted .sql files of a migrations directory (empty when absent). @param {string} dir */
export const archiveFiles = (dir) =>
  existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => f.endsWith('.sql'))
        .sort()
    : []

/**
 * Apply the archive `times` times, in order (the gate's "twice" = idempotent-safe).
 * @param {import('@electric-sql/pglite').PGlite} db @param {string} dir @param {number} [times]
 */
export async function applyArchive(db, dir, times = 2) {
  const files = archiveFiles(dir)
  for (let i = 0; i < times; i++)
    for (const f of files) await db.exec(readFileSync(path.join(dir, f), 'utf8'))
  return files
}

// --- fixture -------------------------------------------------------------------------------------
/**
 * Seed the fixture, committed, as the superuser (every check's write is rolled back by actAs).
 * Approved rows carry a fixture review stamp (reviewed_at = OLD, reviewed_by = ADMIN); pending rows
 * carry none. Locale columns are non-blank ASCII on purpose (fixture, not content).
 * @param {import('@electric-sql/pglite').PGlite} db
 */
export async function seedFixture(db) {
  const A = `'approved', '${OLD}', '${U.ADMIN}'`
  const P = `'pending', null, null`
  await db.exec(`
    insert into auth.users (id, email) values
      ('${U.UA}', 'ua@example.com'), ('${U.UB}', 'ub@example.com'),
      ('${U.ADMIN}', 'admin@example.com'), ('${U.NEW}', 'new@example.com');
    insert into hygieia.profiles (user_id, display_name, is_admin, updated_at) values
      ('${U.UA}', 'User A', false, '${OLD}'),
      ('${U.UB}', 'User B', false, '${OLD}'),
      ('${U.ADMIN}', 'Admin', true, '${OLD}');

    insert into hygieia.ingredients (id, slug, name_el, name_en, category, unit, grams_per_unit,
      kcal_100g, protein_100g, carbs_100g, fat_100g, source_note, price_eur_min, price_eur_max,
      price_per, price_as_of, price_note, substitute_slugs, is_pantry_staple,
      status, reviewed_at, reviewed_by, updated_at) values
      ('${ID.tomato}', 'fx-tomato', 'fx tomato el', 'fx tomato en', 'vegetables', 'piece', 120,
       18, 0.9, 3.9, 0.2, 'gate fixture', 1.5, 2.5, 'kg', '2026-10-05', 'gate fixture', '{}', false,
       ${A}, '${OLD}'),
      ('${ID.oliveOil}', 'fx-olive-oil', 'fx olive oil el', 'fx olive oil en', 'oils', 'tbsp', 13.5,
       884, 0, 0, 100, 'gate fixture', 8, 12, 'l', '2026-10-05', 'gate fixture', '{}', true,
       ${A}, '${OLD}'),
      ('${ID.feta}', 'fx-feta', 'fx feta el', 'fx feta en', 'dairy', 'g', 1,
       264, 14, 4, 21, 'gate fixture', 9, 14, 'kg', '2026-10-05', 'gate fixture', '{fx-tomato}', false,
       ${P}, '${OLD}');

    insert into hygieia.diets (id, slug, name_el, name_en, summary_el, summary_en, allowed_el, allowed_en,
      avoided_el, avoided_en, pros_el, pros_en, cons_el, cons_en, avoid_if_el, avoid_if_en, source_url,
      status, reviewed_at, reviewed_by, updated_at) values
      ('${ID.mediterranean}', 'fx-mediterranean', 'fx med el', 'fx med en', 'fx summary el', 'fx summary en',
       '{olive oil}', '{olive oil}', '{sugar}', '{sugar}', '{heart}', '{heart}', '{cost}', '{cost}',
       '{ask a doctor}', '{ask a doctor}', null, ${A}, '${OLD}'),
      ('${ID.keto}', 'fx-keto', 'fx keto el', 'fx keto en', 'fx summary el', 'fx summary en',
       '{fat}', '{fat}', '{bread}', '{bread}', '{satiety}', '{satiety}', '{restrictive}', '{restrictive}',
       '{ask a doctor}', '{ask a doctor}', 'https://example.org/fixture/keto', ${P}, '${OLD}');

    insert into hygieia.recipes (id, slug, title_el, title_en, steps_el, steps_en, portions, prep_min,
      meal_types, image_path, status, reviewed_at, reviewed_by, updated_at) values
      ('${ID.greekSalad}', 'fx-greek-salad', 'fx salad el', 'fx salad en', '{Chop,Mix}', '{Chop,Mix}',
       2, 10, '{lunch,dinner}', null, ${A}, '${OLD}'),
      ('${ID.omelette}', 'fx-feta-omelette', 'fx omelette el', 'fx omelette en', '{Beat,Fry}', '{Beat,Fry}',
       1, 10, '{breakfast}', null, ${P}, '${OLD}');
    insert into hygieia.recipe_ingredients (recipe_id, ingredient_id, position, quantity, unit,
      note_el, note_en, updated_at) values
      ('${ID.greekSalad}', '${ID.tomato}', 0, 200, 'g', null, null, '${OLD}'),
      ('${ID.greekSalad}', '${ID.oliveOil}', 1, 2, 'tbsp', null, null, '${OLD}'),
      ('${ID.omelette}', '${ID.feta}', 0, 50, 'g', null, null, '${OLD}'),
      ('${ID.omelette}', '${ID.tomato}', 1, 1, 'piece', 'fx diced el', 'fx diced en', '${OLD}');
    insert into hygieia.recipe_diets (recipe_id, diet_id, updated_at) values
      ('${ID.greekSalad}', '${ID.mediterranean}', '${OLD}'),
      ('${ID.omelette}', '${ID.keto}', '${OLD}'),
      ('${ID.omelette}', '${ID.mediterranean}', '${OLD}');

    insert into hygieia.exercises (id, slug, name_el, name_en, cue_el, cue_en, workout_type, level,
      muscle_groups, equipment_el, equipment_en, status, reviewed_at, reviewed_by, updated_at) values
      ('${ID.squat}', 'fx-squat', 'fx squat el', 'fx squat en', 'fx cue el', 'fx cue en', 'home', 'beginner',
       '{legs,glutes}', null, null, ${A}, '${OLD}'),
      ('${ID.pushup}', 'fx-pushup', 'fx pushup el', 'fx pushup en', 'fx cue el', 'fx cue en', 'calisthenics',
       'beginner', '{chest}', 'fx mat el', 'fx mat en', ${P}, '${OLD}');
    insert into hygieia.health_tips (id, slug, topic, title_el, title_en, body_el, body_en, source_url,
      needs_source, status, reviewed_at, reviewed_by, updated_at) values
      ('${sid('health_tips', 'fx-drink-water')}', 'fx-drink-water', 'hydration', 'fx water el', 'fx water en',
       'fx body el', 'fx body en', 'https://example.org/fixture/water', false, ${A}, '${OLD}'),
      ('${sid('health_tips', 'fx-sleep-early')}', 'fx-sleep-early', 'sleep', 'fx sleep el', 'fx sleep en',
       'fx body el', 'fx body en', null, true, ${P}, '${OLD}');

    -- skincare (P7.1): product TYPES, routines whose jsonb steps reference the fixture types, tips.
    insert into hygieia.skincare_product_types (id, slug, name_el, name_en, description_el, description_en,
      category, key_ingredients, avoid_with, regions, audiences, skin_types, concerns, time, price_band_eur,
      notes_el, notes_en, status, reviewed_at, reviewed_by, updated_at) values
      ('${sid('skincare_product_types', 'fx-gel-cleanser')}', 'fx-gel-cleanser', 'fx cleanser el',
       'fx cleanser en', 'fx desc el', 'fx desc en', 'cleanser', '{salicylic acid}', '{}', '{eu,global}',
       '{all}', '{oily,combination}', '{acne,pores}', 'both', 'low', 'fx notes el', 'fx notes en',
       ${A}, '${OLD}'),
      ('${sid('skincare_product_types', 'fx-retinol-serum')}', 'fx-retinol-serum', 'fx retinol el',
       'fx retinol en', 'fx desc el', 'fx desc en', 'serum', '{retinol}', '{aha,bha}', '{us}', '{all}',
       '{normal,dry}', '{aging}', 'pm', 'mid', 'fx notes el', 'fx notes en', ${P}, '${OLD}');
    insert into hygieia.skincare_routines (id, slug, area, name_el, name_en, audience, skin_type, region,
      time, intro_el, intro_en, steps, duration_min, status, reviewed_at, reviewed_by, updated_at) values
      ('${sid('skincare_routines', 'fx-face-men-oily-am')}', 'fx-face-men-oily-am', 'face', 'fx routine el',
       'fx routine en', 'men', 'oily', 'eu', 'am', 'fx intro el', 'fx intro en',
       '[{"order":1,"product_type_slug":"fx-gel-cleanser","note_el":"fx","note_en":"fx","optional":false}]',
       5, ${A}, '${OLD}'),
      ('${sid('skincare_routines', 'fx-nails-weekly')}', 'fx-nails-weekly', 'nails', 'fx nails el',
       'fx nails en', 'all', 'all', 'global', 'weekly', 'fx intro el', 'fx intro en',
       '[{"order":1,"product_type_slug":"fx-gel-cleanser","note_el":"fx","note_en":"fx","optional":false},
         {"order":2,"product_type_slug":"fx-retinol-serum","note_el":"fx","note_en":"fx","optional":true}]',
       10, ${P}, '${OLD}');
    insert into hygieia.skincare_tips (id, slug, area, title_el, title_en, body_el, body_en, audiences,
      skin_types, concerns, regions, sources, needs_source, status, reviewed_at, reviewed_by, updated_at) values
      ('${sid('skincare_tips', 'fx-face-spf-daily')}', 'fx-face-spf-daily', 'face', 'fx spf el', 'fx spf en',
       'fx body el', 'fx body en', '{all}', '{all}', '{sun}', '{global}',
       '{https://example.org/fixture/spf}', false, ${A}, '${OLD}'),
      ('${sid('skincare_tips', 'fx-nails-file-one-way')}', 'fx-nails-file-one-way', 'nails', 'fx nails el',
       'fx nails en', 'fx body el', 'fx body en', '{men,women}', '{all}', '{nails}', '{global}', '{}', true,
       ${P}, '${OLD}');

    insert into hygieia.fridge_lists (id, user_id, name, ingredient_slugs, updated_at) values
      ('${ID.fridgeA}', '${U.UA}', 'A fridge', '{fx-tomato}', '${OLD}'),
      ('${ID.fridgeB}', '${U.UB}', 'B fridge', '{fx-feta}', '${OLD}');
    insert into hygieia.saved_plans (id, user_id, diet_id, week_start, plan, updated_at) values
      ('${ID.planA}', '${U.UA}', '${ID.mediterranean}', '2026-10-05', '{"days":[]}', '${OLD}'),
      ('${ID.planB}', '${U.UB}', '${ID.mediterranean}', '2026-10-05', '{"days":[]}', '${OLD}');
    insert into hygieia.favourites (user_id, recipe_id, updated_at) values
      ('${U.UA}', '${ID.greekSalad}', '${OLD}'),
      ('${U.UB}', '${ID.greekSalad}', '${OLD}');

    -- P8.1 profile: one row of A and one of B per table. Kinds are chosen so the catalogue's leak /
    -- control inserts (a water entry, a sleep goal, a health_tip item, a 'leak' plan / session)
    -- match nothing the fixture holds.
    insert into hygieia.entries (id, user_id, kind, entry_date, value, unit, payload, note, updated_at) values
      ('${ID.entryA}', '${U.UA}', 'weight', '2026-10-01', 80, 'kg', null, 'A weight', '${OLD}'),
      ('${ID.entryB}', '${U.UB}', 'weight', '2026-10-01', 70, 'kg', '{"source":"fixture"}', null, '${OLD}');
    insert into hygieia.goals (user_id, kind, target, unit, cadence, updated_at) values
      ('${U.UA}', 'water', 2000, 'ml', 'daily', '${OLD}'),
      ('${U.UB}', 'water', 1500, 'ml', 'daily', '${OLD}');
    insert into hygieia.saved_items (user_id, kind, item_id, updated_at) values
      ('${U.UA}', 'workout', '${ID.tplApproved}', '${OLD}'),
      ('${U.UB}', 'workout', '${ID.tplApproved}', '${OLD}');
    insert into hygieia.workout_plans (id, user_id, template_id, name, weeks, days_per_week, start_date,
      status, updated_at) values
      ('${ID.wplanA}', '${U.UA}', '${ID.tplApproved}', 'A plan', 4, 3, '2026-10-01', 'active', '${OLD}'),
      ('${ID.wplanB}', '${U.UB}', '${ID.tplApproved}', 'B plan', 8, 4, '2026-10-01', 'completed', '${OLD}');
    insert into hygieia.workout_sessions (id, user_id, plan_id, template_id, performed_at, duration_min,
      exercises, note, updated_at) values
      ('${ID.wsessA}', '${U.UA}', '${ID.wplanA}', '${ID.tplApproved}', '2026-10-02', 45,
       '[{"exercise_id":"${ID.squat}","sets":[{"reps":10,"weight_kg":60,"rpe":7,"done":true}]}]',
       'A session', '${OLD}'),
      ('${ID.wsessB}', '${U.UB}', null, null, '2026-10-02', null,
       '[{"exercise_id":"${ID.pushup}","sets":[{"reps":12,"weight_kg":null,"rpe":null,"done":false}]}]',
       null, '${OLD}');
  `)

  // workout_templates: no free unique cell (header), so ADOPT two seeded rows instead of inserting.
  // Both are stamped exactly like an inserted fixture row (approved: reviewed_at = OLD, reviewed_by =
  // ADMIN; pending: no stamp; updated_at = OLD on both) so the stamp/touch checks stay meaningful.
  // Triggers are bypassed for THIS transaction only: touch_updated_at would set now() and
  // stamp_review would set reviewed_by = auth.uid() (null as the superuser). Each UPDATE must hit
  // exactly one row — a missing seeded row (an archive without the workouts seed) is a fixture error,
  // reported on the gate's `fixture seeded` line, never a silent pass.
  await db.exec(`begin; set local session_replication_role = replica;`)
  try {
    const flip = await db.query(
      `update hygieia.workout_templates
          set status = 'approved', reviewed_at = $2, reviewed_by = $3, updated_at = $2
        where slug = $1 and status = 'pending'`,
      [ADOPTED_TEMPLATE_SLUGS[0], OLD, U.ADMIN],
    )
    const keep = await db.query(
      `update hygieia.workout_templates
          set reviewed_at = null, reviewed_by = null, updated_at = $2
        where slug = $1 and status = 'pending'`,
      [ADOPTED_TEMPLATE_SLUGS[1], OLD],
    )
    for (const [slug, r] of /** @type {[string, { affectedRows?: number }][]} */ ([
      [ADOPTED_TEMPLATE_SLUGS[0], flip],
      [ADOPTED_TEMPLATE_SLUGS[1], keep],
    ]))
      if ((r.affectedRows ?? 0) !== 1)
        throw new Error(
          `fixture: adopted seeded workout_templates row "${slug}" not found pending (affected ${r.affectedRows ?? 0}) — is the P4.8 seed in the archive?`,
        )
    await db.exec('commit')
  } catch (e) {
    await db.exec('rollback')
    throw e
  }
}

// --- enum contract -------------------------------------------------------------------------------
/**
 * Every CHECK-constrained enum column and the src/content/enums.ts array it must equal, in order.
 * The DB literal list is read back with `checkValues`; the schema-contract test and the gate both
 * assert equality, so the DB and TS enums cannot drift (PLAN P1.6).
 * `source` names the TS module the array lives in (default src/content/enums.ts; the P8.1
 * per-user enums live in src/user/source.ts).
 * @type {ReadonlyArray<{ table: string, column: string, name: string, values: readonly string[], source?: string }>}
 */
export const ENUM_COLUMNS = Object.freeze([
  { table: 'ingredients', column: 'unit', name: 'UNITS', values: UNITS },
  { table: 'ingredients', column: 'price_per', name: 'PRICE_PER', values: PRICE_PER },
  { table: 'recipe_ingredients', column: 'unit', name: 'UNITS', values: UNITS },
  { table: 'recipes', column: 'meal_types', name: 'MEAL_TYPES', values: MEAL_TYPES },
  { table: 'exercises', column: 'workout_type', name: 'WORKOUT_TYPES', values: WORKOUT_TYPES },
  { table: 'exercises', column: 'level', name: 'LEVELS', values: LEVELS },
  {
    table: 'workout_templates',
    column: 'workout_type',
    name: 'WORKOUT_TYPES',
    values: WORKOUT_TYPES,
  },
  { table: 'workout_templates', column: 'level', name: 'LEVELS', values: LEVELS },
  { table: 'workout_templates', column: 'intensity', name: 'INTENSITIES', values: INTENSITIES },
  { table: 'workout_template_exercises', column: 'block', name: 'BLOCKS', values: BLOCKS },
  { table: 'health_tips', column: 'topic', name: 'TIP_TOPICS', values: TIP_TOPICS },
  // P7.1 skincare — scalar and array-valued (`x <@ array[…]`) enum columns alike.
  {
    table: 'skincare_product_types',
    column: 'category',
    name: 'SKINCARE_CATEGORIES',
    values: SKINCARE_CATEGORIES,
  },
  { table: 'skincare_product_types', column: 'regions', name: 'REGIONS', values: REGIONS },
  { table: 'skincare_product_types', column: 'audiences', name: 'AUDIENCES', values: AUDIENCES },
  { table: 'skincare_product_types', column: 'skin_types', name: 'SKIN_TYPES', values: SKIN_TYPES },
  {
    table: 'skincare_product_types',
    column: 'concerns',
    name: 'SKIN_CONCERNS',
    values: SKIN_CONCERNS,
  },
  { table: 'skincare_product_types', column: 'time', name: 'STEP_TIMES', values: STEP_TIMES },
  {
    table: 'skincare_product_types',
    column: 'price_band_eur',
    name: 'PRICE_BANDS',
    values: PRICE_BANDS,
  },
  { table: 'skincare_routines', column: 'area', name: 'CARE_AREAS', values: CARE_AREAS },
  { table: 'skincare_routines', column: 'audience', name: 'AUDIENCES', values: AUDIENCES },
  { table: 'skincare_routines', column: 'skin_type', name: 'SKIN_TYPES', values: SKIN_TYPES },
  { table: 'skincare_routines', column: 'region', name: 'REGIONS', values: REGIONS },
  { table: 'skincare_routines', column: 'time', name: 'ROUTINE_TIMES', values: ROUTINE_TIMES },
  { table: 'skincare_tips', column: 'area', name: 'CARE_AREAS', values: CARE_AREAS },
  { table: 'skincare_tips', column: 'audiences', name: 'AUDIENCES', values: AUDIENCES },
  { table: 'skincare_tips', column: 'skin_types', name: 'SKIN_TYPES', values: SKIN_TYPES },
  { table: 'skincare_tips', column: 'concerns', name: 'SKIN_CONCERNS', values: SKIN_CONCERNS },
  { table: 'skincare_tips', column: 'regions', name: 'REGIONS', values: REGIONS },
  ...CONTENT_TABLES.map((table) => ({
    table,
    column: 'status',
    name: 'CONTENT_STATUSES',
    values: CONTENT_STATUSES,
  })),
  // P8.1 profile — the per-user enums of src/user/source.ts.
  {
    table: 'entries',
    column: 'kind',
    name: 'ENTRY_KINDS',
    values: ENTRY_KINDS,
    source: 'source.ts',
  },
  {
    table: 'entries',
    column: 'unit',
    name: 'ENTRY_UNITS',
    values: ENTRY_UNITS,
    source: 'source.ts',
  },
  { table: 'goals', column: 'kind', name: 'GOAL_KINDS', values: GOAL_KINDS, source: 'source.ts' },
  { table: 'goals', column: 'cadence', name: 'CADENCES', values: CADENCES, source: 'source.ts' },
  {
    table: 'saved_items',
    column: 'kind',
    name: 'SAVED_ITEM_KINDS',
    values: SAVED_ITEM_KINDS,
    source: 'source.ts',
  },
  {
    table: 'workout_plans',
    column: 'status',
    name: 'PLAN_STATUSES',
    values: PLAN_STATUSES,
    source: 'source.ts',
  },
])

/**
 * The literals a single-column CHECK on hygieia.<table>.<column> admits, in constraint order
 * (`x in (…)` and `x <@ array[…]` both render as `ARRAY['a'::text, …]`). Null unless exactly one
 * such constraint exists.
 * @param {import('@electric-sql/pglite').PGlite} db @param {string} table @param {string} column
 * @returns {Promise<string[] | null>}
 */
export async function checkValues(db, table, column) {
  const r = await db.query(
    `select pg_get_constraintdef(c.oid) as def
       from pg_constraint c
       join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
      where c.conrelid = $1::regclass and c.contype = 'c'
        and a.attname = $2 and cardinality(c.conkey) = 1`,
    [`hygieia.${table}`, column],
  )
  if (r.rows.length !== 1) return null
  const def = String(/** @type {{ def: string }} */ (r.rows[0]).def)
  return [...def.matchAll(/'([^']*)'::text/g)].map((m) => m[1])
}

// --- harness -------------------------------------------------------------------------------------
export const ANON = Symbol('anon')
export const SUPERUSER = Symbol('superuser')
/** The service key (BYPASSRLS): server-side only. */
export const SERVICE = Symbol('service_role')

/** @typedef {string | typeof ANON | typeof SUPERUSER | typeof SERVICE} Who */
/** @typedef {Record<string, unknown>} Row */
/** @typedef {{ ok: true, affected: number } | { ok: false, error: string }} Outcome */
/**
 * @typedef {object} Session
 * @property {<T extends Row = Row>(sql: string, params?: unknown[]) => Promise<T[]>} rows
 *   Rows of a query; throws on error (use `attempt` when an error is the expected outcome).
 * @property {(table: string, where?: string) => Promise<number>} count
 *   Rows of hygieia.<table> visible to this identity, optionally filtered.
 * @property {(sql: string, params?: unknown[]) => Promise<Outcome>} attempt
 *   Runs one statement inside a savepoint, so a refused write does not abort the session.
 * @property {<T>(fn: () => Promise<T>) => Promise<T>} sudo
 *   Run `fn` as the superuser inside the same (rolled-back) transaction, then switch back.
 */
/**
 * @typedef {object} Harness
 * @property {import('@electric-sql/pglite').PGlite} db
 * @property {<T>(who: Who, fn: (s: Session) => Promise<T>) => Promise<T>} actAs
 */

/**
 * @param {import('@electric-sql/pglite').PGlite} db
 * @returns {Harness}
 */
export function createHarness(db) {
  /** @param {Who} who */
  async function setIdentity(who) {
    if (who === SUPERUSER) {
      await db.exec(`reset role`)
      await db.query(`select set_config('request.jwt.claim.sub', '', true)`)
    } else if (who === SERVICE) {
      await db.exec(`set local role service_role`)
      await db.query(`select set_config('request.jwt.claim.sub', '', true)`)
    } else if (who === ANON) {
      await db.exec(`set local role anon`)
      await db.query(`select set_config('request.jwt.claim.sub', '', true)`)
    } else {
      await db.exec(`set local role authenticated`)
      await db.query(`select set_config('request.jwt.claim.sub', $1, true)`, [who])
    }
  }

  let savepoints = 0
  /** @param {Who} who @returns {Session} */
  const session = (who) => ({
    // reason: `any` because the row type T is the caller's claim about the query's shape.
    rows: async (sql, params) => /** @type {any} */ ((await db.query(sql, params)).rows),
    count: async (table, where = 'true') =>
      /** @type {{ n: number }} */ (
        (await db.query(`select count(*)::int as n from hygieia.${table} where ${where}`)).rows[0]
      ).n,
    attempt: async (sql, params) => {
      const sp = `sp_${++savepoints}`
      await db.exec(`savepoint ${sp}`)
      try {
        const r = await db.query(sql, params)
        await db.exec(`release savepoint ${sp}`)
        return { ok: true, affected: r.affectedRows ?? 0 }
      } catch (e) {
        await db.exec(`rollback to savepoint ${sp}`)
        return { ok: false, error: e instanceof Error ? e.message : String(e) }
      }
    },
    sudo: async (fn) => {
      await setIdentity(SUPERUSER)
      try {
        return await fn()
      } finally {
        await setIdentity(who)
      }
    },
  })

  /**
   * Act as `who` inside a transaction that is always rolled back.
   * @template T
   * @param {Who} who
   * @param {(s: Session) => Promise<T>} fn
   * @returns {Promise<T>}
   */
  async function actAs(who, fn) {
    await db.exec('begin')
    try {
      await setIdentity(who)
      return await fn(session(who))
    } finally {
      await db.exec('rollback')
    }
  }

  return { db, actAs }
}

/** Refused by a privilege check or by RLS (not by a constraint or a typo). @param {Outcome} o */
export const refused = (o) => !o.ok && /permission denied|violates row-level security/.test(o.error)
/** No effect = refused outright, or ran and touched nothing (RLS filtered every row). @param {Outcome} o */
export const noEffect = (o) => refused(o) || (o.ok && o.affected === 0)
/** Ran and touched at least one row. @param {Outcome} o */
export const tookEffect = (o) => o.ok && o.affected >= 1

/**
 * A content hash of the rows matching `where`, read as superuser (for before/after checks).
 * @param {Session} s @param {string} table @param {string} where
 */
export const snapshot = (s, table, where = 'true') =>
  s.sudo(async () => {
    const r = await s.rows(
      `select md5(string_agg(t::text, '|' order by t::text)) as h, count(*)::int as n
         from hygieia.${table} t where ${where}`,
    )
    return /** @type {{ h: string | null, n: number }} */ (r[0])
  })

export const ALL_TABLE_PRIVS = Object.freeze([
  'SELECT',
  'INSERT',
  'UPDATE',
  'DELETE',
  'TRUNCATE',
  'REFERENCES',
  'TRIGGER',
])
/**
 * Verbs `role` holds on `hygieia.<table>` (table-level or through any column grant).
 * @param {import('@electric-sql/pglite').PGlite} db @param {string} role @param {string} table
 */
export const tablePrivs = async (db, role, table) =>
  (
    await db.query(
      `select p from unnest($3::text[]) p
        where has_table_privilege($1, $2, p)
           or (p in ('SELECT','INSERT','UPDATE','REFERENCES') and has_any_column_privilege($1, $2, p))`,
      [role, `hygieia.${table}`, [...ALL_TABLE_PRIVS]],
    )
  ).rows.map((r) => String(r.p))
/**
 * Columns of `hygieia.<table>` on which `role` holds `priv` (table-level or column-level).
 * @param {import('@electric-sql/pglite').PGlite} db @param {string} role @param {string} table @param {string} priv
 */
export const columnPrivs = async (db, role, table, priv) =>
  (
    await db.query(
      `select a.attname from pg_attribute a
        where a.attrelid = $2::regclass and a.attnum > 0 and not a.attisdropped
          and has_column_privilege($1, $2::regclass, a.attname, $3)
        order by a.attnum`,
      [role, `hygieia.${table}`, priv],
    )
  ).rows.map((r) => String(r.attname))

// --- the catalogue -------------------------------------------------------------------------------
/**
 * @typedef {object} ContentEntry
 * @property {string} table
 * @property {'content'} kind
 * @property {string} probe  a SET clause on a content column an editor would use (and an attacker would try)
 * @property {string} probeColumn  the column `probe` sets (read back to prove the edit landed)
 */
/**
 * @typedef {object} ChildEntry
 * @property {string} table
 * @property {'child'} kind
 * @property {string} parent  the content table whose `status` gates visibility
 * @property {string} parentKey  the FK column to `parent`
 * @property {string} probe  a SET clause an admin would use
 * @property {string} insert  an INSERT of a new child under an approved parent (admin's legitimate edit)
 * @property {string} inserted  predicate matching exactly that inserted row
 */
/**
 * @typedef {object} UserEntry
 * @property {string} table
 * @property {'user'} kind
 * @property {string} probe  a SET clause on a client-updatable column
 * @property {string} leakInsert  an INSERT that names `user_id = UA` (a row of A); must be refused for everyone
 * @property {string} controlInsert  the same INSERT without `user_id` (what the client sends); lands as the caller's row
 * @property {string} inserted  predicate matching the inserted row (without user_id)
 */
/** @typedef {{ table: string, kind: 'profiles' }} ProfilesEntry */
/** @typedef {{ table: string, kind: 'service-only' }} ServiceOnlyEntry */
/** @typedef {ContentEntry | ChildEntry | UserEntry | ProfilesEntry | ServiceOnlyEntry} Entry */

/** @type {readonly Entry[]} */
export const CATALOGUE = Object.freeze([
  { table: 'schema_migrations', kind: 'service-only' },
  { table: 'profiles', kind: 'profiles' },
  {
    table: 'ingredients',
    kind: 'content',
    probe: `name_en = 'edited by gate'`,
    probeColumn: 'name_en',
  },
  { table: 'diets', kind: 'content', probe: `name_en = 'edited by gate'`, probeColumn: 'name_en' },
  {
    table: 'recipes',
    kind: 'content',
    probe: `title_en = 'edited by gate'`,
    probeColumn: 'title_en',
  },
  {
    table: 'recipe_ingredients',
    kind: 'child',
    parent: 'recipes',
    parentKey: 'recipe_id',
    probe: `quantity = 11`,
    insert: `insert into hygieia.recipe_ingredients (recipe_id, ingredient_id, position, quantity, unit)
             values ('${ID.greekSalad}', '${ID.feta}', 9, 10, 'g')`,
    inserted: `recipe_id = '${ID.greekSalad}' and position = 9`,
  },
  {
    table: 'recipe_diets',
    kind: 'child',
    parent: 'recipes',
    parentKey: 'recipe_id',
    probe: `diet_id = '${ID.keto}'`,
    insert: `insert into hygieia.recipe_diets (recipe_id, diet_id) values ('${ID.greekSalad}', '${ID.keto}')`,
    inserted: `recipe_id = '${ID.greekSalad}' and diet_id = '${ID.keto}'`,
  },
  {
    table: 'exercises',
    kind: 'content',
    probe: `name_en = 'edited by gate'`,
    probeColumn: 'name_en',
  },
  {
    table: 'workout_templates',
    kind: 'content',
    probe: `title_en = 'edited by gate'`,
    probeColumn: 'title_en',
  },
  {
    table: 'workout_template_exercises',
    kind: 'child',
    parent: 'workout_templates',
    parentKey: 'template_id',
    probe: `sets = 2`,
    // Under the ADOPTED approved seeded template; position 99 is above any seeded slot (max 12).
    insert: `insert into hygieia.workout_template_exercises
               (template_id, exercise_id, position, block, sets, reps, seconds, rest_seconds)
             values ('${ID.tplApproved}', '${ID.pushup}', 99, 'cooldown', 1, null, 30, 0)`,
    inserted: `template_id = '${ID.tplApproved}' and position = 99`,
  },
  {
    table: 'health_tips',
    kind: 'content',
    probe: `title_en = 'edited by gate'`,
    probeColumn: 'title_en',
  },
  {
    table: 'skincare_product_types',
    kind: 'content',
    probe: `name_en = 'edited by gate'`,
    probeColumn: 'name_en',
  },
  {
    table: 'skincare_routines',
    kind: 'content',
    probe: `name_en = 'edited by gate'`,
    probeColumn: 'name_en',
  },
  {
    table: 'skincare_tips',
    kind: 'content',
    probe: `title_en = 'edited by gate'`,
    probeColumn: 'title_en',
  },
  {
    table: 'fridge_lists',
    kind: 'user',
    probe: `name = 'pwned'`,
    leakInsert: `insert into hygieia.fridge_lists (user_id, name) values ('${U.UA}', 'leak')`,
    controlInsert: `insert into hygieia.fridge_lists (name) values ('leak')`,
    inserted: `name = 'leak'`,
  },
  {
    table: 'saved_plans',
    kind: 'user',
    probe: `week_start = '2030-01-07'`,
    leakInsert: `insert into hygieia.saved_plans (user_id, diet_id, week_start, plan)
                 values ('${U.UA}', '${ID.mediterranean}', '2030-01-01', '{"leak":true}')`,
    controlInsert: `insert into hygieia.saved_plans (diet_id, week_start, plan)
                    values ('${ID.mediterranean}', '2030-01-01', '{"leak":true}')`,
    inserted: `week_start = '2030-01-01'`,
  },
  {
    table: 'favourites',
    kind: 'user',
    probe: `recipe_id = '${ID.greekSalad}'`,
    // Both fixture favourites are the salad; the omelette is free for UA and UB alike.
    leakInsert: `insert into hygieia.favourites (user_id, recipe_id) values ('${U.UA}', '${ID.omelette}')`,
    controlInsert: `insert into hygieia.favourites (recipe_id) values ('${ID.omelette}')`,
    inserted: `recipe_id = '${ID.omelette}'`,
  },
  // P8.1 profile tables (20261006001300). Every leak/control value misses every fixture row.
  {
    table: 'entries',
    kind: 'user',
    probe: `note = 'pwned'`,
    leakInsert: `insert into hygieia.entries (user_id, kind, value, unit) values ('${U.UA}', 'water', 250, 'ml')`,
    controlInsert: `insert into hygieia.entries (kind, value, unit) values ('water', 250, 'ml')`,
    inserted: `kind = 'water' and value = 250`,
  },
  {
    table: 'goals',
    kind: 'user',
    probe: `target = 999`,
    leakInsert: `insert into hygieia.goals (user_id, kind, target, unit, cadence)
                 values ('${U.UA}', 'sleep', 8, 'h', 'daily')`,
    controlInsert: `insert into hygieia.goals (kind, target, unit, cadence) values ('sleep', 8, 'h', 'daily')`,
    inserted: `kind = 'sleep'`,
  },
  {
    table: 'saved_items',
    kind: 'user',
    probe: `kind = 'diet'`,
    // Polymorphic: item_id has no FK, so any uuid is a valid reference; the fixture tip's id is used.
    leakInsert: `insert into hygieia.saved_items (user_id, kind, item_id)
                 values ('${U.UA}', 'health_tip', '${ID.drinkWater}')`,
    controlInsert: `insert into hygieia.saved_items (kind, item_id) values ('health_tip', '${ID.drinkWater}')`,
    inserted: `kind = 'health_tip'`,
  },
  {
    table: 'workout_plans',
    kind: 'user',
    probe: `name = 'pwned'`,
    leakInsert: `insert into hygieia.workout_plans (user_id, template_id, name, weeks, days_per_week)
                 values ('${U.UA}', '${ID.tplApproved}', 'leak', 4, 3)`,
    controlInsert: `insert into hygieia.workout_plans (template_id, name, weeks, days_per_week)
                    values ('${ID.tplApproved}', 'leak', 4, 3)`,
    inserted: `name = 'leak'`,
  },
  {
    table: 'workout_sessions',
    kind: 'user',
    probe: `note = 'pwned'`,
    leakInsert: `insert into hygieia.workout_sessions (user_id, exercises, note)
                 values ('${U.UA}', '[{"exercise_id":"${ID.squat}","sets":[{"reps":5,"weight_kg":null,"rpe":null,"done":true}]}]', 'leak')`,
    controlInsert: `insert into hygieia.workout_sessions (exercises, note)
                    values ('[{"exercise_id":"${ID.squat}","sets":[{"reps":5,"weight_kg":null,"rpe":null,"done":true}]}]', 'leak')`,
    inserted: `note = 'leak'`,
  },
])

/** Kind-consistency with src/content/enums.ts: the TS table lists and the catalogue must agree. */
export const KIND_OF_TS = Object.freeze({
  content: /** @type {readonly string[]} */ (CONTENT_TABLES),
  child: /** @type {readonly string[]} */ (CHILD_TABLES),
  user: /** @type {readonly string[]} */ (USER_TABLES),
})

// --- the checks ----------------------------------------------------------------------------------
/** @typedef {{ name: string, run: () => Promise<[boolean, string]> }} Check */

const ofA = `user_id = '${U.UA}'`
const ofB = `user_id = '${U.UB}'`
const q1 = (/** @type {string} */ s) => `'${s}'`
const list = (/** @type {string[]} */ xs) => (xs.length ? xs.join(', ') : '')
const CLIENT_ROLES = ['anon', 'authenticated']

/**
 * The checks for one catalogue entry. Each `run` is self-contained (its own rolled-back actAs
 * sessions), so the gate and the Vitest twin can run them in any order.
 * @param {Entry} e @param {Harness} h @returns {Check[]}
 */
export function checksFor(e, h) {
  const { db, actAs } = h
  const T = `hygieia.${e.table}`
  /** @type {Check[]} */
  const out = []
  const add = (/** @type {string} */ name, /** @type {Check['run']} */ run) =>
    out.push({ name: `${T}: ${name}`, run })

  if (e.kind === 'service-only') {
    add('service-only — anon and authenticated hold no privilege and cannot SELECT', async () => {
      const got = []
      for (const role of CLIENT_ROLES)
        for (const p of await tablePrivs(db, role, e.table)) got.push(`${role}:${p}`)
      // One connection: sessions run one after the other, never concurrently.
      const reads = []
      for (const w of /** @type {Who[]} */ ([ANON, U.UA]))
        reads.push(await actAs(w, (s) => s.attempt(`select 1 from ${T} limit 1`)))
      return [got.length === 0 && reads.every(refused), list(got) || JSON.stringify(reads)]
    })
    return out
  }

  if (e.kind === 'content') {
    const approvedSlug = FX[/** @type {keyof typeof FX} */ (e.table)].approved[0]
    const pendingSlug = FX[/** @type {keyof typeof FX} */ (e.table)].pending[0]
    const approved = `status = 'approved'`
    const notApproved = `status <> 'approved'`
    add('fixture holds >= 1 approved and >= 1 pending row', () =>
      actAs(SUPERUSER, async (s) => {
        const a = await s.count(e.table, approved)
        const p = await s.count(e.table, `status = 'pending'`)
        return [a >= 1 && p >= 1, `approved ${a}, pending ${p}`]
      }),
    )
    for (const [label, who] of /** @type {[string, Who][]} */ ([
      ['anon', ANON],
      ['UA (signed in, not admin)', U.UA],
    ])) {
      add(`${label} reads exactly N approved rows and 0 pending`, () =>
        actAs(who, async (s) => {
          const want = await s.sudo(() => s.count(e.table, approved))
          const total = await s.sudo(() => s.count(e.table))
          const n = await s.count(e.table)
          const pending = await s.count(e.table, notApproved)
          return [
            n === want && pending === 0 && want > 0,
            `N = ${want} approved of ${total}; read ${n}, pending ${pending}`,
          ]
        }),
      )
    }
    add('ADMIN reads all rows (approved and pending)', () =>
      actAs(U.ADMIN, async (s) => {
        const total = await s.sudo(() => s.count(e.table))
        const approvedN = await s.sudo(() => s.count(e.table, approved))
        const n = await s.count(e.table)
        return [n === total && total > approvedN, `${n}/${total}`]
      }),
    )
    add(`UA's status update has no effect`, () =>
      actAs(U.UA, async (s) => {
        const before = await snapshot(s, e.table)
        const o = await s.attempt(`update ${T} set status = 'approved' where status = 'pending'`)
        // BLIND probe (no WHERE, constant SET): a statement that reads no column is gated by the
        // UPDATE policy ALONE — Postgres ANDs the SELECT policies in only when the row is read — so
        // an open write policy hides behind a correct read policy unless probed blind (prove-red
        // gate gap, 2026-10-05).
        const blind = await s.attempt(`update ${T} set status = 'approved'`)
        const after = await snapshot(s, e.table)
        return [
          noEffect(o) && noEffect(blind) && before.h === after.h,
          JSON.stringify({ o, blind }),
        ]
      }),
    )
    add(`UA's content edit has no effect`, () =>
      actAs(U.UA, async (s) => {
        const before = await snapshot(s, e.table)
        const o = await s.attempt(`update ${T} set ${e.probe}`)
        const after = await snapshot(s, e.table)
        return [noEffect(o) && before.h === after.h, JSON.stringify(o)]
      }),
    )
    add(`anon's UPDATE and DELETE are refused`, () =>
      actAs(ANON, async (s) => {
        const before = await snapshot(s, e.table)
        const u = await s.attempt(`update ${T} set ${e.probe}`)
        const d = await s.attempt(`delete from ${T}`)
        const after = await snapshot(s, e.table)
        return [refused(u) && refused(d) && before.h === after.h, JSON.stringify({ u, d })]
      }),
    )
    add(
      `ADMIN's status update takes effect and is stamped (reviewed_by = ADMIN, reviewed_at > fixture)`,
      () =>
        actAs(U.ADMIN, async (s) => {
          const o = await s.attempt(
            `update ${T} set status = 'approved' where slug = ${q1(pendingSlug)}`,
          )
          const r = await s.rows(
            `select status, reviewed_by, reviewed_at > timestamptz '${OLD}' as later,
                    updated_at > timestamptz '${OLD}' as touched
               from ${T} where slug = ${q1(pendingSlug)}`,
          )
          const row = r[0] ?? {}
          return [
            tookEffect(o) &&
              row.status === 'approved' &&
              row.reviewed_by === U.ADMIN &&
              row.later === true &&
              row.touched === true,
            JSON.stringify({ o, row }),
          ]
        }),
    )
    add(`ADMIN's content edit takes effect without re-stamping the review`, () =>
      actAs(U.ADMIN, async (s) => {
        const o = await s.attempt(`update ${T} set ${e.probe} where slug = ${q1(approvedSlug)}`)
        const r = await s.rows(
          `select ${e.probeColumn} as v, reviewed_by, reviewed_at = timestamptz '${OLD}' as kept
             from ${T} where slug = ${q1(approvedSlug)}`,
        )
        const row = r[0] ?? {}
        return [
          tookEffect(o) &&
            row.v === 'edited by gate' &&
            row.kept === true &&
            row.reviewed_by === U.ADMIN,
          JSON.stringify({ o, row }),
        ]
      }),
    )
    add('anon and authenticated hold no INSERT or DELETE privilege', async () => {
      const got = []
      for (const role of CLIENT_ROLES)
        for (const p of await tablePrivs(db, role, e.table))
          if (p === 'INSERT' || p === 'DELETE' || p === 'TRUNCATE') got.push(`${role}:${p}`)
      return [got.length === 0, list(got)]
    })
    add(
      'authenticated may UPDATE status but never id, slug, created_at, reviewed_at or reviewed_by',
      async () => {
        const cols = await columnPrivs(db, 'authenticated', e.table, 'UPDATE')
        const forbidden = ['id', 'slug', 'created_at', 'reviewed_at', 'reviewed_by'].filter((c) =>
          cols.includes(c),
        )
        return [cols.includes('status') && forbidden.length === 0, `UPDATE on: ${list(cols)}`]
      },
    )
    add(`every row id = md5('hygieia:${e.table}:' || slug)::uuid (seed-id rule)`, () =>
      actAs(SUPERUSER, async (s) => {
        const total = await s.count(e.table)
        const bad = await s.count(e.table, `id <> md5('hygieia:${e.table}:' || slug)::uuid`)
        return [bad === 0 && total > 0, `${total} rows checked, ${bad} off-formula`]
      }),
    )
    const ref = SEED_COUNTS[e.table]
    if (ref) {
      const want = ref.exact !== undefined ? `= ${ref.exact}` : `>= ${ref.min}`
      add(`seeded rows (slug not like 'fx-%') ${want} (P1.12 reference count)`, () =>
        actAs(SUPERUSER, async (s) => {
          const n = await s.count(e.table, `slug not like 'fx-%'`)
          if (n === 0 && ref.pendingTask)
            return [
              true,
              `0 seeded rows — not seeded yet, pending ${ref.pendingTask}; binds once seeded`,
            ]
          const ok = ref.exact !== undefined ? n === ref.exact : n >= ref.min
          return [ok, `${n} seeded rows`]
        }),
      )
    }
    return out
  }

  if (e.kind === 'child') {
    const P = `hygieia.${e.parent}`
    const underApproved = `exists (select 1 from ${P} p where p.id = ${e.parentKey} and p.status = 'approved')`
    add('fixture holds children under an approved and under a pending parent', () =>
      actAs(SUPERUSER, async (s) => {
        const a = await s.count(e.table, underApproved)
        const p = await s.count(e.table, `not ${underApproved}`)
        return [a >= 1 && p >= 1, `under approved ${a}, under pending ${p}`]
      }),
    )
    for (const [label, who] of /** @type {[string, Who][]} */ ([
      ['anon', ANON],
      ['UA (signed in, not admin)', U.UA],
    ])) {
      add(`${label} reads only children of approved parents`, () =>
        actAs(who, async (s) => {
          const want = await s.sudo(() => s.count(e.table, underApproved))
          const total = await s.sudo(() => s.count(e.table))
          const n = await s.count(e.table)
          const leaked = await s.count(e.table, `not ${underApproved}`)
          return [
            n === want && leaked === 0 && total > want,
            `${n}/${total} (approved parents: ${want})`,
          ]
        }),
      )
    }
    add('ADMIN reads all children', () =>
      actAs(U.ADMIN, async (s) => {
        const total = await s.sudo(() => s.count(e.table))
        const n = await s.count(e.table)
        return [n === total && total > 0, `${n}/${total}`]
      }),
    )
    add(`UA's INSERT, UPDATE and DELETE have no effect`, () =>
      actAs(U.UA, async (s) => {
        const before = await snapshot(s, e.table)
        const i = await s.attempt(e.insert)
        const u = await s.attempt(`update ${T} set ${e.probe}`)
        const d = await s.attempt(`delete from ${T}`)
        const after = await snapshot(s, e.table)
        const leaked = await s.sudo(() => s.count(e.table, e.inserted))
        return [
          refused(i) && noEffect(u) && noEffect(d) && leaked === 0 && before.h === after.h,
          JSON.stringify({ i, u, d }),
        ]
      }),
    )
    add(`anon's INSERT, UPDATE and DELETE are refused`, () =>
      actAs(ANON, async (s) => {
        const before = await snapshot(s, e.table)
        const i = await s.attempt(e.insert)
        const u = await s.attempt(`update ${T} set ${e.probe}`)
        const d = await s.attempt(`delete from ${T}`)
        const after = await snapshot(s, e.table)
        return [
          refused(i) && refused(u) && refused(d) && before.h === after.h,
          JSON.stringify({ i, u, d }),
        ]
      }),
    )
    add(`ADMIN's INSERT, UPDATE and DELETE take effect`, () =>
      actAs(U.ADMIN, async (s) => {
        const i = await s.attempt(e.insert)
        const made = await s.count(e.table, e.inserted)
        const u = await s.attempt(`update ${T} set ${e.probe} where ${e.inserted}`)
        const d = await s.attempt(`delete from ${T} where ${e.inserted}`)
        const left = await s.count(e.table, e.inserted)
        return [
          tookEffect(i) && made === 1 && tookEffect(u) && tookEffect(d) && left === 0,
          JSON.stringify({ i, made, u, d, left }),
        ]
      }),
    )
    const ref = SEED_CHILD_COUNTS[e.table]
    if (ref) {
      const underSeeded = `exists (select 1 from ${P} p where p.id = ${e.parentKey} and p.slug not like 'fx-%')`
      add(
        `seeded child rows (under non-fixture parents) >= ${ref.min} (P1.12 reference count)`,
        () =>
          actAs(SUPERUSER, async (s) => {
            const n = await s.count(e.table, underSeeded)
            if (n === 0 && ref.pendingTask)
              return [
                true,
                `0 seeded rows — not seeded yet, pending ${ref.pendingTask}; binds once seeded`,
              ]
            return [n >= ref.min, `${n} seeded rows`]
          }),
      )
    }
    return out
  }

  if (e.kind === 'user') {
    add('fixture is non-vacuous (A and B both have rows)', () =>
      actAs(SUPERUSER, async (s) => {
        const a = await s.count(e.table, ofA)
        const b = await s.count(e.table, ofB)
        return [a > 0 && b > 0, `A ${a}, B ${b}`]
      }),
    )
    add('UB reads ZERO rows of A', () =>
      actAs(U.UB, async (s) => {
        const n = await s.count(e.table, ofA)
        return [n === 0, `${n} rows`]
      }),
    )
    add(`UB reads all of B's own rows (not locked out)`, () =>
      actAs(U.UB, async (s) => {
        const want = await s.sudo(() => s.count(e.table, ofB))
        const n = await s.count(e.table, ofB)
        return [n === want && n > 0, `${n}/${want}`]
      }),
    )
    // Filtered AND blind probes: `where user_id = A` makes Postgres AND the SELECT policy in, which
    // masks an open UPDATE/DELETE policy (`using (true)` left the gate GREEN, 2026-10-05). A blind
    // `update … set …` / `delete from …` reads no column, so only the write policy decides — the
    // statement an attacker actually sends. A's rows must be byte-identical afterwards.
    add(`UB's UPDATE of A's rows has no effect`, () =>
      actAs(U.UB, async (s) => {
        const before = await snapshot(s, e.table, ofA)
        const o = await s.attempt(`update ${T} set ${e.probe} where ${ofA}`)
        const blind = await s.attempt(`update ${T} set ${e.probe}`)
        const own = await s.sudo(() => s.count(e.table, ofB))
        const after = await snapshot(s, e.table, ofA)
        return [
          noEffect(o) && (!blind.ok || blind.affected <= own) && before.h === after.h,
          JSON.stringify({ o, blind, own }),
        ]
      }),
    )
    add(`UB's DELETE of A's rows has no effect`, () =>
      actAs(U.UB, async (s) => {
        const before = await snapshot(s, e.table, ofA)
        const o = await s.attempt(`delete from ${T} where ${ofA}`)
        const blind = await s.attempt(`delete from ${T}`)
        const after = await snapshot(s, e.table, ofA)
        return [
          noEffect(o) && before.h === after.h && after.n > 0,
          JSON.stringify({ o, blind, left: after.n }),
        ]
      }),
    )
    add(`UB's INSERT of a row of A is refused`, () =>
      actAs(U.UB, async (s) => {
        const before = await snapshot(s, e.table, ofA)
        const o = await s.attempt(e.leakInsert)
        const leaked = await s.sudo(() => s.count(e.table, `${e.inserted} and ${ofA}`))
        const after = await snapshot(s, e.table, ofA)
        return [refused(o) && leaked === 0 && before.h === after.h, JSON.stringify(o)]
      }),
    )
    add(`control — the same INSERT without user_id succeeds as UA and lands as A's row`, () =>
      actAs(U.UA, async (s) => {
        const o = await s.attempt(e.controlInsert)
        const asA = await s.sudo(() => s.count(e.table, `${e.inserted} and ${ofA}`))
        const asB = await s.sudo(() => s.count(e.table, `${e.inserted} and ${ofB}`))
        return [tookEffect(o) && asA === 1 && asB === 0, JSON.stringify({ o, asA, asB })]
      }),
    )
    add(`UB's INSERT without user_id lands as B's own row, never A's`, () =>
      actAs(U.UB, async (s) => {
        const o = await s.attempt(e.controlInsert)
        const asB = await s.sudo(() => s.count(e.table, `${e.inserted} and ${ofB}`))
        const asA = await s.sudo(() => s.count(e.table, `${e.inserted} and ${ofA}`))
        return [tookEffect(o) && asB === 1 && asA === 0, JSON.stringify({ o, asB, asA })]
      }),
    )
    add('anon reads nothing and holds no privilege', async () => {
      const privs = await tablePrivs(db, 'anon', e.table)
      const o = await actAs(ANON, (s) => s.attempt(`select 1 from ${T} limit 1`))
      return [privs.length === 0 && refused(o), list(privs) || JSON.stringify(o)]
    })
    add(`UA reads all of A's rows`, () =>
      actAs(U.UA, async (s) => {
        const want = await s.sudo(() => s.count(e.table, ofA))
        const n = await s.count(e.table, ofA)
        return [n === want && n > 0, `${n}/${want}`]
      }),
    )
    add(`UA's UPDATE and DELETE of own rows take effect`, () =>
      actAs(U.UA, async (s) => {
        const before = await snapshot(s, e.table, ofA)
        const u = await s.attempt(`update ${T} set ${e.probe} where ${ofA}`)
        const mid = await snapshot(s, e.table, ofA)
        const d = await s.attempt(`delete from ${T} where ${ofA}`)
        const left = await s.sudo(() => s.count(e.table, ofA))
        return [
          tookEffect(u) && before.h !== mid.h && tookEffect(d) && left === 0,
          JSON.stringify({ u, d, left }),
        ]
      }),
    )
    add(
      'authenticated holds no INSERT or UPDATE privilege on user_id (it comes from default auth.uid())',
      async () => {
        const ins = await columnPrivs(db, 'authenticated', e.table, 'INSERT')
        const upd = await columnPrivs(db, 'authenticated', e.table, 'UPDATE')
        return [
          !ins.includes('user_id') && !upd.includes('user_id') && ins.length > 0,
          `INSERT on: ${list(ins)}; UPDATE on: ${list(upd)}`,
        ]
      },
    )
    return out
  }

  // --- profiles ---
  add('fixture holds UA, UB (is_admin = false) and ADMIN (is_admin = true)', () =>
    actAs(SUPERUSER, async (s) => {
      const r = await s.rows(
        `select user_id, is_admin from ${T} where user_id in ('${U.UA}', '${U.UB}', '${U.ADMIN}') order by 1`,
      )
      const ok = r.length === 3 && r.every((x) => x.is_admin === (x.user_id === U.ADMIN))
      return [ok, JSON.stringify(r)]
    }),
  )
  add(`UB reads ZERO rows of A (UA's profile)`, () =>
    actAs(U.UB, async (s) => {
      const n = await s.count(e.table, ofA)
      return [n === 0, `${n} rows`]
    }),
  )
  add('UA reads exactly own row', () =>
    actAs(U.UA, async (s) => {
      const r = await s.rows(`select user_id from ${T}`)
      return [r.length === 1 && r[0].user_id === U.UA, JSON.stringify(r)]
    }),
  )
  add(`UA's update of is_admin is refused (no column grant)`, () =>
    actAs(U.UA, async (s) => {
      const o = await s.attempt(`update ${T} set is_admin = true where ${ofA}`)
      const still = await s.sudo(() => s.count(e.table, `${ofA} and is_admin = false`))
      return [refused(o) && still === 1, JSON.stringify(o)]
    }),
  )
  add(`UA's insert with is_admin = true is refused`, () =>
    actAs(U.UA, async (s) => {
      const o = await s.attempt(
        `insert into ${T} (user_id, display_name, is_admin) values ('${U.NEW}', 'x', true)`,
      )
      const made = await s.sudo(() => s.count(e.table, `user_id = '${U.NEW}'`))
      return [refused(o) && made === 0, JSON.stringify(o)]
    }),
  )
  add(`NEW user's self-insert succeeds and lands with is_admin = false`, () =>
    actAs(U.NEW, async (s) => {
      const o = await s.attempt(
        `insert into ${T} (user_id, display_name) values ('${U.NEW}', 'New')`,
      )
      const r = await s.rows(`select is_admin from ${T} where user_id = '${U.NEW}'`)
      return [tookEffect(o) && r.length === 1 && r[0].is_admin === false, JSON.stringify({ o, r })]
    }),
  )
  add(`NEW user's insert of someone else's profile (UA's id) is refused`, () =>
    actAs(U.NEW, async (s) => {
      const o = await s.attempt(`insert into ${T} (user_id, display_name) values ('${U.UA}', 'x')`)
      return [refused(o), JSON.stringify(o)]
    }),
  )
  add(`UA's update of display_name takes effect`, () =>
    actAs(U.UA, async (s) => {
      const o = await s.attempt(`update ${T} set display_name = 'Renamed A' where ${ofA}`)
      const r = await s.rows(
        `select display_name, updated_at > timestamptz '${OLD}' as touched from ${T} where ${ofA}`,
      )
      return [
        tookEffect(o) && r[0]?.display_name === 'Renamed A' && r[0]?.touched === true,
        JSON.stringify({ o, r }),
      ]
    }),
  )
  add(`UB's UPDATE and DELETE of UA's row have no effect`, () =>
    actAs(U.UB, async (s) => {
      const before = await snapshot(s, e.table, ofA)
      const u = await s.attempt(`update ${T} set display_name = 'pwned' where ${ofA}`)
      const d = await s.attempt(`delete from ${T} where ${ofA}`)
      // Blind probes too (no WHERE): only the write policy decides — see the `user` kind.
      const bu = await s.attempt(`update ${T} set display_name = 'pwned'`)
      const bd = await s.attempt(`delete from ${T}`)
      const after = await snapshot(s, e.table, ofA)
      return [
        noEffect(u) && noEffect(d) && before.h === after.h && after.n === 1,
        JSON.stringify({ u, d, blindUpdate: bu, blindDelete: bd }),
      ]
    }),
  )
  add('anon reads nothing and holds no privilege', async () => {
    const privs = await tablePrivs(db, 'anon', e.table)
    const o = await actAs(ANON, (s) => s.attempt(`select 1 from ${T} limit 1`))
    return [privs.length === 0 && refused(o), list(privs) || JSON.stringify(o)]
  })
  add(
    'hygieia.is_admin() is true for ADMIN, false for UA, false without a profile (NEW)',
    async () => {
      const ask = (/** @type {Who} */ w) =>
        actAs(w, async (s) => (await s.rows(`select hygieia.is_admin() as a`))[0]?.a)
      const got = [await ask(U.ADMIN), await ask(U.UA), await ask(U.NEW)]
      return [JSON.stringify(got) === JSON.stringify([true, false, false]), JSON.stringify(got)]
    },
  )
  add('anon cannot execute hygieia.is_admin()', () =>
    actAs(ANON, async (s) => {
      const o = await s.attempt(`select hygieia.is_admin()`)
      return [refused(o), JSON.stringify(o)]
    }),
  )
  add('authenticated holds no INSERT or UPDATE privilege on is_admin', async () => {
    const ins = await columnPrivs(db, 'authenticated', e.table, 'INSERT')
    const upd = await columnPrivs(db, 'authenticated', e.table, 'UPDATE')
    return [
      !ins.includes('is_admin') &&
        !upd.includes('is_admin') &&
        ins.includes('user_id') &&
        upd.includes('display_name'),
      `INSERT on: ${list(ins)}; UPDATE on: ${list(upd)}`,
    ]
  })
  return out
}
