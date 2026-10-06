import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { bundledSource } from '../content/bundled'
import { fail, ok, type ContentSource } from '../content/source'
import { LangProvider } from '../i18n/LangProvider'
import { dictionaries, type Lang } from '../i18n/dictionary'
import { fill } from '../i18n/fill'
import { pickOfTheDay } from '../prefs/ofTheDay'
import { NO_PREFS, type Prefs } from '../prefs/prefs'
import { OVERLAID_SEED } from '../test/overlaidSeed'
import { HomeExtras, type HomeExtrasProps } from './HomeExtras'

const en = dictionaries.en
const el = dictionaries.el
/** A fixed day: 6 Oct 2026, noon in Athens. */
const NOW = new Date('2026-10-06T09:00:00Z')
/** What the page picks from: the SERVED lists (base seed + every overlay), not the frozen base arrays. */
const RECIPES = OVERLAID_SEED.recipes
const HEALTH_TIPS = OVERLAID_SEED.health_tips

function renderExtras(props: Partial<HomeExtrasProps> = {}, lang: Lang = 'en') {
  const onPrefsDone = vi.fn<(prefs: Prefs | null) => void>()
  const view = render(
    <LangProvider initial={lang}>
      <MemoryRouter>
        <HomeExtras
          prefs={null}
          showOnboarding={false}
          editing={false}
          onPrefsDone={onPrefsDone}
          now={NOW}
          source={bundledSource}
          {...props}
        />
      </MemoryRouter>
    </LangProvider>,
  )
  return { ...view, onPrefsDone }
}

const select = (label: string) => screen.getByRole('combobox', { name: label })

describe('<Onboarding> (inside HomeExtras)', () => {
  it('shows three optional questions with Save and Skip on a first visit', () => {
    renderExtras({ showOnboarding: true })
    const card = screen.getByRole('region', { name: en.prefsTitle })
    expect(within(card).getAllByRole('combobox')).toHaveLength(3)
    expect(select(en.prefsGoalLabel)).toHaveValue('')
    expect(select(en.prefsDietLabel)).toHaveValue('')
    expect(select(en.prefsActivityLabel)).toHaveValue('')
    expect(screen.getByRole('button', { name: en.prefsSave })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: en.prefsSkip })).toBeInTheDocument()
    // Not a modal: no dialog role, nothing hidden behind it.
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('Save reports the answers', () => {
    const { onPrefsDone } = renderExtras({ showOnboarding: true })
    fireEvent.change(select(en.prefsGoalLabel), { target: { value: 'lose-weight' } })
    fireEvent.change(select(en.prefsDietLabel), { target: { value: 'low-carb' } })
    fireEvent.change(select(en.prefsActivityLabel), { target: { value: 'moderate' } })
    fireEvent.click(screen.getByRole('button', { name: en.prefsSave }))
    expect(onPrefsDone).toHaveBeenCalledWith({
      goal: 'lose-weight',
      diet: 'low-carb',
      activity: 'moderate',
      skipped: false,
    })
  })

  it('Save with no answers is allowed (every question is optional)', () => {
    const { onPrefsDone } = renderExtras({ showOnboarding: true })
    fireEvent.click(screen.getByRole('button', { name: en.prefsSave }))
    expect(onPrefsDone).toHaveBeenCalledWith(NO_PREFS)
  })

  it('Skip reports a skipped record', () => {
    const { onPrefsDone } = renderExtras({ showOnboarding: true })
    fireEvent.click(screen.getByRole('button', { name: en.prefsSkip }))
    expect(onPrefsDone).toHaveBeenCalledWith({ ...NO_PREFS, skipped: true })
  })

  it('editing starts from the saved answers and offers Cancel (= no change)', () => {
    const saved: Prefs = { goal: 'skin', diet: 'vegan', activity: 'low', skipped: false }
    const { onPrefsDone } = renderExtras({ showOnboarding: true, editing: true, prefs: saved })
    expect(select(en.prefsGoalLabel)).toHaveValue('skin')
    expect(select(en.prefsDietLabel)).toHaveValue('vegan')
    expect(select(en.prefsActivityLabel)).toHaveValue('low')
    expect(select(en.prefsGoalLabel)).toHaveFocus()
    expect(screen.queryByRole('button', { name: en.prefsSkip })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: en.prefsCancel }))
    expect(onPrefsDone).toHaveBeenCalledWith(null)
  })

  it('is fully translated in Greek', () => {
    renderExtras({ showOnboarding: true }, 'el')
    expect(screen.getByRole('region', { name: el.prefsTitle })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: el.prefsGoals.skin })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: el.prefsSkip })).toBeInTheDocument()
  })

  it('is absent when not asked for', () => {
    renderExtras()
    expect(screen.queryByRole('region', { name: en.prefsTitle })).toBeNull()
  })
})

describe('<OfTheDay> (inside HomeExtras)', () => {
  it("shows today's recipe and tip for a fixed date, linking to them", async () => {
    renderExtras()
    const recipe = pickOfTheDay(RECIPES, NOW, 'recipe')
    const tip = pickOfTheDay(HEALTH_TIPS, NOW, 'tip')
    if (recipe === null || tip === null) throw new Error('seed lists are not empty')

    const recipeCard = screen.getByTestId('recipe-of-the-day')
    expect(recipeCard).toHaveTextContent(en.recipeOfTheDay)
    const link = await within(recipeCard).findByRole('link', { name: recipe.title_en })
    expect(link).toHaveAttribute('href', `/recipes/${recipe.slug}`)

    const tipCard = screen.getByTestId('tip-of-the-day')
    expect(await within(tipCard).findByText(tip.title_en)).toBeInTheDocument()
    expect(
      within(tipCard).getByRole('link', {
        name: `${fill(en.tipOfTheDayMore, { topic: en.topics[tip.topic] })} →`,
      }),
    ).toHaveAttribute('href', `/tips?topic=${tip.topic}`)
  })

  it('is the same pick on a re-render the same day', async () => {
    const first = renderExtras()
    const recipe = pickOfTheDay(RECIPES, NOW, 'recipe')
    await within(screen.getByTestId('recipe-of-the-day')).findByRole('link')
    const title = screen.getByTestId('recipe-of-the-day').textContent
    first.unmount()
    renderExtras({ now: new Date('2026-10-06T20:30:00Z') }) // 23:30 in Athens, same day
    await within(screen.getByTestId('recipe-of-the-day')).findByRole('link', {
      name: recipe?.title_en,
    })
    expect(screen.getByTestId('recipe-of-the-day').textContent).toBe(title)
  })

  it('honours the diet preference', async () => {
    const prefs: Prefs = { ...NO_PREFS, diet: 'keto' }
    renderExtras({ prefs })
    const expected = pickOfTheDay(RECIPES, NOW, 'recipe', (r) => r.diet_slugs.includes('keto'))
    expect(expected?.diet_slugs).toContain('keto')
    const card = screen.getByTestId('recipe-of-the-day')
    expect(await within(card).findByRole('link', { name: expected?.title_en })).toBeInTheDocument()
  })

  it('shows a fixed-height loading card first, then the pick (aria-busy flips)', async () => {
    renderExtras()
    const card = screen.getByTestId('recipe-of-the-day')
    expect(card).toHaveAttribute('aria-busy', 'true')
    expect(card.className).toMatch(/\bh-56\b/)
    await within(card).findByRole('link')
    expect(card).toHaveAttribute('aria-busy', 'false')
  })

  it('an empty list says there is nothing to pick', async () => {
    const empty: ContentSource = {
      ...bundledSource,
      listRecipes: () => Promise.resolve(ok([])),
      listTips: () => Promise.resolve(ok([])),
    }
    renderExtras({ source: empty })
    expect(await screen.findAllByText(en.ofTheDayNone)).toHaveLength(2)
  })

  it('a failed read shows the error with Retry, inside the card', async () => {
    const failing: ContentSource = {
      ...bundledSource,
      listRecipes: () => Promise.resolve(fail('network')),
      listTips: () => Promise.resolve(fail('network')),
    }
    renderExtras({ source: failing })
    const alerts = await screen.findAllByRole('alert')
    expect(alerts).toHaveLength(2)
    expect(alerts[0]).toHaveTextContent(en.loadFailed)
    expect(screen.getAllByRole('button', { name: en.retry })).toHaveLength(2)
  })
})
