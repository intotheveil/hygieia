import type { IngredientSeed, RecipeSeed } from '../content/types'
import { basisQuantity, computeCost, safePortions } from './compute'

// --- fixtures (hand-written; the seed data arrives in P1.9) ---------------------------------------

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

const TOMATO = ingredient('tomato', {
  price_eur_min: 1.5,
  price_eur_max: 2.5,
  price_per: 'kg',
  price_as_of: '2026-09-01',
})
const OLIVE_OIL = ingredient('olive-oil', {
  unit: 'ml',
  price_eur_min: 8,
  price_eur_max: 12,
  price_per: 'l',
  price_as_of: '2026-10-01',
})
const EGG = ingredient('egg', {
  unit: 'piece',
  grams_per_unit: 50,
  price_eur_min: 0.3,
  price_eur_max: 0.5,
  price_per: 'piece',
  price_as_of: '2026-08-15',
})
const WATER = ingredient('water', {
  unit: 'ml',
  price_eur_min: 0,
  price_eur_max: 0,
  price_per: 'l',
})
const FETA = ingredient('feta', {
  price_eur_min: 9,
  price_eur_max: 14,
  price_per: 'kg',
  price_as_of: '2026-09-20',
})

const BY_SLUG = new Map([TOMATO, OLIVE_OIL, EGG, WATER, FETA].map((i) => [i.slug, i]))

// --- engine ------------------------------------------------------------------------------------------

describe('computeCost', () => {
  it('a known 3-line recipe gives the expected min/max', () => {
    // 500 g tomato → 0.5 kg × (1.5..2.5) = 0.75..1.25
    // 30 ml olive oil → 0.03 l × (8..12)   = 0.24..0.36
    // 2 eggs           → 2 × (0.3..0.5)     = 0.60..1.00
    //                                   total 1.59..2.61
    const r = recipe([
      { ingredient_slug: 'tomato', quantity: 500, unit: 'g' },
      { ingredient_slug: 'olive-oil', quantity: 30, unit: 'ml' },
      { ingredient_slug: 'egg', quantity: 2, unit: 'piece' },
    ])
    const c = computeCost(r, BY_SLUG)
    expect(c.perRecipe.min).toBeCloseTo(1.59, 10)
    expect(c.perRecipe.max).toBeCloseTo(2.61, 10)
    expect(c.unpriced).toEqual([])
    expect(c.lines.map((l) => l.slug)).toEqual(['tomato', 'olive-oil', 'egg'])
    expect(c.lines[2]).toEqual({ slug: 'egg', min: 0.6, max: 1 })
  })

  it('asOf is the OLDEST price_as_of among priced lines', () => {
    const r = recipe([
      { ingredient_slug: 'olive-oil', quantity: 30, unit: 'ml' }, // 2026-10-01
      { ingredient_slug: 'tomato', quantity: 500, unit: 'g' }, // 2026-09-01
      { ingredient_slug: 'egg', quantity: 2, unit: 'piece' }, // 2026-08-15 ← oldest
    ])
    expect(computeCost(r, BY_SLUG).asOf).toBe('2026-08-15')
  })

  it('asOf ignores unpriced lines and is null when nothing is priced', () => {
    const stale = ingredient('stale', { price_eur_max: 0, price_as_of: '2000-01-01' })
    const bySlug = new Map(BY_SLUG)
    bySlug.set('stale', stale)
    const r = recipe([
      { ingredient_slug: 'stale', quantity: 100, unit: 'g' },
      { ingredient_slug: 'tomato', quantity: 100, unit: 'g' },
    ])
    expect(computeCost(r, bySlug).asOf).toBe('2026-09-01')
    expect(
      computeCost(recipe([{ ingredient_slug: 'water', quantity: 1, unit: 'ml' }]), BY_SLUG).asOf,
    ).toBeNull()
  })

  it('an unpriced line is reported, not silently zeroed', () => {
    const r = recipe([
      { ingredient_slug: 'tomato', quantity: 1000, unit: 'g' },
      { ingredient_slug: 'water', quantity: 200, unit: 'ml' },
      { ingredient_slug: 'unicorn', quantity: 1, unit: 'piece' },
    ])
    const c = computeCost(r, BY_SLUG)
    expect(c.unpriced).toEqual(['water', 'unicorn'])
    expect(c.lines.map((l) => l.slug)).toEqual(['tomato'])
    expect(c.perRecipe).toEqual({ min: 1.5, max: 2.5 })
  })

  it('divides per portion by recipe.portions', () => {
    const r = recipe([{ ingredient_slug: 'tomato', quantity: 1000, unit: 'g' }], 4)
    const c = computeCost(r, BY_SLUG)
    expect(c.portions).toBe(4)
    expect(c.perPortion).toEqual({ min: 0.375, max: 0.625 })
  })

  it('converts ml to the l basis', () => {
    const r = recipe([{ ingredient_slug: 'olive-oil', quantity: 250, unit: 'ml' }], 1)
    const c = computeCost(r, BY_SLUG)
    expect(c.perRecipe.min).toBeCloseTo(2, 10)
    expect(c.perRecipe.max).toBeCloseTo(3, 10)
  })

  it('a piece-priced ingredient given by weight derives pieces from grams_per_unit', () => {
    // 150 g of 50 g eggs = 3 eggs → 0.9..1.5
    const r = recipe([{ ingredient_slug: 'egg', quantity: 150, unit: 'g' }], 1)
    const c = computeCost(r, BY_SLUG)
    expect(c.perRecipe.min).toBeCloseTo(0.9, 10)
    expect(c.perRecipe.max).toBeCloseTo(1.5, 10)
  })

  it('a kg-priced ingredient given in pieces converts through grams_per_unit', () => {
    // feta "slice" lines: ingredient unit is g (grams_per_unit 1) → 1 g per slice, as specified.
    const block = ingredient('feta-block', {
      unit: 'piece',
      grams_per_unit: 200,
      price_eur_min: 9,
      price_eur_max: 14,
      price_per: 'kg',
    })
    const bySlug = new Map(BY_SLUG)
    bySlug.set('feta-block', block)
    const r = recipe([{ ingredient_slug: 'feta-block', quantity: 1, unit: 'piece' }], 1)
    const c = computeCost(r, bySlug)
    expect(c.perRecipe.min).toBeCloseTo(1.8, 10)
    expect(c.perRecipe.max).toBeCloseTo(2.8, 10)
  })

  it('never divides by zero', () => {
    const r = recipe([{ ingredient_slug: 'tomato', quantity: 1000, unit: 'g' }], 0)
    const c = computeCost(r, BY_SLUG)
    expect(c.portions).toBe(1)
    expect(c.perPortion).toEqual({ min: 1.5, max: 2.5 })
  })

  it('an empty recipe is zero with no asOf', () => {
    expect(computeCost(recipe([]), BY_SLUG)).toEqual({
      perRecipe: { min: 0, max: 0 },
      perPortion: { min: 0, max: 0 },
      portions: 2,
      asOf: null,
      unpriced: [],
      lines: [],
    })
  })
})

describe('helpers', () => {
  it('basisQuantity per price_per', () => {
    expect(basisQuantity({ ingredient_slug: 'tomato', quantity: 250, unit: 'g' }, TOMATO)).toBe(
      0.25,
    )
    expect(
      basisQuantity({ ingredient_slug: 'olive-oil', quantity: 500, unit: 'ml' }, OLIVE_OIL),
    ).toBe(0.5)
    expect(basisQuantity({ ingredient_slug: 'egg', quantity: 3, unit: 'piece' }, EGG)).toBe(3)
    expect(basisQuantity({ ingredient_slug: 'egg', quantity: 100, unit: 'g' }, EGG)).toBe(2)
  })

  it('basisQuantity is null when it cannot be derived', () => {
    const broken = ingredient('broken', {
      unit: 'piece',
      grams_per_unit: 0,
      price_per: 'piece',
      price_eur_max: 1,
    })
    expect(
      basisQuantity({ ingredient_slug: 'broken', quantity: 100, unit: 'g' }, broken),
    ).toBeNull()
    expect(
      basisQuantity({ ingredient_slug: 'tomato', quantity: Number.NaN, unit: 'g' }, TOMATO),
    ).toBeNull()
    const bySlug = new Map(BY_SLUG)
    bySlug.set('broken', broken)
    const c = computeCost(recipe([{ ingredient_slug: 'broken', quantity: 100, unit: 'g' }]), bySlug)
    expect(c.unpriced).toEqual(['broken'])
  })

  it('safePortions guards 0, negatives and NaN', () => {
    expect(safePortions(3)).toBe(3)
    expect(safePortions(0)).toBe(1)
    expect(safePortions(-1)).toBe(1)
    expect(safePortions(Number.NaN)).toBe(1)
  })
})
