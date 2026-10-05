// PKCE CALLBACK (`/auth/callback`, P2.2). The Supabase client exchanges `?code=` itself on page
// load (`detectSessionInUrl: true`, `flowType: 'pkce'` in CLIENT_OPTIONS) and AuthProvider sees the
// resulting `SIGNED_IN`; this page only waits for it and then sends the user to the stored return
// path. It NEVER rewrites the URL itself: on GitHub Pages this deep link is served as 404.html, a
// byte copy of index.html, and the query string must survive untouched for the exchange to happen.

import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useLang } from '../i18n/LangProvider'
import { useAuth } from './AuthProvider'
import { takeNext } from './session'

/** How long to wait for the exchange before calling it failed; injectable for tests. */
export const DEFAULT_CALLBACK_TIMEOUT_MS = 15_000

export function CallbackPage({ timeoutMs = DEFAULT_CALLBACK_TIMEOUT_MS }: { timeoutMs?: number }) {
  const { t } = useLang()
  const { state } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [timedOut, setTimedOut] = useState(false)

  // Supabase reports a failed provider round-trip in the query string (`error`, `error_description`).
  const urlError = params.get('error') ?? params.get('error_description')
  const signedIn = state.status === 'signed-in'
  const failed = state.status === 'unavailable' || urlError !== null || (timedOut && !signedIn)

  useEffect(() => {
    if (signedIn) void navigate(takeNext(window.sessionStorage), { replace: true })
  }, [signedIn, navigate])

  useEffect(() => {
    if (signedIn) return
    const id = window.setTimeout(() => setTimedOut(true), timeoutMs)
    return () => window.clearTimeout(id)
  }, [signedIn, timeoutMs])

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-4 px-4 text-center">
      {failed ? (
        <>
          <h1 className="font-display text-3xl font-semibold">{t.callbackFailed}</h1>
          <Link
            to="/auth"
            className="rounded-full bg-olive-900 px-5 py-2 text-sm font-medium text-paper-50 hover:bg-olive-700"
          >
            {t.backToSignIn}
          </Link>
        </>
      ) : (
        <p role="status" className="text-lg text-olive-700">
          {t.callbackWorking}
        </p>
      )}
    </main>
  )
}
