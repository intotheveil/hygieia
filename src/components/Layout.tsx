// LAYOUT (P3.5): the frame every route renders in — SiteHeader, the page, the disclaimer footer.
// Used as a layout route in routes.tsx (`<Route element={<Layout />}>` → `<Outlet />`), so the
// header is on every page without each page knowing about it.
//
// The page, not Layout, owns the `<main>` landmark: every page already renders its own `<main>`
// (with its own max-width), and a second `<main>` here would be a duplicate landmark (an
// accessibility failure Lighthouse flags). The pages size their `<main>` with `min-h-dvh`; the
// `[&>main]:` variants below override that on the direct child so the SLOT, not the page, decides
// the height — and no page needs editing.
//
// The content slot is itself `min-h-dvh` (P5.3 perf follow-up, DECISIONS.md 2026-10-06): the
// footer starts BELOW the first viewport on every route. Before, a page's loading state (one line,
// or a skeleton shorter than the viewport) left the footer inside the first screen, and the real
// content then pushed it thousands of pixels down — one layout shift of 0.099 on every content
// route (recipes, recipe, diets, workouts, tips), a quarter of the Lighthouse performance score.
// On a short page (auth, not-found, the sign-in-unavailable account/admin) the disclaimer is
// reached by scrolling one screen; that is the accepted trade.
//
// `[&>main]:w-full` (same follow-up): a page's `<main>` is `mx-auto max-w-*`, and a flex item with
// auto horizontal margins SHRINKS TO ITS CONTENT instead of stretching. A loading state narrower
// than the loaded page (the `detail` skeleton's widest bone is `w-24`) therefore rendered `<main>`
// as a 128 px centred column that snapped to full width when the content arrived — a horizontal
// shift of 0.126 on /diets/:slug (measured with a layout-shift PerformanceObserver; the P5.1 lane
// had read it as a font swap). Full width keeps the box where it is; `max-w-*` still caps it.
//
// The ONE Suspense boundary (P5.3 follow-up): every page but the home is a lazy chunk
// (routes.tsx), and this is where the download is awaited, so the header and footer are painted
// at once and only the page slot shows the bilingual loading line. The fallback is a `<main>`
// like every page's, so the `[&>main]:` sizing applies to it too and the footer does not jump.

import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { useLang } from '../i18n/LangProvider'
import { SiteHeader } from './SiteHeader'

function PageLoading() {
  const { t } = useLang()
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl items-center justify-center px-4">
      <p role="status" className="text-olive-700">
        {t.loading}
      </p>
    </main>
  )
}

export function Layout() {
  const { t } = useLang()
  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-4 sm:px-6">
      <SiteHeader />
      <div className="flex min-h-dvh flex-1 flex-col [&>main]:min-h-0 [&>main]:w-full [&>main]:flex-1">
        <Suspense fallback={<PageLoading />}>
          <Outlet />
        </Suspense>
      </div>
      <footer className="border-t border-olive-900/10 py-6 text-xs leading-relaxed text-olive-700">
        <p>{t.notMedicalAdvice}</p>
      </footer>
    </div>
  )
}
