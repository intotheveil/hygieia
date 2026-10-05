import { Route, Routes } from 'react-router-dom'
import { AccountPage } from '../account/AccountPage'
import { AdminPage } from '../admin/AdminPage'
import App from '../App'
import { CallbackPage } from '../auth/CallbackPage'
import { RequireAdmin } from '../auth/RequireAdmin'
import { RequireAuth } from '../auth/RequireAuth'
import { SignInPage } from '../auth/SignInPage'
import { Layout } from '../components/Layout'
import { DietPage } from '../diets/DietPage'
import { DietsPage } from '../diets/DietsPage'
import { FridgePage } from '../fridge/FridgePage'
import { RecipePage } from '../recipes/RecipePage'
import { RecipesPage } from '../recipes/RecipesPage'
import { TipsPage } from '../tips/TipsPage'
import { WorkoutsPage } from '../workouts/WorkoutsPage'
import { NotFound } from './NotFound'

// NotFound lives in ./NotFound.tsx (pages import it from there without pulling in this table);
// re-exported so `import { NotFound } from '../routes/routes'` keeps working.
export { NotFound }

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
        <Route path="/tips" element={<TipsPage />} />
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
