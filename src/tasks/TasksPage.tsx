// /tasks and /tasks/:topic (P9, Tasks Advisor). `/tasks` is the topic grid, rendered from the small
// topic list in the page chunk (./content/topics.ts). `/tasks/<topic>` lazily loads that topic's
// questionnaire and task bank (one chunk per topic, ./content/index.ts), then shows either the
// questionnaire (./Questionnaire.tsx) or, once answered, the generated plan (./PlanView.tsx,
// ./generate.ts). Answers and ticks persist in localStorage `hygieia:tasks:<topic>` (./storage.ts):
// bundled content, no database, the same for signed-in and anonymous visitors.
//
// The H1 (the topic title) and the intro paint before the chunk resolves, so the a11y and
// Lighthouse gates see a stable frame; `#tasks-question` / `#tasks-plan` mark the settled page.

import { useCallback, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EmptyState, ErrorState, Loading } from '../components/AsyncState'
import { useLang } from '../i18n/LangProvider'
import { tasksCopy } from '../i18n/features/tasks.ts'
import { useAsync } from '../lib/useAsync'
import { loadTopic as defaultLoadTopic } from './content/index'
import { TOPICS, TOPIC_IDS, isTopicId, type TopicId } from './content/topics'
import { generatePlan, isComplete, normalizeAnswers } from './generate'
import { PlanView } from './PlanView'
import { Questionnaire } from './Questionnaire'
import {
  defaultTasksState,
  loadTasksState,
  saveTasksState,
  toggleTick,
  type TasksState,
} from './storage'
import type { Answers, Topic } from './types'

type TasksStorage = Pick<Storage, 'getItem' | 'setItem'>

export interface TasksPageProps {
  /** The clock (tests pin it). */
  now?: () => Date
  /** Defaults to `window.localStorage`; null keeps everything in memory. */
  storage?: TasksStorage | null
  /** Defaults to the lazy topic chunks; tests pass a fake. */
  loadTopic?: (id: TopicId) => Promise<Topic>
}

function browserStorage(): TasksStorage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

const systemNow = () => new Date()

const MAIN = 'mx-auto flex min-h-dvh max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6'

function TopicGrid() {
  const { t, lang } = useLang(tasksCopy)
  return (
    <main className={MAIN}>
      <header className="flex max-w-3xl flex-col gap-3">
        <h1 className="font-display text-3xl font-semibold text-olive-950">{t.tasksTitle}</h1>
        <p className="leading-relaxed text-olive-700">{t.tasksIntro}</p>
        <p role="note" className="text-sm leading-relaxed text-olive-700">
          {t.tasksLocalNote}
        </p>
      </header>
      <section aria-labelledby="tasks-topics-heading" className="flex flex-col gap-4">
        <h2
          id="tasks-topics-heading"
          className="font-display text-2xl font-semibold text-olive-950"
        >
          {t.tasksChooseTopic}
        </h2>
        <ul id="tasks-topics" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TOPIC_IDS.map((id) => {
            const topic = TOPICS[id]
            return (
              <li
                key={id}
                className="relative flex flex-col gap-3 rounded-2xl border border-olive-900/10 bg-paper-50/80 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span
                  aria-hidden="true"
                  className="grid size-10 place-items-center rounded-xl bg-sage-500/15 font-display text-xl text-sage-700"
                >
                  {topic.icon}
                </span>
                <h3 className="font-display text-xl font-semibold text-olive-950">
                  <Link
                    to={`/tasks/${id}`}
                    className="after:absolute after:inset-0 after:rounded-2xl hover:underline focus-visible:underline"
                  >
                    {topic.title[lang]}
                  </Link>
                </h3>
                <p className="text-sm leading-relaxed text-olive-700">{topic.blurb[lang]}</p>
              </li>
            )
          })}
        </ul>
      </section>
    </main>
  )
}

function BackLink() {
  const { t } = useLang(tasksCopy)
  return (
    <Link
      to="/tasks"
      className="self-start text-sm font-medium text-sage-700 underline-offset-2 hover:underline print:hidden"
    >
      ← {t.tasksBackToTopics}
    </Link>
  )
}

function TopicFlow({
  topicId,
  now,
  storage,
  load,
}: {
  topicId: TopicId
  now: () => Date
  storage: TasksStorage | null
  load: (id: TopicId) => Promise<Topic>
}) {
  const { t, lang } = useLang(tasksCopy)
  const meta = TOPICS[topicId]
  const run = useCallback(() => load(topicId), [load, topicId])
  const topic = useAsync(run)
  const [state, setState] = useState<TasksState>(() =>
    storage ? loadTasksState(storage, topicId) : defaultTasksState(),
  )

  const update = (next: TasksState) => {
    setState(next)
    if (storage) saveTasksState(storage, topicId, next)
  }

  const plan = useMemo(() => {
    if (topic.status !== 'ready' || state.answers === null) return null
    const answers = normalizeAnswers(topic.data, state.answers)
    return isComplete(topic.data, answers) ? generatePlan(topic.data, answers) : null
  }, [topic, state.answers])

  return (
    <main className={MAIN}>
      <header className="flex max-w-3xl flex-col gap-3">
        <BackLink />
        <div className="flex items-center gap-3">
          {/* The glyph sits OUTSIDE the h1, so the heading's text is exactly the topic title. */}
          <span aria-hidden="true" className="font-display text-3xl text-sage-700">
            {meta.icon}
          </span>
          <h1 className="font-display text-3xl font-semibold text-olive-950">{meta.title[lang]}</h1>
        </div>
        <p className="leading-relaxed text-olive-700">{meta.blurb[lang]}</p>
      </header>

      {topic.status === 'loading' ? (
        <Loading variant="detail" />
      ) : topic.status === 'error' ? (
        <ErrorState message={t.tasksLoadFailed} onRetry={topic.reload} />
      ) : plan === null ? (
        <Questionnaire
          topic={topic.data}
          onDone={(answers: Answers) => update({ ...state, answers })}
        />
      ) : (
        <PlanView
          topic={topic.data}
          plan={plan}
          state={state}
          now={now()}
          onToggle={(period, taskId) => update(toggleTick(state, period, taskId))}
          onRetake={() => update({ ...state, answers: null })}
        />
      )}
    </main>
  )
}

export function TasksPage({
  now = systemNow,
  storage = browserStorage(),
  loadTopic = defaultLoadTopic,
}: TasksPageProps) {
  const { t } = useLang(tasksCopy)
  const { topic } = useParams()
  if (topic === undefined) return <TopicGrid />
  if (!isTopicId(topic)) {
    return (
      <main className={MAIN}>
        <header className="flex flex-col gap-3">
          <BackLink />
          <h1 className="font-display text-3xl font-semibold text-olive-950">{t.tasksTitle}</h1>
        </header>
        <EmptyState title={t.tasksUnknownTopic} icon="☑" />
      </main>
    )
  }
  // `key`: a different topic is a fresh flow (its own storage key, questionnaire step and chunk).
  return <TopicFlow key={topic} topicId={topic} now={now} storage={storage} load={loadTopic} />
}
