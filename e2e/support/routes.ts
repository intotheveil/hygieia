/**
 * The shared route list (PLAN P5.2 / P5.3): the pages every per-route gate audits.
 *
 * `scripts/check-lighthouse.mjs` (`npm run check:lighthouse`) runs Lighthouse mobile on every entry
 * and P5.2's a11y matrix (`e2e/local/a11y-matrix.spec.ts`) visits every entry in `el` and `en`, so a
 * route added here is covered by both gates at once; a route missing here is covered by neither.
 *
 * - `path` is the FULL path including the Pages project base `/hygieia` (Vite `base`), because
 *   `page.goto('/x')` resolves against the ORIGIN, not the base (see playwright.config.ts).
 * - `name` is a short kebab-case label: the Lighthouse report file name (`lighthouse-report/<name>.html`)
 *   and the table row label.
 *
 * Current entries are the P0/P2 shell. P3/P4 add `recipes`, `fridge`, `diets`, `workouts`, `tips`
 * (with a representative slug each for the detail pages) as those routes land.
 */
export type AuditRoute = { readonly path: string; readonly name: string }

/** The Pages project base every `path` starts with. */
export const ROUTE_BASE = '/hygieia'

export const ROUTES: readonly AuditRoute[] = [
  { path: '/hygieia/', name: 'home' },
  { path: '/hygieia/auth', name: 'auth' },
]
