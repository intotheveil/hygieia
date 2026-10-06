// /skincare (PLAN.md P7.2). Skin and nail care for men and women in four regional styles: a
// filter toolbar (./Filters.tsx) whose state lives in the URL (`?area=&audience=&skin=&concern=
// &region=`, absent = everything; ./select.ts owns the rules), then three sections, each with a
// heading, a count and its own empty state: ROUTINES (ordered steps resolved against the
// product-type list), the PRODUCT GUIDE (generic types, never brands) and TIPS (sourced or
// "source pending"). The three lists are read IN PARALLEL through the ContentSource
// (`listSkincareProductTypes / listSkincareRoutines / listSkincareTips`), so bundled and supabase
// modes render alike; one skeleton while they load, one ErrorState with Retry if any fails.
//
// Performance: the page chunk is small and renders its frame (header, toolbar, skeleton) before
// the ~200 kB seed chunk resolves (bundled mode imports it lazily from the ContentSource), the
// same shape as the other content routes (BRAIN §5, cold Lighthouse gate).
//
// PREFERENCES (2026-10-06): when the visitor's goal on the home page's preferences card is skin
// care (src/prefs), the header carries a short "for your goal" note linking to the skincare task plan.

import { useCallback, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { EmptyState, ErrorState, Loading } from '../components/AsyncState'
import { DraftRibbon } from '../components/DraftRibbon'
import { SavedItemsScope } from '../components/SaveButton'
import { contentSource } from '../content'
import type { ContentSource } from '../content'
import { ok, type Result } from '../content/source'
import { useLang } from '../i18n/LangProvider'
import { skincareCopy } from '../i18n/features/skincare.ts'
import { plural, type PluralForms } from '../i18n/fill'
import { useAsyncResult } from '../lib/useAsync'
import { prefersSkincare } from '../prefs/apply.ts'
import { readPrefs } from '../prefs/prefs.ts'
import { ProductTypeCard, RoutineCard, SkincareTipCard } from './cards'
import { Filters } from './Filters'
import {
  parseSelection,
  selectContent,
  serializeSelection,
  withPatch,
  type SkincareContent,
  type SkincareSelection,
} from './select'

export interface SkincarePageProps {
  /** Defaults to the app's content source; tests pass a fake. */
  source?: ContentSource
}

/** The three reads at once; the first failure (in list order) is the page's error. */
async function loadAll(source: ContentSource): Promise<Result<SkincareContent>> {
  const [types, routines, tips] = await Promise.all([
    source.listSkincareProductTypes(),
    source.listSkincareRoutines(),
    source.listSkincareTips(),
  ])
  if (!types.ok) return types
  if (!routines.ok) return routines
  if (!tips.ok) return tips
  return ok({ productTypes: types.data, routines: routines.data, tips: tips.data })
}

function Section({
  id,
  heading,
  count,
  n,
  empty,
  children,
}: {
  id: string
  heading: string
  count: PluralForms
  n: number
  empty: string
  children: ReactNode
}) {
  return (
    <section aria-labelledby={`${id}-heading`} className="flex flex-col gap-4">
      <h2 id={`${id}-heading`} className="font-display text-2xl font-semibold text-olive-950">
        {heading}
        <span
          data-testid={`${id}-count`}
          className="ml-3 align-middle text-sm font-normal text-olive-700"
        >
          {plural(count, n)}
        </span>
      </h2>
      {n === 0 ? (
        <EmptyState title={empty} icon="❋" />
      ) : (
        <ul id={id} className="grid gap-4 sm:grid-cols-2">
          {children}
        </ul>
      )}
    </section>
  )
}

export function SkincarePage({ source = contentSource }: SkincarePageProps) {
  const { t } = useLang(skincareCopy)
  const [params, setParams] = useSearchParams()
  const [forYourGoal] = useState(() => prefersSkincare(readPrefs()))
  const selection = parseSelection(params)

  const load = useCallback(() => loadAll(source), [source])
  const state = useAsyncResult(load)

  const select = (patch: Partial<SkincareSelection>) =>
    setParams(serializeSelection(withPatch(selection, patch)))

  const view = state.status === 'ready' ? selectContent(state.data, selection) : null

  return (
    <SavedItemsScope>
      <main className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6">
        <header className="flex flex-col gap-3">
          <h1 className="font-display text-3xl font-semibold text-olive-950">{t.skincareTitle}</h1>
          <p className="max-w-3xl leading-relaxed text-olive-700">{t.skincareIntro}</p>
          <p role="note" className="max-w-3xl text-sm leading-relaxed text-olive-700">
            {t.skincareDisclaimer}
          </p>
          {forYourGoal && (
            <p
              data-testid="skincare-goal-note"
              className="max-w-3xl rounded-2xl bg-sage-500/15 px-4 py-3 text-sm leading-relaxed text-olive-900"
            >
              {t.skincareGoalNote}{' '}
              <Link to="/tasks/skincare-habit" className="font-medium underline underline-offset-2">
                {t.skincareGoalHabit} →
              </Link>
            </p>
          )}
        </header>

        <DraftRibbon kind={source.kind} />

        <Filters selection={selection} onChange={select} />

        {state.status === 'loading' ? (
          <Loading variant="list" />
        ) : state.status === 'error' ? (
          <ErrorState message={t.skincareLoadFailed} onRetry={state.reload} />
        ) : view === null ? null : (
          <>
            <Section
              id="skincare-routines"
              heading={t.skincareRoutinesHeading}
              count={t.skincareRoutinesCount}
              n={view.routines.length}
              empty={t.skincareRoutinesEmpty}
            >
              {view.routines.map((routine) => (
                <li key={routine.slug}>
                  <RoutineCard routine={routine} types={state.data.productTypes} />
                </li>
              ))}
            </Section>

            <Section
              id="skincare-guide"
              heading={t.skincareGuideHeading}
              count={t.skincareGuideCount}
              n={view.productTypes.length}
              empty={t.skincareGuideEmpty}
            >
              {view.productTypes.map((type) => (
                <li key={type.slug}>
                  <ProductTypeCard type={type} />
                </li>
              ))}
            </Section>

            <Section
              id="skincare-tips"
              heading={t.skincareTipsHeading}
              count={t.skincareTipsCount}
              n={view.tips.length}
              empty={t.skincareTipsEmpty}
            >
              {view.tips.map((tip) => (
                <li key={tip.slug}>
                  <SkincareTipCard tip={tip} />
                </li>
              ))}
            </Section>
          </>
        )}
      </main>
    </SavedItemsScope>
  )
}
