// SEASONAL PRODUCE (./seasonal.ts): the calendar is well-formed, every slug is a real ingredient
// of the served catalogue, both languages are written, the year-round staples are left out, and the
// pure helpers do what the season strip and `?season=now` rely on.

import { describe, expect, it } from 'vitest'
import { hasGreek } from '../test/bilingual'
import { OVERLAID_SEED } from '../test/overlaidSeed'
import {
  MONTHS,
  SEASONAL_PRODUCE,
  inSeason,
  inSeasonSlugs,
  monthOf,
  produceName,
  span,
  type Month,
} from './seasonal'

const ingredientSlugs = new Set(OVERLAID_SEED.ingredients.map((i) => i.slug))
const keysIn = (m: Month) => inSeason(m).map((p) => p.key)

describe('span', () => {
  it('is inclusive and ascending', () => {
    expect(span(3, 5)).toEqual([3, 4, 5])
    expect(span(7, 7)).toEqual([7])
  })
  it('wraps over the new year', () => {
    expect(span(11, 2)).toEqual([1, 2, 11, 12])
    expect(span(10, 3)).toEqual([1, 2, 3, 10, 11, 12])
  })
})

describe('monthOf', () => {
  it('is the local calendar month, 1-based', () => {
    expect(monthOf(new Date(2026, 0, 15))).toBe(1)
    expect(monthOf(new Date(2026, 9, 6))).toBe(10)
    expect(monthOf(new Date(2026, 11, 31, 23, 59))).toBe(12)
  })
})

describe('SEASONAL_PRODUCE — the data', () => {
  it('has unique keys; a slugged item uses its slug as key', () => {
    const keys = SEASONAL_PRODUCE.map((p) => p.key)
    expect(new Set(keys).size).toBe(keys.length)
    for (const p of SEASONAL_PRODUCE) if (p.slug !== null) expect(p.key).toBe(p.slug)
  })

  it('every slug resolves to an ingredient of the served catalogue', () => {
    const missing = SEASONAL_PRODUCE.filter((p) => p.slug !== null && !ingredientSlugs.has(p.slug))
    expect(missing.map((p) => p.slug)).toEqual([])
  })

  it('every item has valid, ascending, duplicate-free months, never all twelve', () => {
    for (const p of SEASONAL_PRODUCE) {
      expect(p.months.length, p.key).toBeGreaterThan(0)
      expect(p.months.length, p.key).toBeLessThan(12)
      for (const m of p.months) expect(MONTHS).toContain(m)
      expect([...p.months].sort((a, b) => a - b)).toEqual([...p.months])
      expect(new Set(p.months).size).toBe(p.months.length)
    }
  })

  it('writes Greek in name_el and no Greek in name_en, never the same string', () => {
    for (const p of SEASONAL_PRODUCE) {
      expect(hasGreek(p.name_el), p.key).toBe(true)
      expect(hasGreek(p.name_en), p.key).toBe(false)
      expect(p.name_el).not.toBe(p.name_en)
    }
  })

  it('leaves out the year-round staples, so the ≥ 2 boost means something', () => {
    for (const staple of ['onion', 'garlic', 'potato', 'carrot', 'lemon', 'parsley', 'dill']) {
      expect(
        SEASONAL_PRODUCE.some((p) => p.slug === staple),
        staple,
      ).toBe(false)
    }
  })

  it('offers at least eight items every month, fruit and vegetables both', () => {
    for (const m of MONTHS) {
      const now = inSeason(m)
      expect(now.length, `month ${m}`).toBeGreaterThanOrEqual(8)
      expect(
        now.some((p) => p.kind === 'fruit'),
        `month ${m} fruit`,
      ).toBe(true)
      expect(
        now.some((p) => p.kind === 'vegetable'),
        `month ${m} veg`,
      ).toBe(true)
    }
  })

  it('reads like a Greek market: summer, winter and spring land where they should', () => {
    expect(keysIn(7)).toEqual(expect.arrayContaining(['tomato', 'okra', 'watermelon', 'fig']))
    expect(keysIn(7)).not.toContain('orange')
    expect(keysIn(1)).toEqual(expect.arrayContaining(['orange', 'cabbage', 'horta', 'kiwi']))
    expect(keysIn(1)).not.toContain('watermelon')
    expect(keysIn(4)).toEqual(expect.arrayContaining(['artichoke', 'broad-beans', 'strawberry']))
    expect(keysIn(10)).toEqual(expect.arrayContaining(['pumpkin', 'pomegranate', 'quince']))
  })
})

describe('inSeason / inSeasonSlugs / produceName', () => {
  it('lists vegetables first, then fruit', () => {
    for (const m of MONTHS) {
      const kinds = inSeason(m).map((p) => p.kind)
      expect(kinds.indexOf('fruit')).toBeGreaterThan(kinds.lastIndexOf('vegetable'))
    }
  })

  it('slugs exclude produce the catalogue does not carry', () => {
    const oct = inSeasonSlugs(10)
    expect(oct.has('pumpkin')).toBe(true)
    expect(keysIn(10)).toContain('persimmon')
    expect(oct.has('persimmon')).toBe(false)
    expect(oct.size).toBe(inSeason(10).filter((p) => p.slug !== null).length)
  })

  it('names follow the language', () => {
    const pumpkin = SEASONAL_PRODUCE.find((p) => p.key === 'pumpkin')
    if (!pumpkin) throw new Error('no pumpkin')
    expect(produceName(pumpkin, 'el')).toBe('Κολοκύθα')
    expect(produceName(pumpkin, 'en')).toBe('Pumpkin')
  })
})
