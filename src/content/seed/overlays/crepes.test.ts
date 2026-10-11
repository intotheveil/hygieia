// OVERLAY 0009 — crêpes (./0009-crepes.ts). The generic seed rules (bilingual completeness, units,
// kcal window, mechanical diet compliance for vegan / vegetarian / pescatarian / gluten-free /
// low-FODMAP / Whole30 / fasting, coverage) already run over the overlaid seed in ../recipes.test.ts,
// ../ingredients.test.ts and ../ingredients-sanity.test.ts, and ./diet-rules-sweep.test.ts binds the
// unified overlay diet rules. What is proven HERE is specific to this overlay:
//   * it is registered after 0008 and adds exactly 12 recipes and 3 ingredients, no patches;
//   * the operator's ask: half savoury, half sweet, with an explicit slug -> kind / cuisine map so a
//     rename or a stray addition is a visible change; every slug is `crepe-…`;
//   * every slug and title is new against everything served before this overlay;
//   * the diet tags follow the ONE rule set (src/test/dietRules.ts) with the cuisine known, the
//     galette is gluten-free only because every line is, and `fasting` is tagged on exactly the
//     dishes the fasting rule admits;
//   * the new ingredients are used, priced and sourced, and the bundled source serves the rows.

import { describe, expect, it } from 'vitest'
import { dietTagProblems } from '../../../test/dietRules'
import { isFastingForbidden } from '../../../test/fastingRule'
import { OVERLAID_SEED } from '../../../test/overlaidSeed'
import { bundledSource, seedId } from '../../bundled'
import { INGREDIENTS } from '../ingredients'
import { RECIPES } from '../recipes'
import { OVERLAY } from './0009-crepes'
import { OVERLAYS } from './index'

const additions = OVERLAY.additions ?? {}
const newRecipes = additions.recipes ?? []
const newIngredients = additions.ingredients ?? []
const ingredientsBySlug = new Map(OVERLAID_SEED.ingredients.map((i) => [i.slug, i]))

type Kind = 'savoury' | 'sweet'
/** Every new crêpe, savoury or sweet, and the kitchen it comes from. Pinned: the photo lane reads it. */
const CREPES: Readonly<Record<string, { kind: Kind; cuisine: string }>> = {
  'crepe-greek-street-ham-gouda-tomato-lettuce': { kind: 'savoury', cuisine: 'Greek' },
  'crepe-chicken-mushroom-kasseri': { kind: 'savoury', cuisine: 'Greek' },
  'crepe-spinach-feta-spanakopita-style': { kind: 'savoury', cuisine: 'Greek' },
  'crepe-smoked-salmon-cream-cheese-dill': { kind: 'savoury', cuisine: 'French' },
  'crepe-galette-complete-buckwheat-ham-emmental-egg': { kind: 'savoury', cuisine: 'French' },
  'crepe-vegan-mushroom-pepper-spinach': { kind: 'savoury', cuisine: 'Greek' },
  'crepe-lemon-sugar-classic': { kind: 'sweet', cuisine: 'French' },
  'crepe-banana-hazelnut-cocoa-spread': { kind: 'sweet', cuisine: 'Greek' },
  'crepe-strawberry-greek-yoghurt-honey': { kind: 'sweet', cuisine: 'Greek' },
  'crepe-honey-walnut-cinnamon': { kind: 'sweet', cuisine: 'Greek' },
  'crepe-caramelised-apple-cinnamon': { kind: 'sweet', cuisine: 'French' },
  'crepe-protein-oat-skyr-blueberry': { kind: 'sweet', cuisine: 'International' },
}

/** Ingredients that make a dish sweet; a savoury crêpe carries none of them beyond batter sugar. */
const SWEET_FILLINGS = [
  'honey',
  'hazelnut-cocoa-spread',
  'brown-sugar',
  'banana',
  'strawberry',
  'apple',
  'blueberry',
]
/** Ingredients that make a dish savoury; a sweet crêpe carries none of them. */
const SAVOURY_FILLINGS = [
  'ham',
  'gouda',
  'emmental',
  'kasseri',
  'feta',
  'chicken-breast',
  'smoked-salmon',
  'mushrooms',
  'spinach',
  'black-pepper',
]

const norm = (s: string) => s.toLocaleLowerCase('el').normalize('NFD').replace(/\p{M}/gu, '')
const slugsOf = (slug: string) =>
  (newRecipes.find((r) => r.slug === slug)?.ingredients ?? []).map((l) => l.ingredient_slug)
const rows = (slug: string) =>
  slugsOf(slug).map((s) => {
    const row = ingredientsBySlug.get(s)
    if (!row) throw new Error(`${slug}: unknown ingredient ${s}`)
    return row
  })
const kindOf = (kind: Kind) => newRecipes.filter((r) => CREPES[r.slug]?.kind === kind)

describe('overlay 0009-crepes', () => {
  it('is registered after 0008, adds rows only (no patches)', () => {
    expect(OVERLAYS).toContain(OVERLAY)
    expect(OVERLAY.id).toBe('0009-crepes')
    expect(OVERLAYS.indexOf(OVERLAY)).toBeGreaterThan(
      OVERLAYS.findIndex((o) => o.id === '0008-recipe-photos-2'),
    )
    expect(OVERLAY.patches).toBeUndefined()
    expect(Object.keys(additions).sort()).toEqual(['ingredients', 'recipes'])
  })

  it('adds exactly 12 recipes and 3 ingredients, all served', () => {
    expect(newRecipes).toHaveLength(12)
    expect(newIngredients.map((i) => i.slug)).toEqual([
      'buckwheat-flour',
      'emmental',
      'hazelnut-cocoa-spread',
    ])
    const served = new Set(OVERLAID_SEED.recipes.map((r) => r.slug))
    for (const r of newRecipes) expect(served.has(r.slug), r.slug).toBe(true)
    for (const i of newIngredients) expect(ingredientsBySlug.has(i.slug), i.slug).toBe(true)
  })

  it('every slug is `crepe-…`, unique, kebab-case and new against everything served before it', () => {
    const slugs = newRecipes.map((r) => r.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    const before = new Set(RECIPES.map((r) => r.slug))
    for (const o of OVERLAYS) {
      if (o === OVERLAY) break
      for (const r of o.additions?.recipes ?? []) before.add(r.slug)
    }
    for (const s of slugs) {
      expect(s, s).toMatch(/^crepe-[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(before.has(s), `${s} already exists`).toBe(false)
    }
  })

  it('duplicates no served dish title in either language, and every title names the dish', () => {
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
      expect(norm(r.title_el), r.slug).toMatch(/κρεπ|γκαλετ/)
      expect(norm(r.title_en), r.slug).toMatch(/crepe|galette/)
    }
  })

  it('is half savoury, half sweet — every dish pinned, the fillings match the kind', () => {
    expect(Object.keys(CREPES).sort()).toEqual(newRecipes.map((r) => r.slug).sort())
    expect(kindOf('savoury')).toHaveLength(6)
    expect(kindOf('sweet')).toHaveLength(6)
    for (const r of kindOf('savoury')) {
      expect(
        slugsOf(r.slug).filter((s) => SWEET_FILLINGS.includes(s)),
        r.slug,
      ).toEqual([])
      expect(
        slugsOf(r.slug).some((s) => SAVOURY_FILLINGS.includes(s)),
        r.slug,
      ).toBe(true)
      // savoury crêpes are main meals; the Greek street crêpe doubles as a snack
      expect(
        r.meal_types.some((m) => m === 'lunch' || m === 'dinner'),
        r.slug,
      ).toBe(true)
    }
    for (const r of kindOf('sweet')) {
      expect(
        slugsOf(r.slug).filter((s) => SAVOURY_FILLINGS.includes(s)),
        r.slug,
      ).toEqual([])
      expect(r.meal_types, r.slug).toContain('breakfast')
      expect(
        r.meal_types.some((m) => m === 'lunch' || m === 'dinner'),
        r.slug,
      ).toBe(false)
    }
  })

  it('carries no photo yet and no status (additions land pending)', () => {
    for (const r of newRecipes) {
      expect(r.image_path, r.slug).toBeNull()
      expect('status' in r, r.slug).toBe(false)
    }
  })

  it('tags `fasting` on exactly the dishes the fasting rule admits; the spread is never fasting', () => {
    for (const r of newRecipes) {
      const admitted = rows(r.slug).every((row) => !isFastingForbidden(row))
      expect(r.diet_slugs.includes('fasting'), r.slug).toBe(admitted)
    }
    const spread = ingredientsBySlug.get('hazelnut-cocoa-spread')
    if (!spread) throw new Error('spread missing')
    expect(isFastingForbidden(spread)).toBe(true)
    expect(newRecipes.filter((r) => r.diet_slugs.includes('fasting')).map((r) => r.slug)).toEqual([
      'crepe-vegan-mushroom-pepper-spinach',
    ])
  })

  it('the vegan crêpe has no egg, no dairy, no honey; the spread and honey stay out of vegan', () => {
    const vegan = newRecipes.filter((r) => r.diet_slugs.includes('vegan'))
    expect(vegan.map((r) => r.slug)).toEqual(['crepe-vegan-mushroom-pepper-spinach'])
    for (const r of newRecipes) {
      const slugs = slugsOf(r.slug)
      if (slugs.includes('honey') || slugs.includes('hazelnut-cocoa-spread')) {
        expect(r.diet_slugs, r.slug).not.toContain('vegan')
      }
    }
  })

  it('only the 100 % buckwheat galette is gluten-free, and its flour line says so', () => {
    const gf = newRecipes.filter((r) => r.diet_slugs.includes('gluten-free'))
    expect(gf.map((r) => r.slug)).toEqual(['crepe-galette-complete-buckwheat-ham-emmental-egg'])
    const line = gf[0]?.ingredients.find((l) => l.ingredient_slug === 'buckwheat-flour')
    expect(line?.note_en).toMatch(/100 % buckwheat/)
    expect(slugsOf(gf[0]?.slug ?? '')).not.toContain('flour')
  })

  it('every diet tag follows the unified overlay rules (src/test/dietRules.ts), sound and complete', () => {
    for (const r of newRecipes) {
      expect({
        slug: r.slug,
        ...dietTagProblems(r, ingredientsBySlug, CREPES[r.slug]?.cuisine),
      }).toEqual({ slug: r.slug, remove: [], add: [] })
    }
  })

  it('the protein crêpe is high-protein, IF and DASH; the other sweets carry no such claim', () => {
    const protein = newRecipes.find((r) => r.slug === 'crepe-protein-oat-skyr-blueberry')
    expect(protein?.diet_slugs).toEqual(
      expect.arrayContaining(['high-protein', 'intermittent-fasting', 'dash']),
    )
    for (const r of kindOf('sweet')) {
      if (r === protein) continue
      expect(r.diet_slugs, r.slug).toEqual(['vegetarian', 'flexitarian', 'pescatarian'])
    }
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
      expect(i.substitute_slugs.length, i.slug).toBeGreaterThan(0)
    }
    // the base ingredient list is untouched
    expect(INGREDIENTS.some((i) => i.slug === 'emmental')).toBe(false)
  })

  it('the bundled source serves the new recipes and ingredients with formula ids', async () => {
    const recipe = await bundledSource.getRecipe(
      'crepe-galette-complete-buckwheat-ham-emmental-egg',
    )
    if (!recipe.ok) throw new Error(recipe.error)
    expect(recipe.data?.id).toBe(
      seedId('recipes', 'crepe-galette-complete-buckwheat-ham-emmental-egg'),
    )
    expect(recipe.data?.lines.map((l) => l.ingredient?.slug ?? null)).toContain('buckwheat-flour')
    const fasting = await bundledSource.listRecipes({ dietSlugs: ['fasting'] })
    if (!fasting.ok) throw new Error(fasting.error)
    expect(fasting.data.some((r) => r.slug === 'crepe-vegan-mushroom-pepper-spinach')).toBe(true)
    const ingredients = await bundledSource.listIngredients()
    if (!ingredients.ok) throw new Error(ingredients.error)
    expect(ingredients.data.find((i) => i.slug === 'emmental')?.id).toBe(
      seedId('ingredients', 'emmental'),
    )
  })
})
