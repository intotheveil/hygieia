// OVERLAY 0006 — the thin diets (./0006-thin-diets.ts). The generic seed rules (bilingual
// completeness, units, kcal window, mechanical diet compliance, coverage) already run over the
// overlaid seed in ../recipes.test.ts and ../ingredients.test.ts. What is proven HERE is specific
// to this overlay:
//   * it is registered after 0005 and adds exactly 60 recipes and 5 ingredients, all slugs unique
//     against every base and earlier-overlay slug, no image yet, no patches;
//   * the per-diet minimums that motivated it (carnivore, Whole30, low-FODMAP, IF, paleo) and the
//     meal-type minimums (breakfast, snack) are met by the NEW rows alone;
//   * every tag on a new row follows the ONE rule set shared with overlay 0007 (src/test/dietRules.ts:
//     carnivore, paleo, Whole30, low-FODMAP, keto/atkins/low-carb/high-protein/IF, DASH,
//     Mediterranean), sound and complete;
//   * the new ingredients carry USDA-style macros, a price range and both languages.

import { describe, expect, it } from 'vitest'
import { dietTagProblems } from '../../../test/dietRules'
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

  it('every diet tag follows the unified overlay rules (src/test/dietRules.ts), sound and complete', () => {
    for (const r of newRecipes) {
      expect({ slug: r.slug, ...dietTagProblems(r, ingredientsBySlug) }).toEqual({
        slug: r.slug,
        remove: [],
        add: [],
      })
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
