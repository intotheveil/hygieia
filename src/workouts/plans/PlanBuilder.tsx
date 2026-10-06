// PLAN BUILDER (P8.3): pick a session with the same three chip groups as /workouts (where you
// train, level, intensity → the one template of that cell), then name, weeks (1–12), days a week
// (1–7) and a start date → `createWorkoutPlan`. `initialTemplateId` (from `?template=` — the "Start
// plan" button on a /workouts card) pre-selects that template's cell and its title as the name.
// Validation is pure (./builder.ts); field errors are listed in one `role="alert"`.

import { useId, useState, type FormEvent } from 'react'
import type { WorkoutTemplate } from '../../content'
import { INTENSITIES, LEVELS, WORKOUT_TYPES } from '../../content/enums.ts'
import type { Intensity, Level, WorkoutType } from '../../content/enums.ts'
import { useLang } from '../../i18n/LangProvider'
import { fill } from '../../i18n/fill'
import { ERR, H2, INPUT, LABEL, PILL, PILL_PRIMARY, SECTION } from '../../profile/styles'
import type { Result, WorkoutPlan, WorkoutPlanInput } from '../../user/source'
import { ChipGroup } from '../ChipGroup'
import { MAX_DAYS, MAX_WEEKS, validatePlanForm, type PlanFormError } from './builder'

export interface PlanBuilderProps {
  templates: readonly WorkoutTemplate[]
  initialTemplateId: string | null
  today: string
  onCreate: (input: WorkoutPlanInput) => Promise<Result<WorkoutPlan>>
  onCancel?: () => void
}

interface Cell {
  type: WorkoutType
  level: Level
  intensity: Intensity
}

const DEFAULT_CELL: Cell = { type: 'home', level: 'beginner', intensity: 'moderate' }

export function PlanBuilder({
  templates,
  initialTemplateId,
  today,
  onCreate,
  onCancel,
}: PlanBuilderProps) {
  const { t, lang } = useLang()
  const id = useId()
  const titleOf = (tpl: WorkoutTemplate) => (lang === 'el' ? tpl.title_el : tpl.title_en)
  const initial = templates.find((tpl) => tpl.id === initialTemplateId) ?? null

  const [cell, setCell] = useState<Cell>(() =>
    initial === null
      ? DEFAULT_CELL
      : { type: initial.workout_type, level: initial.level, intensity: initial.intensity },
  )
  const [name, setName] = useState(() => (initial === null ? '' : titleOf(initial)))
  const [nameTouched, setNameTouched] = useState(initial !== null)
  const [weeks, setWeeks] = useState('4')
  const [days, setDays] = useState('3')
  const [startDate, setStartDate] = useState(today)
  const [errors, setErrors] = useState<PlanFormError[]>([])
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)

  const template =
    templates.find(
      (tpl) =>
        tpl.workout_type === cell.type &&
        tpl.level === cell.level &&
        tpl.intensity === cell.intensity,
    ) ?? null
  // Until the visitor types a name, the name follows the selected session's title.
  const shownName = nameTouched || template === null ? name : titleOf(template)

  const pick = (patch: Partial<Cell>) => setCell((c) => ({ ...c, ...patch }))

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    const result = validatePlanForm({
      template_id: template?.id ?? null,
      name: shownName,
      weeks,
      days_per_week: days,
      start_date: startDate,
    })
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setErrors([])
    setFailed(false)
    setSaving(true)
    const created = await onCreate(result.input)
    setSaving(false)
    if (!created.ok) setFailed(true)
  }

  const weeksN = Number(weeks)
  const daysN = Number(days)
  const summary =
    Number.isInteger(weeksN) && Number.isInteger(daysN) && weeksN > 0 && daysN > 0
      ? fill(t.wpBuilderSummary, { weeks: weeksN, days: daysN, total: weeksN * daysN })
      : null

  return (
    <section aria-labelledby={`${id}-heading`} className={SECTION} data-testid="plan-builder">
      <header className="flex flex-col gap-1">
        <h2 id={`${id}-heading`} className={H2}>
          {t.wpBuilderHeading}
        </h2>
        <p className="text-sm leading-relaxed text-olive-700">{t.wpBuilderIntro}</p>
      </header>
      <form noValidate onSubmit={(e) => void submit(e)} className="flex flex-col gap-5">
        <div className="flex flex-col gap-4">
          <ChipGroup
            id={`${id}-type`}
            label={t.pickType}
            options={WORKOUT_TYPES}
            value={cell.type}
            labels={t.types}
            onChange={(type) => pick({ type })}
          />
          <ChipGroup
            id={`${id}-level`}
            label={t.pickLevel}
            options={LEVELS}
            value={cell.level}
            labels={t.levels}
            onChange={(level) => pick({ level })}
          />
          <ChipGroup
            id={`${id}-intensity`}
            label={t.pickIntensity}
            options={INTENSITIES}
            value={cell.intensity}
            labels={t.intensities}
            onChange={(intensity) => pick({ intensity })}
          />
        </div>

        <p className="rounded-xl bg-paper-200/60 px-4 py-3 text-sm" data-testid="builder-template">
          {template === null ? (
            <span className="text-olive-700">{t.wpNoTemplate}</span>
          ) : (
            <>
              <span className="font-medium text-olive-950">{titleOf(template)}</span>
              <span aria-hidden="true"> · </span>
              <span className="text-olive-700">
                {template.duration_min} {t.minutesUnit}
              </span>
            </>
          )}
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className="col-span-2 flex flex-col gap-1">
            <span className={LABEL}>{t.wpName}</span>
            <input
              type="text"
              maxLength={80}
              value={shownName}
              onChange={(e) => {
                setNameTouched(true)
                setName(e.target.value)
              }}
              aria-invalid={errors.includes('name')}
              className={INPUT}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={LABEL}>{t.wpWeeks}</span>
            <input
              type="number"
              min={1}
              max={MAX_WEEKS}
              inputMode="numeric"
              value={weeks}
              onChange={(e) => setWeeks(e.target.value)}
              aria-invalid={errors.includes('weeks')}
              className={INPUT}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={LABEL}>{t.wpDaysPerWeek}</span>
            <input
              type="number"
              min={1}
              max={MAX_DAYS}
              inputMode="numeric"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              aria-invalid={errors.includes('days')}
              className={INPUT}
            />
          </label>
          <label className="col-span-2 flex flex-col gap-1 sm:col-span-2">
            <span className={LABEL}>{t.wpStartDate}</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              aria-invalid={errors.includes('date')}
              className={INPUT}
            />
          </label>
        </div>

        {summary !== null && <p className="text-sm text-olive-700">{summary}</p>}

        {errors.length > 0 && (
          <ul role="alert" className={`${ERR} list-disc pl-5`}>
            {errors.map((error) => (
              <li key={error}>{t.wpFormErrors[error]}</li>
            ))}
          </ul>
        )}
        {failed && (
          <p role="alert" className={ERR}>
            {t.wpCreateFailed}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={saving} className={PILL_PRIMARY}>
            {saving ? t.wpCreating : t.wpCreate}
          </button>
          {onCancel !== undefined && (
            <button type="button" onClick={onCancel} className={PILL}>
              {t.wpCancel}
            </button>
          )}
        </div>
      </form>
    </section>
  )
}
