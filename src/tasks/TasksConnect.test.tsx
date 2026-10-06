import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LangProvider } from '../i18n/LangProvider'
import { dictionaries, type Lang } from '../i18n/dictionary'
import { disabledSource } from '../user/disabled'
import { memorySource } from '../user/memory'
import type { UserDataSource } from '../user/source'
import { loadTopic } from './content/index'
import { skincareHabit } from './content/skincare-habit'
import { dateKey, weekDates } from './dates'
import type { RoutineSection } from './routine'
import { tasksStorageKey } from './storage'
import { TasksPage } from './TasksPage'
import type { Day } from './types'

// The Tasks Advisor connected to the rest of the app (2026-10-06), in jsdom against `memorySource`:
// the "Log to profile" toggle (ticks ↔ profile entries), the workout-plan link and the /skincare
// routine deep link. Clock pinned to Tuesday 6 October 2026, 09:00 local.

const NOW = new Date(2026, 9, 6, 9, 0)
const TODAY = dateKey(NOW)
const en = dictionaries.en

function memoryStorage(initial: Record<string, unknown> = {}) {
  const map = new Map<string, string>(
    Object.entries(initial).map(([k, v]) => [k, JSON.stringify(v)]),
  )
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    read: (k: string) => JSON.parse(map.get(k) ?? 'null') as Record<string, unknown> | null,
  }
}

function LocationProbe() {
  const location = useLocation()
  return <span data-testid="location">{`${location.pathname}${location.search}`}</span>
}

function renderAt(
  path: string,
  props: {
    userData: UserDataSource
    storage: ReturnType<typeof memoryStorage>
    loadRoutine?: (slug: string) => Promise<RoutineSection | null>
  },
  lang: Lang = 'en',
) {
  const page = <TasksPage now={() => NOW} loadTopic={loadTopic} {...props} />
  return render(
    <LangProvider initial={lang}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/tasks/:topic" element={page} />
          <Route path="/workouts/plans" element={<p>plans page</p>} />
        </Routes>
        <LocationProbe />
      </MemoryRouter>
    </LangProvider>,
  )
}

const WORKOUT_ANSWERS = {
  level: ['regular'],
  place: ['gym'],
  days: ['d3'],
  time: ['t30'],
  goal: ['strength'],
}
const saved = (answers: unknown, extra: Record<string, unknown> = {}) => ({
  v: 1,
  answers,
  ticks: {},
  ...extra,
})

/** The first session checkbox of the week, and the date its column stands for. */
async function sessionBox() {
  await screen.findByRole('region', { name: en.tasksThisWeek })
  const box = [...document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')].find(
    (el) => /^week-[a-z]{3}-session-/.test(el.id),
  )
  if (!box) throw new Error('no session in the plan')
  const day = box.id.slice(5, 8) as Day
  return { box, date: dateKey(weekDates(NOW)[day]) }
}

const mem = () => memorySource({ now: () => `${TODAY}T09:00:00.000Z` })

beforeEach(() => vi.restoreAllMocks())

describe('Log to profile (signed in)', () => {
  it('is on by default; a tick adds the workout entry, an un-tick deletes it', async () => {
    const m = mem()
    const storage = memoryStorage({
      [tasksStorageKey('workout-routine')]: saved(WORKOUT_ANSWERS),
    })
    renderAt('/tasks/workout-routine', { userData: m.source, storage })
    const toggle = await screen.findByRole('checkbox', { name: en.tasksLogToggle })
    expect(toggle).toBeChecked()
    expect(toggle).toHaveAccessibleDescription(en.tasksLogHint)

    const { box, date } = await sessionBox()
    fireEvent.click(box)
    expect(box).toBeChecked()
    await waitFor(() => expect(m.store.entries).toHaveLength(1))
    expect(m.store.entries[0]).toMatchObject({
      kind: 'workout',
      entry_date: date,
      value: 20,
      unit: 'min',
      payload: { source: 'tasks', topic: 'workout-routine', task_id: 'session-gym-t30-d3', date },
    })

    fireEvent.click(box)
    expect(box).not.toBeChecked()
    await waitFor(() => expect(m.store.entries).toHaveLength(0))
  })

  it('switched off: ticks stay local, nothing is written, and the choice is saved', async () => {
    const m = mem()
    const storage = memoryStorage({
      [tasksStorageKey('workout-routine')]: saved(WORKOUT_ANSWERS),
    })
    const add = vi.spyOn(m.source, 'addEntry')
    renderAt('/tasks/workout-routine', { userData: m.source, storage })
    fireEvent.click(await screen.findByRole('checkbox', { name: en.tasksLogToggle }))
    expect(screen.getByRole('checkbox', { name: en.tasksLogToggle })).not.toBeChecked()
    expect(storage.read(tasksStorageKey('workout-routine'))).toMatchObject({ log: false })

    const { box, date } = await sessionBox()
    fireEvent.click(box)
    expect(storage.read(tasksStorageKey('workout-routine'))?.ticks).toEqual({
      [date]: ['session-gym-t30-d3'],
    })
    await new Promise((r) => setTimeout(r, 20))
    expect(add).not.toHaveBeenCalled()
    expect(m.store.entries).toHaveLength(0)
  })

  it('a failed write keeps the tick and shows the note', async () => {
    const m = mem()
    m.failOn('addEntry')
    const storage = memoryStorage({
      [tasksStorageKey('workout-routine')]: saved(WORKOUT_ANSWERS),
    })
    renderAt('/tasks/workout-routine', { userData: m.source, storage })
    const { box } = await sessionBox()
    fireEvent.click(box)
    expect(await screen.findByRole('alert')).toHaveTextContent(en.tasksLogFailed)
    expect(box).toBeChecked()
  })

  it('a topic with nothing to track shows no toggle', async () => {
    const storage = memoryStorage({
      [tasksStorageKey('clean-home')]: saved({
        size: ['small'],
        household: [],
        time: ['t30'],
        style: ['daily'],
        state: ['tidy'],
      }),
    })
    renderAt('/tasks/clean-home', { userData: mem().source, storage })
    await screen.findByRole('region', { name: en.tasksThisWeek })
    expect(screen.queryByRole('checkbox', { name: en.tasksLogToggle })).toBeNull()
  })

  it.each(['local-only', 'signed-out'] as const)(
    'hidden when user data is disabled (%s)',
    async (reason) => {
      const source = disabledSource(reason)
      const list = vi.spyOn(source, 'listEntries')
      const storage = memoryStorage({
        [tasksStorageKey('workout-routine')]: saved(WORKOUT_ANSWERS),
      })
      renderAt('/tasks/workout-routine', { userData: source, storage })
      const { box } = await sessionBox()
      expect(screen.queryByRole('checkbox', { name: en.tasksLogToggle })).toBeNull()
      fireEvent.click(box)
      expect(box).toBeChecked()
      await new Promise((r) => setTimeout(r, 20))
      expect(list).not.toHaveBeenCalled()
    },
  )
})

describe('workout-routine → workout plan', () => {
  it.each(['en', 'el'] as const)(
    'links to /workouts/plans with the cell from the answers (%s)',
    async (lang) => {
      const storage = memoryStorage({
        [tasksStorageKey('workout-routine')]: saved(WORKOUT_ANSWERS),
      })
      renderAt('/tasks/workout-routine', { userData: disabledSource('local-only'), storage }, lang)
      const link = await screen.findByRole('link', {
        name: new RegExp(dictionaries[lang].tasksToWorkoutPlan),
      })
      expect(link).toHaveAttribute(
        'href',
        '/workouts/plans?type=gym&level=intermediate&intensity=moderate',
      )
      fireEvent.click(link)
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/workouts/plans?type=gym&level=intermediate&intensity=moderate',
      )
    },
  )

  it('other topics have no such link', async () => {
    const storage = memoryStorage({
      [tasksStorageKey('drink-water')]: saved({ now: ['some'], day: ['desk'], hurdles: [] }),
    })
    renderAt('/tasks/drink-water', { userData: disabledSource('local-only'), storage })
    await screen.findByRole('region', { name: en.tasksThisWeek })
    expect(screen.queryByTestId('tasks-to-workout-plan')).toBeNull()
  })
})

describe('/skincare routine → skincare-habit plan', () => {
  const ROUTINE: RoutineSection = {
    slug: 'face-dry-pm',
    area: 'face',
    time: 'pm',
    title: { en: 'Dry skin, evening', el: 'Ξηρή επιδερμίδα, βράδυ' },
    tasks: [
      {
        id: 'routine-face-1',
        title: { en: 'Cream cleanser', el: 'Κρεμώδες καθαριστικό' },
        minutes: 2,
        cadence: 'daily',
        when: {},
        weight: 5,
      },
      {
        id: 'routine-face-2',
        title: { en: 'Facial oil', el: 'Λάδι προσώπου' },
        minutes: 2,
        cadence: 'daily',
        when: {},
        weight: 5,
      },
    ],
    optional: ['routine-face-2'],
  }
  const PATH = '/tasks/skincare-habit?routine=face-dry-pm&skin=dry&time=pm&area=face'
  const label = (q: string, o: string) =>
    skincareHabit.questions.find((x) => x.id === q)!.options.find((x) => x.id === o)!.label.en

  it('pre-fills the questionnaire, then shows "Your routine" above the plan; a step tick logs skincare', async () => {
    const m = mem()
    const storage = memoryStorage()
    const loadRoutine = vi.fn(async () => ROUTINE)
    renderAt(PATH, { userData: m.source, storage, loadRoutine })

    expect(await screen.findByText(en.tasksPrefilled)).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: label('skin', 'dry') })).toBeChecked()
    expect(storage.read(tasksStorageKey('skincare-habit'))).toMatchObject({
      routine: 'face-dry-pm',
      answers: null,
    })
    fireEvent.click(screen.getByRole('button', { name: en.tasksNext }))
    fireEvent.click(await screen.findByRole('radio', { name: label('now', 'basic') }))
    fireEvent.click(screen.getByRole('button', { name: en.tasksNext }))
    fireEvent.click(await screen.findByRole('radio', { name: label('time', 't10') }))
    fireEvent.click(screen.getByRole('button', { name: en.tasksNext }))
    fireEvent.click(await screen.findByRole('button', { name: en.tasksSeePlan }))

    const section = await screen.findByRole('region', {
      name: new RegExp(`^${en.tasksRoutineHeading}`),
    })
    expect(loadRoutine).toHaveBeenCalledWith('face-dry-pm')
    expect(section).toHaveTextContent(`${ROUTINE.title.en} · ${en.tasksRoutineTime.pm}`)
    expect(within(section).getByText(en.tasksRoutineOptional)).toBeInTheDocument()
    // rendered ABOVE the generated plan
    const plan = document.getElementById('tasks-plan')!
    expect(section.compareDocumentPosition(plan) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(storage.read(tasksStorageKey('skincare-habit'))?.answers).toMatchObject({
      skin: ['dry'],
    })

    fireEvent.click(within(section).getByRole('checkbox', { name: 'Cream cleanser' }))
    await waitFor(() => expect(m.store.entries).toHaveLength(1))
    expect(m.store.entries[0]).toMatchObject({
      kind: 'skincare',
      entry_date: TODAY,
      value: null,
      payload: { source: 'tasks', topic: 'skincare-habit', task_id: 'routine-face-1', date: TODAY },
    })
    expect(storage.read(tasksStorageKey('skincare-habit'))?.ticks).toEqual({
      [TODAY]: ['routine-face-1'],
    })

    fireEvent.click(within(section).getByRole('button', { name: en.tasksRoutineRemove }))
    expect(
      screen.queryByRole('region', { name: new RegExp(`^${en.tasksRoutineHeading}`) }),
    ).toBeNull()
    expect(storage.read(tasksStorageKey('skincare-habit'))).not.toHaveProperty('routine')
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(/^\/tasks\/skincare-habit$/),
    )
  })

  it('a routine that no longer exists shows the load note, with Remove', async () => {
    const storage = memoryStorage({
      [tasksStorageKey('skincare-habit')]: saved(
        { skin: ['dry'], now: ['basic'], time: ['t10'], extras: [] },
        { routine: 'gone' },
      ),
    })
    renderAt('/tasks/skincare-habit', {
      userData: disabledSource('local-only'),
      storage,
      loadRoutine: async () => null,
    })
    const section = await screen.findByRole('region', { name: en.tasksRoutineHeading })
    expect(within(section).getByRole('alert')).toHaveTextContent(en.tasksRoutineLoadFailed)
    expect(within(section).getByRole('button', { name: en.tasksRoutineRemove })).toBeInTheDocument()
  })

  it('the routine param is ignored on other topics', async () => {
    const storage = memoryStorage()
    const loadRoutine = vi.fn(async () => ROUTINE)
    renderAt('/tasks/drink-water?routine=face-dry-pm&skin=dry', {
      userData: disabledSource('local-only'),
      storage,
      loadRoutine,
    })
    await screen.findByRole('group')
    expect(screen.queryByText(en.tasksPrefilled)).toBeNull()
    expect(loadRoutine).not.toHaveBeenCalled()
  })
})
