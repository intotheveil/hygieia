// OVERLAY DIET-TAG RULES (2026-10-11, DECISIONS.md) — ONE rule set for every recipe an overlay
// ADDS from 0006 onward. Overlays 0006 and 0007 once carried two different rule sets (19 recipes of
// 0006 failed 0007's rules and 9 of 0007 failed 0006's), so both focused tests now import this
// module. Test helper, like fastingRule.ts: not imported by application code; never reaches the
// bundle.
//
// SCOPE: these rules bind overlay ADDITIONS (0006+) only. The base seed and overlay 0003 are applied
// live and are NOT retagged against them (the base follows its own, older conventions; its 44
// Atkins recipes happen to all be keto, which this module turns into a rule). The generic seed
// tests in recipes.test.ts (vegan, vegetarian, gluten-free, the base low-FODMAP and Whole30 lists,
// fasting) keep running over everything.
//
// SOUND: a tag that is present must be true. COMPLETE (keto, low-carb only): a recipe that meets
// the numbers carries the tag. Numbers are per portion, from the repo's own `computeNutrition`.

import type { IngredientSeed, RecipeSeed } from '../content/types'
import { computeNutrition } from '../nutrition/compute'

export type IngredientIndex = ReadonlyMap<string, IngredientSeed>

// --- thresholds --------------------------------------------------------------------------------
export const KETO_MAX_CARBS = 15
export const KETO_MIN_FAT_SHARE = 0.5
export const LOW_CARB_MAX_CARBS = 30
export const HIGH_PROTEIN_MIN_G = 25
export const HIGH_PROTEIN_MIN_SHARE = 0.25
export const IF_MIN_KCAL = 400
export const IF_MIN_PROTEIN_G = 25

/** The one wording of a low-FODMAP spring onion line (Monash: the green part only). */
export const SPRING_ONION_NOTE_EN = 'green part only'
export const SPRING_ONION_NOTE_EL = 'μόνο το πράσινο μέρος'

// --- ingredient lists --------------------------------------------------------------------------
/** A recipe with any of these is not keto-complete (it need not carry the tag). */
const GRAIN_SUGAR_LEGUME_CATEGORIES = ['grains-bread', 'pasta-rice', 'legumes', 'sweeteners']
/** Soy foods sit in the legumes category but keep a keto dish keto (low carb, fat or protein led). */
const SOY_FOODS = ['tofu', 'tempeh', 'edamame', 'soy-sauce']
const GRAIN_SUGAR_LEGUME_SLUGS = [
  'flour',
  'whole-wheat-flour',
  'chickpea-flour',
  'cornmeal',
  'cornstarch',
  'corn',
  'semolina',
  'breadcrumbs',
  'sugar',
  'brown-sugar',
  'peanuts',
  'peanut-butter',
]

const CARNIVORE_OK_SLUGS = ['water', 'salt', 'black-pepper', 'lard', 'tallow']
const CARNIVORE_OK_CATEGORIES = ['meat', 'poultry', 'fish-seafood', 'dairy-eggs']

const PALEO_FORBIDDEN_CATEGORIES = ['grains-bread', 'pasta-rice', 'legumes']
const PALEO_DAIRY_ALLOWED = ['egg', 'egg-white', 'ghee']
const PALEO_FORBIDDEN_SLUGS = [
  'soy-sauce',
  'miso',
  'gochujang',
  'rice-vinegar',
  'kimchi',
  'sunflower-oil',
  'sesame-oil', // a seed oil: out of paleo (Whole30 allows it)
  'margarine',
  'peanuts',
  'peanut-butter',
  'cornstarch',
  'corn',
  'cornmeal',
  'flour',
  'whole-wheat-flour',
  'chickpea-flour',
  'sugar',
  'brown-sugar',
  'baking-powder',
  'mayonnaise',
  'stock-cube',
]

/** On top of the generic Whole30 list in recipes.test.ts (which already runs over every overlay). */
const WHOLE30_EXTRA_SLUGS = [
  'prosciutto',
  'salami',
  'pastourma',
  'turkey-slices',
  'soy-sauce',
  'baking-powder',
  'maple-syrup',
  'honey',
]
const WHOLE30_BAD_CATEGORIES = ['grains-bread', 'pasta-rice', 'legumes', 'sweeteners']
const WHOLE30_DAIRY_ALLOWED = ['egg', 'egg-white', 'ghee']

/** On top of the generic low-FODMAP list in recipes.test.ts (Monash). */
const LOW_FODMAP_EXTRA_SLUGS = [
  'garlic-powder',
  'cashews',
  'pistachios',
  'sweet-potato',
  'pumpkin',
  'avocado',
  'beetroot',
  'fennel',
  'celeriac',
  'peas',
  'okra',
  'coconut-flour',
  'chickpea-flour',
  'sun-dried-tomatoes',
  'skyr',
  'ham',
  'turkey-slices',
  'soy-sauce',
]

/** A DASH dish must not contain: salt, cured / tinned fish, salty cheese, saturated-fat bases. */
export const DASH_FORBIDDEN = [
  'salt',
  'feta',
  'green-olives',
  'kalamata-olives',
  'olive-paste',
  'capers',
  'canned-sardines',
  'anchovies',
  'anchovy-fillets',
  'smoked-salmon',
  'smoked-herring',
  'salted-cod',
  'canned-tuna',
  'tarama',
  'soy-sauce',
  'fish-sauce',
  'miso',
  'gochujang',
  'kimchi',
  'sauerkraut',
  'pickles',
  'stock-cube',
  'ketchup',
  'mayonnaise',
  'bacon',
  'sausage',
  'ham',
  'pastourma',
  'prosciutto',
  'salami',
  'turkey-slices',
  'halloumi',
  'parmesan',
  'graviera',
  'kefalotyri',
  'kasseri',
  'mizithra',
  'anthotyro',
  'blue-cheese',
  'cheddar',
  'gouda',
  'mozzarella',
  'paneer',
  'cottage-cheese',
  'butter',
  'ghee',
  'heavy-cream',
  'sour-cream',
  'coconut-milk',
  'coconut-oil',
  'lard',
  'tallow',
  'margarine',
  'beef-mince',
  'beef-steak',
  'beef-stew',
  'pork-mince',
  'pork-chop',
  'pork-shoulder',
  'pork-tenderloin',
  'pork-belly',
  'lamb-chops',
  'lamb-leg',
]

/** Cuisines of the Mediterranean basin (0006 has no cuisine map; its dishes are not checked). */
export const MEDITERRANEAN_BASIN = ['Greek', 'Levantine', 'Turkish', 'North African', 'Egyptian']

// --- the rules ---------------------------------------------------------------------------------
export interface TagProblems {
  /** `tag: reason` — tags the recipe carries but must not. */
  remove: string[]
  /** `tag: reason` — tags the recipe lacks but must carry (complete-rule tags: keto, low-carb). */
  add: string[]
}

/**
 * Every disagreement between a recipe's diet tags and the unified rules. `cuisine` is optional:
 * when given, a Mediterranean tag also needs a basin cuisine.
 */
export function dietTagProblems(
  recipe: RecipeSeed,
  ingredients: IngredientIndex,
  cuisine?: string,
): TagProblems {
  const out: TagProblems = { remove: [], add: [] }
  const has = (t: string) => recipe.diet_slugs.includes(t)
  const bad = (t: string, why: string) => out.remove.push(`${t}: ${why}`)
  const rows = recipe.ingredients.map((l) => {
    const row = ingredients.get(l.ingredient_slug)
    if (!row) throw new Error(`${recipe.slug}: unknown ingredient ${l.ingredient_slug}`)
    return row
  })
  const slugs = rows.map((r) => r.slug)
  const p = computeNutrition(recipe, ingredients).perPortion
  const fatShare = (p.fat * 9) / p.kcal
  const proteinShare = (p.protein * 4) / p.kcal
  const pct = (x: number) => `${(x * 100).toFixed(0)}%`

  // keto — sound and complete
  const ketoNumbers = p.carbs <= KETO_MAX_CARBS && fatShare >= KETO_MIN_FAT_SHARE
  const grainSugarLegume = rows.some(
    (r) =>
      (GRAIN_SUGAR_LEGUME_CATEGORIES.includes(r.category) && !SOY_FOODS.includes(r.slug)) ||
      GRAIN_SUGAR_LEGUME_SLUGS.includes(r.slug),
  )
  const ketoEligible = ketoNumbers && !grainSugarLegume
  if (has('keto') && !ketoNumbers) {
    bad('keto', `carbs ${p.carbs.toFixed(1)} g, fat ${pct(fatShare)} of energy`)
  }
  if (ketoEligible && !has('keto'))
    out.add.push(`keto: carbs ${p.carbs.toFixed(1)} g, fat ${pct(fatShare)}`)
  // atkins — must also be keto
  if (has('atkins') && !has('keto') && !ketoEligible) bad('atkins', 'not keto')
  if (has('atkins') && !ketoNumbers) bad('atkins', 'fails the keto numbers')
  // low-carb — sound and complete
  if (has('low-carb') && p.carbs > LOW_CARB_MAX_CARBS)
    bad('low-carb', `carbs ${p.carbs.toFixed(1)} g`)
  if (!has('low-carb') && p.carbs <= LOW_CARB_MAX_CARBS)
    out.add.push(`low-carb: carbs ${p.carbs.toFixed(1)} g`)
  // high-protein
  if (
    has('high-protein') &&
    (p.protein < HIGH_PROTEIN_MIN_G || proteinShare < HIGH_PROTEIN_MIN_SHARE)
  ) {
    bad('high-protein', `protein ${p.protein.toFixed(1)} g, ${pct(proteinShare)} of energy`)
  }
  // intermittent fasting
  if (has('intermittent-fasting')) {
    if (recipe.meal_types.every((m) => m === 'snack')) bad('intermittent-fasting', 'snack-only')
    if (p.kcal < IF_MIN_KCAL) bad('intermittent-fasting', `kcal ${p.kcal.toFixed(0)}`)
    if (p.protein < IF_MIN_PROTEIN_G)
      bad('intermittent-fasting', `protein ${p.protein.toFixed(1)} g`)
  }
  // carnivore — animal products, animal fats, salt, pepper, water
  if (has('carnivore')) {
    for (const r of rows) {
      if (!CARNIVORE_OK_CATEGORIES.includes(r.category) && !CARNIVORE_OK_SLUGS.includes(r.slug)) {
        bad('carnivore', r.slug)
      }
    }
  }
  // paleo — ghee allowed, every seed / vegetable oil (sesame too) out
  if (has('paleo')) {
    for (const r of rows) {
      if (
        PALEO_FORBIDDEN_CATEGORIES.includes(r.category) ||
        PALEO_FORBIDDEN_SLUGS.includes(r.slug) ||
        (r.category === 'dairy-eggs' && !PALEO_DAIRY_ALLOWED.includes(r.slug))
      ) {
        bad('paleo', r.slug)
      }
    }
  }
  // whole30 — ghee allowed, sesame oil allowed
  if (has('whole30')) {
    for (const r of rows) {
      if (
        WHOLE30_BAD_CATEGORIES.includes(r.category) ||
        WHOLE30_EXTRA_SLUGS.includes(r.slug) ||
        (r.category === 'dairy-eggs' && !WHOLE30_DAIRY_ALLOWED.includes(r.slug))
      ) {
        bad('whole30', r.slug)
      }
    }
  }
  // low-fodmap — the extra Monash items, and the spring onion keeps to its greens
  if (has('low-fodmap')) {
    for (const s of slugs) if (LOW_FODMAP_EXTRA_SLUGS.includes(s)) bad('low-fodmap', s)
    for (const l of recipe.ingredients) {
      if (
        l.ingredient_slug === 'spring-onion' &&
        (l.note_en !== SPRING_ONION_NOTE_EN || l.note_el !== SPRING_ONION_NOTE_EL)
      ) {
        bad('low-fodmap', `spring onion note "${l.note_en ?? ''}" / "${l.note_el ?? ''}"`)
      }
    }
  }
  // DASH
  if (has('dash')) {
    for (const s of slugs) if (DASH_FORBIDDEN.includes(s)) bad('dash', s)
  }
  // Mediterranean — olive oil or tahini, and (when the cuisine is known) a basin cuisine
  if (has('mediterranean')) {
    if (!slugs.includes('olive-oil') && !slugs.includes('tahini')) {
      bad('mediterranean', 'no olive oil or tahini')
    }
    if (cuisine !== undefined && !MEDITERRANEAN_BASIN.includes(cuisine)) {
      bad('mediterranean', `cuisine ${cuisine}`)
    }
  }
  return out
}
