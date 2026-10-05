// FRIDGE PAGE `/fridge` (P3.4): the "What is in my fridge?" screen over the P3.3 matcher. The
// catalogue (ingredients + recipes) comes from `contentSource` once; the fridge (slugs + the
// staples switch) is plain state, written to `hygieia.fridge` in localStorage on EVERY change
// through storage.ts (guarded — a throwing storage only loses persistence). Results are DERIVED
// from (catalogue, fridge) with `matchRecipes`; nothing here re-implements a matching rule.
// "Save list" goes through `useUserData().fridgeLists` and shows the bilingual note when that is
// disabled (local-only build or signed out). Route wiring is P3.5's.

import { useCallback, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { DraftRibbon } from '../components/DraftRibbon'
import { SignedOutNote } from '../components/SignedOutNote'
import { contentSource, type Ingredient, type Recipe } from '../content/index.ts'
import type { IngredientSeed } from '../content/types.ts'
import { useLang } from '../i18n/LangProvider'
import type { Lang } from '../i18n/dictionary'
import { fill } from '../i18n/fill.ts'
import { useAsync } from '../lib/useAsync.ts'
import type { FridgeList } from '../user/source'
import { useUserData } from '../user/useUserData'
import { IngredientPicker, ingredientName } from './IngredientPicker.tsx'
import { indexBySlug, matchRecipes, type MatchResult } from './match.ts'
import {
  defaultFridgeState,
  loadFridgeState,
  saveFridgeState,
  type FridgeState,
} from './storage.ts'

interface Catalogue {
  ingredients: Ingredient[]
  recipes: Recipe[]
}

/** Module-level so its identity is stable: `useAsync` runs it once per mount. */
async function loadCatalogue(): Promise<Catalogue | null> {
  const [ingredients, recipes] = await Promise.all([
    contentSource.listIngredients(),
    contentSource.listRecipes(),
  ])
  if (!ingredients.ok || !recipes.ok) return null
  return { ingredients: ingredients.data, recipes: recipes.data }
}

/** `window.localStorage` itself can throw on access (blocked storage); treat that as "none". */
function fridgeStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

function recipeTitle(recipe: Recipe, lang: Lang): string {
  return lang === 'el' ? recipe.title_el : recipe.title_en
}

function names(ingredients: readonly IngredientSeed[], lang: Lang): string {
  return ingredients.map((i) => ingredientName(i, lang)).join(', ')
}

export function FridgePage() {
  const { t, lang } = useLang()
  const catalogue = useAsync(loadCatalogue)

  const [fridge, setFridge] = useState<FridgeState>(() => {
    const storage = fridgeStorage()
    return storage ? loadFridgeState(storage) : defaultFridgeState()
  })
  /** The one way the fridge changes: set state AND persist, in that order, on every change. */
  const commit = useCallback((next: FridgeState) => {
    setFridge(next)
    const storage = fridgeStorage()
    if (storage) saveFridgeState(storage, next)
  }, [])

  const add = (slug: string) => {
    if (fridge.slugs.includes(slug)) return
    commit({ ...fridge, slugs: [...fridge.slugs, slug] })
  }
  const remove = (slug: string) =>
    commit({ ...fridge, slugs: fridge.slugs.filter((s) => s !== slug) })
  const clearAll = () => commit({ ...fridge, slugs: [] })
  const setIgnoreStaples = (ignoreStaples: boolean) => commit({ ...fridge, ignoreStaples })

  const data = catalogue.status === 'ready' ? catalogue.data : null
  const haveSlugs = useMemo(() => new Set(fridge.slugs), [fridge.slugs])
  const bySlug = useMemo(() => indexBySlug(data?.ingredients ?? []), [data])
  const results = useMemo(
    () =>
      data === null
        ? []
        : matchRecipes(data.recipes, data.ingredients, haveSlugs, {
            ignorePantryStaples: fridge.ignoreStaples,
          }),
    [data, haveSlugs, fridge.ignoreStaples],
  )
  // Chips show what resolves in the catalogue; a stale slug stays stored but is invisible.
  const chips = fridge.slugs.flatMap((slug) => {
    const ingredient = bySlug.get(slug)
    return ingredient ? [ingredient] : []
  })

  const staplesId = 'fridge-ignore-staples'
  const staplesHintId = `${staplesId}-hint`

  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-3">
        <h1 className="font-display text-3xl font-semibold text-olive-950 sm:text-4xl">
          {t.fridgeTitle}
        </h1>
        <p className="max-w-2xl leading-relaxed text-olive-700">{t.fridgeIntro}</p>
      </header>

      {catalogue.status === 'loading' ? (
        <p role="status" className="text-olive-700">
          {t.loading}
        </p>
      ) : catalogue.status === 'error' || data === null ? (
        <p role="alert" className="text-clay-500">
          {t.fridgeLoadFailed}
        </p>
      ) : (
        <>
          <section
            aria-labelledby="fridge-ingredients"
            className="flex flex-col gap-5 rounded-2xl border border-olive-900/10 bg-paper-50/80 p-6 shadow-sm"
          >
            <h2 id="fridge-ingredients" className="sr-only">
              {t.yourIngredients}
            </h2>
            <IngredientPicker ingredients={data.ingredients} selected={haveSlugs} onAdd={add} />

            {chips.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-olive-900">{t.yourIngredients}</p>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-sm font-medium text-olive-700 underline hover:text-olive-950"
                  >
                    {t.clearAll}
                  </button>
                </div>
                <ul aria-label={t.yourIngredients} className="flex flex-wrap gap-2">
                  {chips.map((ingredient) => {
                    const name = ingredientName(ingredient, lang)
                    return (
                      <li
                        key={ingredient.slug}
                        className="flex items-center gap-1 rounded-full bg-sage-500/15 py-1 pr-1 pl-3 text-sm text-olive-950"
                      >
                        <span>{name}</span>
                        <button
                          type="button"
                          onClick={() => remove(ingredient.slug)}
                          aria-label={`${t.removeIngredient}: ${name}`}
                          className="grid size-6 place-items-center rounded-full text-olive-700 hover:bg-sage-500/25 hover:text-olive-950"
                        >
                          <span aria-hidden="true">×</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            <div className="flex items-start gap-3">
              <input
                id={staplesId}
                type="checkbox"
                checked={fridge.ignoreStaples}
                onChange={(event) => setIgnoreStaples(event.target.checked)}
                aria-describedby={staplesHintId}
                className="mt-1 size-4 accent-sage-600"
              />
              <div className="flex flex-col gap-0.5">
                <label htmlFor={staplesId} className="text-sm font-medium text-olive-900">
                  {t.ignoreStaples}
                </label>
                <p id={staplesHintId} className="text-xs leading-relaxed text-olive-700">
                  {t.ignoreStaplesHint}
                </p>
              </div>
            </div>
          </section>

          <section aria-labelledby="fridge-results" className="flex flex-col gap-4">
            <h2 id="fridge-results" className="sr-only">
              {t.coverage}
            </h2>
            <DraftRibbon kind={contentSource.kind} />
            {fridge.slugs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-olive-900/20 p-8 text-center">
                <p className="font-display text-xl text-olive-950">{t.fridgeEmpty}</p>
                <p className="mt-2 text-sm text-olive-700">{t.fridgeEmptyHint}</p>
              </div>
            ) : (
              <>
                <p role="status" aria-live="polite" className="text-sm font-medium text-olive-700">
                  {results.length === 0 ? t.noMatches : fill(t.matchesCount, { n: results.length })}
                </p>
                {results.length > 0 && (
                  <ol className="grid gap-4 sm:grid-cols-2">
                    {results.map((result) => (
                      <li key={result.recipe.slug}>
                        <ResultCard result={result} lang={lang} />
                      </li>
                    ))}
                  </ol>
                )}
              </>
            )}
          </section>

          <SaveList slugs={fridge.slugs} onLoad={(slugs) => commit({ ...fridge, slugs })} />
        </>
      )}
    </main>
  )
}

function ResultCard({ result, lang }: { result: MatchResult; lang: Lang }) {
  const { t } = useLang()
  const recipe = result.recipe as Recipe
  const covered = result.have.length + result.substitutions.length
  const total = covered + result.missing.length
  const pct = Math.round(result.coverage * 100)
  return (
    <article className="flex h-full flex-col gap-3 rounded-2xl border border-olive-900/10 bg-paper-50/80 p-5 shadow-sm">
      <h3 className="font-display text-lg font-semibold text-olive-950">
        <Link to={`/recipes/${recipe.slug}`} className="hover:underline">
          {recipeTitle(recipe, lang)}
        </Link>
      </h3>
      <p className="text-sm font-medium text-olive-900">
        {fill(t.youHave, { have: covered, total })}
      </p>
      <div className="flex items-center gap-3">
        <div
          role="progressbar"
          aria-label={t.coverage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          className="h-2 flex-1 overflow-hidden rounded-full bg-paper-200"
        >
          <div className="h-full rounded-full bg-sage-600" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs font-medium text-olive-700 tabular-nums">{pct}%</span>
      </div>
      {result.missing.length > 0 && (
        <p className="text-sm text-olive-700">
          <span className="font-medium text-olive-900">{t.missing}: </span>
          {names(result.missing, lang)}
        </p>
      )}
      {result.substitutions.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm text-olive-700">
          {result.substitutions.map((sub) => (
            <li key={sub.missing.slug}>
              {fill(t.substitute, {
                missing: ingredientName(sub.missing, lang),
                use: ingredientName(sub.use, lang),
              })}
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

type SaveOutcome = { kind: 'saved'; list: FridgeList } | { kind: 'failed' }

function SaveList({
  slugs,
  onLoad,
}: {
  slugs: readonly string[]
  onLoad: (slugs: string[]) => void
}) {
  const { t } = useLang()
  const source = useUserData()
  const listSaved = useCallback(() => source.fridgeLists.list(), [source])
  const loaded = useAsync(listSaved)
  const [name, setName] = useState('')
  const [outcome, setOutcome] = useState<SaveOutcome | null>(null)
  const [savedNow, setSavedNow] = useState<FridgeList[]>([])

  const disabled = source.kind === 'disabled'
  const canSave = !disabled && slugs.length > 0 && name.trim() !== ''

  // Lists from the server plus the ones saved on this page, newest save winning on id.
  const lists = useMemo(() => {
    const byId = new Map<string, FridgeList>()
    if (loaded.status === 'ready' && loaded.data.ok) {
      for (const list of loaded.data.data) byId.set(list.id, list)
    }
    for (const list of savedNow) byId.set(list.id, list)
    return [...byId.values()]
  }, [loaded, savedNow])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSave) return
    const result = await source.fridgeLists.save({
      name: name.trim(),
      ingredient_slugs: [...slugs],
    })
    if (result.ok) {
      setOutcome({ kind: 'saved', list: result.data })
      setSavedNow((prev) => [...prev.filter((l) => l.id !== result.data.id), result.data])
      setName('')
    } else {
      setOutcome({ kind: 'failed' })
    }
  }

  return (
    <section
      aria-labelledby="fridge-save"
      className="flex flex-col gap-4 rounded-2xl border border-olive-900/10 bg-paper-50/80 p-6 shadow-sm"
    >
      <h2 id="fridge-save" className="font-display text-xl font-semibold text-olive-950">
        {t.saveList}
      </h2>
      {disabled && <SignedOutNote reason={source.reason ?? 'signed-out'} />}
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="fridge-list-name" className="text-sm font-medium text-olive-900">
            {t.listName}
          </label>
          <input
            id="fridge-list-name"
            type="text"
            value={name}
            disabled={disabled}
            onChange={(event) => {
              setName(event.target.value)
              setOutcome(null)
            }}
            className="w-full rounded-xl border border-olive-900/20 bg-paper-50 px-4 py-2.5 text-olive-950 shadow-sm focus:border-sage-600 focus:ring-2 focus:ring-sage-500/40 focus:outline-none disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={!canSave}
          className="rounded-full bg-olive-900 px-5 py-2.5 text-sm font-medium text-paper-50 hover:bg-olive-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t.saveList}
        </button>
      </form>
      {outcome?.kind === 'saved' && (
        <p role="status" className="text-sm font-medium text-sage-700">
          {t.listSaved}
        </p>
      )}
      {outcome?.kind === 'failed' && (
        <p role="alert" className="text-sm font-medium text-clay-500">
          {t.listSaveFailed}
        </p>
      )}
      {lists.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-olive-900">{t.savedLists}</h3>
          <ul className="flex flex-col gap-2">
            {lists.map((list) => (
              <li
                key={list.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-paper-200/60 px-4 py-2 text-sm text-olive-900"
              >
                <span>
                  {list.name} ({list.ingredient_slugs.length})
                </span>
                <button
                  type="button"
                  onClick={() => onLoad([...list.ingredient_slugs])}
                  className="font-medium text-olive-700 underline hover:text-olive-950"
                >
                  {t.loadList}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
