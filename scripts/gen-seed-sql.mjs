// THE SEED GENERATOR — `npm run seed:gen` and `npm run seed:check` (PLAN.md P1.12, §1.6)
//
// One source of truth for seed content: the TypeScript seed modules under src/content/seed/. This
// script turns each of them into ONE seed migration under supabase/migrations/, deterministically,
// so bundled content (the no-backend fallback) and the DB seed cannot diverge:
//
//   kind         source module (export)          migration                                    tables
//   ingredients  ingredients.ts (INGREDIENTS)     20261006000500_hygieia_seed_ingredients.sql  ingredients
//   diets        diets.ts (DIETS)                 20261006000600_hygieia_seed_diets.sql        diets
//   recipes      recipes.ts (RECIPES)             20261006000700_hygieia_seed_recipes.sql      recipes, recipe_ingredients, recipe_diets
//   exercises    exercises.ts (EXERCISES)         20261006000800_hygieia_seed_exercises.sql    exercises
//   workouts     workouts.ts (WORKOUT_TEMPLATES)  20261006000900_hygieia_seed_workouts.sql     workout_templates, workout_template_exercises
//   tips         tips.ts (HEALTH_TIPS)            20261006001000_hygieia_seed_tips.sql         health_tips
//   skincare     skincare.ts (SKINCARE_PRODUCT_TYPES, SKINCARE_ROUTINES, SKINCARE_TIPS)
//                                                 20261006001200_hygieia_seed_skincare.sql     skincare_product_types, skincare_routines, skincare_tips
//
// A kind whose module does not exist yet (workouts until P4.8) is SKIPPED with a printed line; in
// `--check` mode a missing file for a missing module is not a difference (a present file for a
// missing module IS: it can no longer be regenerated).
//
// Contract (the generated SQL):
//   * `id = md5('hygieia:<table>:<slug>')::uuid`, computed here with node:crypto and formatted
//     8-4-4-4-12 — byte-identical to what Postgres's `md5(...)::uuid` yields (asserted by the test
//     against PGlite and by the gate over every seeded row). Children resolve their FKs by the same
//     formula from the referenced row's slug; an unresolvable slug is a generator error, not a
//     runtime FK violation.
//   * `status` is omitted (default `pending`): seeds land unreviewed (PLAN §1.3).
//   * Deterministic: parent rows sorted by slug (code-unit order), children by parent slug then
//     position (array index; recipe diet tags by diet slug); integers printed as-is, decimals via
//     toFixed(6) with trailing zeros stripped; arrays as `array['a','b']::text[]` or `'{}'::text[]`;
//     nulls as `null`; dates as `'YYYY-MM-DD'::date`; booleans `true`/`false`; `'` doubled;
//     jsonb as `'<JSON.stringify>'::jsonb` with a FIXED key order per object (skincare routine steps:
//     order, product_type_slug, note_el, note_en, optional; `order` = index + 1).
//   * Idempotent-safe by construction (the gate applies the archive twice): every INSERT ends in
//     `on conflict (<pk>) do nothing`. Rows are emitted in batches of <= 200 per statement.
//   * Each file opens with a header naming this generator, the source module and the row counts.
//
// `seed:gen` writes the files. `seed:check` regenerates to memory and compares each file byte-for-
// byte after LF normalisation (CRLF checkouts are not drift); exit 1 names every differing,
// missing or extra `*_hygieia_seed_*.sql` file, exit 0 when identical. The exit code is set via
// process.exitCode on every path; nothing calls process.exit() (CLAUDE.md / BRAIN §5).
//
// CONTENT OVERLAYS (2026-10-06). The seven base files above are APPLIED live and forward-only, so
// the base modules are frozen (any change would make `seed:check` red, and editing an applied
// migration is forbidden). Later content changes are overlays — src/content/seed/overlays/NNNN-
// <name>.ts, listed in order in overlays/index.ts (contract: overlays/types.ts). For each overlay
// this script writes ONE more migration, `20261007<NNNN>00_hygieia_overlay_<name>.sql`:
//   * patches  → `update hygieia.<t> set <col> = <literal>, … where slug = '<slug>';` (child tables:
//                `where recipe_id|template_id = <uuid> and "position" = <n>`), editable columns only;
//   * additions → the base renderer's own `insert … on conflict (<pk>) do nothing` (same columns, same
//                literals, same md5 ids, status omitted → pending); child additions to an existing
//                parent are appended at position = its line/slot count.
// Statement order = the applier's (overlays/apply.ts): every table's patches, then every table's
// additions, tables in FK order. Before rendering, the overlay is applied to the seed-so-far with
// that same pure function, so an unknown slug, a duplicate addition, a non-editable column or an
// unresolvable reference is a generator error. `seed:check` (without `--only`) compares the overlay
// files too and names any `*_hygieia_overlay_*.sql` no overlay generates as `extra`; a module in
// overlays/ that index.ts does not list (or lists out of order) is an error.
//
// Node 24 imports the `.ts` modules by explicit path under type stripping (the pattern
// scripts/db-gate/catalogue.mjs uses for src/content/enums.ts); the seed modules stay erasable.
//
// Usage: node scripts/gen-seed-sql.mjs [--check] [--only kind,kind]
// Import `generate` / `compare` / `main` to drive it in-process (the test does).

import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { applyOverlays, checkOverlayIds } from '../src/content/seed/overlays/apply.ts'
import {
  OVERLAY_ID_RE,
  OVERLAY_TABLES,
  PATCH_COLUMNS,
  PATCH_SLUG_COLUMNS,
} from '../src/content/seed/overlays/types.ts'
import { OVERLAY_FILE_RE } from './db-gate/overlay-scan.mjs'

export const SCHEMA = 'hygieia'
export const BATCH_SIZE = 200
export const SEED_FILE_RE = /^\d{14}_hygieia_seed_[a-z0-9_]+\.sql$/

export const DEFAULT_SEED_DIR = fileURLToPath(new URL('../src/content/seed', import.meta.url))
export const DEFAULT_MIGRATIONS_DIR = fileURLToPath(
  new URL('../supabase/migrations', import.meta.url),
)

// --- the id formula ------------------------------------------------------------------------------

/**
 * The seed-id rule (PLAN §1.6): `md5('hygieia:<table>:<slug>')::uuid`. Postgres's `::uuid` cast of
 * a 32-hex md5 text is the same 16 bytes written 8-4-4-4-12, so formatting node's digest that way
 * gives the identical uuid.
 * @param {string} table
 * @param {string} slug
 * @returns {string}
 */
export function seedId(table, slug) {
  const h = createHash('md5').update(`${SCHEMA}:${table}:${slug}`).digest('hex')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

// --- SQL literal formatting ----------------------------------------------------------------------

/**
 * A text literal: `'` doubled, nothing else touched (standard_conforming_strings is on, so a
 * backslash is a plain character). Null stays `null`.
 * @param {string | null} s
 * @returns {string}
 */
export function sqlText(s) {
  if (s === null) return 'null'
  if (typeof s !== 'string') throw new TypeError(`expected a string, got ${typeof s}`)
  return `'${s.replace(/'/g, "''")}'`
}

/**
 * A numeric literal: integers as-is, decimals via toFixed(6) with trailing zeros stripped
 * (`13.5` → `13.5`, `0.1 + 0.2` → `0.3`). Non-finite numbers are a generator error.
 * @param {number} n
 * @returns {string}
 */
export function sqlNumber(n) {
  if (typeof n !== 'number' || !Number.isFinite(n))
    throw new TypeError(`expected a finite number, got ${String(n)}`)
  if (Number.isInteger(n)) return String(n)
  const fixed = n.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')
  return fixed === '-0' ? '0' : fixed
}

/**
 * An integer literal: a non-integer is a generator error (the column is `integer`).
 * @param {number} n
 * @returns {string}
 */
export function sqlInt(n) {
  if (!Number.isInteger(n)) throw new TypeError(`expected an integer, got ${String(n)}`)
  return String(n)
}

/**
 * A `text[]` literal: `array['a','b']::text[]`, or `'{}'::text[]` when empty (an untyped empty
 * `array[]` would not parse).
 * @param {readonly string[]} xs
 * @returns {string}
 */
export function sqlTextArray(xs) {
  if (!Array.isArray(xs)) throw new TypeError(`expected an array, got ${typeof xs}`)
  if (xs.length === 0) return `'{}'::text[]`
  return `array[${xs.map((x) => sqlText(x)).join(',')}]::text[]`
}

/**
 * A `date` literal from an ISO `YYYY-MM-DD` string.
 * @param {string} d
 * @returns {string}
 */
export function sqlDate(d) {
  if (typeof d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d))
    throw new TypeError(`expected an ISO date (YYYY-MM-DD), got ${String(d)}`)
  return `'${d}'::date`
}

/** @param {boolean} b @returns {string} */
export function sqlBool(b) {
  if (typeof b !== 'boolean') throw new TypeError(`expected a boolean, got ${typeof b}`)
  return b ? 'true' : 'false'
}

/** A `uuid` literal (already formatted by seedId). @param {string} id @returns {string} */
const sqlUuid = (id) => `'${id}'::uuid`

/**
 * A `jsonb` literal from an already-normalised JSON value (the caller fixes key order so the output
 * is deterministic). Postgres re-serialises jsonb, so whitespace here is irrelevant; quoting is `sqlText`'s.
 * @param {unknown} value @returns {string}
 */
export function sqlJsonb(value) {
  return `${sqlText(JSON.stringify(value))}::jsonb`
}

/** Code-unit order, locale-independent. @param {string} a @param {string} b */
const bySlug = (a, b) => (a < b ? -1 : a > b ? 1 : 0)

/**
 * One INSERT statement per batch of <= BATCH_SIZE rows, `on conflict (<pk>) do nothing`.
 * @param {string} table
 * @param {readonly string[]} columns
 * @param {readonly string[]} conflictColumns
 * @param {readonly (readonly string[])[]} rows  already-formatted literals, one array per row
 * @returns {string}
 */
export function insertStatements(table, columns, conflictColumns, rows) {
  let out = ''
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    out += `insert into ${SCHEMA}.${table} (${columns.join(', ')}) values\n`
    out += batch.map((r) => `  (${r.join(', ')})`).join(',\n')
    out += `\non conflict (${conflictColumns.join(', ')}) do nothing;\n\n`
  }
  return out
}

// --- the kinds -----------------------------------------------------------------------------------

/**
 * @typedef {object} KindSpec
 * @property {string} kind
 * @property {string} module   file name under the seed dir
 * @property {string} exportName  the module's (first) export array
 * @property {Record<string, string>} [exports]  multi-table kinds: data key → export name (all arrays);
 *                                               when present, `exportName` is the first of them
 * @property {string} file     migration file name
 * @property {string[]} tables tables the file inserts into, in insert order
 * @property {string[]} [needs] other kinds whose rows the children reference by slug
 */

/** @type {readonly KindSpec[]} */
export const KINDS = Object.freeze([
  {
    kind: 'ingredients',
    module: 'ingredients.ts',
    exportName: 'INGREDIENTS',
    file: '20261006000500_hygieia_seed_ingredients.sql',
    tables: ['ingredients'],
  },
  {
    kind: 'diets',
    module: 'diets.ts',
    exportName: 'DIETS',
    file: '20261006000600_hygieia_seed_diets.sql',
    tables: ['diets'],
  },
  {
    kind: 'recipes',
    module: 'recipes.ts',
    exportName: 'RECIPES',
    file: '20261006000700_hygieia_seed_recipes.sql',
    tables: ['recipes', 'recipe_ingredients', 'recipe_diets'],
    needs: ['ingredients', 'diets'],
  },
  {
    kind: 'exercises',
    module: 'exercises.ts',
    exportName: 'EXERCISES',
    file: '20261006000800_hygieia_seed_exercises.sql',
    tables: ['exercises'],
  },
  {
    kind: 'workouts',
    module: 'workouts.ts',
    exportName: 'WORKOUT_TEMPLATES',
    file: '20261006000900_hygieia_seed_workouts.sql',
    tables: ['workout_templates', 'workout_template_exercises'],
    needs: ['exercises'],
  },
  {
    kind: 'tips',
    module: 'tips.ts',
    exportName: 'HEALTH_TIPS',
    file: '20261006001000_hygieia_seed_tips.sql',
    tables: ['health_tips'],
  },
  {
    // P7.1: one module, three tables; routines reference product types by slug inside jsonb.
    kind: 'skincare',
    module: 'skincare.ts',
    exportName: 'SKINCARE_PRODUCT_TYPES',
    exports: {
      skincareProductTypes: 'SKINCARE_PRODUCT_TYPES',
      skincareRoutines: 'SKINCARE_ROUTINES',
      skincareTips: 'SKINCARE_TIPS',
    },
    file: '20261006001200_hygieia_seed_skincare.sql',
    tables: ['skincare_product_types', 'skincare_routines', 'skincare_tips'],
  },
])

/** @param {string} kind @returns {KindSpec} */
export function kindSpec(kind) {
  const spec = KINDS.find((k) => k.kind === kind)
  if (!spec)
    throw new Error(`unknown seed kind: ${kind} (known: ${KINDS.map((k) => k.kind).join(', ')})`)
  return spec
}

/**
 * Unique, well-formed slugs, sorted. Throws on a duplicate or malformed slug.
 * @template {{ slug: string }} T
 * @param {string} table @param {readonly T[]} rows @returns {T[]}
 */
function sortedBySlug(table, rows) {
  const seen = new Set()
  for (const r of rows) {
    if (typeof r.slug !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(r.slug))
      throw new Error(`${table}: malformed slug ${JSON.stringify(r.slug)}`)
    if (seen.has(r.slug)) throw new Error(`${table}: duplicate slug ${r.slug}`)
    seen.add(r.slug)
  }
  return [...rows].sort((a, b) => bySlug(a.slug, b.slug))
}

/**
 * Resolve a referenced slug to its seed id literal, or throw naming the referrer.
 * @param {string} table  the referenced table
 * @param {ReadonlySet<string>} known  the referenced table's slugs
 * @param {string} slug
 * @param {string} from  who refers (for the error)
 */
function fk(table, known, slug, from) {
  if (!known.has(slug)) throw new Error(`${from}: ${table} slug "${slug}" does not resolve`)
  return sqlUuid(seedId(table, slug))
}

/** @typedef {import('../src/content/types.ts').IngredientSeed} IngredientSeed */
/** @typedef {import('../src/content/types.ts').DietSeed} DietSeed */
/** @typedef {import('../src/content/types.ts').RecipeSeed} RecipeSeed */
/** @typedef {import('../src/content/types.ts').ExerciseSeed} ExerciseSeed */
/** @typedef {import('../src/content/types.ts').WorkoutTemplateSeed} WorkoutTemplateSeed */
/** @typedef {import('../src/content/types.ts').HealthTipSeed} HealthTipSeed */
/** @typedef {import('../src/content/types.ts').SkincareProductTypeSeed} SkincareProductTypeSeed */
/** @typedef {import('../src/content/types.ts').SkincareRoutineSeed} SkincareRoutineSeed */
/** @typedef {import('../src/content/types.ts').SkincareTipSeed} SkincareTipSeed */

/**
 * The export arrays a render needs: the kind's own plus its `needs`. Keys are kinds.
 * @typedef {object} SeedData
 * @property {readonly IngredientSeed[]} [ingredients]
 * @property {readonly DietSeed[]} [diets]
 * @property {readonly RecipeSeed[]} [recipes]
 * @property {readonly ExerciseSeed[]} [exercises]
 * @property {readonly WorkoutTemplateSeed[]} [workouts]
 * @property {readonly HealthTipSeed[]} [tips]
 * @property {readonly SkincareProductTypeSeed[]} [skincareProductTypes]
 * @property {readonly SkincareRoutineSeed[]} [skincareRoutines]
 * @property {readonly SkincareTipSeed[]} [skincareTips]
 * @property {readonly SkincareProductTypeSeed[]} [skincareProductTypeRefs]  overlays: every product
 *   type a routine step may reference (default: `skincareProductTypes`, the rows being rendered)
 */

/**
 * A routine's steps as the jsonb the generator writes: validated, `order` = index + 1, FIXED key
 * order (order, product_type_slug, note_el, note_en, optional) → deterministic bytes.
 * @param {string} slug  the routine's slug (for the error)
 * @param {readonly import('../src/content/types.ts').SkincareRoutineStepSeed[]} stepsIn
 * @param {ReadonlySet<string>} typeSlugs  the product-type slugs a step may reference
 */
export function routineSteps(slug, stepsIn, typeSlugs) {
  if (!Array.isArray(stepsIn) || stepsIn.length === 0)
    throw new Error(`skincare_routines/${slug}: steps must be a non-empty array`)
  return stepsIn.map((s, i) => {
    const where = `skincare_routines/${slug} step ${i + 1}`
    if (!typeSlugs.has(s.product_type_slug))
      throw new Error(
        `${where}: skincare_product_types slug "${s.product_type_slug}" does not resolve`,
      )
    if (s.order !== i + 1) throw new Error(`${where}: order ${s.order} != ${i + 1}`)
    if (typeof s.note_el !== 'string' || typeof s.note_en !== 'string')
      throw new Error(`${where}: note_el and note_en must be strings`)
    if (typeof s.optional !== 'boolean') throw new Error(`${where}: optional must be a boolean`)
    // Fixed key order → deterministic bytes.
    return {
      order: i + 1,
      product_type_slug: s.product_type_slug,
      note_el: s.note_el,
      note_en: s.note_en,
      optional: s.optional,
    }
  })
}

/**
 * @template T
 * @param {T | undefined} x @param {string} what @returns {T}
 */
const need = (x, what) => {
  if (x === undefined) throw new Error(`renderKind: ${what} rows were not loaded`)
  return x
}

/**
 * The SQL body (no header) and the per-table row counts for one kind.
 * @param {string} kind
 * @param {SeedData} data
 * @returns {{ sql: string, counts: Record<string, number> }}
 */
export function renderKind(kind, data) {
  const spec = kindSpec(kind)
  /** @type {Record<string, number>} */
  const counts = {}
  let sql = ''

  if (kind === 'ingredients') {
    const rows = sortedBySlug('ingredients', need(data.ingredients, 'ingredients'))
    sql += insertStatements(
      'ingredients',
      [
        'id',
        'slug',
        'name_el',
        'name_en',
        'category',
        'unit',
        'grams_per_unit',
        'kcal_100g',
        'protein_100g',
        'carbs_100g',
        'fat_100g',
        'source_note',
        'price_eur_min',
        'price_eur_max',
        'price_per',
        'price_as_of',
        'price_note',
        'substitute_slugs',
        'is_pantry_staple',
      ],
      ['id'],
      rows.map((r) => [
        sqlUuid(seedId('ingredients', r.slug)),
        sqlText(r.slug),
        sqlText(r.name_el),
        sqlText(r.name_en),
        sqlText(r.category),
        sqlText(r.unit),
        sqlNumber(r.grams_per_unit),
        sqlNumber(r.kcal_100g),
        sqlNumber(r.protein_100g),
        sqlNumber(r.carbs_100g),
        sqlNumber(r.fat_100g),
        sqlText(r.source_note),
        sqlNumber(r.price_eur_min),
        sqlNumber(r.price_eur_max),
        sqlText(r.price_per),
        sqlDate(r.price_as_of),
        sqlText(r.price_note),
        sqlTextArray(r.substitute_slugs),
        sqlBool(r.is_pantry_staple),
      ]),
    )
    counts.ingredients = rows.length
  } else if (kind === 'diets') {
    const rows = sortedBySlug('diets', need(data.diets, 'diets'))
    sql += insertStatements(
      'diets',
      [
        'id',
        'slug',
        'name_el',
        'name_en',
        'summary_el',
        'summary_en',
        'allowed_el',
        'allowed_en',
        'avoided_el',
        'avoided_en',
        'pros_el',
        'pros_en',
        'cons_el',
        'cons_en',
        'avoid_if_el',
        'avoid_if_en',
        'source_url',
      ],
      ['id'],
      rows.map((r) => [
        sqlUuid(seedId('diets', r.slug)),
        sqlText(r.slug),
        sqlText(r.name_el),
        sqlText(r.name_en),
        sqlText(r.summary_el),
        sqlText(r.summary_en),
        sqlTextArray(r.allowed_el),
        sqlTextArray(r.allowed_en),
        sqlTextArray(r.avoided_el),
        sqlTextArray(r.avoided_en),
        sqlTextArray(r.pros_el),
        sqlTextArray(r.pros_en),
        sqlTextArray(r.cons_el),
        sqlTextArray(r.cons_en),
        sqlTextArray(r.avoid_if_el),
        sqlTextArray(r.avoid_if_en),
        sqlText(r.source_url),
      ]),
    )
    counts.diets = rows.length
  } else if (kind === 'recipes') {
    const rows = sortedBySlug('recipes', need(data.recipes, 'recipes'))
    const ingredientSlugs = new Set(need(data.ingredients, 'ingredients').map((x) => x.slug))
    const dietSlugs = new Set(need(data.diets, 'diets').map((x) => x.slug))
    sql += insertStatements(
      'recipes',
      [
        'id',
        'slug',
        'title_el',
        'title_en',
        'steps_el',
        'steps_en',
        'portions',
        'prep_min',
        'meal_types',
        'image_path',
      ],
      ['id'],
      rows.map((r) => [
        sqlUuid(seedId('recipes', r.slug)),
        sqlText(r.slug),
        sqlText(r.title_el),
        sqlText(r.title_en),
        sqlTextArray(r.steps_el),
        sqlTextArray(r.steps_en),
        sqlInt(r.portions),
        sqlInt(r.prep_min),
        sqlTextArray(r.meal_types),
        sqlText(r.image_path),
      ]),
    )
    counts.recipes = rows.length

    /** @type {string[][]} */
    const lines = []
    /** @type {string[][]} */
    const tags = []
    for (const r of rows) {
      const rid = sqlUuid(seedId('recipes', r.slug))
      r.ingredients.forEach((l, position) => {
        const where = `recipes/${r.slug} line ${position}`
        const hasNote = l.note_el !== undefined || l.note_en !== undefined
        if (hasNote && (l.note_el === undefined || l.note_en === undefined))
          throw new Error(`${where}: note_el and note_en come as a pair`)
        lines.push([
          rid,
          fk('ingredients', ingredientSlugs, l.ingredient_slug, where),
          sqlInt(position),
          sqlNumber(l.quantity),
          sqlText(l.unit),
          sqlText(l.note_el ?? null),
          sqlText(l.note_en ?? null),
        ])
      })
      const dietTags = [...new Set(r.diet_slugs)].sort(bySlug)
      if (dietTags.length !== r.diet_slugs.length)
        throw new Error(`recipes/${r.slug}: duplicate diet_slugs`)
      for (const d of dietTags)
        tags.push([rid, fk('diets', dietSlugs, d, `recipes/${r.slug} diet tag`)])
    }
    sql += insertStatements(
      'recipe_ingredients',
      ['recipe_id', 'ingredient_id', 'position', 'quantity', 'unit', 'note_el', 'note_en'],
      ['recipe_id', 'position'],
      lines,
    )
    counts.recipe_ingredients = lines.length
    sql += insertStatements(
      'recipe_diets',
      ['recipe_id', 'diet_id'],
      ['recipe_id', 'diet_id'],
      tags,
    )
    counts.recipe_diets = tags.length
  } else if (kind === 'exercises') {
    const rows = sortedBySlug('exercises', need(data.exercises, 'exercises'))
    sql += insertStatements(
      'exercises',
      [
        'id',
        'slug',
        'name_el',
        'name_en',
        'cue_el',
        'cue_en',
        'workout_type',
        'level',
        'muscle_groups',
        'equipment_el',
        'equipment_en',
      ],
      ['id'],
      rows.map((r) => {
        if ((r.equipment_el === null) !== (r.equipment_en === null))
          throw new Error(`exercises/${r.slug}: equipment_el and equipment_en come as a pair`)
        return [
          sqlUuid(seedId('exercises', r.slug)),
          sqlText(r.slug),
          sqlText(r.name_el),
          sqlText(r.name_en),
          sqlText(r.cue_el),
          sqlText(r.cue_en),
          sqlText(r.workout_type),
          sqlText(r.level),
          sqlTextArray(r.muscle_groups),
          sqlText(r.equipment_el),
          sqlText(r.equipment_en),
        ]
      }),
    )
    counts.exercises = rows.length
  } else if (kind === 'workouts') {
    const rows = sortedBySlug('workout_templates', need(data.workouts, 'workouts'))
    const exerciseSlugs = new Set(need(data.exercises, 'exercises').map((x) => x.slug))
    sql += insertStatements(
      'workout_templates',
      [
        'id',
        'slug',
        'workout_type',
        'level',
        'intensity',
        'title_el',
        'title_en',
        'duration_min',
        'notes_el',
        'notes_en',
      ],
      ['id'],
      rows.map((r) => [
        sqlUuid(seedId('workout_templates', r.slug)),
        sqlText(r.slug),
        sqlText(r.workout_type),
        sqlText(r.level),
        sqlText(r.intensity),
        sqlText(r.title_el),
        sqlText(r.title_en),
        sqlInt(r.duration_min),
        sqlText(r.notes_el),
        sqlText(r.notes_en),
      ]),
    )
    counts.workout_templates = rows.length
    /** @type {string[][]} */
    const slots = []
    for (const r of rows) {
      const tid = sqlUuid(seedId('workout_templates', r.slug))
      r.blocks.forEach((b, position) => {
        const where = `workout_templates/${r.slug} slot ${position}`
        if (b.reps === null && b.seconds === null)
          throw new Error(`${where}: reps or seconds required`)
        slots.push([
          tid,
          fk('exercises', exerciseSlugs, b.exercise_slug, where),
          sqlInt(position),
          sqlText(b.block),
          sqlInt(b.sets),
          b.reps === null ? 'null' : sqlInt(b.reps),
          b.seconds === null ? 'null' : sqlInt(b.seconds),
          sqlInt(b.rest_seconds),
        ])
      })
    }
    sql += insertStatements(
      'workout_template_exercises',
      [
        'template_id',
        'exercise_id',
        'position',
        'block',
        'sets',
        'reps',
        'seconds',
        'rest_seconds',
      ],
      ['template_id', 'position'],
      slots,
    )
    counts.workout_template_exercises = slots.length
  } else if (kind === 'tips') {
    const rows = sortedBySlug('health_tips', need(data.tips, 'tips'))
    sql += insertStatements(
      'health_tips',
      [
        'id',
        'slug',
        'topic',
        'title_el',
        'title_en',
        'body_el',
        'body_en',
        'source_url',
        'needs_source',
      ],
      ['id'],
      rows.map((r) => [
        sqlUuid(seedId('health_tips', r.slug)),
        sqlText(r.slug),
        sqlText(r.topic),
        sqlText(r.title_el),
        sqlText(r.title_en),
        sqlText(r.body_el),
        sqlText(r.body_en),
        sqlText(r.source_url),
        sqlBool(r.needs_source),
      ]),
    )
    counts.health_tips = rows.length
  } else if (kind === 'skincare') {
    const types = sortedBySlug(
      'skincare_product_types',
      need(data.skincareProductTypes, 'skincareProductTypes'),
    )
    const typeSlugs = new Set(types.map((t) => t.slug))
    sql += insertStatements(
      'skincare_product_types',
      [
        'id',
        'slug',
        'name_el',
        'name_en',
        'description_el',
        'description_en',
        'category',
        'key_ingredients',
        'avoid_with',
        'regions',
        'audiences',
        'skin_types',
        'concerns',
        'time',
        'price_band_eur',
        'notes_el',
        'notes_en',
      ],
      ['id'],
      types.map((r) => [
        sqlUuid(seedId('skincare_product_types', r.slug)),
        sqlText(r.slug),
        sqlText(r.name_el),
        sqlText(r.name_en),
        sqlText(r.description_el),
        sqlText(r.description_en),
        sqlText(r.category),
        sqlTextArray(r.key_ingredients),
        sqlTextArray(r.avoid_with),
        sqlTextArray(r.regions),
        sqlTextArray(r.audiences),
        sqlTextArray(r.skin_types),
        sqlTextArray(r.concerns),
        sqlText(r.time),
        sqlText(r.price_band_eur),
        sqlText(r.notes_el),
        sqlText(r.notes_en),
      ]),
    )
    counts.skincare_product_types = types.length

    const routines = sortedBySlug(
      'skincare_routines',
      need(data.skincareRoutines, 'skincareRoutines'),
    )
    // An overlay renders only its ADDED routines, which may use product types from the base seed.
    const routineTypeSlugs = data.skincareProductTypeRefs
      ? new Set(data.skincareProductTypeRefs.map((t) => t.slug))
      : typeSlugs
    sql += insertStatements(
      'skincare_routines',
      [
        'id',
        'slug',
        'area',
        'name_el',
        'name_en',
        'audience',
        'skin_type',
        'region',
        'time',
        'intro_el',
        'intro_en',
        'steps',
        'duration_min',
      ],
      ['id'],
      routines.map((r) => {
        const steps = routineSteps(r.slug, r.steps, routineTypeSlugs)
        return [
          sqlUuid(seedId('skincare_routines', r.slug)),
          sqlText(r.slug),
          sqlText(r.area),
          sqlText(r.name_el),
          sqlText(r.name_en),
          sqlText(r.audience),
          sqlText(r.skin_type),
          sqlText(r.region),
          sqlText(r.time),
          sqlText(r.intro_el),
          sqlText(r.intro_en),
          sqlJsonb(steps),
          sqlInt(r.duration_min),
        ]
      }),
    )
    counts.skincare_routines = routines.length

    const tips = sortedBySlug('skincare_tips', need(data.skincareTips, 'skincareTips'))
    sql += insertStatements(
      'skincare_tips',
      [
        'id',
        'slug',
        'area',
        'title_el',
        'title_en',
        'body_el',
        'body_en',
        'audiences',
        'skin_types',
        'concerns',
        'regions',
        'sources',
        'needs_source',
      ],
      ['id'],
      tips.map((r) => {
        if (r.needs_source !== (r.sources.length === 0))
          throw new Error(`skincare_tips/${r.slug}: needs_source must equal (sources is empty)`)
        return [
          sqlUuid(seedId('skincare_tips', r.slug)),
          sqlText(r.slug),
          sqlText(r.area),
          sqlText(r.title_el),
          sqlText(r.title_en),
          sqlText(r.body_el),
          sqlText(r.body_en),
          sqlTextArray(r.audiences),
          sqlTextArray(r.skin_types),
          sqlTextArray(r.concerns),
          sqlTextArray(r.regions),
          sqlTextArray(r.sources),
          sqlBool(r.needs_source),
        ]
      }),
    )
    counts.skincare_tips = tips.length
  } else {
    throw new Error(`renderKind: no renderer for kind ${kind}`)
  }

  for (const t of spec.tables)
    if (!(t in counts)) throw new Error(`renderKind(${kind}): no count for ${t}`)
  return { sql, counts }
}

/**
 * The file header: generator, source, counts. No timestamp — the output must be reproducible.
 * @param {KindSpec} spec @param {Record<string, number>} counts @returns {string}
 */
export function header(spec, counts) {
  const rows = spec.tables.map((t) => `${t} ${counts[t]}`).join(', ')
  const exported = spec.exports ? Object.values(spec.exports).join(', ') : spec.exportName
  return (
    `-- GENERATED by scripts/gen-seed-sql.mjs (npm run seed:gen) — do not edit by hand; edit the\n` +
    `-- source module and regenerate. \`npm run seed:check\` fails on any drift (PLAN.md P1.12, §1.6).\n` +
    `-- Source: src/content/seed/${spec.module} (${exported}). Rows: ${rows}.\n` +
    `-- Ids are md5('hygieia:<table>:<slug>')::uuid; status is omitted (default pending);\n` +
    `-- every statement is \`on conflict do nothing\`, so re-applying is a no-op.\n\n`
  )
}

// --- loading the modules -------------------------------------------------------------------------

/**
 * Import one seed module by path (node type stripping) and return its export arrays keyed the way
 * `SeedData` expects: `{ [kind]: rows }` for a single-export kind, or one key per `exports` entry.
 * @param {string} seedDir @param {KindSpec} spec @returns {Promise<Record<string, readonly unknown[]>>}
 */
async function loadKind(seedDir, spec) {
  const file = path.join(seedDir, spec.module)
  /** @type {Record<string, unknown>} */
  const mod = await import(pathToFileURL(file).href)
  const wanted = spec.exports ?? { [spec.kind]: spec.exportName }
  /** @type {Record<string, readonly unknown[]>} */
  const out = {}
  for (const [key, exportName] of Object.entries(wanted)) {
    const arr = mod[exportName]
    if (!Array.isArray(arr))
      throw new Error(`${spec.module} does not export an array named ${exportName}`)
    out[key] = arr
  }
  return out
}

/**
 * @typedef {object} Generated
 * @property {Map<string, string>} files  migration file name → full SQL (header + body), LF only
 * @property {Record<string, Record<string, number>>} counts  kind → table → rows
 * @property {string[]} skipped  kinds whose module is absent
 */

/**
 * Generate every (requested) kind to memory. A kind whose module is absent is skipped, not an
 * error; a kind whose `needs` module is absent IS an error (its FKs cannot be resolved).
 * @param {{ seedDir?: string, kinds?: readonly string[] }} [opts]
 * @returns {Promise<Generated>}
 */
export async function generate(opts = {}) {
  const seedDir = opts.seedDir ?? DEFAULT_SEED_DIR
  const wanted = opts.kinds ? opts.kinds.map(kindSpec) : KINDS
  /** @type {Map<string, Record<string, readonly unknown[]>>} */
  const loaded = new Map()
  const load = async (/** @type {string} */ kind) => {
    if (!loaded.has(kind)) loaded.set(kind, await loadKind(seedDir, kindSpec(kind)))
    return /** @type {Record<string, readonly unknown[]>} */ (loaded.get(kind))
  }

  /** @type {Generated} */
  const out = { files: new Map(), counts: {}, skipped: [] }
  for (const spec of wanted) {
    if (!existsSync(path.join(seedDir, spec.module))) {
      out.skipped.push(spec.kind)
      continue
    }
    /** @type {Record<string, readonly unknown[]>} */
    const data = { ...(await load(spec.kind)) }
    for (const dep of spec.needs ?? []) {
      if (!existsSync(path.join(seedDir, kindSpec(dep).module)))
        throw new Error(`${spec.kind} needs ${kindSpec(dep).module}, which is absent`)
      Object.assign(data, await load(dep))
    }
    // reason: the modules are typed at their source; here they arrive as unknown[] from a dynamic import.
    const { sql, counts } = renderKind(spec.kind, /** @type {SeedData} */ (data))
    out.files.set(spec.file, header(spec, counts) + sql)
    out.counts[spec.kind] = counts
  }
  return out
}

// --- content overlays ----------------------------------------------------------------------------

export { OVERLAY_FILE_RE }
/** An overlay module's file name: `NNNN-<slug>.ts` (index.ts, types.ts, apply.ts, tests excluded). */
export const OVERLAY_MODULE_RE = /^\d{4}-[a-z0-9]+(?:-[a-z0-9]+)*\.ts$/

/**
 * The migration an overlay generates: `20261007<NNNN>00_hygieia_overlay_<name>.sql`, hyphens of the
 * name as underscores (the guard's filename rule is `[a-z0-9_]+`).
 * @param {string} id  `NNNN-<name>`
 */
export function overlayFile(id) {
  const m = OVERLAY_ID_RE.exec(id)
  if (!m) throw new Error(`overlay ${JSON.stringify(id)}: id must match NNNN-<slug>`)
  return `20261007${m[1]}00_${SCHEMA}_overlay_${m[2].replace(/-/g, '_')}.sql`
}

/** @param {number | null} n */
const sqlIntOrNull = (n) => (n === null ? 'null' : sqlInt(n))

/**
 * The literal for each patchable column, per table — the SAME formatter the base renderer uses for
 * that column. Every PATCH_COLUMNS entry has one (the test asserts the two lists are equal).
 * Child `*_slug` columns are resolved to the referenced id by `renderPatch`, not here.
 * @type {Readonly<Record<string, Readonly<Record<string, (v: any) => string>>>>}
 */
// reason: JSDoc `any` — each formatter validates its own input type and throws on a mismatch.
export const PATCH_FORMAT = Object.freeze({
  ingredients: {
    name_el: sqlText,
    name_en: sqlText,
    category: sqlText,
    unit: sqlText,
    grams_per_unit: sqlNumber,
    kcal_100g: sqlNumber,
    protein_100g: sqlNumber,
    carbs_100g: sqlNumber,
    fat_100g: sqlNumber,
    source_note: sqlText,
    price_eur_min: sqlNumber,
    price_eur_max: sqlNumber,
    price_per: sqlText,
    price_as_of: sqlDate,
    price_note: sqlText,
    substitute_slugs: sqlTextArray,
    is_pantry_staple: sqlBool,
  },
  diets: {
    name_el: sqlText,
    name_en: sqlText,
    summary_el: sqlText,
    summary_en: sqlText,
    allowed_el: sqlTextArray,
    allowed_en: sqlTextArray,
    avoided_el: sqlTextArray,
    avoided_en: sqlTextArray,
    pros_el: sqlTextArray,
    pros_en: sqlTextArray,
    cons_el: sqlTextArray,
    cons_en: sqlTextArray,
    avoid_if_el: sqlTextArray,
    avoid_if_en: sqlTextArray,
    source_url: sqlText,
  },
  recipes: {
    title_el: sqlText,
    title_en: sqlText,
    steps_el: sqlTextArray,
    steps_en: sqlTextArray,
    portions: sqlInt,
    prep_min: sqlInt,
    meal_types: sqlTextArray,
    image_path: sqlText,
  },
  recipe_ingredients: {
    ingredient_slug: sqlText,
    quantity: sqlNumber,
    unit: sqlText,
    note_el: sqlText,
    note_en: sqlText,
  },
  recipe_diets: {},
  exercises: {
    name_el: sqlText,
    name_en: sqlText,
    cue_el: sqlText,
    cue_en: sqlText,
    workout_type: sqlText,
    level: sqlText,
    muscle_groups: sqlTextArray,
    equipment_el: sqlText,
    equipment_en: sqlText,
  },
  workout_templates: {
    workout_type: sqlText,
    level: sqlText,
    intensity: sqlText,
    title_el: sqlText,
    title_en: sqlText,
    duration_min: sqlInt,
    notes_el: sqlText,
    notes_en: sqlText,
  },
  workout_template_exercises: {
    exercise_slug: sqlText,
    block: sqlText,
    sets: sqlInt,
    reps: sqlIntOrNull,
    seconds: sqlIntOrNull,
    rest_seconds: sqlInt,
  },
  health_tips: {
    topic: sqlText,
    title_el: sqlText,
    title_en: sqlText,
    body_el: sqlText,
    body_en: sqlText,
    source_url: sqlText,
    needs_source: sqlBool,
  },
  skincare_product_types: {
    name_el: sqlText,
    name_en: sqlText,
    description_el: sqlText,
    description_en: sqlText,
    category: sqlText,
    key_ingredients: sqlTextArray,
    avoid_with: sqlTextArray,
    regions: sqlTextArray,
    audiences: sqlTextArray,
    skin_types: sqlTextArray,
    concerns: sqlTextArray,
    time: sqlText,
    price_band_eur: sqlText,
    notes_el: sqlText,
    notes_en: sqlText,
  },
  skincare_routines: {
    area: sqlText,
    name_el: sqlText,
    name_en: sqlText,
    audience: sqlText,
    skin_type: sqlText,
    region: sqlText,
    time: sqlText,
    intro_el: sqlText,
    intro_en: sqlText,
    steps: sqlJsonb, // normalised by routineSteps first (renderPatch)
    duration_min: sqlInt,
  },
  skincare_tips: {
    area: sqlText,
    title_el: sqlText,
    title_en: sqlText,
    body_el: sqlText,
    body_en: sqlText,
    audiences: sqlTextArray,
    skin_types: sqlTextArray,
    concerns: sqlTextArray,
    regions: sqlTextArray,
    sources: sqlTextArray,
    needs_source: sqlBool,
  },
})

/** The base table a child table's rows hang off, its FK column and the parent-slug field. */
const CHILD_SPEC = Object.freeze({
  recipe_ingredients: { parent: 'recipes', fkColumn: 'recipe_id', slugKey: 'recipe_slug' },
  recipe_diets: { parent: 'recipes', fkColumn: 'recipe_id', slugKey: 'recipe_slug' },
  workout_template_exercises: {
    parent: 'workout_templates',
    fkColumn: 'template_id',
    slugKey: 'template_slug',
  },
})
/** Where a child `*_slug` patch column points. */
const SLUG_TARGET = Object.freeze({ ingredient_slug: 'ingredients', exercise_slug: 'exercises' })

/**
 * @typedef {Record<string, readonly any[]>} SeedState  table → rows (seed shape)
 */

/** @param {SeedState} state @param {string} table @returns {Set<string>} */
const slugsOf = (state, table) => new Set((state[table] ?? []).map((r) => r.slug))

/**
 * One UPDATE for one patch, editable columns only, keyed by slug or (parent id, position).
 * @param {string} table @param {Record<string, any>} patch @param {SeedState} state  the state AFTER
 *   this overlay (references resolve against it)
 */
export function renderPatch(table, patch, state) {
  const allowed = /** @type {readonly string[]} */ (
    /** @type {Record<string, readonly string[]>} */ (PATCH_COLUMNS)[table] ?? []
  )
  const slugColumns = /** @type {Record<string, string>} */ (
    /** @type {Record<string, Record<string, string>>} */ (PATCH_SLUG_COLUMNS)[table] ?? {}
  )
  const format = PATCH_FORMAT[table]
  const child =
    /** @type {Record<string, { parent: string, fkColumn: string, slugKey: string }>} */ (
      CHILD_SPEC
    )[table]
  const where = child
    ? `${table} ${patch[child.slugKey]}#${patch.position}`
    : `${table}/${patch.slug}`
  const sets = []
  for (const col of allowed) {
    if (!(col in patch.set)) continue
    const value = patch.set[col]
    if (slugColumns[col]) {
      const target = /** @type {Record<string, string>} */ (SLUG_TARGET)[col]
      sets.push(`${slugColumns[col]} = ${fk(target, slugsOf(state, target), value, where)}`)
    } else if (table === 'skincare_routines' && col === 'steps') {
      const steps = routineSteps(patch.slug, value, slugsOf(state, 'skincare_product_types'))
      sets.push(`${col} = ${format[col](steps)}`)
    } else {
      sets.push(`${col} = ${format[col](value)}`)
    }
  }
  for (const col of Object.keys(patch.set))
    if (!allowed.includes(col)) throw new Error(`${where}: "${col}" is not an editable column`)
  if (sets.length === 0) throw new Error(`${where}: empty patch`)
  const key = child
    ? `${child.fkColumn} = ${sqlUuid(seedId(child.parent, patch[child.slugKey]))} and "position" = ${sqlInt(patch.position)}`
    : `slug = ${sqlText(patch.slug)}`
  return `update ${SCHEMA}.${table} set\n  ${sets.join(',\n  ')}\nwhere ${key};\n\n`
}

/**
 * The SQL body for one overlay's ADDITIONS, through the base renderer wherever a row has the base
 * shape; child additions to an existing parent are appended at position = line/slot count.
 * @param {Record<string, readonly any[]>} adds  table → added rows
 * @param {SeedState} next  the state after this overlay
 * @returns {{ sql: string, counts: Record<string, number> }}
 */
function renderAdditions(adds, next) {
  let sql = ''
  /** @type {Record<string, number>} */
  const counts = {}
  const has = (/** @type {string} */ t) => (adds[t]?.length ?? 0) > 0
  const take = (/** @type {Record<string, number>} */ c) => {
    for (const [t, n] of Object.entries(c)) if (n > 0) counts[t] = (counts[t] ?? 0) + n
  }
  const renderBase = (/** @type {string} */ kind, /** @type {SeedData} */ data) => {
    const r = renderKind(kind, data)
    sql += r.sql
    take(r.counts)
  }
  if (has('ingredients')) renderBase('ingredients', { ingredients: adds.ingredients })
  if (has('diets')) renderBase('diets', { diets: adds.diets })
  if (has('recipes'))
    renderBase('recipes', {
      recipes: adds.recipes,
      ingredients: next.ingredients,
      diets: next.diets,
    })
  // Appended children: the last k lines of the parent in `next` are this overlay's k additions.
  /**
   * @param {string} table @param {string} childKey  the nested array key
   * @param {(a: any, position: number, pid: string, where: string) => string[]} row
   */
  const appended = (table, childKey, row) => {
    const { parent, slugKey } = /** @type {any} */ (CHILD_SPEC)[table]
    /** @type {Map<string, number>} */
    const seen = new Map()
    const total = new Map()
    for (const a of adds[table]) total.set(a[slugKey], (total.get(a[slugKey]) ?? 0) + 1)
    return adds[table].map((a) => {
      const p = next[parent].find((r) => r.slug === a[slugKey])
      if (!p) throw new Error(`${table}: ${parent} slug "${a[slugKey]}" does not resolve`)
      const k = seen.get(a[slugKey]) ?? 0
      seen.set(a[slugKey], k + 1)
      const position = p[childKey].length - total.get(a[slugKey]) + k
      const where = `${table} ${a[slugKey]}#${position}`
      return row(a, position, sqlUuid(seedId(parent, a[slugKey])), where)
    })
  }
  if (has('recipe_ingredients')) {
    const known = slugsOf(next, 'ingredients')
    const rows = appended('recipe_ingredients', 'ingredients', (l, position, rid, where) => {
      if ((l.note_el === undefined) !== (l.note_en === undefined))
        throw new Error(`${where}: note_el and note_en come as a pair`)
      return [
        rid,
        fk('ingredients', known, l.ingredient_slug, where),
        sqlInt(position),
        sqlNumber(l.quantity),
        sqlText(l.unit),
        sqlText(l.note_el ?? null),
        sqlText(l.note_en ?? null),
      ]
    })
    sql += insertStatements(
      'recipe_ingredients',
      ['recipe_id', 'ingredient_id', 'position', 'quantity', 'unit', 'note_el', 'note_en'],
      ['recipe_id', 'position'],
      rows,
    )
    take({ recipe_ingredients: rows.length })
  }
  if (has('recipe_diets')) {
    const known = slugsOf(next, 'diets')
    const recipes = slugsOf(next, 'recipes')
    const rows = adds.recipe_diets.map((t) => {
      const where = `recipe_diets ${t.recipe_slug}`
      return [fk('recipes', recipes, t.recipe_slug, where), fk('diets', known, t.diet_slug, where)]
    })
    sql += insertStatements(
      'recipe_diets',
      ['recipe_id', 'diet_id'],
      ['recipe_id', 'diet_id'],
      rows,
    )
    take({ recipe_diets: rows.length })
  }
  if (has('exercises')) renderBase('exercises', { exercises: adds.exercises })
  if (has('workout_templates'))
    renderBase('workouts', { workouts: adds.workout_templates, exercises: next.exercises })
  if (has('workout_template_exercises')) {
    const known = slugsOf(next, 'exercises')
    const rows = appended('workout_template_exercises', 'blocks', (b, position, tid, where) => {
      if (b.reps === null && b.seconds === null)
        throw new Error(`${where}: reps or seconds required`)
      return [
        tid,
        fk('exercises', known, b.exercise_slug, where),
        sqlInt(position),
        sqlText(b.block),
        sqlInt(b.sets),
        sqlIntOrNull(b.reps),
        sqlIntOrNull(b.seconds),
        sqlInt(b.rest_seconds),
      ]
    })
    sql += insertStatements(
      'workout_template_exercises',
      [
        'template_id',
        'exercise_id',
        'position',
        'block',
        'sets',
        'reps',
        'seconds',
        'rest_seconds',
      ],
      ['template_id', 'position'],
      rows,
    )
    take({ workout_template_exercises: rows.length })
  }
  if (has('health_tips')) renderBase('tips', { tips: adds.health_tips })
  if (has('skincare_product_types') || has('skincare_routines') || has('skincare_tips'))
    renderBase('skincare', {
      skincareProductTypes: adds.skincare_product_types ?? [],
      skincareRoutines: adds.skincare_routines ?? [],
      skincareTips: adds.skincare_tips ?? [],
      skincareProductTypeRefs: next.skincare_product_types,
    })
  return { sql, counts }
}

/**
 * One overlay's migration: header, patches (every table, FK order), then additions.
 * @param {import('../src/content/seed/overlays/types.ts').Overlay} overlay
 * @param {SeedState} next  the state after this overlay
 * @returns {{ sql: string, patched: Record<string, number>, added: Record<string, number> }}
 */
export function renderOverlay(overlay, next) {
  let body = ''
  /** @type {Record<string, number>} */
  const patched = {}
  const patches = /** @type {Record<string, readonly any[]>} */ (overlay.patches ?? {})
  for (const table of OVERLAY_TABLES) {
    for (const p of patches[table] ?? []) body += renderPatch(table, p, next)
    if (patches[table]?.length) patched[table] = patches[table].length
  }
  const { sql, counts: added } = renderAdditions(
    /** @type {Record<string, readonly any[]>} */ (overlay.additions ?? {}),
    next,
  )
  body += sql
  if (body === '') throw new Error(`overlay ${overlay.id}: no patches and no additions`)
  const list = (/** @type {Record<string, number>} */ c) =>
    Object.keys(c).length
      ? Object.entries(c)
          .map(([t, n]) => `${t} ${n}`)
          .join(', ')
      : 'none'
  const head =
    `-- GENERATED by scripts/gen-seed-sql.mjs (npm run seed:gen) — do not edit by hand; edit the\n` +
    `-- overlay module and regenerate. \`npm run seed:check\` fails on any drift.\n` +
    `-- Overlay: src/content/seed/overlays/${overlay.id}.ts — ${overlay.summary}\n` +
    `-- Patches: ${list(patched)}. Additions: ${list(added)}.\n` +
    `-- Patches set editable content columns only (never id, slug, status or the review stamp), so an\n` +
    `-- approved row stays approved. Additions omit status (default pending): the lead approves them\n` +
    `-- live. Updates are idempotent and inserts are \`on conflict do nothing\`: re-applying is a no-op.\n\n`
  return { sql: head + body, patched, added }
}

/**
 * The base seed as overlays see it: every kind loaded, keyed by DB table name.
 * @param {string} seedDir @returns {Promise<SeedState>}
 */
async function loadBase(seedDir) {
  /** @type {Record<string, readonly unknown[]>} */
  const all = {}
  for (const spec of KINDS) Object.assign(all, await loadKind(seedDir, spec))
  return /** @type {SeedState} */ ({
    ingredients: all.ingredients,
    diets: all.diets,
    recipes: all.recipes,
    exercises: all.exercises,
    workout_templates: all.workouts,
    health_tips: all.tips,
    skincare_product_types: all.skincareProductTypes,
    skincare_routines: all.skincareRoutines,
    skincare_tips: all.skincareTips,
  })
}

/**
 * @typedef {object} GeneratedOverlays
 * @property {Map<string, string>} files  migration file name → SQL
 * @property {{ id: string, file: string, patched: Record<string, number>, added: Record<string, number> }[]} overlays
 */

/**
 * Generate every overlay's migration, in order, each validated by applying it (overlays/apply.ts)
 * to the seed as the previous overlays left it. No `overlays/index.ts` under `seedDir` → none.
 * @param {{ seedDir?: string }} [opts]
 * @returns {Promise<GeneratedOverlays>}
 */
export async function generateOverlays(opts = {}) {
  const seedDir = opts.seedDir ?? DEFAULT_SEED_DIR
  const dir = path.join(seedDir, 'overlays')
  /** @type {GeneratedOverlays} */
  const out = { files: new Map(), overlays: [] }
  if (!existsSync(path.join(dir, 'index.ts'))) return out
  /** @type {{ OVERLAYS?: unknown }} */
  const mod = await import(pathToFileURL(path.join(dir, 'index.ts')).href)
  if (!Array.isArray(mod.OVERLAYS))
    throw new Error('overlays/index.ts must export OVERLAYS (array)')
  /** @type {import('../src/content/seed/overlays/types.ts').Overlay[]} */
  const overlays = mod.OVERLAYS
  checkOverlayIds(overlays)
  const listed = overlays.map((o) => `${o.id}.ts`)
  const onDisk = readdirSync(dir)
    .filter((f) => OVERLAY_MODULE_RE.test(f))
    .sort()
  if (JSON.stringify(listed) !== JSON.stringify(onDisk))
    throw new Error(
      `overlays/index.ts lists [${listed.join(', ')}] but the directory holds [${onDisk.join(', ')}] — list every NNNN-<name>.ts once, in order`,
    )
  let state = await loadBase(seedDir)
  for (const overlay of overlays) {
    const next = applyOverlays(state, [overlay])
    const file = overlayFile(overlay.id)
    const { sql, patched, added } = renderOverlay(overlay, next)
    out.files.set(file, sql)
    out.overlays.push({ id: overlay.id, file, patched, added })
    state = next
  }
  return out
}

/**
 * Compare generated overlay files with the directory: differing, missing, and (any
 * `*_hygieia_overlay_*.sql` no overlay generates) extra.
 * @param {GeneratedOverlays} gen @param {string} migrationsDir
 * @returns {{ ok: boolean, problems: string[], identical: string[] }}
 */
export function compareOverlays(gen, migrationsDir) {
  /** @type {string[]} */
  const problems = []
  /** @type {string[]} */
  const identical = []
  for (const [file, sql] of gen.files) {
    const onDisk = path.join(migrationsDir, file)
    if (!existsSync(onDisk)) problems.push(`missing  ${file} (run npm run seed:gen)`)
    else if (normalizeLf(readFileSync(onDisk, 'utf8')) !== normalizeLf(sql))
      problems.push(`differs  ${file} (run npm run seed:gen)`)
    else identical.push(file)
  }
  if (existsSync(migrationsDir))
    for (const f of readdirSync(migrationsDir).sort())
      if (OVERLAY_FILE_RE.test(f) && !gen.files.has(f))
        problems.push(`extra    ${f} (no overlay module generates it)`)
  return { ok: problems.length === 0, problems, identical }
}

// --- writing and checking ------------------------------------------------------------------------

/** @param {string} s @returns {string} */
export const normalizeLf = (s) => s.replace(/\r\n/g, '\n')

/**
 * Compare generated output with the files on disk. Only the requested kinds' files are judged
 * (so `--only tips` does not flag the other seed files as extra); with every kind requested, any
 * `*_hygieia_seed_*.sql` in the directory that no kind generates is `extra`. A skipped kind's
 * file is fine when absent and `stale` when present (its module is gone; it cannot be regenerated).
 * @param {Generated} gen
 * @param {string} migrationsDir
 * @param {readonly string[]} [kinds]  the kinds that were requested (default: all)
 * @returns {{ ok: boolean, problems: string[], identical: string[] }}
 */
export function compare(gen, migrationsDir, kinds) {
  const requested = kinds ? kinds.map(kindSpec) : KINDS
  /** @type {string[]} */
  const problems = []
  /** @type {string[]} */
  const identical = []
  for (const spec of requested) {
    const onDisk = path.join(migrationsDir, spec.file)
    const generated = gen.files.get(spec.file)
    if (generated === undefined) {
      if (existsSync(onDisk))
        problems.push(`stale    ${spec.file} (module ${spec.module} is absent)`)
      continue
    }
    if (!existsSync(onDisk)) {
      problems.push(`missing  ${spec.file} (run npm run seed:gen)`)
      continue
    }
    if (normalizeLf(readFileSync(onDisk, 'utf8')) !== normalizeLf(generated))
      problems.push(`differs  ${spec.file} (run npm run seed:gen)`)
    else identical.push(spec.file)
  }
  if (!kinds && existsSync(migrationsDir)) {
    const known = new Set(KINDS.map((k) => k.file))
    for (const f of readdirSync(migrationsDir).sort())
      if (SEED_FILE_RE.test(f) && !known.has(f)) problems.push(`extra    ${f} (no generator kind)`)
  }
  return { ok: problems.length === 0, problems, identical }
}

/**
 * Write every generated file (LF) into the migrations directory. Returns the names written.
 * @param {Generated} gen @param {string} migrationsDir @returns {string[]}
 */
export function writeAll(gen, migrationsDir) {
  /** @type {string[]} */
  const written = []
  for (const [file, sql] of gen.files) {
    writeFileSync(path.join(migrationsDir, file), sql, 'utf8')
    written.push(file)
  }
  return written
}

/** @param {string[]} argv */
function parseArgs(argv) {
  const check = argv.includes('--check')
  const i = argv.indexOf('--only')
  const kinds = i >= 0 && argv[i + 1] ? argv[i + 1].split(',').filter(Boolean) : undefined
  return { check, kinds }
}

/**
 * The CLI, in-process. Returns the exit code; prints through `io.log`.
 * @param {string[]} argv  e.g. ['--check'] or ['--only', 'tips']
 * @param {{ seedDir?: string, migrationsDir?: string, log?: (line: string) => void }} [io]
 * @returns {Promise<number>}
 */
export async function main(argv, io = {}) {
  const log = io.log ?? ((/** @type {string} */ s) => console.log(s))
  const migrationsDir = io.migrationsDir ?? DEFAULT_MIGRATIONS_DIR
  const { check, kinds } = parseArgs(argv)
  const mode = check ? 'seed:check' : 'seed:gen'

  /** @type {Generated} */
  let gen
  // Overlays need every base table, so `--only` (a subset of kinds) leaves them out.
  /** @type {GeneratedOverlays} */
  let over = { files: new Map(), overlays: [] }
  try {
    gen = await generate({ seedDir: io.seedDir, kinds })
    if (!kinds) over = await generateOverlays({ seedDir: io.seedDir })
  } catch (e) {
    log(`${mode}: FAIL — ${e instanceof Error ? e.message : String(e)}`)
    return 1
  }
  for (const kind of gen.skipped) log(`${mode}: skipped: ${kindSpec(kind).module} not present yet`)
  for (const [kind, counts] of Object.entries(gen.counts)) {
    const rows = Object.entries(counts)
      .map(([t, n]) => `${t} ${n}`)
      .join(', ')
    log(`${mode}: ${kindSpec(kind).file} — ${rows}`)
  }
  const tally = (/** @type {Record<string, number>} */ c) =>
    Object.entries(c)
      .map(([t, n]) => `${t} ${n}`)
      .join(', ') || 'none'
  for (const o of over.overlays)
    log(
      `${mode}: ${o.file} — overlay ${o.id}: patches ${tally(o.patched)}; additions ${tally(o.added)}`,
    )

  if (!check) {
    const written = [...writeAll(gen, migrationsDir), ...writeAll(over, migrationsDir)]
    log(`${mode}: wrote ${written.length} file(s) to ${migrationsDir}`)
    return 0
  }

  const base = compare(gen, migrationsDir, kinds)
  const overlay = kinds
    ? { ok: true, problems: [], identical: [] }
    : compareOverlays(over, migrationsDir)
  const problems = [...base.problems, ...overlay.problems]
  for (const p of problems) log(`${mode}: ${p}`)
  if (problems.length > 0) {
    log(`${mode}: FAIL — ${problems.length} file(s) out of step with src/content/seed`)
    return 1
  }
  const n = base.identical.length + overlay.identical.length
  log(
    `${mode}: OK — ${n} seed migration(s) identical to the generator's output (${base.identical.length} base + ${overlay.identical.length} overlay)`,
  )
  return 0
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exitCode = await main(process.argv.slice(2))
}
