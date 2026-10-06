import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { bundledSource } from '../content/bundled'
import { TIP_TOPICS } from '../content/enums'
import { fail, ok, type ContentSource, type HealthTip } from '../content/source'
import { HEALTH_TIPS } from '../content/seed/tips'
import { LangProvider } from '../i18n/LangProvider'
import { dictionaries, type Lang } from '../i18n/dictionary'
import { fill } from '../i18n/fill'
import { TipsPage, groupByTopic, parseTopic } from './TipsPage'

function LocationProbe() {
  const location = useLocation()
  return <span data-testid="location">{`${location.pathname}${location.search}`}</span>
}

function renderAt(path: string, lang: Lang = 'en', source: ContentSource = bundledSource) {
  return render(
    <LangProvider initial={lang}>
      <MemoryRouter initialEntries={[path]}>
        <TipsPage source={source} />
        <LocationProbe />
      </MemoryRouter>
    </LangProvider>,
  )
}

const en = dictionaries.en
const el = dictionaries.el

async function findTopicHeadings() {
  await screen.findAllByRole('article')
  return screen.getAllByRole('heading', { level: 2 })
}

describe('parseTopic / groupByTopic', () => {
  it('reads a known topic and treats absent, blank or unknown as all', () => {
    expect(parseTopic(new URLSearchParams('topic=sleep'))).toBe('sleep')
    expect(parseTopic(new URLSearchParams())).toBeNull()
    expect(parseTopic(new URLSearchParams('topic='))).toBeNull()
    expect(parseTopic(new URLSearchParams('topic=astrology'))).toBeNull()
  })
  it('groups in TIP_TOPICS order and keeps every tip exactly once', async () => {
    const tips = await bundledSource.listTips()
    if (!tips.ok) throw new Error('bundled tips failed')
    const groups = groupByTopic(tips.data)
    expect(groups.map((g) => g.topic)).toEqual([...TIP_TOPICS])
    expect(groups.reduce((n, g) => n + g.tips.length, 0)).toBe(tips.data.length)
    for (const group of groups) {
      expect(group.tips.every((tip) => tip.topic === group.topic)).toBe(true)
    }
  })
})

describe('<TipsPage> with the bundled source', () => {
  it('renders at least 60 cards grouped under the six topic headings, with counts', async () => {
    renderAt('/tips')
    const headings = await findTopicHeadings()
    expect(headings).toHaveLength(TIP_TOPICS.length)
    expect(headings.map((h) => h.textContent)).toEqual(
      TIP_TOPICS.map((topic) => {
        const n = HEALTH_TIPS.filter((tip) => tip.topic === topic).length
        return `${en.topics[topic]}${fill(en.tipsCount, { n })}`
      }),
    )
    const cards = screen.getAllByRole('article')
    expect(cards.length).toBeGreaterThanOrEqual(60)
    expect(cards.length).toBe(HEALTH_TIPS.length)
    // The "all" chip carries the total, each topic chip its own count.
    expect(screen.getByRole('radio', { name: new RegExp(`^${en.allTopics}`) })).toHaveTextContent(
      `(${HEALTH_TIPS.length})`,
    )
    expect(screen.getByRole('radio', { name: new RegExp(`^${en.allTopics}`) })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByText(en.draftRibbon)).toBeInTheDocument()
  })

  it('filters to sleep tips only when the sleep chip is clicked, and writes the URL', async () => {
    renderAt('/tips')
    await findTopicHeadings()
    fireEvent.click(screen.getByRole('radio', { name: new RegExp(`^${en.topics.sleep}`) }))

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/tips?topic=sleep')
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1)
    })
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(en.topics.sleep)
    const sleepCount = HEALTH_TIPS.filter((tip) => tip.topic === 'sleep').length
    expect(sleepCount).toBeGreaterThanOrEqual(4)
    const cards = screen.getAllByRole('article')
    expect(cards).toHaveLength(sleepCount)
    const sleepTitles = new Set(
      HEALTH_TIPS.filter((tip) => tip.topic === 'sleep').map((tip) => tip.title_en),
    )
    for (const card of cards) {
      expect(
        sleepTitles.has(within(card).getByRole('heading', { level: 3 }).textContent ?? ''),
      ).toBe(true)
    }
    // Back to all.
    fireEvent.click(screen.getByRole('radio', { name: new RegExp(`^${en.allTopics}`) }))
    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(/^\/tips$/)
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(TIP_TOPICS.length)
    })
  })

  it('honours a deep link ?topic=hydration', async () => {
    renderAt('/tips?topic=hydration')
    const headings = await findTopicHeadings()
    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveTextContent(en.topics.hydration)
    expect(
      screen.getByRole('radio', { name: new RegExp(`^${en.topics.hydration}`) }),
    ).toHaveAttribute('aria-checked', 'true')
  })

  it('shows "source pending" for a needs_source tip and a safe external link for a sourced one', async () => {
    const pending = HEALTH_TIPS.find((tip) => tip.needs_source)
    const sourced = HEALTH_TIPS.find((tip) => !tip.needs_source && tip.source_url !== null)
    if (!pending || !sourced) throw new Error('seed lacks a pending or a sourced tip')

    renderAt('/tips')
    await findTopicHeadings()

    const pendingCard = screen
      .getByRole('heading', { level: 3, name: pending.title_en })
      .closest('article')
    expect(pendingCard).not.toBeNull()
    expect(within(pendingCard as HTMLElement).getByText(en.sourcePending)).toBeInTheDocument()
    expect(within(pendingCard as HTMLElement).queryByRole('link')).toBeNull()

    const sourcedCard = screen
      .getByRole('heading', { level: 3, name: sourced.title_en })
      .closest('article')
    expect(sourcedCard).not.toBeNull()
    const link = within(sourcedCard as HTMLElement).getByRole('link', { name: en.readSource })
    expect(link).toHaveAttribute('href', sourced.source_url)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(within(sourcedCard as HTMLElement).queryByText(en.sourcePending)).toBeNull()

    // Every link on the page is safe, and no card both links and claims a pending source.
    for (const anchor of screen.getAllByRole('link')) {
      expect(anchor).toHaveAttribute('rel', 'noopener noreferrer')
      expect(anchor.getAttribute('href')).toMatch(/^https?:\/\//)
    }
  })

  it.each(['en', 'el'] as const)(
    'speaks %s: title, intro, chips, topic headings, cards',
    async (lang) => {
      const t = dictionaries[lang]
      renderAt('/tips', lang)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(t.tipsTitle)
      expect(screen.getByText(t.tipsIntro)).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: new RegExp(`^${t.allTopics}`) })).toBeInTheDocument()
      for (const topic of TIP_TOPICS) {
        expect(screen.getByRole('radio', { name: new RegExp(`^${t.topics[topic]}`) })).toBeDefined()
      }
      const headings = await findTopicHeadings()
      expect(headings.map((h) => h.textContent?.startsWith(t.topics[TIP_TOPICS[0]]))).toContain(
        true,
      )
      const first = HEALTH_TIPS[0]
      if (!first) throw new Error('empty seed')
      expect(
        screen.getByRole('heading', {
          level: 3,
          name: lang === 'el' ? first.title_el : first.title_en,
        }),
      ).toBeInTheDocument()
      expect(screen.getAllByText(t.sourcePending).length).toBe(
        HEALTH_TIPS.filter((tip) => tip.needs_source).length,
      )
    },
  )
})

describe('<TipsPage> states', () => {
  it('shows the loading state until the source answers', () => {
    const pending: ContentSource = { ...bundledSource, listTips: () => new Promise(() => {}) }
    renderAt('/tips', 'en', pending)
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent(en.loading)
    // The shared skeleton (P5.1): busy, with reserved space, under the topic chips.
    expect(status).toHaveAttribute('aria-busy', 'true')
    expect(status).toHaveAttribute('data-skeleton', 'list')
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
    expect(screen.queryAllByRole('article')).toHaveLength(0)
  })

  it('shows the error state when the source fails, and Retry asks the source again', async () => {
    const listTips = vi
      .fn<ContentSource['listTips']>()
      .mockResolvedValueOnce(fail('unknown'))
      .mockImplementation(bundledSource.listTips)
    renderAt('/tips', 'el', { ...bundledSource, listTips })
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(el.tipsLoadFailed)
    expect(listTips).toHaveBeenCalledTimes(1)

    fireEvent.click(within(alert).getByRole('button', { name: el.retry }))
    await screen.findAllByRole('article')
    expect(listTips).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('shows the empty state when there are no visible tips, or none for the chosen topic', async () => {
    const none: ContentSource = { ...bundledSource, listTips: async () => ok<HealthTip[]>([]) }
    const view = renderAt('/tips', 'en', none)
    expect(await screen.findByText(en.tipsEmpty)).toBeInTheDocument()
    view.unmount()

    const sleepOnly: ContentSource = {
      ...bundledSource,
      listTips: async () => {
        const all = await bundledSource.listTips()
        return all.ok ? ok(all.data.filter((tip) => tip.topic === 'sleep')) : all
      },
    }
    renderAt('/tips?topic=mental', 'en', sleepOnly)
    expect(await screen.findByText(en.tipsEmpty)).toBeInTheDocument()
    expect(
      screen.getByRole('radio', { name: new RegExp(`^${en.topics.mental}`) }),
    ).toHaveTextContent('(0)')
  })
})
