// /workouts (PLAN.md P4.8, UI half). Three selector groups — where you train (7 types), level (3),
// intensity (3) — and the one session that cell resolves to: title, duration, notes, equipment,
// then warm-up → main → cool-down as ordered lists of "exercise · sets × reps-or-seconds · rest",
// each movement with its coaching cue behind a <details>. The disclaimer closes the card.
//
// The selection lives in the URL (`?type=&level=&intensity=`, defaults home/beginner/moderate), so
// a session is linkable and the back button walks through choices. Content comes from the
// ContentSource's `getWorkoutTemplate` — NOT from `workouts/session.ts` over the seed arrays —
// so the page works identically in `local` (bundled) and `configured` (supabase) mode; the
// template's `slots` already carry the resolved exercise rows. `blocksOf` applies the same
// whole-or-nothing rule as `resolveSession`: a slot whose exercise is not visible (pending under
// RLS) makes the whole session unavailable rather than rendering a block with a hole.

import { useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { EmptyState, ErrorState, Loading } from '../components/AsyncState'
import { DraftRibbon } from '../components/DraftRibbon'
import { SaveButton, SavedItemsScope } from '../components/SaveButton'
import { contentSource } from '../content'
import type { ContentSource, Exercise, WorkoutTemplate } from '../content'
import { BLOCKS, INTENSITIES, LEVELS, WORKOUT_TYPES } from '../content/enums.ts'
import type { Block, Intensity, Level, WorkoutType } from '../content/enums.ts'
import type { WorkoutBlockSeed } from '../content/types.ts'
import { useLang } from '../i18n/LangProvider'
import { fill } from '../i18n/fill'
import type { Dictionary, Lang } from '../i18n/dictionary'
import { useAsyncResult } from '../lib/useAsync'
import type { UserDataSource } from '../user/source'
import { useUserData } from '../user/useUserData'
import { ChipGroup } from './ChipGroup'

// --- URL state -----------------------------------------------------------------------------------

export interface WorkoutSelection {
  type: WorkoutType
  level: Level
  intensity: Intensity
}

export const DEFAULT_SELECTION: WorkoutSelection = {
  type: 'home',
  level: 'beginner',
  intensity: 'moderate',
}

function pickMember<T extends string>(options: readonly T[], value: string | null, fallback: T): T {
  return value !== null && (options as readonly string[]).includes(value) ? (value as T) : fallback
}

/** `?type=&level=&intensity=` → a selection; unknown or missing values fall back to the defaults. */
export function parseWorkoutSelection(params: URLSearchParams): WorkoutSelection {
  return {
    type: pickMember(WORKOUT_TYPES, params.get('type'), DEFAULT_SELECTION.type),
    level: pickMember(LEVELS, params.get('level'), DEFAULT_SELECTION.level),
    intensity: pickMember(INTENSITIES, params.get('intensity'), DEFAULT_SELECTION.intensity),
  }
}

/** Always writes all three keys, so a copied URL is self-describing. */
export function serializeWorkoutSelection(selection: WorkoutSelection): URLSearchParams {
  return new URLSearchParams({
    type: selection.type,
    level: selection.level,
    intensity: selection.intensity,
  })
}

// --- session shape -------------------------------------------------------------------------------

export interface SessionItem {
  exercise: Exercise
  slot: WorkoutBlockSeed
}

export interface SessionBlock {
  block: Block
  items: SessionItem[]
}

/**
 * The template's slots grouped in `BLOCKS` order with every exercise present, or null when any
 * slot's exercise is not visible (whole-or-nothing, as `resolveSession` does over seeds).
 */
export function blocksOf(template: WorkoutTemplate): SessionBlock[] | null {
  const blocks: SessionBlock[] = BLOCKS.map((block) => ({ block, items: [] }))
  for (const slot of template.slots) {
    if (slot.exercise === null) return null
    const target = blocks[BLOCKS.indexOf(slot.block.block)]
    if (target === undefined) return null
    target.items.push({ exercise: slot.exercise, slot: slot.block })
  }
  return blocks
}

/** Distinct equipment strings across the session in the current language; empty = bodyweight. */
export function equipmentOf(blocks: readonly SessionBlock[], lang: Lang): string[] {
  const seen = new Set<string>()
  for (const { items } of blocks) {
    for (const { exercise } of items) {
      const equipment = lang === 'el' ? exercise.equipment_el : exercise.equipment_en
      if (equipment !== null && equipment.trim() !== '') seen.add(equipment)
    }
  }
  return [...seen]
}

/** "3 × 12 reps" or "2 × 40 s" — the work figure of one slot. */
export function workFigure(slot: WorkoutBlockSeed, t: Dictionary): string {
  const work = slot.reps !== null ? `${slot.reps} ${t.reps}` : `${slot.seconds ?? 0} ${t.seconds}`
  return `${slot.sets} × ${work}`
}

// --- UI ------------------------------------------------------------------------------------------

function SessionCard({
  template,
  kind,
  canPlan,
}: {
  template: WorkoutTemplate
  kind: ContentSource['kind']
  /** Signed in with user data: offer "Start plan" (P8.3). Hidden otherwise, like SaveButton. */
  canPlan: boolean
}) {
  const { t, lang } = useLang()
  const blocks = blocksOf(template)
  if (blocks === null) return <EmptyState title={t.noSession} icon="⟳" />
  const equipment = equipmentOf(blocks, lang)
  const title = lang === 'el' ? template.title_el : template.title_en
  const notes = lang === 'el' ? template.notes_el : template.notes_en

  return (
    <article
      aria-labelledby="session-title"
      className="flex flex-col gap-6 rounded-2xl border border-olive-900/10 bg-paper-50/80 p-6 shadow-sm"
    >
      <DraftRibbon kind={kind} status={template.status} />
      <header className="flex flex-col gap-2">
        <h2 id="session-title" className="font-display text-2xl font-semibold text-olive-950">
          {title}
        </h2>
        <p className="text-sm text-olive-700">
          <span className="font-medium text-olive-900">{t.duration}</span>
          <span aria-hidden="true"> · </span>
          <span data-testid="session-duration">
            {template.duration_min} {t.minutesUnit}
          </span>
        </p>
        <p className="leading-relaxed text-olive-700">{notes}</p>
        <p className="text-sm text-olive-700">
          <span className="font-medium text-olive-900">{t.equipment}</span>
          <span aria-hidden="true"> · </span>
          <span data-testid="session-equipment">
            {equipment.length === 0 ? t.bodyweight : equipment.join(', ')}
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <SaveButton kind="workout" itemId={template.id} label={title} />
          {canPlan && (
            <Link
              to={`/workouts/plans?template=${encodeURIComponent(template.id)}`}
              aria-label={fill(t.wpStartPlanFor, { name: title })}
              className="rounded-full bg-olive-900 px-4 py-1.5 text-sm font-medium text-paper-50 hover:bg-olive-700"
            >
              {t.wpStartPlan}
            </Link>
          )}
        </div>
      </header>

      {blocks.map(({ block, items }) => (
        <section
          key={block}
          aria-labelledby={`block-${block}`}
          data-testid={`block-${block}`}
          className="flex flex-col gap-3"
        >
          <h3 id={`block-${block}`} className="font-display text-lg font-semibold text-olive-950">
            {t.blocks[block]}
          </h3>
          <ol className="flex list-decimal flex-col gap-2 pl-6 text-olive-900">
            {items.map(({ exercise, slot }, index) => {
              const name = lang === 'el' ? exercise.name_el : exercise.name_en
              const cue = lang === 'el' ? exercise.cue_el : exercise.cue_en
              return (
                <li
                  key={`${exercise.slug}-${index}`}
                  className="rounded-xl bg-paper-200/60 px-4 py-2"
                >
                  <p className="text-sm">
                    <span className="font-medium">{name}</span>
                    <span aria-hidden="true"> · </span>
                    <span data-testid="work-figure">{workFigure(slot, t)}</span>
                    {slot.rest_seconds > 0 && (
                      <>
                        <span aria-hidden="true"> · </span>
                        <span>
                          {t.rest} {slot.rest_seconds} {t.seconds}
                        </span>
                      </>
                    )}
                  </p>
                  <details className="mt-1 text-sm text-olive-700">
                    <summary className="cursor-pointer text-sage-700">{t.showCue}</summary>
                    <p className="mt-1 leading-relaxed">{cue}</p>
                  </details>
                </li>
              )
            })}
          </ol>
        </section>
      ))}

      <p
        role="note"
        className="border-t border-olive-900/10 pt-4 text-xs leading-relaxed text-olive-700"
      >
        {t.notMedicalAdvice}
      </p>
    </article>
  )
}

export interface WorkoutsPageProps {
  /** Defaults to the app's content source; tests pass a fake. */
  source?: ContentSource
  /** Defaults to the session's user data (P8.3 "Start plan"); tests pass a fake. */
  userData?: UserDataSource
}

export function WorkoutsPage({ source = contentSource, userData }: WorkoutsPageProps) {
  const { t } = useLang()
  const fromHook = useUserData()
  const canPlan = (userData ?? fromHook).kind !== 'disabled'
  const [params, setParams] = useSearchParams()
  const selection = parseWorkoutSelection(params)
  const { type, level, intensity } = selection

  const load = useCallback(
    () => source.getWorkoutTemplate(type, level, intensity),
    [source, type, level, intensity],
  )
  const state = useAsyncResult(load)

  const select = (patch: Partial<WorkoutSelection>) =>
    setParams(serializeWorkoutSelection({ ...selection, ...patch }))

  return (
    <SavedItemsScope>
      <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
        <header className="flex flex-col gap-3">
          <h1 className="font-display text-3xl font-semibold text-olive-950">{t.workoutsTitle}</h1>
          <p className="max-w-2xl leading-relaxed text-olive-700">{t.workoutsIntro}</p>
          <Link
            to="/workouts/plans"
            className="self-start text-sm font-medium text-olive-900 underline"
          >
            {t.wpLink} →
          </Link>
        </header>

        <div className="flex flex-col gap-5">
          <ChipGroup
            id="type"
            label={t.pickType}
            options={WORKOUT_TYPES}
            value={type}
            labels={t.types}
            onChange={(next) => select({ type: next })}
          />
          <ChipGroup
            id="level"
            label={t.pickLevel}
            options={LEVELS}
            value={level}
            labels={t.levels}
            onChange={(next) => select({ level: next })}
          />
          <ChipGroup
            id="intensity"
            label={t.pickIntensity}
            options={INTENSITIES}
            value={intensity}
            labels={t.intensities}
            onChange={(next) => select({ intensity: next })}
          />
        </div>

        {state.status === 'loading' ? (
          <Loading variant="detail" />
        ) : state.status === 'error' ? (
          <ErrorState message={t.workoutsLoadFailed} onRetry={state.reload} />
        ) : state.data === null ? (
          <EmptyState title={t.noSession} icon="⟳" />
        ) : (
          <SessionCard template={state.data} kind={source.kind} canPlan={canPlan} />
        )}
      </main>
    </SavedItemsScope>
  )
}
