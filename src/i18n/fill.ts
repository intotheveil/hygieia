// TEMPLATE FILL — the one way a dictionary string takes a value: `fill('{have}/{total}', { have: 5,
// total: 6 })` → `'5/6'`. Tokens are `{name}` (word characters). A token with no value in `vars`
// is left as written, so a missing variable is VISIBLE in the UI rather than silently blank.
// Deliberately tiny: no plurals, no formatting — the dictionary carries both languages' phrasing.

export type FillVars = Readonly<Record<string, string | number>>

export function fill(template: string, vars: FillVars): string {
  return template.replace(/\{(\w+)\}/g, (token, name: string) =>
    Object.hasOwn(vars, name) ? String(vars[name]) : token,
  )
}
