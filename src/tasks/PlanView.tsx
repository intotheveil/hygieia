// TASKS ADVISOR — the generated plan (P9): TODAY (daily tasks + today's weekly jobs, one checklist),
// THIS WEEK (seven day columns on wide screens, stacked on narrow ones; each with its weekly jobs,
// a daily-tasks tally and a progress bar), THIS MONTH, then Retake / Print / Copy as text.
//
// Ticks are keyed by the real local date (`YYYY-MM-DD`) of the current Monday-first week, monthly
// ticks by `YYYY-MM` (./storage.ts), so today's ticks are the same boxes in Today and in today's
// column, and next week starts clean. Every checkbox is a native input with its own `<label>`
// (the task title is its accessible name; minutes and the kick-off badge sit beside it).

import { useState } from 'react'
import { fill, plural } from '../i18n/fill'
import { useLang } from '../i18n/LangProvider'
import { tasksCopy } from '../i18n/features/tasks.ts'
import { dateKey, dayOf, monthKey, weekDates } from './dates'
import type { Plan } from './generate'
import { isTicked, type TasksState } from './storage'
import { planToText, type TasksT } from './text'
import { DAYS, type Task, type Topic } from './types'

export interface PlanViewProps {
  topic: Topic
  plan: Plan
  state: TasksState
  now: Date
  onToggle: (period: string, taskId: string) => void
  onRetake: () => void
}

const BTN =
  'rounded-full border border-olive-900/20 bg-paper-50 px-4 py-1.5 text-sm font-medium text-olive-900 hover:border-olive-900/40'

function Progress({ label, done, total }: { label: string; done: number; total: number }) {
  const { t } = useLang(tasksCopy)
  const text = fill(t.tasksProgress, { done, total })
  const ratio = total === 0 ? 0 : done / total
  return (
    <div className="flex flex-col gap-1">
      <div
        role="progressbar"
        aria-label={fill(t.tasksProgressOf, { label })}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-valuetext={text}
        className="h-2 overflow-hidden rounded-full bg-paper-200"
      >
        <div
          className="h-full rounded-full bg-sage-500 transition-[width]"
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>
      <p className="text-xs text-olive-700">{text}</p>
    </div>
  )
}

/** One checklist row (also used by ./RoutineSection.tsx); `mark` is an extra badge, e.g. "optional". */
export function TaskItem({
  task,
  idPrefix,
  checked,
  onChange,
  t,
  mark,
}: {
  task: Task
  idPrefix: string
  checked: boolean
  onChange: () => void
  t: TasksT
  mark?: string
}) {
  const { lang } = useLang()
  const id = `${idPrefix}-${task.id}`
  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="mt-1 size-4 shrink-0 accent-sage-700"
        />
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <label
            htmlFor={id}
            className={`cursor-pointer text-olive-900 ${checked ? 'line-through decoration-olive-700/60' : ''}`}
          >
            {task.title[lang]}
          </label>
          <span className="text-xs text-olive-700">{plural(t.minutes, task.minutes)}</span>
          {task.kickoff && (
            <span className="rounded-full bg-clay-500/15 px-2 py-0.5 text-xs font-medium text-clay-700">
              {t.tasksKickoff}
            </span>
          )}
          {mark !== undefined && (
            <span className="text-xs tracking-wide text-sage-700 uppercase">{mark}</span>
          )}
        </div>
      </div>
      {task.detail && <p className="pl-7 text-sm text-olive-700">{task.detail[lang]}</p>}
    </li>
  )
}

export function PlanView({ topic, plan, state, now, onToggle, onRetake }: PlanViewProps) {
  const { t, lang } = useLang(tasksCopy)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle')

  const today = dayOf(now)
  const todayKey = dateKey(now)
  const week = weekDates(now)
  const month = monthKey(now)
  const dateFmt = new Intl.DateTimeFormat(lang === 'el' ? 'el-GR' : 'en-GB', {
    day: 'numeric',
    month: 'short',
  })

  const todayTasks = [...plan.daily, ...plan.weekly[today]]
  const doneOn = (key: string, tasks: readonly Task[]) =>
    tasks.filter((task) => isTicked(state, key, task.id)).length

  let weekDone = 0
  let weekTotal = 0
  for (const day of DAYS) {
    const key = dateKey(week[day])
    const tasks = [...plan.daily, ...plan.weekly[day]]
    weekDone += doneOn(key, tasks)
    weekTotal += tasks.length
  }

  const copy = async () => {
    try {
      // `navigator.clipboard` is undefined on insecure origins: the TypeError lands in the catch.
      await navigator.clipboard.writeText(planToText(topic, plan, lang, t))
      setCopyStatus('copied')
    } catch {
      setCopyStatus('failed')
    }
  }

  return (
    <div id="tasks-plan" className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <p className="text-olive-700">{fill(t.tasksBudgetNote, { n: plan.budget })}</p>
        {plan.gentle && (
          <aside
            role="note"
            aria-labelledby="tasks-gentle-title"
            className="max-w-3xl rounded-2xl border border-clay-500/30 bg-clay-500/10 p-4 text-sm leading-relaxed text-olive-900"
          >
            <h2 id="tasks-gentle-title" className="mb-1 font-semibold">
              {t.tasksGentleTitle}
            </h2>
            <p>{fill(t.tasksGentleBody, { n: plan.budget })}</p>
          </aside>
        )}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button type="button" className={BTN} onClick={onRetake}>
            {t.tasksRetake}
          </button>
          <button type="button" className={BTN} onClick={() => window.print()}>
            {t.tasksPrint}
          </button>
          <button type="button" className={BTN} onClick={() => void copy()}>
            {t.tasksCopy}
          </button>
          <p role="status" className="text-sm text-olive-700">
            {copyStatus === 'copied'
              ? t.tasksCopied
              : copyStatus === 'failed'
                ? t.tasksCopyFailed
                : ''}
          </p>
        </div>
      </div>

      <section aria-labelledby="tasks-today-heading" className="flex max-w-2xl flex-col gap-4">
        <h2 id="tasks-today-heading" className="font-display text-2xl font-semibold text-olive-950">
          {t.tasksToday}
          <span className="ml-3 align-middle text-sm font-normal text-olive-700">
            {t.tasksDays[today]} {dateFmt.format(now)}
          </span>
        </h2>
        {todayTasks.length === 0 ? (
          <p className="text-olive-700">{t.tasksTodayEmpty}</p>
        ) : (
          <>
            <Progress
              label={t.tasksToday}
              done={doneOn(todayKey, todayTasks)}
              total={todayTasks.length}
            />
            <ul id="tasks-today" className="flex flex-col gap-3">
              {todayTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  idPrefix="today"
                  checked={isTicked(state, todayKey, task.id)}
                  onChange={() => onToggle(todayKey, task.id)}
                  t={t}
                />
              ))}
            </ul>
          </>
        )}
      </section>

      <section aria-labelledby="tasks-week-heading" className="flex flex-col gap-4">
        <h2 id="tasks-week-heading" className="font-display text-2xl font-semibold text-olive-950">
          {t.tasksThisWeek}
        </h2>
        <div className="max-w-2xl">
          <Progress label={t.tasksThisWeek} done={weekDone} total={weekTotal} />
        </div>
        <ol id="tasks-week" className="grid gap-4 lg:grid-cols-7">
          {DAYS.map((day) => {
            const key = dateKey(week[day])
            const jobs = plan.weekly[day]
            const all = [...plan.daily, ...jobs]
            const isToday = day === today
            return (
              <li
                key={day}
                className={`flex flex-col gap-3 rounded-2xl border p-4 ${
                  isToday ? 'border-sage-700 bg-sage-500/10' : 'border-olive-900/10 bg-paper-50/80'
                }`}
              >
                <h3 id={`tasks-day-${day}`} className="font-semibold text-olive-950">
                  {t.tasksDays[day]}{' '}
                  <span className="text-sm font-normal text-olive-700">
                    {dateFmt.format(week[day])}
                  </span>
                </h3>
                <Progress label={t.tasksDays[day]} done={doneOn(key, all)} total={all.length} />
                {plan.daily.length > 0 && (
                  <p className="text-xs text-olive-700">
                    {fill(t.tasksDailyLine, {
                      done: doneOn(key, plan.daily),
                      total: plan.daily.length,
                    })}
                  </p>
                )}
                {jobs.length === 0 ? (
                  <p className="text-sm text-olive-700">{t.tasksDayEmpty}</p>
                ) : (
                  <ul className="flex flex-col gap-3 text-sm">
                    {jobs.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        idPrefix={`week-${day}`}
                        checked={isTicked(state, key, task.id)}
                        onChange={() => onToggle(key, task.id)}
                        t={t}
                      />
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ol>
      </section>

      <section aria-labelledby="tasks-month-heading" className="flex max-w-2xl flex-col gap-4">
        <h2 id="tasks-month-heading" className="font-display text-2xl font-semibold text-olive-950">
          {t.tasksMonthly}
        </h2>
        {plan.monthly.length === 0 ? (
          <p className="text-olive-700">{t.tasksMonthlyEmpty}</p>
        ) : (
          <>
            <p className="text-sm text-olive-700">{t.tasksMonthlyHint}</p>
            <ul id="tasks-month" className="flex flex-col gap-3">
              {plan.monthly.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  idPrefix="month"
                  checked={isTicked(state, month, task.id)}
                  onChange={() => onToggle(month, task.id)}
                  t={t}
                />
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  )
}
