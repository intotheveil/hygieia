// TEMPLATE FILL — the one way a dictionary string takes a value (`'{n} recipes'` → `'12 recipes'`).
// Dictionary entries stay plain strings (ADR-0002: both languages are literals the type checks),
// so interpolation lives here, not in the dictionary. Plural forms are `{ one, other }` — the
// CLDR category set for BOTH Greek and English, so one rule serves both languages.

export interface PluralForms {
  /** Used for exactly 1 (and, for quantities, anything below 1: "½ piece"). */
  one: string
  other: string
}

const PLACEHOLDER = /\{(\w+)\}/g

/**
 * Replace every `{name}` in `template` with `String(vars[name])`. A placeholder with no value is
 * left as written (so a missing variable is visible on screen, not silently blanked). Never throws.
 */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(PLACEHOLDER, (match: string, key: string) =>
    Object.hasOwn(vars, key) ? String(vars[key]) : match,
  )
}

/** The plural form for `n`: `one` when `0 < n <= 1`, `other` otherwise (0, negatives, 1.5, 2…). */
export function pluralForm(forms: PluralForms, n: number): string {
  return n > 0 && n <= 1 ? forms.one : forms.other
}

/** `pluralForm` + `fill` with `{n}` as the formatted count (`display` defaults to `String(n)`). */
export function plural(forms: PluralForms, n: number, display: string = String(n)): string {
  return fill(pluralForm(forms, n), { n: display })
}
