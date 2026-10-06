// "YOUR ROUTINE" (connect the features, 2026-10-06): the /skincare routine brought in with "Make it a
// daily habit", rendered ABOVE the generated plan as today's checklist (./routine.ts
// `fromSkincareRoutine`). Ticks go into the same local state as the plan's (today's date), so they
// persist and — signed in, with "Log to profile" on — log a skincare or nails entry (./track.ts).

import { useLang } from '../i18n/LangProvider'
import { tasksCopy } from '../i18n/features/tasks.ts'
import { dateKey } from './dates'
import { TaskItem } from './PlanView'
import type { RoutineSection as Section } from './routine'
import { isTicked, type TasksState } from './storage'

const BTN =
  'rounded-full border border-olive-900/20 bg-paper-50 px-4 py-1.5 text-sm font-medium text-olive-900 hover:border-olive-900/40'

export interface RoutineSectionProps {
  /** The loaded section, or the load's failure. */
  section: Section | 'error'
  state: TasksState
  now: Date
  onToggle: (period: string, taskId: string) => void
  onRemove: () => void
}

export function RoutineSection({ section, state, now, onToggle, onRemove }: RoutineSectionProps) {
  const { t, lang } = useLang(tasksCopy)
  const today = dateKey(now)
  return (
    <section
      id="tasks-routine"
      aria-labelledby="tasks-routine-heading"
      className="flex max-w-2xl flex-col gap-4 rounded-2xl border border-sage-700/30 bg-sage-500/10 p-5"
    >
      <h2 id="tasks-routine-heading" className="font-display text-2xl font-semibold text-olive-950">
        {t.tasksRoutineHeading}
        {section !== 'error' && (
          <span className="ml-3 align-middle text-sm font-normal text-olive-700">
            {section.title[lang]} · {t.tasksRoutineTime[section.time]}
          </span>
        )}
      </h2>
      {section === 'error' ? (
        <p role="alert" className="text-sm text-clay-700">
          {t.tasksRoutineLoadFailed}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {section.tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              idPrefix="routine"
              checked={isTicked(state, today, task.id)}
              onChange={() => onToggle(today, task.id)}
              t={t}
              mark={section.optional.includes(task.id) ? t.tasksRoutineOptional : undefined}
            />
          ))}
        </ul>
      )}
      <button type="button" className={`${BTN} self-start print:hidden`} onClick={onRemove}>
        {t.tasksRoutineRemove}
      </button>
    </section>
  )
}
