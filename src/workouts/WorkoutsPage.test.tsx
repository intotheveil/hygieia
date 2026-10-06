import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { bundledSource } from '../content/bundled'
import { BLOCKS, INTENSITIES, LEVELS, WORKOUT_TYPES } from '../content/enums'
import { fail, ok, type ContentSource, type WorkoutTemplate } from '../content/source'
import { LangProvider } from '../i18n/LangProvider'
import { dictionaries, type Lang } from '../i18n/dictionary'
import {
  DEFAULT_SELECTION,
  WorkoutsPage,
  blocksOf,
  parseWorkoutSelection,
  serializeWorkoutSelection,
  workFigure,
} from './WorkoutsPage'

function LocationProbe() {
  const location = useLocation()
  return <span data-testid="location">{`${location.pathname}${location.search}`}</span>
}

function renderAt(path: string, lang: Lang = 'en', source: ContentSource = bundledSource) {
  return render(
    <LangProvider initial={lang}>
      <MemoryRouter initialEntries={[path]}>
        <WorkoutsPage source={source} />
        <LocationProbe />
      </MemoryRouter>
    </LangProvider>,
  )
}

const en = dictionaries.en
const el = dictionaries.el

/** The session card once loaded (the h2 is the template title). */
async function findSession() {
  const heading = await screen.findByRole('heading', { level: 2 })
  const card = heading.closest('article')
  if (card === null) throw new Error('session card not rendered')
  return card
}

describe('URL state helpers', () => {
  it('falls back to home / beginner / moderate for missing or junk params', () => {
    expect(parseWorkoutSelection(new URLSearchParams())).toEqual(DEFAULT_SELECTION)
    expect(
      parseWorkoutSelection(new URLSearchParams('type=space&level=god&intensity=insane')),
    ).toEqual(DEFAULT_SELECTION)
  })
  it('reads every valid member and round-trips through serialize', () => {
    const selection = { type: 'swimming', level: 'advanced', intensity: 'low' } as const
    const params = serializeWorkoutSelection(selection)
    expect(params.toString()).toBe('type=swimming&level=advanced&intensity=low')
    expect(parseWorkoutSelection(params)).toEqual(selection)
  })
})

describe('workFigure', () => {
  const slot = {
    block: 'main',
    exercise_slug: 'x',
    sets: 3,
    reps: 12,
    seconds: null,
    rest_seconds: 60,
  } as const
  it('prefers reps, else seconds, in the current language', () => {
    expect(workFigure(slot, en)).toBe('3 × 12 reps')
    expect(workFigure({ ...slot, reps: null, seconds: 40 }, en)).toBe('3 × 40 s')
    expect(workFigure(slot, el)).toBe('3 × 12 επαναλήψεις')
  })
})

describe('<WorkoutsPage> with the bundled source', () => {
  it('renders the default session with warm-up, main and cool-down, each with at least one item', async () => {
    renderAt('/workouts')
    const card = await findSession()

    for (const option of [en.types.home, en.levels.beginner, en.intensities.moderate]) {
      expect(screen.getByRole('radio', { name: option })).toHaveAttribute('aria-checked', 'true')
    }
    expect(screen.getAllByRole('radiogroup')).toHaveLength(3)
    expect(screen.getAllByRole('radio')).toHaveLength(
      WORKOUT_TYPES.length + LEVELS.length + INTENSITIES.length,
    )

    for (const block of BLOCKS) {
      const section = within(card).getByTestId(`block-${block}`)
      expect(within(section).getByRole('heading', { level: 3 })).toHaveTextContent(en.blocks[block])
      expect(within(section).getAllByRole('listitem').length).toBeGreaterThanOrEqual(1)
    }
    // Each movement carries a cue behind a <details>.
    const cues = card.querySelectorAll('details > summary')
    expect(cues.length).toBe(within(card).getAllByRole('listitem').length)
    expect(cues[0]).toHaveTextContent(en.showCue)

    expect(within(card).getByText(en.duration)).toBeInTheDocument()
    expect(within(card).getByText(en.equipment)).toBeInTheDocument()
    // Two notes in the card: the draft ribbon and the disclaimer.
    const notes = within(card).getAllByRole('note')
    expect(notes).toHaveLength(2)
    expect(within(card).getByText(en.notMedicalAdvice)).toHaveAttribute('role', 'note')
    // Bundled content is a draft: the ribbon shows.
    expect(screen.getByText(en.draftRibbon)).toBeInTheDocument()
    expect(screen.queryByText(en.noSession)).toBeNull()
  })

  it('changes the figures and the duration when intensity goes to high, and writes the URL', async () => {
    renderAt('/workouts')
    const before = await findSession()
    const figuresBefore = within(before)
      .getAllByTestId('work-figure')
      .map((node) => node.textContent)
    const durationBefore = within(before).getByTestId('session-duration').textContent

    fireEvent.click(screen.getByRole('radio', { name: en.intensities.high }))

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/workouts?type=home&level=beginner&intensity=high',
      )
    })
    await waitFor(() => {
      expect(screen.getByRole('radio', { name: en.intensities.high })).toHaveAttribute(
        'aria-checked',
        'true',
      )
      const after = screen.getByRole('heading', { level: 2 }).closest('article')
      expect(after).not.toBeNull()
      const figuresAfter = within(after as HTMLElement)
        .getAllByTestId('work-figure')
        .map((node) => node.textContent)
      expect(figuresAfter).not.toEqual(figuresBefore)
      expect(within(after as HTMLElement).getByTestId('session-duration').textContent).not.toBe(
        durationBefore,
      )
    })
  })

  it('reflects a type change in the URL and keeps the other two keys', async () => {
    renderAt('/workouts?type=gym&level=advanced&intensity=low')
    await findSession()
    expect(screen.getByRole('radio', { name: en.types.gym })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    fireEvent.click(screen.getByRole('radio', { name: en.types.running }))
    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/workouts?type=running&level=advanced&intensity=low',
      )
    })
    await findSession()
  })

  it('renders a session for every one of the 63 type × level × intensity combinations', async () => {
    let combinations = 0
    for (const type of WORKOUT_TYPES) {
      for (const level of LEVELS) {
        for (const intensity of INTENSITIES) {
          const view = renderAt(`/workouts?type=${type}&level=${level}&intensity=${intensity}`)
          const card = await findSession()
          for (const block of BLOCKS) {
            expect(
              within(within(card).getByTestId(`block-${block}`)).getAllByRole('listitem').length,
              `${type}/${level}/${intensity} ${block}`,
            ).toBeGreaterThanOrEqual(1)
          }
          expect(screen.queryByText(en.noSession)).toBeNull()
          view.unmount()
          combinations += 1
        }
      }
    }
    expect(combinations).toBe(63)
  }, 30_000) // 63 renders: ~1 s alone, ~5 s under full-suite load (measured 2026-10-06)

  it.each(['en', 'el'] as const)('speaks %s: headings and every selector label', async (lang) => {
    const t = dictionaries[lang]
    renderAt('/workouts', lang)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(t.workoutsTitle)
    expect(screen.getByText(t.workoutsIntro)).toBeInTheDocument()
    expect(screen.getByText(t.pickType)).toBeInTheDocument()
    expect(screen.getByText(t.pickLevel)).toBeInTheDocument()
    expect(screen.getByText(t.pickIntensity)).toBeInTheDocument()
    for (const type of WORKOUT_TYPES) {
      expect(screen.getByRole('radio', { name: t.types[type] })).toBeInTheDocument()
    }
    for (const level of LEVELS) {
      expect(screen.getByRole('radio', { name: t.levels[level] })).toBeInTheDocument()
    }
    for (const intensity of INTENSITIES) {
      expect(screen.getByRole('radio', { name: t.intensities[intensity] })).toBeInTheDocument()
    }
    const card = await findSession()
    for (const block of BLOCKS) {
      expect(within(card).getByRole('heading', { level: 3, name: t.blocks[block] })).toBeDefined()
    }
    expect(screen.getByText(t.notMedicalAdvice)).toBeInTheDocument()
  })

  it('shows Greek exercise names in Greek and English ones in English', async () => {
    const greek = /[Ͱ-Ͽ]/
    const enView = renderAt('/workouts', 'en')
    const enCard = await findSession()
    const enFirst = within(enCard).getAllByRole('listitem')[0]?.textContent ?? ''
    expect(greek.test(enFirst)).toBe(false)
    enView.unmount()

    renderAt('/workouts', 'el')
    const elCard = await findSession()
    const elFirst = within(elCard).getAllByRole('listitem')[0]?.textContent ?? ''
    expect(greek.test(elFirst)).toBe(true)
  })
})

describe('<WorkoutsPage> states', () => {
  it('shows the loading state until the source answers', () => {
    const pending: ContentSource = {
      ...bundledSource,
      getWorkoutTemplate: () => new Promise(() => {}),
    }
    renderAt('/workouts', 'en', pending)
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent(en.loading)
    // The shared skeleton (P5.1): busy, with reserved space, under the chips that already render.
    expect(status).toHaveAttribute('aria-busy', 'true')
    expect(status).toHaveAttribute('data-skeleton', 'detail')
    expect(screen.getAllByRole('radiogroup')).toHaveLength(3)
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull()
  })

  it('shows the error state when the source fails, and Retry asks the source again', async () => {
    const getWorkoutTemplate = vi
      .fn<ContentSource['getWorkoutTemplate']>()
      .mockResolvedValueOnce(fail('network'))
      .mockImplementation(bundledSource.getWorkoutTemplate)
    renderAt('/workouts', 'el', { ...bundledSource, getWorkoutTemplate })
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(el.workoutsLoadFailed)
    expect(getWorkoutTemplate).toHaveBeenCalledTimes(1)

    fireEvent.click(within(alert).getByRole('button', { name: el.retry }))
    await findSession()
    expect(getWorkoutTemplate).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('shows the empty state when the cell has no visible template', async () => {
    const empty: ContentSource = {
      ...bundledSource,
      getWorkoutTemplate: async () => ok(null),
    }
    renderAt('/workouts', 'en', empty)
    expect(await screen.findByText(en.noSession)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull()
  })

  it('treats a template with a hidden exercise as no session (whole or nothing)', async () => {
    const real = await bundledSource.getWorkoutTemplate('home', 'beginner', 'moderate')
    if (!real.ok || real.data === null) throw new Error('seed missing')
    const holed: WorkoutTemplate = {
      ...real.data,
      slots: real.data.slots.map((slot, i) => (i === 0 ? { ...slot, exercise: null } : slot)),
    }
    expect(blocksOf(real.data)).not.toBeNull()
    expect(blocksOf(holed)).toBeNull()

    const source: ContentSource = { ...bundledSource, getWorkoutTemplate: async () => ok(holed) }
    renderAt('/workouts', 'en', source)
    expect(await screen.findByText(en.noSession)).toBeInTheDocument()
  })
})
