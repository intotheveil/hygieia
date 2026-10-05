import type { IngredientSeed, RecipeSeed } from '../content/types'
import { computeNutrition, gramsFor, lineGrams, safePortions } from './compute'

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
    source_note: 'Typical values, USDA FoodData Central reference ranges',
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

// Realistic macros (rice: 4·2.5 + 4·28 + 9·1 = 131 ≈ 130 kcal) so the Atwater check below means something.
const RICE = ingredient('rice', { kcal_100g: 130, protein_100g: 2.5, carbs_100g: 28, fat_100g: 1 })
const OLIVE_OIL = ingredient('olive-oil', {
  unit: 'ml',
  kcal_100g: 900,
  protein_100g: 0,
  carbs_100g: 0,
  fat_100g: 100,
  source_note: 'Typical values, producer label',
})
const EGG = ingredient('egg', {
  unit: 'piece',
  grams_per_unit: 50,
  kcal_100g: 155,
  protein_100g: 13,
  carbs_100g: 1.1,
  fat_100g: 11,
})
const FETA = ingredient('feta', {
  kcal_100g: 264,
  protein_100g: 14,
  carbs_100g: 4,
  fat_100g: 21,
})

const BY_SLUG = new Map([RICE, OLIVE_OIL, EGG, FETA].map((i) => [i.slug, i]))

// --- engine ------------------------------------------------------------------------------------------

describe('computeNutrition', () => {
  it('matches a hand-computed 2-ingredient recipe to 0.1 kcal', () => {
    // 150 g rice → 1.5 × 130 = 195 kcal; 20 ml olive oil → 0.2 × 900 = 180 kcal; total 375 kcal.
    // protein 1.5 × 2.5 = 3.75; carbs 1.5 × 28 = 42; fat 1.5 × 1 + 0.2 × 100 = 21.5
    const r = recipe([
      { ingredient_slug: 'rice', quantity: 150, unit: 'g' },
      { ingredient_slug: 'olive-oil', quantity: 20, unit: 'ml' },
    ])
    const n = computeNutrition(r, BY_SLUG)
    expect(n.perRecipe.kcal).toBeCloseTo(375, 1)
    expect(n.perRecipe.protein).toBeCloseTo(3.75, 6)
    expect(n.perRecipe.carbs).toBeCloseTo(42, 6)
    expect(n.perRecipe.fat).toBeCloseTo(21.5, 6)
    expect(n.unknown).toEqual([])
    expect(n.warnings).toEqual([])
  })

  it('divides per portion by recipe.portions', () => {
    const r = recipe([{ ingredient_slug: 'rice', quantity: 300, unit: 'g' }], 3)
    const n = computeNutrition(r, BY_SLUG)
    expect(n.portions).toBe(3)
    expect(n.perRecipe.kcal).toBeCloseTo(390, 6)
    expect(n.perPortion.kcal).toBeCloseTo(130, 6)
    expect(n.perPortion.carbs).toBeCloseTo(28, 6)
  })

  it('a piece unit uses the ingredient grams_per_unit', () => {
    // 2 eggs × 50 g = 100 g → exactly the per-100 g figures.
    const r = recipe([{ ingredient_slug: 'egg', quantity: 2, unit: 'piece' }], 1)
    const n = computeNutrition(r, BY_SLUG)
    expect(n.perRecipe).toEqual({ kcal: 155, protein: 13, carbs: 1.1, fat: 11 })
    expect(n.perPortion).toEqual(n.perRecipe)
    expect(n.warnings).toEqual([])
  })

  it('does not round (display rounds)', () => {
    const r = recipe([{ ingredient_slug: 'feta', quantity: 33, unit: 'g' }], 3)
    const n = computeNutrition(r, BY_SLUG)
    expect(n.perRecipe.kcal).toBeCloseTo(87.12, 10)
    expect(n.perPortion.kcal).toBeCloseTo(29.04, 10)
    expect(Number.isInteger(n.perPortion.kcal)).toBe(false)
  })

  it('Atwater sanity: 4·protein + 4·carbs + 9·fat is within 10% of kcal on the fixture', () => {
    const r = recipe([
      { ingredient_slug: 'rice', quantity: 150, unit: 'g' },
      { ingredient_slug: 'olive-oil', quantity: 20, unit: 'ml' },
      { ingredient_slug: 'egg', quantity: 2, unit: 'piece' },
      { ingredient_slug: 'feta', quantity: 50, unit: 'g' },
    ])
    const { perRecipe } = computeNutrition(r, BY_SLUG)
    const atwater = 4 * perRecipe.protein + 4 * perRecipe.carbs + 9 * perRecipe.fat
    expect(Math.abs(atwater - perRecipe.kcal) / perRecipe.kcal).toBeLessThan(0.1)
  })

  it('an unknown slug contributes nothing and is listed', () => {
    const r = recipe([
      { ingredient_slug: 'rice', quantity: 100, unit: 'g' },
      { ingredient_slug: 'unicorn', quantity: 100, unit: 'g' },
    ])
    const n = computeNutrition(r, BY_SLUG)
    expect(n.perRecipe.kcal).toBeCloseTo(130, 6)
    expect(n.unknown).toEqual(['unicorn'])
  })

  it('records a unitMismatch warning but still uses grams_per_unit', () => {
    // egg is a `piece` ingredient (50 g); the line says `slice` → still 50 g each, flagged.
    const r = recipe([{ ingredient_slug: 'egg', quantity: 1, unit: 'slice' }], 1)
    const n = computeNutrition(r, BY_SLUG)
    expect(n.perRecipe.kcal).toBeCloseTo(77.5, 6)
    expect(n.warnings).toHaveLength(1)
    expect(n.warnings[0]).toMatch(/^unitMismatch: egg /)
    expect(n.warnings[0]).toContain('"slice"')
    expect(n.warnings[0]).toContain('"piece"')
  })

  it('reports confidence and the distinct source notes in first-seen order', () => {
    const r = recipe([
      { ingredient_slug: 'rice', quantity: 100, unit: 'g' },
      { ingredient_slug: 'olive-oil', quantity: 10, unit: 'ml' },
      { ingredient_slug: 'feta', quantity: 10, unit: 'g' },
    ])
    const n = computeNutrition(r, BY_SLUG)
    expect(n.confidence).toBe('typical')
    expect(n.sourceNotes).toEqual([
      'Typical values, USDA FoodData Central reference ranges',
      'Typical values, producer label',
    ])
  })

  it('never divides by zero', () => {
    const r = recipe([{ ingredient_slug: 'rice', quantity: 100, unit: 'g' }], 0)
    const n = computeNutrition(r, BY_SLUG)
    expect(n.portions).toBe(1)
    expect(n.perPortion.kcal).toBeCloseTo(130, 6)
    expect(Number.isFinite(n.perPortion.kcal)).toBe(true)
  })

  it('an empty recipe is all zeros, not NaN', () => {
    const n = computeNutrition(recipe([]), BY_SLUG)
    expect(n.perRecipe).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 })
    expect(n.perPortion).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 })
    expect(n.sourceNotes).toEqual([])
  })
})

describe('helpers', () => {
  it('gramsFor: g/ml are 1, anything else is grams_per_unit', () => {
    expect(gramsFor(EGG, 'g')).toBe(1)
    expect(gramsFor(EGG, 'ml')).toBe(1)
    expect(gramsFor(EGG, 'piece')).toBe(50)
    expect(gramsFor(EGG, 'tbsp')).toBe(50)
  })

  it('lineGrams: g lines carry no warning even on a piece ingredient', () => {
    expect(lineGrams({ ingredient_slug: 'egg', quantity: 120, unit: 'g' }, EGG)).toEqual({
      grams: 120,
      warning: null,
    })
  })

  it('safePortions guards 0, negatives and NaN', () => {
    expect(safePortions(4)).toBe(4)
    expect(safePortions(0)).toBe(1)
    expect(safePortions(-2)).toBe(1)
    expect(safePortions(Number.NaN)).toBe(1)
    expect(safePortions(Number.POSITIVE_INFINITY)).toBe(1)
  })
})
