// The unified diet-tag rules (src/test/dietRules.ts) bind every recipe an overlay ADDS from 0006 on,
// not only the two overlays whose focused tests happen to call them. A future overlay that adds
// recipes is covered here the moment it is registered; the base seed and overlays 0001–0005 predate
// the rules and are not retagged (DECISIONS 2026-10-11).

import { describe, expect, it } from 'vitest'
import { dietTagProblems } from '../../../test/dietRules'
import { OVERLAID_SEED } from '../../../test/overlaidSeed'
import { OVERLAYS } from './index'

const FIRST_BOUND = 6
const ingredientsBySlug = new Map(OVERLAID_SEED.ingredients.map((i) => [i.slug, i]))
const bound = OVERLAYS.filter((o) => Number(o.id.slice(0, 4)) >= FIRST_BOUND)

describe('unified diet rules over every overlay from 0006 on', () => {
  it('finds the overlays it binds, by their numeric id prefix', () => {
    for (const o of OVERLAYS) expect(o.id, o.id).toMatch(/^\d{4}-/)
    expect(bound.map((o) => o.id)).toEqual(
      expect.arrayContaining(['0006-thin-diets', '0007-breakfast-snacks-world']),
    )
  })

  it('the rules bite: refined sweets are out of paleo, a whole banana is out of low-FODMAP', () => {
    const base = OVERLAID_SEED.recipes.find(
      (r) => r.slug === 'teff-porridge-ethiopian-banana-cinnamon',
    )
    if (!base) throw new Error('teff porridge missing')
    const tagged = (diet: string, extra: (typeof base.ingredients)[number][], portions = 1) => ({
      ...base,
      portions,
      diet_slugs: [diet],
      ingredients: [...base.ingredients.filter((l) => l.ingredient_slug !== 'banana'), ...extra],
    })
    for (const slug of ['jam', 'halva', 'dark-chocolate', 'erythritol']) {
      const r = tagged('paleo', [{ ingredient_slug: slug, quantity: 20, unit: 'g' }])
      expect(dietTagProblems(r, ingredientsBySlug).remove, slug).toContain(`paleo: ${slug}`)
    }
    const banana = (quantity: number, unit: 'g' | 'piece') =>
      dietTagProblems(
        tagged('low-fodmap', [{ ingredient_slug: 'banana', quantity, unit }]),
        ingredientsBySlug,
      ).remove.filter((p) => p.includes('banana'))
    expect(banana(1, 'piece')).toEqual(['low-fodmap: banana 120 g per portion'])
    expect(banana(30, 'g')).toEqual([])
  })

  for (const o of bound) {
    const added = o.additions?.recipes ?? []
    if (added.length === 0) continue
    it(`${o.id}: every added recipe's diet tags are sound and complete`, () => {
      for (const r of added) {
        expect({ slug: r.slug, ...dietTagProblems(r, ingredientsBySlug) }).toEqual({
          slug: r.slug,
          remove: [],
          add: [],
        })
      }
    })
  }
})
