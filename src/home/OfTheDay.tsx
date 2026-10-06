// RECIPE OF THE DAY + TIP OF THE DAY (2026-10-06). Two cards on the home page, each picked by
// `pickOfTheDay` (src/prefs/ofTheDay.ts) for today's date in Athens from what the content source
// lists — the approved rows in configured mode, the bundled seeds in local-only mode — and the
// recipe narrowed to the visitor's diet when one is set. Each card reads its own list, so the
// smaller tips chunk does not wait for the recipes. The cards keep a FIXED height (./layout.ts) in
// every state — loading bones, error + retry, the pick, or "nothing today" — so the home page
// never shifts when they settle.

import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { contentSource, type ContentSource, type HealthTip, type Recipe } from '../content/index.ts'
import { fill, plural } from '../i18n/fill.ts'
import { prefsCopy } from '../i18n/features/prefs.ts'
import { useLang } from '../i18n/LangProvider'
import { useAsyncResult } from '../lib/useAsync.ts'
import { pickOfTheDay } from '../prefs/ofTheDay.ts'
import type { Prefs } from '../prefs/prefs.ts'
import { BONE, TODAY_CARD, TODAY_GRID } from './layout.ts'

export interface OfTheDayProps {
  prefs: Prefs | null
  /** The clock (tests pin it). */
  now: Date
  source?: ContentSource
}

const EYEBROW = 'text-xs font-semibold tracking-wide text-sage-700 uppercase'
const TITLE = 'line-clamp-2 font-display text-xl font-semibold text-olive-950'

function Bones() {
  return (
    <div
      aria-hidden="true"
      className="flex animate-pulse flex-col gap-3 motion-reduce:animate-none"
    >
      <div className={`${BONE} h-6 w-3/4`} />
      <div className={`${BONE} h-4 w-full`} />
      <div className={`${BONE} h-4 w-2/3`} />
    </div>
  )
}

function Failed({ onRetry }: { onRetry: () => void }) {
  const { t } = useLang()
  return (
    <div role="alert" className="flex flex-col items-start gap-2 text-sm text-clay-700">
      <p className="line-clamp-3">{t.loadFailed}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full bg-olive-900 px-4 py-1.5 text-sm font-medium text-paper-50 hover:bg-olive-700"
      >
        {t.retry}
      </button>
    </div>
  )
}

function RecipeOfTheDay({ prefs, now, source }: Required<OfTheDayProps>) {
  const { t, lang } = useLang(prefsCopy)
  const load = useCallback(() => source.listRecipes(), [source])
  const state = useAsyncResult(load)
  const diet = prefs?.diet ?? null
  const recipe =
    state.status === 'ready'
      ? pickOfTheDay<Recipe>(
          state.data,
          now,
          'recipe',
          diet === null ? undefined : (r) => r.diet_slugs.includes(diet),
        )
      : null
  return (
    <article
      className={TODAY_CARD}
      aria-busy={state.status === 'loading'}
      data-testid="recipe-of-the-day"
    >
      <h2 className={EYEBROW}>{t.recipeOfTheDay}</h2>
      {state.status === 'loading' ? (
        <Bones />
      ) : state.status === 'error' ? (
        <Failed onRetry={state.reload} />
      ) : recipe === null ? (
        <p className="text-sm text-olive-700">{t.ofTheDayNone}</p>
      ) : (
        <>
          <p className={TITLE}>
            <Link
              to={`/recipes/${recipe.slug}`}
              className="after:absolute after:inset-0 after:rounded-2xl hover:underline focus-visible:underline"
            >
              {lang === 'el' ? recipe.title_el : recipe.title_en}
            </Link>
          </p>
          <p className="text-sm text-olive-700">{plural(t.minutes, recipe.prep_min)}</p>
          <p aria-hidden="true" className="mt-auto text-sm font-medium text-sage-700">
            {t.recipeOfTheDayOpen} →
          </p>
        </>
      )}
    </article>
  )
}

function TipOfTheDay({ now, source }: Required<OfTheDayProps>) {
  const { t, lang } = useLang(prefsCopy)
  const load = useCallback(() => source.listTips(), [source])
  const state = useAsyncResult(load)
  const tip = state.status === 'ready' ? pickOfTheDay<HealthTip>(state.data, now, 'tip') : null
  return (
    <article
      className={TODAY_CARD}
      aria-busy={state.status === 'loading'}
      data-testid="tip-of-the-day"
    >
      <h2 className={EYEBROW}>{t.tipOfTheDay}</h2>
      {state.status === 'loading' ? (
        <Bones />
      ) : state.status === 'error' ? (
        <Failed onRetry={state.reload} />
      ) : tip === null ? (
        <p className="text-sm text-olive-700">{t.ofTheDayNone}</p>
      ) : (
        <>
          <p className={TITLE}>{lang === 'el' ? tip.title_el : tip.title_en}</p>
          <p className="line-clamp-2 text-sm leading-relaxed text-olive-700">
            {lang === 'el' ? tip.body_el : tip.body_en}
          </p>
          <Link
            to={`/tips?topic=${tip.topic}`}
            className="mt-auto self-start text-sm font-medium text-sage-700 underline-offset-2 hover:underline"
          >
            {fill(t.tipOfTheDayMore, { topic: t.topics[tip.topic] })} →
          </Link>
        </>
      )}
    </article>
  )
}

export function OfTheDay({ prefs, now, source = contentSource }: OfTheDayProps) {
  const { t } = useLang(prefsCopy)
  return (
    <section aria-label={t.ofTheDayLabel} className={TODAY_GRID}>
      <RecipeOfTheDay prefs={prefs} now={now} source={source} />
      <TipOfTheDay prefs={prefs} now={now} source={source} />
    </section>
  )
}
