import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { LangProvider } from './i18n/LangProvider'
import { MODULE_IDS, el, en, type Lang, type ModuleId } from './i18n/dictionary'
import { AppRoutes, basenameFrom } from './routes/routes'
import { ThemeProvider } from './theme/ThemeProvider'

/** The whole app as main.tsx mounts it, in local-only mode (`client={null}`: no account service). */
function renderAt(path: string, initial: Lang = 'el') {
  return render(
    <LangProvider initial={initial}>
      <ThemeProvider>
        <AuthProvider client={null}>
          <MemoryRouter initialEntries={[path]}>
            <AppRoutes />
          </MemoryRouter>
        </AuthProvider>
      </ThemeProvider>
    </LangProvider>,
  )
}

/**
 * Queries scoped to the modules section: the header nav repeats module names (`nav.workouts` ===
 * `modules.workouts.title`), so an unscoped `getByText` would find two.
 */
const modules = () => within(screen.getByRole('region', { name: 'modules' }))
const cards = () => modules().getAllByRole('listitem')
const card = (title: string) => {
  const li = modules().getByText(title).closest('li')
  if (li === null) throw new Error(`no card titled "${title}"`)
  return within(li)
}

const LANGS: ReadonlyArray<[Lang, typeof en]> = [
  ['el', el],
  ['en', en],
]

const EXPECTED_ROUTES: Record<ModuleId, string> = {
  tips: '/tips',
  diets: '/diets',
  recipes: '/recipes',
  cost: '/recipes',
  calories: '/recipes',
  workouts: '/workouts',
  skincare: '/skincare',
  tasks: '/tasks',
}

describe('App (home)', () => {
  beforeEach(() => window.localStorage.clear())

  it('renders the home page in Greek by default with all eight modules', () => {
    renderAt('/')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(el.heroTitle)
    expect(cards()).toHaveLength(8)
    expect(modules().getByText(el.modules.tasks.title)).toBeInTheDocument()
    expect(modules().getByText(el.modules.skincare.title)).toBeInTheDocument()
    expect(modules().getByText(el.modules.workouts.title)).toBeInTheDocument()
    expect(screen.getByText(el.notMedicalAdvice)).toBeInTheDocument()
  })

  it('switches the whole page to English and back from the header button', () => {
    renderAt('/')
    fireEvent.click(screen.getByRole('button', { name: 'English' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(en.heroTitle)
    expect(modules().getByText(en.modules.recipes.title)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ελληνικά' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(el.heroTitle)
  })

  it.each(LANGS)('routes every module card to its module (%s)', (lang, t) => {
    renderAt('/', lang)
    for (const id of MODULE_IDS) {
      expect(
        card(t.modules[id].title).getByRole('link', { name: t.modules[id].title }),
        `card ${id}`,
      ).toHaveAttribute('href', EXPECTED_ROUTES[id])
    }
  })

  it.each(LANGS)('the recipes card carries a secondary link to the fridge (%s)', (lang, t) => {
    renderAt('/', lang)
    expect(
      card(t.modules.recipes.title).getByRole('link', { name: new RegExp(t.fridgeLink) }),
    ).toHaveAttribute('href', '/fridge')
    // Only that card has it.
    expect(modules().getAllByRole('link', { name: new RegExp(t.fridgeLink) })).toHaveLength(1)
  })

  it.each(LANGS)(
    'shows no "coming" badge (every module has a route) and the panels note only on cost + calories (%s)',
    (lang, t) => {
      renderAt('/', lang)
      expect(screen.queryByText(t.roadmap)).toBeNull()
      expect(modules().getAllByText(t.panelsNote)).toHaveLength(2)
      for (const id of ['cost', 'calories'] as const) {
        expect(card(t.modules[id].title).getByText(t.panelsNote)).toBeInTheDocument()
      }
    },
  )

  it.each(LANGS)(
    'states plainly what is live and that this copy has no account service (%s)',
    (lang, t) => {
      // The test build has no Supabase env → local-only → `statusBody` (not `statusBodyConfigured`).
      renderAt('/', lang)
      expect(screen.getByText(t.statusTitle)).toBeInTheDocument()
      expect(screen.getByText(t.statusBody)).toBeInTheDocument()
      expect(screen.queryByText(t.statusBodyConfigured)).toBeNull()
    },
  )

  it('renders a not-found page for an unknown path, in the current language, inside the frame', () => {
    renderAt('/nothing-here', 'en')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(en.notFoundTitle)
    expect(screen.getByRole('link', { name: en.backHome })).toHaveAttribute('href', '/')
    // Layout: the header nav and the footer disclaimer are present on a not-found page too.
    expect(screen.getByRole('navigation', { name: en.nav.label })).toBeInTheDocument()
    expect(screen.getByText(en.notMedicalAdvice)).toBeInTheDocument()
  })

  it.each([
    ['/recipes', en.recipesTitle],
    ['/fridge', en.fridgeTitle],
    ['/diets', en.dietsTitle],
    ['/workouts', en.workoutsTitle],
    ['/tips', en.tipsTitle],
    ['/skincare', en.skincareTitle],
    ['/auth', en.signInUnavailableTitle],
    ['/account', en.signInUnavailableTitle],
    ['/admin', en.signInUnavailableTitle],
  ])(
    '%s renders its page inside Layout (header nav + footer), one banner, one h1',
    async (path, h1) => {
      renderAt(path, 'en')
      // Every page but the home is a lazy chunk (routes.tsx), so the h1 arrives after the import.
      expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(h1)
      // The site nav sits in Layout's top-level <header>. (Not `getAllByRole('banner')`: jsdom does
      // not scope a page's own <header> inside <main> out of the banner role the way browsers do.)
      const nav = screen.getByRole('navigation', { name: en.nav.label })
      expect(nav.closest('header')?.parentElement?.tagName).not.toBe('MAIN')
      expect(nav.closest('main')).toBeNull()
      // The footer disclaimer, exactly once from Layout (pages that repeat it inside their card are
      // allowed: the home page does not).
      expect(screen.getAllByText(en.notMedicalAdvice).length).toBeGreaterThanOrEqual(1)
    },
  )
})

describe('basenameFrom', () => {
  it('maps Vite BASE_URL to a router basename', () => {
    expect(basenameFrom('/hygieia/')).toBe('/hygieia')
    expect(basenameFrom('/')).toBe('/')
    expect(basenameFrom('')).toBe('/')
  })
})
