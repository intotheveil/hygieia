// ADMIN REVIEW PAGE `/admin` (P4.10 + P4.11). Reached through RequireAdmin (routes.tsx), which
// already handles the anonymous visitor and the non-admin; this page re-checks both defensively
// (the 403 copy when `!isAdmin`, `adminUnavailable` when there is no client at all) because the
// RLS policies, not the route, are what protect the data, and a page must never assume its guard.
//
// One tab per content kind with its pending count, plus the Prices tab (P4.11). Within a kind: a
// status filter (pending / approved / rejected), the list of rows, and — once a row is picked —
// the side-by-side ReviewForm. Everything goes through AdminContentSource (./adminSource.ts),
// which can read every status and update content columns + status, and nothing else.

import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useProfile } from '../auth/profile'
import { CONTENT_TABLES, type ContentStatus, type ContentTable } from '../content/enums.ts'
import { useLang } from '../i18n/LangProvider'
import { adminSource, type AdminContentSource, type AdminRow } from './adminSource.ts'
import { PendingList } from './PendingList.tsx'
import { PriceTable } from './PriceTable.tsx'
import { ReviewForm } from './ReviewForm.tsx'
import { useSettled } from './useSettled.ts'

const PRICES_TAB = 'prices'
type Tab = ContentTable | typeof PRICES_TAB
const TABS: readonly Tab[] = [...CONTENT_TABLES, PRICES_TAB]
const STATUSES: readonly ContentStatus[] = ['pending', 'approved', 'rejected']

const BUTTON =
  'rounded-full bg-olive-900 px-5 py-2 text-sm font-medium text-paper-50 hover:bg-olive-700'
const TAB_ON = 'bg-olive-900 text-paper-50'
const TAB_OFF = 'border border-olive-900/20 bg-paper-50/70 text-olive-900 hover:bg-paper-50'

function Shell({ children }: { children: ReactNode }) {
  const { t } = useLang()
  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-olive-950">{t.adminTitle}</h1>
      {children}
    </main>
  )
}

export function AdminPage() {
  const { t } = useLang()
  const { client } = useAuth()
  const profile = useProfile()
  const source = useMemo(() => (client === null ? null : adminSource(client)), [client])

  if (source === null) {
    return (
      <Shell>
        <p role="note" className="text-olive-700">
          {t.adminUnavailable}
        </p>
        <Link to="/" className={`${BUTTON} self-start`}>
          {t.backHome}
        </Link>
      </Shell>
    )
  }
  if (profile.status === 'idle' || profile.status === 'loading') {
    return (
      <Shell>
        <p role="status" className="text-olive-700">
          {t.loading}
        </p>
      </Shell>
    )
  }
  if (!profile.isAdmin) {
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
  return (
    <Shell>
      <p className="max-w-3xl text-olive-700">{t.adminIntro}</p>
      <Workbench source={source} />
    </Shell>
  )
}

type PendingByTable = { readonly [T in ContentTable]: AdminRow<T>[] | null }

/** One `listPending` per content table; a failed table is `null` (its tab shows no count). */
async function loadPending(source: AdminContentSource): Promise<PendingByTable> {
  const results = await Promise.all(CONTENT_TABLES.map((table) => source.listPending(table)))
  const out: Partial<Record<ContentTable, AdminRow[] | null>> = {}
  CONTENT_TABLES.forEach((table, i) => {
    const result = results[i]
    out[table] = result && result.ok ? result.data : null
  })
  // reason: every ContentTable key was assigned in the loop above.
  return out as PendingByTable
}

/** What the list panel shows: rows, `null` after a failed read, `undefined` while loading. */
type Rows = AdminRow[] | null | undefined

function Workbench({ source }: { source: AdminContentSource }) {
  const { t } = useLang()
  const [tab, setTab] = useState<Tab>(CONTENT_TABLES[0])
  const [status, setStatus] = useState<ContentStatus>('pending')
  const [selected, setSelected] = useState<AdminRow | null>(null)
  // Bumped after every write so the lists and counts are re-read from the source.
  const [version, setVersion] = useState(0)

  // `version` is a deliberate extra dependency: a new identity is what makes useSettled re-run.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- see above
  const pendingLoad = useCallback(() => loadPending(source), [source, version])
  const pending = useSettled(pendingLoad)

  const table: ContentTable | null = tab === PRICES_TAB ? null : tab
  const filteredLoad = useCallback(
    () =>
      table === null || status === 'pending'
        ? Promise.resolve(null)
        : source.listAll(table, status),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `version` forces a re-read (see above)
    [source, table, status, version],
  )
  const filtered = useSettled(filteredLoad)

  const refresh = () => setVersion((n) => n + 1)
  const pick = (next: Tab) => {
    setTab(next)
    setSelected(null)
  }
  const filterBy = (next: ContentStatus) => {
    setStatus(next)
    setSelected(null)
  }

  let panel: ReactNode
  if (table === null) {
    panel = <PriceTable source={source} />
  } else if (selected !== null) {
    panel = (
      <ReviewForm
        key={selected.id}
        table={table}
        row={selected}
        source={source}
        onBack={() => setSelected(null)}
        onReviewed={() => {
          setSelected(null)
          refresh()
        }}
        onSaved={refresh}
      />
    )
  } else {
    let rows: Rows
    if (status === 'pending') rows = pending === null ? undefined : pending[table]
    else if (filtered === null || filtered === undefined) rows = undefined
    else rows = filtered.ok ? filtered.data : null
    if (rows === undefined) {
      panel = (
        <p role="status" className="text-olive-700">
          {t.loading}
        </p>
      )
    } else if (rows === null) {
      panel = <p role="alert">{t.adminLoadFailed}</p>
    } else {
      panel = (
        <PendingList
          table={table}
          rows={rows}
          empty={status === 'pending' ? t.noPending : t.noRowsForStatus}
          onSelect={setSelected}
        />
      )
    }
  }

  return (
    <>
      <div role="tablist" aria-label={t.adminTitle} className="flex flex-wrap gap-2">
        {TABS.map((id) => {
          const count = id === PRICES_TAB || pending === null ? null : (pending[id]?.length ?? null)
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-selected={tab === id}
              aria-controls={`panel-${id}`}
              onClick={() => pick(id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === id ? TAB_ON : TAB_OFF}`}
            >
              {id === PRICES_TAB ? t.prices : t.kinds[id]}
              {count !== null && count > 0 && (
                <span
                  className={`ml-2 rounded-full px-2 text-xs ${tab === id ? 'bg-paper-50/20' : 'bg-olive-900/10'}`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {table !== null && (
        <div
          role="group"
          aria-label={`${t.pendingTab} / ${t.approvedTab} / ${t.rejectedTab}`}
          className="flex flex-wrap gap-2"
        >
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={status === s}
              onClick={() => filterBy(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${status === s ? TAB_ON : TAB_OFF}`}
            >
              {s === 'pending' ? t.pendingTab : s === 'approved' ? t.approvedTab : t.rejectedTab}
            </button>
          ))}
        </div>
      )}

      <section
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        className="rounded-2xl border border-olive-900/10 bg-paper-50/80 p-6"
      >
        {panel}
      </section>
    </>
  )
}
