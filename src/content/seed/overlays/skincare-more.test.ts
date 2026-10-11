// OVERLAY 0011 — more skincare & nails (./0011-skincare-more.ts). The generic skincare rules
// (enums, bilingual completeness, sentence counts, source allow-list, step order, time-of-day
// fit, "a condition names a professional") already run over the SERVED seed in ../skincare.test.ts.
// What is proven HERE is specific to this overlay:
//   * it is registered after 0010 and only ADDS rows to the three skincare tables;
//   * the counts (27 product types, 20 routines, 46 tips), all served by the bundled source;
//   * every slug is new against the base seed and every earlier overlay;
//   * every enum literal is one the schema's CHECK constraints accept (no schema change);
//   * both languages are present on every row, and every tip carries at least one https source;
//   * the brief's balance: a strong share for women, men still covered, nails covered;
//   * the pregnancy routines contain no retinoid product type (and no bakuchiol), and say so.

import { describe, expect, it } from 'vitest'
import { hasGreek } from '../../../test/bilingual'
import { OVERLAID_SEED } from '../../../test/overlaidSeed'
import { bundledSource } from '../../bundled'
import {
  AUDIENCES,
  CARE_AREAS,
  PRICE_BANDS,
  REGIONS,
  ROUTINE_TIMES,
  SKINCARE_CATEGORIES,
  SKIN_CONCERNS,
  SKIN_TYPES,
  SLUG_RE,
  STEP_TIMES,
} from '../../enums'
import type { SkincareProductTypeSeed } from '../../types'
import { SKINCARE_PRODUCT_TYPES, SKINCARE_ROUTINES, SKINCARE_TIPS } from '../skincare'
import { OVERLAY } from './0011-skincare-more'
import { OVERLAYS } from './index'

const additions = OVERLAY.additions ?? {}
const newTypes = additions.skincare_product_types ?? []
const newRoutines = additions.skincare_routines ?? []
const newTips = additions.skincare_tips ?? []

const servedTypes = new Map(OVERLAID_SEED.skincare_product_types.map((p) => [p.slug, p]))

/** Slugs of a table served BEFORE this overlay: the base seed plus every earlier overlay's additions. */
function slugsBefore(
  table: 'skincare_product_types' | 'skincare_routines' | 'skincare_tips',
  base: readonly { slug: string }[],
): Set<string> {
  const before = new Set(base.map((r) => r.slug))
  for (const o of OVERLAYS) {
    if (o === OVERLAY) break
    for (const r of o.additions?.[table] ?? []) before.add(r.slug)
  }
  return before
}

/** A product type that is (or contains) a retinoid — never in a pregnancy routine. */
const isRetinoid = (p: SkincareProductTypeSeed) =>
  p.key_ingredients.some((i) => /retin|adapalene|tretinoin|tazarotene/.test(i)) ||
  p.avoid_with.includes('pregnancy and breastfeeding')
/** No pregnancy data either: kept out of the pregnancy routines on purpose (see its notes). */
const hasBakuchiol = (p: SkincareProductTypeSeed) => p.key_ingredients.includes('bakuchiol')

describe('overlay 0011-skincare-more', () => {
  it('is registered after 0010 and adds rows to the three skincare tables only (no patches)', () => {
    expect(OVERLAYS).toContain(OVERLAY)
    expect(OVERLAY.id).toBe('0011-skincare-more')
    expect(OVERLAYS.indexOf(OVERLAY)).toBeGreaterThan(
      OVERLAYS.findIndex((o) => o.id === '0010-recipe-photos-3'),
    )
    expect(OVERLAY.patches).toBeUndefined()
    expect(Object.keys(additions).sort()).toEqual([
      'skincare_product_types',
      'skincare_routines',
      'skincare_tips',
    ])
  })

  it('adds 27 product types, 20 routines and 46 tips, and the served totals grow by exactly that', () => {
    expect(newTypes).toHaveLength(27)
    expect(newRoutines).toHaveLength(20)
    expect(newTips).toHaveLength(46)
    expect(OVERLAID_SEED.skincare_product_types).toHaveLength(SKINCARE_PRODUCT_TYPES.length + 27)
    expect(OVERLAID_SEED.skincare_routines).toHaveLength(SKINCARE_ROUTINES.length + 20)
    expect(OVERLAID_SEED.skincare_tips).toHaveLength(SKINCARE_TIPS.length + 46)
  })

  it('every slug is unique, kebab-case and new against everything served before it', () => {
    for (const [table, rows, base] of [
      ['skincare_product_types', newTypes, SKINCARE_PRODUCT_TYPES],
      ['skincare_routines', newRoutines, SKINCARE_ROUTINES],
      ['skincare_tips', newTips, SKINCARE_TIPS],
    ] as const) {
      const slugs = rows.map((r) => r.slug)
      expect(new Set(slugs).size, table).toBe(slugs.length)
      const before = slugsBefore(table, base)
      for (const s of slugs) {
        expect(s, `${table} ${s}`).toMatch(SLUG_RE)
        expect(before.has(s), `${table} ${s} already exists`).toBe(false)
      }
    }
    for (const r of newRoutines) expect(r.slug.startsWith(`${r.area}-`), r.slug).toBe(true)
    for (const t of newTips) expect(t.slug.startsWith(`${t.area}-`), t.slug).toBe(true)
  })

  it('every enum literal fits the existing CHECK constraints (no schema change)', () => {
    const within = (allowed: readonly string[], values: readonly string[]) =>
      values.length > 0 && values.every((v) => allowed.includes(v))
    for (const p of newTypes) {
      expect(SKINCARE_CATEGORIES, p.slug).toContain(p.category)
      expect(STEP_TIMES, p.slug).toContain(p.time)
      expect(PRICE_BANDS, p.slug).toContain(p.price_band_eur)
      expect(within(REGIONS, p.regions), `${p.slug} regions`).toBe(true)
      expect(within(AUDIENCES, p.audiences), `${p.slug} audiences`).toBe(true)
      expect(within(SKIN_TYPES, p.skin_types), `${p.slug} skin_types`).toBe(true)
      expect(within(SKIN_CONCERNS, p.concerns), `${p.slug} concerns`).toBe(true)
    }
    for (const r of newRoutines) {
      expect(CARE_AREAS, r.slug).toContain(r.area)
      expect(AUDIENCES, r.slug).toContain(r.audience)
      expect(SKIN_TYPES, r.slug).toContain(r.skin_type)
      expect(REGIONS, r.slug).toContain(r.region)
      expect(ROUTINE_TIMES, r.slug).toContain(r.time)
      expect(r.steps.length, r.slug).toBeGreaterThanOrEqual(1)
      expect(r.steps.length, r.slug).toBeLessThanOrEqual(10)
      expect(Number.isInteger(r.duration_min) && r.duration_min > 0, r.slug).toBe(true)
      // A face routine carries ONE regional style (the page's style filter relies on it).
      if (r.area === 'face') expect(r.region, r.slug).not.toBe('global')
    }
    for (const t of newTips) {
      expect(CARE_AREAS, t.slug).toContain(t.area)
      expect(within(AUDIENCES, t.audiences), `${t.slug} audiences`).toBe(true)
      expect(within(SKIN_TYPES, t.skin_types), `${t.slug} skin_types`).toBe(true)
      expect(within(SKIN_CONCERNS, t.concerns), `${t.slug} concerns`).toBe(true)
      expect(within(REGIONS, t.regions), `${t.slug} regions`).toBe(true)
    }
  })

  it('every row is bilingual: Greek script in el, none in en, nothing blank', () => {
    const pairs: [string, string, string][] = [
      ...newTypes.flatMap((p) => [
        [p.slug, p.name_el, p.name_en] as [string, string, string],
        [p.slug, p.description_el, p.description_en] as [string, string, string],
        [p.slug, p.notes_el, p.notes_en] as [string, string, string],
      ]),
      ...newRoutines.flatMap((r) => [
        [r.slug, r.name_el, r.name_en] as [string, string, string],
        [r.slug, r.intro_el, r.intro_en] as [string, string, string],
        ...r.steps.map((s) => [r.slug, s.note_el, s.note_en] as [string, string, string]),
      ]),
      ...newTips.flatMap((t) => [
        [t.slug, t.title_el, t.title_en] as [string, string, string],
        [t.slug, t.body_el, t.body_en] as [string, string, string],
      ]),
    ]
    for (const [slug, elText, enText] of pairs) {
      expect(elText.trim().length, slug).toBeGreaterThan(0)
      expect(enText.trim().length, slug).toBeGreaterThan(0)
      expect(hasGreek(elText), `${slug} el: ${elText}`).toBe(true)
      expect(hasGreek(enText), `${slug} en: ${enText}`).toBe(false)
      expect(elText, slug).not.toBe(enText)
    }
  })

  it('every tip is sourced with https URLs and none is flagged needs_source', () => {
    for (const t of newTips) {
      expect(t.needs_source, t.slug).toBe(false)
      expect(t.sources.length, t.slug).toBeGreaterThan(0)
      expect(new Set(t.sources).size, `${t.slug} repeats a source`).toBe(t.sources.length)
      for (const url of t.sources) expect(url, t.slug).toMatch(/^https:\/\/[a-z0-9.-]+\.[a-z]+\//)
    }
  })

  it('every routine step resolves to a served product type, in order, with no repeats', () => {
    for (const r of newRoutines) {
      r.steps.forEach((s, i) => {
        expect(s.order, `${r.slug} step ${i}`).toBe(i + 1)
        expect(servedTypes.has(s.product_type_slug), `${r.slug}: ${s.product_type_slug}`).toBe(true)
      })
      const slugs = r.steps.map((s) => s.product_type_slug)
      expect(new Set(slugs).size, r.slug).toBe(slugs.length)
    }
    // Every new product type is used by at least one served routine, or is a guide-only nail /
    // sunscreen format the routines do not need (listed so a stray unused type is a visible change).
    const used = new Set(
      OVERLAID_SEED.skincare_routines.flatMap((r) => r.steps.map((s) => s.product_type_slug)),
    )
    const guideOnly = newTypes.filter((p) => !used.has(p.slug)).map((p) => p.slug)
    expect(guideOnly.sort()).toEqual([
      'cleanser-eye-makeup-biphase',
      'exfoliant-mandelic',
      'eye-patch-hydrogel',
      'sunscreen-primer-spf',
      'sunscreen-spray-reapply',
    ])
  })

  it('weights women strongly while keeping men and nails covered', () => {
    const forWomen = (a: readonly string[]) => a.includes('women')
    const forMen = (a: readonly string[]) => a.includes('men')
    const womenRoutines = newRoutines.filter((r) => r.audience === 'women').length
    const menRoutines = newRoutines.filter((r) => r.audience === 'men').length
    const womenTips = newTips.filter((t) => forWomen(t.audiences)).length
    const menTips = newTips.filter((t) => forMen(t.audiences)).length
    const womenTypes = newTypes.filter((p) => forWomen(p.audiences)).length
    const menTypes = newTypes.filter((p) => forMen(p.audiences)).length
    console.log(
      `0011: women-specific routines ${womenRoutines}, men ${menRoutines}; tips women ${womenTips}, men ${menTips}; ` +
        `types women ${womenTypes}, men ${menTypes}`,
    )
    expect(womenRoutines).toBeGreaterThanOrEqual(8)
    expect(womenTips).toBeGreaterThanOrEqual(15)
    expect(womenTypes).toBeGreaterThanOrEqual(8)
    expect(womenRoutines).toBeGreaterThan(menRoutines)
    expect(menRoutines).toBeGreaterThanOrEqual(3)
    expect(menTips).toBeGreaterThanOrEqual(3)
    expect(menTypes).toBeGreaterThanOrEqual(3)
    expect(newRoutines.filter((r) => r.area === 'nails').length).toBeGreaterThanOrEqual(3)
    expect(newTips.filter((t) => t.area === 'nails').length).toBeGreaterThanOrEqual(6)
  })

  it('covers the briefed themes by slug', () => {
    const slugs = [...newTypes, ...newRoutines, ...newTips].map((r) => r.slug).join(' ')
    for (const needle of [
      'tranexamic',
      'bakuchiol',
      'retinal',
      'arbutin',
      'urea',
      'tinted',
      'spray',
      'primer-spf',
      'melasma',
      'rosacea',
      'adult-acne',
      'perimenopause',
      'pregnancy',
      'after-sun',
      'sunburn',
      'greek-summer',
      'budget',
      'gel',
      'cuticle',
      'brittle',
      'eu-retinol',
    ])
      expect(slugs, needle).toContain(needle)
  })

  it('the pregnancy routines contain no retinoid product type and no bakuchiol, and say so', () => {
    const pregnancy = OVERLAID_SEED.skincare_routines.filter((r) => r.slug.includes('pregnancy'))
    expect(pregnancy.map((r) => r.slug).sort()).toEqual([
      'face-women-all-am-eu-pregnancy-safe',
      'face-women-all-pm-eu-pregnancy-safe',
    ])
    // The detector is not vacuous: it flags the served retinoid types.
    const retinoids = [...servedTypes.values()].filter(isRetinoid).map((p) => p.slug)
    for (const s of [
      'serum-retinol',
      'serum-retinal',
      'treatment-adapalene-otc',
      'eye-cream-retinal',
    ])
      expect(retinoids, s).toContain(s)
    for (const r of pregnancy) {
      expect(r.audience, r.slug).toBe('women')
      for (const s of r.steps) {
        const type = servedTypes.get(s.product_type_slug)
        expect(type, `${r.slug}: ${s.product_type_slug}`).toBeDefined()
        expect(isRetinoid(type!), `${r.slug} uses retinoid ${s.product_type_slug}`).toBe(false)
        expect(hasBakuchiol(type!), `${r.slug} uses bakuchiol ${s.product_type_slug}`).toBe(false)
      }
      expect(r.intro_el + r.intro_en, r.slug).toMatch(/ρετινο|retino/i)
      expect(r.name_en, r.slug).toMatch(/retinoid-free/)
    }
  })

  it('the bundled source serves every new row', async () => {
    const [types, routines, tips] = await Promise.all([
      bundledSource.listSkincareProductTypes(),
      bundledSource.listSkincareRoutines(),
      bundledSource.listSkincareTips(),
    ])
    if (!types.ok || !routines.ok || !tips.ok) throw new Error('bundled skincare read failed')
    const has = (rows: readonly { slug: string }[], wanted: readonly { slug: string }[]) => {
      const set = new Set(rows.map((r) => r.slug))
      return wanted.filter((w) => !set.has(w.slug)).map((w) => w.slug)
    }
    expect(has(types.data, newTypes)).toEqual([])
    expect(has(routines.data, newRoutines)).toEqual([])
    expect(has(tips.data, newTips)).toEqual([])
  })
})
