// THEME CSS PINS (operator request 2026-10-06). src/index.css is the source of truth for the four
// cosmetic themes; src/theme/themes.ts and the pre-paint script in index.html MIRROR two facts from
// it (each theme's `--color-paper-100`, the storage key + theme names). These tests pin the mirrors
// so they cannot drift. They live under scripts/ because they read files from disk: the browser-typed
// src/ tree has no node types, and importing `index.css?raw` under vitest does not work either (the
// Tailwind plugin still transforms the import and the `@theme` block is gone from the result).
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { THEMES, THEME_COLOR, THEME_STORAGE_KEY } from '../src/theme/themes'

const root = resolve(import.meta.dirname, '..')
const css = readFileSync(resolve(root, 'src/index.css'), 'utf8')
const html = readFileSync(resolve(root, 'index.html'), 'utf8')

/** `--color-<token>` as declared inside a CSS block, in source order. */
function declared(block: string, token: string): string | undefined {
  return new RegExp(`--color-${token}:\\s*(#[0-9a-f]{6})`, 'i').exec(block)?.[1]?.toLowerCase()
}
function themeBlock(theme: string): string {
  const m = new RegExp(`html\\[data-theme='${theme}'\\]\\s*\\{([^}]*)\\}`).exec(css)
  if (!m) throw new Error(`no html[data-theme='${theme}'] block in src/index.css`)
  return m[1]!
}
const baseTheme = (() => {
  // `\r?` — a Windows checkout with autocrlf hands this test CRLF text (BRAIN §5).
  const m = /@theme\s*\{([\s\S]*?)\r?\n\}/.exec(css)
  if (!m) throw new Error('no @theme block in src/index.css')
  return m[1]!
})()

describe('themes ↔ src/index.css (the CSS is the source of truth; these pin the mirrors)', () => {
  it('THEME_COLOR is each theme’s --color-paper-100 (the <meta theme-color> surface)', () => {
    expect(declared(baseTheme, 'paper-100')).toBe(THEME_COLOR.default)
    for (const theme of THEMES) {
      if (theme === 'default') continue
      expect(declared(themeBlock(theme), 'paper-100'), theme).toBe(THEME_COLOR[theme])
    }
  })

  it('every non-default theme re-maps the SAME variable names the base @theme declares, all of them', () => {
    const names = [...baseTheme.matchAll(/--color-((?:paper|olive|sage|clay)-\d+):/g)].map(
      (m) => m[1]!,
    )
    expect(names.length).toBeGreaterThanOrEqual(13)
    for (const theme of THEMES) {
      if (theme === 'default') continue
      const block = themeBlock(theme)
      const remapped = [...block.matchAll(/--color-([a-z]+-\d+):/g)].map((m) => m[1]!)
      expect(remapped.sort(), `${theme} re-maps exactly the base names`).toEqual([...names].sort())
    }
  })

  it('the dark skins declare color-scheme: dark, the light ones light', () => {
    expect(themeBlock('dark')).toMatch(/color-scheme:\s*dark/)
    expect(themeBlock('gamer')).toMatch(/color-scheme:\s*dark/)
    expect(themeBlock('athletic')).toMatch(/color-scheme:\s*light/)
    expect(themeBlock('rose')).toMatch(/color-scheme:\s*light/)
    expect(themeBlock('lavender')).toMatch(/color-scheme:\s*light/)
  })

  it('index.html’s pre-paint script reads the same storage key and knows every non-default theme', () => {
    expect(html).toContain(`localStorage.getItem('${THEME_STORAGE_KEY}')`)
    for (const theme of THEMES) {
      if (theme === 'default') continue
      expect(html, `pre-paint script accepts "${theme}"`).toContain(`t === '${theme}'`)
    }
    expect(html).toContain("matchMedia('(prefers-color-scheme: dark)')")
  })

  it('every theme has a complete hero image set in public/brand', () => {
    for (const theme of THEMES) {
      const stem = theme === 'default' ? 'hero-plate' : `hero-${theme}`
      for (const suffix of ['.jpg', '-sm.jpg', '-800.webp', '-1216.webp']) {
        expect(
          () => readFileSync(resolve(root, 'public/brand', stem + suffix)),
          stem + suffix,
        ).not.toThrow()
      }
    }
  })
})
