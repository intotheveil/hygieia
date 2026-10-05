// NOT FOUND (lifted out of routes.tsx in P3.5). On GitHub Pages every unknown URL is served
// dist/404.html (= index.html), so the `*` route renders this; RecipePage and DietPage render it
// for an unknown slug too. It lives in its own module so a page can import it WITHOUT importing
// the route table (routes.tsx imports every page → an import cycle). routes.tsx re-exports it.
// Renders inside Layout (header + footer around it), so no `min-h-dvh` of its own.

import { Link } from 'react-router-dom'
import { useLang } from '../i18n/LangProvider'

export function NotFound() {
  const { t } = useLang()
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
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
