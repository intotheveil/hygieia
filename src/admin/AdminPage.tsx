// ADMIN PAGE — placeholder (P2.5). Reached only through RequireAdmin. The review tools (approve /
// reject content, edit both languages side by side) arrive in P4.10, which replaces this file.

import { Link } from 'react-router-dom'
import { useLang } from '../i18n/LangProvider'

export function AdminPage() {
  const { t } = useLang()
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-5 px-4 text-center">
      <h1 className="font-display text-3xl font-semibold">{t.adminTitle}</h1>
      <p className="text-olive-700">{t.adminPlaceholder}</p>
      <Link
        to="/"
        className="rounded-full bg-olive-900 px-5 py-2 text-sm font-medium text-paper-50 hover:bg-olive-700"
      >
        {t.backHome}
      </Link>
    </main>
  )
}
