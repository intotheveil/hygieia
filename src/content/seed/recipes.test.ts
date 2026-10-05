import { MEAL_TYPES, SLUG_RE, UNITS } from '../enums'
import type { IngredientSeed, RecipeSeed } from '../types'
import { computeNutrition } from '../../nutrition/compute'
import { DIETS } from './diets'
import { INGREDIENTS } from './ingredients'
import { RECIPES } from './recipes'

// --- Floors the lead raises after the three group files are merged -----------------------------

/** PLAN.md §P1.11 asks ≥ 40; one group alone ships ≥ 30. Raise to 40 once every group has landed. */
const MIN_RECIPES = 120

/**
 * When true, EVERY diet in DIETS must have ≥ 2 recipes for each of breakfast/lunch/dinner (the
 * P4.5 week-filler guarantee). False until the three groups are merged, because a single group
 * cannot cover sixteen diets on its own.
 */
const REQUIRE_FULL_COVERAGE = true

/** Per-diet-cell minimum used by the strict check above. */
const FULL_COVERAGE_MIN_PER_MEAL = 2

// --- Bounds (PLAN.md §2 `recipes` / `recipe_ingredients`, task brief) ---------------------------

const MIN_STEPS = 3
const PORTIONS = { min: 1, max: 12 }
const LINES = { min: 1, max: 20 }
/** Per-portion kcal sanity window; the authoring target is 150–900, the test allows some slack. */
const KCAL_PER_PORTION = { min: 100, max: 1200 }

const PLANNED_MEALS = ['breakfast', 'lunch', 'dinner'] as const

// --- Diet-compliance lists (auditable; slugs resolve against INGREDIENTS) -----------------------

/** Ingredient categories that come from an animal. */
const ANIMAL_CATEGORIES = ['dairy-eggs', 'meat', 'poultry', 'fish-seafood'] as const
const FLESH_CATEGORIES = ['meat', 'poultry', 'fish-seafood'] as const
const LAND_FLESH_CATEGORIES = ['meat', 'poultry'] as const

/** Categories a `carnivore`-tagged recipe may draw from (plus `water`, which is trivially fine). */
const CARNIVORE_ALLOWED_CATEGORIES = [
  'meat',
  'poultry',
  'fish-seafood',
  'dairy-eggs',
  'oils-fats',
  'herbs-spices',
  'pantry',
] as const
const CARNIVORE_ALLOWED_SLUGS = ['water'] as const

/**
 * Gluten carriers, derived by slug-name match: wheat, bread, pasta, bulgur, barley, rye, couscous,
 * pita, phyllo, trahana, hilopites, rusk, orzo, semolina, seitan, and `flour` unless it is a
 * naturally gluten-free flour. Explicit additions: the seed's `oats` (uncertified — the diet's own
 * avoided list), `tortilla` (a wheat tortilla), `soy-sauce` (the common kind contains wheat),
 * `koulouri`, `breadsticks`, `granola`, `beer`. Explicit exceptions: `buckwheat`, `lentil-pasta`
 * and `rice-noodles` carry a matching word but are gluten-free by nature.
 */
const GLUTEN_NAME_RE =
  /wheat|bread|pasta|bulgur|barley|rye|couscous|pita|phyllo|trahana|hilopites|rusk|orzo|semolina|seitan|flour/
const GLUTEN_FREE_FLOURS = ['almond-flour', 'coconut-flour', 'chickpea-flour'] as const
const GLUTEN_EXTRA_SLUGS = [
  'oats',
  'tortilla',
  'soy-sauce',
  'koulouri',
  'breadsticks',
  'granola',
  'beer',
] as const
const GLUTEN_EXCEPTIONS = [
  'buckwheat',
  'lentil-pasta',
  'rice-noodles',
  ...GLUTEN_FREE_FLOURS,
] as const

/**
 * High-FODMAP ingredients a `low-fodmap` recipe must not contain (Monash "avoid" list as the P1.10
 * diet row states it): onion and garlic, wheat (see GLUTEN list), legumes beyond small portions,
 * high-lactose dairy, high-FODMAP fruit and dried fruit, honey, and the listed vegetables. Wheat is
 * caught via the gluten list; `oats` are exempt there because Monash (and the diet row) allow them.
 */
const LOW_FODMAP_GLUTEN_EXCEPTIONS = ['oats'] as const
const LOW_FODMAP_FORBIDDEN_SLUGS = [
  'onion',
  'red-onion',
  'garlic',
  'leek',
  'lentils',
  'red-lentils',
  'chickpeas',
  'canned-chickpeas',
  'white-beans',
  'gigantes',
  'black-eyed-peas',
  'kidney-beans',
  'black-beans',
  'fava',
  'hummus',
  'apple',
  'pear',
  'watermelon',
  'mango',
  'dried-fig',
  'raisins',
  'dates',
  'prunes',
  'honey',
  'milk',
  'semi-skimmed-milk',
  'goat-milk',
  'evaporated-milk',
  'condensed-milk',
  'greek-yoghurt',
  'greek-yoghurt-light',
  'sheep-yoghurt',
  'kefir',
  'ricotta',
  'cottage-cheese',
  'cream-cheese',
  'cauliflower',
  'mushrooms',
  'artichoke',
  'asparagus',
] as const

/**
 * Whole30 excludes grains, legumes (incl. soy and peanuts), dairy except ghee, every sweetener,
 * alcohol and sugar-cured or additive-laden products. Categories first, then slug exceptions and
 * additions.
 */
const WHOLE30_FORBIDDEN_CATEGORIES = [
  'grains-bread',
  'pasta-rice',
  'legumes',
  'sweeteners',
] as const
const WHOLE30_DAIRY_EXCEPTIONS = ['egg', 'egg-white', 'ghee'] as const
const WHOLE30_FORBIDDEN_SLUGS = [
  'corn',
  'cornmeal',
  'cornstarch',
  'flour',
  'whole-wheat-flour',
  'semolina',
  'chickpea-flour',
  'breadcrumbs',
  'peanuts',
  'peanut-butter',
  'red-wine',
  'white-wine',
  'beer',
  'ouzo',
  'bacon',
  'sausage',
  'ham',
  'ketchup',
  'mayonnaise',
  'stock-cube',
] as const

/** Recipe slugs whose `title_el` may legitimately carry no Greek script (brand names). None today. */
const LATIN_TITLE_EL_ALLOWLIST: readonly string[] = []

// --- Helpers -------------------------------------------------------------------------------------

const GREEK_SCRIPT = /\p{Script=Greek}/u
const ingredientsBySlug: ReadonlyMap<string, IngredientSeed> = new Map(
  INGREDIENTS.map((row) => [row.slug, row]),
)
const dietSlugs = new Set(DIETS.map((d) => d.slug))

const isBlank = (s: string) => s.trim() === ''

const ingredientsOf = (recipe: RecipeSeed): IngredientSeed[] =>
  recipe.ingredients.flatMap((line) => {
    const row = ingredientsBySlug.get(line.ingredient_slug)
    return row ? [row] : []
  })

const tagged = (diet: string) => RECIPES.filter((r) => r.diet_slugs.includes(diet))

const isGlutenSlug = (slug: string) =>
  !(GLUTEN_EXCEPTIONS as readonly string[]).includes(slug) &&
  (GLUTEN_NAME_RE.test(slug) || (GLUTEN_EXTRA_SLUGS as readonly string[]).includes(slug))

const isWhole30Forbidden = (row: IngredientSeed) =>
  (WHOLE30_FORBIDDEN_CATEGORIES as readonly string[]).includes(row.category) ||
  (row.category === 'dairy-eggs' &&
    !(WHOLE30_DAIRY_EXCEPTIONS as readonly string[]).includes(row.slug)) ||
  (WHOLE30_FORBIDDEN_SLUGS as readonly string[]).includes(row.slug)

/** diet → meal type → count of recipes tagged with that diet and offering that meal type. */
function coverageMatrix(): Map<string, Record<(typeof MEAL_TYPES)[number], number>> {
  const matrix = new Map<string, Record<(typeof MEAL_TYPES)[number], number>>()
  for (const diet of DIETS) {
    matrix.set(diet.slug, { breakfast: 0, lunch: 0, dinner: 0, snack: 0 })
  }
  for (const recipe of RECIPES) {
    for (const diet of recipe.diet_slugs) {
      const cell = matrix.get(diet)
      if (!cell) continue
      for (const meal of recipe.meal_types) cell[meal] += 1
    }
  }
  return matrix
}

// --- Tests ---------------------------------------------------------------------------------------

describe('RECIPES seed — volume and identity (PLAN.md P1.11)', () => {
  it(`has at least ${MIN_RECIPES} recipes (actual count logged)`, () => {
    console.log(`RECIPES count: ${RECIPES.length}`)
    expect(RECIPES.length).toBeGreaterThanOrEqual(MIN_RECIPES)
  })

  it('every slug matches SLUG_RE and is unique across all groups', () => {
    const seen = new Set<string>()
    for (const recipe of RECIPES) {
      expect(recipe.slug, `slug ${recipe.slug}`).toMatch(SLUG_RE)
      expect(seen.has(recipe.slug), `duplicate slug ${recipe.slug}`).toBe(false)
      seen.add(recipe.slug)
    }
    expect(seen.size).toBe(RECIPES.length)
  })

  it('the compliance lists only name ingredient slugs that exist (no stale entries)', () => {
    const lists = [
      ...GLUTEN_EXTRA_SLUGS,
      ...GLUTEN_EXCEPTIONS,
      ...LOW_FODMAP_GLUTEN_EXCEPTIONS,
      ...LOW_FODMAP_FORBIDDEN_SLUGS,
      ...WHOLE30_DAIRY_EXCEPTIONS,
      ...WHOLE30_FORBIDDEN_SLUGS,
      ...CARNIVORE_ALLOWED_SLUGS,
    ]
    for (const slug of lists) {
      expect(ingredientsBySlug.has(slug), `${slug} is not an ingredient`).toBe(true)
    }
    for (const slug of LATIN_TITLE_EL_ALLOWLIST) {
      expect(
        RECIPES.some((r) => r.slug === slug),
        `allow-listed ${slug} is not a recipe`,
      ).toBe(true)
    }
    const categories = new Set(INGREDIENTS.map((row) => row.category))
    for (const category of [
      ...ANIMAL_CATEGORIES,
      ...CARNIVORE_ALLOWED_CATEGORIES,
      ...WHOLE30_FORBIDDEN_CATEGORIES,
    ]) {
      expect(categories.has(category), `${category} is not an ingredient category`).toBe(true)
    }
  })
})

describe.each(RECIPES.map((r) => [r.slug, r] as const))('recipe %s', (_slug, recipe) => {
  it('has non-blank bilingual titles, Greek script in title_el', () => {
    expect(isBlank(recipe.title_el), 'title_el blank').toBe(false)
    expect(isBlank(recipe.title_en), 'title_en blank').toBe(false)
    if (!LATIN_TITLE_EL_ALLOWLIST.includes(recipe.slug)) {
      expect(recipe.title_el).toMatch(GREEK_SCRIPT)
    }
  })

  it(`has ≥ ${MIN_STEPS} non-blank steps with equal counts in both languages`, () => {
    expect(recipe.steps_el.length).toBeGreaterThanOrEqual(MIN_STEPS)
    expect(recipe.steps_en.length, 'steps_el vs steps_en length').toBe(recipe.steps_el.length)
    for (const step of [...recipe.steps_el, ...recipe.steps_en]) {
      expect(isBlank(step), 'blank step').toBe(false)
    }
    for (const step of recipe.steps_el) expect(step, 'steps_el not Greek').toMatch(GREEK_SCRIPT)
  })

  it('has sane portions, prep time and a null-or-string image_path', () => {
    expect(Number.isInteger(recipe.portions)).toBe(true)
    expect(recipe.portions).toBeGreaterThanOrEqual(PORTIONS.min)
    expect(recipe.portions).toBeLessThanOrEqual(PORTIONS.max)
    expect(Number.isInteger(recipe.prep_min)).toBe(true)
    expect(recipe.prep_min).toBeGreaterThanOrEqual(1)
    expect(recipe.image_path === null || typeof recipe.image_path === 'string').toBe(true)
  })

  it('has a non-empty, duplicate-free meal_types subset of MEAL_TYPES', () => {
    expect(recipe.meal_types.length).toBeGreaterThan(0)
    expect(new Set(recipe.meal_types).size).toBe(recipe.meal_types.length)
    for (const meal of recipe.meal_types) expect(MEAL_TYPES).toContain(meal)
  })

  it(`has ${LINES.min}..${LINES.max} ingredient lines that resolve, with valid units and quantities`, () => {
    expect(recipe.ingredients.length).toBeGreaterThanOrEqual(LINES.min)
    expect(recipe.ingredients.length).toBeLessThanOrEqual(LINES.max)
    const seen = new Set<string>()
    for (const line of recipe.ingredients) {
      expect(ingredientsBySlug.has(line.ingredient_slug), `unknown ${line.ingredient_slug}`).toBe(
        true,
      )
      expect(seen.has(line.ingredient_slug), `duplicate line ${line.ingredient_slug}`).toBe(false)
      seen.add(line.ingredient_slug)
      expect(line.quantity, `${line.ingredient_slug} quantity`).toBeGreaterThan(0)
      expect(Number.isFinite(line.quantity)).toBe(true)
      expect(UNITS).toContain(line.unit)
      const hasEl = line.note_el !== undefined
      const hasEn = line.note_en !== undefined
      expect(hasEl, `${line.ingredient_slug} note must be both-or-neither`).toBe(hasEn)
      if (hasEl) {
        expect(isBlank(line.note_el ?? '')).toBe(false)
        expect(isBlank(line.note_en ?? '')).toBe(false)
      }
    }
  })

  it('has diet_slugs that all resolve in DIETS, with no duplicates', () => {
    expect(new Set(recipe.diet_slugs).size).toBe(recipe.diet_slugs.length)
    for (const slug of recipe.diet_slugs) {
      expect(dietSlugs.has(slug), `unknown diet ${slug}`).toBe(true)
    }
  })

  it(`computes ${KCAL_PER_PORTION.min}..${KCAL_PER_PORTION.max} kcal per portion with no unknown slugs`, () => {
    const result = computeNutrition(recipe, ingredientsBySlug)
    expect(result.unknown).toEqual([])
    expect(result.perPortion.kcal).toBeGreaterThanOrEqual(KCAL_PER_PORTION.min)
    expect(result.perPortion.kcal).toBeLessThanOrEqual(KCAL_PER_PORTION.max)
  })

  it('honours the mechanical diet-compliance rules for every tag it carries', () => {
    const rows = ingredientsOf(recipe)
    const tags = recipe.diet_slugs
    const offenders = (pred: (row: IngredientSeed) => boolean) =>
      rows.filter(pred).map((row) => row.slug)

    if (tags.includes('vegan')) {
      expect(
        offenders((row) => (ANIMAL_CATEGORIES as readonly string[]).includes(row.category)),
        'vegan',
      ).toEqual([])
    }
    if (tags.includes('vegetarian')) {
      expect(
        offenders((row) => (FLESH_CATEGORIES as readonly string[]).includes(row.category)),
        'vegetarian',
      ).toEqual([])
    }
    if (tags.includes('pescatarian')) {
      expect(
        offenders((row) => (LAND_FLESH_CATEGORIES as readonly string[]).includes(row.category)),
        'pescatarian',
      ).toEqual([])
    }
    if (tags.includes('carnivore')) {
      expect(
        offenders(
          (row) =>
            !(CARNIVORE_ALLOWED_CATEGORIES as readonly string[]).includes(row.category) &&
            !(CARNIVORE_ALLOWED_SLUGS as readonly string[]).includes(row.slug),
        ),
        'carnivore',
      ).toEqual([])
    }
    if (tags.includes('gluten-free')) {
      expect(
        offenders((row) => isGlutenSlug(row.slug)),
        'gluten-free',
      ).toEqual([])
    }
    if (tags.includes('low-fodmap')) {
      expect(
        offenders(
          (row) =>
            (isGlutenSlug(row.slug) &&
              !(LOW_FODMAP_GLUTEN_EXCEPTIONS as readonly string[]).includes(row.slug)) ||
            (LOW_FODMAP_FORBIDDEN_SLUGS as readonly string[]).includes(row.slug),
        ),
        'low-fodmap',
      ).toEqual([])
    }
    if (tags.includes('whole30')) {
      expect(offenders(isWhole30Forbidden), 'whole30').toEqual([])
    }
  })
})

describe('RECIPES seed — coverage matrix (diet × meal type)', () => {
  const matrix = coverageMatrix()

  it('logs the matrix', () => {
    const lines = [...matrix.entries()].map(
      ([diet, cell]) =>
        `${diet.padEnd(22)} B ${String(cell.breakfast).padStart(2)}  L ${String(cell.lunch).padStart(2)}  D ${String(cell.dinner).padStart(2)}  S ${String(cell.snack).padStart(2)}  total ${tagged(diet).length}`,
    )
    console.log(`RECIPES coverage matrix:\n${lines.join('\n')}`)
    expect(matrix.size).toBe(DIETS.length)
  })

  it('every diet with ≥ 1 recipe has breakfast, lunch and dinner each ≥ 1', () => {
    for (const [diet, cell] of matrix) {
      if (tagged(diet).length === 0) continue
      for (const meal of PLANNED_MEALS) {
        expect(cell[meal], `${diet} × ${meal}`).toBeGreaterThanOrEqual(1)
      }
    }
  })

  it('at least one diet is covered (the matrix is not vacuous)', () => {
    expect(DIETS.some((d) => tagged(d.slug).length > 0)).toBe(true)
  })

  it(`every diet has ≥ ${FULL_COVERAGE_MIN_PER_MEAL} per planned meal when REQUIRE_FULL_COVERAGE`, () => {
    if (!REQUIRE_FULL_COVERAGE) {
      console.log('RECIPES full coverage: SKIPPED (REQUIRE_FULL_COVERAGE = false until merge)')
      return
    }
    for (const [diet, cell] of matrix) {
      for (const meal of PLANNED_MEALS) {
        expect(cell[meal], `${diet} × ${meal}`).toBeGreaterThanOrEqual(FULL_COVERAGE_MIN_PER_MEAL)
      }
    }
  })
})

describe('RECIPES seed — nutrition sample', () => {
  it('logs per-portion kcal for every recipe (sorted)', () => {
    const rows = RECIPES.map((r) => ({
      slug: r.slug,
      kcal: Math.round(computeNutrition(r, ingredientsBySlug).perPortion.kcal),
    })).sort((a, b) => a.kcal - b.kcal)
    console.log(
      `RECIPES kcal/portion:\n${rows.map((row) => `${String(row.kcal).padStart(5)}  ${row.slug}`).join('\n')}`,
    )
    expect(rows.length).toBe(RECIPES.length)
  })
})
