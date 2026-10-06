import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { LangProvider } from '../i18n/LangProvider'
import { dictionaries, type Lang } from '../i18n/dictionary'
import { fill } from '../i18n/fill'
import { cleanHome } from './content/clean-home'
import { TOPICS, TOPIC_IDS } from './content/topics'
import { generatePlan } from './generate'
import { tasksStorageKey } from './storage'
import { TasksPage, type TasksPageProps } from './TasksPage'
import { DAYS } from './types'

// /tasks and /tasks/:topic in jsdom: the topic grid, the questionnaire step by step, the plan, ticks
// persisted in localStorage across a re-render, Retake, Copy, Print. The clock is pinned to
// Tuesday 6 October 2026, 09:00 local, so "today" and the week columns are fixed.

const NOW = new Date(2026, 9, 6, 9, 0)
const now = () => NOW
const KEY = tasksStorageKey('clean-home')

function LocationProbe() {
  const location = useLocation()
  return <span data-testid="location">{location.pathname}</span>
}

function renderAt(path: string, lang: Lang = 'en', props: TasksPageProps = {}) {
  const page = <TasksPage now={now} {...props} />
  return render(
    <LangProvider initial={lang}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/tasks" element={page} />
          <Route path="/tasks/:topic" element={page} />
        </Routes>
        <LocationProbe />
      </MemoryRouter>
    </LangProvider>,
  )
}

const en = dictionaries.en
const el = dictionaries.el

/** The clean-home answers the flow below gives (a tidy home: no gentle start). */
const ANSWERS = {
  size: ['small'],
  household: ['pets'],
  time: ['t30'],
  style: ['daily'],
  state: ['tidy'],
}

async function answerCleanHome(lang: Lang = 'en', state: 'tidy' | 'chaotic' = 'tidy') {
  const t = dictionaries[lang]
  const opt = (q: string, o: string) => {
    const question = cleanHome.questions.find((x) => x.id === q)!
    return question.options.find((x) => x.id === o)!.label[lang]
  }
  const next = () => fireEvent.click(screen.getByRole('button', { name: t.tasksNext }))

  await screen.findByRole('group', { name: cleanHome.questions[0]!.title[lang] })
  expect(screen.getByText(fill(t.tasksQuestionProgress, { n: 1, total: 5 }))).toBeInTheDocument()
  expect(screen.getByRole('button', { name: t.tasksNext })).toBeDisabled()
  expect(screen.getByRole('button', { name: t.tasksBack })).toBeDisabled()
  fireEvent.click(screen.getByRole('radio', { name: opt('size', 'small') }))
  next()

  // multi-choice: checkboxes; Next is allowed with none, here we tick one
  await screen.findByRole('group', { name: cleanHome.questions[1]!.title[lang] })
  expect(screen.getByRole('button', { name: t.tasksNext })).toBeEnabled()
  fireEvent.click(screen.getByRole('checkbox', { name: opt('household', 'pets') }))
  next()

  fireEvent.click(await screen.findByRole('radio', { name: opt('time', 't30') }))
  next()
  fireEvent.click(await screen.findByRole('radio', { name: opt('style', 'daily') }))
  next()
  fireEvent.click(await screen.findByRole('radio', { name: opt('state', state) }))
  fireEvent.click(screen.getByRole('button', { name: t.tasksSeePlan }))
  await screen.findByRole('heading', { level: 2, name: new RegExp(`^${t.tasksToday}`) })
}

beforeEach(() => window.localStorage.clear())

describe('<TasksPage> topic grid', () => {
  it.each(['en', 'el'] as const)('lists every topic as a link (%s)', (lang) => {
    const t = dictionaries[lang]
    renderAt('/tasks', lang)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(t.tasksTitle)
    expect(screen.getByText(t.tasksLocalNote)).toBeInTheDocument()
    const list = document.getElementById('tasks-topics')!
    expect(within(list).getAllByRole('listitem')).toHaveLength(TOPIC_IDS.length)
    for (const id of TOPIC_IDS) {
      expect(within(list).getByRole('link', { name: TOPICS[id].title[lang] })).toHaveAttribute(
        'href',
        `/tasks/${id}`,
      )
    }
  })

  it('an unknown topic says so and links back', () => {
    renderAt('/tasks/no-such-topic')
    expect(screen.getByText(en.tasksUnknownTopic)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: new RegExp(en.tasksBackToTopics) })).toHaveAttribute(
      'href',
      '/tasks',
    )
  })
})

describe('<TasksPage> questionnaire → plan', () => {
  it('choose a topic → answer every step → the plan renders and is saved', async () => {
    renderAt('/tasks')
    fireEvent.click(screen.getByRole('link', { name: TOPICS['clean-home'].title.en }))
    expect(screen.getByTestId('location')).toHaveTextContent('/tasks/clean-home')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      TOPICS['clean-home'].title.en,
    )

    await answerCleanHome()

    const plan = generatePlan(cleanHome, ANSWERS)
    const today = screen.getByRole('region', { name: new RegExp(`^${en.tasksToday}`) })
    const expectedToday = [...plan.daily, ...plan.weekly.tue]
    expect(within(today).getAllByRole('checkbox')).toHaveLength(expectedToday.length)
    for (const task of expectedToday) {
      expect(within(today).getByRole('checkbox', { name: task.title.en })).not.toBeChecked()
    }
    // the week: seven day columns, each with its own heading
    const week = screen.getByRole('region', { name: en.tasksThisWeek })
    for (const day of DAYS) {
      expect(within(week).getByRole('heading', { level: 3, name: new RegExp(en.tasksDays[day]) }))
    }
    expect(screen.getByText(fill(en.tasksBudgetNote, { n: 30 }))).toBeInTheDocument()
    expect(screen.queryByText(en.tasksGentleTitle)).toBeNull()

    const stored = JSON.parse(window.localStorage.getItem(KEY)!) as { answers: unknown }
    expect(stored.answers).toEqual(ANSWERS)
  })

  it('Back keeps the answer given; Next stays disabled until a single choice is made', async () => {
    renderAt('/tasks/clean-home')
    const q0 = cleanHome.questions[0]!
    await screen.findByRole('group', { name: q0.title.en })
    fireEvent.click(screen.getByRole('radio', { name: q0.options[2]!.label.en }))
    fireEvent.click(screen.getByRole('button', { name: en.tasksNext }))
    await screen.findByRole('group', { name: cleanHome.questions[1]!.title.en })
    // focus moves to the new question's heading
    expect(document.activeElement).toBe(
      screen.getByRole('heading', { level: 2, name: cleanHome.questions[1]!.title.en }),
    )
    fireEvent.click(screen.getByRole('button', { name: en.tasksBack }))
    expect(await screen.findByRole('radio', { name: q0.options[2]!.label.en })).toBeChecked()
  })

  it('a chaotic home gets the gentle first week with kick-off tasks', async () => {
    renderAt('/tasks/clean-home')
    await answerCleanHome('en', 'chaotic')
    expect(screen.getByRole('note', { name: en.tasksGentleTitle })).toBeInTheDocument()
    expect(screen.getAllByText(en.tasksKickoff).length).toBeGreaterThan(0)
  })

  it('a tick persists across a re-render (localStorage), per date', async () => {
    const first = renderAt('/tasks/clean-home')
    await answerCleanHome()
    const plan = generatePlan(cleanHome, ANSWERS)
    const task = plan.daily[0]!
    const today = () => screen.getByRole('region', { name: new RegExp(`^${en.tasksToday}`) })
    fireEvent.click(within(today()).getByRole('checkbox', { name: task.title.en }))
    expect(within(today()).getByRole('checkbox', { name: task.title.en })).toBeChecked()
    // the same tick shows in Tuesday's column tally
    expect(
      screen.getAllByText(fill(en.tasksDailyLine, { done: 1, total: plan.daily.length })),
    ).toHaveLength(1)
    first.unmount()

    renderAt('/tasks/clean-home')
    const box = await screen.findByRole('checkbox', { name: task.title.en })
    expect(box).toBeChecked()
    const stored = JSON.parse(window.localStorage.getItem(KEY)!) as {
      ticks: Record<string, string[]>
    }
    expect(stored.ticks).toEqual({ '2026-10-06': [task.id] })
  })

  it('Retake clears the answers and starts the questionnaire again', async () => {
    renderAt('/tasks/clean-home')
    await answerCleanHome()
    fireEvent.click(screen.getByRole('button', { name: en.tasksRetake }))
    expect(
      await screen.findByRole('group', { name: cleanHome.questions[0]!.title.en }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('radio', { checked: true })).toBeNull()
    const stored = JSON.parse(window.localStorage.getItem(KEY)!) as { answers: unknown }
    expect(stored.answers).toBeNull()
  })

  it('Copy as text writes the plan to the clipboard; Print calls window.print', async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    renderAt('/tasks/clean-home')
    await answerCleanHome()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: en.tasksCopy }))
    })
    expect(writeText).toHaveBeenCalledTimes(1)
    const text = writeText.mock.calls[0]![0]
    expect(text).toContain(TOPICS['clean-home'].title.en)
    expect(text).toContain(en.tasksEveryDay)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(en.tasksCopied))

    fireEvent.click(screen.getByRole('button', { name: en.tasksPrint }))
    expect(print).toHaveBeenCalledTimes(1)
    print.mockRestore()
  })

  it('works in Greek end to end', async () => {
    renderAt('/tasks/clean-home', 'el')
    await answerCleanHome('el')
    expect(screen.getByRole('button', { name: el.tasksRetake })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: el.tasksThisWeek })).toBeInTheDocument()
  })

  it('keeps working when storage throws (in memory only)', async () => {
    const broken = {
      getItem: () => {
        throw new Error('denied')
      },
      setItem: () => {
        throw new Error('denied')
      },
    }
    renderAt('/tasks/clean-home', 'en', { storage: broken })
    await answerCleanHome()
    expect(screen.getByRole('button', { name: en.tasksRetake })).toBeInTheDocument()
  })

  it('shows the error state with Retry when the topic chunk fails', async () => {
    let calls = 0
    const loadTopic = () => {
      calls++
      return calls === 1 ? Promise.reject(new Error('offline')) : Promise.resolve(cleanHome)
    }
    renderAt('/tasks/clean-home', 'en', { loadTopic })
    expect(await screen.findByRole('alert')).toHaveTextContent(en.tasksLoadFailed)
    fireEvent.click(screen.getByRole('button', { name: en.retry }))
    expect(
      await screen.findByRole('group', { name: cleanHome.questions[0]!.title.en }),
    ).toBeInTheDocument()
  })
})
