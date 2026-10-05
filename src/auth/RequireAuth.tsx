// ROUTE GUARD (P2.5): the client-side half of "per-user pages need a user". RLS is the real
// gate; this only keeps a signed-out visitor from seeing an empty page. Anonymous → the sign-in
// page with `?next=` set to the current path (safeNextPath screens it on the way back);
// unavailable (local-only mode) → the same copy the sign-in page shows; loading → one line.

import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useLang } from '../i18n/LangProvider'
import { useAuth } from './AuthProvider'

const BUTTON =
  'rounded-full bg-olive-900 px-5 py-2 text-sm font-medium text-paper-50 hover:bg-olive-700'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { t } = useLang()
  const { state } = useAuth()
  const location = useLocation()

  switch (state.status) {
    case 'loading':
      return (
        <main className="mx-auto flex min-h-dvh max-w-2xl items-center justify-center px-4">
          <p role="status" className="text-olive-700">
            {t.loading}
          </p>
        </main>
      )
    case 'unavailable':
      return (
        <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-5 px-4 text-center">
          <h1 className="font-display text-3xl font-semibold">{t.signInUnavailableTitle}</h1>
          <p className="text-olive-700">{t.signInUnavailableBody}</p>
          <Link to="/" className={BUTTON}>
            {t.backHome}
          </Link>
        </main>
      )
    case 'anonymous': {
      const next = new URLSearchParams({ next: `${location.pathname}${location.search}` })
      return <Navigate to={`/auth?${next.toString()}`} replace />
    }
    case 'signed-in':
      return <>{children}</>
  }
}
