import { Link, Route, Routes } from 'react-router-dom'
import { AccountPage } from '../account/AccountPage'
import { AdminPage } from '../admin/AdminPage'
import App from '../App'
import { CallbackPage } from '../auth/CallbackPage'
import { RequireAdmin } from '../auth/RequireAdmin'
import { RequireAuth } from '../auth/RequireAuth'
import { SignInPage } from '../auth/SignInPage'
import { useLang } from '../i18n/LangProvider'

/**
 * The router basename for Vite's BASE_URL: '/hygieia' on the Pages project site, '/' if a custom
 * domain ever serves the root. React Router wants no trailing slash except for the root.
 */
export function basenameFrom(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, '')
  return trimmed === '' ? '/' : trimmed
}

export function NotFound() {
  const { t } = useLang()
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-display text-3xl font-semibold">{t.notFoundTitle}</h1>
      <p className="text-olive-700">{t.notFoundBody}</p>
      <Link
        to="/"
        className="rounded-full bg-olive-900 px-5 py-2 text-sm font-medium text-paper-50 hover:bg-olive-700"
      >
        {t.backHome}
      </Link>
    </main>
  )
}

// On GitHub Pages every unknown URL is served dist/404.html (= index.html), so without the `*`
// route a typo would render an empty page.
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
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
    </Routes>
  )
}
