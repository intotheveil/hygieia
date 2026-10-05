// ADMIN GUARD (P2.5): RequireAuth, then the profile's `is_admin` — read from the DB row
// (profile.ts), never from an email or anything client-side. A non-admin gets a bilingual 403;
// the RLS admin policies are what actually protect the data (PLAN §1 item 8).

import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../i18n/LangProvider'
import { useProfile } from './profile'
import { RequireAuth } from './RequireAuth'

const BUTTON =
  'rounded-full bg-olive-900 px-5 py-2 text-sm font-medium text-paper-50 hover:bg-olive-700'

function AdminGate({ children }: { children: ReactNode }) {
  const { t } = useLang()
  const { status, isAdmin } = useProfile()

  // `idle` can only be a transient frame here (RequireAuth has already seen a session).
  if (status === 'idle' || status === 'loading') {
    return (
      <main className="mx-auto flex min-h-dvh max-w-2xl items-center justify-center px-4">
        <p role="status" className="text-olive-700">
          {t.loading}
        </p>
      </main>
    )
  }
  if (!isAdmin) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-5 px-4 text-center">
        <h1 className="font-display text-3xl font-semibold">{t.notAllowedTitle}</h1>
        <p className="text-olive-700">{t.notAllowedBody}</p>
        <Link to="/" className={BUTTON}>
          {t.backHome}
        </Link>
      </main>
    )
  }
  return <>{children}</>
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <AdminGate>{children}</AdminGate>
    </RequireAuth>
  )
}
