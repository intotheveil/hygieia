// PREFERENCES → PAGES, rendered (2026-10-06). The stored answers (localStorage `hygieia:prefs`)
// pre-filter /recipes, set the default level on /workouts and highlight on /diets, /tasks and
// /skincare — and an explicit URL parameter always wins.

import { render, screen, waitFor, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { bundledSource } from '../content/bundled'
import { DietsPage } from '../diets/DietsPage'
import { LangProvider } from '../i18n/LangProvider'
import { dictionaries } from '../i18n/dictionary'
import { RecipesPage } from '../recipes/RecipesPage'
import { SkincarePage } from '../skincare/SkincarePage'
import { TOPICS } from '../tasks/content/topics'
import { TasksPage } from '../tasks/TasksPage'
import { WorkoutsPage } from '../workouts/WorkoutsPage'
import { GOAL_TASK_TOPICS } from './apply'
import { NO_PREFS, writePrefs, type Prefs } from './prefs'

const en = dictionaries.en

function LocationProbe() {
  const location = useLocation()
  return <span data-testid="search">{location.search}</span>
}

function renderAt(path: string, route: string, page: ReactNode) {
  return render(
    <LangProvider initial="en">
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={route} element={page} />
        </Routes>
        <LocationProbe />
      </MemoryRouter>
    </LangProvider>,
  )
}

const store = (patch: Partial<Prefs>) => writePrefs({ ...NO_PREFS, ...patch })
const search = () => screen.getByTestId('search').textContent

beforeEach(() => window.localStorage.clear())

describe('/recipes — the preferred diet is the default filter', () => {
  it('arrives filtered by the stored diet: URL replaced with ?diet=, chip pressed', async () => {
    store({ diet: 'vegan' })
    renderAt('/recipes', '/recipes', <RecipesPage source={bundledSource} />)
    await screen.findByRole('list', { name: en.recipesTitle })
    expect(search()).toBe('?diet=vegan')
    expect(screen.getByRole('button', { name: 'Vegan diet', pressed: true })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: en.clearFilters })).toBeInTheDocument()
  })

  it.each(['?diet=keto', '?meal=lunch', '?q=soup'])(
    'an explicit URL filter wins (%s) and is left untouched',
    async (query) => {
      store({ diet: 'vegan' })
      renderAt(`/recipes${query}`, '/recipes', <RecipesPage source={bundledSource} />)
      await screen.findByRole('list', { name: en.recipesTitle })
      expect(search()).toBe(query)
      expect(screen.queryByRole('button', { name: 'Vegan diet', pressed: true })).toBeNull()
    },
  )

  it('without a diet preference the list is unfiltered', async () => {
    store({ goal: 'skin' })
    renderAt('/recipes', '/recipes', <RecipesPage source={bundledSource} />)
    await screen.findByRole('list', { name: en.recipesTitle })
    expect(search()).toBe('')
  })
})

describe('/workouts — the activity level is the default level', () => {
  const levelGroup = () => screen.getByRole('radiogroup', { name: en.pickLevel })

  it('high activity opens on advanced', async () => {
    store({ activity: 'high' })
    renderAt('/workouts', '/workouts', <WorkoutsPage source={bundledSource} />)
    await screen.findByRole('heading', { level: 2 })
    expect(within(levelGroup()).getByRole('radio', { checked: true })).toHaveTextContent(
      en.levels.advanced,
    )
  })

  it('an explicit ?level= wins over the preference', async () => {
    store({ activity: 'high' })
    renderAt('/workouts?level=beginner', '/workouts', <WorkoutsPage source={bundledSource} />)
    await screen.findByRole('heading', { level: 2 })
    expect(within(levelGroup()).getByRole('radio', { checked: true })).toHaveTextContent(
      en.levels.beginner,
    )
  })

  it('no preference keeps the beginner default', async () => {
    renderAt('/workouts', '/workouts', <WorkoutsPage source={bundledSource} />)
    await screen.findByRole('heading', { level: 2 })
    expect(within(levelGroup()).getByRole('radio', { checked: true })).toHaveTextContent(
      en.levels.beginner,
    )
  })
})

describe('/diets — the chosen diet is highlighted', () => {
  it('badges exactly the chosen diet', async () => {
    store({ diet: 'keto' })
    renderAt('/diets', '/diets', <DietsPage source={bundledSource} />)
    const heading = await screen.findByRole('heading', { name: 'Ketogenic diet (keto)' })
    const card = heading.closest('li')
    expect(card).toHaveAttribute('data-preferred', 'true')
    expect(within(card as HTMLElement).getByText(en.dietsYourDiet)).toBeInTheDocument()
    expect(screen.getAllByText(en.dietsYourDiet)).toHaveLength(1)
  })

  it('no badge without a diet preference', async () => {
    renderAt('/diets', '/diets', <DietsPage source={bundledSource} />)
    await screen.findByRole('heading', { name: 'Ketogenic diet (keto)' })
    expect(screen.queryByText(en.dietsYourDiet)).toBeNull()
  })
})

describe('/tasks — the goal suggests topics', () => {
  it('badges the topics of the goal, and only those', async () => {
    store({ goal: 'feel-calmer' })
    renderAt('/tasks', '/tasks', <TasksPage />)
    const expected = GOAL_TASK_TOPICS['feel-calmer']
    await screen.findByRole('link', { name: TOPICS['reduce-stress'].title.en })
    expect(screen.getAllByText(en.tasksSuggested)).toHaveLength(expected.length)
    for (const id of expected) {
      const card = screen.getByRole('link', { name: TOPICS[id].title.en }).closest('li')
      expect(card).toHaveAttribute('data-suggested', 'true')
    }
  })

  it('no badge without a goal', () => {
    renderAt('/tasks', '/tasks', <TasksPage />)
    expect(screen.queryByText(en.tasksSuggested)).toBeNull()
  })
})

describe('/skincare — the skin goal gets a note', () => {
  it('shows the note with a link to the skincare habit plan', async () => {
    store({ goal: 'skin' })
    renderAt('/skincare', '/skincare', <SkincarePage source={bundledSource} />)
    const note = await screen.findByTestId('skincare-goal-note')
    expect(note).toHaveTextContent(en.skincareGoalNote)
    expect(within(note).getByRole('link')).toHaveAttribute('href', '/tasks/skincare-habit')
  })

  it('no note for another goal', async () => {
    store({ goal: 'build-strength' })
    renderAt('/skincare', '/skincare', <SkincarePage source={bundledSource} />)
    await screen.findByRole('heading', { level: 1 })
    await waitFor(() => expect(screen.queryByTestId('skincare-goal-note')).toBeNull())
  })
})
