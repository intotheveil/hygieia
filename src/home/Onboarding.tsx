// FIRST-VISIT ONBOARDING (2026-10-06, operator request). A card on the home page — never a modal,
// never in front of anything — with three optional questions (goal, diet, activity level) as
// native selects: one control each, keyboard and screen-reader semantics for free, and a height
// that does not depend on how chips would wrap (./layout.ts reserves it). "Save" stores the
// answers (src/prefs/prefs.ts, localStorage `hygieia:prefs`); "Skip" stores `skipped` so the card
// does not come back. Opened again from the footer's "Change preferences" (`/?prefs=edit`), it
// starts from the saved answers and offers "Cancel" instead of "Skip".

import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { prefsCopy } from '../i18n/features/prefs.ts'
import { useLang } from '../i18n/LangProvider'
import {
  ACTIVITY_LEVELS,
  GOALS,
  NO_PREFS,
  PREF_DIETS,
  type ActivityLevel,
  type Goal,
  type PrefDiet,
  type Prefs,
} from '../prefs/prefs.ts'
import { onboardingBox } from './layout.ts'

export interface OnboardingProps {
  /** The saved answers when CHANGING preferences; null on a first visit. */
  initial: Prefs | null
  /** True when opened to change saved preferences (Cancel instead of Skip). */
  editing: boolean
  /** Save → the answers; Skip → `skipped: true`; Cancel → null (nothing changes). */
  onDone: (prefs: Prefs | null) => void
}

function member<T extends string>(options: readonly T[], value: string): T | null {
  return (options as readonly string[]).includes(value) ? (value as T) : null
}

const SELECT =
  'w-full rounded-xl border border-olive-900/20 bg-paper-50 px-3 py-2 text-olive-950 shadow-sm focus:border-sage-600 focus:ring-2 focus:ring-sage-500/40 focus:outline-none'
const LABEL = 'text-sm font-medium text-olive-900'

export function Onboarding({ initial, editing, onDone }: OnboardingProps) {
  const { t, lang } = useLang(prefsCopy)
  const id = useId()
  const start = initial ?? NO_PREFS
  const [goal, setGoal] = useState<Goal | null>(start.goal)
  const [diet, setDiet] = useState<PrefDiet | null>(start.diet)
  const [activity, setActivity] = useState<ActivityLevel | null>(start.activity)
  const first = useRef<HTMLSelectElement>(null)

  // Opened from "Change preferences" (usually from the footer, far below): bring the card to the
  // visitor — focusing its first question scrolls it into view. Never on a first visit.
  useEffect(() => {
    if (editing) first.current?.focus()
  }, [editing])

  function save(event: FormEvent) {
    event.preventDefault()
    onDone({ goal, diet, activity, skipped: false })
  }

  return (
    <section
      aria-labelledby={`${id}-title`}
      className={onboardingBox(lang)}
      data-testid="onboarding"
    >
      <form onSubmit={save} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <h2 id={`${id}-title`} className="font-display text-2xl font-semibold text-olive-950">
            {t.prefsTitle}
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-olive-700">{t.prefsLead}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${id}-goal`} className={LABEL}>
              {t.prefsGoalLabel}
            </label>
            <select
              id={`${id}-goal`}
              ref={first}
              value={goal ?? ''}
              onChange={(e) => setGoal(member(GOALS, e.target.value))}
              className={SELECT}
            >
              <option value="">{t.prefsNoAnswer}</option>
              {GOALS.map((g) => (
                <option key={g} value={g}>
                  {t.prefsGoals[g]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${id}-diet`} className={LABEL}>
              {t.prefsDietLabel}
            </label>
            <select
              id={`${id}-diet`}
              value={diet ?? ''}
              onChange={(e) => setDiet(member(PREF_DIETS, e.target.value))}
              className={SELECT}
            >
              <option value="">{t.prefsNoDiet}</option>
              {PREF_DIETS.map((d) => (
                <option key={d} value={d}>
                  {t.prefsDiets[d]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${id}-activity`} className={LABEL}>
              {t.prefsActivityLabel}
            </label>
            <select
              id={`${id}-activity`}
              value={activity ?? ''}
              onChange={(e) => setActivity(member(ACTIVITY_LEVELS, e.target.value))}
              className={SELECT}
            >
              <option value="">{t.prefsNoAnswer}</option>
              {ACTIVITY_LEVELS.map((a) => (
                <option key={a} value={a}>
                  {t.prefsActivities[a]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="rounded-full bg-olive-900 px-5 py-2 text-sm font-medium text-paper-50 hover:bg-olive-700"
          >
            {t.prefsSave}
          </button>
          <button
            type="button"
            onClick={() => onDone(editing ? null : { ...NO_PREFS, skipped: true })}
            className="rounded-full px-4 py-2 text-sm font-medium text-olive-900 underline underline-offset-2 hover:text-olive-700"
          >
            {editing ? t.prefsCancel : t.prefsSkip}
          </button>
        </div>
      </form>
    </section>
  )
}
