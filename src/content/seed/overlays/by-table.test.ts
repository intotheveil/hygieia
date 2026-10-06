// PER-TABLE OVERLAY INDEXES (./by-table/, perf 2026-10-06). The bundled source loads each seed table
// with ITS overlay index, not the full list, so a page downloads only the overlay rows of the tables
// it reads. What is proven here:
//   * there is exactly one index per SeedBase key, and each holds exactly the slices of every overlay
//     in ./index.ts for that key's tables (SEED_OVERLAY_TABLES), in order, sharing the same row
//     arrays — forgetting to register an overlay, or registering the wrong table, is red;
//   * applying an index to its base table gives exactly what applying the full list gives;
//   * the IMPORT RULE that makes the split real in the bundle (rolldown assigns whole modules to
//     chunks): an index imports only ../types.ts, ../apply.ts, per-loader part modules
//     ../NNNN-<name>/<key>.ts of its own key, or a whole ../NNNN-<name>.ts that touches nothing but
//     its own tables; part modules import types only (no other part, no overlay data);
//   * sliceOverlay / sliceOverlays: the pure slicer the rule is checked against.

import { describe, expect, it } from 'vitest'
import { DIETS } from '../diets.ts'
import { EXERCISES } from '../exercises.ts'
import { INGREDIENTS } from '../ingredients.ts'
import { RECIPES } from '../recipes.ts'
import { SKINCARE_PRODUCT_TYPES, SKINCARE_ROUTINES, SKINCARE_TIPS } from '../skincare.ts'
import { HEALTH_TIPS } from '../tips.ts'
import { WORKOUT_TEMPLATES } from '../workouts.ts'
import { overlayTable, sliceOverlay, sliceOverlays } from './apply.ts'
import { OVERLAYS } from './index.ts'
import {
  OVERLAY_TABLES,
  SEED_OVERLAY_TABLES,
  type Overlay,
  type OverlaySlice,
  type OverlayTable,
  type SeedBase,
} from './types.ts'

type Key = keyof SeedBase
interface IndexModule {
  OVERLAYS: readonly OverlaySlice[]
  overlayTable: typeof overlayTable
}

const KEYS = Object.keys(SEED_OVERLAY_TABLES) as Key[]
const BASE: SeedBase = {
  ingredients: INGREDIENTS,
  diets: DIETS,
  recipes: RECIPES,
  exercises: EXERCISES,
  workout_templates: WORKOUT_TEMPLATES,
  health_tips: HEALTH_TIPS,
  skincare_product_types: SKINCARE_PRODUCT_TYPES,
  skincare_routines: SKINCARE_ROUTINES,
  skincare_tips: SKINCARE_TIPS,
}

const keyOf = (path: string): string => (/([^/]+)\.ts$/.exec(path) as RegExpExecArray)[1] as string
const INDEXES: Record<string, IndexModule> = Object.fromEntries(
  Object.entries(import.meta.glob<IndexModule>('./by-table/*.ts', { eager: true })).map(
    ([path, mod]) => [keyOf(path), mod],
  ),
)
const INDEX_SOURCES: Record<string, string> = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>('./by-table/*.ts', { eager: true, query: '?raw', import: 'default' }),
  ).map(([path, src]) => [keyOf(path), src]),
)
const PART_SOURCES: Record<string, string> = import.meta.glob<string>(
  './[0-9][0-9][0-9][0-9]-*/*.ts',
  {
    eager: true,
    query: '?raw',
    import: 'default',
  },
)

/** Every `from '…'` specifier of a module source, with whether it is an `import type`. */
function importsOf(src: string): { spec: string; typeOnly: boolean }[] {
  const out: { spec: string; typeOnly: boolean }[] = []
  for (const m of src.matchAll(/^(import|export)\s+(type\s+)?[^;]*?from\s+'([^']+)'/gms))
    out.push({ spec: m[3] as string, typeOnly: m[1] === 'import' && m[2] !== undefined })
  return out
}

/** The tables an overlay touches (patches or additions). */
function tablesOf(o: Overlay): OverlayTable[] {
  return OVERLAY_TABLES.filter(
    (t) =>
      ((o.patches as Partial<Record<OverlayTable, readonly unknown[]>> | undefined)?.[t]?.length ??
        0) > 0 || (o.additions?.[t]?.length ?? 0) > 0,
  )
}

describe('per-table overlay indexes (./by-table/)', () => {
  it('exist exactly once per SeedBase key, and the key map covers every overlay table once', () => {
    expect(Object.keys(INDEXES).sort()).toEqual([...KEYS].sort())
    expect(KEYS.flatMap((k) => SEED_OVERLAY_TABLES[k]).sort()).toEqual([...OVERLAY_TABLES].sort())
  })

  it.each(KEYS)('%s holds exactly every overlay sliced to its tables, sharing the rows', (key) => {
    const mod = INDEXES[key] as IndexModule
    const expected = sliceOverlays(OVERLAYS, SEED_OVERLAY_TABLES[key])
    expect(mod.OVERLAYS).toEqual(expected)
    mod.OVERLAYS.forEach((slice, i) => {
      const want = expected[i] as OverlaySlice
      for (const part of ['patches', 'additions'] as const)
        for (const [table, rows] of Object.entries(want[part] ?? {}))
          expect((slice[part] as Record<string, unknown>)[table]).toBe(rows)
    })
    expect(mod.overlayTable).toBe(overlayTable)
  })

  it.each(KEYS)('%s applied to its base table equals the full overlay list applied', (key) => {
    const mod = INDEXES[key] as IndexModule
    expect(overlayTable(key, BASE[key], mod.OVERLAYS)).toEqual(
      overlayTable(key, BASE[key], OVERLAYS),
    )
  })

  it('the real overlays reach the tables they target through the indexes', () => {
    expect((INDEXES.recipes as IndexModule).OVERLAYS.map((o) => o.id)).toContain(
      '0003-greek-kitchen',
    )
    expect((INDEXES.health_tips as IndexModule).OVERLAYS.map((o) => o.id)).toEqual(
      OVERLAYS.filter((o) => tablesOf(o).includes('health_tips')).map((o) => o.id),
    )
    expect((INDEXES.exercises as IndexModule).OVERLAYS).toEqual([])
  })

  it.each(KEYS)('%s imports only its own overlay rows (the bundle-split rule)', (key) => {
    const own: readonly OverlayTable[] = SEED_OVERLAY_TABLES[key]
    const byId = new Map(OVERLAYS.map((o) => [o.id, o]))
    for (const { spec } of importsOf(INDEX_SOURCES[key] as string)) {
      if (spec === '../types.ts' || spec === '../apply.ts') continue
      const part = /^\.\.\/(\d{4}-[a-z0-9-]+)\/([a-z_]+)\.ts$/.exec(spec)
      if (part) {
        expect(byId.has(part[1] as string), `${spec}: no such overlay`).toBe(true)
        expect(part[2], `${key} imports another loader's part ${spec}`).toBe(key)
        continue
      }
      const whole = /^\.\.\/(\d{4}-[a-z0-9-]+)\.ts$/.exec(spec)
      expect(whole, `${key} imports ${spec}: not a types/apply/part/overlay module`).not.toBeNull()
      const overlay = byId.get((whole as RegExpExecArray)[1] as string)
      expect(overlay, `${spec}: no such overlay`).toBeDefined()
      const foreign = tablesOf(overlay as Overlay).filter((t) => !own.includes(t))
      expect(
        foreign,
        `${key} imports ${spec} whole but it also carries ${foreign.join(', ')}`,
      ).toEqual([])
    }
  })

  it('part modules are named by loader key and import types only', () => {
    const paths = Object.keys(PART_SOURCES)
    expect(paths.length).toBeGreaterThan(0)
    for (const [path, src] of Object.entries(PART_SOURCES)) {
      expect(KEYS as string[], `${path}: not named after a by-table key`).toContain(keyOf(path))
      for (const imp of importsOf(src))
        expect(imp.typeOnly, `${path} has a value import from ${imp.spec}`).toBe(true)
    }
  })
})

describe('sliceOverlay / sliceOverlays', () => {
  const overlay: Overlay = {
    id: '0009-mixed',
    summary: 'x',
    patches: {
      health_tips: [{ slug: 'a', set: { title_en: 'A' } }],
      skincare_tips: [],
    },
    additions: { recipe_diets: [{ recipe_slug: 'r', diet_slug: 'vegan' }] },
  }

  it('keeps the id and only the asked tables, sharing the lists; drops the summary', () => {
    const s = sliceOverlay(overlay, ['health_tips']) as OverlaySlice
    expect(s).toEqual({ id: '0009-mixed', patches: { health_tips: overlay.patches?.health_tips } })
    expect(s.patches?.health_tips).toBe(overlay.patches?.health_tips)
    expect('additions' in s).toBe(false)
    expect('summary' in s).toBe(false)
    expect(sliceOverlay(overlay, ['recipes', 'recipe_diets'])).toEqual({
      id: '0009-mixed',
      additions: { recipe_diets: overlay.additions?.recipe_diets },
    })
  })

  it('is null for an overlay that touches none of the tables (an empty list counts as none)', () => {
    expect(sliceOverlay(overlay, ['skincare_tips'])).toBeNull()
    expect(sliceOverlay(overlay, ['exercises'])).toBeNull()
    expect(sliceOverlays([overlay, overlay], ['skincare_tips'])).toEqual([])
    expect(sliceOverlays([overlay], ['health_tips', 'recipe_diets'])).toHaveLength(1)
  })
})
