import type { MealType } from '../content/enums'
import type { IngredientSeed, RecipeSeed } from '../content/types'
import { indexBySlug } from '../fridge/match'
import { computeNutrition } from '../nutrition/compute'
import {
  PLAN_MEALS,
  generateWeekPlan,
  mulberry32,
  nextMonday,
  poolFor,
  shoppingListFor,
  type PlanMeal,
  type WeekPlan,
} from './generate'

// --- fixtures (hand-written; the recipes seed arrives in P1.11) -----------------------------------

function ingredient(slug: string, extra: Partial<IngredientSeed> = {}): IngredientSeed {
  return {
    slug,
    name_el: `ΕΛ ${slug}`,
    name_en: `EN ${slug}`,
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

const INGREDIENTS: IngredientSeed[] = [
  ingredient('oats', { kcal_100g: 380, protein_100g: 13, carbs_100g: 67, fat_100g: 7 }),
  ingredient('egg', {
    unit: 'piece',
    grams_per_unit: 50,
    kcal_100g: 143,
    protein_100g: 12.6,
    carbs_100g: 0.7,
    fat_100g: 9.5,
  }),
  ingredient('olive-oil', {
    unit: 'tbsp',
    grams_per_unit: 13.5,
    kcal_100g: 884,
    fat_100g: 100,
  }),
  ingredient('rice', { kcal_100g: 360, protein_100g: 7, carbs_100g: 80, fat_100g: 0.6 }),
  ingredient('chicken', { kcal_100g: 165, protein_100g: 31, fat_100g: 3.6 }),
]

function recipe(slug: string, meals: MealType[], extra: Partial<RecipeSeed> = {}): RecipeSeed {
  return {
    slug,
    title_el: `Τ ${slug}`,
    title_en: `T ${slug}`,
    steps_el: ['β'],
    steps_en: ['s'],
    portions: 2,
    prep_min: 10,
    meal_types: meals,
    image_path: null,
    ingredients: [
      { ingredient_slug: 'oats', quantity: 100, unit: 'g' },
      { ingredient_slug: 'egg', quantity: 1, unit: 'piece' },
    ],
    diet_slugs: ['keto'],
    ...extra,
  }
}

/** `n` recipes per meal, each tagged only with that meal. */
function corpus(perMeal: Record<PlanMeal, number>): RecipeSeed[] {
  const out: RecipeSeed[] = []
  for (const meal of PLAN_MEALS) {
    for (let i = 0; i < perMeal[meal]; i++) out.push(recipe(`${meal}-${i}`, [meal]))
  }
  return out
}

const BIG = corpus({ breakfast: 6, lunch: 6, dinner: 6 })
const FOUR = corpus({ breakfast: 4, lunch: 4, dinner: 4 })

function slugsFor(plan: WeekPlan, meal: PlanMeal): (string | null)[] {
  return plan.days.map((day) => day.slots[meal]?.slug ?? null)
}

/** Deterministic Fisher–Yates on a copy, so "input order" tests are reproducible. */
function shuffled<T>(items: readonly T[], seed: number): T[] {
  const rng = mulberry32(seed)
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j] as T, out[i] as T]
  }
  return out
}

// --- mulberry32 ----------------------------------------------------------------------------------

describe('mulberry32', () => {
  it('yields the same sequence for the same seed', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    const seqA = Array.from({ length: 20 }, () => a())
    const seqB = Array.from({ length: 20 }, () => b())
    expect(seqA).toEqual(seqB)
  })

  it('yields a different sequence for a different seed, all values in [0, 1)', () => {
    const a = mulberry32(1)
    const b = mulberry32(2)
    const seqA = Array.from({ length: 20 }, () => a())
    const seqB = Array.from({ length: 20 }, () => b())
    expect(seqA).not.toEqual(seqB)
    for (const x of [...seqA, ...seqB]) {
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThan(1)
    }
  })
})

// --- determinism ---------------------------------------------------------------------------------

describe('generateWeekPlan — determinism', () => {
  it('same inputs + seed → deep-equal plan', () => {
    const a = generateWeekPlan('keto', BIG, INGREDIENTS, { seed: 7 })
    const b = generateWeekPlan('keto', BIG, INGREDIENTS, { seed: 7 })
    expect(a).toEqual(b)
    expect(a.seed).toBe(7)
  })

  it('different seed → different plan when the pool allows', () => {
    const a = generateWeekPlan('keto', BIG, INGREDIENTS, { seed: 1 })
    const b = generateWeekPlan('keto', BIG, INGREDIENTS, { seed: 2 })
    expect(a.days.map((d) => d.slots)).not.toEqual(b.days.map((d) => d.slots))
  })

  it('is independent of the recipe input order (shuffled corpus → same plan)', () => {
    const base = generateWeekPlan('keto', BIG, INGREDIENTS, { seed: 99 })
    for (const shuffleSeed of [1, 2, 3]) {
      const plan = generateWeekPlan('keto', shuffled(BIG, shuffleSeed), INGREDIENTS, { seed: 99 })
      expect(plan).toEqual(base)
    }
    const reversed = generateWeekPlan('keto', [...BIG].reverse(), INGREDIENTS, { seed: 99 })
    expect(reversed).toEqual(base)
  })

  it('accepts the ingredient catalogue as an array or a Map with identical output', () => {
    const fromArray = generateWeekPlan('keto', BIG, INGREDIENTS, { seed: 5 })
    const fromMap = generateWeekPlan('keto', BIG, indexBySlug(INGREDIENTS), { seed: 5 })
    expect(fromMap).toEqual(fromArray)
  })
})

// --- filling and repeats -------------------------------------------------------------------------

describe('generateWeekPlan — slots', () => {
  it('fills all 21 slots over 7 days when every meal pool has ≥ 1 recipe, with no warnings for pools ≥ 4', () => {
    const plan = generateWeekPlan('keto', BIG, INGREDIENTS, { seed: 3 })
    expect(plan.days).toHaveLength(7)
    expect(plan.days.map((d) => d.index)).toEqual([0, 1, 2, 3, 4, 5, 6])
    const filled = plan.days.flatMap((d) => PLAN_MEALS.map((m) => d.slots[m])).filter(Boolean)
    expect(filled).toHaveLength(21)
    expect(plan.warnings).toEqual([])
    expect(plan.weekStart).toBeNull()
  })

  it('schedules each meal only from recipes tagged with that meal and this diet; snack is never scheduled', () => {
    const recipes = [
      ...BIG,
      recipe('snack-only', ['snack']),
      recipe('other-diet-breakfast', ['breakfast'], { diet_slugs: ['vegan'] }),
    ]
    expect(poolFor('keto', 'breakfast', recipes).map((r) => r.slug)).toEqual([
      'breakfast-0',
      'breakfast-1',
      'breakfast-2',
      'breakfast-3',
      'breakfast-4',
      'breakfast-5',
    ])
    const plan = generateWeekPlan('keto', recipes, INGREDIENTS, { seed: 11 })
    for (const meal of PLAN_MEALS) {
      for (const slug of slugsFor(plan, meal)) {
        expect(slug).not.toBeNull()
        expect(slug?.startsWith(`${meal}-`)).toBe(true)
      }
    }
  })

  it('never repeats a recipe within 3 days for a meal whose pool has ≥ 4 recipes', () => {
    for (const corpusUnderTest of [FOUR, BIG]) {
      for (let seed = 0; seed < 25; seed++) {
        const plan = generateWeekPlan('keto', corpusUnderTest, INGREDIENTS, { seed, days: 14 })
        for (const meal of PLAN_MEALS) {
          const slugs = slugsFor(plan, meal)
          for (let d = 0; d < slugs.length; d++) {
            for (let back = 1; back <= 3 && d - back >= 0; back++) {
              expect(slugs[d], `${meal} day ${d} vs day ${d - back} (seed ${seed})`).not.toBe(
                slugs[d - back],
              )
            }
          }
        }
      }
    }
  })

  it('pool < 4 → repeats allowed and exactly ONE pool-too-small warning for that meal', () => {
    const recipes = corpus({ breakfast: 2, lunch: 6, dinner: 6 })
    const plan = generateWeekPlan('keto', recipes, INGREDIENTS, { seed: 8 })
    const breakfasts = slugsFor(plan, 'breakfast')
    expect(breakfasts.every((s) => s !== null)).toBe(true)
    expect(new Set(breakfasts).size).toBeLessThan(breakfasts.length) // repeats happened
    expect(plan.warnings).toEqual([{ day: null, meal: 'breakfast', reason: 'pool-too-small' }])
  })

  it('a pool of 1 serves the same recipe every day with one warning', () => {
    const recipes = corpus({ breakfast: 1, lunch: 4, dinner: 4 })
    const plan = generateWeekPlan('keto', recipes, INGREDIENTS, { seed: 8 })
    expect(slugsFor(plan, 'breakfast')).toEqual(Array<string>(7).fill('breakfast-0'))
    expect(plan.warnings.filter((w) => w.reason === 'pool-too-small')).toHaveLength(1)
  })

  it('empty pool for a meal → null slots + one no-recipe-for-meal warning per day, no throw', () => {
    const recipes = corpus({ breakfast: 0, lunch: 6, dinner: 6 })
    const plan = generateWeekPlan('keto', recipes, INGREDIENTS, { seed: 8 })
    expect(slugsFor(plan, 'breakfast')).toEqual(Array<null>(7).fill(null))
    expect(slugsFor(plan, 'lunch').every((s) => s !== null)).toBe(true)
    expect(plan.warnings).toEqual(
      [0, 1, 2, 3, 4, 5, 6].map((day) => ({
        day,
        meal: 'breakfast',
        reason: 'no-recipe-for-meal',
      })),
    )
  })

  it('no recipes at all → all null, 21 warnings, empty shopping list, zero totals', () => {
    const plan = generateWeekPlan('keto', [], INGREDIENTS, { seed: 1 })
    expect(plan.days).toHaveLength(7)
    expect(plan.warnings).toHaveLength(21)
    expect(plan.shoppingList).toEqual([])
    for (const day of plan.days) {
      expect(day.slots).toEqual({ breakfast: null, lunch: null, dinner: null })
      expect(day.totals).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 })
    }
  })

  it('honours `days` and carries `weekStart` through', () => {
    const plan = generateWeekPlan('keto', BIG, INGREDIENTS, {
      seed: 1,
      days: 3,
      weekStart: '2026-10-12',
    })
    expect(plan.days).toHaveLength(3)
    expect(plan.weekStart).toBe('2026-10-12')
    expect(generateWeekPlan('keto', BIG, INGREDIENTS, { seed: 1, days: 0 }).days).toEqual([])
    expect(generateWeekPlan('keto', BIG, INGREDIENTS, { seed: 1, days: NaN }).days).toHaveLength(7)
  })
})

// --- totals and shopping list --------------------------------------------------------------------

describe('generateWeekPlan — totals', () => {
  it('day totals equal the sum of per-portion nutrition of the three slots', () => {
    const recipes = [
      recipe('b', ['breakfast'], {
        portions: 2,
        ingredients: [
          { ingredient_slug: 'oats', quantity: 100, unit: 'g' },
          { ingredient_slug: 'egg', quantity: 2, unit: 'piece' },
        ],
      }),
      recipe('l', ['lunch'], {
        portions: 4,
        ingredients: [
          { ingredient_slug: 'rice', quantity: 300, unit: 'g' },
          { ingredient_slug: 'chicken', quantity: 500, unit: 'g' },
          { ingredient_slug: 'olive-oil', quantity: 2, unit: 'tbsp' },
        ],
      }),
      recipe('d', ['dinner'], {
        portions: 1,
        ingredients: [{ ingredient_slug: 'chicken', quantity: 200, unit: 'g' }],
      }),
    ]
    const bySlug = indexBySlug(INGREDIENTS)
    const plan = generateWeekPlan('keto', recipes, bySlug, { seed: 1, days: 2 })
    const expected = recipes
      .map((r) => computeNutrition(r, bySlug).perPortion)
      .reduce((acc, m) => ({
        kcal: acc.kcal + m.kcal,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat,
      }))
    for (const day of plan.days) {
      expect(day.totals.kcal).toBeCloseTo(expected.kcal, 9)
      expect(day.totals.protein).toBeCloseTo(expected.protein, 9)
      expect(day.totals.carbs).toBeCloseTo(expected.carbs, 9)
      expect(day.totals.fat).toBeCloseTo(expected.fat, 9)
    }
    // Hand check of one component: oats 100 g → 380 kcal, 2 eggs → 143 kcal; /2 portions = 261.5.
    expect(computeNutrition(recipes[0] as RecipeSeed, bySlug).perPortion.kcal).toBeCloseTo(261.5)
  })
})

describe('shoppingListFor', () => {
  it('sums quantities per slug + unit with per-portion scaling (hand-computed)', () => {
    const recipes = [
      // breakfast, 2 portions: per portion 100 g oats + 0.5 egg
      recipe('b', ['breakfast'], {
        portions: 2,
        ingredients: [
          { ingredient_slug: 'oats', quantity: 200, unit: 'g' },
          { ingredient_slug: 'egg', quantity: 1, unit: 'piece' },
        ],
      }),
      // lunch, 4 portions: per portion 100 g oats + 0.5 tbsp olive oil + 25 g of an unknown slug
      recipe('l', ['lunch'], {
        portions: 4,
        ingredients: [
          { ingredient_slug: 'oats', quantity: 400, unit: 'g' },
          { ingredient_slug: 'olive-oil', quantity: 2, unit: 'tbsp' },
          { ingredient_slug: 'mystery', quantity: 100, unit: 'g' },
        ],
      }),
      // dinner, 1 portion: the same slug in a DIFFERENT unit must stay a separate line
      recipe('d', ['dinner'], {
        portions: 1,
        ingredients: [{ ingredient_slug: 'oats', quantity: 1, unit: 'tbsp' }],
      }),
    ]
    const bySlug = indexBySlug(INGREDIENTS)
    const plan = generateWeekPlan('keto', recipes, bySlug, { seed: 1, days: 2 })

    // Two days, each: oats 100 g (b) + 100 g (l) = 200 g → 400 g; egg 0.5 → 1; oil 0.5 → 1;
    // mystery 25 → 50; oats tbsp 1 → 2. Sorted by slug, then unit.
    expect(plan.shoppingList).toEqual([
      { ingredient_slug: 'egg', unit: 'piece', quantity: 1, name_el: 'ΕΛ egg', name_en: 'EN egg' },
      {
        ingredient_slug: 'mystery',
        unit: 'g',
        quantity: 50,
        name_el: 'mystery',
        name_en: 'mystery',
      },
      { ingredient_slug: 'oats', unit: 'g', quantity: 400, name_el: 'ΕΛ oats', name_en: 'EN oats' },
      {
        ingredient_slug: 'oats',
        unit: 'tbsp',
        quantity: 2,
        name_el: 'ΕΛ oats',
        name_en: 'EN oats',
      },
      {
        ingredient_slug: 'olive-oil',
        unit: 'tbsp',
        quantity: 1,
        name_el: 'ΕΛ olive-oil',
        name_en: 'EN olive-oil',
      },
    ])
    // The exported helper reproduces the plan's own list from its days.
    expect(shoppingListFor(plan, bySlug)).toEqual(plan.shoppingList)
  })

  it('skips null slots and returns [] for an empty plan', () => {
    expect(shoppingListFor({ days: [] }, indexBySlug(INGREDIENTS))).toEqual([])
    const plan = generateWeekPlan('keto', corpus({ breakfast: 0, lunch: 0, dinner: 0 }), [], {
      seed: 1,
    })
    expect(shoppingListFor(plan, new Map())).toEqual([])
  })
})

// --- nextMonday ----------------------------------------------------------------------------------

describe('nextMonday', () => {
  it('returns the Monday strictly after the given UTC date', () => {
    expect(nextMonday(new Date('2026-10-05T12:00:00Z'))).toBe('2026-10-12') // a Monday → next one
    expect(nextMonday(new Date('2026-10-06T00:00:00Z'))).toBe('2026-10-12') // Tuesday
    expect(nextMonday(new Date('2026-10-11T23:59:59Z'))).toBe('2026-10-12') // Sunday
    expect(nextMonday(new Date('2026-12-31T00:00:00Z'))).toBe('2027-01-04') // year roll-over
  })
})
