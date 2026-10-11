// RECIPE FILTER — the nutrient criterion (2026-10-11): `?nutrient=iron,folate` keeps recipes where
// one portion is at least a source (≥ 15 % NRV) of ANY of them. The base criteria are covered by
// ./filter.test.ts, the season ones by ./filterSeason.test.ts, the engine by nutrition/nutrients.test.ts.

import { describe, expect, it } from 'vitest'
import type { IngredientSeed, RecipeSeed } from '../content/types'
import { indexBySlug } from '../fridge/match'
import { isSourceOf } from '../nutrition/nutrients'
import { OVERLAID_SEED } from '../test/overlaidSeed'
import {
  filterRecipes,
  isEmptyRecipeFilter,
  parseRecipeFilterParams,
  serializeRecipeFilterParams,
} from './filter'

const BY_SLUG: ReadonlyMap<string, IngredientSeed> = indexBySlug(OVERLAID_SEED.ingredients)

function recipe(slug: string, lines: [string, number][], diet_slugs: string[] = []): RecipeSeed {
  return {
    slug,
    title_el: `σ ${slug}`,
    title_en: `r ${slug}`,
    steps_el: ['β'],
    steps_en: ['s'],
    portions: 1,
    prep_min: 10,
    meal_types: ['lunch'],
    image_path: null,
    ingredients: lines.map(([ingredient_slug, quantity]) => ({
      ingredient_slug,
      quantity,
      unit: 'g' as const,
    })),
    diet_slugs,
  }
}

// One portion each, real table values (USDA FDC):
//   lentils 100 g dry → iron 6.51 mg (46 %), folate 479 µg → iron + folate
//   feta 100 g → calcium 493 mg (62 %), folate 32 µg (16 %) → calcium + folate (iron 0.65 mg = 5 %)
//   salmon 100 g → vitamin D 11 µg (220 %) → vitamin D only
//   rice + salt → nothing
const LENTILS = recipe('lentils', [['lentils', 100]], ['vegan'])
const FETA = recipe('feta', [['feta', 100]], ['vegetarian'])
const SALMON = recipe('salmon', [['salmon', 100]])
const PLAIN = recipe('plain', [
  ['rice', 100],
  ['salt', 2],
])
const ALL = [LENTILS, FETA, SALMON, PLAIN]
const slugs = (rs: readonly RecipeSeed[]) => rs.map((r) => r.slug)

describe('filterRecipes — nutrients', () => {
  it('keeps the recipes a portion of which is a source of the nutrient', () => {
    const base = { lang: 'en' as const, ingredientsBySlug: BY_SLUG }
    expect(slugs(filterRecipes(ALL, { ...base, nutrients: ['iron'] }))).toEqual(['lentils'])
    expect(slugs(filterRecipes(ALL, { ...base, nutrients: ['calcium'] }))).toEqual(['feta'])
    expect(slugs(filterRecipes(ALL, { ...base, nutrients: ['vitamin-d'] }))).toEqual(['salmon'])
    expect(slugs(filterRecipes(ALL, { ...base, nutrients: ['folate'] }))).toEqual([
      'lentils',
      'feta',
    ])
  })

  it('is any-of within the criterion and all-of with the others', () => {
    const base = { lang: 'en' as const, ingredientsBySlug: BY_SLUG }
    expect(slugs(filterRecipes(ALL, { ...base, nutrients: ['calcium', 'vitamin-d'] }))).toEqual([
      'feta',
      'salmon',
    ])
    expect(
      slugs(filterRecipes(ALL, { ...base, nutrients: ['calcium', 'iron'], dietSlugs: ['vegan'] })),
    ).toEqual(['lentils'])
  })

  it('narrows nothing when the list is empty, and admits nothing without the ingredient catalogue', () => {
    expect(
      slugs(filterRecipes(ALL, { lang: 'en', nutrients: [], ingredientsBySlug: BY_SLUG })),
    ).toEqual(slugs(ALL))
    expect(filterRecipes(ALL, { lang: 'en', nutrients: ['iron'] })).toEqual([])
  })

  it('on the seed as served, equals the engine per recipe', () => {
    const got = filterRecipes(OVERLAID_SEED.recipes, {
      lang: 'en',
      nutrients: ['calcium'],
      ingredientsBySlug: BY_SLUG,
    })
    const want = OVERLAID_SEED.recipes.filter((r) => isSourceOf(r, BY_SLUG, 'calcium'))
    expect(slugs(got)).toEqual(slugs(want))
    expect(got.length).toBeGreaterThan(0)
  })
})

describe('?nutrient= URL codec', () => {
  it('parses the contract values, dropping unknown tokens and duplicates', () => {
    const params = parseRecipeFilterParams(
      new URLSearchParams('nutrient=iron,vitamin-c,folate,iron,Calcium&nutrient=vitamin-d'),
    )
    expect(params.nutrients).toEqual(['iron', 'folate', 'vitamin-d'])
  })

  it('omits the key when nothing valid is given, so an old URL stays canonical', () => {
    expect(parseRecipeFilterParams(new URLSearchParams('nutrient=zinc'))).toEqual({
      dietSlugs: [],
      mealTypes: [],
      query: '',
    })
  })

  it('round-trips and combines with the other keys', () => {
    const params = {
      dietSlugs: ['vegan'],
      mealTypes: [],
      query: '',
      nutrients: ['iron' as const, 'calcium' as const],
    }
    const out = serializeRecipeFilterParams(params)
    expect(out.toString()).toBe('diet=vegan&nutrient=iron%2Ccalcium')
    expect(parseRecipeFilterParams(out)).toEqual(params)
  })

  it('counts as a non-empty filter (so "Clear filters" shows)', () => {
    expect(isEmptyRecipeFilter({ nutrients: ['folate'] })).toBe(false)
    expect(isEmptyRecipeFilter({ nutrients: [] })).toBe(true)
  })
})
