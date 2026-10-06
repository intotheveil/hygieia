// RECIPE DETAIL `/recipes/:slug` (P3.2). Localized title, meta (portions · minutes · meals),
// diet chips linking to the diet's own page (`/diets/<slug>`, P4.4 — PLAN P4.4 and the P3/P4
// review), ingredient lines formatted by ./format.ts, steps in order, and a favourite button
// through the per-user source (the bilingual note when that source is disabled). Under the
// ingredients, the nutrition and cost panels (P4.3) run the pure engines on the recipe's own
// resolved lines — no extra fetch — and share ONE per-portion / per-recipe toggle. Unknown slug →
// the app's NotFound. `source` is a prop (default: the app's `contentSource`) so tests can inject.
//
// FRAME FIRST (perf, 2026-10-06). The back link and the draft ribbon do not depend on the recipe,
// so they paint in the FIRST frame, before the seed tables (recipes + ingredients + diets and their
// overlays) download; the title, meta, favourite button and body arrive with the data. The ribbon
// is the route's LCP element: painted at once it no longer waits for — and Lantern no longer charges
// it — every seed byte. It sits ABOVE the title so its node keeps its position across loading →
// loaded (one <main>/<header> for every state: no layout shift, no remount). Under the supabase
// source the ribbon depends on the row's status, so it appears with the data (admins only).
//
// A recipe with an `image_path` gets a 4:3 hero photo at the top of the body (srcset 480w/960w).

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
import { fill, plural } from '../i18n/fill.ts'
import { useAsyncResult } from '../lib/useAsync.ts'
import { computeNutrition } from '../nutrition/compute.ts'
import { NotFound } from '../routes/routes'
import { useUserData } from '../user/useUserData'
import { CostPanel } from './CostPanel'
import { recipeTitle } from './filter.ts'
import { dietName, formatRecipeLine } from './format.ts'
import { NutritionPanel } from './NutritionPanel'
import { photoHeight, recipePhotoSrc, recipePhotoSrcSet } from './photo.ts'
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

  if (state.status === 'ready' && state.data.recipe === null) return <NotFound />
  const recipe = state.status === 'ready' ? state.data.recipe : null

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-4">
        <Link to="/recipes" className="text-sm font-medium text-olive-700 hover:text-olive-900">
          ← {t.recipesTitle}
        </Link>
        <DraftRibbon kind={source.kind} status={recipe?.status} />
        {recipe !== null && <RecipeHeading recipe={recipe} />}
      </header>
      {state.status === 'loading' && <Loading variant="detail" />}
      {state.status === 'error' && <ErrorState message={t.loadFailed} onRetry={state.reload} />}
      {state.status === 'ready' && recipe !== null && (
        <RecipeBody recipe={recipe} diets={state.data.diets} />
      )}
    </main>
  )
}

/** Title, meta line and favourite button — the part of the header that needs the recipe. */
function RecipeHeading({ recipe }: { recipe: Recipe }) {
  const { lang, t } = useLang()
  return (
    <>
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
      <FavouriteButton recipeId={recipe.id} />
    </>
  )
}

function RecipeBody({ recipe, diets }: { recipe: Recipe; diets: Diet[] }) {
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
    <>
      {recipe.image_path && (
        // The hero is this route's LCP element and its URL is known only once the recipe loads, so
        // phones get the 480w file whatever their DPR (Lighthouse mobile: 960w cost ~0.65 s of LCP
        // load time and the route fell to 82); from 48rem up the srcset picks 480w or 960w.
        <picture>
          <source media="(max-width: 47.99rem)" srcSet={recipePhotoSrc(recipe.image_path, 480)} />
          <img
            src={recipePhotoSrc(recipe.image_path, 960)}
            srcSet={recipePhotoSrcSet(recipe.image_path)}
            sizes="720px"
            width={960}
            height={photoHeight(960)}
            decoding="async"
            fetchPriority="high"
            alt={fill(t.recipePhotoAlt, { title: recipeTitle(recipe, lang) })}
            className="aspect-[4/3] w-full rounded-2xl bg-paper-100 object-cover shadow-sm"
          />
        </picture>
      )}

      {recipe.diet_slugs.length > 0 && (
        <section aria-labelledby="recipe-diets" className="flex flex-col gap-3">
          <h2 id="recipe-diets" className="font-display text-xl font-semibold text-olive-950">
            {t.dietTags}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {recipe.diet_slugs.map((slug) => {
              const diet = dietsBySlug.get(slug)
              return (
                <li key={slug}>
                  <Link
                    to={`/diets/${slug}`}
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
    </>
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
