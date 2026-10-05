// BILINGUAL TEST HELPERS — pure functions shared by `src/i18n/dictionary.test.ts` and every seed
// test under `src/content/seed/*.test.ts` (PLAN.md P5.5, §0 bilingual rule, ADR-0002).
//
// Nothing here imports vitest or React: the helpers are plain predicates over strings and plain
// objects, so a test can combine them with its own allow-lists and failure messages. They are
// NOT imported by application code and never reach the bundle.

/** One code point of Greek script anywhere in the string. */
export const GREEK_SCRIPT = /\p{Script=Greek}/u

/**
 * Substrings that mark drafting leftovers rather than copy. Matched case-insensitively, so
 * `todo`, `Lorem`, `PLACEHOLDER` and `Xxx` all count.
 */
export const PLACEHOLDER_MARKERS: readonly string[] = [
  'TODO',
  '???',
  'xxx',
  'lorem',
  'placeholder',
  'FIXME',
]

/** `[dottedPath, value]` for every string reachable from `obj` through objects and arrays. */
export type Leaf = readonly [path: string, value: string]

/**
 * Every string leaf of a nested plain object/array, depth-first in insertion order, each with its
 * dotted path (`modules.tips.title`, `steps_el.2`). Non-string primitives (numbers, booleans,
 * null, undefined) are skipped, so a seed row can be passed whole.
 */
export function leaves(obj: unknown, path = ''): Leaf[] {
  if (typeof obj === 'string') return [[path, obj]]
  if (obj === null || typeof obj !== 'object') return []
  const join = (key: string) => (path ? `${path}.${key}` : key)
  if (Array.isArray(obj)) {
    return obj.flatMap((value, index) => leaves(value, join(String(index))))
  }
  return Object.entries(obj).flatMap(([key, value]) => leaves(value, join(key)))
}

/** True when the string contains at least one Greek-script code point. */
export function hasGreek(s: string): boolean {
  return GREEK_SCRIPT.test(s)
}

const normalize = (s: string) => s.trim().toLowerCase()

/**
 * True when the Greek value is the English value repeated — the signature of a translation that
 * was never written — and the English value is NOT one of the allowed brand names / loanwords
 * (compared trimmed and case-insensitively, so `Keto` matches an allow-list entry `keto`).
 * Two blank strings do not count: blankness is a separate rule with its own assertion.
 */
export function looksUntranslated(el: string, en: string, allow: readonly string[] = []): boolean {
  const normEl = normalize(el)
  const normEn = normalize(en)
  if (normEl === '' || normEl !== normEn) return false
  return !allow.some((word) => normalize(word) === normEn)
}

/** True when any `PLACEHOLDER_MARKERS` entry appears in the string (case-insensitive). */
export function containsPlaceholderMarkers(s: string): boolean {
  const lower = s.toLowerCase()
  return PLACEHOLDER_MARKERS.some((marker) => lower.includes(marker.toLowerCase()))
}
