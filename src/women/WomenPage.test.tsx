import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { bundledSource } from '../content/bundled'
import { fail, ok, type ContentSource, type WorkoutTemplate } from '../content/source'
import { LangProvider } from '../i18n/LangProvider'
import { dictionaries, type Lang } from '../i18n/dictionary'
import { fill } from '../i18n/fill'
import { WOMEN_SECTIONS, WOMEN_TEMPLATE_SLUGS } from './content'
import { WomenPage, loadWomenTemplates } from './WomenPage'

// /women in both languages. The workout templates are another lane's content, so the source is a
// fake over the bundled one: `listWorkoutTemplates` answers whatever each test needs.

async function realTemplate(): Promise<WorkoutTemplate> {
  const all = await bundledSource.listWorkoutTemplates()
  if (!all.ok || all.data[0] === undefined) throw new Error('bundled seed has no template')
  return all.data[0]
}

/** A template under one of the women's slugs, built from a real bundled row. */
async function womenTemplate(slug: string, patch: Partial<WorkoutTemplate> = {}) {
  return {
    ...(await realTemplate()),
    slug,
    title_en: `EN ${slug}`,
    title_el: `ΕΛ ${slug}`,
    ...patch,
  }
}

function withTemplates(result: Awaited<ReturnType<ContentSource['listWorkoutTemplates']>>) {
  const source: ContentSource = {
    ...bundledSource,
    listWorkoutTemplates: () => Promise.resolve(result),
  }
  return source
}

function renderPage(lang: Lang, source: ContentSource) {
  return render(
    <LangProvider initial={lang}>
      <MemoryRouter initialEntries={['/women']}>
        <WomenPage source={source} />
      </MemoryRouter>
    </LangProvider>,
  )
}

const LANGS: readonly Lang[] = ['el', 'en']

describe('WomenPage', () => {
  it.each(LANGS)('renders one h1, the table of contents and the four sections (%s)', (lang) => {
    const t = dictionaries[lang]
    renderPage(lang, withTemplates(ok([])))
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: t.womenTitle })).toBeInTheDocument()

    const toc = screen.getByRole('navigation', { name: t.womenToc })
    const tocLinks = within(toc).getAllByRole('link')
    expect(tocLinks.map((a) => a.textContent)).toEqual(WOMEN_SECTIONS.map((s) => s.title[lang]))

    for (const section of WOMEN_SECTIONS) {
      const heading = screen.getByRole('heading', { level: 2, name: section.title[lang] })
      const region = screen.getByRole('region', { name: section.title[lang] })
      expect(region).toHaveAttribute('id', `women-${section.id}`)
      expect(region).toContainElement(heading)
      expect(within(toc).getByRole('link', { name: section.title[lang] })).toHaveAttribute(
        'href',
        `#women-${section.id}`,
      )
      for (const card of section.cards) {
        const article = within(region).getByRole('article', { name: card.title[lang] })
        expect(article).toHaveTextContent(card.body[lang])
      }
    }
  })

  it.each(LANGS)('links every card source in a new tab (%s)', (lang) => {
    renderPage(lang, withTemplates(ok([])))
    for (const card of WOMEN_SECTIONS.flatMap((s) => s.cards)) {
      const article = screen.getByRole('article', { name: card.title[lang] })
      const hrefs = within(article)
        .getAllByRole('link')
        .map((a) => a.getAttribute('href'))
      for (const url of card.sources) expect(hrefs).toContain(url)
      for (const a of within(article).getAllByRole('link')) {
        if (a.getAttribute('href')?.startsWith('https://')) {
          expect(a).toHaveAttribute('target', '_blank')
          expect(a).toHaveAttribute('rel', 'noopener noreferrer')
        }
      }
    }
  })

  it.each(LANGS)('links each nutrient card to its recipe filter (%s)', (lang) => {
    const t = dictionaries[lang]
    renderPage(lang, withTemplates(ok([])))
    const expected: Record<string, string> = {
      'nutrition-iron': '/recipes?nutrient=iron',
      'nutrition-calcium': '/recipes?nutrient=calcium',
      'nutrition-vitamin-d': '/recipes?nutrient=vitamin-d',
      'nutrition-folate': '/recipes?nutrient=folate',
    }
    const nutrition = WOMEN_SECTIONS.find((s) => s.id === 'nutrition')
    for (const card of nutrition?.cards ?? []) {
      const article = screen.getByRole('article', { name: card.title[lang] })
      const recipeLinks = within(article)
        .getAllByRole('link')
        .filter((a) => a.getAttribute('href')?.startsWith('/recipes'))
      if (card.nutrient) {
        expect(recipeLinks).toHaveLength(1)
        expect(recipeLinks[0]).toHaveAttribute('href', expected[card.id])
        expect(recipeLinks[0]).toHaveTextContent(
          fill(t.womenRecipesFor, { nutrient: card.nutrient.name[lang] }),
        )
      } else {
        expect(recipeLinks, card.id).toHaveLength(0)
      }
    }
  })

  it.each(LANGS)('shows the "see a doctor if…" box in the menopause section (%s)', (lang) => {
    const t = dictionaries[lang]
    renderPage(lang, withTemplates(ok([])))
    const menopause = WOMEN_SECTIONS.find((s) => s.id === 'menopause')
    const region = screen.getByRole('region', { name: menopause?.title[lang] })
    const box = within(region).getByRole('complementary', { name: t.womenDoctorTitle })
    for (const item of menopause?.doctor?.items ?? []) expect(box).toHaveTextContent(item[lang])
    expect(screen.getAllByTestId('women-doctor')).toHaveLength(1)
  })

  it.each(LANGS)(
    'renders the women-strength templates that resolve, in order (%s)',
    async (lang) => {
      const t = dictionaries[lang]
      const lower = await womenTemplate('women-strength-gym-intermediate-lower', {
        workout_type: 'gym',
        level: 'intermediate',
      })
      const fullA = await womenTemplate('women-strength-gym-beginner-full-body-a', {
        workout_type: 'gym',
        level: 'beginner',
      })
      const other = await womenTemplate('not-a-women-template')
      renderPage(lang, withTemplates(ok([lower, other, fullA])))

      const list = await screen
        .findByRole('list', { name: '' }, { timeout: 3000 })
        .catch(() => null)
      void list
      const heading = await screen.findByRole(
        'heading',
        { name: t.womenTemplatesHeading },
        { timeout: 5000 },
      )
      expect(heading).toBeInTheDocument()
      const cards = document.querySelectorAll('[data-template]')
      expect([...cards].map((c) => c.getAttribute('data-template'))).toEqual([
        'women-strength-gym-beginner-full-body-a',
        'women-strength-gym-intermediate-lower',
      ])
      const titleA = lang === 'el' ? fullA.title_el : fullA.title_en
      expect(
        screen.getByRole('link', { name: fill(t.womenOpenSessionFor, { name: titleA }) }),
      ).toHaveAttribute('href', '/workouts?track=women-strength&type=gym&level=beginner')
      const titleLower = lang === 'el' ? lower.title_el : lower.title_en
      expect(
        screen.getByRole('link', { name: fill(t.womenOpenSessionFor, { name: titleLower }) }),
      ).toHaveAttribute('href', '/workouts?track=women-strength&type=gym&level=intermediate')
      expect(screen.getByRole('link', { name: t.womenSeeProgramme })).toHaveAttribute(
        'href',
        '/workouts?track=women-strength',
      )
      expect(screen.getByRole('link', { name: `${t.womenPlanBuilder} →` })).toHaveAttribute(
        'href',
        '/workouts/plans',
      )
    },
  )

  it('hides the template block when no women template resolves', async () => {
    const t = dictionaries.en
    renderPage('en', withTemplates(ok([await womenTemplate('something-else')])))
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument())
    // Let the read settle, then the block must still be absent.
    await new Promise((r) => setTimeout(r, 0))
    expect(screen.queryByRole('heading', { name: t.womenTemplatesHeading })).toBeNull()
    expect(document.querySelectorAll('[data-template]')).toHaveLength(0)
  })

  it('hides the template block when the read fails, and the page still renders', async () => {
    const t = dictionaries.en
    renderPage('en', withTemplates(fail('network')))
    await new Promise((r) => setTimeout(r, 0))
    expect(screen.queryByRole('heading', { name: t.womenTemplatesHeading })).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThanOrEqual(5)
  })
})

describe('loadWomenTemplates', () => {
  it('keeps only the women slugs, in WOMEN_TEMPLATE_SLUGS order', async () => {
    const rows = await Promise.all(
      [...WOMEN_TEMPLATE_SLUGS].reverse().map((slug) => womenTemplate(slug)),
    )
    const result = await loadWomenTemplates(withTemplates(ok([...rows, await womenTemplate('x')])))
    expect(result.ok && result.data.map((r) => r.slug)).toEqual([...WOMEN_TEMPLATE_SLUGS])
  })

  it('passes a failure through', async () => {
    const result = await loadWomenTemplates(withTemplates(fail('network')))
    expect(result.ok).toBe(false)
  })
})
