// OVERLAY 0006 — the thin diets (./0006-thin-diets.ts). The generic seed rules (bilingual
// completeness, units, kcal window, mechanical diet compliance, coverage) already run over the
// overlaid seed in ../recipes.test.ts and ../ingredients.test.ts. What is proven HERE is specific
// to this overlay:
//   * it is registered after 0005 and adds exactly 60 recipes and 5 ingredients, all slugs unique
//     against every base and earlier-overlay slug, no image yet, no patches;
//   * the per-diet minimums that motivated it (carnivore, Whole30, low-FODMAP, IF, paleo) and the
//     meal-type minimums (breakfast, snack) are met by the NEW rows alone;
//   * every tag on a new row is true by the stricter rules the overlay header states — carnivore
//     is animal-only (no plant oil), paleo/Whole30 exclude grains/legumes/dairy/processed meat,
//     keto/atkins/low-carb/high-protein/IF are computed from the per-portion nutrition;
//   * the new ingredients carry USDA-style macros, a price range and both languages.

import { describe, expect, it } from 'vitest'
import { computeNutrition } from '../../../nutrition/compute'
import { isFastingForbidden } from '../../../test/fastingRule'
import { OVERLAID_SEED } from '../../../test/overlaidSeed'
import { bundledSource, seedId } from '../../bundled'
import { RECIPES as BASE_RECIPES } from '../recipes'
import { OVERLAY } from './0006-thin-diets'
import { OVERLAYS } from './index'

const additions = OVERLAY.additions ?? {}
const newRecipes = additions.recipes ?? []
const newIngredients = additions.ingredients ?? []
const ingredientsBySlug = new Map(OVERLAID_SEED.ingredients.map((i) => [i.slug, i]))
const rowsOf = (slugs: readonly string[]) =>
  slugs.map((s) => {
    const row = ingredientsBySlug.get(s)
    if (!row) throw new Error(`unknown ingredient ${s}`)
    return row
  })
const withTag = (tag: string) => newRecipes.filter((r) => r.diet_slugs.includes(tag))
const linesOf = (r: (typeof newRecipes)[number]) => r.ingredients.map((l) => l.ingredient_slug)
const perPortion = (r: (typeof newRecipes)[number]) =>
  computeNutrition(r, ingredientsBySlug).perPortion

const WHOLE30_BAD_CATEGORIES = ['grains-bread', 'pasta-rice', 'legumes', 'sweeteners']
const PROCESSED_OR_EXCLUDED = [
  'bacon',
  'sausage',
  'ham',
  'prosciutto',
  'salami',
  'pastourma',
  'turkey-slices',
  'ketchup',
  'mayonnaise',
  'stock-cube',
  'soy-sauce',
  'peanuts',
  'peanut-butter',
  'corn',
  'cornmeal',
  'cornstarch',
  'baking-powder',
]
const CARNIVORE_OK_SLUGS = ['water', 'salt', 'black-pepper', 'lard', 'tallow']
const CARNIVORE_OK_CATEGORIES = ['meat', 'poultry', 'fish-seafood', 'dairy-eggs']

describe('overlay 0006-thin-diets', () => {
  it('is registered in the overlay list, after 0005, and patches nothing', () => {
    expect(OVERLAYS).toContain(OVERLAY)
    expect(OVERLAY.id).toBe('0006-thin-diets')
    expect(OVERLAYS.indexOf(OVERLAY)).toBeGreaterThan(
      OVERLAYS.findIndex((o) => o.id === '0005-recipe-photos'),
    )
    expect(OVERLAY.patches).toBeUndefined()
  })

  it('adds exactly 60 recipes and 5 ingredients to the served seed', () => {
    expect(newRecipes).toHaveLength(60)
    expect(newIngredients.map((i) => i.slug)).toEqual([
      'lamb-mince',
      'beef-tongue',
      'pork-ribs',
      'scallops',
      'bok-choy',
    ])
    const earlier = OVERLAYS.slice(0, OVERLAYS.indexOf(OVERLAY))
    const earlierAdded = earlier.flatMap((o) => (o.additions?.recipes ?? []).map((r) => r.slug))
    const slugs = newRecipes.map((r) => r.slug)
    expect(new Set(slugs).size).toBe(60)
    const taken = new Set([...BASE_RECIPES.map((r) => r.slug), ...earlierAdded])
    for (const s of slugs) expect(taken.has(s), `${s} already exists`).toBe(false)
    const addedByAll = OVERLAYS.reduce((n, o) => n + (o.additions?.recipes ?? []).length, 0)
    expect(OVERLAID_SEED.recipes).toHaveLength(BASE_RECIPES.length + addedByAll)
  })

  it('every new recipe has no photo yet and no status', () => {
    for (const r of newRecipes) {
      expect(r.image_path, r.slug).toBeNull()
      expect('status' in r, r.slug).toBe(false)
    }
  })

  it('meets the per-diet minimums with the new rows alone', () => {
    expect(withTag('carnivore').length).toBeGreaterThanOrEqual(15)
    expect(withTag('whole30').length).toBeGreaterThanOrEqual(18)
    expect(withTag('low-fodmap').length).toBeGreaterThanOrEqual(18)
    expect(withTag('intermittent-fasting').length).toBeGreaterThanOrEqual(12)
    expect(withTag('paleo').length).toBeGreaterThanOrEqual(20)
    expect(withTag('keto').length).toBeGreaterThanOrEqual(10)
    expect(withTag('gluten-free').length).toBeGreaterThanOrEqual(20)
    expect(withTag('high-protein').length).toBeGreaterThanOrEqual(10)
  })

  it('meets the meal-type minimums: ≥ 12 breakfasts, ≥ 8 snacks, mostly lunch/dinner', () => {
    const count = (m: string) => newRecipes.filter((r) => r.meal_types.includes(m as never)).length
    expect(count('breakfast')).toBeGreaterThanOrEqual(12)
    expect(count('snack')).toBeGreaterThanOrEqual(8)
    const mains = newRecipes.filter(
      (r) => r.meal_types.includes('lunch') || r.meal_types.includes('dinner'),
    )
    expect(mains.length).toBeGreaterThanOrEqual(40)
  })

  it('varies the proteins: beef, lamb, pork, chicken, turkey, fish, seafood, eggs and offal', () => {
    const used = new Set(newRecipes.flatMap(linesOf))
    for (const slug of [
      'beef-steak',
      'beef-mince',
      'lamb-chops',
      'lamb-mince',
      'pork-mince',
      'pork-ribs',
      'chicken-thigh',
      'turkey-mince',
      'salmon',
      'cod',
      'shrimp',
      'scallops',
      'egg',
      'beef-kidney',
      'beef-heart',
      'beef-tongue',
      'chicken-liver',
      'bone-marrow',
      'tofu',
    ]) {
      expect(used.has(slug), `no new recipe uses ${slug}`).toBe(true)
    }
  })

  it('carnivore means animal products only: no plant oil, herb or vegetable', () => {
    for (const r of withTag('carnivore')) {
      for (const row of rowsOf(linesOf(r))) {
        expect(
          CARNIVORE_OK_CATEGORIES.includes(row.category) || CARNIVORE_OK_SLUGS.includes(row.slug),
          `${r.slug}: ${row.slug} is not carnivore`,
        ).toBe(true)
      }
    }
  })

  it('whole30 and paleo exclude grains, legumes, sweeteners, dairy (ghee/eggs aside) and processed meat', () => {
    for (const tag of ['whole30', 'paleo']) {
      for (const r of withTag(tag)) {
        for (const row of rowsOf(linesOf(r))) {
          expect(WHOLE30_BAD_CATEGORIES, `${tag} ${r.slug}: ${row.slug}`).not.toContain(
            row.category,
          )
          expect(PROCESSED_OR_EXCLUDED, `${tag} ${r.slug}: ${row.slug}`).not.toContain(row.slug)
          if (row.category === 'dairy-eggs') {
            expect(['egg', 'egg-white', 'ghee'], `${tag} ${r.slug}: ${row.slug}`).toContain(
              row.slug,
            )
          }
        }
      }
    }
    for (const r of withTag('whole30')) {
      expect(linesOf(r), r.slug).not.toContain('maple-syrup')
      expect(linesOf(r), r.slug).not.toContain('honey')
    }
  })

  it('low-fodmap recipes avoid the extra Monash high-FODMAP items and keep the onion to its greens', () => {
    const extra = [
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
    for (const r of withTag('low-fodmap')) {
      for (const slug of linesOf(r)) expect(extra, `${r.slug}: ${slug}`).not.toContain(slug)
      const onion = r.ingredients.find((l) => l.ingredient_slug === 'spring-onion')
      if (onion) expect(onion.note_en, `${r.slug}: spring onion`).toBe('green part only')
    }
  })

  it('keto, atkins, low-carb and high-protein follow the per-portion numbers', () => {
    for (const r of newRecipes) {
      const p = perPortion(r)
      const fatShare = (p.fat * 9) / p.kcal
      const proteinShare = (p.protein * 4) / p.kcal
      const tags = r.diet_slugs
      if (tags.includes('keto')) {
        expect(p.carbs, `${r.slug} keto carbs`).toBeLessThanOrEqual(12)
        expect(fatShare, `${r.slug} keto fat share`).toBeGreaterThanOrEqual(0.5)
      }
      if (tags.includes('atkins')) expect(p.carbs, `${r.slug} atkins`).toBeLessThanOrEqual(20)
      if (tags.includes('low-carb')) expect(p.carbs, `${r.slug} low-carb`).toBeLessThanOrEqual(30)
      if (tags.includes('high-protein')) {
        expect(p.protein, `${r.slug} protein g`).toBeGreaterThanOrEqual(20)
        expect(proteinShare, `${r.slug} protein share`).toBeGreaterThanOrEqual(0.25)
      }
      // complete as well as sound: a recipe that meets the keto numbers carries the tag
      if (p.carbs <= 12 && fatShare >= 0.5) expect(tags, r.slug).toContain('keto')
      if (p.carbs <= 30) expect(tags, r.slug).toContain('low-carb')
    }
  })

  it('intermittent-fasting recipes are real meals: not snack-only, ≥ 400 kcal and ≥ 25 g protein', () => {
    for (const r of withTag('intermittent-fasting')) {
      const p = perPortion(r)
      expect(
        r.meal_types.every((m) => m === 'snack'),
        `${r.slug} is a snack`,
      ).toBe(false)
      expect(p.kcal, `${r.slug} kcal`).toBeGreaterThanOrEqual(400)
      expect(p.protein, `${r.slug} protein`).toBeGreaterThanOrEqual(25)
    }
  })

  it('the fasting tag is on exactly the new recipes the fasting rule admits', () => {
    for (const r of newRecipes) {
      const ok = rowsOf(linesOf(r)).every((row) => !isFastingForbidden(row))
      expect(r.diet_slugs.includes('fasting'), r.slug).toBe(ok)
    }
  })

  it('every new recipe has equal-length Greek and English steps and a Greek title', () => {
    for (const r of newRecipes) {
      expect(r.steps_el.length, r.slug).toBe(r.steps_en.length)
      expect(r.title_el, r.slug).toMatch(/\p{Script=Greek}/u)
    }
  })

  it('the new ingredients are USDA-style rows with a EUR range dated 2026-10-11 in both languages', () => {
    for (const i of newIngredients) {
      expect(i.source_note).toMatch(/USDA/)
      expect(i.price_as_of).toBe('2026-10-11')
      expect(i.price_eur_min).toBeGreaterThan(0)
      expect(i.price_eur_max).toBeGreaterThanOrEqual(i.price_eur_min)
      expect(i.name_el).toMatch(/\p{Script=Greek}/u)
      expect(i.name_en).not.toMatch(/\p{Script=Greek}/u)
      expect(i.substitute_slugs.length).toBeGreaterThan(0)
    }
  })

  it('the bundled source serves the new rows with formula ids and a diet filter finds them', async () => {
    const one = await bundledSource.getRecipe('carnivore-reverse-seared-ribeye')
    if (!one.ok) throw new Error(one.error)
    expect(one.data?.id).toBe(seedId('recipes', 'carnivore-reverse-seared-ribeye'))
    const carnivore = await bundledSource.listRecipes({ dietSlugs: ['carnivore'] })
    if (!carnivore.ok) throw new Error(carnivore.error)
    expect(carnivore.data.length).toBeGreaterThanOrEqual(10 + 15)
    const slugs = new Set(carnivore.data.map((r) => r.slug))
    for (const r of withTag('carnivore')) expect(slugs.has(r.slug), r.slug).toBe(true)
  })
})
