// APPLY OVERLAYS — the pure function the bundled source and the seed generator share (see
// ./types.ts for the contract). `applyOverlays(base, overlays)` returns the seed as it is after
// base → overlay 1 → overlay 2 …, with the SAME semantics the generated migrations have in the DB:
//
//   * per overlay, every table's PATCHES run first (in OVERLAY_TABLES order), then every table's
//     ADDITIONS (same order) — exactly the statement order of the overlay's migration;
//   * a patch replaces only the columns in its `set` (copy-on-write: the row is a new object, the
//     base arrays are never mutated); its target must exist BEFORE this overlay (base or an earlier
//     overlay) — an unknown slug / natural key THROWS;
//   * `set` may hold only PATCH_COLUMNS[table] (never id, slug, status, the review stamp or a child
//     array) and must not be empty; anything else THROWS;
//   * an addition is appended; a slug that already exists (base, earlier overlay or earlier in the
//     same list) THROWS. A child addition (recipe line, diet tag, template slot) is appended to an
//     existing parent at position = current length; a duplicate diet tag THROWS;
//   * after each overlay the cross-column rules the seed tests pin still hold, or it THROWS:
//     health_tips `needs_source === (source_url === null)`, skincare_tips `needs_source ===
//     (sources.length === 0)`, recipe-line notes come as a pair.
//
// A table no overlay touches comes back as the SAME array (reference-equal), so a page whose table
// has no overlay pays nothing. A table absent from `base` is skipped (the bundled source loads one
// table at a time); overlays touching it are validated when that table is loaded, and in full by
// the generator and `overlays.test.ts`, which apply every overlay to every base table.
//
// Erasable syntax only, explicit `.ts` imports (node type stripping imports it from scripts/).

import {
  OVERLAY_ID_RE,
  OVERLAY_TABLES,
  PATCH_COLUMNS,
  type Overlay,
  type OverlayParentTable,
  type OverlayTable,
  type SeedBase,
} from './types.ts'

type Row = Record<string, unknown>
type State = Partial<Record<OverlayParentTable, Row[]>>

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** The parent table a child table's rows live in (nested in the seed shape), and the array key. */
const CHILD_OF: Partial<Record<OverlayTable, { parent: OverlayParentTable; key: string }>> = {
  recipe_ingredients: { parent: 'recipes', key: 'ingredients' },
  recipe_diets: { parent: 'recipes', key: 'diet_slugs' },
  workout_template_exercises: { parent: 'workout_templates', key: 'blocks' },
}
/** The field of a child addition / patch that names its parent's slug. */
const PARENT_SLUG_KEY: Partial<Record<OverlayTable, string>> = {
  recipe_ingredients: 'recipe_slug',
  recipe_diets: 'recipe_slug',
  workout_template_exercises: 'template_slug',
}

/** Throw with the overlay id and the row named, so a bad overlay is found at once. */
function fail(overlay: string, where: string, message: string): never {
  throw new Error(`overlay ${overlay}: ${where}: ${message}`)
}

/** Check overlay ids: well-formed, unique, strictly increasing NNNN. */
export function checkOverlayIds(overlays: readonly Overlay[]): void {
  let last = -1
  for (const o of overlays) {
    const m = OVERLAY_ID_RE.exec(o.id)
    if (!m) throw new Error(`overlay ${JSON.stringify(o.id)}: id must match NNNN-<slug>`)
    const n = Number(m[1])
    if (n <= last)
      throw new Error(`overlay ${o.id}: overlays must be listed in strictly increasing NNNN order`)
    last = n
  }
}

/** Validate a patch's `set`: non-empty, only editable columns, no undefined values. */
function checkSet(id: string, where: string, table: OverlayTable, set: unknown): Row {
  if (set === null || typeof set !== 'object' || Array.isArray(set))
    fail(id, where, '`set` must be an object')
  const allowed: readonly string[] = PATCH_COLUMNS[table]
  const entries = Object.entries(set)
  if (entries.length === 0) fail(id, where, '`set` is empty')
  for (const [col, value] of entries) {
    if (!allowed.includes(col))
      fail(id, where, `column "${col}" is not an editable content column of ${table}`)
    if (value === undefined) fail(id, where, `set.${col} is undefined`)
  }
  return set as Row
}

/** Copy-on-write access to one table of the state: the first write clones the array. */
function writer(state: State, touched: Set<OverlayParentTable>) {
  return (table: OverlayParentTable): Row[] | undefined => {
    const rows = state[table]
    if (rows === undefined) return undefined
    if (!touched.has(table)) {
      touched.add(table)
      state[table] = [...rows]
    }
    return state[table]
  }
}

function findBySlug(rows: readonly Row[], slug: unknown): number {
  return rows.findIndex((r) => r.slug === slug)
}

/** Patch one child (line / slot) of a parent row, copy-on-write. */
function patchChild(
  id: string,
  table: OverlayTable,
  rows: Row[],
  patch: Row,
  childKey: string,
): void {
  const parentKey = PARENT_SLUG_KEY[table] as string
  const parentSlug = patch[parentKey]
  const where = `patch ${table} ${String(parentSlug)}#${String(patch.position)}`
  const i = findBySlug(rows, parentSlug)
  if (i < 0) fail(id, where, `unknown ${parentKey} "${String(parentSlug)}"`)
  const parent = rows[i] as Row
  const children = parent[childKey] as readonly Row[]
  const pos = patch.position
  if (typeof pos !== 'number' || !Number.isInteger(pos) || pos < 0 || pos >= children.length)
    fail(id, where, `position must be an integer in [0, ${children.length})`)
  const set = checkSet(id, where, table, patch.set)
  const next = [...children]
  next[pos] = { ...(children[pos] as Row), ...set }
  rows[i] = { ...parent, [childKey]: next }
}

/** Append one child (line / tag / slot) to an existing parent row, copy-on-write. */
function addChild(id: string, table: OverlayTable, rows: Row[], addition: Row): void {
  const { key: childKey } = CHILD_OF[table] as { key: string }
  const parentKey = PARENT_SLUG_KEY[table] as string
  const parentSlug = addition[parentKey]
  const where = `add ${table} under ${String(parentSlug)}`
  const i = findBySlug(rows, parentSlug)
  if (i < 0) fail(id, where, `unknown ${parentKey} "${String(parentSlug)}"`)
  const parent = rows[i] as Row
  const children = parent[childKey] as readonly unknown[]
  let child: unknown
  if (table === 'recipe_diets') {
    const diet = addition.diet_slug
    if (typeof diet !== 'string' || !SLUG_RE.test(diet)) fail(id, where, 'malformed diet_slug')
    if (children.includes(diet)) fail(id, where, `duplicate diet tag "${diet}"`)
    child = diet
  } else {
    const { [parentKey]: _drop, ...rest } = addition
    void _drop
    child = rest
  }
  rows[i] = { ...parent, [childKey]: [...children, child] }
}

/** The cross-column rules of the seed tests, re-checked over the overlaid tables. */
function checkInvariants(id: string, state: State, touched: ReadonlySet<OverlayParentTable>): void {
  if (touched.has('health_tips'))
    for (const r of state.health_tips ?? [])
      if (r.needs_source !== (r.source_url === null))
        fail(id, `health_tips/${String(r.slug)}`, 'needs_source must equal (source_url === null)')
  if (touched.has('skincare_tips'))
    for (const r of state.skincare_tips ?? [])
      if (r.needs_source !== ((r.sources as readonly unknown[]).length === 0))
        fail(id, `skincare_tips/${String(r.slug)}`, 'needs_source must equal (sources is empty)')
  if (touched.has('recipes'))
    for (const r of state.recipes ?? [])
      (r.ingredients as readonly Row[]).forEach((l, i) => {
        if ((l.note_el === undefined) !== (l.note_en === undefined))
          fail(id, `recipes/${String(r.slug)} line ${i}`, 'note_el and note_en come as a pair')
      })
}

/** Apply ONE overlay to the state in place (the state's arrays are already private copies). */
function applyOne(overlay: Overlay, state: State, touched: Set<OverlayParentTable>): void {
  const id = overlay.id
  const write = writer(state, touched)
  const patches = (overlay.patches ?? {}) as Partial<Record<OverlayTable, readonly Row[]>>
  const additions = (overlay.additions ?? {}) as Partial<Record<OverlayTable, readonly Row[]>>
  for (const key of Object.keys(patches))
    if (!(OVERLAY_TABLES as readonly string[]).includes(key) || key === 'recipe_diets')
      fail(id, 'patches', `"${key}" is not a patchable table`)
  for (const key of Object.keys(additions))
    if (!(OVERLAY_TABLES as readonly string[]).includes(key))
      fail(id, 'additions', `"${key}" is not an overlay table`)

  for (const table of OVERLAY_TABLES) {
    const list = patches[table]
    if (!list || list.length === 0) continue
    const child = CHILD_OF[table]
    const rows = write(child ? child.parent : (table as OverlayParentTable))
    if (!rows) continue
    for (const patch of list) {
      if (child) {
        patchChild(id, table, rows, patch, child.key)
        continue
      }
      const where = `patch ${table}/${String(patch.slug)}`
      const i = findBySlug(rows, patch.slug)
      if (i < 0) fail(id, where, `unknown slug "${String(patch.slug)}"`)
      rows[i] = { ...(rows[i] as Row), ...checkSet(id, where, table, patch.set) }
    }
  }

  for (const table of OVERLAY_TABLES) {
    const list = additions[table]
    if (!list || list.length === 0) continue
    const child = CHILD_OF[table]
    const rows = write(child ? child.parent : (table as OverlayParentTable))
    if (!rows) continue
    for (const addition of list) {
      if (child) {
        addChild(id, table, rows, addition)
        continue
      }
      const where = `add ${table}/${String(addition.slug)}`
      if (typeof addition.slug !== 'string' || !SLUG_RE.test(addition.slug))
        fail(id, where, 'malformed slug')
      if (findBySlug(rows, addition.slug) >= 0)
        fail(id, where, `duplicate slug "${addition.slug}" (already in the seed or an overlay)`)
      if ('status' in addition || 'id' in addition)
        fail(id, where, 'an addition carries no id and no status (it enters pending)')
      rows.push(addition)
    }
  }
  checkInvariants(id, state, touched)
}

/**
 * The seed after every overlay, in order. Pure: `base` and its arrays are never mutated; a table no
 * overlay touches is returned as the same array. Throws on any invalid patch or addition.
 */
export function applyOverlays<B extends Partial<SeedBase>>(
  base: B,
  overlays: readonly Overlay[],
): B {
  checkOverlayIds(overlays)
  // reason: the seed tables are walked generically as loose rows; each keeps its own seed shape
  // (patches can only set that shape's editable columns, additions ARE that shape).
  const state = { ...base } as unknown as State
  const touched = new Set<OverlayParentTable>()
  for (const overlay of overlays) applyOne(overlay, state, touched)
  // reason: same keys as `base`, same row shapes (see above).
  return state as unknown as B
}

/** One table through every overlay — what the bundled source's per-table loaders call. */
export function overlayTable<K extends keyof SeedBase>(
  table: K,
  rows: SeedBase[K],
  overlays: readonly Overlay[],
): SeedBase[K] {
  // reason: a computed key of generic type K widens to an index signature; the object IS Pick<SeedBase, K>.
  const base = { [table]: rows } as unknown as Pick<SeedBase, K>
  return applyOverlays(base, overlays)[table]
}
