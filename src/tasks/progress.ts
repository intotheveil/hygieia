// TODAY'S PROGRESS OF A TASK PLAN (connect the features, 2026-10-06) — pure, for the /profile
// "Your task plans" panel. Which topics have a finished questionnaire in local storage, and for one
// topic, how many of today's tasks (daily + today's weekly jobs, exactly the Today checklist of
// ./PlanView.tsx) are ticked.

import { dateKey, dayOf } from './dates'
import { TOPIC_IDS, type TopicId } from './content/topics'
import { generatePlan, isComplete, normalizeAnswers } from './generate'
import { isTicked, loadTasksState, type TasksState } from './storage'
import type { Topic } from './types'

/** Topics with saved answers, in TOPIC_IDS order. Never throws (storage failures read as none). */
export function topicsWithPlans(storage: Pick<Storage, 'getItem'> | null): TopicId[] {
  if (storage === null) return []
  return TOPIC_IDS.filter((id) => loadTasksState(storage, id).answers !== null)
}

export interface DayProgress {
  done: number
  total: number
}

/** Today's ticked / planned count, or null when the answers do not make a plan. */
export function todayProgress(topic: Topic, state: TasksState, now: Date): DayProgress | null {
  if (state.answers === null) return null
  const answers = normalizeAnswers(topic, state.answers)
  if (!isComplete(topic, answers)) return null
  const plan = generatePlan(topic, answers)
  const key = dateKey(now)
  const tasks = [...plan.daily, ...plan.weekly[dayOf(now)]]
  return {
    done: tasks.filter((task) => isTicked(state, key, task.id)).length,
    total: tasks.length,
  }
}
