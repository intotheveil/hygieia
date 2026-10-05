// LAYOUT (P3.5): the frame every route renders in — SiteHeader, the page, the disclaimer footer.
// Used as a layout route in routes.tsx (`<Route element={<Layout />}>` → `<Outlet />`), so the
// header is on every page without each page knowing about it.
//
// The page, not Layout, owns the `<main>` landmark: every page already renders its own `<main>`
// (with its own max-width), and a second `<main>` here would be a duplicate landmark (an
// accessibility failure Lighthouse flags). The pages were written before the frame existed and
// size their `<main>` with `min-h-dvh`, which here would push the footer a whole viewport down —
// the `[&>main]:` variants below override that on the direct child, so no page needs editing.

import { Outlet } from 'react-router-dom'
import { useLang } from '../i18n/LangProvider'
import { SiteHeader } from './SiteHeader'

export function Layout() {
  const { t } = useLang()
  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-4 sm:px-6">
      <SiteHeader />
      <div className="flex flex-1 flex-col [&>main]:min-h-0 [&>main]:flex-1">
        <Outlet />
      </div>
      <footer className="border-t border-olive-900/10 py-6 text-xs leading-relaxed text-olive-700">
        <p>{t.notMedicalAdvice}</p>
      </footer>
    </div>
  )
}
