import { describe, expect, it } from 'vitest'
import type { HygieiaClient } from '../lib/supabase'
import {
  BUNDLED_SEEDS,
  bundledSource,
  createBundledSource,
  seedId,
  type SeedTable,
} from './bundled'
import { CONTENT_STATUSES } from './enums'
import { hexToUuid, md5 } from './md5'
import { DIETS } from './seed/diets'
import { INGREDIENTS } from './seed/ingredients'
import { RECIPES } from './seed/recipes'
import { filterRecipes, matchesRecipeFilter, type ContentSource, type Result } from './source'
import {
  APPROVED_FILTER,
  PLAIN_SELECT,
  RECIPE_SELECT,
  WORKOUT_SELECT,
  classifyError,
  contentClientFor,
  supabaseSource,
  toRecipe,
  type QueryResult,
} from './supabase'
import type { ExerciseSeed, IngredientSeed, RecipeSeed, WorkoutTemplateSeed } from './types'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

function unwrap<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(`expected ok, got ${result.error}`)
  return result.data
}

/** Resolve a `SeedTable` (rows, or a loader of rows) the way the bundled source does. */
const load = <T>(table: SeedTable<T>): Promise<readonly T[]> =>
  typeof table === 'function' ? table() : Promise.resolve(table)

// --- fixtures for the factory tests (the real workouts seed may still be the merge stub) ---------

const ING = (slug: string, extra: Partial<IngredientSeed> = {}): IngredientSeed => ({
  slug,
  name_el: `${slug} el`,
  name_en: `${slug} en`,
  category: 'test',
  unit: 'g',
  grams_per_unit: 1,
  kcal_100g: 100,
  protein_100g: 10,
  carbs_100g: 10,
  fat_100g: 10,
  source_note: 'test',
  price_eur_min: 1,
  price_eur_max: 2,
  price_per: 'kg',
  price_as_of: '2026-10-01',
  price_note: 'test',
  substitute_slugs: [],
  is_pantry_staple: false,
  ...extra,
})

const EX = (slug: string): ExerciseSeed => ({
  slug,
  name_el: `${slug} el`,
  name_en: `${slug} en`,
  cue_el: 'el',
  cue_en: 'en',
  workout_type: 'home',
  level: 'beginner',
  muscle_groups: ['core'],
  equipment_el: null,
  equipment_en: null,
})

const RECIPE = (slug: string, diet_slugs: string[], ingredientSlugs: string[]): RecipeSeed => ({
  slug,
  title_el: `${slug} el`,
  title_en: `${slug} en`,
  steps_el: ['βήμα'],
  steps_en: ['step'],
  portions: 2,
  prep_min: 10,
  meal_types: ['lunch'],
  image_path: null,
  ingredients: ingredientSlugs.map((s) => ({ ingredient_slug: s, quantity: 100, unit: 'g' })),
  diet_slugs,
})

const TEMPLATE: WorkoutTemplateSeed = {
  slug: 'home-beginner-low',
  workout_type: 'home',
  level: 'beginner',
  intensity: 'low',
  title_el: 'el',
  title_en: 'en',
  duration_min: 20,
  notes_el: 'el',
  notes_en: 'en',
  blocks: [
    { block: 'warmup', exercise_slug: 'march', sets: 1, reps: null, seconds: 60, rest_seconds: 0 },
    { block: 'main', exercise_slug: 'squat', sets: 3, reps: 10, seconds: null, rest_seconds: 45 },
    { block: 'main', exercise_slug: 'ghost', sets: 2, reps: 8, seconds: null, rest_seconds: 30 },
  ],
}

const fixtureSource = createBundledSource({
  ingredients: [ING('tomato'), ING('feta'), ING('olive-oil', { is_pantry_staple: true })],
  diets: [],
  recipes: [
    RECIPE('salad', ['vegan', 'vegetarian'], ['tomato', 'olive-oil']),
    RECIPE('feta-plate', ['vegetarian'], ['feta', 'nowhere']),
    RECIPE('oil', [], ['olive-oil']),
  ],
  exercises: [EX('march'), EX('squat')],
  workoutTemplates: [TEMPLATE],
  tips: [],
  skincareProductTypes: [],
  skincareRoutines: [],
  skincareTips: [],
})

// --- bundled ----------------------------------------------------------------------------------------

describe('seedId', () => {
  it("is md5('hygieia:<table>:<slug>') rendered as a UUID — the migration's formula (PLAN §1.6)", () => {
    // Vectors computed with node crypto: see md5.test.ts.
    expect(seedId('ingredients', 'feta')).toBe('f7d7ea29-f7f1-d64e-bf23-e2ea533608d2')
    expect(seedId('recipes', 'greek-salad')).toBe('da7d02c7-4bea-76bb-e40d-22f33bcf3206')
    expect(seedId('diets', 'vegan')).toBe(hexToUuid(md5('hygieia:diets:vegan')))
  })

  it('differs by table for the same slug', () => {
    expect(seedId('ingredients', 'x')).not.toBe(seedId('recipes', 'x'))
  })
})

describe('bundledSource (real seeds)', () => {
  it('is the bundled kind over the real seed modules (each table a lazy loader of the same array)', async () => {
    expect(bundledSource.kind).toBe('bundled')
    // The real seeds are dynamic-import loaders (one chunk per table), not arrays.
    expect(typeof BUNDLED_SEEDS.ingredients).toBe('function')
    expect(typeof BUNDLED_SEEDS.recipes).toBe('function')
    expect(typeof BUNDLED_SEEDS.diets).toBe('function')
    expect(await load(BUNDLED_SEEDS.ingredients)).toBe(INGREDIENTS)
    expect(await load(BUNDLED_SEEDS.recipes)).toBe(RECIPES)
    expect(await load(BUNDLED_SEEDS.diets)).toBe(DIETS)
  })

  it('returns ≥ 160 ingredients, ≥ 8 diets, ≥ 40 recipes, every row pending with a formula id', async () => {
    const ingredients = unwrap(await bundledSource.listIngredients())
    const diets = unwrap(await bundledSource.listDiets())
    const recipes = unwrap(await bundledSource.listRecipes())
    expect(ingredients.length).toBeGreaterThanOrEqual(160)
    expect(diets.length).toBeGreaterThanOrEqual(8)
    expect(recipes.length).toBeGreaterThanOrEqual(40)

    for (const row of ingredients) {
      expect(row.status).toBe(CONTENT_STATUSES[0])
      expect(row.id).toMatch(UUID_RE)
      expect(row.id).toBe(seedId('ingredients', row.slug))
    }
    for (const row of diets) expect(row.id).toBe(seedId('diets', row.slug))
    for (const row of recipes) {
      expect(row.status).toBe('pending')
      expect(row.id).toBe(seedId('recipes', row.slug))
    }
  })

  it('resolves EVERY recipe ingredient line to an ingredient row (no unresolved slug)', async () => {
    const recipes = unwrap(await bundledSource.listRecipes())
    const unresolved: string[] = []
    for (const recipe of recipes) {
      expect(recipe.lines.length).toBe(recipe.ingredients.length)
      recipe.lines.forEach((resolved, i) => {
        expect(resolved.line).toBe(recipe.ingredients[i])
        if (resolved.ingredient === null)
          unresolved.push(`${recipe.slug}:${resolved.line.ingredient_slug}`)
        else expect(resolved.ingredient.slug).toBe(resolved.line.ingredient_slug)
      })
    }
    expect(unresolved).toEqual([])
  })

  it('lists exercises and tips with ids and pending status', async () => {
    const exercises = unwrap(await bundledSource.listExercises())
    const tips = unwrap(await bundledSource.listTips())
    expect(exercises.length).toBeGreaterThanOrEqual(100)
    expect(tips.length).toBeGreaterThanOrEqual(50)
    expect(exercises[0]?.id).toBe(seedId('exercises', exercises[0]?.slug ?? ''))
    expect(tips[0]?.id).toBe(seedId('health_tips', tips[0]?.slug ?? ''))
    expect(tips.every((t) => t.status === 'pending')).toBe(true)
  })

  it('filters recipes by diet slug: only vegan-tagged come back, and some do', async () => {
    const vegan = unwrap(await bundledSource.listRecipes({ dietSlugs: ['vegan'] }))
    expect(vegan.length).toBeGreaterThan(0)
    expect(vegan.every((r) => r.diet_slugs.includes('vegan'))).toBe(true)
    const all = unwrap(await bundledSource.listRecipes())
    expect(vegan.length).toBeLessThan(all.length)
    expect(unwrap(await bundledSource.listRecipes({ dietSlugs: [] }))).toHaveLength(all.length)
  })

  it('getRecipe: unknown slug → ok(null); a real slug → that recipe', async () => {
    expect(await bundledSource.getRecipe('no-such')).toEqual({ ok: true, data: null })
    const first = RECIPES[0]
    if (!first) throw new Error('no recipes')
    const got = unwrap(await bundledSource.getRecipe(first.slug))
    expect(got?.slug).toBe(first.slug)
    expect(got?.title_el).toBe(first.title_el)
  })

  it('returns a fresh array per call so a caller cannot mutate the cache', async () => {
    const a = unwrap(await bundledSource.listDiets())
    a.length = 0
    expect(unwrap(await bundledSource.listDiets()).length).toBeGreaterThanOrEqual(8)
  })
})

describe('createBundledSource (fixtures)', () => {
  it('leaves an unknown ingredient slug as ingredient: null instead of dropping the line', async () => {
    const recipe = unwrap(await fixtureSource.getRecipe('feta-plate'))
    expect(recipe?.lines.map((l) => [l.line.ingredient_slug, l.ingredient?.slug ?? null])).toEqual([
      ['feta', 'feta'],
      ['nowhere', null],
    ])
  })

  it('diet filter is a union over the given slugs', async () => {
    const slugs = async (filter?: { dietSlugs?: string[] }) =>
      unwrap(await fixtureSource.listRecipes(filter)).map((r) => r.slug)
    expect(await slugs({ dietSlugs: ['vegan'] })).toEqual(['salad'])
    expect(await slugs({ dietSlugs: ['vegetarian'] })).toEqual(['salad', 'feta-plate'])
    expect(await slugs({ dietSlugs: ['vegan', 'keto'] })).toEqual(['salad'])
    expect(await slugs({ dietSlugs: ['keto'] })).toEqual([])
    expect(await slugs()).toEqual(['salad', 'feta-plate', 'oil'])
  })

  it('resolves workout template slots and looks a template up by (type, level, intensity)', async () => {
    const all = unwrap(await fixtureSource.listWorkoutTemplates())
    expect(all).toHaveLength(1)
    expect(all[0]?.id).toBe(seedId('workout_templates', 'home-beginner-low'))
    expect(all[0]?.slots.map((s) => [s.block.exercise_slug, s.exercise?.slug ?? null])).toEqual([
      ['march', 'march'],
      ['squat', 'squat'],
      ['ghost', null],
    ])
    const cell = unwrap(await fixtureSource.getWorkoutTemplate('home', 'beginner', 'low'))
    expect(cell?.slug).toBe('home-beginner-low')
    expect(cell?.blocks).toBe(TEMPLATE.blocks)
    expect(await fixtureSource.getWorkoutTemplate('gym', 'advanced', 'high')).toEqual({
      ok: true,
      data: null,
    })
  })
})

describe('filterRecipes / matchesRecipeFilter', () => {
  const r = RECIPE('r', ['vegan'], [])
  it('no filter, undefined or empty dietSlugs → everything passes', () => {
    expect(matchesRecipeFilter(r)).toBe(true)
    expect(matchesRecipeFilter(r, {})).toBe(true)
    expect(matchesRecipeFilter(r, { dietSlugs: [] })).toBe(true)
    expect(filterRecipes([r], { dietSlugs: ['keto'] })).toEqual([])
  })
})

// --- supabase ---------------------------------------------------------------------------------------

interface Recorded {
  table: string
  columns: string
  filters: Array<[string, string]>
  single: boolean
}

/**
 * A PostgREST-shaped fake: `from(t).select(c).eq(a, b)…[.maybeSingle()]` is recorded and the chain
 * is awaited like the real builder (thenable). `answer` decides what each chain resolves to — or
 * throws, to simulate a transport failure.
 */
function fakeHygieiaClient(answer: (call: Recorded) => QueryResult) {
  const calls: Recorded[] = []
  const from = (table: string) => {
    const call: Recorded = { table, columns: '', filters: [], single: false }
    calls.push(call)
    const builder = {
      select(columns: string) {
        call.columns = columns
        return builder
      },
      eq(column: string, value: string) {
        call.filters.push([column, value])
        return builder
      },
      maybeSingle() {
        call.single = true
        return builder
      },
      then<R>(onFulfilled: (v: QueryResult) => R, onRejected?: (e: unknown) => R) {
        return Promise.resolve()
          .then(() => answer(call))
          .then(onFulfilled, onRejected)
      },
    }
    return builder
  }
  // reason: the fake implements exactly the chain `contentClientFor` pins; the compiler checks the
  // adapter against the REAL client type, the test checks the adapter's behaviour against this.
  const client = { from } as unknown as HygieiaClient
  return { client, calls }
}

const INGREDIENT_ROW = (slug: string, id: string) => ({
  id,
  slug,
  name_el: `${slug} el`,
  name_en: `${slug} en`,
  category: 'test',
  unit: 'g',
  grams_per_unit: 1,
  kcal_100g: '100.0', // numeric may arrive as a string
  protein_100g: 10,
  carbs_100g: 10,
  fat_100g: 10,
  source_note: 'test',
  price_eur_min: 1,
  price_eur_max: 2,
  price_per: 'kg',
  price_as_of: '2026-10-01',
  price_note: 'test',
  substitute_slugs: [],
  is_pantry_staple: false,
  status: 'approved',
  reviewed_at: null,
  reviewed_by: null,
  created_at: '2026-10-05T00:00:00Z',
  updated_at: '2026-10-05T00:00:00Z',
})

const RECIPE_ROW = {
  id: 'r-1',
  slug: 'greek-salad',
  title_el: 'Χωριάτικη',
  title_en: 'Greek salad',
  steps_el: ['κόψε'],
  steps_en: ['chop'],
  portions: 2,
  prep_min: 10,
  meal_types: ['lunch', 'dinner'],
  image_path: null,
  status: 'approved',
  reviewed_at: '2026-10-05T00:00:00Z',
  reviewed_by: 'u-1',
  created_at: '2026-10-05T00:00:00Z',
  updated_at: '2026-10-05T00:00:00Z',
  recipe_ingredients: [
    {
      recipe_id: 'r-1',
      ingredient_id: 'i-feta',
      position: 1,
      quantity: 100,
      unit: 'g',
      note_el: 'σε κύβους',
      note_en: 'cubed',
      ingredient: INGREDIENT_ROW('feta', 'i-feta'),
    },
    {
      recipe_id: 'r-1',
      ingredient_id: 'i-tomato',
      position: 0,
      quantity: 2,
      unit: 'piece',
      note_el: null,
      note_en: null,
      ingredient: INGREDIENT_ROW('tomato', 'i-tomato'),
    },
    {
      recipe_id: 'r-1',
      ingredient_id: 'i-hidden',
      position: 2,
      quantity: '15',
      unit: 'ml',
      note_el: null,
      note_en: null,
      ingredient: null, // not approved → RLS hides it → PostgREST embeds null
    },
  ],
  recipe_diets: [
    { diet: { slug: 'vegetarian' } },
    { diet: null },
    { diet: { slug: 'mediterranean' } },
  ],
}

const okWith = (data: unknown): QueryResult => ({ data, error: null })

describe('supabaseSource', () => {
  it('is the supabase kind', () => {
    expect(supabaseSource(fakeHygieiaClient(() => okWith([])).client).kind).toBe('supabase')
  })

  it("filters EVERY list on status = 'approved' and uses the embed strings", async () => {
    const fake = fakeHygieiaClient(() => okWith([]))
    const source = supabaseSource(fake.client)
    await source.listIngredients()
    await source.listDiets()
    await source.listRecipes()
    await source.listExercises()
    await source.listWorkoutTemplates()
    await source.listTips()
    expect(fake.calls.map((c) => c.table)).toEqual([
      'ingredients',
      'diets',
      'recipes',
      'exercises',
      'workout_templates',
      'health_tips',
    ])
    for (const call of fake.calls) {
      expect(call.filters).toEqual([[...APPROVED_FILTER]])
      expect(call.single).toBe(false)
    }
    expect(APPROVED_FILTER).toEqual(['status', 'approved'])
    expect(fake.calls.map((c) => c.columns)).toEqual([
      PLAIN_SELECT,
      PLAIN_SELECT,
      RECIPE_SELECT,
      PLAIN_SELECT,
      WORKOUT_SELECT,
      PLAIN_SELECT,
    ])
    expect(RECIPE_SELECT).toContain('recipe_ingredients(*, ingredient:ingredients(*))')
    expect(RECIPE_SELECT).toContain('recipe_diets(diet:diets(slug))')
    expect(WORKOUT_SELECT).toContain('workout_template_exercises(*, exercise:exercises(*))')
  })

  it('getRecipe / getWorkoutTemplate: approved + key filters, maybeSingle, null → ok(null)', async () => {
    const fake = fakeHygieiaClient(() => okWith(null))
    const source = supabaseSource(fake.client)
    expect(await source.getRecipe('no-such')).toEqual({ ok: true, data: null })
    expect(await source.getWorkoutTemplate('gym', 'advanced', 'high')).toEqual({
      ok: true,
      data: null,
    })
    expect(fake.calls).toEqual([
      {
        table: 'recipes',
        columns: RECIPE_SELECT,
        filters: [
          ['status', 'approved'],
          ['slug', 'no-such'],
        ],
        single: true,
      },
      {
        table: 'workout_templates',
        columns: WORKOUT_SELECT,
        filters: [
          ['status', 'approved'],
          ['workout_type', 'gym'],
          ['level', 'advanced'],
          ['intensity', 'high'],
        ],
        single: true,
      },
    ])
  })

  it('maps a recipe row with embeds: lines by position, hidden ingredient kept as null, diet slugs', async () => {
    const fake = fakeHygieiaClient(() => okWith(RECIPE_ROW))
    const recipe = unwrap(await supabaseSource(fake.client).getRecipe('greek-salad'))
    expect(recipe).not.toBeNull()
    expect(recipe?.id).toBe('r-1')
    expect(recipe?.status).toBe('approved')
    expect(recipe?.title_en).toBe('Greek salad')
    expect(recipe?.meal_types).toEqual(['lunch', 'dinner'])
    expect(recipe?.diet_slugs).toEqual(['mediterranean', 'vegetarian'])
    expect(recipe?.ingredients).toEqual([
      { ingredient_slug: 'tomato', quantity: 2, unit: 'piece' },
      { ingredient_slug: 'feta', quantity: 100, unit: 'g', note_el: 'σε κύβους', note_en: 'cubed' },
      { ingredient_slug: 'i-hidden', quantity: 15, unit: 'ml' },
    ])
    expect(recipe?.lines.map((l) => l.ingredient?.slug ?? null)).toEqual(['tomato', 'feta', null])
    expect(recipe?.lines[1]?.ingredient?.kcal_100g).toBe(100)
    // no review/timestamp columns leak into the row shape the UI sees
    expect(recipe).not.toHaveProperty('reviewed_by')
    expect(recipe).not.toHaveProperty('recipe_ingredients')
  })

  it('applies the diet filter client-side on the approved list', async () => {
    const other = {
      ...RECIPE_ROW,
      id: 'r-2',
      slug: 'other',
      recipe_diets: [{ diet: { slug: 'keto' } }],
    }
    const fake = fakeHygieiaClient(() => okWith([RECIPE_ROW, other]))
    const source = supabaseSource(fake.client)
    expect(unwrap(await source.listRecipes({ dietSlugs: ['keto'] })).map((r) => r.slug)).toEqual([
      'other',
    ])
    expect(unwrap(await source.listRecipes()).map((r) => r.slug)).toEqual(['greek-salad', 'other'])
  })

  it('a thrown TypeError (transport) → network; a PostgREST error with a code → unknown', async () => {
    const dead = fakeHygieiaClient(() => {
      throw new TypeError('Failed to fetch')
    })
    expect(await supabaseSource(dead.client).listIngredients()).toEqual({
      ok: false,
      error: 'network',
    })
    expect(await supabaseSource(dead.client).getRecipe('x')).toEqual({
      ok: false,
      error: 'network',
    })

    const denied = fakeHygieiaClient(() => ({
      data: null,
      error: { message: 'permission denied', code: '42501' },
    }))
    expect(await supabaseSource(denied.client).listDiets()).toEqual({ ok: false, error: 'unknown' })

    const codeless = fakeHygieiaClient(() => ({ data: null, error: { message: 'timeout' } }))
    expect(await supabaseSource(codeless.client).listTips()).toEqual({
      ok: false,
      error: 'network',
    })
  })

  it('a malformed row makes the read unknown rather than crashing or passing junk through', async () => {
    const bad = fakeHygieiaClient(() =>
      okWith([{ ...INGREDIENT_ROW('x', 'i'), kcal_100g: 'lots' }]),
    )
    expect(await supabaseSource(bad.client).listIngredients()).toEqual({
      ok: false,
      error: 'unknown',
    })
    const badStatus = fakeHygieiaClient(() =>
      okWith([{ ...INGREDIENT_ROW('x', 'i'), status: 'draft' }]),
    )
    expect(await supabaseSource(badStatus.client).listIngredients()).toEqual({
      ok: false,
      error: 'unknown',
    })
    expect(toRecipe({ ...RECIPE_ROW, recipe_ingredients: 'nope' })).toBeNull()
    expect(toRecipe({ ...RECIPE_ROW, steps_el: 'not an array' })).toBeNull()
  })

  it('classifyError: TypeError → network, Error → unknown, code-less object → network', () => {
    expect(classifyError(new TypeError('x'))).toBe('network')
    expect(classifyError(new Error('x'))).toBe('unknown')
    expect(classifyError({ message: 'x' })).toBe('network')
    expect(classifyError({ message: 'x', code: 'PGRST116' })).toBe('unknown')
    expect(classifyError('string')).toBe('unknown')
  })

  it('contentClientFor pins list (no maybeSingle) and one (maybeSingle)', async () => {
    const fake = fakeHygieiaClient(() => okWith([]))
    const adapter = contentClientFor(fake.client)
    await adapter.list('diets', '*', [['status', 'approved']])
    await adapter.one('diets', '*', [
      ['status', 'approved'],
      ['slug', 'vegan'],
    ])
    expect(fake.calls.map((c) => [c.table, c.single, c.filters.length])).toEqual([
      ['diets', false, 1],
      ['diets', true, 2],
    ])
  })
})

// --- the contract both implementations satisfy -----------------------------------------------------

describe('ContentSource contract', () => {
  // Like PostgREST: a list chain answers an array, a `maybeSingle()` chain answers one row or null.
  const sources: ContentSource[] = [
    bundledSource,
    supabaseSource(fakeHygieiaClient((call) => okWith(call.single ? null : [])).client),
  ]
  it.each(sources.map((s) => [s.kind, s] as const))('%s never rejects', async (_kind, source) => {
    const results = await Promise.all([
      source.listIngredients(),
      source.listDiets(),
      source.listRecipes(),
      source.getRecipe('no-such'),
      source.listExercises(),
      source.listWorkoutTemplates(),
      source.getWorkoutTemplate('home', 'beginner', 'low'),
      source.listTips(),
    ])
    for (const r of results) expect(r.ok).toBe(true)
  })
})
