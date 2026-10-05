// FRIDGE STORAGE — pure codec for the `hygieia.fridge` localStorage key (PLAN.md §P3.4). What the
// user has in the fridge and whether pantry staples are ignored, persisted locally so a reload
// restores the chips. No React, no I/O of its own: the `load`/`save` helpers take a `Storage`-like
// object and swallow every failure (private mode, quota, disabled storage) — the UI never sees a
// throw from here, only the default state.
//
// Wire shape (versioned so a future change can migrate instead of discarding):
//   { "v": 1, "slugs": ["tomato", "feta"], "ignoreStaples": true }
//
// Parse is lenient on purpose: junk JSON, a wrong shape, a non-string or duplicate slug, an
// unknown version — each degrades to the default or is dropped, never thrown.

export const FRIDGE_STORAGE_KEY = 'hygieia.fridge'

/** Bump when the wire shape changes; `parseFridgeState` then needs a migration branch. */
export const FRIDGE_STATE_VERSION = 1

export interface FridgeState {
  /** Ingredient slugs the user has, unique, in insertion order. */
  slugs: string[]
  /** `MatchOptions.ignorePantryStaples` for the matcher. */
  ignoreStaples: boolean
}

/** A FRESH default each call, so callers may mutate what they get back. */
export function defaultFridgeState(): FridgeState {
  return { slugs: [], ignoreStaples: true }
}

interface StoredFridgeState extends FridgeState {
  v: typeof FRIDGE_STATE_VERSION
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Keep non-blank strings, trimmed, first occurrence wins. */
function cleanSlugs(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  for (const item of value) {
    if (typeof item !== 'string') continue
    const slug = item.trim()
    if (slug !== '') seen.add(slug)
  }
  return [...seen]
}

/**
 * Decode whatever came out of storage. `raw` may be the JSON string from `getItem`, `null`
 * (nothing stored), or an already-parsed value. Never throws: anything unusable yields the
 * default; a recognisable object has each field validated independently.
 */
export function parseFridgeState(raw: unknown): FridgeState {
  let value: unknown = raw
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw)
    } catch {
      return defaultFridgeState()
    }
  }
  if (!isRecord(value)) return defaultFridgeState()
  if (value.v !== FRIDGE_STATE_VERSION) return defaultFridgeState()

  const fallback = defaultFridgeState()
  return {
    slugs: cleanSlugs(value.slugs),
    ignoreStaples:
      typeof value.ignoreStaples === 'boolean' ? value.ignoreStaples : fallback.ignoreStaples,
  }
}

/** Encode for storage; the output always parses back to an equal state (slugs deduped). */
export function serializeFridgeState(state: FridgeState): string {
  const stored: StoredFridgeState = {
    v: FRIDGE_STATE_VERSION,
    slugs: cleanSlugs(state.slugs),
    ignoreStaples: state.ignoreStaples,
  }
  return JSON.stringify(stored)
}

/** Read and decode; a throwing or empty storage yields the default. */
export function loadFridgeState(storage: Pick<Storage, 'getItem'>): FridgeState {
  try {
    return parseFridgeState(storage.getItem(FRIDGE_STORAGE_KEY))
  } catch {
    return defaultFridgeState()
  }
}

/** Encode and write; returns `false` (and nothing else) when the storage throws. */
export function saveFridgeState(storage: Pick<Storage, 'setItem'>, state: FridgeState): boolean {
  try {
    storage.setItem(FRIDGE_STORAGE_KEY, serializeFridgeState(state))
    return true
  } catch {
    return false
  }
}
