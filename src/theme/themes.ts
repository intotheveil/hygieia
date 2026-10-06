// THEMES (operator request 2026-10-06): four COSMETIC skins. The current kitchen look is `default`;
// `dark`, `athletic` and `gamer` re-map the SAME colour variables (`--color-paper-*`, `--color-olive-*`,
// `--color-sage-*`, `--color-clay-*` in src/index.css) under `html[data-theme="…"]`, so every
// Tailwind utility the pages already use follows the theme and no component changes. Nothing
// here is React: e2e/local/a11y-matrix.spec.ts and the dictionary module import this file, and
// scripts/check-lighthouse.mjs reaches it through e2e/support/routes.ts under node type-stripping,
// so the syntax must stay erasable (no enums, explicit `.ts` extensions in importers).

export const THEMES = ['default', 'dark', 'athletic', 'gamer'] as const
export type Theme = (typeof THEMES)[number]

export const DEFAULT_THEME: Theme = 'default'

/** localStorage key for the chosen theme. Mirrored LITERALLY by the pre-paint script in index.html. */
export const THEME_STORAGE_KEY = 'hygieia:theme'

/**
 * Each theme's `--color-paper-100` (the page surface), used for `<meta name="theme-color">` at
 * runtime. Duplicated from src/index.css on purpose — jsdom cannot resolve a custom property from a
 * stylesheet — and pinned to the CSS by src/theme/themes.test.ts, so the two cannot drift.
 */
export const THEME_COLOR: Record<Theme, string> = {
  default: '#f6f3ea',
  dark: '#15181a',
  athletic: '#f4f6f8',
  gamer: '#0b0b12',
}

/** Narrow an unknown value to a supported theme, or null. */
export function toTheme(value: unknown): Theme | null {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value)
    ? (value as Theme)
    : null
}

/**
 * Pick the starting theme. Pure: takes the stored value and the OS preference as arguments so it
 * can be tested without touching globals. A stored choice ALWAYS wins (including an explicit
 * `default` on a dark-mode OS); only when nothing usable is stored does `prefers-color-scheme:
 * dark` pick `dark`. Never throws on junk input.
 */
export function initialTheme(stored: unknown, prefersDark: boolean): Theme {
  return toTheme(stored) ?? (prefersDark ? 'dark' : DEFAULT_THEME)
}
