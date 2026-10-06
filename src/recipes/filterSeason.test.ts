// RECIPE FILTER — the season criteria (2026-10-06): `?ingredient=` (any-of ingredient slugs, the
// season strip's chips) and `?season=now` (≥ SEASON_MIN_MATCHES distinct in-season ingredients,
// most seasonal first via `boostInSeason`). The base criteria are covered by ./filter.test.ts.

import { describe, expect, it } from 'vitest'
import { inSeasonSlugs } from '../content/seasonal'
import type { RecipeSeed } from '../content/types'
import { OVERLAID_SEED } from '../test/overlaidSeed'
import {
  SEASON_MIN_MATCHES,
  boostInSeason,
  filterRecipes,
  inSeasonCount,
  isEmptyRecipeFilter,
  parseRecipeFilterParams,
  serializeRecipeFilterParams,
  sortRecipes,
} from './filter'

function recipe(slug: string, ingredients: string[]): RecipeSeed {
  return {
    slug,
    title_el: `σ ${slug}`,
    title_en: `r ${slug}`,
    steps_el: ['β'],
    steps_en: ['s'],
    portions: 2,
    prep_min: 10,
    meal_types: ['lunch'],
    image_path: null,
    ingredients: ingredients.map((ingredient_slug) => ({
      ingredient_slug,
      quantity: 1,
      unit: 'g' as const,
    })),
    diet_slugs: [],
  }
}

const NONE = recipe('none', ['salt', 'rice'])
const ONE = recipe('one', ['pumpkin', 'rice'])
const TWO = recipe('two', ['pumpkin', 'leek', 'rice'])
const THREE = recipe('three', ['pumpkin', 'leek', 'cabbage'])
/** One in-season ingredient on two lines still counts once. */
const DOUBLE = recipe('double', ['pumpkin', 'pumpkin', 'salt'])
const ALL = [NONE, ONE, TWO, THREE, DOUBLE]
const SEASON: ReadonlySet<string> = new Set(['pumpkin', 'leek', 'cabbage'])

describe('inSeasonCount', () => {
  it('counts DISTINCT in-season ingredients', () => {
    expect(ALL.map((r) => inSeasonCount(r, SEASON))).toEqual([0, 1, 2, 3, 1])
  })
})

describe('filterRecipes — ingredient', () => {
  it('keeps recipes using ANY requested ingredient, in input order', () => {
    expect(filterRecipes(ALL, { lang: 'en', ingredientSlugs: ['leek'] })).toEqual([TWO, THREE])
    expect(filterRecipes(ALL, { lang: 'en', ingredientSlugs: ['cabbage', 'salt'] })).toEqual([
      NONE,
      THREE,
      DOUBLE,
    ])
  })
  it('an empty list narrows nothing', () => {
    expect(filterRecipes(ALL, { lang: 'en', ingredientSlugs: [] })).toEqual(ALL)
  })
})

describe('filterRecipes — season', () => {
  it(`keeps recipes with ≥ ${SEASON_MIN_MATCHES} distinct in-season ingredients`, () => {
    expect(SEASON_MIN_MATCHES).toBe(2)
    expect(filterRecipes(ALL, { lang: 'en', season: true, inSeasonSlugs: SEASON })).toEqual([
      TWO,
      THREE,
    ])
  })
  it('narrows nothing without the in-season set (calendar not loaded yet) or when off', () => {
    expect(filterRecipes(ALL, { lang: 'en', season: true })).toEqual(ALL)
    expect(filterRecipes(ALL, { lang: 'en', season: false, inSeasonSlugs: SEASON })).toEqual(ALL)
  })
  it('combines with the other criteria as all-of', () => {
    expect(
      filterRecipes(ALL, {
        lang: 'en',
        season: true,
        inSeasonSlugs: SEASON,
        ingredientSlugs: ['cabbage'],
      }),
    ).toEqual([THREE])
  })
})

describe('boostInSeason', () => {
  it('orders by in-season count descending, ties keep input order, input untouched', () => {
    const input = [NONE, TWO, ONE, THREE, DOUBLE]
    const before = [...input]
    expect(boostInSeason(input, SEASON)).toEqual([THREE, TWO, ONE, DOUBLE, NONE])
    expect(input).toEqual(before)
  })
})

describe('season URL params', () => {
  it('parses ?ingredient= lists and ?season=now; drops junk', () => {
    const p = parseRecipeFilterParams(
      new URLSearchParams('ingredient=okra,Bad Slug&ingredient=leek,okra&season=now'),
    )
    expect(p.ingredientSlugs).toEqual(['okra', 'leek'])
    expect(p.season).toBe(true)
    expect(parseRecipeFilterParams(new URLSearchParams('season=later')).season).toBeUndefined()
  })
  it('leaves the keys absent when not in the URL (old canonical filters unchanged)', () => {
    expect(parseRecipeFilterParams(new URLSearchParams('diet=vegan'))).toEqual({
      dietSlugs: ['vegan'],
      mealTypes: [],
      query: '',
    })
  })
  it('serializes and round-trips', () => {
    const params = {
      dietSlugs: ['fasting'],
      mealTypes: [],
      query: '',
      ingredientSlugs: ['pumpkin'],
      season: true,
    }
    const out = serializeRecipeFilterParams(params)
    expect(out.toString()).toBe('diet=fasting&ingredient=pumpkin&season=now')
    expect(parseRecipeFilterParams(out)).toEqual(params)
  })
  it('isEmptyRecipeFilter sees both new criteria', () => {
    expect(isEmptyRecipeFilter({ ingredientSlugs: ['okra'] })).toBe(false)
    expect(isEmptyRecipeFilter({ season: true })).toBe(false)
    expect(isEmptyRecipeFilter({ ingredientSlugs: [], season: false })).toBe(true)
  })
})

describe('season on the served catalogue', () => {
  it('October: every kept recipe has ≥ 2 in-season ingredients; the most seasonal come first', () => {
    const oct = inSeasonSlugs(10)
    const kept = boostInSeason(
      sortRecipes(
        filterRecipes(OVERLAID_SEED.recipes, { lang: 'en', season: true, inSeasonSlugs: oct }),
        'en',
      ),
      oct,
    )
    expect(kept.length).toBeGreaterThan(5)
    expect(kept.length).toBeLessThan(OVERLAID_SEED.recipes.length / 2)
    const counts = kept.map((r) => inSeasonCount(r, oct))
    for (const n of counts) expect(n).toBeGreaterThanOrEqual(2)
    expect([...counts].sort((a, b) => b - a)).toEqual(counts)
  })
})
