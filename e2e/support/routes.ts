/**
 * The shared route list (PLAN P5.2 / P5.3): the pages every per-route gate audits.
 *
 * `scripts/check-lighthouse.mjs` (`npm run check:lighthouse`) runs Lighthouse mobile on every entry
 * and P5.2's a11y matrix (`e2e/local/a11y-matrix.spec.ts`) visits every entry in `el` and `en`, so a
 * route added here is covered by both gates at once; a route missing here is covered by neither.
 * A route added to src/routes/routes.tsx MUST be added here too (CLAUDE.project.md §11).
 *
 * - `path` is the FULL path including the Pages project base `/hygieia` (Vite `base`), because
 *   `page.goto('/x')` resolves against the ORIGIN, not the base (see playwright.config.ts).
 * - `name` is a short kebab-case label: the Lighthouse report file name (`lighthouse-report/<name>.html`)
 *   and the table row label.
 * - `h1` is the page's H1 text for a language, read from the dictionary (list/shell pages) or the
 *   bundled seed (detail pages) — never a literal, so a copy change cannot leave a stale value here.
 * - `ready` (optional) is a CSS selector that exists only once the page's async read has SETTLED
 *   (the list, the results section, the session card). The a11y matrix waits for it before the axe
 *   scan, so the audit sees the real page, not the one-line loading state. Pages whose content is
 *   synchronous (auth, not-found) need none: the H1 is the ready signal.
 *
 * Detail pages use a representative BUNDLED slug (src/content/seed/**): the audits run on the
 * local-only build, so the slug must exist in the seed. `/account` and `/admin` render the
 * sign-in-unavailable state in local-only mode; `not-found` is the `*` route. `/auth/callback` is
 * deliberately absent: it only ever follows a Supabase redirect and times out to its failure copy.
 *
 * This file is imported by node (`check-lighthouse.mjs`, type-stripping): erasable syntax only,
 * explicit `.ts` extensions, no React, no `import.meta.env` (PLAN §4).
 */
import { DIETS } from '../../src/content/seed/diets.ts'
import { RECIPES } from '../../src/content/seed/recipes.ts'
import type { Dictionary, Lang } from '../../src/i18n/dictionary.ts'

export type AuditRoute = {
  readonly path: string
  readonly name: string
  readonly h1: (t: Dictionary, lang: Lang) => string
  readonly ready?: string
}

/** The Pages project base every `path` starts with. */
export const ROUTE_BASE = '/hygieia'

const RECIPE_SLUG = 'carnivore-bacon-and-eggs'
const DIET_SLUG = 'keto'

function seedRow<T extends { slug: string }>(rows: readonly T[], slug: string, table: string): T {
  const row = rows.find((r) => r.slug === slug)
  if (!row) throw new Error(`routes.ts: ${table} seed has no slug ${JSON.stringify(slug)}`)
  return row
}

const RECIPE = seedRow(RECIPES, RECIPE_SLUG, 'recipes')
const DIET = seedRow(DIETS, DIET_SLUG, 'diets')

export const ROUTES: readonly AuditRoute[] = [
  {
    path: '/hygieia/',
    name: 'home',
    h1: (t) => t.heroTitle,
    ready: 'section[aria-label="modules"]',
  },
  { path: '/hygieia/recipes', name: 'recipes', h1: (t) => t.recipesTitle, ready: 'main ul li' },
  {
    path: `/hygieia/recipes/${RECIPE_SLUG}`,
    name: 'recipe',
    h1: (_t, lang) => (lang === 'el' ? RECIPE.title_el : RECIPE.title_en),
    ready: '#recipe-steps',
  },
  { path: '/hygieia/fridge', name: 'fridge', h1: (t) => t.fridgeTitle, ready: '#fridge-results' },
  { path: '/hygieia/diets', name: 'diets', h1: (t) => t.dietsTitle, ready: 'main ul li' },
  {
    path: `/hygieia/diets/${DIET_SLUG}`,
    name: 'diet',
    h1: (_t, lang) => (lang === 'el' ? DIET.name_el : DIET.name_en),
    ready: '#diet-recipes',
  },
  {
    path: '/hygieia/workouts',
    name: 'workouts',
    h1: (t) => t.workoutsTitle,
    ready: '#session-title',
  },
  {
    path: '/hygieia/tips',
    name: 'tips',
    h1: (t) => t.tipsTitle,
    ready: 'main section[aria-labelledby^="topic-"]',
  },
  { path: '/hygieia/auth', name: 'auth', h1: (t) => t.signInUnavailableTitle },
  { path: '/hygieia/account', name: 'account', h1: (t) => t.signInUnavailableTitle },
  { path: '/hygieia/admin', name: 'admin', h1: (t) => t.signInUnavailableTitle },
  { path: '/hygieia/no/such/page', name: 'not-found', h1: (t) => t.notFoundTitle },
]
