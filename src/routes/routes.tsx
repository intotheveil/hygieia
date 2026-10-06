import { Route, Routes } from 'react-router-dom'
import App from '../App'
import { RequireAdmin } from '../auth/RequireAdmin'
import { RequireAuth } from '../auth/RequireAuth'
import { Layout } from '../components/Layout'
import { lazyPage } from './lazyPage'
import { NotFound } from './NotFound'

// NotFound lives in ./NotFound.tsx (pages import it from there without pulling in this table);
// re-exported so `import { NotFound } from '../routes/routes'` keeps working.
export { NotFound }

// ROUTE-LEVEL CODE SPLITTING (P5.3 performance follow-up). Every page but the home `App` is a
// lazy chunk: a static import table put all twelve pages — and, through `contentSource`,
// every seed table — into one 1.26 MB entry chunk, which is what held FCP at 3.5 s on every route.
// `/` stays eager so the home page's first paint pays no extra round trip; `NotFound` stays eager
// because it is tiny and the `*` route must render offline from the precached index.html alone;
// the guards stay eager so the local-only "sign-in unavailable" copy never waits on a chunk.
// The header and footer stay put while a page chunk downloads; the page slot shows the bilingual
// loading line. Since 2026-10-06 the pages are `lazyPage` (./lazyPage.tsx), not bare `React.lazy`:
// the same split, but the page is swapped in through state, without React 19's ~300 ms Suspense
// reveal throttle that held every lazy route on the loading line (CI Lighthouse diet 84). Layout's
// `<Suspense>` stays for lazyPage's failure path (a retried `React.lazy`).
//
// Deliberately NOT here: pre-warming a page's seed chunks from its lazy factory. Measured (BUILD_LOG
// P5.3 follow-up): the seed requests then start before the first paint and Lighthouse's slow-4G
// model charges them to FCP (+0.3 s on every content route) for a saving of one 2 kB hop — the
// page chunk is tiny, so there is almost nothing to overlap. The seeds load when the page asks.
const RecipesPage = lazyPage(() => import('../recipes/RecipesPage').then((m) => m.RecipesPage))
const RecipePage = lazyPage(() => import('../recipes/RecipePage').then((m) => m.RecipePage))
const FridgePage = lazyPage(() => import('../fridge/FridgePage').then((m) => m.FridgePage))
const DietsPage = lazyPage(() => import('../diets/DietsPage').then((m) => m.DietsPage))
const DietPage = lazyPage(() => import('../diets/DietPage').then((m) => m.DietPage))
const WorkoutsPage = lazyPage(() => import('../workouts/WorkoutsPage').then((m) => m.WorkoutsPage))
const PlansPage = lazyPage(() => import('../workouts/plans/PlansPage').then((m) => m.PlansPage))
const TipsPage = lazyPage(() => import('../tips/TipsPage').then((m) => m.TipsPage))
const SkincarePage = lazyPage(() => import('../skincare/SkincarePage').then((m) => m.SkincarePage))
const SignInPage = lazyPage(() => import('../auth/SignInPage').then((m) => m.SignInPage))
const CallbackPage = lazyPage(() => import('../auth/CallbackPage').then((m) => m.CallbackPage))
const TasksPage = lazyPage(() => import('../tasks/TasksPage').then((m) => m.TasksPage))
const AccountPage = lazyPage(() => import('../account/AccountPage').then((m) => m.AccountPage))
const AdminPage = lazyPage(() => import('../admin/AdminPage').then((m) => m.AdminPage))
const ProfilePage = lazyPage(() => import('../profile/ProfilePage').then((m) => m.ProfilePage))

/**
 * The router basename for Vite's BASE_URL: '/hygieia' on the Pages project site, '/' if a custom
 * domain ever serves the root. React Router wants no trailing slash except for the root.
 */
export function basenameFrom(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, '')
  return trimmed === '' ? '/' : trimmed
}

// THE ROUTE TABLE (P3.5). Every route renders inside Layout (header + footer); a new route goes
// here AND in e2e/support/routes.ts so the Lighthouse / a11y matrices audit it. On GitHub Pages
// every unknown URL is served dist/404.html (= index.html), so without the `*` route a typo would
// render an empty page.
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<App />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/recipes/:slug" element={<RecipePage />} />
        <Route path="/fridge" element={<FridgePage />} />
        <Route path="/diets" element={<DietsPage />} />
        <Route path="/diets/:slug" element={<DietPage />} />
        <Route path="/workouts" element={<WorkoutsPage />} />
        <Route path="/workouts/plans" element={<PlansPage />} />
        <Route path="/tips" element={<TipsPage />} />
        <Route path="/skincare" element={<SkincarePage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/tasks/:topic" element={<TasksPage />} />
        <Route path="/auth" element={<SignInPage />} />
        <Route path="/auth/callback" element={<CallbackPage />} />
        <Route
          path="/account"
          element={
            <RequireAuth>
              <AccountPage />
            </RequireAuth>
          }
        />
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminPage />
            </RequireAdmin>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
