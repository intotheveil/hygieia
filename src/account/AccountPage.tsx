// ACCOUNT PAGE (P2.5 placeholder → P4.6). Reached only through RequireAuth. Three tabs over the
// UserDataSource (P2.4): saved plans (diet, week start, open → `/diets/:slug`), saved fridge lists
// (name, ingredient count) and favourites (recipe links), each with Remove. Diet and recipe names
// come from the ContentSource by id — the per-user tables store ids, never copies. `source` and
// `content` are injectable for tests; the app passes nothing. If the user source is disabled anyway
// (it cannot be, under RequireAuth, but the type allows it) the bilingual note explains why.

import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { SignedOutNote } from '../components/SignedOutNote'
import { contentSource, type ContentSource, type Diet, type Recipe } from '../content/index.ts'
import { useLang } from '../i18n/LangProvider'
import type { Lang } from '../i18n/dictionary'
import { useAsync } from '../lib/useAsync'
import type {
  Favourite,
  FridgeList,
  Result,
  SavedPlan,
  UserDataError,
  UserDataSource,
} from '../user/source'
import { useUserData } from '../user/useUserData'

type Tab = 'savedPlans' | 'savedFridgeLists' | 'favourites'
const TABS: readonly Tab[] = ['savedPlans', 'savedFridgeLists', 'favourites']

interface Loaded {
  plans: Result<SavedPlan[]>
  lists: Result<FridgeList[]>
  favourites: Result<Favourite[]>
  dietsById: ReadonlyMap<string, Diet>
  recipesById: ReadonlyMap<string, Recipe>
}

async function loadAll(source: UserDataSource, content: ContentSource): Promise<Loaded> {
  const [plans, lists, favourites, diets, recipes] = await Promise.all([
    source.savedPlans.list(),
    source.fridgeLists.list(),
    source.favourites.list(),
    content.listDiets(),
    content.listRecipes(),
  ])
  return {
    plans,
    lists,
    favourites,
    dietsById: new Map(diets.ok ? diets.data.map((d) => [d.id, d]) : []),
    recipesById: new Map(recipes.ok ? recipes.data.map((r) => [r.id, r]) : []),
  }
}

function formatDate(iso: string, lang: Lang): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(lang === 'el' ? 'el-GR' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function AccountPage({
  source,
  content = contentSource,
}: {
  source?: UserDataSource
  content?: ContentSource
}) {
  const { t, lang } = useLang()
  const fromHook = useUserData()
  const userData = source ?? fromHook
  const [tab, setTab] = useState<Tab>('savedPlans')
  const [removeError, setRemoveError] = useState<UserDataError | null>(null)

  const load = useCallback(() => loadAll(userData, content), [userData, content])
  const state = useAsync(load)
  const { reload } = state

  const remove = useCallback(
    async (action: () => Promise<Result<void>>) => {
      setRemoveError(null)
      const result = await action()
      if (result.ok) reload()
      else setRemoveError(result.error)
    },
    [reload],
  )

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-olive-950">{t.account}</h1>

      {userData.kind === 'disabled' ? (
        <SignedOutNote reason={userData.reason ?? 'signed-out'} />
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
                tabIndex={tab === id ? 0 : -1}
                onClick={() => {
                  setTab(id)
                  setRemoveError(null)
                }}
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
            className="flex flex-col gap-3 rounded-2xl border border-olive-900/10 bg-paper-50/80 p-6"
          >
            {removeError !== null ? (
              <p role="alert" className="text-sm text-clay-500">
                {t.removeFailed}
              </p>
            ) : null}
            {state.status === 'loading' ? (
              <p role="status" className="text-olive-700">
                {t.loading}
              </p>
            ) : state.status === 'error' ? (
              <LoadFailed onRetry={reload} />
            ) : (
              <Panel
                tab={tab}
                data={state.data}
                source={userData}
                lang={lang}
                onRemove={remove}
                onRetry={reload}
              />
            )}
          </section>
        </>
      )}
    </main>
  )
}

interface Item {
  key: string
  label: string
  detail?: string
  /** Where "Open" goes; absent when the referenced content is not visible. */
  to?: string
  remove: () => Promise<Result<void>>
}

function Panel({
  tab,
  data,
  source,
  lang,
  onRemove,
  onRetry,
}: {
  tab: Tab
  data: Loaded
  source: UserDataSource
  lang: Lang
  onRemove: (action: () => Promise<Result<void>>) => Promise<void>
  onRetry: () => void
}) {
  const { t } = useLang()
  const result: Result<Item[]> =
    tab === 'savedPlans'
      ? mapResult(data.plans, (plan) => {
          const diet = data.dietsById.get(plan.diet_id)
          return {
            key: plan.id,
            label: diet ? (lang === 'el' ? diet.name_el : diet.name_en) : plan.diet_id,
            detail: `${t.weekOf} ${formatDate(plan.week_start, lang)}`,
            to: diet ? `/diets/${diet.slug}` : undefined,
            remove: () => source.savedPlans.remove(plan.id),
          }
        })
      : tab === 'savedFridgeLists'
        ? mapResult(data.lists, (list) => ({
            key: list.id,
            label: list.name,
            detail: `${list.ingredient_slugs.length} ${t.itemCount}`,
            to: '/fridge',
            remove: () => source.fridgeLists.remove(list.id),
          }))
        : mapResult(data.favourites, (fav) => {
            const recipe = data.recipesById.get(fav.recipe_id)
            return {
              key: fav.recipe_id,
              label: recipe ? (lang === 'el' ? recipe.title_el : recipe.title_en) : fav.recipe_id,
              to: recipe ? `/recipes/${recipe.slug}` : undefined,
              remove: () => source.favourites.remove(fav.recipe_id),
            }
          })

  if (!result.ok) return <LoadFailed onRetry={onRetry} />
  if (result.data.length === 0) return <p className="text-olive-700">{t.nothingSavedYet}</p>
  return (
    <ul className="flex flex-col gap-2 text-olive-900">
      {result.data.map((item) => (
        <li
          key={item.key}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-paper-200/60 px-4 py-2 text-sm"
        >
          <div className="flex flex-col">
            <span className="font-medium">{item.label}</span>
            {item.detail ? <span className="text-xs text-olive-700">{item.detail}</span> : null}
          </div>
          <div className="flex items-center gap-2">
            {item.to ? (
              <Link
                to={item.to}
                aria-label={`${t.open}: ${item.label}`}
                className="rounded-full border border-olive-900/20 px-3 py-1 text-xs font-medium hover:bg-paper-50"
              >
                {t.open}
              </Link>
            ) : null}
            <button
              type="button"
              aria-label={`${t.remove}: ${item.label}`}
              onClick={() => void onRemove(item.remove)}
              className="rounded-full border border-clay-500/40 px-3 py-1 text-xs font-medium text-clay-500 hover:bg-clay-500/10"
            >
              {t.remove}
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}

/** The bilingual failure copy with a retry — for a rejected load and for a tab whose read failed. */
function LoadFailed({ onRetry }: { onRetry: () => void }) {
  const { t } = useLang()
  return (
    <div role="alert" className="flex flex-col items-start gap-3 text-olive-900">
      <p>{t.loadFailed}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full bg-olive-900 px-4 py-1.5 text-sm font-medium text-paper-50 hover:bg-olive-700"
      >
        {t.retry}
      </button>
    </div>
  )
}

function mapResult<T, U>(result: Result<T[]>, map: (row: T) => U): Result<U[]> {
  return result.ok ? { ok: true, data: result.data.map(map) } : result
}
