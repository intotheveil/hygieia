// DIET DETAIL `/diets/:slug` (P4.4 + P4.6): what the diet is, the five lists (allowed, avoided,
// pros, cons, who should avoid it), the medical disclaimer, the source (or "pending"), the recipes
// tagged with it (plain links — P3.5 may swap in RecipeCard) and the weekly plan generator
// (plans/PlanView.tsx). An unknown slug renders the app's NotFound. `source` is injectable for tests.

import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DraftRibbon } from '../components/DraftRibbon'
import {
  contentSource,
  type ContentSource,
  type Diet,
  type Ingredient,
  type Recipe,
  type Result,
} from '../content/index.ts'
import { useLang } from '../i18n/LangProvider'
import type { Lang } from '../i18n/dictionary'
import { useAsync } from '../lib/useAsync'
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

interface Loaded {
  diet: Diet | null
  recipes: Recipe[]
  ingredients: Ingredient[]
}

async function loadDiet(source: ContentSource, slug: string): Promise<Result<Loaded>> {
  const [diets, recipes, ingredients] = await Promise.all([
    source.listDiets(),
    source.listRecipes({ dietSlugs: [slug] }),
    source.listIngredients(),
  ])
  if (!diets.ok) return diets
  if (!recipes.ok) return recipes
  if (!ingredients.ok) return ingredients
  return {
    ok: true,
    data: {
      diet: diets.data.find((row) => row.slug === slug) ?? null,
      recipes: recipes.data,
      ingredients: ingredients.data,
    },
  }
}

const SHELL = 'mx-auto flex min-h-dvh max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6'

export function DietPage({ source = contentSource }: { source?: ContentSource }) {
  const { t, lang } = useLang()
  const { slug = '' } = useParams<{ slug: string }>()
  const load = useCallback(() => loadDiet(source, slug), [source, slug])
  const { state, reload } = useAsync(load)

  if (state.status === 'loading') {
    return (
      <main className={SHELL}>
        <p role="status" className="text-olive-700">
          {t.loading}
        </p>
      </main>
    )
  }
  if (!state.value.ok) {
    return (
      <main className={SHELL}>
        <div role="alert" className="flex flex-col items-start gap-3 text-olive-900">
          <p>{t.loadFailed}</p>
          <button
            type="button"
            onClick={reload}
            className="rounded-full bg-olive-900 px-4 py-1.5 text-sm font-medium text-paper-50 hover:bg-olive-700"
          >
            {t.retry}
          </button>
        </div>
      </main>
    )
  }
  const { diet, recipes, ingredients } = state.value.data
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
          <p className="leading-relaxed text-olive-700">{dietSummary(diet, lang)}</p>
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

      <section aria-labelledby="diet-recipes" className="flex flex-col gap-3">
        <h2 id="diet-recipes" className="font-display text-xl font-semibold text-olive-950">
          {t.recipesForDiet}
        </h2>
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
      </section>

      <section aria-labelledby="diet-plan" className="flex flex-col gap-3">
        <h2 id="diet-plan" className="font-display text-xl font-semibold text-olive-950">
          {t.generatePlan}
        </h2>
        <p className="text-sm leading-relaxed text-olive-700">{t.generatePlanIntro}</p>
        <PlanView diet={diet} recipes={recipes} ingredients={ingredients} />
      </section>
    </main>
  )
}
