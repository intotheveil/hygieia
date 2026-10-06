// ACCOUNT MENU (P2.5): the header's way in and out. Signed in → who (email, or the id when the
// provider gave none), links to /account and /profile (P8.2) and sign-out; anonymous → a "Sign in" link; no account
// service (local-only mode), still loading, or rendered without an AuthProvider → nothing, so the
// home page is identical with or without auth.

import { Link } from 'react-router-dom'
import { useOptionalAuth } from '../auth/AuthProvider'
import { useLang } from '../i18n/LangProvider'

const PILL =
  'rounded-full border border-olive-900/20 bg-paper-50/70 px-4 py-1.5 text-sm font-medium text-olive-900 shadow-sm backdrop-blur hover:border-olive-900/40 hover:bg-paper-50'

export function AccountMenu() {
  const { t } = useLang()
  const auth = useOptionalAuth()
  if (auth === null) return null
  const { state, signOut } = auth

  if (state.status === 'anonymous') {
    return (
      <Link to="/auth" className={PILL}>
        {t.signIn}
      </Link>
    )
  }
  if (state.status !== 'signed-in') return null

  return (
    <nav aria-label={t.account} className="flex items-center gap-2">
      <Link to="/account" className={PILL} title={state.user.email ?? state.user.id}>
        <span className="sr-only">{t.account}: </span>
        <span className="max-w-[12rem] truncate align-middle">
          {state.user.email ?? state.user.id}
        </span>
      </Link>
      <Link to="/profile" className={PILL}>
        {t.profileLink}
      </Link>
      <button type="button" onClick={() => void signOut()} className={PILL}>
        {t.signOut}
      </button>
    </nav>
  )
}
