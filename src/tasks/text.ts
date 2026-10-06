// TASKS ADVISOR — "Copy as text" (P9). Pure: the plan as plain text in the current language, for a
// note, a message or a fridge door. No ticks: it is the plan, not the progress.

import type { AppDictionary, Lang } from '../i18n/app'
import type { TasksDictionary } from '../i18n/features/tasks.ts'

/** The `t` of a /tasks component: `useLang(tasksCopy)`. */
export type TasksT = AppDictionary & TasksDictionary
import { fill, plural } from '../i18n/fill'
import type { Plan } from './generate'
import { DAYS, type Task, type TopicMeta } from './types'

function line(task: Task, lang: Lang, t: TasksT): string {
  const kickoff = task.kickoff ? ` [${t.tasksKickoff}]` : ''
  return `- [ ] ${task.title[lang]} (${plural(t.minutes, task.minutes)})${kickoff}`
}

export function planToText(topic: TopicMeta, plan: Plan, lang: Lang, t: TasksT): string {
  const out: string[] = [topic.title[lang], fill(t.tasksBudgetNote, { n: plan.budget })]
  if (plan.gentle) out.push(`${t.tasksGentleTitle}: ${fill(t.tasksGentleBody, { n: plan.budget })}`)
  out.push('', `${t.tasksEveryDay}:`)
  for (const task of plan.daily) out.push(line(task, lang, t))
  if (plan.daily.length === 0) out.push('-')
  out.push('', `${t.tasksThisWeek}:`)
  for (const day of DAYS) {
    const tasks = plan.weekly[day]
    out.push(`${t.tasksDays[day]}:`)
    if (tasks.length === 0) out.push('-')
    for (const task of tasks) out.push(line(task, lang, t))
  }
  out.push('', `${t.tasksMonthly}:`)
  if (plan.monthly.length === 0) out.push('-')
  for (const task of plan.monthly) out.push(line(task, lang, t))
  return out.join('\n')
}
