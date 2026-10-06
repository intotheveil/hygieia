// YOUR TASK PLANS (connect the features, 2026-10-06): a compact panel on /profile listing every
// Tasks Advisor topic with saved answers in THIS browser (`hygieia:tasks:<topic>`, src/tasks/storage.ts)
// with today's progress and a link to the plan. Local data, so it shows signed in or not, and
// renders nothing at all when no plan exists (a fresh visit — what the Lighthouse and a11y gates
// see). Titles come from the small topic list; each listed topic's task bank is a lazy chunk,
// loaded only to count today's tasks — the row is a link from the first paint, the count follows.

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../i18n/LangProvider'
import { fill } from '../i18n/fill'
import { profileCopy } from '../i18n/features/profile.ts'
import { loadTopic as defaultLoadTopic } from '../tasks/content/index'
import { TOPICS, type TopicId } from '../tasks/content/topics'
import { todayProgress, topicsWithPlans, type DayProgress } from '../tasks/progress'
import { loadTasksState } from '../tasks/storage'
import type { Topic } from '../tasks/types'
import { H2, SECTION } from './styles'

type ReadStorage = Pick<Storage, 'getItem'>

export interface TaskPlansPanelProps {
  /** Defaults to `window.localStorage`; null = no plans. */
  storage?: ReadStorage | null
  now?: Date
  loadTopic?: (id: TopicId) => Promise<Topic>
}

function browserStorage(): ReadStorage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function TaskPlansPanel({
  storage = browserStorage(),
  now,
  loadTopic = defaultLoadTopic,
}: TaskPlansPanelProps) {
  const { t, lang } = useLang(profileCopy)
  const [ids] = useState(() => topicsWithPlans(storage))
  const [progress, setProgress] = useState<Partial<Record<TopicId, DayProgress | null>>>({})
  const [clock] = useState(() => now ?? new Date())

  useEffect(() => {
    if (storage === null) return
    let live = true
    for (const id of ids) {
      loadTopic(id)
        .then((topic) => {
          const value = todayProgress(topic, loadTasksState(storage, id), clock)
          if (live) setProgress((p) => ({ ...p, [id]: value }))
        })
        .catch(() => {
          // A chunk that fails to load leaves the row without a count; the link still works.
        })
    }
    return () => {
      live = false
    }
  }, [ids, storage, loadTopic, clock])

  if (ids.length === 0) return null
  return (
    <section aria-labelledby="profile-task-plans" className={SECTION} data-testid="task-plans">
      <header className="flex flex-col gap-1">
        <h2 id="profile-task-plans" className={H2}>
          {t.profileTaskPlans}
        </h2>
        <p className="text-sm text-olive-700">{t.profileTaskPlansNote}</p>
      </header>
      <ul className="flex flex-col gap-2">
        {ids.map((id) => {
          const p = progress[id]
          const text =
            p === undefined || p === null
              ? ''
              : p.total === 0
                ? t.profileTaskNothingToday
                : fill(t.profileTaskToday, { done: p.done, total: p.total })
          return (
            <li
              key={id}
              data-topic={id}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-xl bg-paper-200/60 px-4 py-3"
            >
              <Link to={`/tasks/${id}`} className="font-medium text-olive-950 underline">
                <span aria-hidden="true" className="mr-2 text-sage-700">
                  {TOPICS[id].icon}
                </span>
                {TOPICS[id].title[lang]}
              </Link>
              <span className="text-sm text-olive-700" data-testid="task-plan-progress">
                {text}
              </span>
            </li>
          )
        })}
      </ul>
      <Link to="/tasks" className="self-start text-sm font-medium text-sage-700 underline">
        {t.profileTaskAll} →
      </Link>
    </section>
  )
}
