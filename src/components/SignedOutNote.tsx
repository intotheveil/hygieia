// SIGNED-OUT NOTE (P2.4): the bilingual explanation shown wherever a per-user feature is
// disabled (PLAN §1 item 7). `local-only`: this copy of the app has no account service, full stop.
// `signed-out`: an account service exists — offer the way in, returning to the current page.

import { Link, useLocation } from 'react-router-dom'
import { useLang } from '../i18n/LangProvider'
import type { DisabledReason } from '../user/source'

export function SignedOutNote({ reason }: { reason: DisabledReason }) {
  const { t } = useLang()
  const location = useLocation()
  if (reason === 'local-only') {
    return (
      <p role="note" className="text-sm leading-relaxed text-olive-700">
        {t.userDataUnavailableLocal}
      </p>
    )
  }
  const next = new URLSearchParams({ next: `${location.pathname}${location.search}` })
  return (
    <p role="note" className="text-sm leading-relaxed text-olive-700">
      {t.userDataSignInToSave}{' '}
      <Link to={`/auth?${next.toString()}`} className="font-medium text-olive-900 underline">
        {t.signIn}
      </Link>
    </p>
  )
}
