// GOALS EDITOR (P8.2): one row per goal kind — target (in the kind's unit), cadence (per day /
// per week), Save → `upsertGoal`. Drafts live per row and are dropped once the row's goal is saved,
// so a successful save shows the stored value; a per-row `role="status"` reports saved / failed /
// invalid. Weight is a target weight (a trend, not a daily bar); skincare counts sessions.

import { useId, useState } from 'react'
import { useLang } from '../i18n/LangProvider'
import {
  GOAL_KINDS,
  type Cadence,
  type Goal,
  type GoalInput,
  type GoalKind,
  type Result,
} from '../user/source'
import { GOAL_UNIT, parseNumber } from './entryForm'
import { ERR, H2, INPUT, LABEL, PILL, SECTION } from './styles'

export interface GoalsEditorProps {
  goals: readonly Goal[]
  onSave: (input: GoalInput) => Promise<Result<Goal>>
}

interface Draft {
  target: string
  cadence: Cadence
}

const DEFAULT_CADENCE: Readonly<Record<GoalKind, Cadence>> = {
  water: 'daily',
  sleep: 'daily',
  workout: 'weekly',
  steps: 'daily',
  weight: 'weekly',
  skincare: 'daily',
}

type RowStatus = 'saved' | 'failed' | 'invalid'

function draftFrom(goals: readonly Goal[], kind: GoalKind): Draft {
  const goal = goals.find((g) => g.kind === kind)
  return goal === undefined
    ? { target: '', cadence: DEFAULT_CADENCE[kind] }
    : { target: String(goal.target), cadence: goal.cadence }
}

export function GoalsEditor({ goals, onSave }: GoalsEditorProps) {
  const { t } = useLang()
  const id = useId()
  const [edits, setEdits] = useState<Partial<Record<GoalKind, Draft>>>({})
  const [status, setStatus] = useState<Partial<Record<GoalKind, RowStatus>>>({})

  const edit = (kind: GoalKind, patch: Partial<Draft>) =>
    setEdits((current) => ({
      ...current,
      [kind]: { ...(current[kind] ?? draftFrom(goals, kind)), ...patch },
    }))

  async function save(kind: GoalKind): Promise<void> {
    const draft = edits[kind] ?? draftFrom(goals, kind)
    const target = parseNumber(draft.target)
    if (target === null || target <= 0) {
      setStatus((current) => ({ ...current, [kind]: 'invalid' }))
      return
    }
    const result = await onSave({ kind, target, unit: GOAL_UNIT[kind], cadence: draft.cadence })
    if (result.ok) {
      setEdits((current) => {
        const next = { ...current }
        delete next[kind]
        return next
      })
    }
    setStatus((current) => ({ ...current, [kind]: result.ok ? 'saved' : 'failed' }))
  }

  const statusText: Record<RowStatus, string> = {
    saved: t.profileGoalSaved,
    failed: t.profileGoalFailed,
    invalid: t.profileGoalInvalid,
  }

  return (
    <section aria-labelledby="profile-goals" className={SECTION}>
      <h2 id="profile-goals" className={H2}>
        {t.profileGoals}
      </h2>
      <p className="text-sm text-olive-700">{t.profileGoalsIntro}</p>
      <ul className="flex flex-col gap-3">
        {GOAL_KINDS.map((kind) => {
          const draft = edits[kind] ?? draftFrom(goals, kind)
          const rowStatus = status[kind]
          const label = t.profileKind[kind]
          return (
            <li
              key={kind}
              data-goal-kind={kind}
              className="grid items-end gap-2 rounded-xl bg-paper-200/60 px-4 py-3 sm:grid-cols-[1fr_auto_auto_auto]"
            >
              <div className="flex flex-col gap-1">
                <label htmlFor={`${id}-${kind}-target`} className={LABEL}>
                  {label} · {t.profileTarget} ({t.profileGoalUnit[kind]})
                </label>
                <input
                  id={`${id}-${kind}-target`}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={draft.target}
                  onChange={(e) => edit(kind, { target: e.target.value })}
                  aria-invalid={rowStatus === 'invalid'}
                  className={INPUT}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor={`${id}-${kind}-cadence`} className={LABEL}>
                  {t.profileCadenceLabel}
                </label>
                <select
                  id={`${id}-${kind}-cadence`}
                  value={draft.cadence}
                  onChange={(e) =>
                    edit(kind, { cadence: e.target.value === 'weekly' ? 'weekly' : 'daily' })
                  }
                  className={INPUT}
                >
                  <option value="daily">{t.profileCadence.daily}</option>
                  <option value="weekly">{t.profileCadence.weekly}</option>
                </select>
              </div>
              <button
                type="button"
                aria-label={`${t.profileSaveGoal}: ${label}`}
                onClick={() => void save(kind)}
                className={PILL}
              >
                {t.profileSaveGoal}
              </button>
              <p
                role="status"
                className={`text-xs ${rowStatus === 'saved' ? 'text-sage-700' : ERR} sm:col-span-4`}
              >
                {rowStatus === undefined ? '' : statusText[rowStatus]}
              </p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
