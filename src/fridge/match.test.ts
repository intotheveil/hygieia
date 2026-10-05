import type { IngredientSeed, RecipeSeed } from '../content/types'
import { indexBySlug, matchRecipe, matchRecipes, normalizeForSearch } from './match'

// --- fixtures (hand-written; the seed data arrives in P1.9–P1.11) ---------------------------------

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

function recipe(slug: string, title_en: string, slugs: string[]): RecipeSeed {
  return {
    slug,
    title_el: title_en,
    title_en,
    steps_el: ['β'],
    steps_en: ['s'],
    portions: 2,
    prep_min: 10,
    meal_types: ['lunch'],
    image_path: null,
    ingredients: slugs.map((ingredient_slug) => ({ ingredient_slug, quantity: 100, unit: 'g' })),
    diet_slugs: [],
  }
}

const INGREDIENTS: IngredientSeed[] = [
  ingredient('tomato'),
  ingredient('cucumber'),
  ingredient('onion'),
  ingredient('feta', { substitute_slugs: ['ricotta'] }),
  ingredient('ricotta'),
  ingredient('olive-oil', { is_pantry_staple: true }),
  ingredient('salt', { is_pantry_staple: true }),
  ingredient('egg', { unit: 'piece', grams_per_unit: 50 }),
  ingredient('bread'),
]

const GREEK_SALAD = recipe('greek-salad', 'Greek salad', [
  'tomato',
  'cucumber',
  'onion',
  'feta',
  'olive-oil',
])
const TOMATO_SALAD = recipe('tomato-salad', 'Tomato salad', ['tomato', 'onion', 'olive-oil'])
const OMELETTE = recipe('omelette', 'Omelette', ['egg', 'feta', 'salt'])
const TOAST = recipe('toast', 'Toast', ['bread', 'olive-oil'])
const RECIPES = [OMELETTE, TOAST, GREEK_SALAD, TOMATO_SALAD]

const NO_STAPLES = { ignorePantryStaples: false }
const SKIP_STAPLES = { ignorePantryStaples: true }

const slugsOf = (list: { slug: string }[]) => list.map((x) => x.slug)

// --- matcher ---------------------------------------------------------------------------------------

describe('matchRecipes — ranking', () => {
  it('ranks the fully covered recipe first', () => {
    const have = new Set(['tomato', 'onion', 'olive-oil', 'cucumber'])
    const [first, second] = matchRecipes(RECIPES, INGREDIENTS, have, NO_STAPLES)
    expect(first.recipe.slug).toBe('tomato-salad')
    expect(first.coverage).toBe(1)
    expect(first.missing).toEqual([])
    expect(second.recipe.slug).toBe('greek-salad')
    expect(second.coverage).toBeCloseTo(4 / 5, 10)
    expect(slugsOf(second.missing)).toEqual(['feta'])
  })

  it('breaks a coverage tie by fewer missing', () => {
    // a: 2/4 missing 2; b: 1/2 missing 1 — same coverage, b first.
    const a = recipe('a', 'A', ['tomato', 'cucumber', 'bread', 'egg'])
    const b = recipe('b', 'B', ['tomato', 'bread'])
    const have = new Set(['tomato', 'cucumber'])
    const ranked = matchRecipes([a, b], INGREDIENTS, have, NO_STAPLES)
    expect(ranked.map((r) => r.recipe.slug)).toEqual(['b', 'a'])
    expect(ranked[0].coverage).toBe(ranked[1].coverage)
  })

  it('then by fewer ingredient lines, then by title_en', () => {
    // all fully covered with 0 missing: fewer lines first, then title order among equal line counts.
    const z = recipe('z', 'Zucchini bowl', ['tomato', 'onion'])
    const c = recipe('c', 'Cucumber bowl', ['tomato', 'onion'])
    const big = recipe('big', 'Aaa big bowl', ['tomato', 'onion', 'cucumber'])
    const have = new Set(['tomato', 'onion', 'cucumber'])
    const ranked = matchRecipes([z, big, c], INGREDIENTS, have, NO_STAPLES)
    expect(ranked.map((r) => r.recipe.slug)).toEqual(['c', 'z', 'big'])
  })

  it('drops recipes with coverage 0', () => {
    const have = new Set(['bread'])
    const ranked = matchRecipes(RECIPES, INGREDIENTS, have, NO_STAPLES)
    expect(ranked.map((r) => r.recipe.slug)).toEqual(['toast'])
  })

  it('returns [] for an empty fridge', () => {
    expect(matchRecipes(RECIPES, INGREDIENTS, new Set(), NO_STAPLES)).toEqual([])
    expect(matchRecipes(RECIPES, INGREDIENTS, new Set(), SKIP_STAPLES)).toEqual([])
  })

  it('is deterministic: repeated calls and shuffled input give the same order', () => {
    const have = new Set(['tomato', 'onion', 'olive-oil', 'ricotta', 'egg'])
    const once = matchRecipes(RECIPES, INGREDIENTS, have, NO_STAPLES).map((r) => r.recipe.slug)
    const twice = matchRecipes(RECIPES, INGREDIENTS, have, NO_STAPLES).map((r) => r.recipe.slug)
    const shuffled = matchRecipes([...RECIPES].reverse(), INGREDIENTS, have, NO_STAPLES).map(
      (r) => r.recipe.slug,
    )
    expect(twice).toEqual(once)
    expect(shuffled).toEqual(once)
    // tomato-salad 3/3 · greek-salad 4/5 (feta → ricotta) · omelette 2/3 (feta → ricotta, no salt) · toast 1/2
    expect(once).toEqual(['tomato-salad', 'greek-salad', 'omelette', 'toast'])
  })
})

describe('matchRecipes — substitutes', () => {
  it('counts a substitute the user has as covered AND reports it, never silently', () => {
    const have = new Set(['tomato', 'cucumber', 'onion', 'ricotta', 'olive-oil'])
    const [result] = matchRecipes([GREEK_SALAD], INGREDIENTS, have, NO_STAPLES)
    expect(result.coverage).toBe(1)
    expect(result.missing).toEqual([])
    expect(slugsOf(result.have)).toEqual(['tomato', 'cucumber', 'onion', 'olive-oil'])
    expect(result.substitutions).toHaveLength(1)
    expect(result.substitutions[0].missing.slug).toBe('feta')
    expect(result.substitutions[0].use.slug).toBe('ricotta')
  })

  it('ignores a substitute slug that does not resolve in the catalogue', () => {
    const ghost = ingredient('ghost-cheese', { substitute_slugs: ['unknown-sub'] })
    const r = recipe('r', 'R', ['tomato', 'ghost-cheese'])
    const have = new Set(['tomato', 'unknown-sub'])
    const [result] = matchRecipes([r], [...INGREDIENTS, ghost], have, NO_STAPLES)
    expect(result.substitutions).toEqual([])
    expect(slugsOf(result.missing)).toEqual(['ghost-cheese'])
    expect(result.coverage).toBe(0.5)
  })
})

describe('matchRecipes — unknown slugs and staples', () => {
  it('ignores an unknown ingredient_slug for matching but lists it in unknown', () => {
    const r = recipe('r', 'R', ['tomato', 'no-such-thing'])
    const have = new Set(['tomato'])
    const [result] = matchRecipes([r], INGREDIENTS, have, NO_STAPLES)
    expect(result.coverage).toBe(1)
    expect(result.unknown).toEqual(['no-such-thing'])
    expect(result.missing).toEqual([])
  })

  it('a recipe made only of unknown slugs is dropped (coverage 0)', () => {
    const r = recipe('r', 'R', ['no-such-thing'])
    expect(matchRecipes([r], INGREDIENTS, new Set(['tomato']), NO_STAPLES)).toEqual([])
  })

  it('ignorePantryStaples removes lacking staples from the denominator and from missing', () => {
    const have = new Set(['egg', 'feta'])
    const [withStaples] = matchRecipes([OMELETTE], INGREDIENTS, have, NO_STAPLES)
    expect(withStaples.coverage).toBeCloseTo(2 / 3, 10)
    expect(slugsOf(withStaples.missing)).toEqual(['salt'])

    const [withoutStaples] = matchRecipes([OMELETTE], INGREDIENTS, have, SKIP_STAPLES)
    expect(withoutStaples.coverage).toBe(1)
    expect(withoutStaples.missing).toEqual([])
  })

  it('a staple the user HAS still counts in have, even when staples are ignored', () => {
    const have = new Set(['egg', 'salt'])
    const [result] = matchRecipes([OMELETTE], INGREDIENTS, have, SKIP_STAPLES)
    expect(slugsOf(result.have)).toEqual(['egg', 'salt'])
    expect(slugsOf(result.missing)).toEqual(['feta'])
    expect(result.coverage).toBeCloseTo(2 / 3, 10)
  })

  it('does not drop a recipe that has nothing left after staples are ignored — it never had coverage', () => {
    const staplesOnly = recipe('s', 'S', ['salt', 'olive-oil'])
    expect(matchRecipes([staplesOnly], INGREDIENTS, new Set(['tomato']), SKIP_STAPLES)).toEqual([])
  })

  it('counts a duplicated ingredient line once', () => {
    const r = recipe('r', 'R', ['tomato', 'tomato', 'bread'])
    const result = matchRecipe(r, indexBySlug(INGREDIENTS), new Set(['tomato']), NO_STAPLES)
    expect(result.coverage).toBe(0.5)
    expect(slugsOf(result.have)).toEqual(['tomato'])
  })
})

// --- helpers -----------------------------------------------------------------------------------------

describe('normalizeForSearch', () => {
  it('lower-cases and strips Greek accents', () => {
    expect(normalizeForSearch('Ντομάτα')).toBe('ντοματα')
  })

  it('makes accented and unaccented Greek agree', () => {
    expect(normalizeForSearch('σαλάτα')).toBe(normalizeForSearch('σαλατα'))
    expect(normalizeForSearch('ΣΑΛΆΤΑ')).toBe('σαλατα')
  })

  it('folds final sigma, strips Latin accents and dialytika, collapses whitespace', () => {
    expect(normalizeForSearch('Ντομάτες')).toBe('ντοματεσ')
    expect(normalizeForSearch('  Crème   Fraîche ')).toBe('creme fraiche')
    expect(normalizeForSearch('Καΐκι')).toBe('καικι')
  })

  it('supports substring search in both languages', () => {
    const q = normalizeForSearch('σαλατ')
    expect(normalizeForSearch('Χωριάτικη σαλάτα').includes(q)).toBe(true)
    expect(normalizeForSearch('Greek salad').includes(normalizeForSearch('SALAD'))).toBe(true)
  })
})

describe('indexBySlug', () => {
  it('maps every ingredient by slug', () => {
    const idx = indexBySlug(INGREDIENTS)
    expect(idx.size).toBe(INGREDIENTS.length)
    expect(idx.get('feta')?.substitute_slugs).toEqual(['ricotta'])
    expect(idx.get('nope')).toBeUndefined()
  })
})
