// ACCOUNT PAGE — placeholder (P2.5). Reached only through RequireAuth. Three tabs that LIST what
// the user has saved through the UserDataSource (P2.4); P4.6 adds editing, removal and the
// plan/list detail views. If the source is disabled anyway (it cannot be, under RequireAuth, but
// the type allows it) the bilingual note explains why.

import { useEffect, useState } from 'react'
import { useLang } from '../i18n/LangProvider'
import { SignedOutNote } from '../components/SignedOutNote'
import type { Favourite, FridgeList, SavedPlan, UserDataSource } from '../user/source'
import { useUserData } from '../user/useUserData'

type Tab = 'savedPlans' | 'savedFridgeLists' | 'favourites'
const TABS: readonly Tab[] = ['savedPlans', 'savedFridgeLists', 'favourites']

interface Loaded {
  source: UserDataSource
  plans: SavedPlan[]
  lists: FridgeList[]
  favourites: Favourite[]
}

export function AccountPage() {
  const { t } = useLang()
  const source = useUserData()
  const [tab, setTab] = useState<Tab>('savedPlans')
  // Only the async outcome is state, keyed by the source instance; "loading" is derived.
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  useEffect(() => {
    if (source.kind !== 'supabase') return
    let active = true
    void Promise.all([
      source.savedPlans.list(),
      source.fridgeLists.list(),
      source.favourites.list(),
    ]).then(([plans, lists, favourites]) => {
      if (!active) return
      setLoaded({
        source,
        plans: plans.ok ? plans.data : [],
        lists: lists.ok ? lists.data : [],
        favourites: favourites.ok ? favourites.data : [],
      })
    })
    return () => {
      active = false
    }
  }, [source])

  const data = loaded?.source === source ? loaded : null

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-olive-950">{t.account}</h1>

      {source.kind === 'disabled' ? (
        <SignedOutNote reason={source.reason ?? 'signed-out'} />
      ) : (
        <>
          <div role="tablist" aria-label={t.account} className="flex flex-wrap gap-2">
            {TABS.map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`tab-${id}`}
                aria-selected={tab === id}
                aria-controls={`panel-${id}`}
                onClick={() => setTab(id)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                  tab === id
                    ? 'bg-olive-900 text-paper-50'
                    : 'border border-olive-900/20 bg-paper-50/70 text-olive-900 hover:bg-paper-50'
                }`}
              >
                {t[id]}
              </button>
            ))}
          </div>

          <section
            role="tabpanel"
            id={`panel-${tab}`}
            aria-labelledby={`tab-${tab}`}
            className="rounded-2xl border border-olive-900/10 bg-paper-50/80 p-6"
          >
            {data === null ? (
              <p role="status" className="text-olive-700">
                {t.loading}
              </p>
            ) : (
              <Panel tab={tab} data={data} empty={t.nothingSavedYet} />
            )}
          </section>
        </>
      )}
    </main>
  )
}

function Panel({ tab, data, empty }: { tab: Tab; data: Loaded; empty: string }) {
  const items: Array<{ key: string; label: string }> =
    tab === 'savedPlans'
      ? data.plans.map((p) => ({ key: p.id, label: `${p.week_start} · ${p.diet_id}` }))
      : tab === 'savedFridgeLists'
        ? data.lists.map((l) => ({
            key: l.id,
            label: `${l.name} (${l.ingredient_slugs.length})`,
          }))
        : data.favourites.map((f) => ({ key: f.recipe_id, label: f.recipe_id }))

  if (items.length === 0) return <p className="text-olive-700">{empty}</p>
  return (
    <ul className="flex flex-col gap-2 text-olive-900">
      {items.map((item) => (
        <li key={item.key} className="rounded-xl bg-paper-200/60 px-4 py-2 text-sm">
          {item.label}
        </li>
      ))}
    </ul>
  )
}
