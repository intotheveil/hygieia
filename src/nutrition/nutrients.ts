// MICRONUTRIENT ENGINE — pure domain (women's nutrition layer, docs/research/women-audience-content.md
// proposal 3). Iron, calcium, vitamin D and folate per recipe and per portion, and whether one
// portion is a "source of" or "high in" each one against the EU Nutrient Reference Values.
//
// CONTRACT: `NUTRIENTS` and its string values are what `/recipes?nutrient=<value>` accepts; other
// pages link to them (`/recipes?nutrient=iron`). Renaming one breaks those links.
//
// Rules:
//   - Grams per line come from ./compute.ts `lineGrams` — the ONE unit → grams conversion both food
//     engines use (`line.unit ∈ {g, ml, ingredient.unit}`). No unit logic lives here.
//   - Per-100 g content is the table below, keyed by ingredient slug. An ingredient that is not in
//     the table, or a nutrient an entry does not list, counts as 0 — conservative on purpose: a
//     recipe is never called a source of something on a guess. Unknown recipe lines count as 0 too.
//   - Values are USDA FoodData Central, SR Legacy release (2018-04), per 100 g of the food AS THE SEED
//     DESCRIBES IT (dry legumes and grains, raw meat and fish, drained canned fish) — each entry names
//     its FDC id. Folate is "Folate, total" (nutrient 1177, µg); vitamin D is "Vitamin D (D2 + D3)"
//     (nutrient 1114, µg). A `proxy` note marks a Greek food mapped to its closest FDC food.
//   - Fortification: US rows for milk and plant drinks are fortified with vitamin D; EU milk mostly
//     is not, so milk uses the unfortified rows and plant drinks (whose fortification varies by brand)
//     are left out. Nothing here assumes a fortified product unless the slug says so (none does).
//   - Thresholds: a portion is a SOURCE at ≥ 15 % of the NRV and HIGH at ≥ 30 % (NRVs of Regulation
//     (EU) 1169/2011 Annex XIII Part A: iron 14 mg, calcium 800 mg, vitamin D 5 µg, folate 200 µg).
//     Reg. (EC) 1924/2006 states those claims per 100 g; this engine applies them per PORTION, which
//     is what a cook eats — they are informational estimates, not regulated nutrition claims.
//   - No rounding here: the display rounds (recipes/panelFormat.ts).

import type { IngredientSeed, RecipeSeed } from '../content/types.ts'
import { lineGrams, safePortions } from './compute.ts'

export const NUTRIENTS = ['iron', 'calcium', 'vitamin-d', 'folate'] as const
export type Nutrient = (typeof NUTRIENTS)[number]

const NUTRIENT_SET: ReadonlySet<string> = new Set<string>(NUTRIENTS)

export function isNutrient(value: string): value is Nutrient {
  return NUTRIENT_SET.has(value)
}

/** EU Nutrient Reference Values for adults, Reg. (EU) 1169/2011 Annex XIII Part A. */
export const NRV: Readonly<Record<Nutrient, number>> = {
  iron: 14,
  calcium: 800,
  'vitamin-d': 5,
  folate: 200,
}

/** The unit every amount of the nutrient is in (table, engine and NRV alike). */
export const NUTRIENT_UNIT: Readonly<Record<Nutrient, 'mg' | 'µg'>> = {
  iron: 'mg',
  calcium: 'mg',
  'vitamin-d': 'µg',
  folate: 'µg',
}

/** Share of the NRV one portion must reach to be a "source of" the nutrient. */
export const SOURCE_THRESHOLD = 0.15
/** Share of the NRV one portion must reach to be "high in" the nutrient. */
export const HIGH_THRESHOLD = 0.3

export type NutrientAmounts = Record<Nutrient, number>

/** Per-100 g content of one ingredient; an absent nutrient is 0. `source` names the FDC row. */
export type NutrientContent = Partial<NutrientAmounts> & { source: string }

const fdc = (id: number, extra = ''): string =>
  `USDA FoodData Central SR Legacy, FDC ${id}${extra === '' ? '' : ` (${extra})`}`

/**
 * Per 100 g, keyed by ingredient slug (src/content/seed/ingredients.ts + overlays). Only foods that
 * are meaningful sources of at least one of the four are listed; everything else counts as 0.
 * Left out on purpose (no close FDC match, so no number rather than a guess): halloumi, kasseri,
 * manouri, mizithra, anthotyro, skyr, sheep yoghurt, gigantes, fava (split peas, dry), fresh broad
 * beans, fresh sardines, sea bream, red mullet, tarama, nutritional yeast, plant drinks, white bread
 * (US rows are enriched).
 */
export const NUTRIENT_CONTENT_100G: Readonly<Record<string, NutrientContent>> = {
  // --- Legumes (dry unless the slug says canned) ---
  lentils: { iron: 6.51, calcium: 35, folate: 479, source: fdc(172420, 'lentils, raw') },
  'red-lentils': { iron: 7.39, calcium: 48, folate: 204, source: fdc(174284) },
  chickpeas: { iron: 4.31, calcium: 57, folate: 557, source: fdc(173756) },
  'canned-chickpeas': { iron: 1.07, calcium: 45, folate: 48, source: fdc(173800, 'drained') },
  'chickpea-flour': { iron: 4.86, calcium: 45, folate: 437, source: fdc(174288) },
  'white-beans': { iron: 10.44, calcium: 240, folate: 388, source: fdc(175202) },
  'black-beans': { iron: 5.02, calcium: 123, folate: 444, source: fdc(173734) },
  'kidney-beans': { iron: 8.2, calcium: 143, folate: 394, source: fdc(175193) },
  'black-eyed-peas': { iron: 8.27, calcium: 110, folate: 633, source: fdc(173758) },
  lupini: { iron: 4.36, calcium: 176, folate: 355, source: fdc(172423) },
  edamame: { iron: 2.11, calcium: 60, folate: 303, source: fdc(168410, 'frozen') },
  tofu: { iron: 2.66, calcium: 683, folate: 29, source: fdc(172475, 'firm, calcium sulfate') },
  tempeh: { iron: 2.7, calcium: 111, folate: 24, source: fdc(174272) },
  hummus: { iron: 2.54, calcium: 47, folate: 48, source: fdc(174289) },

  // --- Vegetables and fruit (raw) ---
  spinach: { iron: 2.71, calcium: 99, folate: 194, source: fdc(168462) },
  chard: { iron: 1.8, calcium: 51, folate: 14, source: fdc(169991) },
  vlita: { iron: 2.32, calcium: 215, folate: 85, source: fdc(168385, 'amaranth leaves') },
  horta: { iron: 3.1, calcium: 187, folate: 27, source: fdc(169226, 'proxy: dandelion greens') },
  rocket: { iron: 1.46, calcium: 160, folate: 97, source: fdc(169387) },
  kale: { iron: 1.6, calcium: 254, folate: 62, source: fdc(168421) },
  broccoli: { iron: 0.73, calcium: 47, folate: 63, source: fdc(170379) },
  'brussels-sprouts': { iron: 1.4, calcium: 42, folate: 61, source: fdc(170383) },
  'bok-choy': { iron: 0.8, calcium: 105, folate: 66, source: fdc(170390) },
  asparagus: { iron: 2.14, calcium: 24, folate: 52, source: fdc(168389) },
  avocado: { iron: 0.55, calcium: 12, folate: 81, source: fdc(171705) },
  artichoke: { iron: 1.28, calcium: 44, folate: 68, source: fdc(169205) },
  beetroot: { iron: 0.8, calcium: 16, folate: 109, source: fdc(169145) },
  peas: { iron: 1.47, calcium: 25, folate: 65, source: fdc(170419) },
  'green-beans': { iron: 1.03, calcium: 37, folate: 33, source: fdc(169961) },
  okra: { iron: 0.62, calcium: 82, folate: 60, source: fdc(169260) },
  'vine-leaves': { iron: 2.63, calcium: 363, folate: 83, source: fdc(168575) },
  orange: { iron: 0.1, calcium: 40, folate: 30, source: fdc(169097) },
  'dried-fig': { iron: 2.03, calcium: 162, folate: 9, source: fdc(174665) },
  // White mushrooms grown in the dark carry almost no vitamin D (UV-treated ones do; not assumed).
  mushrooms: { iron: 0.5, calcium: 3, 'vitamin-d': 0.2, folate: 17, source: fdc(169251) },

  // --- Grains, seeds and nuts ---
  oats: { iron: 4.25, calcium: 52, folate: 32, source: fdc(173904, 'not fortified') },
  quinoa: { iron: 4.57, calcium: 47, folate: 184, source: fdc(168874) },
  buckwheat: { iron: 2.2, calcium: 18, folate: 30, source: fdc(170286) },
  teff: { iron: 7.63, calcium: 180, source: fdc(169747, 'no folate value') },
  'whole-wheat-bread': { iron: 2.47, calcium: 161, folate: 42, source: fdc(172688) },
  'sesame-seeds': { iron: 14.55, calcium: 975, folate: 97, source: fdc(170150, 'whole') },
  tahini: { iron: 8.95, calcium: 426, folate: 98, source: fdc(170189) },
  'pumpkin-seeds': { iron: 8.82, calcium: 46, folate: 58, source: fdc(170556) },
  'chia-seeds': { iron: 7.72, calcium: 631, folate: 49, source: fdc(170554) },
  almonds: { iron: 3.71, calcium: 269, folate: 44, source: fdc(170567) },
  pistachios: { iron: 3.92, calcium: 105, folate: 51, source: fdc(170184) },
  cashews: { iron: 6.68, calcium: 37, folate: 25, source: fdc(170162) },
  'cocoa-powder': { iron: 13.86, calcium: 128, folate: 32, source: fdc(169593) },
  'dark-chocolate': { iron: 11.9, calcium: 73, source: fdc(170273, '70-85 %') },

  // --- Eggs and dairy (milk: the rows WITHOUT added vitamin D, as EU milk is sold) ---
  egg: { iron: 1.75, calcium: 56, 'vitamin-d': 2, folate: 47, source: fdc(171287) },
  milk: { iron: 0.03, calcium: 113, 'vitamin-d': 0.1, folate: 5, source: fdc(172217) },
  'semi-skimmed-milk': { iron: 0.02, calcium: 120, folate: 5, source: fdc(172205) },
  // Only a vitamin-D-fortified goat milk row exists: calcium, iron and folate only.
  'goat-milk': { iron: 0.05, calcium: 134, folate: 1, source: fdc(171278, 'vitamin D not used') },
  'greek-yoghurt': { calcium: 100, folate: 5, source: fdc(171304) },
  'greek-yoghurt-light': { iron: 0.04, calcium: 115, folate: 12, source: fdc(170903) },
  feta: { iron: 0.65, calcium: 493, 'vitamin-d': 0.4, folate: 32, source: fdc(173420) },
  parmesan: { iron: 0.82, calcium: 1184, 'vitamin-d': 0.5, folate: 7, source: fdc(170848) },
  kefalotyri: {
    iron: 0.77,
    calcium: 1064,
    'vitamin-d': 0.5,
    folate: 7,
    source: fdc(171249, 'proxy: romano'),
  },
  graviera: {
    iron: 0.17,
    calcium: 1011,
    'vitamin-d': 0.6,
    folate: 10,
    source: fdc(171242, 'proxy: gruyere'),
  },
  cheddar: { iron: 0.14, calcium: 710, 'vitamin-d': 0.6, folate: 27, source: fdc(173414) },
  gouda: { iron: 0.24, calcium: 700, 'vitamin-d': 0.5, folate: 21, source: fdc(171241) },
  emmental: { iron: 0.13, calcium: 890, folate: 10, source: fdc(171251, 'swiss') },
  mozzarella: { iron: 0.44, calcium: 505, 'vitamin-d': 0.4, folate: 7, source: fdc(170845) },
  ricotta: { iron: 0.13, calcium: 206, 'vitamin-d': 0.2, folate: 4, source: fdc(170851) },
  'cottage-cheese': { iron: 0.07, calcium: 83, 'vitamin-d': 0.1, folate: 12, source: fdc(172179) },

  // --- Meat and offal (raw) ---
  'beef-mince': { iron: 2.09, calcium: 15, 'vitamin-d': 0.1, folate: 6, source: fdc(171796) },
  'beef-steak': { iron: 1.99, calcium: 4, 'vitamin-d': 0.2, folate: 8, source: fdc(168694) },
  'beef-stew': { iron: 1.67, calcium: 17, folate: 10, source: fdc(169491, 'chuck') },
  'lamb-mince': { iron: 1.55, calcium: 16, 'vitamin-d': 0.1, folate: 18, source: fdc(174370) },
  'beef-liver': { iron: 4.9, calcium: 5, 'vitamin-d': 1.2, folate: 290, source: fdc(169451) },
  'chicken-liver': { iron: 8.99, calcium: 8, folate: 588, source: fdc(171060) },
  'beef-kidney': { iron: 4.6, calcium: 13, 'vitamin-d': 1.1, folate: 98, source: fdc(169449) },
  'beef-heart': { iron: 4.31, calcium: 7, folate: 3, source: fdc(168625) },
  'beef-tongue': { iron: 2.95, calcium: 6, folate: 7, source: fdc(170196) },

  // --- Fish and seafood (raw; canned = drained) ---
  'canned-sardines': {
    iron: 2.92,
    calcium: 382,
    'vitamin-d': 4.8,
    folate: 10,
    source: fdc(175139, 'in oil, with bone'),
  },
  salmon: { iron: 0.34, calcium: 9, 'vitamin-d': 11, folate: 26, source: fdc(175167, 'farmed') },
  'smoked-salmon': { iron: 0.85, calcium: 11, 'vitamin-d': 17.1, folate: 2, source: fdc(173687) },
  mackerel: { iron: 1.63, calcium: 12, 'vitamin-d': 16.1, folate: 1, source: fdc(175119) },
  trout: { iron: 0.31, calcium: 25, 'vitamin-d': 15.9, folate: 11, source: fdc(173717) },
  swordfish: { iron: 0.38, calcium: 5, 'vitamin-d': 13.9, folate: 2, source: fdc(173703) },
  'sea-bass': { iron: 0.29, calcium: 10, 'vitamin-d': 5.6, folate: 5, source: fdc(175142) },
  'smoked-herring': {
    iron: 1.51,
    calcium: 84,
    'vitamin-d': 2.2,
    folate: 14,
    source: fdc(173668, 'kippered'),
  },
  anchovies: { iron: 3.25, calcium: 147, folate: 9, source: fdc(174182) },
  'anchovy-fillets': {
    iron: 4.63,
    calcium: 232,
    'vitamin-d': 1.7,
    folate: 13,
    source: fdc(174183, 'in oil'),
  },
  'canned-tuna': { iron: 1.63, calcium: 17, 'vitamin-d': 1.2, folate: 4, source: fdc(173709) },
  'tuna-steak': { iron: 0.77, calcium: 4, 'vitamin-d': 1.7, folate: 2, source: fdc(175159) },
  cod: { iron: 0.38, calcium: 16, 'vitamin-d': 0.9, folate: 7, source: fdc(171955) },
  'salted-cod': { iron: 2.5, calcium: 160, 'vitamin-d': 4, folate: 25, source: fdc(174190) },
  mussels: { iron: 3.95, calcium: 26, folate: 42, source: fdc(174216) },
  octopus: { iron: 5.3, calcium: 53, folate: 16, source: fdc(174218) },
  shrimp: { iron: 0.21, calcium: 54, 'vitamin-d': 0.1, folate: 19, source: fdc(174210) },
}

const zero = (): NutrientAmounts => ({ iron: 0, calcium: 0, 'vitamin-d': 0, folate: 0 })

export interface NutrientResult {
  perRecipe: NutrientAmounts
  perPortion: NutrientAmounts
  /** The divisor actually used (`recipe.portions`, floored at 1 — same as computeNutrition). */
  portions: number
}

/**
 * Iron (mg), calcium (mg), vitamin D (µg) and folate (µg) for the whole recipe and one portion.
 * `table` defaults to NUTRIENT_CONTENT_100G (tests pass their own fixtures).
 */
export function computeNutrients(
  recipe: RecipeSeed,
  ingredientsBySlug: ReadonlyMap<string, IngredientSeed>,
  table: Readonly<Record<string, NutrientContent>> = NUTRIENT_CONTENT_100G,
): NutrientResult {
  const perRecipe = zero()
  for (const line of recipe.ingredients) {
    const ingredient = ingredientsBySlug.get(line.ingredient_slug)
    const content = Object.hasOwn(table, line.ingredient_slug)
      ? table[line.ingredient_slug]
      : undefined
    if (!ingredient || !content) continue
    const { grams } = lineGrams(line, ingredient)
    for (const nutrient of NUTRIENTS) {
      perRecipe[nutrient] += ((content[nutrient] ?? 0) * grams) / 100
    }
  }
  const portions = safePortions(recipe.portions)
  const perPortion = zero()
  for (const nutrient of NUTRIENTS) perPortion[nutrient] = perRecipe[nutrient] / portions
  return { perRecipe, perPortion, portions }
}

/** `amount` as a fraction of the nutrient's NRV (0.21 = 21 %). */
export function nrvShare(nutrient: Nutrient, amount: number): number {
  return amount / NRV[nutrient]
}

export type NutrientLevel = 'source' | 'high'

/** `high` at ≥ HIGH_THRESHOLD of the NRV, `source` at ≥ SOURCE_THRESHOLD, otherwise null. */
export function nutrientLevel(nutrient: Nutrient, perPortion: number): NutrientLevel | null {
  const share = nrvShare(nutrient, perPortion)
  if (share >= HIGH_THRESHOLD) return 'high'
  if (share >= SOURCE_THRESHOLD) return 'source'
  return null
}

export interface NutrientClaim {
  nutrient: Nutrient
  level: NutrientLevel
  /** Per portion, in NUTRIENT_UNIT[nutrient]. */
  amount: number
  /** Per portion, as a fraction of the NRV. */
  share: number
}

/** The nutrients one portion is at least a source of, in NUTRIENTS order. */
export function nutrientClaims(result: NutrientResult): NutrientClaim[] {
  const claims: NutrientClaim[] = []
  for (const nutrient of NUTRIENTS) {
    const amount = result.perPortion[nutrient]
    const level = nutrientLevel(nutrient, amount)
    if (level !== null) claims.push({ nutrient, level, amount, share: nrvShare(nutrient, amount) })
  }
  return claims
}

/** True when one portion of `recipe` is at least a source of `nutrient`. */
export function isSourceOf(
  recipe: RecipeSeed,
  ingredientsBySlug: ReadonlyMap<string, IngredientSeed>,
  nutrient: Nutrient,
): boolean {
  return (
    nutrientLevel(nutrient, computeNutrients(recipe, ingredientsBySlug).perPortion[nutrient]) !==
    null
  )
}
