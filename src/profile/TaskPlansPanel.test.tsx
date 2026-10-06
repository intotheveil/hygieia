import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { bundledSource } from '../content/bundled'
import { LangProvider } from '../i18n/LangProvider'
import { dictionaries, type Lang } from '../i18n/dictionary'
import { fill } from '../i18n/fill'
import { cleanHome } from '../tasks/content/clean-home'
import { loadTopic } from '../tasks/content/index'
import { TOPICS } from '../tasks/content/topics'
import { dateKey } from '../tasks/dates'
import { generatePlan } from '../tasks/generate'
import { tasksStorageKey } from '../tasks/storage'
import { disabledSource } from '../user/disabled'
import { memorySource } from '../user/memory'
import { ProfilePage } from './ProfilePage'
import { TaskPlansPanel, type TaskPlansPanelProps } from './TaskPlansPanel'

// /profile "Your task plans" (connect the features, 2026-10-06): this browser's Tasks Advisor plans
// with today's progress and a link each; nothing at all when there are none.

const NOW = new Date(2026, 9, 6, 9, 0) // Tuesday
const CLEAN = { size: ['small'], household: [], time: ['t30'], style: ['daily'], state: ['tidy'] }
const WATER = { now: ['some'], day: ['desk'], hurdles: [] }

function storageWith(map: Record<string, unknown>): Pick<Storage, 'getItem'> {
  return {
    getItem: (k) => (k in map ? JSON.stringify(map[k]) : null),
  }
}

function renderPanel(props: TaskPlansPanelProps, lang: Lang = 'en') {
  return render(
    <LangProvider initial={lang}>
      <MemoryRouter>
        <TaskPlansPanel now={NOW} loadTopic={loadTopic} {...props} />
      </MemoryRouter>
    </LangProvider>,
  )
}

const cleanToday = () => {
  const plan = generatePlan(cleanHome, CLEAN)
  return [...plan.daily, ...plan.weekly.tue]
}

describe('<TaskPlansPanel>', () => {
  it('renders nothing without plans (and loads no topic)', () => {
    const load = vi.fn(loadTopic)
    const { container } = renderPanel({ storage: storageWith({}), loadTopic: load })
    expect(container).toBeEmptyDOMElement()
    expect(load).not.toHaveBeenCalled()
    renderPanel({ storage: null })
    expect(screen.queryByRole('region')).toBeNull()
  })

  it.each(['en', 'el'] as const)(
    "lists each plan with a link and today's progress (%s)",
    async (lang) => {
      const t = dictionaries[lang]
      const today = cleanToday()
      renderPanel(
        {
          storage: storageWith({
            [tasksStorageKey('drink-water')]: { v: 1, answers: WATER, ticks: {} },
            [tasksStorageKey('clean-home')]: {
              v: 1,
              answers: CLEAN,
              ticks: { [dateKey(NOW)]: [today[0]!.id, today[1]!.id] },
            },
            [tasksStorageKey('declutter')]: { v: 1, answers: null, ticks: {} },
          }),
        },
        lang,
      )
      const panel = screen.getByRole('region', { name: t.profileTaskPlans })
      expect(within(panel).getByText(t.profileTaskPlansNote)).toBeInTheDocument()
      const rows = within(panel).getAllByRole('listitem')
      expect(rows.map((r) => r.dataset.topic)).toEqual(['clean-home', 'drink-water'])
      expect(
        within(rows[0]!).getByRole('link', { name: TOPICS['clean-home'].title[lang] }),
      ).toHaveAttribute('href', '/tasks/clean-home')
      expect(
        await within(rows[0]!).findByText(
          fill(t.profileTaskToday, { done: 2, total: today.length }),
        ),
      ).toBeInTheDocument()
      expect(await within(rows[1]!).findByText(/\d/)).toBeInTheDocument()
      expect(
        within(panel).getByRole('link', { name: new RegExp(t.profileTaskAll) }),
      ).toHaveAttribute('href', '/tasks')
    },
  )

  it('a topic whose chunk fails keeps its link, without a count', async () => {
    renderPanel({
      storage: storageWith({
        [tasksStorageKey('clean-home')]: { v: 1, answers: CLEAN, ticks: {} },
      }),
      loadTopic: () => Promise.reject(new Error('offline')),
    })
    const row = screen.getByRole('listitem')
    expect(within(row).getByRole('link')).toHaveAttribute('href', '/tasks/clean-home')
    await new Promise((r) => setTimeout(r, 10))
    expect(within(row).getByTestId('task-plan-progress')).toHaveTextContent('')
  })
})

describe('<ProfilePage> shows the panel', () => {
  const storage = storageWith({
    [tasksStorageKey('clean-home')]: { v: 1, answers: CLEAN, ticks: {} },
  })
  const renderProfile = (source = memorySource().source) =>
    render(
      <LangProvider initial="en">
        <MemoryRouter>
          <ProfilePage
            source={source}
            content={bundledSource}
            today="2026-10-06"
            taskPlans={{ storage, now: NOW, loadTopic }}
          />
        </MemoryRouter>
      </LangProvider>,
    )

  it('signed in', async () => {
    renderProfile()
    const panel = await screen.findByRole('region', { name: dictionaries.en.profileTaskPlans })
    expect(
      within(panel).getByRole('link', { name: TOPICS['clean-home'].title.en }),
    ).toBeInTheDocument()
  })

  it('signed out, under the sign-in note (the plans are local)', () => {
    renderProfile(disabledSource('signed-out'))
    expect(screen.getByRole('note')).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: dictionaries.en.profileTaskPlans }),
    ).toBeInTheDocument()
  })
})
