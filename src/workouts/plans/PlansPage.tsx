// /workouts/plans (P8.3, operator: "Set up workout plans - register progress etc. Modern"). NOT
// behind RequireAuth: signed-out or local-only the page renders its H1, intro and the bilingual
// SignedOutNote (the /profile pattern), so the Lighthouse and a11y gates audit it like any other
// route — and in that state it reads NOTHING (no content seed, no user data). Signed in: one
// `Promise.all` over plans, sessions and the workout templates → active plans (schedule grid,
// progress ring, log / complete / abandon), the session logger, the plan builder (open by default
// when there is no active plan or `?template=` names one — the "Start plan" button on /workouts),
// progress per exercise with PRs, session history, past plans. Writes patch the loaded data through
// `useOverlay` (as /profile does); PRs and progress are recomputed from the sessions on every render.
// `source`, `content` and `today` are injectable for tests; the app passes nothing.

import { useCallback, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { EmptyState, ErrorState, Loading } from '../../components/AsyncState'
import { SignedOutNote } from '../../components/SignedOutNote'
import {
  contentSource,
  type ContentSource,
  type Exercise,
  type WorkoutTemplate,
} from '../../content'
import { useLang } from '../../i18n/LangProvider'
import { fill } from '../../i18n/fill'
import { useAsyncResult, type ResultLike } from '../../lib/useAsync'
import { formatDate } from '../../profile/format'
import { localIsoDate } from '../../profile/stats'
import { H2, PILL, SECTION } from '../../profile/styles'
import { useOverlay } from '../../profile/useOverlay'
import {
  ok,
  type PlanStatus,
  type Result,
  type UserDataSource,
  type WorkoutPlan,
  type WorkoutPlanInput,
  type WorkoutSession,
} from '../../user/source'
import { useUserData } from '../../user/useUserData'
import { ActivePlanCard } from './ActivePlanCard'
import { PlanBuilder } from './PlanBuilder'
import { ProgressPanel } from './ProgressPanel'
import { SessionHistory } from './SessionHistory'
import { SessionLogger } from './SessionLogger'
import { detectPRs } from './progress'

interface Loaded {
  plans: WorkoutPlan[]
  sessions: WorkoutSession[]
  templates: WorkoutTemplate[]
}

const EMPTY: Loaded = { plans: [], sessions: [], templates: [] }

async function loadAll(
  user: UserDataSource,
  content: ContentSource,
): Promise<ResultLike<Loaded, string>> {
  if (user.kind === 'disabled') return ok(EMPTY)
  const [plans, sessions, templates] = await Promise.all([
    user.listWorkoutPlans(),
    user.listWorkoutSessions(),
    content.listWorkoutTemplates(),
  ])
  if (!plans.ok) return plans
  if (!sessions.ok) return sessions
  if (!templates.ok) return templates
  return ok({ plans: plans.data, sessions: sessions.data, templates: templates.data })
}

const newestFirst = (sessions: readonly WorkoutSession[]) =>
  [...sessions].sort(
    (a, b) =>
      b.performed_at.localeCompare(a.performed_at) || b.created_at.localeCompare(a.created_at),
  )

export interface PlansPageProps {
  source?: UserDataSource
  content?: ContentSource
  /** `YYYY-MM-DD`; defaults to the local calendar date. */
  today?: string
}

export function PlansPage({ source, content = contentSource, today }: PlansPageProps) {
  const { t, lang } = useLang()
  const fromHook = useUserData()
  const userData = source ?? fromHook
  const todayIso = today ?? localIsoDate(new Date())
  const [params, setParams] = useSearchParams()
  const templateParam = params.get('template')

  const load = useCallback(() => loadAll(userData, content), [userData, content])
  const state = useAsyncResult(load)
  const loaded = state.status === 'ready' ? state.data : null
  const [data, setData] = useOverlay<Loaded | null>(loaded)
  const [logging, setLogging] = useState<WorkoutPlan | null>(null)
  const [builderOpen, setBuilderOpen] = useState<boolean | null>(null)
  const [savedNote, setSavedNote] = useState<{ pr: boolean } | null>(null)

  const patch = useCallback(
    (update: (current: Loaded) => Loaded) =>
      setData((current) => (current === null ? current : update(current))),
    [setData],
  )

  const templates = useMemo(
    () => new Map((data?.templates ?? []).map((tpl) => [tpl.id, tpl])),
    [data],
  )
  const exercises = useMemo(() => {
    const map = new Map<string, Exercise>()
    for (const tpl of data?.templates ?? []) {
      for (const slot of tpl.slots)
        if (slot.exercise !== null) map.set(slot.exercise.id, slot.exercise)
    }
    return map
  }, [data])
  const plansById = useMemo(() => new Map((data?.plans ?? []).map((p) => [p.id, p])), [data])
  const records = useMemo(() => detectPRs(data?.sessions ?? []), [data])

  const createPlan = useCallback(
    async (input: WorkoutPlanInput): Promise<Result<WorkoutPlan>> => {
      const result = await userData.createWorkoutPlan(input)
      if (result.ok) {
        patch((c) => ({ ...c, plans: [result.data, ...c.plans] }))
        setBuilderOpen(false)
        if (templateParam !== null) setParams({}, { replace: true })
      }
      return result
    },
    [userData, patch, templateParam, setParams],
  )

  const setStatus = useCallback(
    async (plan: WorkoutPlan, status: PlanStatus): Promise<Result<WorkoutPlan>> => {
      const result = await userData.setWorkoutPlanStatus(plan.id, status)
      if (result.ok) {
        patch((c) => ({ ...c, plans: c.plans.map((p) => (p.id === plan.id ? result.data : p)) }))
        setLogging((current) => (current?.id === plan.id ? null : current))
      }
      return result
    },
    [userData, patch],
  )

  const sessionSaved = useCallback(
    (session: WorkoutSession) => {
      // PRs are judged against what is on screen now (the updater below may run later).
      const pr = detectPRs([session, ...(data?.sessions ?? [])]).has(session.id)
      patch((c) => ({ ...c, sessions: newestFirst([session, ...c.sessions]) }))
      setLogging(null)
      setSavedNote({ pr })
    },
    [patch, data],
  )

  const deleteSession = useCallback(
    async (session: WorkoutSession): Promise<Result<void>> => {
      const result = await userData.deleteWorkoutSession(session.id)
      if (!result.ok) return result
      patch((c) => ({ ...c, sessions: c.sessions.filter((s) => s.id !== session.id) }))
      setSavedNote(null)
      // Best-effort: the workout entry the logger wrote for this session (payload.session_id).
      const day = { from: session.performed_at, to: session.performed_at }
      const entries = await userData.listEntries(day)
      if (entries.ok) {
        for (const entry of entries.data) {
          const payload = entry.payload
          const linked =
            entry.kind === 'workout' &&
            payload !== null &&
            typeof payload === 'object' &&
            !Array.isArray(payload) &&
            payload.session_id === session.id
          if (linked) await userData.deleteEntry(entry.id)
        }
      }
      return result
    },
    [userData, patch],
  )

  const active = data?.plans.filter((p) => p.status === 'active') ?? []
  const past = data?.plans.filter((p) => p.status !== 'active') ?? []
  const showBuilder = builderOpen ?? (templateParam !== null || active.length === 0)

  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-3">
        <h1 className="font-display text-3xl font-semibold text-olive-950">{t.wpTitle}</h1>
        <p className="max-w-3xl leading-relaxed text-olive-700">{t.wpIntro}</p>
      </header>

      {userData.kind === 'disabled' ? (
        <SignedOutNote reason={userData.reason ?? 'signed-out'} />
      ) : state.status === 'error' ? (
        <ErrorState message={t.wpLoadFailed} onRetry={state.reload} />
      ) : data === null ? (
        <Loading variant="panel" />
      ) : (
        <>
          <p className="flex flex-wrap gap-4 text-sm font-medium text-olive-900">
            <Link to="/workouts" className="underline">
              {t.workoutsTitle} →
            </Link>
            <Link to="/profile" className="underline">
              {t.profileLink} →
            </Link>
          </p>

          {savedNote !== null && (
            <p
              role="status"
              className="rounded-xl bg-paper-200/60 px-4 py-3 text-sm font-medium text-olive-900"
            >
              {savedNote.pr ? t.wpSavedPr : t.wpSaved}
            </p>
          )}

          {logging !== null && (
            <SessionLogger
              key={logging.id}
              source={userData}
              plan={logging}
              template={templates.get(logging.template_id) ?? null}
              today={todayIso}
              onSaved={sessionSaved}
              onCancel={() => setLogging(null)}
            />
          )}

          <section aria-labelledby="wp-active" className={SECTION}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="wp-active" className={H2}>
                {t.wpActiveHeading}
              </h2>
              {!showBuilder && (
                <button type="button" onClick={() => setBuilderOpen(true)} className={PILL}>
                  {t.wpNewPlan}
                </button>
              )}
            </div>
            {active.length === 0 ? (
              <EmptyState title={t.wpNoActive} hint={t.wpNoActiveHint} icon="◎" />
            ) : (
              <div className="flex flex-col gap-4">
                {active.map((plan) => (
                  <ActivePlanCard
                    key={plan.id}
                    plan={plan}
                    template={templates.get(plan.template_id) ?? null}
                    sessions={data.sessions}
                    today={todayIso}
                    onLog={(p) => {
                      setSavedNote(null)
                      setLogging(p)
                    }}
                    onStatus={setStatus}
                  />
                ))}
              </div>
            )}
          </section>

          {showBuilder && (
            <PlanBuilder
              key={templateParam ?? 'none'}
              templates={data.templates}
              initialTemplateId={templateParam}
              today={todayIso}
              onCreate={createPlan}
              onCancel={active.length > 0 ? () => setBuilderOpen(false) : undefined}
            />
          )}

          <ProgressPanel sessions={data.sessions} exercises={exercises} today={todayIso} />

          <SessionHistory
            sessions={newestFirst(data.sessions)}
            plans={plansById}
            exercises={exercises}
            records={records}
            onDelete={deleteSession}
          />

          {past.length > 0 && (
            <section aria-labelledby="wp-past" className={SECTION}>
              <h2 id="wp-past" className={H2}>
                {t.wpPastHeading}
              </h2>
              <ul className="flex flex-col gap-2">
                {past.map((plan) => (
                  <li
                    key={plan.id}
                    data-testid="past-plan"
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-paper-200/60 px-4 py-2 text-sm"
                  >
                    <span className="font-medium text-olive-950">{plan.name}</span>
                    <span className="text-olive-700">
                      {t.wpStatus[plan.status]} ·{' '}
                      {fill(t.wpDates, {
                        start: formatDate(plan.start_date, lang),
                        end: formatDate(plan.updated_at.slice(0, 10), lang),
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  )
}
