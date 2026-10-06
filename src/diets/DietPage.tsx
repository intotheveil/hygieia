// DIET DETAIL `/diets/:slug` (P4.4 + P4.6): what the diet is, the five lists (allowed, avoided,
// pros, cons, who should avoid it), the medical disclaimer, the source (or "pending"), the recipes
// tagged with it (plain links — P3.5 may swap in RecipeCard) and the weekly plan generator
// (plans/PlanView.tsx). An unknown slug renders the app's NotFound. `source` is injectable for
// tests.
//
// TWO-STAGE LOAD (perf, 2026-10-06 — CI diet 84): the frame (name, summary, the five lists, the
// disclaimer, the source) needs only the diets table, so it renders as soon as `listDiets()`
// answers; the recipes + ingredients that the recipe list and the plan generator need are read by
// `DietRecipesAndPlan`, which mounts WITH the frame and starts its reads once the frame is ON
// SCREEN (`afterElementPainted(DIET_FRAME)` on the summary paragraph, lib/afterPaint.ts), so their
// seed chunks (62 kB gzip of the 86 kB) download after the above-the-fold frame instead of in front
// of it — on a slow network they no longer share its bandwidth. While they load, one list skeleton
// stands where the two sections go (below the fold on a phone); once loaded the two sections render
// exactly as before, so `#diet-recipes` still means "the page has settled". A failure of the second
// stage shows the shared ErrorState (with Retry) in that slot; the frame stays, because the diet
// itself did load.

import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EmptyState, ErrorState, Loading } from '../components/AsyncState'
import { DraftRibbon } from '../components/DraftRibbon'
import {
  contentSource,
  type ContentSource,
  type Diet,
  type Ingredient,
  type Recipe,
  type Result,
} from '../content/index.ts'
import { ok } from '../content/source.ts'
import { useLang } from '../i18n/LangProvider'
import type { Lang } from '../i18n/app'
import { afterElementPainted } from '../lib/afterPaint'
import { useAsyncResult } from '../lib/useAsync'
import { PlanView } from '../plans/PlanView'
import { NotFound } from '../routes/routes'
import { dietName, dietSummary } from './DietsPage'

type SectionKey = 'allowed' | 'avoided' | 'pros' | 'cons' | 'whoShouldAvoid'
type ListColumn = 'allowed' | 'avoided' | 'pros' | 'cons' | 'avoid_if'

/** The five list sections in page order: dictionary key → the diet's `*_el` / `*_en` column pair. */
const SECTIONS: ReadonlyArray<{ key: SectionKey; column: ListColumn }> = [
  { key: 'allowed', column: 'allowed' },
  { key: 'avoided', column: 'avoided' },
  { key: 'pros', column: 'pros' },
  { key: 'cons', column: 'cons' },
  { key: 'whoShouldAvoid', column: 'avoid_if' },
]

function listFor(diet: Diet, column: ListColumn, lang: Lang): string[] {
  return diet[`${column}_${lang}`]
}

export function recipeTitle(recipe: Recipe, lang: Lang): string {
  return lang === 'el' ? recipe.title_el : recipe.title_en
}

/** Stage 1 — the diet row (null when no visible diet has the slug). */
async function loadDiet(source: ContentSource, slug: string): Promise<Result<Diet | null>> {
  const diets = await source.listDiets()
  if (!diets.ok) return diets
  return ok(diets.data.find((row) => row.slug === slug) ?? null)
}

interface PlanData {
  recipes: Recipe[]
  ingredients: Ingredient[]
}

/** Stage 2 — the recipes tagged with the diet + the ingredient catalogue the plan prices with. */
async function loadPlanData(source: ContentSource, slug: string): Promise<Result<PlanData>> {
  const [recipes, ingredients] = await Promise.all([
    source.listRecipes({ dietSlugs: [slug] }),
    source.listIngredients(),
  ])
  if (!recipes.ok) return recipes
  if (!ingredients.ok) return ingredients
  return ok({ recipes: recipes.data, ingredients: ingredients.data })
}

/** Element Timing id of the frame's summary paragraph — stage 2 waits for it to be on screen. */
const DIET_FRAME = 'diet-frame'

const SHELL = 'mx-auto flex min-h-dvh max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6'

export function DietPage({ source = contentSource }: { source?: ContentSource }) {
  const { t, lang } = useLang()
  const { slug = '' } = useParams<{ slug: string }>()
  const load = useCallback(() => loadDiet(source, slug), [source, slug])
  const state = useAsyncResult(load)

  if (state.status === 'loading') {
    return (
      <main className={SHELL}>
        <Loading variant="detail" />
      </main>
    )
  }
  if (state.status === 'error') {
    return (
      <main className={SHELL}>
        <ErrorState message={t.loadFailed} onRetry={state.reload} />
      </main>
    )
  }
  const diet = state.data
  if (diet === null) return <NotFound />

  return (
    <main className={SHELL}>
      <nav aria-label={t.dietsTitle}>
        <Link to="/diets" className="text-sm font-medium text-olive-700 underline">
          ← {t.dietsTitle}
        </Link>
      </nav>

      <header className="flex flex-col gap-3">
        <h1 className="font-display text-3xl font-semibold text-olive-950">
          {dietName(diet, lang)}
        </h1>
        <DraftRibbon kind={source.kind} status={diet.status} />
        <section aria-labelledby="diet-what" className="flex flex-col gap-2">
          <h2 id="diet-what" className="font-display text-xl font-semibold text-olive-950">
            {t.whatItIs}
          </h2>
          <p elementtiming={DIET_FRAME} className="leading-relaxed text-olive-700">
            {dietSummary(diet, lang)}
          </p>
        </section>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
        {SECTIONS.map(({ key, column }) => (
          <section
            key={key}
            aria-labelledby={`diet-${key}`}
            className="flex flex-col gap-2 rounded-2xl border border-olive-900/10 bg-paper-50/80 p-5"
          >
            <h2 id={`diet-${key}`} className="font-display text-lg font-semibold text-olive-950">
              {t[key]}
            </h2>
            <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-olive-700">
              {listFor(diet, column, lang).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p
        role="note"
        className="rounded-2xl border border-clay-500/30 bg-clay-500/10 p-4 text-sm leading-relaxed text-olive-900"
      >
        {t.notMedicalAdvice}
      </p>

      <p className="text-sm text-olive-700">
        {diet.source_url ? (
          <>
            {t.source}:{' '}
            <a
              href={diet.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium break-all text-olive-900 underline"
            >
              {diet.source_url}
            </a>
          </>
        ) : (
          t.sourcePending
        )}
      </p>

      <DietRecipesAndPlan source={source} diet={diet} />
    </main>
  )
}

/** Stage 2 of the page (see the header): the recipes tagged with the diet and the plan generator. */
function DietRecipesAndPlan({ source, diet }: { source: ContentSource; diet: Diet }) {
  const { t, lang } = useLang()
  const load = useCallback(
    () => afterElementPainted(DIET_FRAME).then(() => loadPlanData(source, diet.slug)),
    [source, diet.slug],
  )
  const state = useAsyncResult(load)

  if (state.status === 'loading') return <Loading variant="list" />
  if (state.status === 'error') {
    return <ErrorState message={t.loadFailed} onRetry={state.reload} />
  }
  const { recipes, ingredients } = state.data

  return (
    <>
      <section aria-labelledby="diet-recipes" className="flex flex-col gap-3">
        <h2 id="diet-recipes" className="font-display text-xl font-semibold text-olive-950">
          {t.recipesForDiet}
        </h2>
        {recipes.length === 0 ? (
          <EmptyState title={t.noRecipesForDiet} icon="✿" />
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {recipes.map((recipe) => (
              <li key={recipe.slug}>
                <Link
                  to={`/recipes/${recipe.slug}`}
                  className="block rounded-xl bg-paper-200/60 px-4 py-2 text-sm font-medium text-olive-900 hover:bg-paper-200"
                >
                  {recipeTitle(recipe, lang)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="diet-plan" className="flex flex-col gap-3">
        <h2 id="diet-plan" className="font-display text-xl font-semibold text-olive-950">
          {t.generatePlan}
        </h2>
        <p className="text-sm leading-relaxed text-olive-700">{t.generatePlanIntro}</p>
        <PlanView diet={diet} recipes={recipes} ingredients={ingredients} />
      </section>
    </>
  )
}
