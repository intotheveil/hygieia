import {
  BLOCKS,
  CHILD_TABLES,
  CONTENT_STATUSES,
  CONTENT_TABLES,
  INTENSITIES,
  LEVELS,
  MEAL_TYPES,
  PRICE_PER,
  SLUG_RE,
  TIP_TOPICS,
  UNITS,
  USER_TABLES,
  WORKOUT_TYPES,
} from './enums'
import type { HealthTipRow, IngredientSeed, Localized, RecipeSeed } from './types'

describe('content enums (PLAN.md §2, literally — length AND order)', () => {
  it('units', () => {
    expect(UNITS).toEqual(['g', 'ml', 'piece', 'tbsp', 'tsp', 'slice', 'clove', 'bunch'])
    expect(UNITS).toHaveLength(8)
  })

  it('price units', () => {
    expect(PRICE_PER).toEqual(['kg', 'l', 'piece'])
    expect(PRICE_PER).toHaveLength(3)
  })

  it('workout types', () => {
    expect(WORKOUT_TYPES).toEqual([
      'home',
      'gym',
      'calisthenics',
      'running',
      'swimming',
      'cycling',
      'mobility',
    ])
    expect(WORKOUT_TYPES).toHaveLength(7)
  })

  it('levels, intensities, blocks', () => {
    expect(LEVELS).toEqual(['beginner', 'intermediate', 'advanced'])
    expect(INTENSITIES).toEqual(['low', 'moderate', 'high'])
    expect(BLOCKS).toEqual(['warmup', 'main', 'cooldown'])
  })

  it('meal types, tip topics, content statuses', () => {
    expect(MEAL_TYPES).toEqual(['breakfast', 'lunch', 'dinner', 'snack'])
    expect(TIP_TOPICS).toEqual(['sleep', 'hydration', 'nutrition', 'movement', 'habits', 'mental'])
    expect(CONTENT_STATUSES).toEqual(['pending', 'approved', 'rejected'])
  })

  it('has no duplicate literal in any enum array', () => {
    for (const arr of [
      UNITS,
      PRICE_PER,
      WORKOUT_TYPES,
      LEVELS,
      INTENSITIES,
      BLOCKS,
      MEAL_TYPES,
      TIP_TOPICS,
      CONTENT_STATUSES,
    ]) {
      expect(new Set(arr).size).toBe(arr.length)
    }
  })
})

describe('SLUG_RE', () => {
  it('accepts lower-case hyphen-separated slugs', () => {
    expect(SLUG_RE.test('greek-salad')).toBe(true)
    expect(SLUG_RE.test('feta')).toBe(true)
    expect(SLUG_RE.test('omega-3-salmon')).toBe(true)
  })

  it('rejects upper case, underscores and misplaced hyphens', () => {
    expect(SLUG_RE.test('Greek_Salad')).toBe(false)
    expect(SLUG_RE.test('-x')).toBe(false)
    expect(SLUG_RE.test('x-')).toBe(false)
    expect(SLUG_RE.test('a--b')).toBe(false)
    expect(SLUG_RE.test('')).toBe(false)
    expect(SLUG_RE.test('φέτα')).toBe(false)
  })
})

describe('table catalogue', () => {
  it('names the six status-bearing content tables', () => {
    expect(CONTENT_TABLES).toEqual([
      'ingredients',
      'diets',
      'recipes',
      'exercises',
      'workout_templates',
      'health_tips',
    ])
    expect(CONTENT_TABLES).toHaveLength(6)
  })

  it('names the child and per-user tables, with no overlap between the three lists', () => {
    expect(CHILD_TABLES).toEqual([
      'recipe_ingredients',
      'recipe_diets',
      'workout_template_exercises',
    ])
    expect(USER_TABLES).toEqual(['fridge_lists', 'saved_plans', 'favourites'])
    const all = [...CONTENT_TABLES, ...CHILD_TABLES, ...USER_TABLES]
    expect(new Set(all).size).toBe(all.length)
  })
})

describe('seed and row types (compile-time; the assertions below are what `tsc` checks)', () => {
  it('a seed object is a row minus the server-owned columns', () => {
    const feta = {
      slug: 'feta',
      name_el: 'Φέτα',
      name_en: 'Feta',
      category: 'dairy',
      unit: 'g',
      grams_per_unit: 1,
      kcal_100g: 264,
      protein_100g: 14,
      carbs_100g: 4,
      fat_100g: 21,
      source_note: 'Typical values, USDA FoodData Central reference ranges',
      price_eur_min: 9,
      price_eur_max: 14,
      price_per: 'kg',
      price_as_of: '2026-10-05',
      price_note: 'Greek supermarket range',
      substitute_slugs: ['ricotta'],
      is_pantry_staple: false,
    } satisfies IngredientSeed
    expectTypeOf(feta).not.toHaveProperty('id')
    expectTypeOf(feta).not.toHaveProperty('status')
    expectTypeOf<HealthTipRow>().toHaveProperty('status')
    expectTypeOf<HealthTipRow>().toHaveProperty('reviewed_by')
    expectTypeOf<HealthTipRow['status']>().toEqualTypeOf<'pending' | 'approved' | 'rejected'>()
  })

  it('Localized produces a same-row _el/_en pair and recipe children refer by slug', () => {
    expectTypeOf<Localized<'name'>>().toEqualTypeOf<{ name_el: string; name_en: string }>()
    expectTypeOf<RecipeSeed['ingredients'][number]['ingredient_slug']>().toBeString()
    expectTypeOf<RecipeSeed['diet_slugs']>().toEqualTypeOf<string[]>()
  })
})
