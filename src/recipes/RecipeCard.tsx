// RECIPE CARD (P3.1): one entry of the recipes grid — localized title linking to the detail page,
// portions, minutes, meal types and diet chips. Diet names come from the loaded catalogue so the
// chip reads "Κετογονική διατροφή (keto)" and not the slug; an unknown slug falls back to itself.

import { Link } from 'react-router-dom'
import type { Diet, Recipe } from '../content/source.ts'
import { useLang } from '../i18n/LangProvider'
import { plural } from '../i18n/fill.ts'
import { recipeTitle } from './filter.ts'
import { dietName } from './format.ts'

export interface RecipeCardProps {
  recipe: Recipe
  /** The diet catalogue by slug, for chip labels. */
  dietsBySlug: ReadonlyMap<string, Diet>
}

export function RecipeCard({ recipe, dietsBySlug }: RecipeCardProps) {
  const { lang, t } = useLang()
  return (
    <li className="relative flex flex-col gap-3 rounded-2xl border border-olive-900/10 bg-paper-50/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <h2 className="font-display text-lg leading-snug font-semibold text-olive-950">
        <Link
          to={`/recipes/${recipe.slug}`}
          className="after:absolute after:inset-0 hover:underline focus-visible:underline"
        >
          {recipeTitle(recipe, lang)}
        </Link>
      </h2>
      <p className="text-sm text-olive-700">
        <span>{plural(t.portions, recipe.portions)}</span>
        <span aria-hidden="true"> · </span>
        <span>{plural(t.minutes, recipe.prep_min)}</span>
        <span aria-hidden="true"> · </span>
        <span>{recipe.meal_types.map((meal) => t.meals[meal]).join(', ')}</span>
      </p>
      {recipe.diet_slugs.length > 0 && (
        <p className="flex flex-wrap gap-1.5">
          {recipe.diet_slugs.map((slug) => {
            const diet = dietsBySlug.get(slug)
            return (
              <span
                key={slug}
                className="rounded-full bg-sage-500/15 px-2 py-0.5 text-xs font-medium text-sage-700"
              >
                {diet ? dietName(diet, lang) : slug}
              </span>
            )
          })}
        </p>
      )}
    </li>
  )
}
