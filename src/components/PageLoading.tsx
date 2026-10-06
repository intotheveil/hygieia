// The page-slot loading line (P5.3 follow-up): shown while a lazily-imported page chunk downloads —
// by `lazyPage` (routes/lazyPage.tsx) and by the Layout `<Suspense>` fallback. It is a `<main>`
// like every page's, so Layout's `[&>main]:` sizing applies and the footer does not jump.

import { useLang } from '../i18n/LangProvider'

export function PageLoading() {
  const { t } = useLang()
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl items-center justify-center px-4">
      <p role="status" className="text-olive-700">
        {t.loading}
      </p>
    </main>
  )
}
