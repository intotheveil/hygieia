// RECIPE DETAIL `/recipes/:slug` (P3.2). Localized title, meta (portions · minutes · meals),
// diet chips linking back to the filtered list (`/recipes?diet=<slug>`; `/diets/:slug` arrives
// in P4.4), ingredient lines formatted by ./format.ts, steps in order, and a favourite button
// through the per-user source (the bilingual note when that source is disabled). Under the
// ingredients, the nutrition and cost panels (P4.3) run the pure engines on the recipe's own
// resolved lines — no extra fetch — and share ONE per-portion / per-recipe toggle. Unknown slug →
// the app's NotFound. `source` is a prop (default: the app's `contentSource`) so tests can inject.

import { useCallback, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ErrorState, Loading } from '../components/AsyncState'
import { DraftRibbon } from '../components/DraftRibbon'
import { SignedOutNote } from '../components/SignedOutNote'
import { contentSource } from '../content/index.ts'
import {
  fail,
  ok,
  type ContentSource,
  type Diet,
  type Recipe,
  type Result,
} from '../content/source.ts'
import { computeCost } from '../cost/compute.ts'
import { indexBySlug } from '../fridge/match.ts'
import { useLang } from '../i18n/LangProvider'
import { plural } from '../i18n/fill.ts'
import { useAsyncResult } from '../lib/useAsync.ts'
import { computeNutrition } from '../nutrition/compute.ts'
import { NotFound } from '../routes/routes'
import { useUserData } from '../user/useUserData'
import { CostPanel } from './CostPanel'
import { recipeTitle, serializeRecipeFilterParams } from './filter.ts'
import { dietName, formatRecipeLine } from './format.ts'
import { NutritionPanel } from './NutritionPanel'
import type { Scope } from './panelFormat.ts'

export interface RecipePageProps {
  source?: ContentSource
}

interface Loaded {
  /** null when no visible recipe has the slug. */
  recipe: Recipe | null
  diets: Diet[]
}

async function loadRecipe(source: ContentSource, slug: string): Promise<Result<Loaded>> {
  const [recipe, diets] = await Promise.all([source.getRecipe(slug), source.listDiets()])
  if (!recipe.ok) return fail(recipe.error)
  if (!diets.ok) return fail(diets.error)
  return ok({ recipe: recipe.data, diets: diets.data })
}

const BUTTON = 'rounded-full px-5 py-2 text-sm font-medium transition'

export function RecipePage({ source = contentSource }: RecipePageProps) {
  const { slug = '' } = useParams<{ slug: string }>()
  const { t } = useLang()
  const load = useCallback(() => loadRecipe(source, slug), [source, slug])
  const state = useAsyncResult(load)

  if (state.status === 'loading') {
    return (
      <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
        <Loading variant="detail" />
      </main>
    )
  }

  if (state.status === 'error') {
    return (
      <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
        <ErrorState message={t.loadFailed} onRetry={state.reload} />
      </main>
    )
  }

  const { recipe, diets } = state.data
  if (recipe === null) return <NotFound />
  return <RecipeView recipe={recipe} diets={diets} kind={source.kind} />
}

function RecipeView({
  recipe,
  diets,
  kind,
}: {
  recipe: Recipe
  diets: Diet[]
  kind: ContentSource['kind']
}) {
  const { lang, t } = useLang()
  const dietsBySlug = new Map(diets.map((diet) => [diet.slug, diet] as const))
  const steps = lang === 'el' ? recipe.steps_el : recipe.steps_en

  // The engines read the catalogue by slug; the recipe row already carries every visible
  // ingredient on its lines (a hidden one is `null` and so lands in `unknown` / `unpriced`).
  const [scope, setScope] = useState<Scope>('portion')
  const ingredientsBySlug = useMemo(
    () =>
      indexBySlug(
        recipe.lines.flatMap((recipeLine) =>
          recipeLine.ingredient === null ? [] : [recipeLine.ingredient],
        ),
      ),
    [recipe],
  )
  const nutrition = useMemo(
    () => computeNutrition(recipe, ingredientsBySlug),
    [recipe, ingredientsBySlug],
  )
  const cost = useMemo(() => computeCost(recipe, ingredientsBySlug), [recipe, ingredientsBySlug])

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-4">
        <Link to="/recipes" className="text-sm font-medium text-olive-700 hover:text-olive-900">
          ← {t.recipesTitle}
        </Link>
        <h1 className="font-display text-3xl leading-tight font-semibold text-olive-950 text-balance sm:text-4xl">
          {recipeTitle(recipe, lang)}
        </h1>
        <p className="text-olive-700">
          <span>{plural(t.portions, recipe.portions)}</span>
          <span aria-hidden="true"> · </span>
          <span>{plural(t.minutes, recipe.prep_min)}</span>
          <span aria-hidden="true"> · </span>
          <span>
            {t.mealTypes}: {recipe.meal_types.map((meal) => t.meals[meal]).join(', ')}
          </span>
        </p>
        <DraftRibbon kind={kind} status={recipe.status} />
        <FavouriteButton recipeId={recipe.id} />
      </header>

      {recipe.diet_slugs.length > 0 && (
        <section aria-labelledby="recipe-diets" className="flex flex-col gap-3">
          <h2 id="recipe-diets" className="font-display text-xl font-semibold text-olive-950">
            {t.dietTags}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {recipe.diet_slugs.map((slug) => {
              const diet = dietsBySlug.get(slug)
              const search = serializeRecipeFilterParams({ dietSlugs: [slug] }).toString()
              return (
                <li key={slug}>
                  <Link
                    to={`/recipes?${search}`}
                    className="inline-block rounded-full bg-sage-500/15 px-3 py-1 text-sm font-medium text-sage-700 hover:bg-sage-500/25"
                  >
                    {diet ? dietName(diet, lang) : slug}
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <section aria-labelledby="recipe-ingredients" className="flex flex-col gap-3">
        <h2 id="recipe-ingredients" className="font-display text-xl font-semibold text-olive-950">
          {t.ingredients}
        </h2>
        <ul className="flex flex-col gap-1.5 rounded-2xl border border-olive-900/10 bg-paper-50/80 p-5 text-olive-900">
          {recipe.lines.map((recipeLine, index) => (
            <li key={`${recipeLine.line.ingredient_slug}-${index}`}>
              {formatRecipeLine(recipeLine, lang, t)}
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col gap-6">
        <NutritionPanel result={nutrition} scope={scope} onScopeChange={setScope} />
        <CostPanel result={cost} scope={scope} ingredientsBySlug={ingredientsBySlug} />
      </div>

      <section aria-labelledby="recipe-steps" className="flex flex-col gap-3">
        <h2 id="recipe-steps" className="font-display text-xl font-semibold text-olive-950">
          {t.steps}
        </h2>
        <ol className="flex list-decimal flex-col gap-3 pl-6 leading-relaxed text-olive-900">
          {steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      </section>
    </main>
  )
}

type SaveOutcome = 'idle' | 'busy' | 'failed'

/**
 * Add/remove the recipe in the user's favourites. With a disabled source (local-only build or no
 * session) the click shows the bilingual note instead of failing silently; the button itself is
 * never `disabled`, so the explanation is one click away for keyboard and pointer alike.
 */
function FavouriteButton({ recipeId }: { recipeId: string }) {
  const { t } = useLang()
  const user = useUserData()
  const listFavourites = useCallback(() => user.favourites.list(), [user])
  const state = useAsyncResult(listFavourites)
  const [showNote, setShowNote] = useState(false)
  const [outcome, setOutcome] = useState<SaveOutcome>('idle')

  const isFavourite =
    state.status === 'ready' && state.data.some((favourite) => favourite.recipe_id === recipeId)

  async function toggle(): Promise<void> {
    if (user.kind === 'disabled') {
      setShowNote(true)
      return
    }
    setOutcome('busy')
    const result = isFavourite
      ? await user.favourites.remove(recipeId)
      : await user.favourites.add(recipeId)
    setOutcome(result.ok ? 'idle' : 'failed')
    if (result.ok) state.reload()
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        aria-pressed={isFavourite}
        aria-busy={outcome === 'busy'}
        onClick={() => void toggle()}
        className={`${BUTTON} ${
          isFavourite
            ? 'bg-olive-900 text-paper-50 hover:bg-olive-700'
            : 'border border-olive-900/20 bg-paper-50/70 text-olive-900 hover:bg-paper-50'
        }`}
      >
        {isFavourite ? t.removeFromFavourites : t.addToFavourites}
      </button>
      {showNote && user.kind === 'disabled' && (
        <SignedOutNote reason={user.reason ?? 'signed-out'} />
      )}
      {outcome === 'failed' && (
        <p role="alert" className="text-sm text-clay-700">
          {t.favouriteFailed}
        </p>
      )}
    </div>
  )
}
