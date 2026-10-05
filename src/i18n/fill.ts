// fill(): substitute `{name}` placeholders in a dictionary string. Minimal on purpose — Hygieia's
// strings carry at most a count or a name, never plural rules or nested templates. Unknown
// placeholders are left verbatim so a typo is visible in the UI rather than silently blank.

export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match: string, key: string) =>
    Object.hasOwn(vars, key) ? String(vars[key]) : match,
  )
}
