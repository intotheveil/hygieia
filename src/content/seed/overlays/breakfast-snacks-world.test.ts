// OVERLAY 0007 — breakfast, snacks and the world kitchen (./0007-breakfast-snacks-world.ts). The
// generic seed rules (bilingual completeness, units, kcal window, mechanical diet compliance for
// vegan / vegetarian / pescatarian / gluten-free / low-FODMAP / Whole30 / fasting, coverage) already
// run over the overlaid seed in ../recipes.test.ts, ../ingredients.test.ts and
// ../ingredients-sanity.test.ts. What is proven HERE is specific to this overlay:
//   * it is registered after 0005 and adds exactly 60 recipes and 12 ingredients, no patches;
//   * meal-type minimums (>= 25 breakfast, >= 20 snack) and >= 30 international dishes, with an
//     explicit slug -> cuisine map so a rename or a stray addition is a visible change;
//   * every slug and title is new against everything served before this overlay;
//   * the diet tags the generic tests cannot see (low-carb, keto, Atkins, high-protein, intermittent
//     fasting, DASH, Mediterranean, paleo, hidden animal products) hold, and `fasting` is tagged on
//     exactly the dishes the fasting rule admits;
//   * the thin diets (low-FODMAP, Whole30, IF, paleo, DASH) really gained recipes;
//   * the new ingredients are used, priced and sourced, and the bundled source serves the rows.

import { describe, expect, it } from 'vitest'
import { computeNutrition } from '../../../nutrition/compute'
import { isFastingForbidden } from '../../../test/fastingRule'
import { OVERLAID_SEED } from '../../../test/overlaidSeed'
import { bundledSource, seedId } from '../../bundled'
import { INGREDIENTS } from '../ingredients'
import { RECIPES } from '../recipes'
import { OVERLAY } from './0007-breakfast-snacks-world'
import { OVERLAYS } from './index'

const additions = OVERLAY.additions ?? {}
const newRecipes = additions.recipes ?? []
const newIngredients = additions.ingredients ?? []
const ingredientsBySlug = new Map(OVERLAID_SEED.ingredients.map((i) => [i.slug, i]))

/** Every new dish and the cuisine it comes from. Pinned: the photo lane and this test read it. */
const CUISINE: Readonly<Record<string, string>> = {
  'tamagoyaki-japanese-rolled-omelette': 'Japanese',
  'miso-soup-tofu-spinach': 'Japanese',
  'okayu-japanese-rice-porridge-egg': 'Japanese',
  'congee-chicken-ginger-spring-onion': 'Chinese',
  'tea-eggs-chinese-marbled': 'Chinese',
  'tomato-egg-stir-fry-chinese': 'Chinese',
  'scallion-pancakes-cong-you-bing': 'Chinese',
  'kimchi-fried-rice-fried-egg': 'Korean',
  'gyeran-jjim-korean-steamed-egg': 'Korean',
  'chakchouka-tunisian-eggs-peppers': 'North African',
  'cilbir-turkish-poached-eggs-garlic-yoghurt': 'Turkish',
  'foul-medames-egyptian-fava-beans': 'Egyptian',
  'labneh-zaatar-olive-oil-plate': 'Levantine',
  'masala-omelette-indian-spiced': 'Indian',
  'besan-chilla-chickpea-flour-pancakes': 'Indian',
  'masala-oats-savoury-indian-porridge': 'Indian',
  'mango-lassi-yoghurt-drink': 'Indian',
  'teff-porridge-ethiopian-banana-cinnamon': 'Ethiopian',
  'huevos-rancheros-mexican-eggs-black-beans': 'Mexican',
  'arepas-venezuelan-cornmeal-cheese': 'Latin American',
  'patacones-green-plantain-lime': 'Latin American',
  'gallo-pinto-costa-rican-rice-beans-egg': 'Latin American',
  'smorrebrod-rye-egg-radish-dill': 'Nordic',
  'syrniki-russian-cottage-cheese-pancakes': 'Eastern European',
  'draniki-belarusian-potato-pancakes': 'Eastern European',
  'khai-jiao-thai-omelette-rice': 'Thai',
  'banh-mi-op-la-vietnamese-eggs-pickled-carrot': 'Vietnamese',
  'edamame-lime-chilli-flakes': 'Japanese',
  'onigiri-salmon-nori': 'Japanese',
  'hiyayakko-chilled-tofu-ginger': 'Japanese',
  'gimbap-korean-rice-rolls': 'Korean',
  'goi-cuon-vietnamese-shrimp-rice-paper-rolls': 'Vietnamese',
  'chana-chaat-indian-chickpea-salad': 'Indian',
  'paneer-tikka-skewers-yoghurt-marinade': 'Indian',
  'muhammara-roasted-pepper-walnut-dip': 'Levantine',
  'ezme-turkish-spicy-tomato-pepper-salad': 'Turkish',
  'moroccan-carrot-salad-cumin-orange': 'North African',
  'zaalouk-moroccan-aubergine-tomato-salad': 'North African',
  'guacamole-classic-mexican': 'Mexican',
  'ceviche-peruvian-sea-bass-lime': 'Peruvian',
  'esquites-mexican-street-corn-cup': 'Mexican',
  'mizeria-polish-cucumber-salad': 'Eastern European',
  'falafel-baked-herb-chickpea-patties': 'Levantine',
  'vinegret-russian-beetroot-potato-salad': 'Eastern European',
  'misir-wat-ethiopian-red-lentil-stew': 'Ethiopian',
  'harira-moroccan-lentil-chickpea-soup': 'North African',
  'chicken-tagine-apricots-almonds': 'North African',
  'mercimek-corbasi-turkish-red-lentil-soup': 'Turkish',
  'fattoush-levantine-bread-salad': 'Levantine',
  'shish-taouk-lemon-garlic-chicken-skewers': 'Levantine',
  'mapo-tofu-sichuan-style': 'Chinese',
  'pho-ga-vietnamese-chicken-noodle-soup': 'Vietnamese',
  'tom-kha-gai-thai-coconut-chicken-soup': 'Thai',
  'larb-gai-thai-chicken-lettuce-cups': 'Thai',
  'bibimbap-korean-rice-bowl-vegetables-egg': 'Korean',
  'bulgogi-beef-lettuce-wraps': 'Korean',
  'nasu-dengaku-miso-glazed-aubergine': 'Japanese',
  'lohikeitto-finnish-salmon-soup': 'Nordic',
  'borscht-ukrainian-beetroot-soup': 'Eastern European',
  'chicken-paprikash-hungarian': 'Eastern European',
}

/** Cuisines of the Mediterranean basin: the only ones allowed to carry the `mediterranean` tag. */
const MEDITERRANEAN_BASIN = ['Levantine', 'Turkish', 'North African', 'Egyptian']

/** Ingredients a DASH-tagged dish must not contain (salt, cured / tinned fish, salty cheese, …). */
const DASH_FORBIDDEN = [
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

/** What a paleo-tagged dish must not contain: grains, legumes, dairy, soy, seed oils, refined sugar. */
const PALEO_FORBIDDEN_CATEGORIES = ['grains-bread', 'pasta-rice', 'legumes']
const PALEO_FORBIDDEN_SLUGS = [
  'soy-sauce',
  'miso',
  'gochujang',
  'rice-vinegar',
  'kimchi',
  'sunflower-oil',
  'sesame-oil',
  'margarine',
  'peanuts',
  'peanut-butter',
  'cornstarch',
  'corn',
  'cornmeal',
  'flour',
  'chickpea-flour',
  'sugar',
  'brown-sugar',
  'baking-powder',
  'mayonnaise',
  'stock-cube',
]

const norm = (s: string) => s.toLocaleLowerCase('el').normalize('NFD').replace(/\p{M}/gu, '')
const perPortion = (slug: string) => {
  const recipe = newRecipes.find((r) => r.slug === slug)
  if (!recipe) throw new Error(`unknown recipe ${slug}`)
  return computeNutrition(recipe, ingredientsBySlug).perPortion
}
const rows = (slug: string) =>
  (newRecipes.find((r) => r.slug === slug)?.ingredients ?? []).map((l) => {
    const row = ingredientsBySlug.get(l.ingredient_slug)
    if (!row) throw new Error(`${slug}: unknown ingredient ${l.ingredient_slug}`)
    return row
  })
const count = (diet: string) => newRecipes.filter((r) => r.diet_slugs.includes(diet)).length

describe('overlay 0007-breakfast-snacks-world', () => {
  it('is registered after 0005, adds rows only (no patches)', () => {
    expect(OVERLAYS).toContain(OVERLAY)
    expect(OVERLAY.id).toBe('0007-breakfast-snacks-world')
    expect(OVERLAYS.indexOf(OVERLAY)).toBeGreaterThan(
      OVERLAYS.findIndex((o) => o.id === '0005-recipe-photos'),
    )
    expect(OVERLAY.patches).toBeUndefined()
    expect(Object.keys(additions).sort()).toEqual(['ingredients', 'recipes'])
  })

  it('adds exactly 60 recipes and 12 ingredients, all served', () => {
    expect(newRecipes).toHaveLength(60)
    expect(newIngredients.map((i) => i.slug)).toEqual([
      'miso',
      'gochujang',
      'fish-sauce',
      'rice-vinegar',
      'rice-paper',
      'kimchi',
      'lemongrass',
      'paneer',
      'teff',
      'rye-bread',
      'plantain',
      'corn-tortilla',
    ])
    const served = new Set(OVERLAID_SEED.recipes.map((r) => r.slug))
    for (const r of newRecipes) expect(served.has(r.slug), r.slug).toBe(true)
    for (const i of newIngredients) expect(ingredientsBySlug.has(i.slug), i.slug).toBe(true)
  })

  it('every new slug is unique, kebab-case and new against everything served before it', () => {
    const slugs = newRecipes.map((r) => r.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    const before = new Set(RECIPES.map((r) => r.slug))
    for (const o of OVERLAYS) {
      if (o === OVERLAY) break
      for (const r of o.additions?.recipes ?? []) before.add(r.slug)
    }
    for (const s of slugs) {
      expect(s, s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(before.has(s), `${s} already exists`).toBe(false)
    }
  })

  it('duplicates no served dish title in either language', () => {
    const earlier = [...RECIPES]
    for (const o of OVERLAYS) {
      if (o === OVERLAY) break
      earlier.push(...(o.additions?.recipes ?? []))
    }
    const el = new Set(earlier.map((r) => norm(r.title_el)))
    const en = new Set(earlier.map((r) => norm(r.title_en)))
    for (const r of newRecipes) {
      expect(el.has(norm(r.title_el)), r.title_el).toBe(false)
      expect(en.has(norm(r.title_en)), r.title_en).toBe(false)
    }
  })

  it('has the meal-type minimums: >= 25 breakfast, >= 20 snack, and lunch / dinner dishes', () => {
    const withMeal = (m: string) => newRecipes.filter((r) => r.meal_types.includes(m as never))
    expect(withMeal('breakfast').length).toBeGreaterThanOrEqual(25)
    expect(withMeal('snack').length).toBeGreaterThanOrEqual(20)
    expect(withMeal('lunch').length).toBeGreaterThanOrEqual(10)
    expect(withMeal('dinner').length).toBeGreaterThanOrEqual(10)
  })

  it('is international: every dish has a pinned cuisine, >= 30 are not Greek', () => {
    expect(Object.keys(CUISINE).sort()).toEqual(newRecipes.map((r) => r.slug).sort())
    const international = newRecipes.filter((r) => CUISINE[r.slug] !== 'Greek')
    expect(international.length).toBeGreaterThanOrEqual(30)
    // the thin cuisines the operator named are all represented
    const cuisines = new Set(Object.values(CUISINE))
    for (const c of ['Japanese', 'Korean', 'Chinese', 'Thai', 'Vietnamese', 'Indian', 'Turkish']) {
      expect(cuisines.has(c), c).toBe(true)
    }
    for (const c of ['North African', 'Ethiopian', 'Mexican', 'Latin American', 'Nordic']) {
      expect(cuisines.has(c), c).toBe(true)
    }
    expect(cuisines.has('Eastern European')).toBe(true)
  })

  it('carries no photo yet and no status (additions land pending)', () => {
    for (const r of newRecipes) {
      expect(r.image_path, r.slug).toBeNull()
      expect('status' in r, r.slug).toBe(false)
    }
  })

  it('tags `fasting` on exactly the dishes the fasting rule admits (kimchi is never fasting)', () => {
    for (const r of newRecipes) {
      const admitted = rows(r.slug).every(
        (row) => !isFastingForbidden(row) && row.slug !== 'kimchi',
      )
      expect(r.diet_slugs.includes('fasting'), r.slug).toBe(admitted)
    }
    expect(count('fasting')).toBeGreaterThanOrEqual(15)
  })

  it('hidden animal products: kimchi / fish sauce keep a dish out of vegan and vegetarian', () => {
    for (const r of newRecipes) {
      const slugs = r.ingredients.map((l) => l.ingredient_slug)
      if (slugs.includes('kimchi') || slugs.includes('fish-sauce')) {
        expect(r.diet_slugs, r.slug).not.toContain('vegan')
        expect(r.diet_slugs, r.slug).not.toContain('vegetarian')
      }
      if (slugs.includes('honey')) expect(r.diet_slugs, r.slug).not.toContain('vegan')
      // miso / gochujang may contain barley or wheat: never tagged gluten-free
      if (slugs.includes('miso') || slugs.includes('gochujang')) {
        expect(r.diet_slugs, r.slug).not.toContain('gluten-free')
      }
    }
  })

  it('macro-based tags hold per portion: low-carb, keto, Atkins, high-protein, intermittent fasting', () => {
    for (const r of newRecipes) {
      const n = perPortion(r.slug)
      const tags = r.diet_slugs
      if (tags.includes('low-carb')) expect(n.carbs, `${r.slug} low-carb`).toBeLessThanOrEqual(30)
      if (tags.includes('keto')) {
        expect(n.carbs, `${r.slug} keto`).toBeLessThanOrEqual(15)
        // keto is fat-led, as in 0006: at least half the energy from fat (QA 2026-10-11: mizeria)
        expect((n.fat * 9) / n.kcal, `${r.slug} keto fat share`).toBeGreaterThanOrEqual(0.5)
      }
      if (tags.includes('atkins')) {
        expect(n.carbs, `${r.slug} atkins`).toBeLessThanOrEqual(15)
        expect(tags, `${r.slug} atkins needs keto`).toContain('keto')
      }
      if (tags.includes('high-protein')) {
        expect(n.protein, `${r.slug} high-protein`).toBeGreaterThanOrEqual(30)
      }
      if (tags.includes('intermittent-fasting')) {
        expect(n.kcal, `${r.slug} IF kcal`).toBeGreaterThanOrEqual(400)
        expect(n.protein, `${r.slug} IF protein`).toBeGreaterThanOrEqual(25)
        expect(
          r.meal_types.some((m) => m === 'breakfast' || m === 'lunch' || m === 'dinner'),
          `${r.slug} IF needs a meal slot`,
        ).toBe(true)
      }
    }
  })

  it('DASH dishes have no added salt, cured fish, salty cheese or saturated-fat base', () => {
    for (const r of newRecipes.filter((x) => x.diet_slugs.includes('dash'))) {
      const bad = r.ingredients
        .map((l) => l.ingredient_slug)
        .filter((s) => DASH_FORBIDDEN.includes(s))
      expect(bad, r.slug).toEqual([])
    }
  })

  it('paleo dishes have no grain, legume, dairy, soy, seed oil or refined sugar', () => {
    for (const r of newRecipes.filter((x) => x.diet_slugs.includes('paleo'))) {
      for (const row of rows(r.slug)) {
        expect(PALEO_FORBIDDEN_CATEGORIES, `${r.slug}: ${row.slug}`).not.toContain(row.category)
        expect(PALEO_FORBIDDEN_SLUGS, `${r.slug}: ${row.slug}`).not.toContain(row.slug)
        if (row.category === 'dairy-eggs') expect(row.slug, r.slug).toBe('egg')
      }
    }
  })

  it('Mediterranean dishes come from the basin and are cooked in olive oil or tahini', () => {
    for (const r of newRecipes.filter((x) => x.diet_slugs.includes('mediterranean'))) {
      expect(MEDITERRANEAN_BASIN, r.slug).toContain(CUISINE[r.slug])
      const slugs = r.ingredients.map((l) => l.ingredient_slug)
      expect(slugs.includes('olive-oil') || slugs.includes('tahini'), r.slug).toBe(true)
    }
  })

  it('gives the thin diets real new choice', () => {
    expect(count('low-fodmap')).toBeGreaterThanOrEqual(10)
    expect(count('whole30')).toBeGreaterThanOrEqual(10)
    expect(count('intermittent-fasting')).toBeGreaterThanOrEqual(8)
    expect(count('paleo')).toBeGreaterThanOrEqual(8)
    expect(count('dash')).toBeGreaterThanOrEqual(12)
    expect(count('high-protein')).toBeGreaterThanOrEqual(8)
    expect(count('vegan')).toBeGreaterThanOrEqual(15)
    expect(count('gluten-free')).toBeGreaterThanOrEqual(30)
  })

  it('the new ingredients are all used, priced as of 2026-10-11, sourced and bilingual', () => {
    const used = new Set(newRecipes.flatMap((r) => r.ingredients.map((l) => l.ingredient_slug)))
    for (const i of newIngredients) {
      expect(used.has(i.slug), `${i.slug} is unused`).toBe(true)
      expect(i.price_as_of, i.slug).toBe('2026-10-11')
      expect(i.price_eur_min, i.slug).toBeGreaterThan(0)
      expect(i.price_eur_max, i.slug).toBeGreaterThanOrEqual(i.price_eur_min)
      expect(i.source_note, i.slug).toMatch(/USDA FoodData Central/)
      expect(i.name_el, i.slug).toMatch(/\p{Script=Greek}/u)
      expect(i.name_en, i.slug).not.toMatch(/\p{Script=Greek}/u)
    }
    // fish sauce is made of anchovies: it must sit in the fish category so the category-based
    // vegan / vegetarian / fasting rules keep it out
    expect(newIngredients.find((i) => i.slug === 'fish-sauce')?.category).toBe('fish-seafood')
    // the base ingredient list is untouched
    expect(INGREDIENTS.some((i) => i.slug === 'miso')).toBe(false)
  })

  it('the bundled source serves the new recipes and ingredients with formula ids', async () => {
    const recipe = await bundledSource.getRecipe('pho-ga-vietnamese-chicken-noodle-soup')
    if (!recipe.ok) throw new Error(recipe.error)
    expect(recipe.data?.id).toBe(seedId('recipes', 'pho-ga-vietnamese-chicken-noodle-soup'))
    expect(recipe.data?.lines.map((l) => l.ingredient?.slug ?? null)).toContain('fish-sauce')
    const fasting = await bundledSource.listRecipes({ dietSlugs: ['fasting'] })
    if (!fasting.ok) throw new Error(fasting.error)
    expect(fasting.data.some((r) => r.slug === 'miso-soup-tofu-spinach')).toBe(true)
    const ingredients = await bundledSource.listIngredients()
    if (!ingredients.ok) throw new Error(ingredients.error)
    expect(ingredients.data.find((i) => i.slug === 'miso')?.id).toBe(seedId('ingredients', 'miso'))
  })
})
