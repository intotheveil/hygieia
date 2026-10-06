// @vitest-environment node
//
// P1.6 — THE SCHEMA CONTRACT: for every table in PLAN.md §2 the exact ORDERED column list (name and
// type) the committed archive produces, and the CHECK enum literals equal to the `as const` arrays in
// src/content/enums.ts (length AND order), so the DB and the TypeScript enums cannot drift.
//
// Runs the REAL committed archive (supabase/migrations, applied twice like `npm run db:gate`) against
// real Postgres (PGlite) dressed as Alyssos's shared project by ./db-gate/shim.mjs. No SQL from the
// migrations is restated here: every assertion is about the database the archive produces. One PGlite
// per file. DB_GATE_MIGRATIONS points this suite (like the gate) at a mutated COPY of the archive.

import { PGlite } from '@electric-sql/pglite'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { installShim } from './db-gate/shim.mjs'
import { CATALOGUE, ENUM_COLUMNS, applyArchive, checkValues } from './db-gate/catalogue.mjs'
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
} from '../src/content/enums.ts'

const MIG =
  process.env.DB_GATE_MIGRATIONS ??
  fileURLToPath(new URL('../supabase/migrations', import.meta.url))

const TS = 'timestamp with time zone'
const REVIEW = [
  `status:text`,
  `reviewed_at:${TS}`,
  `reviewed_by:uuid`,
  `created_at:${TS}`,
  `updated_at:${TS}`,
]
const STAMPS = [`created_at:${TS}`, `updated_at:${TS}`]

/** PLAN.md §2, column by column, in order. `name:type` as format_type renders it. */
const EXPECTED: Record<string, string[]> = {
  schema_migrations: ['version:text', 'name:text', 'checksum:text', `applied_at:${TS}`],
  profiles: ['user_id:uuid', 'display_name:text', 'is_admin:boolean', ...STAMPS],
  ingredients: [
    'id:uuid',
    'slug:text',
    'name_el:text',
    'name_en:text',
    'category:text',
    'unit:text',
    'grams_per_unit:numeric',
    'kcal_100g:numeric',
    'protein_100g:numeric',
    'carbs_100g:numeric',
    'fat_100g:numeric',
    'source_note:text',
    'price_eur_min:numeric',
    'price_eur_max:numeric',
    'price_per:text',
    'price_as_of:date',
    'price_note:text',
    'substitute_slugs:text[]',
    'is_pantry_staple:boolean',
    ...REVIEW,
  ],
  diets: [
    'id:uuid',
    'slug:text',
    'name_el:text',
    'name_en:text',
    'summary_el:text',
    'summary_en:text',
    'allowed_el:text[]',
    'allowed_en:text[]',
    'avoided_el:text[]',
    'avoided_en:text[]',
    'pros_el:text[]',
    'pros_en:text[]',
    'cons_el:text[]',
    'cons_en:text[]',
    'avoid_if_el:text[]',
    'avoid_if_en:text[]',
    'source_url:text',
    ...REVIEW,
  ],
  recipes: [
    'id:uuid',
    'slug:text',
    'title_el:text',
    'title_en:text',
    'steps_el:text[]',
    'steps_en:text[]',
    'portions:integer',
    'prep_min:integer',
    'meal_types:text[]',
    'image_path:text',
    ...REVIEW,
  ],
  recipe_ingredients: [
    'recipe_id:uuid',
    'ingredient_id:uuid',
    'position:integer',
    'quantity:numeric',
    'unit:text',
    'note_el:text',
    'note_en:text',
    ...STAMPS,
  ],
  recipe_diets: ['recipe_id:uuid', 'diet_id:uuid', ...STAMPS],
  exercises: [
    'id:uuid',
    'slug:text',
    'name_el:text',
    'name_en:text',
    'cue_el:text',
    'cue_en:text',
    'workout_type:text',
    'level:text',
    'muscle_groups:text[]',
    'equipment_el:text',
    'equipment_en:text',
    ...REVIEW,
  ],
  workout_templates: [
    'id:uuid',
    'slug:text',
    'workout_type:text',
    'level:text',
    'intensity:text',
    'title_el:text',
    'title_en:text',
    'duration_min:integer',
    'notes_el:text',
    'notes_en:text',
    ...REVIEW,
  ],
  workout_template_exercises: [
    'template_id:uuid',
    'exercise_id:uuid',
    'position:integer',
    'block:text',
    'sets:integer',
    'reps:integer',
    'seconds:integer',
    'rest_seconds:integer',
    ...STAMPS,
  ],
  health_tips: [
    'id:uuid',
    'slug:text',
    'topic:text',
    'title_el:text',
    'title_en:text',
    'body_el:text',
    'body_en:text',
    'source_url:text',
    'needs_source:boolean',
    ...REVIEW,
  ],
  // P7.1 skincare (20261006001100_hygieia_skincare.sql)
  skincare_product_types: [
    'id:uuid',
    'slug:text',
    'name_el:text',
    'name_en:text',
    'description_el:text',
    'description_en:text',
    'category:text',
    'key_ingredients:text[]',
    'avoid_with:text[]',
    'regions:text[]',
    'audiences:text[]',
    'skin_types:text[]',
    'concerns:text[]',
    'time:text',
    'price_band_eur:text',
    'notes_el:text',
    'notes_en:text',
    ...REVIEW,
  ],
  skincare_routines: [
    'id:uuid',
    'slug:text',
    'area:text',
    'name_el:text',
    'name_en:text',
    'audience:text',
    'skin_type:text',
    'region:text',
    'time:text',
    'intro_el:text',
    'intro_en:text',
    'steps:jsonb',
    'duration_min:integer',
    ...REVIEW,
  ],
  skincare_tips: [
    'id:uuid',
    'slug:text',
    'area:text',
    'title_el:text',
    'title_en:text',
    'body_el:text',
    'body_en:text',
    'audiences:text[]',
    'skin_types:text[]',
    'concerns:text[]',
    'regions:text[]',
    'sources:text[]',
    'needs_source:boolean',
    ...REVIEW,
  ],
  fridge_lists: ['id:uuid', 'user_id:uuid', 'name:text', 'ingredient_slugs:text[]', ...STAMPS],
  saved_plans: [
    'id:uuid',
    'user_id:uuid',
    'diet_id:uuid',
    'week_start:date',
    'plan:jsonb',
    ...STAMPS,
  ],
  favourites: ['user_id:uuid', 'recipe_id:uuid', ...STAMPS],
}

/** Columns that must be NOT NULL beyond the obvious keys: every locale pair (PLAN §1.2). */
const LOCALE_NOT_NULL: Record<string, string[]> = {
  ingredients: ['name_el', 'name_en', 'source_note'],
  diets: ['name_el', 'name_en', 'summary_el', 'summary_en'],
  recipes: ['title_el', 'title_en', 'steps_el', 'steps_en'],
  exercises: ['name_el', 'name_en', 'cue_el', 'cue_en'],
  workout_templates: ['title_el', 'title_en', 'notes_el', 'notes_en'],
  health_tips: ['title_el', 'title_en', 'body_el', 'body_en'],
  skincare_product_types: [
    'name_el',
    'name_en',
    'description_el',
    'description_en',
    'notes_el',
    'notes_en',
  ],
  skincare_routines: ['name_el', 'name_en', 'intro_el', 'intro_en'],
  skincare_tips: ['title_el', 'title_en', 'body_el', 'body_en'],
}

let db: PGlite

beforeAll(async () => {
  db = new PGlite()
  await installShim(db)
  const files = await applyArchive(db, MIG, 2)
  expect(files.length).toBeGreaterThanOrEqual(4)
}, 120_000)

afterAll(async () => {
  await db?.close()
})

const columnsOf = async (table: string) =>
  (
    await db.query<{ attname: string; type: string; notnull: boolean }>(
      `select a.attname, format_type(a.atttypid, a.atttypmod) as type, a.attnotnull as notnull
         from pg_attribute a
        where a.attrelid = to_regclass($1) and a.attnum > 0 and not a.attisdropped
        order by a.attnum`,
      [`hygieia.${table}`],
    )
  ).rows

describe('schema hygieia — the §2 table set', () => {
  it('holds exactly the §2 tables, each with a catalogue entry', async () => {
    const got = (
      await db.query<{ relname: string }>(
        `select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'hygieia' and c.relkind in ('r', 'p') order by 1`,
      )
    ).rows.map((r) => r.relname)
    expect(got).toEqual(Object.keys(EXPECTED).sort())
    expect(CATALOGUE.map((e) => e.table).sort()).toEqual(got)
  })

  it('enums.ts table lists are the content, child and user tables of §2', () => {
    expect([...CONTENT_TABLES].sort()).toEqual(
      CATALOGUE.filter((e) => e.kind === 'content')
        .map((e) => e.table)
        .sort(),
    )
    expect([...CHILD_TABLES].sort()).toEqual(
      CATALOGUE.filter((e) => e.kind === 'child')
        .map((e) => e.table)
        .sort(),
    )
    expect([...USER_TABLES].sort()).toEqual(
      CATALOGUE.filter((e) => e.kind === 'user')
        .map((e) => e.table)
        .sort(),
    )
  })
})

describe.each(Object.entries(EXPECTED))('hygieia.%s', (table, expected) => {
  it('has exactly the §2 columns, in order, with these types', async () => {
    const got = (await columnsOf(table)).map((c) => `${c.attname}:${c.type}`)
    expect(got).toEqual(expected)
  })

  it('every locale column is NOT NULL and refuses blank text', async () => {
    const cols = await columnsOf(table)
    for (const name of LOCALE_NOT_NULL[table] ?? []) {
      const c = cols.find((x) => x.attname === name)
      expect(c, `${table}.${name} exists`).toBeDefined()
      expect(c?.notnull, `${table}.${name} is not null`).toBe(true)
    }
    // Every text `*_el`/`*_en` column that is NOT NULL carries a btrim(x) <> '' check.
    const localeText = cols.filter(
      (c) => /_(el|en)$/.test(c.attname) && c.type === 'text' && c.notnull,
    )
    for (const c of localeText) {
      const r = await db.query<{ def: string }>(
        `select pg_get_constraintdef(k.oid) as def from pg_constraint k
           join pg_attribute a on a.attrelid = k.conrelid and a.attnum = any (k.conkey)
          where k.conrelid = $1::regclass and k.contype = 'c' and a.attname = $2`,
        [`hygieia.${table}`, c.attname],
      )
      expect(
        r.rows.some((x) => x.def.includes(`btrim(${c.attname}) <> ''`)),
        `${table}.${c.attname} has btrim check`,
      ).toBe(true)
    }
  })
})

describe('CHECK enum literals equal src/content/enums.ts (length and order)', () => {
  it('ENUM_COLUMNS covers every enum array once per table that uses it', () => {
    const names = new Set(ENUM_COLUMNS.map((e) => e.name))
    expect([...names].sort()).toEqual(
      [
        'UNITS',
        'PRICE_PER',
        'MEAL_TYPES',
        'WORKOUT_TYPES',
        'LEVELS',
        'INTENSITIES',
        'BLOCKS',
        'TIP_TOPICS',
        'CONTENT_STATUSES',
        'AUDIENCES',
        'SKIN_TYPES',
        'SKIN_CONCERNS',
        'REGIONS',
        'STEP_TIMES',
        'ROUTINE_TIMES',
        'CARE_AREAS',
        'SKINCARE_CATEGORIES',
        'PRICE_BANDS',
      ].sort(),
    )
    // Every content table has its status enum entry.
    for (const t of CONTENT_TABLES)
      expect(ENUM_COLUMNS.some((e) => e.table === t && e.column === 'status')).toBe(true)
  })

  it.each(ENUM_COLUMNS.map((e) => [e.table, e.column, e.name, e.values] as const))(
    'hygieia.%s.%s admits exactly %s',
    async (table, column, _name, values) => {
      const got = await checkValues(db, table, column)
      expect(got, `${table}.${column} has one single-column CHECK`).not.toBeNull()
      expect(got).toEqual([...values])
    },
  )

  it('the arrays themselves are the PLAN §2 literals', () => {
    expect(UNITS).toEqual(['g', 'ml', 'piece', 'tbsp', 'tsp', 'slice', 'clove', 'bunch'])
    expect(PRICE_PER).toEqual(['kg', 'l', 'piece'])
    expect(WORKOUT_TYPES).toEqual([
      'home',
      'gym',
      'calisthenics',
      'running',
      'swimming',
      'cycling',
      'mobility',
    ])
    expect(LEVELS).toEqual(['beginner', 'intermediate', 'advanced'])
    expect(INTENSITIES).toEqual(['low', 'moderate', 'high'])
    expect(BLOCKS).toEqual(['warmup', 'main', 'cooldown'])
    expect(MEAL_TYPES).toEqual(['breakfast', 'lunch', 'dinner', 'snack'])
    expect(TIP_TOPICS).toEqual(['sleep', 'hydration', 'nutrition', 'movement', 'habits', 'mental'])
    expect(CONTENT_STATUSES).toEqual(['pending', 'approved', 'rejected'])
    // P7.1 skincare
    expect(AUDIENCES).toEqual(['men', 'women', 'all'])
    expect(SKIN_TYPES).toEqual(['normal', 'dry', 'oily', 'combination', 'sensitive', 'all'])
    expect(SKIN_CONCERNS).toEqual([
      'acne',
      'aging',
      'hydration',
      'sun',
      'pigmentation',
      'redness',
      'shaving',
      'beard',
      'pores',
      'texture',
      'nails',
      'hands',
      'general',
    ])
    expect(REGIONS).toEqual(['eu', 'us', 'kr', 'jp', 'global'])
    expect(STEP_TIMES).toEqual(['am', 'pm', 'both'])
    expect(ROUTINE_TIMES).toEqual(['am', 'pm', 'weekly'])
    expect(CARE_AREAS).toEqual(['face', 'nails'])
    expect(SKINCARE_CATEGORIES).toEqual([
      'cleanser',
      'toner',
      'essence',
      'serum',
      'moisturizer',
      'sunscreen',
      'exfoliant',
      'mask',
      'eye',
      'treatment',
      'shaving',
      'beard',
      'lip',
      'cuticle_oil',
      'nail_treatment',
      'hand_cream',
      'base_coat',
      'nail_file',
      'nail_remover',
    ])
    expect(PRICE_BANDS).toEqual(['low', 'mid', 'high'])
  })
})

describe('§2 structural rules the column list alone does not show', () => {
  it('workout_templates is unique on (workout_type, level, intensity)', async () => {
    const r = await db.query<{ def: string }>(
      `select pg_get_constraintdef(c.oid) as def from pg_constraint c
        where c.conrelid = 'hygieia.workout_templates'::regclass and c.contype = 'u'`,
    )
    expect(r.rows.map((x) => x.def)).toContain('UNIQUE (workout_type, level, intensity)')
  })

  it('every content table has a unique slug and a pending default', async () => {
    for (const t of CONTENT_TABLES) {
      const r = await db.query<{ def: string }>(
        `select pg_get_constraintdef(c.oid) as def from pg_constraint c
          where c.conrelid = $1::regclass and c.contype = 'u'`,
        [`hygieia.${t}`],
      )
      expect(r.rows.map((x) => x.def)).toContain('UNIQUE (slug)')
      const d = await db.query<{ def: string }>(
        `select pg_get_expr(d.adbin, d.adrelid) as def from pg_attrdef d
           join pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum
          where d.adrelid = $1::regclass and a.attname = 'status'`,
        [`hygieia.${t}`],
      )
      expect(d.rows[0]?.def).toBe(`'pending'::text`)
    }
  })

  it('composite primary keys are as §2 says', async () => {
    const pk = async (t: string) =>
      (
        await db.query<{ def: string }>(
          `select pg_get_constraintdef(c.oid) as def from pg_constraint c
            where c.conrelid = $1::regclass and c.contype = 'p'`,
          [`hygieia.${t}`],
        )
      ).rows[0]?.def
    // `position` is a keyword, so pg_get_constraintdef quotes it.
    expect(await pk('recipe_ingredients')).toBe('PRIMARY KEY (recipe_id, "position")')
    expect(await pk('recipe_diets')).toBe('PRIMARY KEY (recipe_id, diet_id)')
    expect(await pk('workout_template_exercises')).toBe('PRIMARY KEY (template_id, "position")')
    expect(await pk('favourites')).toBe('PRIMARY KEY (user_id, recipe_id)')
    expect(await pk('profiles')).toBe('PRIMARY KEY (user_id)')
  })

  it('per-user tables default user_id to auth.uid()', async () => {
    for (const t of USER_TABLES) {
      const d = await db.query<{ def: string }>(
        `select pg_get_expr(d.adbin, d.adrelid) as def from pg_attrdef d
           join pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum
          where d.adrelid = $1::regclass and a.attname = 'user_id'`,
        [`hygieia.${t}`],
      )
      expect(d.rows[0]?.def).toBe('auth.uid()')
    }
  })

  it('the §2 row-level CHECKs hold: macros ≤ 100, price range, steps pair, dose, sourced tip', async () => {
    const defs = async (t: string) =>
      (
        await db.query<{ def: string }>(
          `select pg_get_constraintdef(c.oid) as def from pg_constraint c
            where c.conrelid = $1::regclass and c.contype = 'c'`,
          [`hygieia.${t}`],
        )
      ).rows.map((x) => x.def)
    expect((await defs('ingredients')).join('\n')).toMatch(
      /protein_100g \+ carbs_100g\) \+ fat_100g\) <= \(100\)/,
    )
    expect((await defs('ingredients')).join('\n')).toMatch(/price_eur_max >= price_eur_min/)
    expect((await defs('recipes')).join('\n')).toMatch(/cardinality\(steps_el\) >= 1/)
    expect((await defs('recipes')).join('\n')).toMatch(
      /cardinality\(steps_el\) = cardinality\(steps_en\)/,
    )
    expect((await defs('recipes')).join('\n')).toMatch(/cardinality\(meal_types\) >= 1/)
    expect((await defs('workout_template_exercises')).join('\n')).toMatch(
      /reps IS NOT NULL\) OR \(seconds IS NOT NULL/,
    )
    expect((await defs('health_tips')).join('\n')).toMatch(
      /source_url IS NOT NULL\) OR needs_source/,
    )
    expect((await defs('health_tips')).join('\n')).toMatch(/\^https\?:\/\//)
    expect((await defs('diets')).join('\n')).toMatch(/\^https\?:\/\//)
  })

  it('P7.1 skincare: steps is a 1–10 element jsonb array, a tip is sourced or flagged, area defaults to face', async () => {
    const defs = async (t: string) =>
      (
        await db.query<{ def: string }>(
          `select pg_get_constraintdef(c.oid) as def from pg_constraint c
            where c.conrelid = $1::regclass and c.contype = 'c'`,
          [`hygieia.${t}`],
        )
      ).rows.map((x) => x.def)
    const routines = (await defs('skincare_routines')).join('\n')
    expect(routines).toMatch(/jsonb_typeof\(steps\) = 'array'/)
    expect(routines).toMatch(/jsonb_array_length\(steps\) >= 1/)
    expect(routines).toMatch(/jsonb_array_length\(steps\) <= 10/)
    expect(routines).toMatch(/duration_min > 0/)
    expect((await defs('skincare_tips')).join('\n')).toMatch(
      /cardinality\(sources\) >= 1\) OR needs_source/,
    )
    for (const t of ['skincare_routines', 'skincare_tips']) {
      const d = await db.query<{ def: string }>(
        `select pg_get_expr(d.adbin, d.adrelid) as def from pg_attrdef d
           join pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum
          where d.adrelid = $1::regclass and a.attname = 'area'`,
        [`hygieia.${t}`],
      )
      expect(d.rows[0]?.def, t).toBe(`'face'::text`)
    }
    // Array-valued enum columns are non-empty by constraint.
    for (const [t, col] of [
      ['skincare_product_types', 'regions'],
      ['skincare_product_types', 'audiences'],
      ['skincare_product_types', 'skin_types'],
      ['skincare_product_types', 'concerns'],
      ['skincare_tips', 'audiences'],
      ['skincare_tips', 'skin_types'],
      ['skincare_tips', 'concerns'],
      ['skincare_tips', 'regions'],
    ]) {
      expect((await defs(t)).join('\n'), `${t}.${col}`).toMatch(
        new RegExp(`cardinality\\(${col}\\) >= 1`),
      )
    }
  })
})
