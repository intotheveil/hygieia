import {
  containsPlaceholderMarkers,
  hasGreek,
  leaves,
  looksUntranslated,
} from '../../test/bilingual'
import { PRICE_PER, SLUG_RE, UNITS } from '../enums'
import type { IngredientSeed } from '../types'
import { INGREDIENTS } from './ingredients'

/** PLAN.md §P1.9: the floor the gate and P1.12/P1.13 assert; the file carries far more. */
const MIN_COUNT = 160
const SOURCE_NOTE = 'Typical values, USDA FoodData Central reference ranges'
const GREEK_SCRIPT = /[Ͱ-Ͽ]/
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Slugs whose `name_el` is allowed to stay Latin-script (PLAN.md §0: loanwords such as keto/paleo
 * stay Latin in `el`). Every food loanword in the file is transliterated the way Greeks write it
 * (κινόα, τόφου, κέιλ, σκυρ), so the list is empty today; add a slug here ONLY when a Greek
 * speaker would really write the name in Latin letters.
 */
const LATIN_NAME_EL_ALLOWLIST: readonly string[] = []

const bySlug = new Map(INGREDIENTS.map((row) => [row.slug, row]))

describe('INGREDIENTS seed — volume and identity', () => {
  it(`has at least ${MIN_COUNT} rows (actual count logged)`, () => {
    console.log(`INGREDIENTS count: ${INGREDIENTS.length}`)
    expect(INGREDIENTS.length).toBeGreaterThanOrEqual(MIN_COUNT)
  })

  it('every slug matches SLUG_RE and is unique', () => {
    const seen = new Set<string>()
    for (const row of INGREDIENTS) {
      expect(row.slug, `slug ${row.slug}`).toMatch(SLUG_RE)
      expect(seen.has(row.slug), `duplicate slug ${row.slug}`).toBe(false)
      seen.add(row.slug)
    }
    expect(seen.size).toBe(INGREDIENTS.length)
  })

  it('every name_el and name_en is non-blank', () => {
    for (const row of INGREDIENTS) {
      expect(row.name_el.trim(), `${row.slug} name_el`).not.toBe('')
      expect(row.name_en.trim(), `${row.slug} name_en`).not.toBe('')
    }
  })

  it('every name_el contains Greek script unless allow-listed as a Latin loanword', () => {
    for (const row of INGREDIENTS) {
      if (LATIN_NAME_EL_ALLOWLIST.includes(row.slug)) continue
      expect(row.name_el, `${row.slug} name_el "${row.name_el}"`).toMatch(GREEK_SCRIPT)
    }
  })

  it('the Latin-name allow-list only names slugs that exist (no stale entries)', () => {
    for (const slug of LATIN_NAME_EL_ALLOWLIST) {
      expect(bySlug.has(slug), `allow-listed ${slug} is not in the file`).toBe(true)
    }
  })

  it('no two rows share a name in either language (no duplicates by meaning)', () => {
    const el = new Set<string>()
    const en = new Set<string>()
    for (const row of INGREDIENTS) {
      const keyEl = row.name_el.toLowerCase()
      const keyEn = row.name_en.toLowerCase()
      expect(el.has(keyEl), `duplicate name_el ${row.name_el}`).toBe(false)
      expect(en.has(keyEn), `duplicate name_en ${row.name_en}`).toBe(false)
      el.add(keyEl)
      en.add(keyEn)
    }
  })
})

describe('INGREDIENTS seed — nutrition (per 100 g)', () => {
  it('macros are each ≥ 0 and sum to ≤ 100 g', () => {
    for (const row of INGREDIENTS) {
      expect(row.protein_100g, `${row.slug} protein`).toBeGreaterThanOrEqual(0)
      expect(row.carbs_100g, `${row.slug} carbs`).toBeGreaterThanOrEqual(0)
      expect(row.fat_100g, `${row.slug} fat`).toBeGreaterThanOrEqual(0)
      const sum = row.protein_100g + row.carbs_100g + row.fat_100g
      expect(sum, `${row.slug} macro sum ${sum}`).toBeLessThanOrEqual(100)
    }
  })

  it('kcal is within 0..900 (pure fat is ≤ 900 kcal/100 g)', () => {
    for (const row of INGREDIENTS) {
      expect(row.kcal_100g, `${row.slug} kcal`).toBeGreaterThanOrEqual(0)
      expect(row.kcal_100g, `${row.slug} kcal`).toBeLessThanOrEqual(900)
    }
  })

  it('kcal is consistent with the macros (Atwater 4/4/9, ±25 % or ±20 kcal)', () => {
    // A sanity net against typos: a swapped carbs/fat or a misplaced decimal point shows up here.
    // Exempt by design, each for a physical reason (not to make the test pass):
    const exempt = new Set([
      // sugar alcohols / sweeteners: carbs are counted, energy is not
      'erythritol',
      'stevia',
      // energy from ethanol, which is not a macro
      'red-wine',
      'white-wine',
      'beer',
      'ouzo',
      'vanilla-extract',
      // fibre-dominated: USDA credits fibre at well under 4 kcal/g
      'psyllium-husk',
      'cocoa-powder',
      'cinnamon',
      'cloves',
      'allspice',
      'paprika',
      'chilli-flakes',
      // leavening: non-digestible starch and mineral salts
      'baking-powder',
    ])
    for (const row of INGREDIENTS) {
      if (exempt.has(row.slug)) continue
      const atwater = row.protein_100g * 4 + row.carbs_100g * 4 + row.fat_100g * 9
      const tolerance = Math.max(20, atwater * 0.25)
      expect(
        Math.abs(row.kcal_100g - atwater),
        `${row.slug}: kcal ${row.kcal_100g} vs Atwater ${atwater.toFixed(0)}`,
      ).toBeLessThanOrEqual(tolerance)
    }
  })

  it('source_note is the exact USDA reference-range label on every row', () => {
    for (const row of INGREDIENTS) {
      expect(row.source_note, row.slug).toBe(SOURCE_NOTE)
    }
  })
})

describe('INGREDIENTS seed — units and prices', () => {
  it('unit is one of UNITS and grams_per_unit > 0', () => {
    for (const row of INGREDIENTS) {
      expect(UNITS, `${row.slug} unit ${row.unit}`).toContain(row.unit)
      expect(row.grams_per_unit, `${row.slug} grams_per_unit`).toBeGreaterThan(0)
    }
  })

  it('g and ml rows weigh exactly 1 g per unit', () => {
    for (const row of INGREDIENTS) {
      if (row.unit === 'g' || row.unit === 'ml') {
        expect(row.grams_per_unit, `${row.slug} grams_per_unit`).toBe(1)
      }
    }
  })

  it('0 ≤ price_eur_min ≤ price_eur_max and price_per is one of PRICE_PER', () => {
    for (const row of INGREDIENTS) {
      expect(row.price_eur_min, `${row.slug} price min`).toBeGreaterThanOrEqual(0)
      expect(row.price_eur_max, `${row.slug} price max`).toBeGreaterThanOrEqual(row.price_eur_min)
      expect(PRICE_PER, `${row.slug} price_per ${row.price_per}`).toContain(row.price_per)
    }
  })

  it('price_as_of is an ISO date that parses, and price_note names the basis', () => {
    for (const row of INGREDIENTS) {
      expect(row.price_as_of, `${row.slug} price_as_of`).toMatch(ISO_DATE)
      expect(Number.isNaN(Date.parse(row.price_as_of)), `${row.slug} price_as_of`).toBe(false)
      expect(row.price_note, `${row.slug} price_note`).toMatch(/\bper\b/)
    }
  })
})

describe('INGREDIENTS seed — substitutes, categories, staples', () => {
  it('every substitute_slugs entry resolves to another row and never to itself', () => {
    for (const row of INGREDIENTS) {
      for (const sub of row.substitute_slugs) {
        expect(bySlug.has(sub), `${row.slug} → ${sub} does not resolve`).toBe(true)
        expect(sub, `${row.slug} lists itself as a substitute`).not.toBe(row.slug)
      }
      expect(new Set(row.substitute_slugs).size, `${row.slug} duplicate substitutes`).toBe(
        row.substitute_slugs.length,
      )
    }
  })

  it('has a meaningful number of substitutes (≥ 100 rows carry at least one)', () => {
    const withSubs = INGREDIENTS.filter((row) => row.substitute_slugs.length > 0)
    expect(withSubs.length).toBeGreaterThanOrEqual(100)
  })

  it('every category is a slug-shaped string that appears at least 3 times', () => {
    const counts = new Map<string, number>()
    for (const row of INGREDIENTS) {
      expect(row.category, `${row.slug} category`).toMatch(SLUG_RE)
      counts.set(row.category, (counts.get(row.category) ?? 0) + 1)
    }
    for (const [category, n] of counts) {
      expect(n, `category ${category} has only ${n} rows`).toBeGreaterThanOrEqual(3)
    }
    expect(counts.size).toBeGreaterThanOrEqual(10)
  })

  it('at least 12 pantry staples, and the obvious ones are among them', () => {
    const staples = INGREDIENTS.filter((row) => row.is_pantry_staple).map((row) => row.slug)
    expect(staples.length).toBeGreaterThanOrEqual(12)
    for (const slug of [
      'salt',
      'black-pepper',
      'water',
      'olive-oil',
      'red-wine-vinegar',
      'oregano',
    ]) {
      expect(staples, `${slug} should be a pantry staple`).toContain(slug)
    }
  })

  it('covers the staples every diet page needs', () => {
    const required = [
      // Mediterranean / Greek
      'olive-oil',
      'feta',
      'greek-yoghurt',
      'kalamata-olives',
      'oregano',
      'lemon',
      'tahini',
      'halloumi',
      'trahana',
      'fava',
      'horta',
      'octopus',
      'sardines',
      'anchovies',
      // keto / Atkins / low-carb
      'butter',
      'heavy-cream',
      'avocado',
      'almond-flour',
      'cauliflower',
      'zucchini',
      // carnivore
      'beef-steak',
      'beef-liver',
      'bone-marrow',
      'lard',
      // vegan / vegetarian
      'tofu',
      'tempeh',
      'lentils',
      'chickpeas',
      'oat-milk',
      'nutritional-yeast',
      // paleo
      'sweet-potato',
      'walnuts',
      'almonds',
      'egg',
    ]
    for (const slug of required) {
      expect(bySlug.has(slug), `missing ${slug}`).toBe(true)
    }
  })

  it('is exported as a readonly array of IngredientSeed (compile-time)', () => {
    const first: IngredientSeed | undefined = INGREDIENTS[0]
    expect(first).toBeDefined()
    expectTypeOf(INGREDIENTS).toEqualTypeOf<readonly IngredientSeed[]>()
  })
})

describe('INGREDIENTS seed — bilingual completeness sweep (PLAN.md P5.5)', () => {
  it('name_en carries no Greek script', () => {
    for (const row of INGREDIENTS) {
      expect(hasGreek(row.name_en), `${row.slug} name_en "${row.name_en}"`).toBe(false)
    }
  })

  it('name_el never repeats name_en, except allow-listed Latin loanwords', () => {
    for (const row of INGREDIENTS) {
      const allow = LATIN_NAME_EL_ALLOWLIST.includes(row.slug) ? [row.name_en] : []
      expect(looksUntranslated(row.name_el, row.name_en, allow), `${row.slug} name`).toBe(false)
    }
  })

  it('no leaf carries a placeholder marker (names, notes, slugs, dates)', () => {
    for (const row of INGREDIENTS) {
      for (const [path, value] of leaves(row)) {
        expect(containsPlaceholderMarkers(value), `${row.slug} ${path} "${value}"`).toBe(false)
      }
    }
  })

  it('substitute_slugs has no blank entries', () => {
    for (const row of INGREDIENTS) {
      for (const s of row.substitute_slugs) {
        expect(s.trim(), `${row.slug} blank substitute slug`).not.toBe('')
      }
    }
  })
})
