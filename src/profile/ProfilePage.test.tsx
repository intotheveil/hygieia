import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { bundledSource, seedId } from '../content/bundled.ts'
import { DIETS } from '../content/seed/diets.ts'
import { LangProvider } from '../i18n/LangProvider'
import { el, en, type Lang } from '../i18n/dictionary'
import { disabledSource } from '../user/disabled'
import { memorySource, type MemorySourceOptions } from '../user/memory'
import type { Entry, EntryKind, UserDataSource } from '../user/source'
import { ProfilePage } from './ProfilePage'
import { addDays } from './stats'

// 2026-10-06 is a Tuesday.
const TODAY = '2026-10-06'
const KETO_ID = seedId('diets', 'keto')
const KETO_NAME_EN = DIETS.find((d) => d.slug === 'keto')!.name_en

let seq = 0
function entry(
  kind: EntryKind,
  entry_date: string,
  value: number | null = 1,
  note: string | null = null,
): Entry {
  seq += 1
  return {
    id: `e${seq}`,
    kind,
    entry_date,
    value,
    unit: kind === 'water' ? 'ml' : kind === 'weight' ? 'kg' : null,
    payload: null,
    note,
    created_at: `${entry_date}T08:00:00.000Z`,
  }
}

function renderPage(source: UserDataSource, lang: Lang = 'en') {
  return render(
    <LangProvider initial={lang}>
      <MemoryRouter initialEntries={['/profile']}>
        <ProfilePage source={source} content={bundledSource} today={TODAY} />
      </MemoryRouter>
    </LangProvider>,
  )
}

function mem(options: MemorySourceOptions = {}) {
  return memorySource({ now: () => `${TODAY}T12:00:00.000Z`, ...options })
}

const section = (name: string) => screen.getByRole('region', { name })

async function ready() {
  return screen.findByRole('region', { name: en.profileSummaryHeading })
}

describe('<ProfilePage> — disabled user data', () => {
  it.each([
    ['en', en],
    ['el', el],
  ] as const)(
    'local-only: the H1, the intro and the bilingual note, nothing else (%s)',
    (lang, t) => {
      renderPage(disabledSource('local-only'), lang)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(t.profileTitle)
      expect(screen.getByText(t.profileIntro)).toBeInTheDocument()
      expect(screen.getByRole('note')).toHaveTextContent(t.userDataUnavailableLocal)
      expect(screen.queryByRole('region')).not.toBeInTheDocument()
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    },
  )

  it('signed-out: the note offers sign-in and returns to /profile', () => {
    renderPage(disabledSource('signed-out'))
    const note = screen.getByRole('note')
    expect(note).toHaveTextContent(en.userDataSignInToSave)
    expect(within(note).getByRole('link', { name: en.signIn })).toHaveAttribute(
      'href',
      '/auth?next=%2Fprofile',
    )
  })
})

describe('<ProfilePage> — signed in, empty', () => {
  it('shows zeros, no goals, an empty history, 0/N badges and the empty saved state', async () => {
    renderPage(mem().source)
    const summary = await ready()
    const figures = within(summary).getAllByRole('definition')
    expect(figures.map((d) => d.textContent)).toEqual(['0', '0 days', '0 days', '0'])
    expect(within(summary).getAllByText(en.profileNoGoal)).toHaveLength(4)
    expect(within(summary).queryByRole('progressbar')).not.toBeInTheDocument()

    expect(section(en.profileHistory)).toHaveTextContent(en.profileHistoryEmpty)
    expect(section(en.profileWeightTrend)).toHaveTextContent(en.profileWeightTrendEmpty)
    expect(section(en.profileSaved)).toHaveTextContent(en.profileSavedEmpty)
    const badges = within(screen.getByRole('region', { name: /Achievements/ })).getAllByRole(
      'listitem',
    )
    expect(badges.length).toBeGreaterThanOrEqual(14)
    expect(badges.every((b) => b.dataset.earned === 'false')).toBe(true)
    expect(screen.getByRole('heading', { name: /Achievements/ })).toHaveTextContent(
      `0/${badges.length}`,
    )
    expect(screen.getByRole('link', { name: /Account/ })).toHaveAttribute('href', '/account')
  })

  it('reads every per-user list in parallel and shows the error state with Retry when one fails', async () => {
    const m = mem({ failing: new Set(['listGoals']) })
    renderPage(m.source)
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(en.profileLoadFailed)
    m.failOn('listGoals', false)
    fireEvent.click(within(alert).getByRole('button', { name: en.retry }))
    await ready()
  })
})

describe('<ProfilePage> — quick add', () => {
  it('adds a water entry: it appears in the history under today, the summary and the store update', async () => {
    const m = mem()
    renderPage(m.source)
    await ready()
    const form = within(section(en.profileQuickAdd))
    expect(form.getByLabelText(en.profileKindLabel)).toHaveValue('water')
    expect(form.getByLabelText(en.profileDateLabel)).toHaveValue(TODAY)
    expect(form.getByLabelText(en.profileDateLabel)).toHaveAttribute('max', TODAY)

    fireEvent.change(form.getByLabelText(/Value \(ml\)/), { target: { value: '500' } })
    fireEvent.change(form.getByLabelText(en.profileNoteLabel), { target: { value: 'morning' } })
    fireEvent.click(form.getByRole('button', { name: en.profileAddEntry }))

    const history = within(section(en.profileHistory))
    const row = await history.findByRole('listitem', { name: '' }).catch(() => null)
    void row
    await waitFor(() => expect(m.store.entries).toHaveLength(1))
    expect(m.store.entries[0]).toMatchObject({
      kind: 'water',
      value: 500,
      unit: 'ml',
      entry_date: TODAY,
      note: 'morning',
    })
    expect(history.getByText('500 ml')).toBeInTheDocument()
    expect(history.getByText('morning')).toBeInTheDocument()
    expect(
      history.getByRole('button', {
        name: `${en.profileDelete}: Water, 500 ml, Tue, 6 October 2026`,
      }),
    ).toBeInTheDocument()
    // The value and note reset, the kind and date stay.
    expect(form.getByLabelText(/Value \(ml\)/)).toHaveValue('')
    expect(form.getByLabelText(en.profileNoteLabel)).toHaveValue('')
    // Summary: 1 entry this week, a 1-day streak.
    const figures = within(section(en.profileSummaryHeading)).getAllByRole('definition')
    expect(figures.map((d) => d.textContent)).toEqual(['1', '1 day', '1 day', '0'])
  })

  it('switching the kind swaps the unit; skincare has no value field; mood is a score', async () => {
    renderPage(mem().source)
    await ready()
    const form = within(section(en.profileQuickAdd))
    fireEvent.change(form.getByLabelText(en.profileKindLabel), { target: { value: 'weight' } })
    expect(form.getByLabelText(/Value \(kg\)/)).toBeInTheDocument()
    fireEvent.change(form.getByLabelText(en.profileKindLabel), { target: { value: 'mood' } })
    expect(form.getByLabelText(/Value \(out of 5\)/)).toBeInTheDocument()
    fireEvent.change(form.getByLabelText(en.profileKindLabel), { target: { value: 'skincare' } })
    expect(form.queryByLabelText(/Value/)).not.toBeInTheDocument()
    expect(form.getByText(en.profileDoneToday)).toBeInTheDocument()
  })

  it('validates inline: a missing value, then a future date; nothing is written', async () => {
    const m = mem()
    renderPage(m.source)
    await ready()
    const form = within(section(en.profileQuickAdd))
    fireEvent.click(form.getByRole('button', { name: en.profileAddEntry }))
    expect(await form.findByRole('alert')).toHaveTextContent(en.profileFormError.valueRequired)
    expect(form.getByLabelText(/Value/)).toHaveAttribute('aria-invalid', 'true')

    fireEvent.change(form.getByLabelText(/Value/), { target: { value: '500' } })
    fireEvent.change(form.getByLabelText(en.profileDateLabel), { target: { value: '2026-10-07' } })
    fireEvent.click(form.getByRole('button', { name: en.profileAddEntry }))
    expect(await form.findByRole('alert')).toHaveTextContent(en.profileFormError.dateFuture)
    expect(m.store.entries).toEqual([])
  })

  it('a refused write removes the optimistic row and shows the failure', async () => {
    const m = mem({ failing: new Set(['addEntry']) })
    renderPage(m.source)
    await ready()
    const form = within(section(en.profileQuickAdd))
    fireEvent.change(form.getByLabelText(/Value/), { target: { value: '500' } })
    fireEvent.click(form.getByRole('button', { name: en.profileAddEntry }))
    expect(await form.findByRole('alert')).toHaveTextContent(en.profileAddFailed)
    expect(section(en.profileHistory)).toHaveTextContent(en.profileHistoryEmpty)
    expect(m.store.entries).toEqual([])
  })
})

describe('<ProfilePage> — history', () => {
  it('groups by date newest first and deletes on the SECOND click only ("Sure?")', async () => {
    const m = mem({
      store: {
        entries: [
          entry('water', '2026-10-05', 300),
          entry('weight', TODAY, 78),
          entry('water', TODAY, 500, 'lunch'),
        ],
      },
    })
    renderPage(m.source)
    await ready()
    const history = within(section(en.profileHistory))
    const groups = history.getByRole('list', { name: en.profileHistory })
    const dates = within(groups)
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent)
    expect(dates).toEqual(['Tue, 6 October 2026', 'Mon, 5 October 2026'])

    const del = history.getByRole('button', {
      name: `${en.profileDelete}: Water, 300 ml, Mon, 5 October 2026`,
    })
    fireEvent.click(del)
    expect(del).toHaveTextContent(en.profileConfirmDelete)
    expect(m.store.entries).toHaveLength(3)
    // Clicking another row's Delete resets the first.
    const other = history.getByRole('button', { name: /Weight, 78 kg/ })
    fireEvent.click(other)
    expect(del).toHaveTextContent(en.profileDelete)
    expect(other).toHaveTextContent(en.profileConfirmDelete)
    fireEvent.click(other)
    await waitFor(() => expect(m.store.entries.map((e) => e.kind)).toEqual(['water', 'water']))
    expect(history.queryByText('78 kg')).not.toBeInTheDocument()
  })

  it('a refused delete restores the row and shows the failure', async () => {
    const m = mem({
      store: { entries: [entry('water', TODAY, 500)] },
      failing: new Set(['deleteEntry']),
    })
    renderPage(m.source)
    await ready()
    const history = within(section(en.profileHistory))
    const del = history.getByRole('button', { name: /Delete/ })
    fireEvent.click(del)
    fireEvent.click(del)
    expect(await history.findByRole('alert')).toHaveTextContent(en.profileDeleteFailed)
    expect(history.getByText('500 ml')).toBeInTheDocument()
    expect(m.store.entries).toHaveLength(1)
  })
})

describe('<ProfilePage> — goals and progress', () => {
  it('saving a goal upserts it and the summary grows a progress bar that tracks new entries', async () => {
    const m = mem()
    renderPage(m.source)
    await ready()
    const goals = within(section(en.profileGoals))
    const target = goals.getByLabelText(/Water · Target \(ml\)/)
    fireEvent.change(target, { target: { value: '2000' } })
    fireEvent.click(goals.getByRole('button', { name: `${en.profileSaveGoal}: Water` }))
    await waitFor(() =>
      expect(m.store.goals).toEqual([
        expect.objectContaining({ kind: 'water', target: 2000, unit: 'ml', cadence: 'daily' }),
      ]),
    )
    expect(goals.getAllByRole('status').map((s) => s.textContent)).toContain(en.profileGoalSaved)

    const bar = within(section(en.profileSummaryHeading)).getByRole('progressbar', {
      name: 'Water',
    })
    expect(bar).toHaveAttribute('aria-valuemax', '2000')
    expect(bar).toHaveAttribute('aria-valuenow', '0')
    expect(bar).toHaveAttribute('aria-valuetext', '0 / 2,000 ml')

    const form = within(section(en.profileQuickAdd))
    fireEvent.change(form.getByLabelText(/Value/), { target: { value: '500' } })
    fireEvent.click(form.getByRole('button', { name: en.profileAddEntry }))
    await waitFor(() => expect(bar).toHaveAttribute('aria-valuenow', '500'))
    expect(bar).toHaveAttribute('aria-valuetext', '500 / 2,000 ml')
  })

  it('rejects a non-positive target without writing, and reports a refused upsert', async () => {
    const m = mem({ failing: new Set(['upsertGoal']) })
    renderPage(m.source)
    await ready()
    const goals = within(section(en.profileGoals))
    fireEvent.click(goals.getByRole('button', { name: `${en.profileSaveGoal}: Steps` }))
    expect(goals.getAllByRole('status').map((s) => s.textContent)).toContain(en.profileGoalInvalid)
    fireEvent.change(goals.getByLabelText(/Steps · Target/), { target: { value: '8000' } })
    fireEvent.click(goals.getByRole('button', { name: `${en.profileSaveGoal}: Steps` }))
    await waitFor(() =>
      expect(goals.getAllByRole('status').map((s) => s.textContent)).toContain(
        en.profileGoalFailed,
      ),
    )
    expect(m.store.goals).toEqual([])
    expect(
      within(section(en.profileSummaryHeading)).queryByRole('progressbar'),
    ).not.toBeInTheDocument()
  })

  it('shows stored goals with their cadence and lets the cadence change', async () => {
    const m = mem({
      store: {
        goals: [{ kind: 'workout', target: 90, unit: 'min', cadence: 'weekly', updated_at: '' }],
      },
    })
    renderPage(m.source)
    await ready()
    const goals = within(section(en.profileGoals))
    expect(goals.getByLabelText(/Workout · Target/)).toHaveValue('90')
    const cadence = goals.getAllByLabelText(en.profileCadenceLabel)[2] // GOAL_KINDS order: water, sleep, workout
    expect(cadence).toHaveValue('weekly')
    fireEvent.change(cadence, { target: { value: 'daily' } })
    fireEvent.click(goals.getByRole('button', { name: `${en.profileSaveGoal}: Workout` }))
    await waitFor(() =>
      expect(m.store.goals[0]).toMatchObject({ kind: 'workout', target: 90, cadence: 'daily' }),
    )
  })
})

describe('<ProfilePage> — achievements flip live', () => {
  it('streak-3 is unearned with two days and flips to earned when today is logged', async () => {
    const m = mem({
      store: {
        entries: [entry('water', addDays(TODAY, -2), 500), entry('water', addDays(TODAY, -1), 500)],
      },
    })
    renderPage(m.source)
    await ready()
    const grid = screen.getByRole('region', { name: /Achievements/ })
    const streak3 = grid.querySelector('[data-badge="streak-3"]') as HTMLElement
    expect(streak3.dataset.earned).toBe('false')
    expect(streak3).toHaveTextContent('67% there')
    const first = grid.querySelector('[data-badge="first-entry"]') as HTMLElement
    expect(first.dataset.earned).toBe('true')
    expect(first).toHaveTextContent(`Earned Sun, 4 October 2026`)

    const form = within(section(en.profileQuickAdd))
    fireEvent.change(form.getByLabelText(/Value/), { target: { value: '250' } })
    fireEvent.click(form.getByRole('button', { name: en.profileAddEntry }))
    await waitFor(() => expect(streak3.dataset.earned).toBe('true'))
    expect(streak3).toHaveTextContent('Earned Tue, 6 October 2026')
    expect(
      within(section(en.profileSummaryHeading)).getAllByRole('definition')[1],
    ).toHaveTextContent('3 days')
  })
})

describe('<ProfilePage> — weight trend', () => {
  it('draws an accessible sparkline from two or more weights in the last 90 days', async () => {
    const m = mem({
      store: { entries: [entry('weight', TODAY, 78), entry('weight', addDays(TODAY, -10), 80)] },
    })
    renderPage(m.source)
    await ready()
    const trend = within(section(en.profileWeightTrend))
    const img = trend.getByRole('img')
    expect(img).toHaveAccessibleName('Weight from 80 to 78 kg, −2 kg over 2 readings.')
    expect(img.querySelector('path')?.getAttribute('d')).toMatch(/^M/)
    expect(img.querySelectorAll('circle')).toHaveLength(2)
    expect(trend.getByText('Weight from 80 to 78 kg, −2 kg over 2 readings.')).toBeInTheDocument()
  })
})

describe('<ProfilePage> — saved', () => {
  it('lists favourite recipes and saved items by kind with Open links, and unsaves', async () => {
    const recipes = await bundledSource.listRecipes()
    if (!recipes.ok) throw new Error('bundled failed')
    const recipe = recipes.data[0]
    const workouts = await bundledSource.listWorkoutTemplates()
    if (!workouts.ok) throw new Error('bundled failed')
    const template = workouts.data[0]
    const m = mem({
      store: {
        favourites: [{ recipe_id: recipe.id, created_at: '' }],
        savedItems: [
          { kind: 'diet', item_id: KETO_ID, created_at: '' },
          { kind: 'workout', item_id: template.id, created_at: '' },
          { kind: 'health_tip', item_id: 'gone', created_at: '' },
        ],
      },
    })
    renderPage(m.source)
    await ready()
    const saved = within(section(en.profileSaved))
    const favs = within(await saved.findByRole('list', { name: en.profileFavouriteRecipes }))
    expect(favs.getByText(recipe.title_en)).toBeInTheDocument()
    expect(favs.getByRole('link', { name: `${en.open}: ${recipe.title_en}` })).toHaveAttribute(
      'href',
      `/recipes/${recipe.slug}`,
    )

    const diets = within(saved.getByRole('list', { name: en.profileSavedKind.diet }))
    expect(diets.getByRole('link', { name: `${en.open}: ${KETO_NAME_EN}` })).toHaveAttribute(
      'href',
      '/diets/keto',
    )

    const w = within(saved.getByRole('list', { name: en.profileSavedKind.workout }))
    expect(w.getByRole('link', { name: `${en.open}: ${template.title_en}` })).toHaveAttribute(
      'href',
      `/workouts?type=${template.workout_type}&level=${template.level}&intensity=${template.intensity}`,
    )
    // An id that no visible content row carries is labelled, not dropped.
    const tips = within(saved.getByRole('list', { name: en.profileSavedKind.health_tip }))
    expect(tips.getByText(en.profileItemUnavailable)).toBeInTheDocument()
    expect(tips.queryByRole('link')).not.toBeInTheDocument()

    // The collection figure counts favourites + saved.
    expect(
      within(section(en.profileSummaryHeading)).getAllByRole('definition')[3],
    ).toHaveTextContent('4')

    fireEvent.click(diets.getByRole('button', { name: `${en.profileUnsave}: ${KETO_NAME_EN}` }))
    await waitFor(() =>
      expect(m.store.savedItems.map((s) => s.kind)).toEqual(['workout', 'health_tip']),
    )
    expect(saved.queryByRole('list', { name: en.profileSavedKind.diet })).not.toBeInTheDocument()

    fireEvent.click(
      // Unsaving the last diet changed the names-loader key: the section re-rendered, so re-query.
      await saved.findByRole('button', { name: `${en.profileUnsave}: ${recipe.title_en}` }),
    )
    await waitFor(() => expect(m.store.favourites).toEqual([]))
    await waitFor(() =>
      expect(
        within(section(en.profileSummaryHeading)).getAllByRole('definition')[3],
      ).toHaveTextContent('2'),
    )
  })

  it('a refused unsave restores the row and shows the failure', async () => {
    const m = mem({
      store: { savedItems: [{ kind: 'diet', item_id: KETO_ID, created_at: '' }] },
      failing: new Set(['unsaveItem']),
    })
    renderPage(m.source)
    await ready()
    const saved = within(section(en.profileSaved))
    const button = await saved.findByRole('button', {
      name: `${en.profileUnsave}: ${KETO_NAME_EN}`,
    })
    fireEvent.click(button)
    expect(await saved.findByRole('alert')).toHaveTextContent(en.profileUnsaveFailed)
    expect(saved.getByText(KETO_NAME_EN)).toBeInTheDocument()
  })
})

describe('<ProfilePage> — Greek', () => {
  it('renders every section heading, the kinds and the units in Greek', async () => {
    const m = mem({ store: { entries: [entry('water', TODAY, 500)] } })
    renderPage(m.source, 'el')
    await screen.findByRole('region', { name: el.profileSummaryHeading })
    for (const name of [
      el.profileQuickAdd,
      el.profileWeightTrend,
      el.profileHistory,
      el.profileGoals,
      el.profileSaved,
    ]) {
      expect(screen.getByRole('region', { name })).toBeInTheDocument()
    }
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Προφίλ')
    expect(within(section(el.profileHistory)).getByText('Νερό')).toBeInTheDocument()
    expect(within(section(el.profileHistory)).getByText('500 ml')).toBeInTheDocument()
    expect(
      within(section(el.profileSummaryHeading)).getAllByRole('definition')[1],
    ).toHaveTextContent('1 ημέρα')
  })
})
