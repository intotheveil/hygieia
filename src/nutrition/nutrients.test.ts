// MICRONUTRIENT ENGINE (women's nutrition layer, 2026-10-11): hand-computed fixtures for the
// per-portion amounts and the source/high thresholds, the contract list, and the real table against
// the seed as served (every slug resolves; every nutrient has enough qualifying recipes that the
// `?nutrient=` filter is never empty).

import { describe, expect, it } from 'vitest'
import type { IngredientSeed, RecipeSeed } from '../content/types'
import { indexBySlug } from '../fridge/match'
import { OVERLAID_SEED } from '../test/overlaidSeed'
import {
  HIGH_THRESHOLD,
  NRV,
  NUTRIENTS,
  NUTRIENT_CONTENT_100G,
  NUTRIENT_UNIT,
  SOURCE_THRESHOLD,
  computeNutrients,
  isNutrient,
  isSourceOf,
  nrvShare,
  nutrientClaims,
  nutrientLevel,
  type NutrientContent,
} from './nutrients'

function ingredient(slug: string, extra: Partial<IngredientSeed> = {}): IngredientSeed {
  return {
    slug,
    name_el: slug,
    name_en: slug,
    category: 'test',
    unit: 'g',
    grams_per_unit: 1,
    kcal_100g: 0,
    protein_100g: 0,
    carbs_100g: 0,
    fat_100g: 0,
    source_note: 'test',
    price_eur_min: 0,
    price_eur_max: 0,
    price_per: 'kg',
    price_as_of: '2026-10-05',
    price_note: '',
    substitute_slugs: [],
    is_pantry_staple: false,
    ...extra,
  }
}

function recipe(ingredients: RecipeSeed['ingredients'], portions = 2): RecipeSeed {
  return {
    slug: 'r',
    title_el: 'Ρ',
    title_en: 'R',
    steps_el: ['β'],
    steps_en: ['s'],
    portions,
    prep_min: 10,
    meal_types: ['lunch'],
    image_path: null,
    ingredients,
    diet_slugs: [],
  }
}

// Fixture table: round numbers so every expectation below is computable by hand.
const TABLE: Record<string, NutrientContent> = {
  leaf: { iron: 2.8, calcium: 100, source: 'fixture' },
  egg: { 'vitamin-d': 2, folate: 50, source: 'fixture' },
  liver: { iron: 9, folate: 300, source: 'fixture' },
}
const LEAF = ingredient('leaf')
const EGG = ingredient('egg', { unit: 'piece', grams_per_unit: 50 })
const LIVER = ingredient('liver')
const SALT = ingredient('salt')
const CATALOGUE = indexBySlug([LEAF, EGG, LIVER, SALT])

describe('NUTRIENTS contract', () => {
  it('is exactly the four URL values other lanes link to', () => {
    expect(NUTRIENTS).toEqual(['iron', 'calcium', 'vitamin-d', 'folate'])
    for (const n of NUTRIENTS) expect(isNutrient(n)).toBe(true)
    expect(isNutrient('vitamin-c')).toBe(false)
    expect(isNutrient('Iron')).toBe(false)
  })

  it('uses the EU NRVs of Reg. 1169/2011 Annex XIII and the 15 % / 30 % thresholds', () => {
    expect(NRV).toEqual({ iron: 14, calcium: 800, 'vitamin-d': 5, folate: 200 })
    expect(NUTRIENT_UNIT).toEqual({ iron: 'mg', calcium: 'mg', 'vitamin-d': 'µg', folate: 'µg' })
    expect(SOURCE_THRESHOLD).toBe(0.15)
    expect(HIGH_THRESHOLD).toBe(0.3)
  })
})

describe('computeNutrients', () => {
  it('sums per-100 g content over line grams (piece → grams_per_unit) and divides by portions', () => {
    // 200 g leaf + 2 eggs (2 × 50 g = 100 g), 2 portions.
    const r = recipe([
      { ingredient_slug: 'leaf', quantity: 200, unit: 'g' },
      { ingredient_slug: 'egg', quantity: 2, unit: 'piece' },
    ])
    const result = computeNutrients(r, CATALOGUE, TABLE)
    expect(result.portions).toBe(2)
    // leaf: iron 2.8 × 2 = 5.6, calcium 100 × 2 = 200; egg: vit D 2 × 1 = 2, folate 50 × 1 = 50.
    expect(result.perRecipe.iron).toBeCloseTo(5.6, 10)
    expect(result.perRecipe.calcium).toBeCloseTo(200, 10)
    expect(result.perRecipe['vitamin-d']).toBeCloseTo(2, 10)
    expect(result.perRecipe.folate).toBeCloseTo(50, 10)
    expect(result.perPortion.iron).toBeCloseTo(2.8, 10)
    expect(result.perPortion.calcium).toBeCloseTo(100, 10)
    expect(result.perPortion['vitamin-d']).toBeCloseTo(1, 10)
    expect(result.perPortion.folate).toBeCloseTo(25, 10)
  })

  it('counts an ingredient missing from the table, or an unknown line, as 0', () => {
    const r = recipe(
      [
        { ingredient_slug: 'salt', quantity: 500, unit: 'g' },
        { ingredient_slug: 'no-such-slug', quantity: 500, unit: 'g' },
      ],
      1,
    )
    expect(computeNutrients(r, CATALOGUE, TABLE).perRecipe).toEqual({
      iron: 0,
      calcium: 0,
      'vitamin-d': 0,
      folate: 0,
    })
  })

  it('never takes a table entry from the prototype chain', () => {
    const r = recipe([{ ingredient_slug: 'constructor', quantity: 100, unit: 'g' }], 1)
    const result = computeNutrients(r, indexBySlug([ingredient('constructor')]), TABLE)
    expect(result.perRecipe.iron).toBe(0)
  })

  it('guards portions like computeNutrition (0 → 1)', () => {
    const r = recipe([{ ingredient_slug: 'liver', quantity: 100, unit: 'g' }], 0)
    const result = computeNutrients(r, CATALOGUE, TABLE)
    expect(result.portions).toBe(1)
    expect(result.perPortion.iron).toBeCloseTo(9, 10)
  })
})

describe('nutrientLevel / nutrientClaims', () => {
  it('is null below 15 %, source from 15 %, high from 30 % of the NRV', () => {
    // Iron NRV 14 mg: 15 % = 2.1 mg, 30 % = 4.2 mg.
    expect(nutrientLevel('iron', 2.09)).toBeNull()
    expect(nutrientLevel('iron', 2.1)).toBe('source')
    expect(nutrientLevel('iron', 4.19)).toBe('source')
    expect(nutrientLevel('iron', 4.2)).toBe('high')
    // Calcium NRV 800 mg: 120 / 240. Vitamin D 5 µg: 0.75 / 1.5. Folate 200 µg: 30 / 60.
    expect(nutrientLevel('calcium', 119)).toBeNull()
    expect(nutrientLevel('calcium', 120)).toBe('source')
    expect(nutrientLevel('calcium', 240)).toBe('high')
    expect(nutrientLevel('vitamin-d', 0.75)).toBe('source')
    expect(nutrientLevel('vitamin-d', 1.5)).toBe('high')
    expect(nutrientLevel('folate', 29.9)).toBeNull()
    expect(nutrientLevel('folate', 60)).toBe('high')
    expect(nrvShare('calcium', 200)).toBeCloseTo(0.25, 10)
  })

  it('lists the qualifying nutrients in NUTRIENTS order with amount and share', () => {
    // Per portion: 100 g leaf + 100 g liver + 1 egg, 1 portion →
    //   iron 2.8 + 9 = 11.8 mg (84 %, high); calcium 100 mg (12.5 %, none);
    //   vitamin D 1 µg (20 %, source); folate 300 + 25 = 325 µg (162.5 %, high).
    const r = recipe(
      [
        { ingredient_slug: 'leaf', quantity: 100, unit: 'g' },
        { ingredient_slug: 'liver', quantity: 100, unit: 'g' },
        { ingredient_slug: 'egg', quantity: 1, unit: 'piece' },
      ],
      1,
    )
    const claims = nutrientClaims(computeNutrients(r, CATALOGUE, TABLE))
    expect(claims.map((c) => [c.nutrient, c.level])).toEqual([
      ['iron', 'high'],
      ['vitamin-d', 'source'],
      ['folate', 'high'],
    ])
    expect(claims[0]!.amount).toBeCloseTo(11.8, 10)
    expect(claims[0]!.share).toBeCloseTo(11.8 / 14, 10)
    expect(claims[2]!.amount).toBeCloseTo(325, 10)
  })
})

// --- the real table against the seed as served ----------------------------------------------------

const INGREDIENTS_BY_SLUG = indexBySlug(OVERLAID_SEED.ingredients)

describe('NUTRIENT_CONTENT_100G', () => {
  const entries = Object.entries(NUTRIENT_CONTENT_100G)

  it('keys every entry by an ingredient slug the seed actually has', () => {
    const missing = entries.map(([slug]) => slug).filter((slug) => !INGREDIENTS_BY_SLUG.has(slug))
    expect(missing).toEqual([])
  })

  it('names its USDA FoodData Central row and holds plausible per-100 g figures', () => {
    // Upper bounds well above any whole food (sesame iron 14.6 mg, parmesan calcium 1 184 mg,
    // smoked salmon vitamin D 17 µg, chicken liver folate 588 µg): a typo by 10× trips them.
    const MAX = { iron: 20, calcium: 1300, 'vitamin-d': 25, folate: 700 } as const
    for (const [slug, content] of entries) {
      expect(content.source, slug).toMatch(/^USDA FoodData Central SR Legacy, FDC \d{6}/)
      for (const n of NUTRIENTS) {
        const value = content[n]
        if (value === undefined) continue
        expect(
          Number.isFinite(value) && value >= 0 && value <= MAX[n],
          `${slug}.${n}=${value}`,
        ).toBe(true)
      }
    }
  })

  it('assumes no vitamin D in milk beyond the unfortified figure and almost none in mushrooms', () => {
    expect(NUTRIENT_CONTENT_100G.milk!['vitamin-d']).toBeLessThanOrEqual(0.1)
    expect(NUTRIENT_CONTENT_100G['semi-skimmed-milk']!['vitamin-d'] ?? 0).toBe(0)
    expect(NUTRIENT_CONTENT_100G.mushrooms!['vitamin-d']).toBeLessThanOrEqual(0.2)
  })
})

describe('seed coverage (the ?nutrient= filter is never empty)', () => {
  const counts = Object.fromEntries(
    NUTRIENTS.map((n) => [
      n,
      OVERLAID_SEED.recipes.filter((r) => isSourceOf(r, INGREDIENTS_BY_SLUG, n)).length,
    ]),
  ) as Record<(typeof NUTRIENTS)[number], number>

  it.each(NUTRIENTS)('%s: at least 8 recipes are a source per portion', (nutrient) => {
    expect(counts[nutrient]).toBeGreaterThanOrEqual(8)
  })

  it('a known dish qualifies as expected (fasolada: dry white beans → iron and folate)', () => {
    const fasolada = OVERLAID_SEED.recipes.find((r) => r.slug === 'fasolada-white-bean-soup')!
    expect(isSourceOf(fasolada, INGREDIENTS_BY_SLUG, 'iron')).toBe(true)
    expect(isSourceOf(fasolada, INGREDIENTS_BY_SLUG, 'folate')).toBe(true)
  })
})
