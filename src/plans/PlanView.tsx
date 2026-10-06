// WEEKLY PLAN VIEW (P4.6): the UI over plans/generate.ts. Seeded, so a plan is reproducible:
// `seed` lives in component state (initialised from `Date.now()`, or `initialSeed` in tests) and
// "Reshuffle" derives the next seed from the current one. 7 days × 3 meals as a table with recipe
// links, per-day totals rounded for display, the generator's warnings in words, and the shopping
// list. "Save plan" writes `{ diet_id, week_start, plan }` through the UserDataSource; when the
// source is disabled the bilingual note replaces the button. Only slugs are persisted (see
// `serializePlan`): a saved plan must not freeze a copy of every recipe.

import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SignedOutNote } from '../components/SignedOutNote'
import type { Diet, Ingredient, Recipe } from '../content/index.ts'
import { useLang } from '../i18n/LangProvider'
import type { Lang } from '../i18n/dictionary'
import type { Macros } from '../nutrition/compute.ts'
import type { JsonValue, UserDataSource } from '../user/source'
import { useUserData } from '../user/useUserData'
import {
  PLAN_MEALS,
  generateWeekPlan,
  mulberry32,
  nextMonday,
  type PlanMeal,
  type WeekPlan,
} from './generate.ts'

export interface PlanViewProps {
  diet: Diet
  recipes: readonly Recipe[]
  ingredients: readonly Ingredient[]
  /** Fixed seed for tests; the app leaves it unset and starts from `Date.now()`. */
  initialSeed?: number
  /** "Today" for the week_start computation; the app leaves it unset. */
  today?: Date
  /** Injected per-user source for tests; the app reads `useUserData()`. */
  source?: UserDataSource
}

/** A different 31-bit seed derived deterministically from the current one (never equal to it). */
export function nextSeed(seed: number): number {
  const candidate = Math.floor(mulberry32(seed)() * 0x7fffffff)
  return candidate === seed ? (candidate + 1) | 0 : candidate
}

/**
 * The persisted shape: recipe SLUGS, not recipe copies, plus the day totals so a saved plan can be
 * listed without recomputing. Deliberately a plain object literal so it is a `JsonValue` by
 * construction (no `undefined` anywhere).
 */
export function serializePlan(plan: WeekPlan): JsonValue {
  return {
    dietSlug: plan.dietSlug,
    weekStart: plan.weekStart,
    seed: plan.seed,
    days: plan.days.map((day) => ({
      index: day.index,
      slots: {
        breakfast: day.slots.breakfast?.slug ?? null,
        lunch: day.slots.lunch?.slug ?? null,
        dinner: day.slots.dinner?.slug ?? null,
      },
      totals: {
        kcal: day.totals.kcal,
        protein: day.totals.protein,
        carbs: day.totals.carbs,
        fat: day.totals.fat,
      },
    })),
    warnings: plan.warnings.map((w) => ({ day: w.day, meal: w.meal, reason: w.reason })),
  }
}

function title(recipe: Recipe, lang: Lang): string {
  return lang === 'el' ? recipe.title_el : recipe.title_en
}

function formatQuantity(quantity: number): string {
  const rounded = Math.round(quantity * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

function formatDate(iso: string, lang: Lang): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(lang === 'el' ? 'el-GR' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

type SaveState = 'idle' | 'saving' | 'saved' | 'failed'

export function PlanView({
  diet,
  recipes,
  ingredients,
  initialSeed,
  today,
  source,
}: PlanViewProps) {
  const { t, lang } = useLang()
  const fromHook = useUserData()
  const userData = source ?? fromHook
  const [seed, setSeed] = useState(() => initialSeed ?? Date.now() % 0x7fffffff)
  const [weekStart] = useState(() => nextMonday(today ?? new Date()))
  const [saveState, setSaveState] = useState<SaveState>('idle')

  const plan = useMemo(
    () => generateWeekPlan(diet.slug, recipes, ingredients, { seed, days: 7, weekStart }),
    [diet.slug, recipes, ingredients, seed, weekStart],
  )
  const bySlug = useMemo(() => new Map(recipes.map((r) => [r.slug, r])), [recipes])

  const reshuffle = useCallback(() => {
    setSeed((current) => nextSeed(current))
    setSaveState('idle')
  }, [])

  const save = useCallback(async () => {
    setSaveState('saving')
    const result = await userData.savedPlans.save({
      diet_id: diet.id,
      week_start: weekStart,
      plan: serializePlan(plan),
    })
    setSaveState(result.ok ? 'saved' : 'failed')
  }, [userData, diet.id, weekStart, plan])

  // One line per meal with no recipe at all, one per meal with a small pool — not one per day.
  const missingMeals = PLAN_MEALS.filter((meal) =>
    plan.warnings.some((w) => w.meal === meal && w.reason === 'no-recipe-for-meal'),
  )
  const smallPools = PLAN_MEALS.filter((meal) =>
    plan.warnings.some((w) => w.meal === meal && w.reason === 'pool-too-small'),
  )

  return (
    <div data-seed={seed} className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={reshuffle}
          className="rounded-full border border-olive-900/20 bg-paper-50/70 px-4 py-1.5 text-sm font-medium text-olive-900 hover:bg-paper-50"
        >
          {t.reshuffle}
        </button>
        {userData.kind === 'disabled' ? (
          <SignedOutNote reason={userData.reason ?? 'signed-out'} />
        ) : (
          <button
            type="button"
            onClick={() => void save()}
            disabled={saveState === 'saving' || saveState === 'saved'}
            className="rounded-full bg-olive-900 px-4 py-1.5 text-sm font-medium text-paper-50 hover:bg-olive-700 disabled:opacity-60"
          >
            {saveState === 'saving' ? t.saving : saveState === 'saved' ? t.saved : t.savePlan}
          </button>
        )}
        {saveState === 'saved' ? (
          <p role="status" className="text-sm text-sage-700">
            {t.planSaved}
          </p>
        ) : saveState === 'failed' ? (
          <p role="alert" className="text-sm text-clay-700">
            {t.saveFailed}
          </p>
        ) : null}
      </div>

      {missingMeals.length > 0 || smallPools.length > 0 ? (
        <ul aria-label="warnings" className="flex flex-col gap-1 text-sm text-amber-900">
          {missingMeals.map((meal) => (
            <li
              key={`missing-${meal}`}
              className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2"
            >
              {t.planWarningNoRecipe} {t.mealNames[meal].toLowerCase()}.
            </li>
          ))}
          {smallPools.map((meal) => (
            <li
              key={`small-${meal}`}
              className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2"
            >
              {t.planWarningSmallPool} {t.mealNames[meal].toLowerCase()}.
            </li>
          ))}
        </ul>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-olive-900/10 bg-paper-50/80">
        <table className="w-full text-sm text-olive-900">
          <caption className="px-4 py-3 text-left font-medium text-olive-700">
            {t.weekOf} {formatDate(weekStart, lang)}
          </caption>
          <thead>
            <tr className="border-b border-olive-900/10 text-left text-xs tracking-wide text-olive-700 uppercase">
              <th scope="col" className="px-4 py-2" />
              {PLAN_MEALS.map((meal) => (
                <th key={meal} scope="col" className="px-4 py-2">
                  {t.mealNames[meal]}
                </th>
              ))}
              <th scope="col" className="px-4 py-2">
                {t.dailyTotal}
              </th>
            </tr>
          </thead>
          <tbody>
            {plan.days.map((day) => (
              <tr key={day.index} className="border-b border-olive-900/5 align-top last:border-0">
                <th scope="row" className="px-4 py-3 font-medium whitespace-nowrap">
                  {t.dayNames[day.index % 7]}
                </th>
                {PLAN_MEALS.map((meal) => (
                  <Slot
                    key={meal}
                    meal={meal}
                    recipe={day.slots[meal]}
                    bySlug={bySlug}
                    lang={lang}
                    empty={t.planEmptySlot}
                  />
                ))}
                <td className="px-4 py-3 text-xs leading-relaxed whitespace-nowrap text-olive-700">
                  <Totals totals={day.totals} labels={t.planMacros} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section aria-labelledby="plan-shopping" className="flex flex-col gap-2">
        <h3 id="plan-shopping" className="font-display text-lg font-semibold text-olive-950">
          {t.shoppingList}
        </h3>
        <ul className="grid gap-1 text-sm text-olive-900 sm:grid-cols-2 lg:grid-cols-3">
          {plan.shoppingList.map((line) => (
            <li
              key={`${line.ingredient_slug}-${line.unit}`}
              className="flex justify-between gap-3 rounded-lg bg-paper-200/60 px-3 py-1.5"
            >
              <span>{lang === 'el' ? line.name_el : line.name_en}</span>
              <span className="whitespace-nowrap text-olive-700 tabular-nums">
                {formatQuantity(line.quantity)} {line.unit}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Slot({
  meal,
  recipe,
  bySlug,
  lang,
  empty,
}: {
  meal: PlanMeal
  recipe: { slug: string } | null
  bySlug: ReadonlyMap<string, Recipe>
  lang: Lang
  empty: string
}) {
  const full = recipe ? bySlug.get(recipe.slug) : undefined
  return (
    <td data-testid="plan-slot" data-meal={meal} className="px-4 py-3">
      {full ? (
        <Link
          to={`/recipes/${full.slug}`}
          className="font-medium text-olive-900 underline-offset-2 hover:underline"
        >
          {title(full, lang)}
        </Link>
      ) : (
        <span className="text-olive-700">{empty}</span>
      )}
    </td>
  )
}

function Totals({
  totals,
  labels,
}: {
  totals: Macros
  labels: { kcal: string; protein: string; carbs: string; fat: string }
}) {
  return (
    <>
      <span className="font-medium text-olive-900">
        {Math.round(totals.kcal)} {labels.kcal}
      </span>
      <br />
      {Math.round(totals.protein)} g {labels.protein} · {Math.round(totals.carbs)} g {labels.carbs}{' '}
      · {Math.round(totals.fat)} g {labels.fat}
    </>
  )
}
