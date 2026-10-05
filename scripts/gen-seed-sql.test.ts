// @vitest-environment node
//
// P1.12 — the seed generator. What is proven here:
//   * literal formatting: `'` doubling (O'Brien), integers as-is, decimals via toFixed stripped of
//     trailing zeros, `'{}'::text[]` for an empty array, `'YYYY-MM-DD'::date`, `null`, booleans;
//   * the id formula `md5('hygieia:<table>:<slug>')::uuid` against a KNOWN vector, against the gate's
//     own `sid`, and against REAL Postgres (PGlite `select md5(...)::uuid`);
//   * a child row's FK literal equals the parent's / referenced row's id; an unresolvable slug throws;
//   * determinism: two runs are byte-equal, and input order does not matter;
//   * every generated file passes the static migration guard (scripts/check-migrations.mjs);
//   * the COMMITTED seed migrations are identical to a fresh generation (`seed:check` = exit 0);
//   * `--check` exits 1 naming the file after a one-character change in a temp copy of a seed module,
//     and on a missing / extra / stale file; a missing module is skipped, not an error.
// Temp copies live under os.tmpdir(); the archive is only read.

import { PGlite } from '@electric-sql/pglite'
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { checkMigrationSql } from './check-migrations.mjs'
import { sid } from './db-gate/catalogue.mjs'
import {
  BATCH_SIZE,
  DEFAULT_MIGRATIONS_DIR,
  DEFAULT_SEED_DIR,
  KINDS,
  compare,
  generate,
  header,
  insertStatements,
  kindSpec,
  main,
  normalizeLf,
  renderKind,
  seedId,
  sqlBool,
  sqlDate,
  sqlInt,
  sqlNumber,
  sqlText,
  sqlTextArray,
} from './gen-seed-sql.mjs'
import type {
  DietSeed,
  ExerciseSeed,
  HealthTipSeed,
  IngredientSeed,
  RecipeSeed,
} from '../src/content/types.ts'

type Generated = Awaited<ReturnType<typeof generate>>

const tmpDirs: string[] = []
const tmp = (label: string) => {
  const d = mkdtempSync(path.join(tmpdir(), `hygieia-seed-${label}-`))
  tmpDirs.push(d)
  return d
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
})

// --- a tiny, self-contained corpus for the render tests ------------------------------------------

const ING = (slug: string, extra: Partial<IngredientSeed> = {}): IngredientSeed => ({
  slug,
  name_el: 'Ντομάτα',
  name_en: 'Tomato',
  category: 'vegetables',
  unit: 'piece',
  grams_per_unit: 120,
  kcal_100g: 18,
  protein_100g: 0.9,
  carbs_100g: 3.9,
  fat_100g: 0.2,
  source_note: 'Typical values',
  price_eur_min: 1.5,
  price_eur_max: 3,
  price_per: 'kg',
  price_as_of: '2026-10-05',
  price_note: 'per kg',
  substitute_slugs: [],
  is_pantry_staple: false,
  ...extra,
})
const DIET = (slug: string): DietSeed => ({
  slug,
  name_el: 'Βίγκαν',
  name_en: 'Vegan',
  summary_el: 'σ',
  summary_en: 's',
  allowed_el: ['α'],
  allowed_en: ['a'],
  avoided_el: [],
  avoided_en: [],
  pros_el: ['π'],
  pros_en: ['p'],
  cons_el: ['κ'],
  cons_en: ['c'],
  avoid_if_el: ['ρωτήστε γιατρό'],
  avoid_if_en: ['ask a doctor'],
  source_url: null,
})
const RECIPE = (slug: string, extra: Partial<RecipeSeed> = {}): RecipeSeed => ({
  slug,
  title_el: 'Σαλάτα',
  title_en: 'Salad',
  steps_el: ['Κόψτε', 'Ανακατέψτε'],
  steps_en: ['Chop', 'Mix'],
  portions: 2,
  prep_min: 10,
  meal_types: ['lunch', 'dinner'],
  image_path: null,
  ingredients: [
    { ingredient_slug: 'tomato', quantity: 2, unit: 'piece' },
    {
      ingredient_slug: 'olive-oil',
      quantity: 1.5,
      unit: 'tbsp',
      note_el: 'έξτρα',
      note_en: 'extra',
    },
  ],
  diet_slugs: ['vegan', 'mediterranean'],
  ...extra,
})
const EX = (slug: string, extra: Partial<ExerciseSeed> = {}): ExerciseSeed => ({
  slug,
  name_el: 'Κάθισμα',
  name_en: 'Squat',
  cue_el: 'σ',
  cue_en: 'c',
  workout_type: 'home',
  level: 'beginner',
  muscle_groups: [],
  equipment_el: null,
  equipment_en: null,
  ...extra,
})
const TIP = (slug: string, extra: Partial<HealthTipSeed> = {}): HealthTipSeed => ({
  slug,
  topic: 'sleep',
  title_el: 'Τίτλος',
  title_en: "O'Brien's rule",
  body_el: 'σ',
  body_en: 'b',
  source_url: null,
  needs_source: true,
  ...extra,
})

// --- literals --------------------------------------------------------------------------------------

describe('SQL literals', () => {
  it("doubles single quotes: O'Brien → 'O''Brien'", () => {
    expect(sqlText("O'Brien")).toBe("'O''Brien'")
    expect(sqlText("it's 'quoted'")).toBe("'it''s ''quoted'''")
    expect(sqlText('plain')).toBe("'plain'")
    expect(sqlText(null)).toBe('null')
  })
  it('leaves a backslash alone (standard_conforming_strings)', () => {
    expect(sqlText('a\\b')).toBe("'a\\b'")
  })
  it('prints integers as-is and decimals via toFixed stripped of trailing zeros', () => {
    expect(sqlNumber(120)).toBe('120')
    expect(sqlNumber(0)).toBe('0')
    expect(sqlNumber(13.5)).toBe('13.5')
    expect(sqlNumber(0.9)).toBe('0.9')
    expect(sqlNumber(0.1 + 0.2)).toBe('0.3')
    expect(sqlNumber(1.25)).toBe('1.25')
    expect(sqlNumber(884)).toBe('884')
    expect(() => sqlNumber(Number.NaN)).toThrow(/finite number/)
    expect(() => sqlNumber(Number.POSITIVE_INFINITY)).toThrow(/finite number/)
  })
  it('refuses a non-integer where the column is integer', () => {
    expect(sqlInt(3)).toBe('3')
    expect(() => sqlInt(1.5)).toThrow(/integer/)
  })
  it("formats arrays as array[...]::text[] and the empty array as '{}'::text[]", () => {
    expect(sqlTextArray([])).toBe(`'{}'::text[]`)
    expect(sqlTextArray(['a', "b'c"])).toBe(`array['a','b''c']::text[]`)
  })
  it("formats dates as 'YYYY-MM-DD'::date and refuses anything else", () => {
    expect(sqlDate('2026-10-05')).toBe(`'2026-10-05'::date`)
    expect(() => sqlDate('2026-1-5')).toThrow(/ISO date/)
    expect(() => sqlDate('05/10/2026')).toThrow(/ISO date/)
  })
  it('formats booleans', () => {
    expect(sqlBool(true)).toBe('true')
    expect(sqlBool(false)).toBe('false')
  })
})

describe('insertStatements', () => {
  it(`batches rows ${BATCH_SIZE} per statement, each ending in on conflict (<pk>) do nothing`, () => {
    const rows = Array.from({ length: BATCH_SIZE * 2 + 50 }, (_, i) => [String(i), "'x'"])
    const sql = insertStatements('t', ['a', 'b'], ['a'], rows)
    const statements = sql.match(/insert into hygieia\.t \(a, b\) values\n/g) ?? []
    expect(statements).toHaveLength(3)
    expect(sql.match(/\non conflict \(a\) do nothing;\n/g)).toHaveLength(3)
    expect(sql).toContain(`  (0, 'x'),\n  (1, 'x')`)
  })
  it('emits nothing for zero rows', () => {
    expect(insertStatements('t', ['a'], ['a'], [])).toBe('')
  })
})

// --- the id formula --------------------------------------------------------------------------------

describe("seedId — md5('hygieia:<table>:<slug>')::uuid", () => {
  it('matches a known vector', () => {
    // md5('hygieia:recipes:x') = a64ec8c3d20ec1a2eeb87acf55785a09
    expect(seedId('recipes', 'x')).toBe('a64ec8c3-d20e-c1a2-eeb8-7acf55785a09')
    // md5('hygieia:ingredients:tomato') = 60c025059f817ad6517cf4d6f70ab16b
    expect(seedId('ingredients', 'tomato')).toBe('60c02505-9f81-7ad6-517c-f4d6f70ab16b')
  })
  it("equals the gate's own sid() (one formula, two call sites)", () => {
    for (const [t, s] of [
      ['ingredients', 'fx-tomato'],
      ['health_tips', 'sleep-regular-schedule'],
      ['workout_templates', 'home-beginner-low'],
    ] as const)
      expect(seedId(t, s)).toBe(sid(t, s))
  })
  it('is table-scoped: the same slug in two tables gives two ids', () => {
    expect(seedId('recipes', 'x')).not.toBe(seedId('diets', 'x'))
  })

  describe('against real Postgres (PGlite)', () => {
    let db: PGlite
    beforeAll(async () => {
      db = new PGlite()
    }, 60_000)
    afterAll(async () => {
      await db?.close()
    })
    it('yields byte-identical uuids to select md5(...)::uuid', async () => {
      const slugs = ['x', 'tomato', 'oat-porridge-banana-walnuts', 'a-1-b-2', 'zz-random-id']
      const r = await db.query<{ slug: string; id: string }>(
        `select s as slug, md5('hygieia:recipes:' || s)::uuid::text as id from unnest($1::text[]) as s`,
        [slugs],
      )
      expect(r.rows).toHaveLength(slugs.length)
      for (const row of r.rows) expect(row.id).toBe(seedId('recipes', row.slug))
    })
  })
})

// --- rendering -------------------------------------------------------------------------------------

describe('renderKind', () => {
  const corpus = {
    ingredients: [ING('tomato'), ING('olive-oil', { unit: 'tbsp', grams_per_unit: 13.5 })],
    diets: [DIET('vegan'), DIET('mediterranean')],
  }

  it("a child row's FK literal equals the parent's id and the referenced row's id", () => {
    const { sql, counts } = renderKind('recipes', { ...corpus, recipes: [RECIPE('greek-salad')] })
    const rid = `'${seedId('recipes', 'greek-salad')}'::uuid`
    const tomato = `'${seedId('ingredients', 'tomato')}'::uuid`
    const oil = `'${seedId('ingredients', 'olive-oil')}'::uuid`
    const vegan = `'${seedId('diets', 'vegan')}'::uuid`
    const med = `'${seedId('diets', 'mediterranean')}'::uuid`
    expect(sql).toContain(
      `  (${rid}, 'greek-salad', 'Σαλάτα', 'Salad', array['Κόψτε','Ανακατέψτε']::text[]`,
    )
    expect(sql).toContain(`  (${rid}, ${tomato}, 0, 2, 'piece', null, null)`)
    expect(sql).toContain(`  (${rid}, ${oil}, 1, 1.5, 'tbsp', 'έξτρα', 'extra')`)
    // diet tags sorted by diet slug: mediterranean before vegan
    expect(sql).toContain(`  (${rid}, ${med}),\n  (${rid}, ${vegan})`)
    expect(sql).toContain('on conflict (recipe_id, position) do nothing;')
    expect(sql).toContain('on conflict (recipe_id, diet_id) do nothing;')
    expect(counts).toEqual({ recipes: 1, recipe_ingredients: 2, recipe_diets: 2 })
  })
  it('throws on an unresolvable ingredient or diet slug (never a runtime FK violation)', () => {
    expect(() =>
      renderKind('recipes', {
        ...corpus,
        recipes: [
          RECIPE('r', { ingredients: [{ ingredient_slug: 'nope', quantity: 1, unit: 'g' }] }),
        ],
      }),
    ).toThrow(/recipes\/r line 0: ingredients slug "nope" does not resolve/)
    expect(() =>
      renderKind('recipes', { ...corpus, recipes: [RECIPE('r', { diet_slugs: ['keto'] })] }),
    ).toThrow(/diets slug "keto" does not resolve/)
  })
  it('throws on a half note pair, a duplicate slug and a malformed slug', () => {
    expect(() =>
      renderKind('recipes', {
        ...corpus,
        recipes: [
          RECIPE('r', {
            ingredients: [
              { ingredient_slug: 'tomato', quantity: 1, unit: 'g', note_en: 'only en' },
            ],
          }),
        ],
      }),
    ).toThrow(/note_el and note_en come as a pair/)
    expect(() => renderKind('tips', { tips: [TIP('a'), TIP('a')] })).toThrow(/duplicate slug a/)
    expect(() => renderKind('tips', { tips: [TIP('Not-A-Slug')] })).toThrow(/malformed slug/)
  })
  it('sorts parent rows by slug regardless of input order (determinism)', () => {
    const a = renderKind('tips', { tips: [TIP('b-tip'), TIP('a-tip'), TIP('c-tip')] }).sql
    const b = renderKind('tips', { tips: [TIP('c-tip'), TIP('a-tip'), TIP('b-tip')] }).sql
    expect(a).toBe(b)
    expect(a.indexOf("'a-tip'")).toBeLessThan(a.indexOf("'b-tip'"))
    expect(a.indexOf("'b-tip'")).toBeLessThan(a.indexOf("'c-tip'"))
  })
  it("escapes content end-to-end: O'Brien's rule → 'O''Brien''s rule'", () => {
    expect(renderKind('tips', { tips: [TIP('t')] }).sql).toContain("'O''Brien''s rule'")
  })
  it("formats an empty muscle_groups as '{}'::text[] and a null equipment pair as null, null", () => {
    const sql = renderKind('exercises', { exercises: [EX('squat')] }).sql
    expect(sql).toContain(`'home', 'beginner', '{}'::text[], null, null)`)
    expect(() =>
      renderKind('exercises', { exercises: [EX('e', { equipment_en: 'band' })] }),
    ).toThrow(/equipment_el and equipment_en come as a pair/)
  })
  it('formats the ingredient row with a date literal and numeric literals', () => {
    const sql = renderKind('ingredients', { ingredients: corpus.ingredients }).sql
    expect(sql).toContain(
      `'tbsp', 13.5, 18, 0.9, 3.9, 0.2, 'Typical values', 1.5, 3, 'kg', '2026-10-05'::date, 'per kg', '{}'::text[], false)`,
    )
  })
  it('renders workouts with the exercise FK and null reps/seconds, refusing a dose-less slot', () => {
    const exercises = [EX('squat'), EX('plank')]
    const tpl = {
      slug: 'home-beginner-low',
      workout_type: 'home' as const,
      level: 'beginner' as const,
      intensity: 'low' as const,
      title_el: 'Σπίτι',
      title_en: 'Home',
      duration_min: 20,
      notes_el: 'σ',
      notes_en: 'n',
      blocks: [
        {
          block: 'warmup' as const,
          exercise_slug: 'squat',
          sets: 1,
          reps: 10,
          seconds: null,
          rest_seconds: 0,
        },
        {
          block: 'main' as const,
          exercise_slug: 'plank',
          sets: 3,
          reps: null,
          seconds: 30,
          rest_seconds: 45,
        },
      ],
    }
    const { sql, counts } = renderKind('workouts', { exercises, workouts: [tpl] })
    const tid = `'${seedId('workout_templates', 'home-beginner-low')}'::uuid`
    expect(sql).toContain(
      `  (${tid}, '${seedId('exercises', 'squat')}'::uuid, 0, 'warmup', 1, 10, null, 0)`,
    )
    expect(sql).toContain(
      `  (${tid}, '${seedId('exercises', 'plank')}'::uuid, 1, 'main', 3, null, 30, 45)`,
    )
    expect(sql).toContain('on conflict (template_id, position) do nothing;')
    expect(counts).toEqual({ workout_templates: 1, workout_template_exercises: 2 })
    const bad = { ...tpl, blocks: [{ ...tpl.blocks[0], reps: null, seconds: null }] }
    expect(() => renderKind('workouts', { exercises, workouts: [bad] })).toThrow(
      /reps or seconds required/,
    )
  })
  it('refuses an unknown kind', () => {
    expect(() => renderKind('potions', {})).toThrow(/unknown seed kind: potions/)
  })
})

describe('header', () => {
  it('names the generator, the source module and the row counts, with no timestamp', () => {
    const h = header(kindSpec('recipes'), {
      recipes: 91,
      recipe_ingredients: 728,
      recipe_diets: 513,
    })
    expect(h).toContain('GENERATED by scripts/gen-seed-sql.mjs')
    expect(h).toContain('Source: src/content/seed/recipes.ts (RECIPES)')
    expect(h).toContain('Rows: recipes 91, recipe_ingredients 728, recipe_diets 513.')
    expect(h).not.toMatch(/\d{4}-\d{2}-\d{2}T/)
  })
})

// --- the real seed modules and the committed archive ------------------------------------------------

describe('generate() over src/content/seed', () => {
  let gen: Generated
  beforeAll(async () => {
    gen = await generate()
  }, 60_000)

  it('is deterministic: a second run is byte-equal', async () => {
    const again = await generate()
    expect([...again.files.keys()]).toEqual([...gen.files.keys()])
    for (const [file, sql] of gen.files) expect(again.files.get(file)).toBe(sql)
  })
  it('generates every kind whose module exists and skips the rest by name', () => {
    for (const spec of KINDS) {
      const present = existsSync(path.join(DEFAULT_SEED_DIR, spec.module))
      expect(gen.files.has(spec.file)).toBe(present)
      expect(gen.skipped.includes(spec.kind)).toBe(!present)
    }
    expect(gen.files.size + gen.skipped.length).toBe(KINDS.length)
  })
  it('meets the P1.12 reference floors', () => {
    expect(gen.counts.ingredients?.ingredients).toBeGreaterThanOrEqual(160)
    expect(gen.counts.diets?.diets).toBeGreaterThanOrEqual(8)
    expect(gen.counts.recipes?.recipes).toBeGreaterThanOrEqual(40)
    expect(gen.counts.recipes?.recipe_ingredients).toBeGreaterThan(0)
    expect(gen.counts.recipes?.recipe_diets).toBeGreaterThan(0)
    expect(gen.counts.exercises?.exercises).toBeGreaterThanOrEqual(60)
    expect(gen.counts.tips?.health_tips).toBeGreaterThanOrEqual(30)
    if (gen.counts.workouts) expect(gen.counts.workouts.workout_templates).toBe(63)
  })
  it('uses LF only, ends with a newline, and every statement is on conflict … do nothing', () => {
    for (const sql of gen.files.values()) {
      expect(sql).not.toContain('\r')
      expect(sql.endsWith(';\n\n')).toBe(true)
      const inserts = sql.match(/^insert into hygieia\./gm) ?? []
      const conflicts = sql.match(/^on conflict \([a-z_, ]+\) do nothing;$/gm) ?? []
      expect(inserts.length).toBeGreaterThan(0)
      expect(conflicts).toHaveLength(inserts.length)
      // `status` is never a column in any INSERT (omitted → default pending); the header may name it
      expect(sql).not.toMatch(/^insert into hygieia\.\w+ \([^)]*\bstatus\b/m)
    }
  })
  it('passes the static migration guard (scripts/check-migrations.mjs) file by file', () => {
    for (const [file, sql] of gen.files) expect(checkMigrationSql(file, sql)).toEqual([])
  })
  it('is identical to the COMMITTED seed migrations (what `npm run seed:check` asserts)', () => {
    const { ok, problems, identical } = compare(gen, DEFAULT_MIGRATIONS_DIR)
    expect(problems).toEqual([])
    expect(ok).toBe(true)
    expect(identical).toHaveLength(gen.files.size)
    for (const [file, sql] of gen.files)
      expect(normalizeLf(readFileSync(path.join(DEFAULT_MIGRATIONS_DIR, file), 'utf8'))).toBe(sql)
  })
  it('main([--check]) exits 0 and reports every file', async () => {
    const lines: string[] = []
    expect(await main(['--check'], { log: (l) => lines.push(l) })).toBe(0)
    expect(lines.at(-1)).toMatch(/^seed:check: OK — \d+ seed migration\(s\) identical/)
    for (const file of gen.files.keys()) expect(lines.some((l) => l.includes(file))).toBe(true)
    for (const kind of gen.skipped)
      expect(lines).toContain(`seed:check: skipped: ${kindSpec(kind).module} not present yet`)
  })
})

describe('--check goes RED on drift', () => {
  const TIPS_FILE = kindSpec('tips').file

  it('exits 1 naming the file after a one-character change in a temp copy of tips.ts', async () => {
    const seedDir = tmp('mutated')
    const src = readFileSync(path.join(DEFAULT_SEED_DIR, 'tips.ts'), 'utf8')
    const needle = "title_en: 'Go to bed and wake up at the same time every day'"
    expect(src).toContain(needle)
    writeFileSync(path.join(seedDir, 'tips.ts'), src.replace(needle, needle.replace('Go', 'go')))
    const lines: string[] = []
    const code = await main(['--check', '--only', 'tips'], { seedDir, log: (l) => lines.push(l) })
    expect(code).toBe(1)
    expect(lines).toContain(`seed:check: differs  ${TIPS_FILE} (run npm run seed:gen)`)
    expect(lines.at(-1)).toBe('seed:check: FAIL — 1 file(s) out of step with src/content/seed')
  })
  it('exits 1 on a missing file, and `seed:gen` into that directory then makes it exit 0', async () => {
    const migrationsDir = tmp('missing')
    const lines: string[] = []
    expect(
      await main(['--check', '--only', 'tips'], { migrationsDir, log: (l) => lines.push(l) }),
    ).toBe(1)
    expect(lines).toContain(`seed:check: missing  ${TIPS_FILE} (run npm run seed:gen)`)
    expect(await main(['--only', 'tips'], { migrationsDir, log: () => {} })).toBe(0)
    expect(existsSync(path.join(migrationsDir, TIPS_FILE))).toBe(true)
    expect(await main(['--check', '--only', 'tips'], { migrationsDir, log: () => {} })).toBe(0)
  })
  it('flags an extra seed-named file no kind generates', async () => {
    const migrationsDir = tmp('extra')
    cpSync(DEFAULT_MIGRATIONS_DIR, migrationsDir, { recursive: true })
    writeFileSync(path.join(migrationsDir, '20261006009900_hygieia_seed_potions.sql'), '-- stray\n')
    const { ok, problems } = compare(await generate(), migrationsDir)
    expect(ok).toBe(false)
    expect(problems).toEqual([
      'extra    20261006009900_hygieia_seed_potions.sql (no generator kind)',
    ])
  })
  it('skips a kind whose module is absent: no file is fine, a present file is stale', async () => {
    const seedDir = tmp('partial')
    cpSync(path.join(DEFAULT_SEED_DIR, 'tips.ts'), path.join(seedDir, 'tips.ts'))
    const gen = await generate({ seedDir, kinds: ['workouts', 'tips'] })
    expect(gen.skipped).toEqual(['workouts'])
    expect([...gen.files.keys()]).toEqual([TIPS_FILE])
    const migrationsDir = tmp('partial-mig')
    cpSync(path.join(DEFAULT_MIGRATIONS_DIR, TIPS_FILE), path.join(migrationsDir, TIPS_FILE))
    expect(compare(gen, migrationsDir, ['workouts', 'tips']).ok).toBe(true)
    const stale = kindSpec('workouts').file
    writeFileSync(path.join(migrationsDir, stale), '-- cannot be regenerated\n')
    expect(compare(gen, migrationsDir, ['workouts', 'tips']).problems).toEqual([
      `stale    ${stale} (module workouts.ts is absent)`,
    ])
  })
  it('a kind whose `needs` module is absent is an error, not a skip', async () => {
    const seedDir = tmp('needs')
    cpSync(path.join(DEFAULT_SEED_DIR, 'recipes.ts'), path.join(seedDir, 'recipes.ts'))
    cpSync(path.join(DEFAULT_SEED_DIR, 'recipes'), path.join(seedDir, 'recipes'), {
      recursive: true,
    })
    const lines: string[] = []
    expect(
      await main(['--check', '--only', 'recipes'], { seedDir, log: (l) => lines.push(l) }),
    ).toBe(1)
    expect(lines).toEqual(['seed:check: FAIL — recipes needs ingredients.ts, which is absent'])
  })
})
