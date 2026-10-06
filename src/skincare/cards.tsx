// SKINCARE CARDS (P7.2): the three card shapes of /skincare. Every label is a dictionary value;
// every content string is the row's `_el` / `_en` column for the current language.
//
// - `RoutineCard`: name, chips (audience · skin type · regional style · time), duration, intro and
//   a disclosure button (`aria-expanded` + `aria-controls`) that reveals the ORDERED steps: the
//   product type's name (or, when no visible type has the slug — pending under RLS — the slug
//   muted with "not available yet"), the step's note, and an "optional" mark. Local state, not
//   `<details>`: the button's expanded state is what tests and assistive tech read.
// - `ProductTypeCard`: name, chips (category · when · price band), description, key ingredients,
//   "do not combine with" cautions (only when the row has any), where it is typical, and the
//   regulatory note.
// - `SkincareTipCard`: title, body, then either the source links (hostname as text, new tab,
//   `rel="noopener noreferrer"`) or the "source pending review" label when `needs_source` — a tip
//   never pretends to have a source (PLAN.md §0).

import { useId, useState } from 'react'
import type { SkincareProductType, SkincareRoutine, SkincareTip } from '../content'
import type { Lang } from '../i18n/dictionary'
import { SaveButton } from '../components/SaveButton'
import { useLang } from '../i18n/LangProvider'
import { isUrl, resolveSteps, sourceLabel } from './select'

const CARD =
  'flex flex-col gap-3 rounded-2xl border border-olive-900/10 bg-paper-50/80 p-5 shadow-sm'
const H3 = 'font-display text-lg font-semibold text-olive-950'
const BODY = 'text-sm leading-relaxed text-olive-700'
const CHIP = 'rounded-full bg-sage-500/15 px-2.5 py-0.5 text-xs font-medium text-sage-700'
const FIELD = 'font-medium text-olive-900'

function Chips({ items, label }: { items: readonly string[]; label?: string }) {
  return (
    <ul aria-label={label} className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item} className={CHIP}>
          {item}
        </li>
      ))}
    </ul>
  )
}

/** The row's column for the language: `pick(lang, row.name_el, row.name_en)`. */
const pick = (lang: Lang, el: string, en: string) => (lang === 'el' ? el : en)

// --- routines ------------------------------------------------------------------------------------

export interface RoutineCardProps {
  routine: SkincareRoutine
  /** Every visible product type; steps resolve against it by slug. */
  types: readonly SkincareProductType[]
}

export function RoutineCard({ routine, types }: RoutineCardProps) {
  const { t, lang } = useLang()
  const [open, setOpen] = useState(false)
  const id = useId()
  const stepsId = `${id}-steps`
  const steps = resolveSteps(routine, types)

  return (
    <article aria-labelledby={`${id}-title`} data-routine={routine.slug} className={CARD}>
      <h3 id={`${id}-title`} className={H3}>
        {pick(lang, routine.name_el, routine.name_en)}
      </h3>
      <Chips
        items={[
          t.skincareAudience[routine.audience],
          t.skincareSkinType[routine.skin_type],
          t.skincareRegion[routine.region],
          t.skincareTime[routine.time],
        ]}
      />
      <p className="text-sm text-olive-700">
        <span className={FIELD}>{t.duration}</span>
        <span aria-hidden="true"> · </span>
        <span data-testid="routine-duration">
          {routine.duration_min} {t.minutesUnit}
        </span>
      </p>
      <p className={BODY}>{pick(lang, routine.intro_el, routine.intro_en)}</p>
      <SaveButton
        kind="skincare_routine"
        itemId={routine.id}
        label={pick(lang, routine.name_el, routine.name_en)}
      />
      <button
        type="button"
        aria-expanded={open}
        aria-controls={stepsId}
        onClick={() => setOpen((v) => !v)}
        className="self-start rounded-full border border-olive-900/20 bg-paper-50/70 px-4 py-1.5 text-sm font-medium text-olive-900 transition hover:bg-paper-50"
      >
        {open ? t.skincareHideSteps : t.skincareShowSteps}
      </button>
      {open && (
        <ol
          id={stepsId}
          aria-label={t.skincareSteps}
          className="flex list-decimal flex-col gap-2 pl-6 text-olive-900"
        >
          {steps.map(({ step, type }) => (
            <li
              key={step.order}
              data-step-order={step.order}
              data-step-unavailable={type === null ? '' : undefined}
              className="rounded-xl bg-paper-200/60 px-4 py-2"
            >
              <p className="text-sm">
                {type !== null ? (
                  <span className="font-medium">{pick(lang, type.name_el, type.name_en)}</span>
                ) : (
                  <>
                    <span className="font-medium text-olive-700/60 italic">
                      {step.product_type_slug}
                    </span>
                    <span aria-hidden="true"> · </span>
                    <span className="text-olive-700/80">{t.skincareStepUnavailable}</span>
                  </>
                )}
                {step.optional && (
                  <>
                    <span aria-hidden="true"> · </span>
                    <span className="text-xs tracking-wide text-sage-700 uppercase">
                      {t.skincareOptionalStep}
                    </span>
                  </>
                )}
              </p>
              <p className={BODY}>{pick(lang, step.note_el, step.note_en)}</p>
            </li>
          ))}
        </ol>
      )}
    </article>
  )
}

// --- product guide -------------------------------------------------------------------------------

export function ProductTypeCard({ type }: { type: SkincareProductType }) {
  const { t, lang } = useLang()
  const id = useId()
  const note = pick(lang, type.notes_el, type.notes_en)
  return (
    <article aria-labelledby={`${id}-title`} data-product-type={type.slug} className={CARD}>
      <h3 id={`${id}-title`} className={H3}>
        {pick(lang, type.name_el, type.name_en)}
      </h3>
      <Chips
        items={[
          t.skincareCategory[type.category],
          t.skincareStepTime[type.time],
          t.skincarePriceBand[type.price_band_eur],
        ]}
      />
      <p className={BODY}>{pick(lang, type.description_el, type.description_en)}</p>
      <p className={BODY}>
        <span className={FIELD}>{t.skincareKeyIngredients}</span>
        <span aria-hidden="true"> · </span>
        {type.key_ingredients.join(', ')}
      </p>
      {type.avoid_with.length > 0 && (
        <p className="text-sm leading-relaxed text-clay-700">
          <span className="font-medium">{t.skincareAvoidWith}</span>
          <span aria-hidden="true"> · </span>
          {type.avoid_with.join(', ')}
        </p>
      )}
      <p className={BODY}>
        <span className={FIELD}>{t.skincareRegions}</span>
        <span aria-hidden="true"> · </span>
        {type.regions.map((region) => t.skincareRegion[region]).join(', ')}
      </p>
      {note.trim() !== '' && (
        <p className={BODY}>
          <span className={FIELD}>{t.skincareNote}</span>
          <span aria-hidden="true"> · </span>
          {note}
        </p>
      )}
    </article>
  )
}

// --- tips ----------------------------------------------------------------------------------------

export function SkincareTipCard({ tip }: { tip: SkincareTip }) {
  const { t, lang } = useLang()
  const id = useId()
  const sourced = !tip.needs_source && tip.sources.length > 0
  return (
    <article aria-labelledby={`${id}-title`} data-tip={tip.slug} className={CARD}>
      <h3 id={`${id}-title`} className={H3}>
        {pick(lang, tip.title_el, tip.title_en)}
      </h3>
      <p className={BODY}>{pick(lang, tip.body_el, tip.body_en)}</p>
      <SaveButton
        kind="skincare_tip"
        itemId={tip.id}
        label={pick(lang, tip.title_el, tip.title_en)}
      />
      {sourced ? (
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
          <span className={FIELD}>{t.skincareSources}</span>
          {tip.sources.map((source) =>
            isUrl(source) ? (
              <a
                key={source}
                href={source}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-sage-700 underline-offset-2 hover:underline"
              >
                {sourceLabel(source)}
              </a>
            ) : (
              <span key={source} className="text-olive-700">
                {source}
              </span>
            ),
          )}
        </p>
      ) : (
        <p className="text-xs font-medium tracking-wide text-clay-700 uppercase">
          {t.sourcePending}
        </p>
      )}
    </article>
  )
}
