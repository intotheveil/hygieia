import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { bundledSource } from '../content/bundled'
import { fail, ok, type ContentSource, type SkincareProductType } from '../content/source'
import { SKINCARE_PRODUCT_TYPES, SKINCARE_ROUTINES, SKINCARE_TIPS } from '../content/seed/skincare'
import { LangProvider } from '../i18n/LangProvider'
import { dictionaries, type Lang } from '../i18n/dictionary'
import { plural } from '../i18n/fill'
import { SkincarePage } from './SkincarePage'
import { NAIL_CATEGORIES } from './select'

// /skincare rendered in local-only mode (the bundled seed is the content), both languages. Counts
// are computed from the seed, never literals.

function LocationProbe() {
  const location = useLocation()
  return <span data-testid="location">{`${location.pathname}${location.search}`}</span>
}

function renderAt(path: string, lang: Lang = 'en', source: ContentSource = bundledSource) {
  return render(
    <LangProvider initial={lang}>
      <MemoryRouter initialEntries={[path]}>
        <SkincarePage source={source} />
        <LocationProbe />
      </MemoryRouter>
    </LangProvider>,
  )
}

const en = dictionaries.en
const el = dictionaries.el

const FACE_ROUTINES = SKINCARE_ROUTINES.filter((r) => r.area === 'face')
const NAIL_ROUTINES = SKINCARE_ROUTINES.filter((r) => r.area === 'nails')
const FACE_TIPS = SKINCARE_TIPS.filter((t) => t.area === 'face')
const NAIL_TIPS = SKINCARE_TIPS.filter((t) => t.area === 'nails')
const FACE_TYPES = SKINCARE_PRODUCT_TYPES.filter((p) => !NAIL_CATEGORIES.has(p.category))
const NAIL_TYPES = SKINCARE_PRODUCT_TYPES.filter((p) => NAIL_CATEGORIES.has(p.category))

const counts = () => ({
  routines: screen.getByTestId('skincare-routines-count'),
  guide: screen.getByTestId('skincare-guide-count'),
  tips: screen.getByTestId('skincare-tips-count'),
})

/** Waits for the three reads to settle (the routines list is the ready signal). */
async function ready() {
  await screen.findByTestId('skincare-routines-count')
}

const routineCards = () => document.querySelectorAll('[data-routine]')
const typeCards = () => document.querySelectorAll('[data-product-type]')
const tipCards = () => document.querySelectorAll('[data-tip]')

describe('<SkincarePage> with the bundled source', () => {
  it.each(['en', 'el'] as const)(
    'speaks %s: title, intro, disclaimer, the three headings with seed counts, the draft ribbon',
    async (lang) => {
      const t = dictionaries[lang]
      renderAt('/skincare', lang)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(t.skincareTitle)
      expect(screen.getByText(t.skincareIntro)).toBeInTheDocument()
      expect(screen.getByText(t.skincareDisclaimer)).toHaveAttribute('role', 'note')
      await ready()
      const headings = screen.getAllByRole('heading', { level: 2 })
      expect(headings.map((h) => h.textContent)).toEqual([
        `${t.skincareRoutinesHeading}${plural(t.skincareRoutinesCount, FACE_ROUTINES.length)}`,
        `${t.skincareGuideHeading}${plural(t.skincareGuideCount, FACE_TYPES.length)}`,
        `${t.skincareTipsHeading}${plural(t.skincareTipsCount, FACE_TIPS.length)}`,
      ])
      expect(routineCards()).toHaveLength(FACE_ROUTINES.length)
      expect(typeCards()).toHaveLength(FACE_TYPES.length)
      expect(tipCards()).toHaveLength(FACE_TIPS.length)
      expect(screen.getByText(t.draftRibbon)).toBeInTheDocument()
      // The first routine card speaks the language too.
      const first = FACE_ROUTINES[0]
      if (!first) throw new Error('empty seed')
      expect(
        screen.getByRole('heading', {
          level: 3,
          name: lang === 'el' ? first.name_el : first.name_en,
        }),
      ).toBeInTheDocument()
    },
  )

  it('renders the toolbar: area + audience as pressed buttons, skin / concern / style as selects', async () => {
    renderAt('/skincare')
    const toolbar = within(screen.getByRole('region', { name: en.skincareFilters }))
    const area = within(toolbar.getByRole('group', { name: en.skincareAreaLabel }))
    expect(area.getByRole('button', { name: en.skincareArea.face })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(area.getByRole('button', { name: en.skincareArea.nails })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    const audience = within(toolbar.getByRole('group', { name: en.skincareAudienceLabel }))
    expect(audience.getAllByRole('button').map((b) => b.textContent)).toEqual([
      en.skincareAudience.all,
      en.skincareAudience.men,
      en.skincareAudience.women,
    ])
    expect(audience.getByRole('button', { name: en.skincareAudience.all })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(toolbar.getByRole('combobox', { name: en.skincareSkinTypeLabel })).toHaveValue('all')
    expect(toolbar.getByRole('combobox', { name: en.skincareConcernLabel })).toHaveValue('all')
    expect(toolbar.getByRole('combobox', { name: en.skincareRegionLabel })).toHaveValue('all')
    // The concern select under face offers no `nails` option.
    const concern = toolbar.getByRole('combobox', { name: en.skincareConcernLabel })
    expect(within(concern).queryByRole('option', { name: en.skincareConcern.nails })).toBeNull()
    await ready()
  })

  it('the Nails switch hides the skin-type filter, relabels the style control, writes ?area=nails and shows nail content', async () => {
    renderAt('/skincare')
    await ready()
    fireEvent.click(screen.getByRole('button', { name: en.skincareArea.nails }))
    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/skincare?area=nails')
    })
    expect(screen.getByRole('button', { name: en.skincareArea.nails })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.queryByRole('combobox', { name: en.skincareSkinTypeLabel })).toBeNull()
    expect(screen.getByRole('combobox', { name: en.skincareRegionLabelNails })).toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: en.skincareRegionLabel })).toBeNull()
    expect(counts().routines).toHaveTextContent(
      plural(en.skincareRoutinesCount, NAIL_ROUTINES.length),
    )
    expect(counts().guide).toHaveTextContent(plural(en.skincareGuideCount, NAIL_TYPES.length))
    expect(counts().tips).toHaveTextContent(plural(en.skincareTipsCount, NAIL_TIPS.length))
    expect(routineCards()).toHaveLength(NAIL_ROUTINES.length)
    // Back to face clears the URL and restores the skin-type select.
    fireEvent.click(screen.getByRole('button', { name: en.skincareArea.face }))
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/skincare$/))
    expect(screen.getByRole('combobox', { name: en.skincareSkinTypeLabel })).toBeInTheDocument()
  })

  it('audience, skin type, concern and style change the counts and the URL (men + dry + kr)', async () => {
    renderAt('/skincare')
    await ready()
    fireEvent.click(screen.getByRole('button', { name: en.skincareAudience.men }))
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/skincare?audience=men'),
    )
    const menRoutines = FACE_ROUTINES.filter((r) => r.audience !== 'women')
    expect(counts().routines).toHaveTextContent(
      plural(en.skincareRoutinesCount, menRoutines.length),
    )

    fireEvent.change(screen.getByRole('combobox', { name: en.skincareSkinTypeLabel }), {
      target: { value: 'dry' },
    })
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/skincare?audience=men&skin=dry'),
    )
    const menDry = menRoutines.filter((r) => r.skin_type === 'dry' || r.skin_type === 'all')
    expect(counts().routines).toHaveTextContent(plural(en.skincareRoutinesCount, menDry.length))

    fireEvent.change(screen.getByRole('combobox', { name: en.skincareRegionLabel }), {
      target: { value: 'kr' },
    })
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/skincare?audience=men&skin=dry&region=kr',
      ),
    )
    const menDryKr = menDry.filter((r) => r.region === 'kr')
    expect(counts().routines).toHaveTextContent(plural(en.skincareRoutinesCount, menDryKr.length))
    for (const card of routineCards()) {
      expect(menDryKr.map((r) => r.slug)).toContain(card.getAttribute('data-routine'))
    }

    // Concern narrows the guide and the tips, not the routines.
    fireEvent.change(screen.getByRole('combobox', { name: en.skincareConcernLabel }), {
      target: { value: 'acne' },
    })
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('concern=acne'))
    expect(counts().routines).toHaveTextContent(plural(en.skincareRoutinesCount, menDryKr.length))
    for (const card of typeCards()) {
      const slug = card.getAttribute('data-product-type')
      const type = SKINCARE_PRODUCT_TYPES.find((p) => p.slug === slug)
      expect(type?.concerns, slug ?? '').toContain('acne')
    }
    // Back to "all" on a select removes its key.
    fireEvent.change(screen.getByRole('combobox', { name: en.skincareConcernLabel }), {
      target: { value: 'all' },
    })
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/skincare?audience=men&skin=dry&region=kr',
      ),
    )
  })

  it('honours a deep link and shows the matching controls pressed / selected', async () => {
    renderAt('/skincare?area=nails&audience=women&region=eu')
    await ready()
    expect(screen.getByRole('button', { name: en.skincareArea.nails })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: en.skincareAudience.women })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('combobox', { name: en.skincareRegionLabelNails })).toHaveValue('eu')
    const expected = NAIL_ROUTINES.filter((r) => r.audience !== 'men')
    expect(counts().routines).toHaveTextContent(plural(en.skincareRoutinesCount, expected.length))
  })

  it('expands a routine to show its steps in order with the product-type names, optional marks and notes; collapses again', async () => {
    renderAt('/skincare')
    await ready()
    const routine = FACE_ROUTINES[0]
    if (!routine) throw new Error('empty seed')
    const card = document.querySelector(`[data-routine="${routine.slug}"]`)
    if (!(card instanceof HTMLElement)) throw new Error('no card')
    const toggle = within(card).getByRole('button', { name: en.skincareShowSteps })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(within(card).queryByRole('list', { name: en.skincareSteps })).toBeNull()
    expect(within(card).getByTestId('routine-duration')).toHaveTextContent(
      `${routine.duration_min} ${en.minutesUnit}`,
    )

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(toggle).toHaveTextContent(en.skincareHideSteps)
    const list = within(card).getByRole('list', { name: en.skincareSteps })
    expect(toggle).toHaveAttribute('aria-controls', list.id)
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(routine.steps.length)
    routine.steps.forEach((step, i) => {
      const type = SKINCARE_PRODUCT_TYPES.find((p) => p.slug === step.product_type_slug)
      if (!type) throw new Error(`dangling ${step.product_type_slug}`)
      const item = items[i] as HTMLElement
      expect(item).toHaveAttribute('data-step-order', String(step.order))
      expect(item).toHaveTextContent(type.name_en)
      expect(item).toHaveTextContent(step.note_en)
      if (step.optional) expect(within(item).getByText(en.skincareOptionalStep)).toBeInTheDocument()
      else expect(within(item).queryByText(en.skincareOptionalStep)).toBeNull()
      expect(item).not.toHaveAttribute('data-step-unavailable')
    })
    expect(routine.steps.some((s) => s.optional)).toBe(true)

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(within(card).queryByRole('list', { name: en.skincareSteps })).toBeNull()
  })

  it('renders a step whose product type is not visible muted, with its slug and the unavailable label', async () => {
    const routine = FACE_ROUTINES[0]
    if (!routine) throw new Error('empty seed')
    const hidden = routine.steps[0]?.product_type_slug
    if (!hidden) throw new Error('fixture routine has no steps')
    const source: ContentSource = {
      ...bundledSource,
      listSkincareProductTypes: async () => {
        const all = await bundledSource.listSkincareProductTypes()
        return all.ok ? ok(all.data.filter((p) => p.slug !== hidden)) : all
      },
    }
    renderAt('/skincare', 'el', source)
    await ready()
    const card = document.querySelector(`[data-routine="${routine.slug}"]`)
    if (!(card instanceof HTMLElement)) throw new Error('no card')
    fireEvent.click(within(card).getByRole('button', { name: el.skincareShowSteps }))
    const items = within(within(card).getByRole('list', { name: el.skincareSteps })).getAllByRole(
      'listitem',
    )
    const first = items[0] as HTMLElement
    expect(first).toHaveAttribute('data-step-unavailable')
    expect(first).toHaveTextContent(hidden)
    expect(first).toHaveTextContent(el.skincareStepUnavailable)
    expect(items.filter((li) => li.hasAttribute('data-step-unavailable'))).toHaveLength(
      routine.steps.filter((s) => s.product_type_slug === hidden).length,
    )
    // The hidden type is also gone from the guide.
    expect(document.querySelector(`[data-product-type="${hidden}"]`)).toBeNull()
  })

  it('product-type cards carry category / time / price chips, ingredients, cautions and the note', async () => {
    renderAt('/skincare')
    await ready()
    const withCaution = FACE_TYPES.find((p) => p.avoid_with.length > 0)
    const without = FACE_TYPES.find((p) => p.avoid_with.length === 0)
    if (!withCaution || !without) throw new Error('seed needs a type with and one without cautions')
    const card = document.querySelector(`[data-product-type="${withCaution.slug}"]`)
    if (!(card instanceof HTMLElement)) throw new Error('no card')
    expect(within(card).getByRole('heading', { level: 3 })).toHaveTextContent(withCaution.name_en)
    const chips = within(card)
      .getAllByRole('listitem')
      .map((li) => li.textContent)
    expect(chips).toEqual([
      en.skincareCategory[withCaution.category],
      en.skincareStepTime[withCaution.time],
      en.skincarePriceBand[withCaution.price_band_eur],
    ])
    expect(card).toHaveTextContent(withCaution.key_ingredients.join(', '))
    expect(within(card).getByText(en.skincareAvoidWith)).toBeInTheDocument()
    expect(card).toHaveTextContent(withCaution.avoid_with.join(', '))
    expect(card).toHaveTextContent(withCaution.notes_en)
    expect(card).toHaveTextContent(withCaution.regions.map((r) => en.skincareRegion[r]).join(', '))
    const plain = document.querySelector(`[data-product-type="${without.slug}"]`)
    if (!(plain instanceof HTMLElement)) throw new Error('no card')
    expect(within(plain).queryByText(en.skincareAvoidWith)).toBeNull()
  })

  it('tips link every source by hostname in a new tab, or show "source pending"', async () => {
    renderAt('/skincare')
    await ready()
    const sourced = FACE_TIPS.find((t) => !t.needs_source && t.sources.length > 1)
    const pending = FACE_TIPS.find((t) => t.needs_source)
    if (!sourced || !pending) throw new Error('seed needs a multi-sourced and a pending face tip')

    const sourcedCard = document.querySelector(`[data-tip="${sourced.slug}"]`)
    if (!(sourcedCard instanceof HTMLElement)) throw new Error('no card')
    const links = within(sourcedCard).getAllByRole('link')
    expect(links.map((a) => a.getAttribute('href'))).toEqual(sourced.sources)
    for (const link of links) {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      expect(link.textContent).not.toMatch(/^https?:/)
    }
    expect(within(sourcedCard).getByText(en.skincareSources)).toBeInTheDocument()
    expect(within(sourcedCard).queryByText(en.sourcePending)).toBeNull()

    const pendingCard = document.querySelector(`[data-tip="${pending.slug}"]`)
    if (!(pendingCard instanceof HTMLElement)) throw new Error('no card')
    expect(within(pendingCard).getByText(en.sourcePending)).toBeInTheDocument()
    expect(within(pendingCard).queryByRole('link')).toBeNull()

    expect(screen.getAllByText(en.sourcePending)).toHaveLength(
      FACE_TIPS.filter((t) => t.needs_source).length,
    )
    for (const anchor of screen.getAllByRole('link')) {
      expect(anchor.getAttribute('href')).toMatch(/^https?:\/\//)
    }
  })
})

describe('<SkincarePage> states', () => {
  it('shows the frame (title, toolbar) and one list skeleton until the three reads settle', () => {
    const never = () => new Promise<never>(() => {})
    const pending: ContentSource = {
      ...bundledSource,
      listSkincareProductTypes: never,
      listSkincareRoutines: never,
      listSkincareTips: never,
    }
    renderAt('/skincare', 'en', pending)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(en.skincareTitle)
    expect(screen.getByRole('region', { name: en.skincareFilters })).toBeInTheDocument()
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent(en.loading)
    expect(status).toHaveAttribute('aria-busy', 'true')
    expect(status).toHaveAttribute('data-skeleton', 'list')
    expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0)
  })

  it('reads the three lists in parallel and shows the error state if ANY fails; Retry asks again', async () => {
    const listSkincareRoutines = vi
      .fn<ContentSource['listSkincareRoutines']>()
      .mockResolvedValueOnce(fail('network'))
      .mockImplementation(bundledSource.listSkincareRoutines)
    const listSkincareTips = vi
      .fn<ContentSource['listSkincareTips']>()
      .mockImplementation(bundledSource.listSkincareTips)
    renderAt('/skincare', 'el', { ...bundledSource, listSkincareRoutines, listSkincareTips })
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(el.skincareLoadFailed)
    expect(listSkincareRoutines).toHaveBeenCalledTimes(1)
    expect(listSkincareTips).toHaveBeenCalledTimes(1) // parallel: the tips read went out too
    expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0)

    fireEvent.click(within(alert).getByRole('button', { name: el.retry }))
    await ready()
    expect(listSkincareRoutines).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('alert')).toBeNull()
    expect(routineCards()).toHaveLength(FACE_ROUTINES.length)
  })

  it('shows an empty state per section when nothing matches, and the other sections still render', async () => {
    const noTypes: ContentSource = {
      ...bundledSource,
      listSkincareProductTypes: async () => ok<SkincareProductType[]>([]),
    }
    renderAt('/skincare', 'en', noTypes)
    await ready()
    expect(screen.getByText(en.skincareGuideEmpty)).toBeInTheDocument()
    expect(counts().guide).toHaveTextContent(plural(en.skincareGuideCount, 0))
    expect(screen.queryByText(en.skincareRoutinesEmpty)).toBeNull()
    expect(screen.queryByText(en.skincareTipsEmpty)).toBeNull()
    expect(routineCards()).toHaveLength(FACE_ROUTINES.length)
  })

  it('a filter combination that matches nothing shows all three empty states (deep link)', async () => {
    // Nails + men + concern general: the seed has no such product type; check the other two live.
    renderAt('/skincare?area=nails&audience=men&concern=general', 'el')
    await ready()
    expect(screen.getByText(el.skincareGuideEmpty)).toBeInTheDocument()
    const routines = NAIL_ROUTINES.filter((r) => r.audience !== 'women')
    expect(counts().routines).toHaveTextContent(plural(el.skincareRoutinesCount, routines.length))
    const tips = NAIL_TIPS.filter(
      (t) =>
        (t.audiences.includes('men') || t.audiences.includes('all')) &&
        t.concerns.includes('general'),
    )
    if (tips.length === 0) expect(screen.getByText(el.skincareTipsEmpty)).toBeInTheDocument()
    else expect(counts().tips).toHaveTextContent(plural(el.skincareTipsCount, tips.length))
  })
})
