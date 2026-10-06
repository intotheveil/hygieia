import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { bundledSource } from '../../content/bundled'
import { fail, ok, type ContentSource, type WorkoutTemplate } from '../../content/source'
import { LangProvider } from '../../i18n/LangProvider'
import { el, en, type Lang } from '../../i18n/dictionary'
import { disabledSource } from '../../user/disabled'
import { memorySource, type MemorySourceOptions } from '../../user/memory'
import type { UserDataSource } from '../../user/source'
import { PlansPage } from './PlansPage'
import { PRESS, SQUAT, TEMPLATE, plan, session, set } from './fixtures'

// 2026-10-06 is a Tuesday; the fixture plan starts Thursday 2026-10-01 → plan week 1 is current.
const TODAY = '2026-10-06'

const HOME: WorkoutTemplate = {
  ...TEMPLATE,
  id: 'tpl-home',
  slug: 'home-beginner-moderate',
  workout_type: 'home',
  title_en: 'Home basics',
  title_el: 'Βασικά στο σπίτι',
}

function content(templates: WorkoutTemplate[] = [HOME, TEMPLATE]): ContentSource {
  return { ...bundledSource, listWorkoutTemplates: vi.fn(async () => ok(templates)) }
}

function LocationProbe() {
  const location = useLocation()
  return <span data-testid="location">{`${location.pathname}${location.search}`}</span>
}

function renderPage(
  source: UserDataSource,
  {
    lang = 'en',
    path = '/workouts/plans',
    cs = content(),
  }: { lang?: Lang; path?: string; cs?: ContentSource } = {},
) {
  render(
    <LangProvider initial={lang}>
      <MemoryRouter initialEntries={[path]}>
        <PlansPage source={source} content={cs} today={TODAY} />
        <LocationProbe />
      </MemoryRouter>
    </LangProvider>,
  )
  return cs
}

function mem(options: MemorySourceOptions = {}) {
  return memorySource({ now: () => `${TODAY}T12:00:00.000Z`, ...options })
}

const activeCard = () => screen.findByRole('article', { name: plan().name })
const cells = (card: HTMLElement) =>
  within(card).getAllByRole('img', { name: /^Week \d+, day \d+/ })
const filled = (card: HTMLElement) => cells(card).filter((c) => c.dataset.filled === 'true')

describe('<PlansPage> — disabled user data', () => {
  it.each(['local-only', 'signed-out'] as const)(
    'renders H1, intro and the signed-out note (%s) and reads nothing',
    async (reason) => {
      const cs = renderPage(disabledSource(reason))
      expect(screen.getByRole('heading', { level: 1, name: en.wpTitle })).toBeInTheDocument()
      expect(screen.getByText(en.wpIntro)).toBeInTheDocument()
      const note = await screen.findByRole('note')
      expect(note).toHaveTextContent(
        reason === 'local-only' ? en.userDataUnavailableLocal : en.userDataSignInToSave,
      )
      expect(screen.queryByRole('status')).toBeNull()
      expect(screen.queryByRole('region')).toBeNull()
      expect(cs.listWorkoutTemplates).not.toHaveBeenCalled()
    },
  )

  it('speaks Greek when signed out', async () => {
    renderPage(disabledSource('local-only'), { lang: 'el' })
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(el.wpTitle)
    expect(await screen.findByRole('note')).toHaveTextContent(el.userDataUnavailableLocal)
  })
})

describe('<PlansPage> — loading states', () => {
  it('shows the error state with Retry when a read fails, and recovers', async () => {
    const m = mem({ failing: new Set(['listWorkoutSessions'] as const) })
    renderPage(m.source)
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(en.wpLoadFailed)
    m.failOn('listWorkoutSessions', false)
    fireEvent.click(within(alert).getByRole('button', { name: en.retry }))
    expect(await screen.findByRole('heading', { name: en.wpActiveHeading })).toBeInTheDocument()
  })

  it('treats a content failure as a load error too', async () => {
    const cs = {
      ...bundledSource,
      listWorkoutTemplates: async () => fail<WorkoutTemplate[]>('network'),
    }
    renderPage(mem().source, { cs })
    expect(await screen.findByRole('alert')).toHaveTextContent(en.wpLoadFailed)
  })

  it('empty: no active plan, the builder open, empty progress and history', async () => {
    renderPage(mem().source)
    expect(await screen.findByText(en.wpNoActive)).toBeInTheDocument()
    expect(screen.getByRole('region', { name: en.wpBuilderHeading })).toBeInTheDocument()
    expect(screen.getByText(en.wpProgressEmpty)).toBeInTheDocument()
    expect(screen.getByText(en.wpHistoryEmpty)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: `${en.workoutsTitle} →` })).toHaveAttribute(
      'href',
      '/workouts',
    )
    expect(screen.getByRole('link', { name: `${en.profileLink} →` })).toHaveAttribute(
      'href',
      '/profile',
    )
  })
})

describe('<PlansPage> — plan builder', () => {
  it('pre-fills from ?template=, creates the plan with the exact payload, and shows a weeks × days grid', async () => {
    const m = mem()
    renderPage(m.source, { path: '/workouts/plans?template=tpl-gym' })
    const builder = await screen.findByRole('region', { name: en.wpBuilderHeading })
    expect(within(builder).getByRole('radio', { name: en.types.gym })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(within(builder).getByTestId('builder-template')).toHaveTextContent(TEMPLATE.title_en)
    expect(within(builder).getByLabelText(en.wpName)).toHaveValue(TEMPLATE.title_en)

    fireEvent.change(within(builder).getByLabelText(en.wpName), {
      target: { value: 'Autumn strength' },
    })
    fireEvent.change(within(builder).getByLabelText(en.wpWeeks), { target: { value: '4' } })
    fireEvent.change(within(builder).getByLabelText(en.wpDaysPerWeek), { target: { value: '3' } })
    fireEvent.change(within(builder).getByLabelText(en.wpStartDate), {
      target: { value: '2026-10-01' },
    })
    expect(within(builder).getByText('4 weeks × 3 days = 12 sessions')).toBeInTheDocument()
    fireEvent.click(within(builder).getByRole('button', { name: en.wpCreate }))

    const card = await activeCard()
    expect(m.store.workoutPlans).toHaveLength(1)
    const row = m.store.workoutPlans[0]!
    expect(row).toMatchObject({
      template_id: TEMPLATE.id,
      name: 'Autumn strength',
      weeks: 4,
      days_per_week: 3,
      start_date: '2026-10-01',
      status: 'active',
    })
    expect(row).not.toHaveProperty('user_id')
    expect(within(card).getAllByRole('listitem')).toHaveLength(4)
    expect(cells(card)).toHaveLength(12)
    expect(filled(card)).toHaveLength(0)
    expect(within(card).getByRole('progressbar', { name: 'Autumn strength' })).toHaveAttribute(
      'aria-valuetext',
      '0 of 12 sessions done',
    )
    // Week 1 (Thu 1 – Wed 7 Oct) is current on Tue 6 Oct.
    expect(within(card).getAllByRole('listitem')[0]).toHaveAttribute('data-current', 'true')
    expect(within(card).getByText(en.wpThisWeekBadge)).toBeInTheDocument()
    // The builder closed and the ?template= param is gone (the router commits the URL change in
    // its own update, which can land after the card under load — wait for it).
    expect(screen.queryByRole('region', { name: en.wpBuilderHeading })).toBeNull()
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(/^\/workouts\/plans$/),
    )
  })

  it('follows the chips: the default cell is home and the name tracks the session until typed', async () => {
    renderPage(mem().source)
    const builder = await screen.findByRole('region', { name: en.wpBuilderHeading })
    expect(within(builder).getByLabelText(en.wpName)).toHaveValue(HOME.title_en)
    fireEvent.click(within(builder).getByRole('radio', { name: en.types.gym }))
    expect(within(builder).getByLabelText(en.wpName)).toHaveValue(TEMPLATE.title_en)
    fireEvent.click(within(builder).getByRole('radio', { name: en.types.swimming }))
    expect(within(builder).getByText(en.wpNoTemplate)).toBeInTheDocument()
    fireEvent.click(within(builder).getByRole('button', { name: en.wpCreate }))
    expect(within(builder).getByRole('alert')).toHaveTextContent(en.wpFormErrors.template)
  })

  it('lists every invalid field and writes nothing', async () => {
    const m = mem()
    renderPage(m.source)
    const builder = await screen.findByRole('region', { name: en.wpBuilderHeading })
    fireEvent.change(within(builder).getByLabelText(en.wpName), { target: { value: '  ' } })
    fireEvent.change(within(builder).getByLabelText(en.wpWeeks), { target: { value: '13' } })
    fireEvent.change(within(builder).getByLabelText(en.wpDaysPerWeek), { target: { value: '0' } })
    fireEvent.click(within(builder).getByRole('button', { name: en.wpCreate }))
    const alert = within(builder).getByRole('alert')
    expect(alert).toHaveTextContent(en.wpFormErrors.name)
    expect(alert).toHaveTextContent(en.wpFormErrors.weeks)
    expect(alert).toHaveTextContent(en.wpFormErrors.days)
    expect(within(builder).getByLabelText(en.wpWeeks)).toHaveAttribute('aria-invalid', 'true')
    expect(m.store.workoutPlans).toEqual([])
  })

  it('shows an alert when the create is refused', async () => {
    const m = mem({ failing: new Set(['createWorkoutPlan'] as const) })
    renderPage(m.source)
    const builder = await screen.findByRole('region', { name: en.wpBuilderHeading })
    fireEvent.click(within(builder).getByRole('button', { name: en.wpCreate }))
    expect(await within(builder).findByRole('alert')).toHaveTextContent(en.wpCreateFailed)
  })

  it('is closed when a plan is active, and opens on "New plan" with a Cancel', async () => {
    renderPage(mem({ store: { workoutPlans: [plan()] } }).source)
    await activeCard()
    expect(screen.queryByRole('region', { name: en.wpBuilderHeading })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: en.wpNewPlan }))
    const builder = screen.getByRole('region', { name: en.wpBuilderHeading })
    fireEvent.click(within(builder).getByRole('button', { name: en.wpCancel }))
    expect(screen.queryByRole('region', { name: en.wpBuilderHeading })).toBeNull()
  })
})

describe('<PlansPage> — logging sessions', () => {
  async function logOne(weight: string) {
    const card = await activeCard()
    fireEvent.click(within(card).getByRole('button', { name: en.wpLogToday }))
    const logger = await screen.findByTestId('session-logger')
    fireEvent.change(
      within(logger).getByRole('textbox', { name: `Weight (kg) · Set 1 · ${SQUAT.name_en}` }),
      { target: { value: weight } },
    )
    fireEvent.click(
      within(logger).getByRole('checkbox', { name: `Done · Set 1 · ${SQUAT.name_en}` }),
    )
    fireEvent.click(within(logger).getByRole('button', { name: en.wpSave }))
    await waitFor(() => expect(screen.queryByTestId('session-logger')).toBeNull())
    return card
  }

  it('fills a cell, moves the progress, adds the profile workout entry and lists the session', async () => {
    const m = mem({ store: { workoutPlans: [plan()] } })
    renderPage(m.source)
    const card = await logOne('60')

    expect(filled(card)).toHaveLength(1)
    expect(filled(card)[0]).toHaveAccessibleName('Week 1, day 1: done')
    const bar = within(card).getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '8')
    expect(bar).toHaveAttribute('aria-valuetext', '1 of 12 sessions done')
    expect(within(card).getByText('1 of 3 this week')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(en.wpSaved)

    expect(m.store.workoutSessions).toHaveLength(1)
    const saved = m.store.workoutSessions[0]!
    expect(saved).toMatchObject({
      plan_id: 'plan-1',
      template_id: TEMPLATE.id,
      performed_at: TODAY,
    })
    expect(m.store.entries).toEqual([
      expect.objectContaining({
        kind: 'workout',
        value: 45,
        unit: 'min',
        payload: { session_id: saved.id },
      }),
    ])

    const history = screen.getByRole('region', { name: en.wpHistoryHeading })
    const rows = within(history).getAllByTestId('session-row')
    expect(rows).toHaveLength(1)
    expect(rows[0]).toHaveTextContent(plan().name)
    expect(rows[0]).toHaveTextContent(`${SQUAT.name_en}, ${PRESS.name_en}`)
    expect(within(rows[0]!).queryByTestId('pr-badge')).toBeNull()
  })

  it('puts a PR badge on a session with a heavier set, and says so on save', async () => {
    const earlier = session('2026-10-02', [{ exercise_id: SQUAT.id, sets: [set(8, 60)] }], {
      plan_id: 'plan-1',
    })
    const m = mem({ store: { workoutPlans: [plan()], workoutSessions: [earlier] } })
    renderPage(m.source)
    const card = await logOne('70')

    expect(screen.getByRole('status')).toHaveTextContent(en.wpSavedPr)
    expect(filled(card)).toHaveLength(2)
    const rows = within(screen.getByRole('region', { name: en.wpHistoryHeading })).getAllByTestId(
      'session-row',
    )
    expect(rows).toHaveLength(2)
    expect(within(rows[0]!).getByTestId('pr-badge')).toHaveTextContent(en.wpPr)
    expect(rows[0]).toHaveTextContent(`${SQUAT.name_en}: Heaviest weight: 70 kg`)
    expect(rows[0]).toHaveTextContent(`${SQUAT.name_en}: Best estimated 1RM:`)
    expect(within(rows[1]!).queryByTestId('pr-badge')).toBeNull()

    // Progress follows: the squat is picked, best est-1RM = 70 × (1 + 8/30) ≈ 88.7 kg, a two-point chart.
    const progress = screen.getByTestId('progress-panel')
    expect(within(progress).getByRole('combobox', { name: en.wpExercise })).toHaveValue(SQUAT.id)
    expect(within(progress).getByTestId('best-e1rm')).toHaveTextContent('88.7 kg')
    expect(
      within(progress).getByRole('img', {
        name: /^Estimated 1RM over the last 2 sessions: from 76 to 88.7 kg\.$/,
      }),
    ).toBeInTheDocument()
    expect(within(progress).getByTestId('weekly-volume')).toHaveAccessibleName(
      'Weekly volume over the last 8 weeks: this week 560 kg, highest 560 kg.',
    )
  })

  it('Cancel closes the logger without writing', async () => {
    const m = mem({ store: { workoutPlans: [plan()] } })
    renderPage(m.source)
    const card = await activeCard()
    fireEvent.click(within(card).getByRole('button', { name: en.wpLogToday }))
    fireEvent.click(
      within(await screen.findByTestId('session-logger')).getByRole('button', {
        name: en.wpCancel,
      }),
    )
    expect(screen.queryByTestId('session-logger')).toBeNull()
    expect(m.store.workoutSessions).toEqual([])
  })
})

describe('<PlansPage> — plan status', () => {
  it('Mark completed moves the plan to Past plans', async () => {
    const m = mem({ store: { workoutPlans: [plan()] } })
    renderPage(m.source)
    const card = await activeCard()
    fireEvent.click(within(card).getByRole('button', { name: en.wpComplete }))
    const past = await screen.findByRole('region', { name: en.wpPastHeading })
    expect(within(past).getByTestId('past-plan')).toHaveTextContent(`${plan().name}`)
    expect(within(past).getByTestId('past-plan')).toHaveTextContent(en.wpStatus.completed)
    expect(m.store.workoutPlans[0]?.status).toBe('completed')
    expect(screen.queryByRole('article', { name: plan().name })).toBeNull()
    expect(screen.getByText(en.wpNoActive)).toBeInTheDocument()
  })

  it('Abandon needs a second click ("Sure?")', async () => {
    const m = mem({ store: { workoutPlans: [plan()] } })
    renderPage(m.source)
    const card = await activeCard()
    fireEvent.click(within(card).getByRole('button', { name: `${en.wpAbandon}: ${plan().name}` }))
    expect(m.store.workoutPlans[0]?.status).toBe('active')
    fireEvent.click(within(card).getByRole('button', { name: `${en.wpConfirm}: ${plan().name}` }))
    const past = await screen.findByRole('region', { name: en.wpPastHeading })
    expect(past).toHaveTextContent(en.wpStatus.abandoned)
    expect(m.store.workoutPlans[0]?.status).toBe('abandoned')
  })

  it('a refused status change keeps the plan and shows an alert', async () => {
    const m = mem({
      store: { workoutPlans: [plan()] },
      failing: new Set(['setWorkoutPlanStatus'] as const),
    })
    renderPage(m.source)
    const card = await activeCard()
    fireEvent.click(within(card).getByRole('button', { name: en.wpComplete }))
    expect(await within(card).findByRole('alert')).toHaveTextContent(en.wpStatusFailed)
    expect(screen.getByRole('article', { name: plan().name })).toBeInTheDocument()
  })
})

describe('<PlansPage> — history', () => {
  it('deletes a session with two clicks, and the workout entry linked to it', async () => {
    const s1 = session('2026-10-02', [{ exercise_id: SQUAT.id, sets: [set(5, 60)] }], {
      plan_id: 'plan-1',
    })
    const m = mem({
      store: {
        workoutPlans: [plan()],
        workoutSessions: [s1],
        entries: [
          {
            id: 'e-linked',
            kind: 'workout',
            entry_date: '2026-10-02',
            value: 45,
            unit: 'min',
            payload: { session_id: s1.id },
            note: null,
            created_at: '2026-10-02T10:00:00.000Z',
          },
          {
            id: 'e-other',
            kind: 'workout',
            entry_date: '2026-10-02',
            value: 30,
            unit: 'min',
            payload: null,
            note: null,
            created_at: '2026-10-02T11:00:00.000Z',
          },
        ],
      },
    })
    renderPage(m.source)
    const card = await activeCard()
    expect(filled(card)).toHaveLength(1)
    const history = screen.getByRole('region', { name: en.wpHistoryHeading })
    const del = within(history).getByRole('button', { name: /^Delete: Autumn strength, / })
    fireEvent.click(del)
    expect(m.store.workoutSessions).toHaveLength(1)
    fireEvent.click(within(history).getByRole('button', { name: /^Sure\?: Autumn strength, / }))
    await waitFor(() => expect(m.store.workoutSessions).toEqual([]))
    await waitFor(() => expect(m.store.entries.map((e) => e.id)).toEqual(['e-other']))
    expect(await within(history).findByText(en.wpHistoryEmpty)).toBeInTheDocument()
    expect(filled(card)).toHaveLength(0)
  })

  it('a refused delete keeps the row and shows an alert', async () => {
    const s1 = session('2026-10-02', [{ exercise_id: SQUAT.id, sets: [set(5, 60)] }])
    const m = mem({
      store: { workoutSessions: [s1] },
      failing: new Set(['deleteWorkoutSession'] as const),
    })
    renderPage(m.source)
    const history = await screen.findByRole('region', { name: en.wpHistoryHeading })
    const row = within(history).getByTestId('session-row')
    expect(row).toHaveTextContent(en.wpFreeSession)
    fireEvent.click(within(row).getByRole('button', { name: /^Delete:/ }))
    fireEvent.click(within(row).getByRole('button', { name: /^Sure\?:/ }))
    expect(await within(row).findByRole('alert')).toHaveTextContent(en.wpDeleteFailed)
    expect(m.store.workoutSessions).toHaveLength(1)
  })
})

describe('<PlansPage> — Greek', () => {
  it('renders the signed-in page in Greek', async () => {
    renderPage(mem({ store: { workoutPlans: [plan()] } }).source, { lang: 'el' })
    const card = await screen.findByRole('article', { name: plan().name })
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(el.wpTitle)
    expect(within(card).getByRole('button', { name: el.wpLogToday })).toBeInTheDocument()
    expect(
      within(card).getAllByRole('img', { name: /^Εβδομάδα 1, μέρα \d: εκκρεμεί$/ }),
    ).toHaveLength(3)
    expect(within(card).getByRole('progressbar')).toHaveAttribute(
      'aria-valuetext',
      '0 από 12 προπονήσεις',
    )
  })
})
