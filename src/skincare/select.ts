// SKINCARE SELECTION (P7.2) — the pure half of /skincare: URL ⇄ filter state, the three filters
// (routines, product-type guide, tips) and step resolution. No React, no dictionary, so it is
// unit-tested on its own and the page is a thin renderer over it.
//
// Semantics, in one place (DECISIONS.md 2026-10-06 P7.2):
//   - `area` is a hard switch: a routine or tip is face OR nails (its `area` column); a product
//     type has no area column, so it is derived from `category` (the six nail categories are the
//     nails area, everything else is face).
//   - Every other filter is "null = everything". A chosen audience / skin type / region also
//     matches content written for EVERYONE: audience `all`, skin type `all`, region `global`.
//     A routine written for everyone is shown to men AND to women; a global tip is shown under
//     every regional style. Content never becomes invisible because it is universal.
//   - The concern filter applies to product types and tips (both carry `concerns[]`); routines
//     have no concern column (they are per skin type), so it leaves them untouched.
//   - Under nails the skin-type filter is irrelevant (every nail row is skin type `all`) and the
//     page hides it; `parseSelection` drops it too, so a stale `?skin=` cannot filter nail content.
//   - A step whose `product_type_slug` has no visible product type (pending / hidden under RLS in
//     supabase mode) resolves to `type: null`; the page renders it muted instead of dropping it,
//     so the routine's numbering stays honest.

import {
  AUDIENCES,
  CARE_AREAS,
  REGIONS,
  ROUTINE_TIMES,
  SKINCARE_CATEGORIES,
  SKIN_CONCERNS,
  SKIN_TYPES,
} from '../content/enums.ts'
import type {
  Audience,
  CareArea,
  Region,
  SkinConcern,
  SkinType,
  SkincareCategory,
} from '../content/enums.ts'
import type { SkincareProductType, SkincareRoutine, SkincareTip } from '../content/source.ts'
import type { SkincareRoutineStepSeed } from '../content/types.ts'

// --- state ---------------------------------------------------------------------------------------

export interface SkincareSelection {
  area: CareArea
  /** null = everyone (no audience filter). */
  audience: Audience | null
  /** null = all skin types; always null under `nails`. */
  skin: SkinType | null
  /** null = all concerns. */
  concern: SkinConcern | null
  /** null = every regional style. */
  region: Region | null
}

export const DEFAULT_SELECTION: SkincareSelection = {
  area: 'face',
  audience: null,
  skin: null,
  concern: null,
  region: null,
}

/** The URL keys (`?area=nails&audience=men&skin=dry&concern=acne&region=kr`). */
export const PARAM = {
  area: 'area',
  audience: 'audience',
  skin: 'skin',
  concern: 'concern',
  region: 'region',
} as const

/** The audience values the control offers: men, women — "everyone" is the null option. */
export const AUDIENCE_OPTIONS: readonly Exclude<Audience, 'all'>[] = ['men', 'women']
/** The skin types the control offers (`all` is the null option). */
export const SKIN_TYPE_OPTIONS: readonly Exclude<SkinType, 'all'>[] = SKIN_TYPES.filter(
  (s): s is Exclude<SkinType, 'all'> => s !== 'all',
)
/** The regional styles the control offers (`global` is absorbed by the null option). */
export const REGION_OPTIONS: readonly Exclude<Region, 'global'>[] = REGIONS.filter(
  (r): r is Exclude<Region, 'global'> => r !== 'global',
)

/** The six product-type categories that belong to the nails area. */
export const NAIL_CATEGORIES: ReadonlySet<SkincareCategory> = new Set<SkincareCategory>([
  'cuticle_oil',
  'nail_treatment',
  'hand_cream',
  'base_coat',
  'nail_file',
  'nail_remover',
])

export function areaOfCategory(category: SkincareCategory): CareArea {
  return NAIL_CATEGORIES.has(category) ? 'nails' : 'face'
}

/** The concerns that make sense for an area: face = everything but `nails`; nails = the four below. */
export function concernOptions(area: CareArea): readonly SkinConcern[] {
  return area === 'nails'
    ? (['nails', 'hands', 'hydration', 'general'] as const)
    : SKIN_CONCERNS.filter((c) => c !== 'nails')
}

function member<T extends string>(options: readonly T[], value: string | null): T | null {
  return value !== null && (options as readonly string[]).includes(value) ? (value as T) : null
}

/**
 * `URLSearchParams` → a selection. Absent, blank, unknown and the "everything" literals (`all`,
 * `global`) all read as null; a concern outside the area's options reads as null; `skin` is
 * always null under nails.
 */
export function parseSelection(params: URLSearchParams): SkincareSelection {
  const area = member(CARE_AREAS, params.get(PARAM.area)) ?? DEFAULT_SELECTION.area
  return {
    area,
    audience: member(AUDIENCE_OPTIONS, params.get(PARAM.audience)),
    skin: area === 'nails' ? null : member(SKIN_TYPE_OPTIONS, params.get(PARAM.skin)),
    concern: member(concernOptions(area), params.get(PARAM.concern)),
    region: member(REGION_OPTIONS, params.get(PARAM.region)),
  }
}

/** A selection → the URL; only non-default keys are written, so the default page is `/skincare`. */
export function serializeSelection(selection: SkincareSelection): URLSearchParams {
  const params = new URLSearchParams()
  if (selection.area !== DEFAULT_SELECTION.area) params.set(PARAM.area, selection.area)
  if (selection.audience !== null) params.set(PARAM.audience, selection.audience)
  if (selection.skin !== null && selection.area !== 'nails') params.set(PARAM.skin, selection.skin)
  if (selection.concern !== null) params.set(PARAM.concern, selection.concern)
  if (selection.region !== null) params.set(PARAM.region, selection.region)
  return params
}

/** `patch` applied to `selection`, re-read through the URL rules (so `area: 'nails'` drops `skin`). */
export function withPatch(
  selection: SkincareSelection,
  patch: Partial<SkincareSelection>,
): SkincareSelection {
  const next = { ...selection, ...patch }
  if (next.area === 'nails') next.skin = null
  if (next.concern !== null && !concernOptions(next.area).includes(next.concern)) {
    next.concern = null
  }
  return next
}

// --- matching ------------------------------------------------------------------------------------

const audienceOk = (want: Audience | null, have: readonly Audience[]) =>
  want === null || have.includes(want) || have.includes('all')
const skinOk = (want: SkinType | null, have: readonly SkinType[]) =>
  want === null || have.includes(want) || have.includes('all')
const regionOk = (want: Region | null, have: readonly Region[]) =>
  want === null || have.includes(want) || have.includes('global')
const concernOk = (want: SkinConcern | null, have: readonly SkinConcern[]) =>
  want === null || have.includes(want)

export function matchesRoutine(routine: SkincareRoutine, s: SkincareSelection): boolean {
  return (
    routine.area === s.area &&
    audienceOk(s.audience, [routine.audience]) &&
    skinOk(s.skin, [routine.skin_type]) &&
    regionOk(s.region, [routine.region])
  )
}

export function matchesProductType(type: SkincareProductType, s: SkincareSelection): boolean {
  return (
    areaOfCategory(type.category) === s.area &&
    audienceOk(s.audience, type.audiences) &&
    skinOk(s.skin, type.skin_types) &&
    concernOk(s.concern, type.concerns) &&
    regionOk(s.region, type.regions)
  )
}

export function matchesTip(tip: SkincareTip, s: SkincareSelection): boolean {
  return (
    tip.area === s.area &&
    audienceOk(s.audience, tip.audiences) &&
    skinOk(s.skin, tip.skin_types) &&
    concernOk(s.concern, tip.concerns) &&
    regionOk(s.region, tip.regions)
  )
}

// --- ordering ------------------------------------------------------------------------------------

const AUDIENCE_RANK = new Map<string, number>(AUDIENCES.map((a, i) => [a, i]))
const SKIN_RANK = new Map<string, number>(SKIN_TYPES.map((s, i) => [s, i]))
const TIME_RANK = new Map<string, number>(ROUTINE_TIMES.map((t, i) => [t, i]))
const CATEGORY_RANK = new Map<string, number>(SKINCARE_CATEGORIES.map((c, i) => [c, i]))

const rank = (map: Map<string, number>, key: string) => map.get(key) ?? map.size

/** Routines in the order the day runs: AM, PM, weekly; then audience; then skin type; then slug. */
export function sortRoutines(routines: readonly SkincareRoutine[]): SkincareRoutine[] {
  return [...routines].sort(
    (a, b) =>
      rank(TIME_RANK, a.time) - rank(TIME_RANK, b.time) ||
      rank(AUDIENCE_RANK, a.audience) - rank(AUDIENCE_RANK, b.audience) ||
      rank(SKIN_RANK, a.skin_type) - rank(SKIN_RANK, b.skin_type) ||
      a.slug.localeCompare(b.slug),
  )
}

/** Product types in `SKINCARE_CATEGORIES` order (cleanser → … → nail remover), then slug. */
export function sortProductTypes(types: readonly SkincareProductType[]): SkincareProductType[] {
  return [...types].sort(
    (a, b) =>
      rank(CATEGORY_RANK, a.category) - rank(CATEGORY_RANK, b.category) ||
      a.slug.localeCompare(b.slug),
  )
}

// --- the page's one selection call ---------------------------------------------------------------

export interface SkincareContent {
  productTypes: readonly SkincareProductType[]
  routines: readonly SkincareRoutine[]
  tips: readonly SkincareTip[]
}

export interface SkincareView {
  routines: SkincareRoutine[]
  productTypes: SkincareProductType[]
  /** Input order kept (the seed groups tips by audience, which reads well). */
  tips: SkincareTip[]
}

export function selectContent(content: SkincareContent, s: SkincareSelection): SkincareView {
  return {
    routines: sortRoutines(content.routines.filter((r) => matchesRoutine(r, s))),
    productTypes: sortProductTypes(content.productTypes.filter((p) => matchesProductType(p, s))),
    tips: content.tips.filter((tip) => matchesTip(tip, s)),
  }
}

// --- steps ---------------------------------------------------------------------------------------

export interface ResolvedStep {
  step: SkincareRoutineStepSeed
  /** null when no visible product type has the step's slug (pending / hidden). */
  type: SkincareProductType | null
}

/** A routine's steps in `order`, each with its product type resolved by slug (or null). */
export function resolveSteps(
  routine: SkincareRoutine,
  types: readonly SkincareProductType[],
): ResolvedStep[] {
  const bySlug = new Map(types.map((type) => [type.slug, type]))
  return [...routine.steps]
    .sort((a, b) => a.order - b.order)
    .map((step) => ({ step, type: bySlug.get(step.product_type_slug) ?? null }))
}

/** The hostname of a source URL for link text (`www.` dropped); a non-URL citation is returned as is. */
export function sourceLabel(source: string): string {
  try {
    return new URL(source).hostname.replace(/^www\./, '')
  } catch {
    return source
  }
}

export function isUrl(source: string): boolean {
  return /^https?:\/\//.test(source)
}
