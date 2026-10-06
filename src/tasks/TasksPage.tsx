// /tasks and /tasks/:topic (P9, Tasks Advisor). `/tasks` is the topic grid, rendered from the small
// topic list in the page chunk (./content/topics.ts). `/tasks/<topic>` lazily loads that topic's
// questionnaire and task bank (one chunk per topic, ./content/index.ts), then shows either the
// questionnaire (./Questionnaire.tsx) or, once answered, the generated plan (./PlanView.tsx,
// ./generate.ts). Answers and ticks persist in localStorage `hygieia:tasks:<topic>` (./storage.ts):
// bundled content, no database, the same for signed-in and anonymous visitors.
//
// Connected to the rest of the app (2026-10-06):
//   - signed in, a plan offers "Log ticked tasks to my profile" (default on) when it has trackable
//     tasks: a tick mirrors into a profile entry, an un-tick deletes it (./track.ts, ./sync.ts). The
//     local tick stays the source of truth; a failed write only shows a note.
//   - `/tasks/skincare-habit?routine=<slug>&skin=…&time=…&area=…` (a /skincare routine card) pre-fills
//     the questionnaire and keeps the routine's steps as a "Your routine" checklist above the plan
//     (./routine.ts, ./RoutineSection.tsx). The routine is fetched from the content source on demand
//     (a dynamic import: the page chunk does not carry the content layer).
//   - the workout-routine plan links to /workouts/plans with a template cell pre-selected (./links.ts).
//
// The H1 (the topic title) and the intro paint before the chunk resolves, so the a11y and
// Lighthouse gates see a stable frame; `#tasks-question` / `#tasks-plan` mark the settled page.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { EmptyState, ErrorState, Loading } from '../components/AsyncState'
import { useLang } from '../i18n/LangProvider'
import { tasksCopy } from '../i18n/features/tasks.ts'
import { useAsync } from '../lib/useAsync'
import type { UserDataSource } from '../user/source'
import { useUserData } from '../user/useUserData'
import { loadTopic as defaultLoadTopic } from './content/index'
import { TOPICS, TOPIC_IDS, isTopicId, type TopicId } from './content/topics'
import { generatePlan, isComplete, normalizeAnswers } from './generate'
import { WORKOUT_TOPIC, workoutPlanLink } from './links'
import { PlanView } from './PlanView'
import { Questionnaire } from './Questionnaire'
import {
  HABIT_TOPIC,
  answersFromParams,
  fromSkincareRoutine,
  routineSlugFrom,
  type RoutineSection as Routine,
} from './routine'
import { RoutineSection } from './RoutineSection'
import {
  defaultTasksState,
  isTicked,
  loadTasksState,
  logsToProfile,
  saveTasksState,
  toggleTick,
  type TasksState,
} from './storage'
import { createQueue, syncTick } from './sync'
import { anyTrackable } from './track'
import type { Answers, Topic } from './types'

type TasksStorage = Pick<Storage, 'getItem' | 'setItem'>

export interface TasksPageProps {
  /** The clock (tests pin it). */
  now?: () => Date
  /** Defaults to `window.localStorage`; null keeps everything in memory. */
  storage?: TasksStorage | null
  /** Defaults to the lazy topic chunks; tests pass a fake. */
  loadTopic?: (id: TopicId) => Promise<Topic>
  /** Defaults to the session's user data (`useUserData`); tests pass `memorySource`. */
  userData?: UserDataSource
  /** A /skincare routine by slug as a "Your routine" section (null = no such routine). */
  loadRoutine?: (slug: string) => Promise<Routine | null>
}

function browserStorage(): TasksStorage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

const systemNow = () => new Date()

/** The routine from the app's content source, imported on demand (bundled or supabase). */
async function defaultLoadRoutine(slug: string): Promise<Routine | null> {
  const { contentSource } = await import('../content/index.ts')
  const [routines, types] = await Promise.all([
    contentSource.listSkincareRoutines(),
    contentSource.listSkincareProductTypes(),
  ])
  if (!routines.ok) throw new Error(`routines: ${routines.error}`)
  const routine = routines.data.find((r) => r.slug === slug)
  return routine === undefined ? null : fromSkincareRoutine(routine, types.ok ? types.data : [])
}

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

/** The "Log to profile" switch (signed in, trackable plan only). */
function LogToggle({
  on,
  failed,
  onChange,
}: {
  on: boolean
  failed: boolean
  onChange: (on: boolean) => void
}) {
  const { t } = useLang(tasksCopy)
  return (
    <div className="flex max-w-3xl flex-col gap-1 print:hidden">
      <label className="flex cursor-pointer items-center gap-3 text-olive-900">
        <input
          id="tasks-log"
          type="checkbox"
          checked={on}
          onChange={(e) => onChange(e.target.checked)}
          aria-describedby="tasks-log-hint"
          className="size-4 accent-sage-700"
        />
        <span className="font-medium">{t.tasksLogToggle}</span>
      </label>
      <p id="tasks-log-hint" className="pl-7 text-sm text-olive-700">
        {t.tasksLogHint}
      </p>
      {failed && (
        <p role="alert" className="pl-7 text-sm text-clay-700">
          {t.tasksLogFailed}
        </p>
      )}
    </div>
  )
}

function TopicFlow({
  topicId,
  now,
  storage,
  load,
  userData,
  loadRoutine,
}: {
  topicId: TopicId
  now: () => Date
  storage: TasksStorage | null
  load: (id: TopicId) => Promise<Topic>
  userData: UserDataSource
  loadRoutine: (slug: string) => Promise<Routine | null>
}) {
  const { t, lang } = useLang(tasksCopy)
  const meta = TOPICS[topicId]
  const [params, setParams] = useSearchParams()
  const run = useCallback(() => load(topicId), [load, topicId])
  const topic = useAsync(run)

  // A routine deep link (skincare-habit only) names the routine to keep and pre-fills answers.
  const [linked] = useState(() => {
    const slug = topicId === HABIT_TOPIC ? routineSlugFrom(params) : null
    return { slug, answers: slug === null ? {} : answersFromParams(params) }
  })
  const [initialState] = useState<TasksState>(() => {
    const stored = storage ? loadTasksState(storage, topicId) : defaultTasksState()
    return linked.slug === null || stored.routine === linked.slug
      ? stored
      : { ...stored, routine: linked.slug }
  })
  const [state, setState] = useState<TasksState>(initialState)
  const persistedLink = useRef(false)
  useEffect(() => {
    // Persist the routine the link brought in, once (later changes go through `update`).
    if (persistedLink.current || storage === null || linked.slug === null) return
    persistedLink.current = true
    saveTasksState(storage, topicId, initialState)
  }, [storage, topicId, linked.slug, initialState])

  const update = (next: TasksState) => {
    setState(next)
    if (storage) saveTasksState(storage, topicId, next)
  }

  const routineSlug = state.routine ?? null
  const runRoutine = useCallback(
    () => (routineSlug === null ? Promise.resolve(null) : loadRoutine(routineSlug)),
    [loadRoutine, routineSlug],
  )
  const routine = useAsync(runRoutine)
  /** The section to render: loaded, failed (or no such routine), or nothing yet. */
  const section: Routine | 'error' | null =
    routineSlug === null || routine.status === 'loading'
      ? null
      : routine.status === 'error' || routine.data === null
        ? 'error'
        : routine.data

  const plan = useMemo(() => {
    if (topic.status !== 'ready' || state.answers === null) return null
    const answers = normalizeAnswers(topic.data, state.answers)
    return isComplete(topic.data, answers) ? generatePlan(topic.data, answers) : null
  }, [topic, state.answers])

  const routineTasks = useMemo(
    () => (routine.status === 'ready' && routine.data !== null ? routine.data.tasks : []),
    [routine],
  )
  const taskById = useMemo(() => {
    const all = [...(topic.status === 'ready' ? topic.data.tasks : []), ...routineTasks]
    return new Map(all.map((task) => [task.id, task]))
  }, [topic, routineTasks])

  // Ticks → profile entries, one at a time in tick order (./sync.ts).
  const signedIn = userData.kind !== 'disabled'
  const [enqueue] = useState(() => createQueue())
  const [logFailed, setLogFailed] = useState(false)
  const trackable =
    topic.status === 'ready' && anyTrackable(topicId, [...topic.data.tasks, ...routineTasks])

  const toggle = (period: string, taskId: string) => {
    const next = toggleTick(state, period, taskId)
    update(next)
    const task = taskById.get(taskId)
    if (!signedIn || task === undefined) return
    const change = {
      topicId,
      task,
      period,
      ticked: isTicked(next, period, taskId),
      log: logsToProfile(state),
    }
    void enqueue(() => syncTick(userData, change)).then((outcome) =>
      setLogFailed(outcome === 'failed'),
    )
  }

  const removeRoutine = () => {
    update({ ...state, routine: undefined })
    if (linked.slug !== null) setParams({}, { replace: true })
  }

  const initialAnswers: Answers | undefined =
    topic.status === 'ready' && Object.keys(linked.answers).length > 0
      ? normalizeAnswers(topic.data, linked.answers)
      : undefined

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
        <>
          {initialAnswers !== undefined && (
            <p role="note" className="max-w-2xl text-sm text-olive-700">
              {t.tasksPrefilled}
            </p>
          )}
          <Questionnaire
            topic={topic.data}
            initial={initialAnswers}
            onDone={(answers: Answers) => update({ ...state, answers })}
          />
        </>
      ) : (
        <>
          {signedIn && trackable && (
            <LogToggle
              on={logsToProfile(state)}
              failed={logFailed}
              onChange={(on) => update({ ...state, log: on ? undefined : false })}
            />
          )}
          {topicId === WORKOUT_TOPIC && state.answers !== null && (
            <p className="print:hidden">
              <Link
                to={workoutPlanLink(state.answers)}
                data-testid="tasks-to-workout-plan"
                className="font-medium text-sage-700 underline-offset-2 hover:underline"
              >
                {t.tasksToWorkoutPlan} →
              </Link>
            </p>
          )}
          {section !== null && (
            <RoutineSection
              section={section}
              state={state}
              now={now()}
              onToggle={toggle}
              onRemove={removeRoutine}
            />
          )}
          <PlanView
            topic={topic.data}
            plan={plan}
            state={state}
            now={now()}
            onToggle={toggle}
            onRetake={() => update({ ...state, answers: null })}
          />
        </>
      )}
    </main>
  )
}

export function TasksPage({
  now = systemNow,
  storage = browserStorage(),
  loadTopic = defaultLoadTopic,
  userData,
  loadRoutine = defaultLoadRoutine,
}: TasksPageProps) {
  const { t } = useLang(tasksCopy)
  const session = useUserData()
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
  return (
    <TopicFlow
      key={topic}
      topicId={topic}
      now={now}
      storage={storage}
      load={loadTopic}
      userData={userData ?? session}
      loadRoutine={loadRoutine}
    />
  )
}
