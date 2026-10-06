// OVERLAY 0003 — the Greek kitchen (./0003-greek-kitchen.ts). The generic seed rules (bilingual
// completeness, units, kcal window, diet compliance incl. the fasting rule, coverage) already run
// over the overlaid seed in ../recipes.test.ts, ../ingredients.test.ts and ../diets.test.ts. What
// is proven HERE is specific to this overlay:
//   * it is registered after 0001 and adds exactly one diet, two ingredients, ≥ 24 recipes;
//   * no new recipe duplicates a base dish (slug or title in either language);
//   * the fasting tags on BASE recipes are exactly the base recipes the fasting rule admits —
//     neither padded (a non-compliant dish tagged) nor short (a compliant one forgotten);
//   * the fasting diet can fill a week plan from fasting dishes only, and the bundled source
//     serves the new rows with formula ids.

import { describe, expect, it } from 'vitest'
import { generateWeekPlan } from '../../../plans/generate'
import { isFastingForbidden } from '../../../test/fastingRule'
import { OVERLAID_SEED } from '../../../test/overlaidSeed'
import { bundledSource, seedId } from '../../bundled'
import { DIETS } from '../diets'
import { INGREDIENTS } from '../ingredients'
import { RECIPES } from '../recipes'
import { FASTING_EXISTING_SLUGS, OVERLAY } from './0003-greek-kitchen'
import { OVERLAYS } from './index'

const additions = OVERLAY.additions ?? {}
const newRecipes = additions.recipes ?? []
const ingredientsBySlug = new Map(OVERLAID_SEED.ingredients.map((i) => [i.slug, i]))

/** The photo lane renders these; pinned so a rename is a visible, deliberate change. */
const NEW_RECIPE_SLUGS = [
  'horta-vrasta-boiled-greens',
  'dolmadakia-yalantzi-stuffed-vine-leaves',
  'melitzanosalata-smoky-aubergine-dip',
  'skordalia-garlic-potato-dip',
  'revithokeftedes-chickpea-fritters',
  'domatokeftedes-santorini-tomato-fritters',
  'prasorizo-leeks-with-rice',
  'lagana-clean-monday-flatbread',
  'halvas-simigdalenios-semolina-halva',
  'hortopita-lenten-wild-greens-pie',
  'mavromatika-black-eyed-pea-salad',
  'patates-lemonates-lemon-oregano-potatoes',
  'tahinosoupa-lenten-tahini-soup',
  'pantzarosalata-beetroot-garlic-walnuts',
  'fakorizo-lentils-with-rice',
  'aginares-a-la-polita-artichoke-stew',
  'htapodi-kritharaki-octopus-orzo',
  'kalamarakia-stifado-squid-pearl-onions',
  'soupies-me-spanaki-cuttlefish-spinach',
  'mydia-achnista-steamed-mussels',
  'taramosalata-fish-roe-dip',
  'kakavia-fishermans-soup',
  'bakaliaros-tiganitos-fried-salt-cod',
  'kotosoupa-avgolemono',
  'giouvarlakia-avgolemono-meatball-soup',
  'moussakas-aubergine-mince-bechamel',
  'pastitsio-baked-pasta-mince-bechamel',
  'soutzoukakia-smyrneika',
  'giouvetsi-beef-orzo',
  'moschari-stifado-beef-pearl-onions',
]

const complies = (slugs: readonly string[]) =>
  slugs.every((s) => {
    const row = ingredientsBySlug.get(s)
    return row !== undefined && !isFastingForbidden(row)
  })

describe('overlay 0003-greek-kitchen', () => {
  it('is registered in the overlay list, after 0001', () => {
    expect(OVERLAYS).toContain(OVERLAY)
    expect(OVERLAY.id).toBe('0003-greek-kitchen')
    expect(OVERLAYS.indexOf(OVERLAY)).toBeGreaterThan(
      OVERLAYS.findIndex((o) => o.id === '0001-fix-typos'),
    )
    expect(OVERLAY.patches).toBeUndefined()
  })

  it('adds the fasting diet, two ingredients and the pinned ≥ 24 new recipes', () => {
    expect((additions.diets ?? []).map((d) => d.slug)).toEqual(['fasting'])
    expect((additions.ingredients ?? []).map((i) => i.slug)).toEqual(['tarama', 'pearl-onions'])
    expect(newRecipes.length).toBeGreaterThanOrEqual(24)
    expect([...newRecipes.map((r) => r.slug)].sort()).toEqual([...NEW_RECIPE_SLUGS].sort())
    expect(OVERLAID_SEED.recipes).toHaveLength(RECIPES.length + newRecipes.length)
    expect(OVERLAID_SEED.diets).toHaveLength(DIETS.length + 1)
    expect(OVERLAID_SEED.ingredients).toHaveLength(INGREDIENTS.length + 2)
  })

  it('duplicates no base dish (slug, Greek title or English title)', () => {
    const norm = (s: string) => s.toLocaleLowerCase('el').normalize('NFD').replace(/\p{M}/gu, '')
    const baseSlugs = new Set(RECIPES.map((r) => r.slug))
    const baseEl = new Set(RECIPES.map((r) => norm(r.title_el)))
    const baseEn = new Set(RECIPES.map((r) => norm(r.title_en)))
    for (const r of newRecipes) {
      expect(baseSlugs.has(r.slug), r.slug).toBe(false)
      expect(baseEl.has(norm(r.title_el)), r.title_el).toBe(false)
      expect(baseEn.has(norm(r.title_en)), r.title_en).toBe(false)
    }
    // The named classics the base already ships stay single.
    for (const stem of ['fasolada', 'gemista', 'briam', 'fakes', 'tzatziki', 'horiatiki']) {
      expect(OVERLAID_SEED.recipes.filter((r) => r.slug.startsWith(stem))).toHaveLength(1)
    }
  })

  it('tags exactly the base recipes the fasting rule admits (strict and complete)', () => {
    const admitted = RECIPES.filter((r) => complies(r.ingredients.map((l) => l.ingredient_slug)))
      .map((r) => r.slug)
      .sort()
    expect([...FASTING_EXISTING_SLUGS].sort()).toEqual(admitted)
    expect(admitted).not.toContain('tofu-souvlaki-skewers-pita') // shop pita: may contain milk
    expect(admitted).toContain('octopus-xydato-vinegar-oregano') // invertebrate seafood is allowed
    expect(admitted).not.toContain('grilled-sardines-lemon-oregano') // fish with a backbone is not
  })

  it('every NEW dish that complies is tagged fasting, and none that does not', () => {
    for (const r of newRecipes) {
      const ok = complies(r.ingredients.map((l) => l.ingredient_slug))
      expect(r.diet_slugs.includes('fasting'), r.slug).toBe(ok)
    }
    expect(
      newRecipes.filter((r) => r.diet_slugs.includes('fasting')).length,
    ).toBeGreaterThanOrEqual(20)
  })

  it('the fasting diet fills a full week from fasting dishes only, with no warning', () => {
    const plan = generateWeekPlan('fasting', OVERLAID_SEED.recipes, OVERLAID_SEED.ingredients, {
      seed: 7,
    })
    expect(plan.warnings).toEqual([])
    const slots = plan.days.flatMap((d) => [d.slots.breakfast, d.slots.lunch, d.slots.dinner])
    expect(slots).toHaveLength(21)
    for (const r of slots) expect(r?.diet_slugs).toContain('fasting')
  })

  it('carries a real source and the doctor caution in both languages', () => {
    const fasting = OVERLAID_SEED.diets.find((d) => d.slug === 'fasting')
    expect(fasting?.source_url).toMatch(/^https:\/\//)
    expect(fasting?.avoid_if_el.join(' ')).toMatch(/έγκυος/)
    expect(fasting?.avoid_if_el.join(' ')).toMatch(/διαβήτη/)
    expect(fasting?.avoid_if_en.join(' ')).toMatch(/pregnant/)
    expect(fasting?.avoid_if_en.join(' ')).toMatch(/diabetes/)
  })

  it('the bundled source serves the new diet, ingredients and recipes with formula ids', async () => {
    const diets = await bundledSource.listDiets()
    if (!diets.ok) throw new Error(diets.error)
    expect(diets.data.find((d) => d.slug === 'fasting')?.id).toBe(seedId('diets', 'fasting'))
    const recipe = await bundledSource.getRecipe('kalamarakia-stifado-squid-pearl-onions')
    if (!recipe.ok) throw new Error(recipe.error)
    expect(recipe.data?.id).toBe(seedId('recipes', 'kalamarakia-stifado-squid-pearl-onions'))
    expect(recipe.data?.lines.map((l) => l.ingredient?.slug ?? null)).toContain('pearl-onions')
    const tagged = await bundledSource.listRecipes({ dietSlugs: ['fasting'] })
    if (!tagged.ok) throw new Error(tagged.error)
    expect(tagged.data.length).toBe(
      FASTING_EXISTING_SLUGS.length +
        newRecipes.filter((r) => r.diet_slugs.includes('fasting')).length,
    )
  })
})
