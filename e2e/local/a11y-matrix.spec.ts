import AxeBuilder from '@axe-core/playwright'
import { LANGS, dictionaries } from '../../src/i18n/dictionary'
import { THEMES, THEME_COLOR, THEME_STORAGE_KEY } from '../../src/theme/themes'
import { expect, test } from '../support/fixtures'
import { ROUTES } from '../support/routes'

// THE A11Y MATRIX (PLAN P5.2): every route in e2e/support/routes.ts × both languages, on the
// PRODUCTION build served with Pages semantics (a deep link is a 404 DOCUMENT — assertions are on
// the rendered app, PLAN §4). Per cell:
//
//   1. `<html lang>` equals the chosen language (LangProvider follows the switch).
//   2. The H1 equals the dictionary / seed value for that route and language (`route.h1`), which
//      also proves every route renders in BOTH languages (P5.5 leans on this).
//   3. axe-core (WCAG 2.0/2.1 A + AA tags) reports ZERO `serious` / `critical` violations.
//      `moderate` / `minor` findings are printed as a table in the test output and do NOT fail the
//      cell (DECISIONS.md 2026-10-06): they are tracked, not gated.
//
// Language selection: the preference is written to localStorage (`hygieia.lang`) BEFORE the page
// script runs (`context.addInitScript`), so the page boots in the chosen language and the audit sees
// the first paint of that language — the same path a returning visitor takes. The toggle button
// itself is proven by smoke.spec.ts; clicking it here would audit a post-switch DOM instead.
//
// Ready signal: the H1 text, then `route.ready` (a selector that exists only once the page's async
// read has SETTLED) so axe scans the loaded page, not the loading line.

// Mirrors `LANG_STORAGE_KEY` in src/i18n/LangProvider.tsx (a .tsx import is not allowed by
// e2e/support/tsconfig.json). If the key ever drifts, every `en` cell fails on `<html lang>`.
const LANG_STORAGE_KEY = 'hygieia.lang'

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] as const
const GATED = new Set(['serious', 'critical'])

type Violation = Awaited<ReturnType<AxeBuilder['analyze']>>['violations'][number]

function describe(v: Violation): string {
  const targets = v.nodes
    .slice(0, 3)
    .map((n) => n.target.join(' '))
    .join(' | ')
  const more = v.nodes.length > 3 ? ` (+${v.nodes.length - 3} more)` : ''
  return `${v.id} [${v.impact ?? 'n/a'}] ×${v.nodes.length}: ${v.help} — ${targets}${more}`
}

function table(rows: readonly Violation[]): string {
  const cells = rows.map((v) => [v.id, v.impact ?? 'n/a', String(v.nodes.length), v.help])
  const widths = [0, 1, 2].map((i) => Math.max(...cells.map((c) => c[i]!.length)))
  return cells
    .map(
      (c) =>
        `${c[0]!.padEnd(widths[0]!)}  ${c[1]!.padEnd(widths[1]!)}  ${c[2]!.padStart(widths[2]!)}  ${c[3]}`,
    )
    .join('\n')
}

for (const lang of LANGS) {
  test.describe(`lang=${lang}`, () => {
    test.beforeEach(async ({ context }) => {
      await context.addInitScript(
        ([key, value]) => {
          window.localStorage.setItem(key, value)
        },
        [LANG_STORAGE_KEY, lang] as const,
      )
    })

    for (const route of ROUTES) {
      test(`${route.name} (${route.path}) renders the ${lang} H1 and has no serious/critical axe violations`, async ({
        page,
      }, testInfo) => {
        await page.goto(route.path)

        const t = dictionaries[lang]
        await expect(page.locator('html')).toHaveAttribute('lang', lang)
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(route.h1(t, lang))
        if (route.ready) await expect(page.locator(route.ready).first()).toBeVisible()

        const results = await new AxeBuilder({ page }).withTags([...AXE_TAGS]).analyze()
        const gated = results.violations.filter((v) => GATED.has(v.impact ?? ''))
        const reported = results.violations.filter((v) => !GATED.has(v.impact ?? ''))

        const header = `axe ${route.name} [${lang}] ${route.path}`
        if (reported.length > 0) {
          console.log(`${header} — moderate/minor (reported, not gated):\n${table(reported)}`)
        } else {
          console.log(`${header} — no moderate/minor findings`)
        }
        await testInfo.attach(`axe-${route.name}-${lang}.json`, {
          body: JSON.stringify(results.violations, null, 2),
          contentType: 'application/json',
        })

        expect(gated.map(describe), `serious/critical axe violations on ${header}`).toEqual([])
      })
    }
  })
}

// THE THEME AXIS (operator request 2026-10-06): the four cosmetic themes (src/theme) on the two
// routes that exercise the most colour pairs — the home (hero, module cards, status box) and the
// recipe list (cards, chips, accent text) — in Greek (the default language; the themes change
// colours only, so the language axis above is not repeated). Per cell:
//
//   1. The theme is written to localStorage (`THEME_STORAGE_KEY`) BEFORE the page script runs, so
//      the pre-paint script in index.html applies it and the audit sees the first paint of that
//      theme — the returning-visitor path.
//   2. `<html data-theme>` equals the theme and `<body>`'s computed background is that theme's
//      `paper-100` (`THEME_COLOR`), which proves the CSS re-map took effect before axe measured.
//   3. axe reports ZERO violations of ANY impact. Themes must not introduce so much as a `moderate`
//      finding, and `color-contrast` in particular must be clean on every skin.
const THEME_ROUTES = ROUTES.filter((r) => r.name === 'home' || r.name === 'recipes')

/** `#rrggbb` → the `rgb(r, g, b)` string `getComputedStyle` returns. */
function rgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`
}

for (const theme of THEMES) {
  test.describe(`theme=${theme}`, () => {
    test.beforeEach(async ({ context }) => {
      await context.addInitScript(
        ([key, value]) => {
          window.localStorage.setItem(key, value)
        },
        [THEME_STORAGE_KEY, theme] as const,
      )
    })

    for (const route of THEME_ROUTES) {
      test(`${route.name} (${route.path}) paints the ${theme} theme and has zero axe violations`, async ({
        page,
      }, testInfo) => {
        await page.goto(route.path)

        const t = dictionaries.el
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(route.h1(t, 'el'))
        if (route.ready) await expect(page.locator(route.ready).first()).toBeVisible()
        await expect(page.locator('body')).toHaveCSS('background-color', rgb(THEME_COLOR[theme]))
        await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
          'content',
          THEME_COLOR[theme],
        )
        await expect(page.getByRole('combobox', { name: t.theme.label })).toHaveValue(theme)

        const results = await new AxeBuilder({ page }).withTags([...AXE_TAGS]).analyze()
        await testInfo.attach(`axe-${route.name}-theme-${theme}.json`, {
          body: JSON.stringify(results.violations, null, 2),
          contentType: 'application/json',
        })
        const contrast = results.violations.filter((v) => v.id === 'color-contrast')
        expect(contrast.map(describe), `color-contrast on ${route.name} [${theme}]`).toEqual([])
        expect(
          results.violations.map(describe),
          `any axe violation on ${route.name} [${theme}]`,
        ).toEqual([])
      })
    }
  })
}
