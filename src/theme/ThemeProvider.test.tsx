import { act, render, renderHook, screen } from '@testing-library/react'
import { THEME_STORAGE_KEY, ThemeProvider, applyTheme, useTheme } from './ThemeProvider'
import { THEME_COLOR, type Theme } from './themes'

/** Stub `matchMedia` so `(prefers-color-scheme: dark)` answers `dark`; jsdom ships none. */
function stubPrefersDark(dark: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: dark && query.includes('prefers-color-scheme: dark'),
    media: query,
  }))
}

function Probe() {
  const { theme } = useTheme()
  return <span data-testid="theme">{theme}</span>
}

describe('ThemeProvider', () => {
  let meta: HTMLMetaElement

  beforeEach(() => {
    window.localStorage.clear()
    delete document.documentElement.dataset.theme
    meta = document.createElement('meta')
    meta.name = 'theme-color'
    meta.content = '#000000'
    document.head.append(meta)
  })
  afterEach(() => {
    meta.remove()
    vi.unstubAllGlobals()
  })

  it('starts on the default theme when nothing is stored and no OS preference exists (jsdom)', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('theme')).toHaveTextContent('default')
    expect(document.documentElement.dataset.theme).toBe('default')
    expect(meta.content).toBe(THEME_COLOR.default)
    // Nothing is written until the user chooses: the OS preference must keep working on a later visit.
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
  })

  it.each(['dark', 'athletic', 'gamer'] as const)(
    'applies a stored %s to <html data-theme> and <meta theme-color>',
    (theme) => {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme)
      render(
        <ThemeProvider>
          <Probe />
        </ThemeProvider>,
      )
      expect(screen.getByTestId('theme')).toHaveTextContent(theme)
      expect(document.documentElement.dataset.theme).toBe(theme)
      expect(meta.content).toBe(THEME_COLOR[theme])
    },
  )

  it('switching persists, re-maps the attribute and the meta, and survives a remount from storage', () => {
    const { result, unmount } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    })
    expect(result.current.theme).toBe('default')
    act(() => result.current.setTheme('gamer'))
    expect(result.current.theme).toBe('gamer')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('gamer')
    expect(document.documentElement.dataset.theme).toBe('gamer')
    expect(meta.content).toBe(THEME_COLOR.gamer)

    act(() => result.current.setTheme('athletic'))
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('athletic')
    expect(document.documentElement.dataset.theme).toBe('athletic')
    expect(meta.content).toBe(THEME_COLOR.athletic)

    unmount()
    const again = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    })
    expect(again.result.current.theme).toBe('athletic')
  })

  it('falls back to the default when storage holds junk', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light')
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('theme')).toHaveTextContent('default')
    expect(document.documentElement.dataset.theme).toBe('default')
    expect(meta.content).toBe(THEME_COLOR.default)
  })

  it('honours prefers-color-scheme: dark ONLY when nothing is stored', () => {
    stubPrefersDark(true)
    const unstored = render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(meta.content).toBe(THEME_COLOR.dark)
    unstored.unmount()

    // An explicit "Kitchen" on a dark-mode OS stays Kitchen.
    window.localStorage.setItem(THEME_STORAGE_KEY, 'default')
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('theme')).toHaveTextContent('default')
    expect(document.documentElement.dataset.theme).toBe('default')
  })

  it('a light OS preference with nothing stored is the default, not dark', () => {
    stubPrefersDark(false)
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('theme')).toHaveTextContent('default')
  })

  it('honours an explicit `initial` over storage (the test-render path)', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    render(
      <ThemeProvider initial="athletic">
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('theme')).toHaveTextContent('athletic')
    expect(document.documentElement.dataset.theme).toBe('athletic')
  })

  it('a throwing localStorage is a missing preference, not an error', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    try {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      })
      expect(result.current.theme).toBe('default')
      act(() => result.current.setTheme('dark'))
      expect(result.current.theme).toBe('dark')
      expect(document.documentElement.dataset.theme).toBe('dark')
    } finally {
      getItem.mockRestore()
      setItem.mockRestore()
    }
  })

  it('applyTheme tolerates a document without a theme-color meta', () => {
    meta.remove()
    expect(() => applyTheme('gamer' satisfies Theme)).not.toThrow()
    expect(document.documentElement.dataset.theme).toBe('gamer')
  })

  it('refuses to be used outside the provider', () => {
    expect(() => renderHook(() => useTheme())).toThrow(/within <ThemeProvider>/)
  })
})
