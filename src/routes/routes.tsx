import { Link, Route, Routes } from 'react-router-dom'
import App from '../App'
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
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
