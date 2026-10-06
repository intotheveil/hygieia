// PROFILE PAGE (P8.2, operator: "profile page which tracks our data and achievements / entries …
// like save favorites"). NOT behind RequireAuth: signed-out or local-only the page renders its H1
// and the bilingual SignedOutNote (the account page pattern), so the gates audit it like any
// other route. Signed in: one `Promise.all` over the four per-user reads (entries, goals, saved
// items, favourites) → summary strip, quick add, weight trend, history, goals, achievements,
// saved. Writes are OPTIMISTIC through `useOverlay`: the list changes at once, the server answer
// confirms (replacing a temporary id) or reverts it, and the section shows the inline error.
// Achievements are computed on every render from the data on screen — never stored.
// `source`, `content` and `today` are injectable for tests; the app passes nothing.

import { useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ErrorState, Loading } from '../components/AsyncState'
import { SignedOutNote } from '../components/SignedOutNote'
import { contentSource, type ContentSource } from '../content/index.ts'
import { useLang } from '../i18n/LangProvider'
import { profileCopy } from '../i18n/features/profile.ts'
import { useAsyncResult } from '../lib/useAsync'
import {
  ok,
  type Entry,
  type EntryInput,
  type Favourite,
  type Goal,
  type GoalInput,
  type Result,
  type SavedItem,
  type SavedItemKind,
  type UserDataSource,
} from '../user/source'
import { useUserData } from '../user/useUserData'
import { AchievementsGrid } from './AchievementsGrid'
import { GoalsEditor } from './GoalsEditor'
import { History } from './History'
import { QuickAdd } from './QuickAdd'
import { SavedSection } from './SavedSection'
import { SummaryStrip } from './SummaryStrip'
import { WeightTrend } from './WeightTrend'
import { computeAchievements } from './achievements'
import { localIsoDate, sortEntries } from './stats'
import { useOverlay } from './useOverlay'

export interface Loaded {
  entries: Entry[]
  goals: Goal[]
  savedItems: SavedItem[]
  favourites: Favourite[]
}

async function loadAll(source: UserDataSource): Promise<Result<Loaded>> {
  const [entries, goals, savedItems, favourites] = await Promise.all([
    source.listEntries(),
    source.listGoals(),
    source.listSavedItems(),
    source.favourites.list(),
  ])
  if (!entries.ok) return entries
  if (!goals.ok) return goals
  if (!savedItems.ok) return savedItems
  if (!favourites.ok) return favourites
  return ok({
    entries: sortEntries(entries.data),
    goals: goals.data,
    savedItems: savedItems.data,
    favourites: favourites.data,
  })
}

export interface ProfilePageProps {
  source?: UserDataSource
  content?: ContentSource
  /** `YYYY-MM-DD`; defaults to the local calendar date. */
  today?: string
}

export function ProfilePage({ source, content = contentSource, today }: ProfilePageProps) {
  const { t } = useLang(profileCopy)
  const fromHook = useUserData()
  const userData = source ?? fromHook
  const todayIso = today ?? localIsoDate(new Date())

  const load = useCallback(() => loadAll(userData), [userData])
  const state = useAsyncResult(load)
  const loaded = state.status === 'ready' ? state.data : null
  const [data, setData] = useOverlay<Loaded | null>(loaded)

  const patch = useCallback(
    (update: (current: Loaded) => Loaded) =>
      setData((current) => (current === null ? current : update(current))),
    [setData],
  )

  const addEntry = useCallback(
    async (input: EntryInput): Promise<Result<Entry>> => {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const temp: Entry = {
        id: tempId,
        kind: input.kind,
        entry_date: input.entry_date ?? todayIso,
        value: input.value ?? null,
        unit: input.unit ?? null,
        payload: input.payload ?? null,
        note: input.note ?? null,
        created_at: new Date().toISOString(),
      }
      patch((c) => ({ ...c, entries: sortEntries([temp, ...c.entries]) }))
      const result = await userData.addEntry(input)
      patch((c) => ({
        ...c,
        entries: result.ok
          ? sortEntries(c.entries.map((e) => (e.id === tempId ? result.data : e)))
          : c.entries.filter((e) => e.id !== tempId),
      }))
      return result
    },
    [userData, patch, todayIso],
  )

  const deleteEntry = useCallback(
    async (id: string): Promise<Result<void>> => {
      let removed: Entry | undefined
      patch((c) => {
        removed = c.entries.find((e) => e.id === id)
        return { ...c, entries: c.entries.filter((e) => e.id !== id) }
      })
      const result = await userData.deleteEntry(id)
      if (!result.ok && removed !== undefined) {
        const back = removed
        patch((c) => ({ ...c, entries: sortEntries([...c.entries, back]) }))
      }
      return result
    },
    [userData, patch],
  )

  const upsertGoal = useCallback(
    async (input: GoalInput): Promise<Result<Goal>> => {
      let previous: Goal | undefined
      const optimistic: Goal = { ...input, updated_at: new Date().toISOString() }
      patch((c) => {
        previous = c.goals.find((g) => g.kind === input.kind)
        return { ...c, goals: [...c.goals.filter((g) => g.kind !== input.kind), optimistic] }
      })
      const result = await userData.upsertGoal(input)
      patch((c) => {
        const rest = c.goals.filter((g) => g.kind !== input.kind)
        if (result.ok) return { ...c, goals: [...rest, result.data] }
        return { ...c, goals: previous === undefined ? rest : [...rest, previous] }
      })
      return result
    },
    [userData, patch],
  )

  const unsave = useCallback(
    async (kind: SavedItemKind, itemId: string): Promise<Result<void>> => {
      let removed: SavedItem | undefined
      patch((c) => {
        removed = c.savedItems.find((s) => s.kind === kind && s.item_id === itemId)
        return {
          ...c,
          savedItems: c.savedItems.filter((s) => !(s.kind === kind && s.item_id === itemId)),
        }
      })
      const result = await userData.unsaveItem(kind, itemId)
      if (!result.ok && removed !== undefined) {
        const back = removed
        patch((c) => ({ ...c, savedItems: [...c.savedItems, back] }))
      }
      return result
    },
    [userData, patch],
  )

  const unfavourite = useCallback(
    async (recipeId: string): Promise<Result<void>> => {
      let removed: Favourite | undefined
      patch((c) => {
        removed = c.favourites.find((f) => f.recipe_id === recipeId)
        return { ...c, favourites: c.favourites.filter((f) => f.recipe_id !== recipeId) }
      })
      const result = await userData.favourites.remove(recipeId)
      if (!result.ok && removed !== undefined) {
        const back = removed
        patch((c) => ({ ...c, favourites: [...c.favourites, back] }))
      }
      return result
    },
    [userData, patch],
  )

  const achievements = useMemo(
    () =>
      data === null
        ? []
        : computeAchievements({
            entries: data.entries,
            goals: data.goals,
            favouritesCount: data.favourites.length,
            savedItems: data.savedItems,
            today: todayIso,
          }),
    [data, todayIso],
  )

  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-3">
        <h1 className="font-display text-3xl font-semibold text-olive-950">{t.profileTitle}</h1>
        <p className="max-w-3xl leading-relaxed text-olive-700">{t.profileIntro}</p>
      </header>

      {userData.kind === 'disabled' ? (
        <SignedOutNote reason={userData.reason ?? 'signed-out'} />
      ) : state.status === 'loading' || data === null ? (
        state.status === 'error' ? (
          <ErrorState message={t.profileLoadFailed} onRetry={state.reload} />
        ) : (
          <Loading variant="panel" />
        )
      ) : (
        <>
          <p className="flex flex-wrap gap-4 text-sm font-medium text-olive-900">
            <Link to="/account" className="underline">
              {t.account} →
            </Link>
            <Link to="/workouts/plans" className="underline">
              {t.wpLink} →
            </Link>
          </p>
          <SummaryStrip
            entries={data.entries}
            goals={data.goals}
            favouritesCount={data.favourites.length}
            savedCount={data.savedItems.length}
            today={todayIso}
          />
          <QuickAdd today={todayIso} onSubmit={addEntry} />
          <WeightTrend entries={data.entries} today={todayIso} />
          <History entries={data.entries} onDelete={deleteEntry} />
          <GoalsEditor goals={data.goals} onSave={upsertGoal} />
          <AchievementsGrid achievements={achievements} />
          <SavedSection
            savedItems={data.savedItems}
            favourites={data.favourites}
            content={content}
            onUnsave={unsave}
            onUnfavourite={unfavourite}
          />
        </>
      )}
    </main>
  )
}
