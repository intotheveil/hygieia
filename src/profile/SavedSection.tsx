// SAVED (P8.2): favourite recipes (the P2.4 `favourites` table) and the P8 saved items grouped by
// kind, each with a link to where it lives and an Unsave button. The per-user rows hold ids only;
// names are resolved against the ContentSource — but only the tables the saved rows actually
// need are read (a profile with saved diets does not fetch 63 workout templates).

import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, ErrorState, Loading } from '../components/AsyncState'
import type {
  ContentSource,
  Diet,
  HealthTip,
  Recipe,
  SkincareRoutine,
  SkincareTip,
  WorkoutTemplate,
} from '../content'
import type { Result as ContentResult } from '../content/source'
import { useLang } from '../i18n/LangProvider'
import type { Lang } from '../i18n/dictionary'
import { useAsync } from '../lib/useAsync'
import {
  SAVED_ITEM_KINDS,
  type Favourite,
  type Result,
  type SavedItem,
  type SavedItemKind,
} from '../user/source'
import { DANGER, ERR, H2, PILL, SECTION } from './styles'

export interface SavedSectionProps {
  savedItems: readonly SavedItem[]
  favourites: readonly Favourite[]
  content: ContentSource
  onUnsave: (kind: SavedItemKind, itemId: string) => Promise<Result<void>>
  onUnfavourite: (recipeId: string) => Promise<Result<void>>
}

interface Names {
  recipes: ReadonlyMap<string, Recipe>
  workout: ReadonlyMap<string, WorkoutTemplate>
  skincare_routine: ReadonlyMap<string, SkincareRoutine>
  health_tip: ReadonlyMap<string, HealthTip>
  skincare_tip: ReadonlyMap<string, SkincareTip>
  diet: ReadonlyMap<string, Diet>
}

type Need = SavedItemKind | 'recipes'

const byId = <T extends { id: string }>(rows: readonly T[]) =>
  new Map(rows.map((row) => [row.id, row]))

async function readIf<T extends { id: string }>(
  wanted: boolean,
  read: () => Promise<ContentResult<T[]>>,
): Promise<ContentResult<ReadonlyMap<string, T>>> {
  if (!wanted) return { ok: true, data: new Map() }
  const result = await read()
  return result.ok ? { ok: true, data: byId(result.data) } : result
}

/** Reads only the tables named in `needs` (a comma-joined, sorted list — a stable hook key). */
async function loadNames(content: ContentSource, needs: string): Promise<Names> {
  const set = new Set(needs.split(',').filter((n) => n !== '') as Need[])
  const [recipes, workout, routine, tip, skincareTip, diet] = await Promise.all([
    readIf(set.has('recipes'), () => content.listRecipes()),
    readIf(set.has('workout'), () => content.listWorkoutTemplates()),
    readIf(set.has('skincare_routine'), () => content.listSkincareRoutines()),
    readIf(set.has('health_tip'), () => content.listTips()),
    readIf(set.has('skincare_tip'), () => content.listSkincareTips()),
    readIf(set.has('diet'), () => content.listDiets()),
  ])
  for (const result of [recipes, workout, routine, tip, skincareTip, diet]) {
    if (!result.ok) throw new Error(result.error)
  }
  if (!recipes.ok || !workout.ok || !routine.ok || !tip.ok || !skincareTip.ok || !diet.ok) {
    throw new Error('unreachable')
  }
  return {
    recipes: recipes.data,
    workout: workout.data,
    skincare_routine: routine.data,
    health_tip: tip.data,
    skincare_tip: skincareTip.data,
    diet: diet.data,
  }
}

interface Row {
  key: string
  label: string
  to?: string
  remove: () => Promise<Result<void>>
}

const pick = (lang: Lang, el: string, en: string) => (lang === 'el' ? el : en)

function resolve(item: SavedItem, names: Names, lang: Lang): { label: string; to?: string } | null {
  switch (item.kind) {
    case 'workout': {
      const row = names.workout.get(item.item_id)
      if (!row) return null
      const params = new URLSearchParams({
        type: row.workout_type,
        level: row.level,
        intensity: row.intensity,
      })
      return { label: pick(lang, row.title_el, row.title_en), to: `/workouts?${params}` }
    }
    case 'skincare_routine': {
      const row = names.skincare_routine.get(item.item_id)
      return row
        ? { label: pick(lang, row.name_el, row.name_en), to: `/skincare?area=${row.area}` }
        : null
    }
    case 'health_tip': {
      const row = names.health_tip.get(item.item_id)
      return row
        ? { label: pick(lang, row.title_el, row.title_en), to: `/tips?topic=${row.topic}` }
        : null
    }
    case 'skincare_tip': {
      const row = names.skincare_tip.get(item.item_id)
      return row
        ? { label: pick(lang, row.title_el, row.title_en), to: `/skincare?area=${row.area}` }
        : null
    }
    case 'diet': {
      const row = names.diet.get(item.item_id)
      return row ? { label: pick(lang, row.name_el, row.name_en), to: `/diets/${row.slug}` } : null
    }
  }
}

export function SavedSection({
  savedItems,
  favourites,
  content,
  onUnsave,
  onUnfavourite,
}: SavedSectionProps) {
  const { t } = useLang()
  const [failed, setFailed] = useState<string | null>(null)
  const needs = [
    ...(favourites.length > 0 ? ['recipes'] : []),
    ...SAVED_ITEM_KINDS.filter((kind) => savedItems.some((item) => item.kind === kind)),
  ]
    .sort()
    .join(',')
  const load = useCallback(() => loadNames(content, needs), [content, needs])
  const state = useAsync(load)

  async function remove(row: Row): Promise<void> {
    setFailed(null)
    const result = await row.remove()
    if (!result.ok) setFailed(row.key)
  }

  const empty = savedItems.length === 0 && favourites.length === 0

  return (
    <section aria-labelledby="profile-saved" className={SECTION}>
      <h2 id="profile-saved" className={H2}>
        {t.profileSaved}
      </h2>
      {empty ? (
        <EmptyState title={t.profileSavedEmpty} icon="♡" />
      ) : state.status === 'loading' ? (
        <Loading variant="panel" />
      ) : state.status === 'error' ? (
        <ErrorState message={t.loadFailed} onRetry={state.reload} />
      ) : (
        <Groups
          names={state.data}
          savedItems={savedItems}
          favourites={favourites}
          failed={failed}
          onRemove={remove}
          onUnsave={onUnsave}
          onUnfavourite={onUnfavourite}
        />
      )}
    </section>
  )
}

function Groups({
  names,
  savedItems,
  favourites,
  failed,
  onRemove,
  onUnsave,
  onUnfavourite,
}: {
  names: Names
  savedItems: readonly SavedItem[]
  favourites: readonly Favourite[]
  failed: string | null
  onRemove: (row: Row) => Promise<void>
  onUnsave: SavedSectionProps['onUnsave']
  onUnfavourite: SavedSectionProps['onUnfavourite']
}) {
  const { t, lang } = useLang()
  const groups: Array<{ heading: string; rows: Row[] }> = []

  if (favourites.length > 0) {
    groups.push({
      heading: t.profileFavouriteRecipes,
      rows: favourites.map((fav) => {
        const recipe = names.recipes.get(fav.recipe_id)
        return {
          key: `recipe:${fav.recipe_id}`,
          label: recipe ? pick(lang, recipe.title_el, recipe.title_en) : t.profileItemUnavailable,
          to: recipe ? `/recipes/${recipe.slug}` : undefined,
          remove: () => onUnfavourite(fav.recipe_id),
        }
      }),
    })
  }
  for (const kind of SAVED_ITEM_KINDS) {
    const items = savedItems.filter((item) => item.kind === kind)
    if (items.length === 0) continue
    groups.push({
      heading: t.profileSavedKind[kind],
      rows: items.map((item) => {
        const resolved = resolve(item, names, lang)
        return {
          key: `${item.kind}:${item.item_id}`,
          label: resolved?.label ?? t.profileItemUnavailable,
          to: resolved?.to,
          remove: () => onUnsave(item.kind, item.item_id),
        }
      }),
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.heading} className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-olive-900">{group.heading}</h3>
          <ul className="flex flex-col gap-1.5" aria-label={group.heading}>
            {group.rows.map((row) => (
              <li
                key={row.key}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-paper-200/60 px-3 py-2 text-sm"
              >
                <span className="font-medium text-olive-900">{row.label}</span>
                <div className="flex items-center gap-2">
                  {failed === row.key && (
                    <span role="alert" className={ERR}>
                      {t.profileUnsaveFailed}
                    </span>
                  )}
                  {row.to !== undefined && (
                    <Link to={row.to} aria-label={`${t.open}: ${row.label}`} className={PILL}>
                      {t.open}
                    </Link>
                  )}
                  <button
                    type="button"
                    aria-label={`${t.profileUnsave}: ${row.label}`}
                    onClick={() => void onRemove(row)}
                    className={DANGER}
                  >
                    {t.profileUnsave}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
