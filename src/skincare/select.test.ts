import { bundledSource } from '../content/bundled'
import { CARE_AREAS, SKINCARE_CATEGORIES, SKIN_CONCERNS } from '../content/enums'
import type { SkincareProductType, SkincareRoutine, SkincareTip } from '../content/source'
import { SKINCARE_PRODUCT_TYPES, SKINCARE_ROUTINES, SKINCARE_TIPS } from '../content/seed/skincare'
import {
  AUDIENCE_OPTIONS,
  DEFAULT_SELECTION,
  NAIL_CATEGORIES,
  REGION_OPTIONS,
  SKIN_TYPE_OPTIONS,
  areaOfCategory,
  concernOptions,
  isUrl,
  matchesProductType,
  matchesRoutine,
  matchesTip,
  parseSelection,
  resolveSteps,
  selectContent,
  serializeSelection,
  sortProductTypes,
  sortRoutines,
  sourceLabel,
  withPatch,
  type SkincareContent,
  type SkincareSelection,
} from './select'

// The pure half of /skincare (P7.2). The seed is the fixture: 52 product types, 28 routines (24 face
// + 4 nails), 65 tips (51 face + 14 nails) — every assertion below is computed from it, never a
// literal count, so a seed edit cannot leave a stale number here.

const meta = { id: 'x', status: 'pending' as const }
const TYPES: SkincareProductType[] = SKINCARE_PRODUCT_TYPES.map((row) => ({ ...row, ...meta }))
const ROUTINES: SkincareRoutine[] = SKINCARE_ROUTINES.map((row) => ({ ...row, ...meta }))
const TIPS: SkincareTip[] = SKINCARE_TIPS.map((row) => ({ ...row, ...meta }))
const CONTENT: SkincareContent = { productTypes: TYPES, routines: ROUTINES, tips: TIPS }

const sel = (patch: Partial<SkincareSelection>): SkincareSelection => ({
  ...DEFAULT_SELECTION,
  ...patch,
})

describe('option lists', () => {
  it('offer men and women (everyone is the null option), every skin type but all, every region but global', () => {
    expect(AUDIENCE_OPTIONS).toEqual(['men', 'women'])
    expect(SKIN_TYPE_OPTIONS).toEqual(['normal', 'dry', 'oily', 'combination', 'sensitive'])
    expect(REGION_OPTIONS).toEqual(['eu', 'us', 'kr', 'jp'])
  })

  it('derive the area of a product type from its category: six nail categories, the rest face', () => {
    expect([...NAIL_CATEGORIES].sort()).toEqual(
      [
        'cuticle_oil',
        'nail_treatment',
        'hand_cream',
        'base_coat',
        'nail_file',
        'nail_remover',
      ].sort(),
    )
    for (const category of SKINCARE_CATEGORIES) {
      expect(areaOfCategory(category)).toBe(NAIL_CATEGORIES.has(category) ? 'nails' : 'face')
    }
    // Every seeded nail-category type says so in its concerns too (the derivation is not arbitrary).
    for (const type of TYPES.filter((p) => NAIL_CATEGORIES.has(p.category))) {
      expect(
        type.concerns.some((c) => c === 'nails' || c === 'hands'),
        type.slug,
      ).toBe(true)
    }
  })

  it('offer the face concerns without `nails`, and four nail concerns', () => {
    expect(concernOptions('face')).toEqual(SKIN_CONCERNS.filter((c) => c !== 'nails'))
    expect(concernOptions('nails')).toEqual(['nails', 'hands', 'hydration', 'general'])
    // Every concern a seeded nail tip uses is offered under nails (no tip is unreachable).
    const used = new Set(TIPS.filter((t) => t.area === 'nails').flatMap((t) => t.concerns))
    for (const concern of used) expect(concernOptions('nails')).toContain(concern)
  })
})

describe('parseSelection / serializeSelection', () => {
  it('reads an empty URL as the default (face, everything)', () => {
    expect(parseSelection(new URLSearchParams())).toEqual(DEFAULT_SELECTION)
    expect(serializeSelection(DEFAULT_SELECTION).toString()).toBe('')
  })

  it('reads every known value and treats unknown, blank, `all` and `global` as null', () => {
    expect(
      parseSelection(new URLSearchParams('area=nails&audience=men&concern=hands&region=kr')),
    ).toEqual({ area: 'nails', audience: 'men', skin: null, concern: 'hands', region: 'kr' })
    expect(
      parseSelection(new URLSearchParams('audience=women&skin=dry&concern=acne&region=eu')),
    ).toEqual({ area: 'face', audience: 'women', skin: 'dry', concern: 'acne', region: 'eu' })
    expect(
      parseSelection(new URLSearchParams('area=x&audience=all&skin=all&concern=&region=global')),
    ).toEqual(DEFAULT_SELECTION)
    expect(parseSelection(new URLSearchParams('audience=kids&skin=scaly&region=mars'))).toEqual(
      DEFAULT_SELECTION,
    )
  })

  it('drops `skin` under nails and a concern the area does not offer', () => {
    expect(parseSelection(new URLSearchParams('area=nails&skin=dry')).skin).toBeNull()
    expect(parseSelection(new URLSearchParams('area=nails&concern=shaving')).concern).toBeNull()
    expect(parseSelection(new URLSearchParams('concern=nails')).concern).toBeNull()
    expect(parseSelection(new URLSearchParams('area=nails&concern=nails')).concern).toBe('nails')
  })

  it('round-trips every non-default selection and writes only the non-default keys', () => {
    const s = sel({ audience: 'men', skin: 'oily', concern: 'acne', region: 'us' })
    expect(serializeSelection(s).toString()).toBe('audience=men&skin=oily&concern=acne&region=us')
    expect(parseSelection(serializeSelection(s))).toEqual(s)
    const nails = sel({ area: 'nails', audience: 'women', concern: 'nails' })
    expect(serializeSelection(nails).toString()).toBe('area=nails&audience=women&concern=nails')
    expect(parseSelection(serializeSelection(nails))).toEqual(nails)
  })

  it('withPatch applies a change and keeps the state coherent (nails drops skin + a face-only concern)', () => {
    const face = sel({ skin: 'dry', concern: 'shaving', region: 'kr' })
    expect(withPatch(face, { area: 'nails' })).toEqual(
      sel({ area: 'nails', skin: null, concern: null, region: 'kr' }),
    )
    expect(withPatch(face, { audience: 'men' })).toEqual({ ...face, audience: 'men' })
    expect(withPatch(sel({ area: 'nails', concern: 'hydration' }), { area: 'face' })).toEqual(
      sel({ concern: 'hydration' }),
    )
  })
})

describe('matching', () => {
  it('area is a hard switch on routines and tips, derived from category on product types', () => {
    for (const area of CARE_AREAS) {
      const s = sel({ area })
      expect(ROUTINES.filter((r) => matchesRoutine(r, s)).every((r) => r.area === area)).toBe(true)
      expect(TIPS.filter((t) => matchesTip(t, s)).every((t) => t.area === area)).toBe(true)
      expect(
        TYPES.filter((p) => matchesProductType(p, s)).every(
          (p) => areaOfCategory(p.category) === area,
        ),
      ).toBe(true)
    }
    const face = selectContent(CONTENT, sel({}))
    const nails = selectContent(CONTENT, sel({ area: 'nails' }))
    expect(face.routines.length + nails.routines.length).toBe(ROUTINES.length)
    expect(face.tips.length + nails.tips.length).toBe(TIPS.length)
    expect(face.productTypes.length + nails.productTypes.length).toBe(TYPES.length)
    expect(nails.routines.length).toBeGreaterThan(0)
    expect(nails.productTypes.length).toBeGreaterThan(0)
    expect(nails.tips.length).toBeGreaterThan(0)
  })

  it('an audience includes content for everyone (`all`) and excludes the other audience', () => {
    const men = selectContent(CONTENT, sel({ audience: 'men' }))
    expect(men.routines.every((r) => r.audience === 'men' || r.audience === 'all')).toBe(true)
    expect(men.routines.some((r) => r.audience === 'all')).toBe(true)
    expect(men.routines.some((r) => r.audience === 'women')).toBe(false)
    expect(men.tips.every((t) => t.audiences.includes('men') || t.audiences.includes('all'))).toBe(
      true,
    )
    expect(
      men.productTypes.every((p) => p.audiences.includes('men') || p.audiences.includes('all')),
    ).toBe(true)
    // Exact count from the seed, not a literal.
    expect(men.routines.length).toBe(
      ROUTINES.filter((r) => r.area === 'face' && r.audience !== 'women').length,
    )
  })

  it('a skin type includes universal content (`all`) and excludes other skin types', () => {
    const dry = selectContent(CONTENT, sel({ skin: 'dry' }))
    expect(dry.routines.every((r) => r.skin_type === 'dry' || r.skin_type === 'all')).toBe(true)
    expect(dry.routines.some((r) => r.skin_type === 'all')).toBe(true)
    expect(dry.routines.some((r) => r.skin_type === 'oily')).toBe(false)
    expect(
      dry.productTypes.every((p) => p.skin_types.includes('dry') || p.skin_types.includes('all')),
    ).toBe(true)
    expect(
      dry.tips.every((t) => t.skin_types.includes('dry') || t.skin_types.includes('all')),
    ).toBe(true)
  })

  it('a regional style includes `global` content; routines carry one style, so kr shows only kr', () => {
    const kr = selectContent(CONTENT, sel({ region: 'kr' }))
    // Face routines are never `global` in the seed (the nail ones are), so kr face routines are kr only.
    expect(kr.routines.length).toBeGreaterThan(0)
    expect(kr.routines.every((r) => r.region === 'kr')).toBe(true)
    expect(kr.routines.length).toBe(
      ROUTINES.filter((r) => r.area === 'face' && r.region === 'kr').length,
    )
    expect(
      kr.productTypes.every((p) => p.regions.includes('kr') || p.regions.includes('global')),
    ).toBe(true)
    expect(kr.productTypes.some((p) => !p.regions.includes('kr'))).toBe(true) // a global type
    expect(kr.tips.every((t) => t.regions.includes('kr') || t.regions.includes('global'))).toBe(
      true,
    )
    // Under nails every routine is global, so any style shows them all.
    const nailsJp = selectContent(CONTENT, sel({ area: 'nails', region: 'jp' }))
    expect(nailsJp.routines.length).toBe(ROUTINES.filter((r) => r.area === 'nails').length)
  })

  it('a concern filters product types and tips literally and leaves routines untouched', () => {
    const acne = selectContent(CONTENT, sel({ concern: 'acne' }))
    expect(acne.routines.length).toBe(selectContent(CONTENT, sel({})).routines.length)
    expect(acne.productTypes.length).toBeGreaterThan(0)
    expect(acne.productTypes.every((p) => p.concerns.includes('acne'))).toBe(true)
    expect(acne.tips.length).toBeGreaterThan(0)
    expect(acne.tips.every((t) => t.concerns.includes('acne'))).toBe(true)
    // `general` is a value, not a wildcard: a general-only tip does not match `acne`.
    const generalOnly = TIPS.find((t) => t.concerns.length === 1 && t.concerns[0] === 'general')
    expect(generalOnly).toBeDefined()
    expect(matchesTip(generalOnly as SkincareTip, sel({ concern: 'acne' }))).toBe(false)
  })

  it('filters combine (AND) and can match nothing', () => {
    const s = sel({ audience: 'men', skin: 'sensitive', concern: 'beard', region: 'jp' })
    const view = selectContent(CONTENT, s)
    for (const r of view.routines) {
      expect(matchesRoutine(r, s)).toBe(true)
      expect(['men', 'all']).toContain(r.audience)
      expect(['sensitive', 'all']).toContain(r.skin_type)
      expect(r.region).toBe('jp')
    }
    const nothing = selectContent(
      CONTENT,
      sel({ area: 'nails', audience: 'men', concern: 'general' }),
    )
    expect(nothing.productTypes).toEqual([])
  })
})

describe('ordering', () => {
  it('sorts routines AM → PM → weekly, then audience men → women → all, then skin type, then slug', () => {
    const sorted = sortRoutines(ROUTINES)
    expect(sorted).toHaveLength(ROUTINES.length)
    const timeRank = { am: 0, pm: 1, weekly: 2 }
    const audienceRank = { men: 0, women: 1, all: 2 }
    for (let i = 1; i < sorted.length; i++) {
      const a = sorted[i - 1] as SkincareRoutine
      const b = sorted[i] as SkincareRoutine
      const byTime = timeRank[a.time] - timeRank[b.time]
      if (byTime !== 0) {
        expect(byTime).toBeLessThan(0)
        continue
      }
      const byAudience = audienceRank[a.audience] - audienceRank[b.audience]
      expect(byAudience).toBeLessThanOrEqual(0)
    }
    expect(sorted[0]?.time).toBe('am')
    expect(sorted.at(-1)?.time).toBe('weekly')
  })

  it('sorts product types in SKINCARE_CATEGORIES order (cleanser first, nail remover last)', () => {
    const sorted = sortProductTypes(TYPES)
    const ranks = sorted.map((p) => SKINCARE_CATEGORIES.indexOf(p.category))
    expect([...ranks].sort((a, b) => a - b)).toEqual(ranks)
    expect(sorted[0]?.category).toBe('cleanser')
    expect(sorted.at(-1)?.category).toBe('nail_remover')
  })

  it('keeps the tips in seed order', () => {
    const face = selectContent(CONTENT, sel({})).tips.map((t) => t.slug)
    expect(face).toEqual(TIPS.filter((t) => t.area === 'face').map((t) => t.slug))
  })
})

describe('resolveSteps', () => {
  const routine = ROUTINES[0] as SkincareRoutine

  it('resolves every seeded step by slug, in `order`', () => {
    for (const r of ROUTINES) {
      const steps = resolveSteps(r, TYPES)
      expect(steps.map((s) => s.step.order)).toEqual(r.steps.map((_, i) => i + 1))
      for (const { step, type } of steps) {
        expect(type, `${r.slug} step ${step.order} ${step.product_type_slug}`).not.toBeNull()
        expect(type?.slug).toBe(step.product_type_slug)
      }
    }
  })

  it('sorts by `order` even when the array arrives shuffled', () => {
    const shuffled = { ...routine, steps: [...routine.steps].reverse() }
    expect(resolveSteps(shuffled, TYPES).map((s) => s.step.order)).toEqual(
      routine.steps.map((s) => s.order),
    )
  })

  it('leaves a step whose type is missing (pending / hidden) as `type: null` and keeps its place', () => {
    const hidden = routine.steps[1]?.product_type_slug
    if (!hidden) throw new Error('fixture routine needs at least two steps')
    const visible = TYPES.filter((p) => p.slug !== hidden)
    const steps = resolveSteps(routine, visible)
    expect(steps).toHaveLength(routine.steps.length)
    expect(steps[1]?.type).toBeNull()
    expect(steps[1]?.step.product_type_slug).toBe(hidden)
    expect(steps.filter((s) => s.type === null)).toHaveLength(
      routine.steps.filter((s) => s.product_type_slug === hidden).length,
    )
    expect(resolveSteps(routine, []).every((s) => s.type === null)).toBe(true)
  })
})

describe('sources', () => {
  it('labels a URL by hostname without www and passes a citation through', () => {
    expect(sourceLabel('https://www.nhs.uk/live-well/')).toBe('nhs.uk')
    expect(sourceLabel('https://www.aad.org/public/x')).toBe('aad.org')
    expect(sourceLabel('WHO fact sheet, 2024')).toBe('WHO fact sheet, 2024')
    expect(isUrl('https://x.y')).toBe(true)
    expect(isUrl('http://x.y')).toBe(true)
    expect(isUrl('ftp://x.y')).toBe(false)
    expect(isUrl('a citation')).toBe(false)
  })
})

describe('with the bundled ContentSource', () => {
  it('the three reads feed selectContent and every face routine step resolves', async () => {
    const [types, routines, tips] = await Promise.all([
      bundledSource.listSkincareProductTypes(),
      bundledSource.listSkincareRoutines(),
      bundledSource.listSkincareTips(),
    ])
    if (!types.ok || !routines.ok || !tips.ok) throw new Error('bundled skincare failed')
    const view = selectContent(
      { productTypes: types.data, routines: routines.data, tips: tips.data },
      DEFAULT_SELECTION,
    )
    expect(view.routines.length).toBe(ROUTINES.filter((r) => r.area === 'face').length)
    for (const r of view.routines) {
      expect(resolveSteps(r, types.data).every((s) => s.type !== null)).toBe(true)
    }
  })
})
