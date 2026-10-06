import { DEFAULT_THEME, THEMES, initialTheme, toTheme } from './themes'

// The CSS ↔ THEME_COLOR pins (and the index.html pre-paint script check) live in
// scripts/theme-css.test.ts: they read files from disk with node APIs, which this browser-typed tree
// does not have, and importing `index.css?raw` here does not work either (under vitest the Tailwind
// plugin still transforms the import and the `@theme` block is gone).

describe('themes (pure)', () => {
  it('lists the six themes with the kitchen look first and as the default', () => {
    expect(THEMES).toEqual(['default', 'dark', 'athletic', 'gamer', 'rose', 'lavender'])
    expect(DEFAULT_THEME).toBe('default')
  })

  it('narrows junk to null and a theme name to itself', () => {
    for (const theme of THEMES) expect(toTheme(theme)).toBe(theme)
    expect(toTheme('')).toBeNull()
    expect(toTheme('Dark')).toBeNull()
    expect(toTheme('light')).toBeNull()
    expect(toTheme(42)).toBeNull()
    expect(toTheme(null)).toBeNull()
  })

  it('a stored choice always wins, the OS preference only when nothing usable is stored', () => {
    expect(initialTheme('athletic', true)).toBe('athletic')
    expect(initialTheme('default', true)).toBe('default')
    expect(initialTheme('gamer', false)).toBe('gamer')
    // The two light skins added later: a stored choice beats a dark OS preference too.
    expect(initialTheme('rose', true)).toBe('rose')
    expect(initialTheme('lavender', true)).toBe('lavender')
    expect(toTheme('Rose')).toBeNull()
    expect(initialTheme(null, true)).toBe('dark')
    expect(initialTheme(null, false)).toBe('default')
    expect(initialTheme('light', true)).toBe('dark')
    expect(initialTheme('light', false)).toBe('default')
  })
})
