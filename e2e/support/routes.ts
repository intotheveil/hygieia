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
 *
 * Detail pages use a representative BUNDLED slug (src/content/seed/**): the audits run on the
 * local-only build, so the slug must exist in the seed. `/account` and `/admin` render the
 * sign-in-unavailable state in local-only mode; `not-found` is the `*` route. `/auth/callback` is
 * deliberately absent: it only ever follows a Supabase redirect and times out to its failure copy.
 */
export type AuditRoute = { readonly path: string; readonly name: string }

/** The Pages project base every `path` starts with. */
export const ROUTE_BASE = '/hygieia'

export const ROUTES: readonly AuditRoute[] = [
  { path: '/hygieia/', name: 'home' },
  { path: '/hygieia/recipes', name: 'recipes' },
  { path: '/hygieia/recipes/carnivore-bacon-and-eggs', name: 'recipe' },
  { path: '/hygieia/fridge', name: 'fridge' },
  { path: '/hygieia/diets', name: 'diets' },
  { path: '/hygieia/diets/keto', name: 'diet' },
  { path: '/hygieia/workouts', name: 'workouts' },
  { path: '/hygieia/tips', name: 'tips' },
  { path: '/hygieia/auth', name: 'auth' },
  { path: '/hygieia/account', name: 'account' },
  { path: '/hygieia/admin', name: 'admin' },
  { path: '/hygieia/no/such/page', name: 'not-found' },
]
