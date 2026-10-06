// RECIPES LIST `/recipes` (P3.1). Diet chips (from the loaded catalogue), meal chips, a title
// search box; the whole filter lives in the URL (`?diet=a,b&meal=lunch&q=…`) through
// `parse/serializeRecipeFilterParams`, so a filtered view is a shareable address and the back
// button walks filter history. Loading / error (+retry) / empty states from day one; the draft
// ribbon whenever the source is bundled. `source` is a prop (default: the app's `contentSource`)
// so tests can inject a failing one.
//
// PREFERENCES (2026-10-06): arriving with NO filter in the URL, a visitor who chose a diet on the
// home page's onboarding card gets the list filtered by it — the URL is replaced once with
// `?diet=<slug>` (src/prefs/apply.ts), so the chip shows pressed and "Clear filters" clears it for
// good. Any explicit filter in the URL wins and is left untouched.
// SEASON (2026-10-06): the "What's in season" strip (components/SeasonStrip.tsx) sits under the
// header; `?ingredient=<slug>` narrows to recipes using that ingredient and `?season=now` to
// recipes with ≥ 2 in-season ingredients, most seasonal first (recipes/filter.ts). The produce
// calendar is loaded after the first paint (content/seasonalLoader.ts); while `?season=now` waits
// for it the list shows its skeleton instead of an unfiltered flash.

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState, ErrorState, Loading } from '../components/AsyncState'
import { DraftRibbon } from '../components/DraftRibbon'
import { SeasonStrip } from '../components/SeasonStrip'
import { MEAL_TYPES, type MealType } from '../content/enums.ts'
import { contentSource } from '../content/index.ts'
import type { Month } from '../content/seasonal.ts'
import { loadSeasonal } from '../content/seasonalLoader.ts'
import {
  fail,
  ok,
  type ContentSource,
  type Diet,
  type Recipe,
  type Result,
} from '../content/source.ts'
import { seasonCopy } from '../i18n/features/season.ts'
import { useLang } from '../i18n/LangProvider'
import { plural } from '../i18n/fill.ts'
import { useAsync, useAsyncResult } from '../lib/useAsync.ts'
import { applyPrefsToRecipeParams } from '../prefs/apply.ts'
import { readPrefs } from '../prefs/prefs.ts'
import { RecipeCard } from './RecipeCard.tsx'
import { dietName } from './format.ts'
import {
  RECIPE_FILTER_PARAM_KEYS,
  boostInSeason,
  filterRecipes,
  isEmptyRecipeFilter,
  parseRecipeFilterParams,
  serializeRecipeFilterParams,
  sortRecipes,
  type RecipeFilterParams,
} from './filter.ts'

export interface RecipesPageProps {
  source?: ContentSource
  /** The month `?season=now` and the strip use; default: the current month (tests pin it). */
  month?: Month
}

interface Catalogue {
  diets: Diet[]
  recipes: Recipe[]
}

/** Both catalogues in one round trip; the first failure wins (the page needs both). */
async function loadCatalogue(source: ContentSource): Promise<Result<Catalogue>> {
  const [diets, recipes] = await Promise.all([source.listDiets(), source.listRecipes()])
  if (!diets.ok) return fail(diets.error)
  if (!recipes.ok) return fail(recipes.error)
  return ok({ diets: diets.data, recipes: recipes.data })
}

const CHIP_ON = 'bg-olive-900 text-paper-50'
const CHIP_OFF = 'border border-olive-900/20 bg-paper-50/70 text-olive-900 hover:bg-paper-50'

function Chip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${pressed ? CHIP_ON : CHIP_OFF}`}
    >
      {children}
    </button>
  )
}

const SEARCH_ID = 'recipe-search'

export function RecipesPage({ source = contentSource, month }: RecipesPageProps) {
  const { lang, t } = useLang(seasonCopy)
  const seasonal = useAsync(loadSeasonal)
  const currentMonth: Month = month ?? ((new Date().getMonth() + 1) as Month)
  const load = useCallback(() => loadCatalogue(source), [source])
  const state = useAsyncResult(load)
  const [searchParams, setSearchParams] = useSearchParams()

  // Once per arrival: the preferred diet fills an EMPTY filter (an explicit URL always wins).
  const prefsApplied = useRef(false)
  useEffect(() => {
    if (prefsApplied.current) return
    prefsApplied.current = true
    const next = applyPrefsToRecipeParams(searchParams, readPrefs())
    if (next !== null) setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  const catalogue = state.status === 'ready' ? state.data : null
  const failed = state.status === 'error'

  const dietsBySlug = useMemo(
    () => new Map((catalogue?.diets ?? []).map((diet) => [diet.slug, diet] as const)),
    [catalogue],
  )
  const knownDietSlugs = useMemo(
    () => (catalogue ? new Set(dietsBySlug.keys()) : undefined),
    [catalogue, dietsBySlug],
  )
  const params = useMemo(
    () => parseRecipeFilterParams(searchParams, { knownDietSlugs }),
    [searchParams, knownDietSlugs],
  )
  // What the user typed, verbatim: `parse` trims, and a trailing space mid-phrase must survive.
  const rawQuery = searchParams.get(RECIPE_FILTER_PARAM_KEYS.query) ?? ''

  const seasonalModule = seasonal.status === 'ready' ? seasonal.data : undefined
  const inSeasonSlugs = useMemo(
    () => seasonalModule?.inSeasonSlugs(currentMonth),
    [seasonalModule, currentMonth],
  )
  // `?season=now` needs the produce calendar; until it arrives, show the skeleton (a failed
  // calendar load falls back to the list without the season criterion).
  const waitingForSeason = params.season === true && seasonal.status === 'loading'

  const results = useMemo(() => {
    if (!catalogue) return []
    const sorted = sortRecipes(
      filterRecipes(catalogue.recipes, { ...params, lang, inSeasonSlugs }),
      lang,
    )
    return params.season === true && inSeasonSlugs ? boostInSeason(sorted, inSeasonSlugs) : sorted
  }, [catalogue, params, lang, inSeasonSlugs])

  function commit(next: RecipeFilterParams, options: { replace: boolean }) {
    const out = serializeRecipeFilterParams(next)
    if (next.query !== '') out.set(RECIPE_FILTER_PARAM_KEYS.query, next.query)
    setSearchParams(out, options)
  }
  const toggleDiet = (slug: string) =>
    commit(
      {
        ...params,
        query: rawQuery,
        dietSlugs: params.dietSlugs.includes(slug)
          ? params.dietSlugs.filter((s) => s !== slug)
          : [...params.dietSlugs, slug],
      },
      { replace: false },
    )
  const toggleMeal = (meal: MealType) =>
    commit(
      {
        ...params,
        query: rawQuery,
        mealTypes: params.mealTypes.includes(meal)
          ? params.mealTypes.filter((m) => m !== meal)
          : [...params.mealTypes, meal],
      },
      { replace: false },
    )
  const setQuery = (query: string) => commit({ ...params, query }, { replace: true })
  const clear = () => commit({ dietSlugs: [], mealTypes: [], query: '' }, { replace: false })

  const canClear = !isEmptyRecipeFilter({ ...params, query: rawQuery })

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-3">
        <h1 className="font-display text-3xl font-semibold text-olive-950">{t.recipesTitle}</h1>
        <p className="max-w-2xl leading-relaxed text-olive-700">{t.recipesIntro}</p>
        <DraftRibbon kind={source.kind} />
      </header>

      <SeasonStrip
        month={currentMonth}
        activeIngredients={params.ingredientSlugs}
        seasonActive={params.season === true}
      />

      {(state.status === 'loading' || (catalogue && waitingForSeason)) && (
        <Loading variant="list" />
      )}

      {failed && <ErrorState message={t.loadFailed} onRetry={state.reload} />}

      {catalogue && !waitingForSeason && (
        <>
          <section className="flex flex-col gap-5">
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium tracking-wide text-sage-700 uppercase">
                {t.filterByDiet}
              </legend>
              <div className="flex flex-wrap gap-2">
                {catalogue.diets.map((diet) => (
                  <Chip
                    key={diet.slug}
                    pressed={params.dietSlugs.includes(diet.slug)}
                    onClick={() => toggleDiet(diet.slug)}
                  >
                    {dietName(diet, lang)}
                  </Chip>
                ))}
              </div>
            </fieldset>

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium tracking-wide text-sage-700 uppercase">
                {t.filterByMeal}
              </legend>
              <div className="flex flex-wrap gap-2">
                {MEAL_TYPES.map((meal) => (
                  <Chip
                    key={meal}
                    pressed={params.mealTypes.includes(meal)}
                    onClick={() => toggleMeal(meal)}
                  >
                    {t.meals[meal]}
                  </Chip>
                ))}
              </div>
            </fieldset>

            <div className="flex max-w-md flex-col gap-1.5">
              <label htmlFor={SEARCH_ID} className="text-sm font-medium text-olive-900">
                {t.searchRecipes}
              </label>
              <input
                id={SEARCH_ID}
                type="search"
                value={rawQuery}
                onChange={(event) => setQuery(event.target.value)}
                autoComplete="off"
                className="rounded-xl border border-olive-900/20 bg-paper-50 px-3.5 py-2 text-olive-950 shadow-sm focus:border-sage-600 focus:ring-2 focus:ring-sage-500/40 focus:outline-none"
              />
            </div>
          </section>

          {params.season === true && (
            <p className="max-w-2xl text-sm text-olive-700">{t.seasonFilterNote}</p>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <p role="status" aria-live="polite" className="text-sm font-medium text-olive-700">
              {plural(t.resultsCount, results.length)}
            </p>
            {canClear && (
              <button
                type="button"
                onClick={clear}
                className="text-sm font-medium text-olive-900 underline hover:text-olive-700"
              >
                {t.clearFilters}
              </button>
            )}
          </div>

          {results.length === 0 ? (
            <EmptyState title={t.noRecipesMatch} icon="✿" />
          ) : (
            <ul aria-label={t.recipesTitle} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((recipe) => (
                <RecipeCard key={recipe.slug} recipe={recipe} dietsBySlug={dietsBySlug} />
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  )
}
