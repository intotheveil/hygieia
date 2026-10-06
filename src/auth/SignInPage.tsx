// SIGN-IN PAGE (`/auth`, P2.2): email magic link + "Continue with Google" on the shared Supabase
// Auth (DECISIONS.md ADR-0003 rule 6). Both flows leave the app and come back to `/auth/callback`;
// the redirect URL is built from the page's origin and Vite's BASE_URL, never hardcoded, and the
// `?next=` return path is parked in sessionStorage for the callback page to pick up.

import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLang } from '../i18n/LangProvider'
import { useAuth } from './AuthProvider'
import { callbackUrl, storeNext } from './session'

type Phase = 'idle' | 'sending' | 'sent' | 'failed'

function redirectTo(): string {
  return callbackUrl(window.location.origin, import.meta.env.BASE_URL)
}

const BUTTON =
  'rounded-full bg-olive-900 px-5 py-2 text-sm font-medium text-paper-50 hover:bg-olive-700 disabled:cursor-not-allowed disabled:opacity-60'
const SECONDARY =
  'rounded-full border border-olive-900/20 bg-paper-50/70 px-5 py-2 text-sm font-medium text-olive-900 hover:border-olive-900/40 hover:bg-paper-50 disabled:cursor-not-allowed disabled:opacity-60'

export function SignInPage() {
  const { t } = useLang()
  const { state, client, signOut } = useAuth()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const next = params.get('next')

  if (state.status === 'unavailable' || client === null) {
    return (
      <Shell title={t.signInUnavailableTitle}>
        <p className="text-olive-700">{t.signInUnavailableBody}</p>
        <Link to="/" className={BUTTON}>
          {t.backHome}
        </Link>
      </Shell>
    )
  }

  if (state.status === 'signed-in') {
    return (
      <Shell title={t.signIn}>
        <p className="text-olive-700">{state.user.email ?? state.user.id}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => void signOut()} className={SECONDARY}>
            {t.signOut}
          </button>
          <Link to="/" className={BUTTON}>
            {t.backHome}
          </Link>
        </div>
      </Shell>
    )
  }

  async function sendLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (client === null) return
    setPhase('sending')
    storeNext(window.sessionStorage, next)
    const { error } = await client.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo() },
    })
    setPhase(error ? 'failed' : 'sent')
  }

  async function withGoogle() {
    if (client === null) return
    setPhase('sending')
    storeNext(window.sessionStorage, next)
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectTo() },
    })
    // On success the browser is leaving; only a failure needs rendering.
    if (error) setPhase('failed')
  }

  if (phase === 'sent') {
    return (
      <Shell title={t.signIn}>
        <p role="status" className="text-olive-700">
          {t.signInLinkSent}
        </p>
      </Shell>
    )
  }

  const busy = phase === 'sending'
  return (
    <Shell title={t.signIn}>
      <p className="text-olive-700">{t.signInIntro}</p>
      <form onSubmit={(e) => void sendLink(e)} className="flex w-full max-w-sm flex-col gap-3">
        <label htmlFor="sign-in-email" className="text-left text-sm font-medium text-olive-900">
          {t.signInEmailLabel}
        </label>
        <input
          id="sign-in-email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-olive-900/20 bg-paper-50 px-4 py-2 text-olive-950 focus:border-olive-900/40 focus:outline-none"
        />
        <button type="submit" disabled={busy} className={BUTTON}>
          {t.signInSendLink}
        </button>
      </form>
      <button type="button" onClick={() => void withGoogle()} disabled={busy} className={SECONDARY}>
        {t.signInGoogle}
      </button>
      {phase === 'failed' && (
        <p role="alert" className="text-sm text-clay-700">
          {t.signInFailed}
        </p>
      )}
    </Shell>
  )
}

function Shell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-5 px-4 text-center">
      <h1 className="font-display text-3xl font-semibold">{title}</h1>
      {children}
    </main>
  )
}
