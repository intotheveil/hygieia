// INGREDIENT SANITY — the ingredients table AS SERVED (base seed + every overlay), not the frozen base
// module. Pins what overlay 0004 (Greek retail prices 2026-10, EU-sourced nutrition) set out to make
// trustworthy: energy agrees with the macros, and every price range is a usable positive range with
// a note that says where it comes from.
//
// Energy: kcal ≈ 4·protein + 4·carbs + 9·fat within ±15 % (or ±20 kcal for low-energy rows). Carbs
// are "by difference" (they include fibre), so the plain formula cannot hold where a large share of
// the energy comes from something it does not see. Those rows are named in SPECIAL with the missing
// constant and its source, and are checked with
//   kcal ≈ 4·P + 4·(C − fibre) + 2·fibre + 9·F + 7·alcohol      (EU Reg. 1169/2011 Annex XIV factors;
//                                                                 a polyol's carbs count 0 kcal/g)
// A SPECIAL row must really need its entry (the plain formula fails for it) — no blanket exemptions.

import { describe, expect, it } from 'vitest'
import type { IngredientSeed } from '../types'
import { INGREDIENTS } from './ingredients'
import { overlayTable } from './overlays/apply'
import { OVERLAYS } from './overlays/index'
import { RECIPES } from './recipes'

const ROWS: readonly IngredientSeed[] = overlayTable('ingredients', INGREDIENTS, OVERLAYS)
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const SHELF_CHECKED_AS_OF = '2026-10-06'

interface Special {
  /** Dietary fibre, g/100 g (2 kcal/g). */
  fibre?: number
  /** Ethanol, g/100 g (7 kcal/g). */
  alcohol?: number
  /** Carbs are a polyol counted at 0 kcal/g (EU: erythritol). */
  polyol?: true
  source: string
}

const SPECIAL: Readonly<Record<string, Special>> = {
  // high-fibre spices, herbs and dried goods
  'black-pepper': { fibre: 25.7, source: 'CIQUAL 2020, Black pepper, powder (11015)' },
  oregano: { fibre: 42.5, source: 'CIQUAL 2020, Oregano, dried (11035)' },
  thyme: { fibre: 37, source: 'CIQUAL 2020, Thyme, dried (11038)' },
  sage: { fibre: 40.3, source: 'CIQUAL 2020, Sage, dried (11037)' },
  'bay-leaf': { fibre: 26.3, source: 'USDA FDC, Spices, bay leaf (170917)' },
  cinnamon: { fibre: 53.1, source: 'CIQUAL 2020, Cinnamon, powder (11025)' },
  cumin: { fibre: 10.5, source: 'CIQUAL 2020, Cumin, seed (11042)' },
  paprika: { fibre: 34.9, source: 'CIQUAL 2020, Paprika (11049)' },
  cloves: { fibre: 33.9, source: 'CIQUAL 2020, Cloves (11052)' },
  'curry-powder': { fibre: 53.2, source: 'CIQUAL 2020, Curry, powder (11005)' },
  saffron: { fibre: 3.9, source: 'CIQUAL 2020, Saffron (11039)' },
  'psyllium-husk': { fibre: 70, source: 'USDA FDC branded psyllium husk label (2417873)' },
  'dry-yeast': { fibre: 23.3, source: "CIQUAL 2020, Baker's yeast, dehydrated (11045)" },
  'sun-dried-tomatoes': { fibre: 12.3, source: 'CIQUAL 2020, Tomato, dried (20189)' },
  gigantes: { fibre: 25, source: 'overlay 0004: mean fibre of the EU labels its values come from' },
  // energy from ethanol
  'vanilla-extract': { alcohol: 34.4, source: 'USDA FDC, Vanilla extract (173471)' },
  'white-wine': { alcohol: 10.3, source: 'USDA FDC, Wine, table, white (174837)' },
  'red-wine': { alcohol: 10.6, source: 'USDA FDC, Wine, table, red (173190)' },
  beer: { alcohol: 3.9, source: 'USDA FDC, Beer, regular, all (168746)' },
  ouzo: { alcohol: 37.5, source: 'CIQUAL 2020, Pastis (anise-flavoured spirit) (1000)' },
  // sugar alcohol
  erythritol: { polyol: true, source: 'EU Reg. 1169/2011 Annex XIV: erythritol 0 kcal/g' },
}

const plainKcal = (r: IngredientSeed) => 4 * r.protein_100g + 4 * r.carbs_100g + 9 * r.fat_100g
const expectedKcal = (r: IngredientSeed, s: Special | undefined) => {
  if (!s) return plainKcal(r)
  const fibre = s.fibre ?? 0
  const carbs = s.polyol ? 0 : Math.max(r.carbs_100g - fibre, 0)
  return 4 * r.protein_100g + 4 * carbs + 2 * fibre + 9 * r.fat_100g + 7 * (s.alcohol ?? 0)
}
const tolerance = (kcal: number) => Math.max(20, 0.15 * kcal)

describe('ingredients as served — energy agrees with the macros', () => {
  it('every row: kcal ≈ 4P + 4C + 9F (±15 % or ±20 kcal), fibre/alcohol/polyol rows by their composition', () => {
    for (const row of ROWS) {
      const want = expectedKcal(row, SPECIAL[row.slug])
      expect(
        Math.abs(row.kcal_100g - want),
        `${row.slug}: kcal ${row.kcal_100g} vs ${want.toFixed(0)} from the macros`,
      ).toBeLessThanOrEqual(tolerance(row.kcal_100g))
    }
  })

  it('every SPECIAL entry names a real row that the plain formula really cannot explain', () => {
    const bySlug = new Map(ROWS.map((r) => [r.slug, r]))
    for (const [slug, s] of Object.entries(SPECIAL)) {
      const row = bySlug.get(slug)
      expect(row, `SPECIAL ${slug} is not an ingredient`).toBeDefined()
      if (!row) continue
      expect(s.source.trim(), `${slug} source`).not.toBe('')
      expect(
        Math.abs(row.kcal_100g - plainKcal(row)),
        `${slug} passes the plain formula — drop it from SPECIAL`,
      ).toBeGreaterThan(tolerance(row.kcal_100g))
    }
  })

  it('macros fit in 100 g and kcal stays within 0..900', () => {
    for (const row of ROWS) {
      expect(row.protein_100g + row.carbs_100g + row.fat_100g, row.slug).toBeLessThanOrEqual(100)
      expect(row.kcal_100g, row.slug).toBeGreaterThanOrEqual(0)
      expect(row.kcal_100g, row.slug).toBeLessThanOrEqual(900)
    }
  })

  it('Greek products carry an EU source (CIQUAL or EU labels), not the generic USDA note', () => {
    const greek = ['feta', 'graviera', 'kefalotyri', 'mizithra', 'kasseri', 'greek-yoghurt']
    for (const slug of [...greek, 'greek-yoghurt-light', 'rusks', 'trahana', 'tahini', 'halva']) {
      const row = ROWS.find((r) => r.slug === slug)
      expect(row?.source_note, slug).toMatch(/CIQUAL 2020|EU nutrition label/)
    }
    for (const slug of ['horta', 'orzo', 'honey', 'kalamata-olives', 'olive-oil', 'pastourma']) {
      expect(ROWS.find((r) => r.slug === slug)?.source_note, slug).toMatch(/CIQUAL|EU/)
    }
  })
})

describe('ingredients as served — prices', () => {
  it('every range is positive and ordered: 0 < price_eur_min ≤ price_eur_max', () => {
    for (const row of ROWS) {
      expect(row.price_eur_min, `${row.slug} min`).toBeGreaterThan(0)
      expect(row.price_eur_max, `${row.slug} max`).toBeGreaterThan(0)
      expect(row.price_eur_min, `${row.slug} min ≤ max`).toBeLessThanOrEqual(row.price_eur_max)
      expect(row.price_as_of, `${row.slug} price_as_of`).toMatch(ISO_DATE)
    }
  })

  it('a shelf-checked price names its source and method; every other price says it is an estimate', () => {
    for (const row of ROWS) {
      if (row.price_as_of === SHELF_CHECKED_AS_OF)
        expect(row.price_note, row.slug).toMatch(/Sklavenitis|My market/)
      else expect(row.price_note, row.slug).toMatch(/^Estimate, not checked against shelf prices/)
    }
  })

  it('the most-used ingredients are shelf-checked (≥ 120 rows, and every row used by ≥ 5 recipes)', () => {
    const uses = new Map<string, number>()
    for (const r of RECIPES)
      for (const l of r.ingredients)
        uses.set(l.ingredient_slug, (uses.get(l.ingredient_slug) ?? 0) + 1)
    const checked = ROWS.filter((r) => r.price_as_of === SHELF_CHECKED_AS_OF)
    expect(checked.length).toBeGreaterThanOrEqual(120)
    // A row used by ≥ 5 recipes may stay an estimate only when the chains did not stock it on
    // 2026-10-06: vanilla extract (not sold), strawberries (out of season — only a frozen pack).
    const notStocked = new Set(['vanilla-extract', 'strawberry'])
    for (const row of ROWS) {
      if ((uses.get(row.slug) ?? 0) < 5 || notStocked.has(row.slug)) continue
      expect(row.price_as_of, `${row.slug} (used ${uses.get(row.slug)}×) is shelf-checked`).toBe(
        SHELF_CHECKED_AS_OF,
      )
    }
  })
})
