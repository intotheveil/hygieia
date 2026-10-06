// DIETS LIST `/diets` (P4.4): one card per diet from the ContentSource, linking to `/diets/:slug`.
// The draft ribbon shows once for the bundled source (every seed row is pending). `source` is
// injectable for tests; the app passes nothing and gets the configured source.
//
// PREFERENCES (2026-10-06): the diet the visitor chose on the home page's preferences card
// (src/prefs) is highlighted — a ring and a "Your diet" badge; the list order does not change.

import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, ErrorState, Loading } from '../components/AsyncState'
import { DraftRibbon } from '../components/DraftRibbon'
import { SaveButton, SavedItemsScope } from '../components/SaveButton'
import { contentSource, type ContentSource, type Diet, type Result } from '../content/index.ts'
import { useLang } from '../i18n/LangProvider'
import type { Lang } from '../i18n/app'
import { useAsyncResult } from '../lib/useAsync'
import { isPreferredDiet } from '../prefs/apply.ts'
import { readPrefs } from '../prefs/prefs.ts'

export function dietName(diet: Diet, lang: Lang): string {
  return lang === 'el' ? diet.name_el : diet.name_en
}

export function dietSummary(diet: Diet, lang: Lang): string {
  return lang === 'el' ? diet.summary_el : diet.summary_en
}

export function DietsPage({ source = contentSource }: { source?: ContentSource }) {
  const { t, lang } = useLang()
  const load = useCallback((): Promise<Result<Diet[]>> => source.listDiets(), [source])
  const state = useAsyncResult(load)
  const [prefs] = useState(readPrefs)

  return (
    <SavedItemsScope>
      <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
        <header className="flex flex-col gap-3">
          <h1 className="font-display text-3xl font-semibold text-olive-950">{t.dietsTitle}</h1>
          <p className="max-w-3xl leading-relaxed text-olive-700">{t.dietsIntro}</p>
          <DraftRibbon kind={source.kind} />
        </header>

        {state.status === 'loading' ? (
          <Loading variant="list" />
        ) : state.status === 'error' ? (
          <ErrorState message={t.loadFailed} onRetry={state.reload} />
        ) : state.data.length === 0 ? (
          <EmptyState title={t.dietsEmpty} icon="◔" />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {state.data.map((diet) => {
              const preferred = isPreferredDiet(prefs, diet.slug)
              return (
                <li
                  key={diet.slug}
                  data-preferred={preferred || undefined}
                  className={`flex flex-col gap-3 rounded-2xl border border-olive-900/10 bg-paper-50/80 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md${preferred ? ' ring-2 ring-sage-500' : ''}`}
                >
                  {preferred && (
                    <span className="self-start rounded-full bg-sage-500/15 px-2.5 py-0.5 text-xs font-semibold text-olive-900">
                      {t.dietsYourDiet}
                    </span>
                  )}
                  <h2 className="font-display text-xl font-semibold text-olive-950">
                    {dietName(diet, lang)}
                  </h2>
                  <p className="flex-1 text-sm leading-relaxed text-olive-700">
                    {dietSummary(diet, lang)}
                  </p>
                  <Link
                    to={`/diets/${diet.slug}`}
                    aria-label={`${t.viewDiet}: ${dietName(diet, lang)}`}
                    className="self-start rounded-full border border-olive-900/20 px-4 py-1.5 text-sm font-medium text-olive-900 hover:bg-paper-50"
                  >
                    {t.viewDiet}
                  </Link>
                  <SaveButton kind="diet" itemId={diet.id} label={dietName(diet, lang)} />
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </SavedItemsScope>
  )
}
