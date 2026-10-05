import { RECIPES } from '../content/seed/recipes'
import type { RecipeSeed } from '../content/types'
import type { MealType } from '../content/enums'
import {
  filterRecipes,
  isEmptyRecipeFilter,
  parseRecipeFilterParams,
  recipeTitle,
  serializeRecipeFilterParams,
  sortRecipes,
} from './filter'

// --- fixtures -------------------------------------------------------------------------------------

function recipe(
  slug: string,
  title_el: string,
  title_en: string,
  diet_slugs: string[],
  meal_types: MealType[] = ['lunch'],
): RecipeSeed {
  return {
    slug,
    title_el,
    title_en,
    steps_el: ['β'],
    steps_en: ['s'],
    portions: 2,
    prep_min: 10,
    meal_types,
    image_path: null,
    ingredients: [],
    diet_slugs,
  }
}

const SALAD = recipe('salad', 'Χωριάτικη Σαλάτα', 'Greek salad', ['vegetarian', 'keto'], ['lunch'])
const OMELETTE = recipe('omelette', 'Ομελέτα', 'Omelette', ['keto', 'paleo'], ['breakfast'])
const LENTILS = recipe('lentils', 'Φακές', 'Lentil soup', ['vegan'], ['lunch', 'dinner'])
const YOGURT = recipe('yogurt', 'Γιαούρτι με μέλι', 'Yogurt with honey', [], ['breakfast', 'snack'])
const FIXTURES = [SALAD, OMELETTE, LENTILS, YOGURT]

// --- filterRecipes ---------------------------------------------------------------------------------

describe('filterRecipes', () => {
  it('returns everything (same order, new array) when no criterion is set', () => {
    const out = filterRecipes(FIXTURES, { lang: 'el' })
    expect(out).toEqual(FIXTURES)
    expect(out).not.toBe(FIXTURES)
  })

  it('treats empty lists and a blank query as "no filter"', () => {
    expect(
      filterRecipes(FIXTURES, { lang: 'en', dietSlugs: [], mealTypes: [], query: '' }),
    ).toEqual(FIXTURES)
    expect(filterRecipes(FIXTURES, { lang: 'en', query: '   ' })).toEqual(FIXTURES)
  })

  it('diets are any-of: a recipe passes with at least one requested tag', () => {
    expect(filterRecipes(FIXTURES, { lang: 'en', dietSlugs: ['keto'] })).toEqual([SALAD, OMELETTE])
    expect(filterRecipes(FIXTURES, { lang: 'en', dietSlugs: ['vegan', 'paleo'] })).toEqual([
      OMELETTE,
      LENTILS,
    ])
    expect(filterRecipes(FIXTURES, { lang: 'en', dietSlugs: ['nope'] })).toEqual([])
  })

  it('meal types are any-of and combine with diets as all-of', () => {
    expect(filterRecipes(FIXTURES, { lang: 'en', mealTypes: ['breakfast'] })).toEqual([
      OMELETTE,
      YOGURT,
    ])
    expect(filterRecipes(FIXTURES, { lang: 'en', mealTypes: ['dinner', 'snack'] })).toEqual([
      LENTILS,
      YOGURT,
    ])
    expect(
      filterRecipes(FIXTURES, { lang: 'en', dietSlugs: ['keto'], mealTypes: ['breakfast'] }),
    ).toEqual([OMELETTE])
  })

  it('matches the Greek title accent- and case-insensitively', () => {
    expect(filterRecipes(FIXTURES, { lang: 'el', query: 'σαλατα' })).toEqual([SALAD])
    expect(filterRecipes(FIXTURES, { lang: 'el', query: 'ΣΑΛΆΤΑ' })).toEqual([SALAD])
    expect(filterRecipes(FIXTURES, { lang: 'el', query: 'φακες' })).toEqual([LENTILS])
    expect(filterRecipes(FIXTURES, { lang: 'el', query: 'μελι' })).toEqual([YOGURT])
  })

  it('matches the English title case-insensitively', () => {
    expect(filterRecipes(FIXTURES, { lang: 'en', query: 'GREEK' })).toEqual([SALAD])
    expect(filterRecipes(FIXTURES, { lang: 'en', query: 'soup' })).toEqual([LENTILS])
  })

  it('searches ONLY the current language title', () => {
    expect(filterRecipes(FIXTURES, { lang: 'en', query: 'σαλατα' })).toEqual([])
    expect(filterRecipes(FIXTURES, { lang: 'el', query: 'greek' })).toEqual([])
  })

  it('a multi-word query collapses whitespace like the title does', () => {
    expect(filterRecipes(FIXTURES, { lang: 'en', query: '  yogurt   with ' })).toEqual([YOGURT])
  })

  it('does not mutate the input', () => {
    const copy = FIXTURES.map((r) => ({ ...r }))
    filterRecipes(FIXTURES, { lang: 'el', dietSlugs: ['keto'], query: 'σ' })
    expect(FIXTURES).toEqual(copy)
  })
})

describe('filterRecipes on the real seed', () => {
  it('a Greek query without accents finds Φασολάδα', () => {
    const out = filterRecipes(RECIPES, { lang: 'el', query: 'φασολαδα' })
    expect(out.map((r) => r.slug)).toContain('fasolada-white-bean-soup')
    for (const r of out) expect(r.title_el.normalize('NFD')).toMatch(/φασολ/i)
  })

  it('an English query ignoring case finds the same recipe by its English title', () => {
    const out = filterRecipes(RECIPES, { lang: 'en', query: 'FASOLADA' })
    expect(out.map((r) => r.slug)).toContain('fasolada-white-bean-soup')
  })

  it('selecting keto leaves only keto-tagged recipes, and plenty of them', () => {
    const out = filterRecipes(RECIPES, { lang: 'en', dietSlugs: ['keto'] })
    expect(out.length).toBeGreaterThan(20)
    expect(out.length).toBeLessThan(RECIPES.length)
    for (const r of out) expect(r.diet_slugs).toContain('keto')
  })

  it('union of two diets is at least each alone and preserves corpus order', () => {
    const keto = filterRecipes(RECIPES, { lang: 'en', dietSlugs: ['keto'] })
    const vegan = filterRecipes(RECIPES, { lang: 'en', dietSlugs: ['vegan'] })
    const both = filterRecipes(RECIPES, { lang: 'en', dietSlugs: ['keto', 'vegan'] })
    expect(both.length).toBeGreaterThanOrEqual(Math.max(keto.length, vegan.length))
    const indexOf = new Map(RECIPES.map((r, i) => [r.slug, i]))
    const positions = both.map((r) => indexOf.get(r.slug) ?? -1)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
  })

  it('every real recipe is found by its own full title in both languages', () => {
    for (const r of RECIPES) {
      expect(filterRecipes(RECIPES, { lang: 'el', query: r.title_el })).toContain(r)
      expect(filterRecipes(RECIPES, { lang: 'en', query: r.title_en })).toContain(r)
    }
  })
})

// --- sortRecipes -----------------------------------------------------------------------------------

describe('sortRecipes', () => {
  it('orders by the localized title ignoring accents and case, and returns a new array', () => {
    const el = sortRecipes(FIXTURES, 'el')
    expect(el.map((r) => r.slug)).toEqual(['yogurt', 'omelette', 'lentils', 'salad'])
    expect(el).not.toBe(FIXTURES)
    expect(FIXTURES.map((r) => r.slug)).toEqual(['salad', 'omelette', 'lentils', 'yogurt'])

    const en = sortRecipes(FIXTURES, 'en')
    expect(en.map((r) => r.slug)).toEqual(['salad', 'lentils', 'omelette', 'yogurt'])
  })

  it('breaks a title tie by slug, so the order is total', () => {
    const a = recipe('b-second', 'Ίδιο', 'Same', [])
    const b = recipe('a-first', 'ίδιο', 'same', [])
    expect(sortRecipes([a, b], 'el').map((r) => r.slug)).toEqual(['a-first', 'b-second'])
    expect(sortRecipes([b, a], 'en').map((r) => r.slug)).toEqual(['a-first', 'b-second'])
  })

  it('is deterministic and a permutation on the real seed', () => {
    const once = sortRecipes(RECIPES, 'el')
    const twice = sortRecipes([...RECIPES].reverse(), 'el')
    expect(once).toEqual(twice)
    expect(once.length).toBe(RECIPES.length)
    expect(new Set(once.map((r) => r.slug)).size).toBe(RECIPES.length)
  })
})

describe('recipeTitle', () => {
  it('picks the title for the language', () => {
    expect(recipeTitle(SALAD, 'el')).toBe('Χωριάτικη Σαλάτα')
    expect(recipeTitle(SALAD, 'en')).toBe('Greek salad')
  })
})

// --- URL state --------------------------------------------------------------------------------------

describe('parseRecipeFilterParams', () => {
  it('reads diet, meal and q with comma lists', () => {
    const params = parseRecipeFilterParams(
      new URLSearchParams('diet=keto,vegan&meal=lunch&q=salad'),
    )
    expect(params).toEqual({ dietSlugs: ['keto', 'vegan'], mealTypes: ['lunch'], query: 'salad' })
  })

  it('returns empty params for no search', () => {
    expect(parseRecipeFilterParams(new URLSearchParams(''))).toEqual({
      dietSlugs: [],
      mealTypes: [],
      query: '',
    })
  })

  it('accepts repeated keys as well as commas, dedupes, trims, drops blanks', () => {
    const params = parseRecipeFilterParams(
      new URLSearchParams('diet=keto&diet=vegan,%20keto,,&meal=lunch,lunch&q=%20%20σαλάτα%20'),
    )
    expect(params).toEqual({
      dietSlugs: ['keto', 'vegan'],
      mealTypes: ['lunch'],
      query: 'σαλάτα',
    })
  })

  it('drops unknown meal types and non-slug diet tokens', () => {
    const params = parseRecipeFilterParams(
      new URLSearchParams('meal=brunch,dinner,LUNCH&diet=keto,Keto,%3Cscript%3E,-bad,ok-1'),
    )
    expect(params.mealTypes).toEqual(['dinner'])
    expect(params.dietSlugs).toEqual(['keto', 'ok-1'])
  })

  it('drops diet slugs outside knownDietSlugs when given', () => {
    const params = parseRecipeFilterParams(new URLSearchParams('diet=keto,unicorn,vegan'), {
      knownDietSlugs: new Set(['keto', 'vegan']),
    })
    expect(params.dietSlugs).toEqual(['keto', 'vegan'])
  })

  it('never throws on junk', () => {
    expect(() =>
      parseRecipeFilterParams(new URLSearchParams('diet=&meal=&q=&x=1&diet=,,,')),
    ).not.toThrow()
  })
})

describe('serializeRecipeFilterParams', () => {
  it('omits empty criteria so a clean filter is an empty string', () => {
    expect(serializeRecipeFilterParams({}).toString()).toBe('')
    expect(
      serializeRecipeFilterParams({ dietSlugs: [], mealTypes: [], query: '  ' }).toString(),
    ).toBe('')
  })

  it('writes diet, meal and q, deduping lists', () => {
    const out = serializeRecipeFilterParams({
      dietSlugs: ['keto', 'vegan', 'keto'],
      mealTypes: ['lunch', 'dinner'],
      query: 'salad',
    })
    expect(out.get('diet')).toBe('keto,vegan')
    expect(out.get('meal')).toBe('lunch,dinner')
    expect(out.get('q')).toBe('salad')
  })

  it('round-trips through parse for canonical filters, including Greek queries', () => {
    const cases = [
      { dietSlugs: [], mealTypes: [], query: '' },
      { dietSlugs: ['keto'], mealTypes: [], query: '' },
      { dietSlugs: ['keto', 'vegan'], mealTypes: ['lunch', 'snack'], query: 'σαλάτα με φέτα' },
      { dietSlugs: [], mealTypes: ['breakfast'], query: 'a&b=c,d' },
    ] satisfies Parameters<typeof serializeRecipeFilterParams>[0][]
    for (const filter of cases) {
      const url = serializeRecipeFilterParams(filter).toString()
      expect(parseRecipeFilterParams(new URLSearchParams(url))).toEqual(filter)
    }
  })

  it('round-trips the other way: parse → serialize → parse is stable', () => {
    const first = parseRecipeFilterParams(
      new URLSearchParams('q=x&meal=dinner,lunch&diet=vegan&diet=keto'),
    )
    const second = parseRecipeFilterParams(serializeRecipeFilterParams(first))
    expect(second).toEqual(first)
  })
})

describe('isEmptyRecipeFilter', () => {
  it('is true only when nothing narrows', () => {
    expect(isEmptyRecipeFilter({})).toBe(true)
    expect(isEmptyRecipeFilter({ dietSlugs: [], mealTypes: [], query: ' ' })).toBe(true)
    expect(isEmptyRecipeFilter({ dietSlugs: ['keto'] })).toBe(false)
    expect(isEmptyRecipeFilter({ mealTypes: ['lunch'] })).toBe(false)
    expect(isEmptyRecipeFilter({ query: 'x' })).toBe(false)
  })
})
