import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LangProvider } from './i18n/LangProvider'
import { el, en } from './i18n/dictionary'
import { AppRoutes, basenameFrom } from './routes/routes'

function renderAt(path: string, initial: 'el' | 'en' = 'el') {
  return render(
    <LangProvider initial={initial}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </LangProvider>,
  )
}

describe('App', () => {
  beforeEach(() => window.localStorage.clear())

  it('renders the home page in Greek by default with all six modules', () => {
    renderAt('/')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(el.heroTitle)
    const cards = screen.getAllByRole('listitem')
    expect(cards).toHaveLength(6)
    expect(screen.getByText(el.modules.workouts.title)).toBeInTheDocument()
    expect(screen.getByText(el.notMedicalAdvice)).toBeInTheDocument()
  })

  it('switches the whole page to English and back from the header button', () => {
    renderAt('/')
    fireEvent.click(screen.getByRole('button', { name: 'English' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(en.heroTitle)
    expect(screen.getByText(en.modules.recipes.title)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ελληνικά' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(el.heroTitle)
  })

  it('says plainly that no module has content yet', () => {
    renderAt('/', 'en')
    expect(screen.getByText(en.statusBody)).toBeInTheDocument()
    expect(screen.getAllByText(en.roadmap)).toHaveLength(6)
  })

  it('renders a not-found page for an unknown path, in the current language', () => {
    renderAt('/nothing-here', 'en')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(en.notFoundTitle)
    expect(screen.getByRole('link', { name: en.backHome })).toHaveAttribute('href', '/')
  })
})

describe('basenameFrom', () => {
  it('maps Vite BASE_URL to a router basename', () => {
    expect(basenameFrom('/hygieia/')).toBe('/hygieia')
    expect(basenameFrom('/')).toBe('/')
    expect(basenameFrom('')).toBe('/')
  })
})
