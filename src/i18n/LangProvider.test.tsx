import { act, render, renderHook, screen } from '@testing-library/react'
import { LANG_STORAGE_KEY, LangProvider, initialLang, toLang, useLang } from './LangProvider'

describe('initialLang (pure)', () => {
  it('prefers a stored choice over the browser locale', () => {
    expect(initialLang('en', 'el-GR')).toBe('en')
    expect(initialLang('el', 'en-US')).toBe('el')
  })
  it('falls back to the browser locale: Greek browsers get Greek, everyone else English', () => {
    expect(initialLang(null, 'el-GR')).toBe('el')
    expect(initialLang(null, 'el')).toBe('el')
    expect(initialLang(null, 'en-GB')).toBe('en')
    expect(initialLang(null, 'de-DE')).toBe('en')
    expect(initialLang(null, undefined)).toBe('en')
  })
  it('ignores junk in storage', () => {
    expect(initialLang('fr', 'el-GR')).toBe('el')
    expect(initialLang(42, 'en-US')).toBe('en')
    expect(toLang('')).toBeNull()
    expect(toLang('EL')).toBeNull()
  })
})

describe('LangProvider', () => {
  beforeEach(() => window.localStorage.clear())

  it('exposes the dictionary of the current language and persists a toggle', () => {
    const { result } = renderHook(() => useLang(), {
      wrapper: ({ children }) => <LangProvider initial="el">{children}</LangProvider>,
    })
    expect(result.current.lang).toBe('el')
    expect(result.current.t.langName).toBe('Ελληνικά')
    act(() => result.current.toggle())
    expect(result.current.lang).toBe('en')
    expect(result.current.t.langName).toBe('English')
    expect(window.localStorage.getItem(LANG_STORAGE_KEY)).toBe('en')
    expect(document.documentElement.lang).toBe('en')
  })

  it('starts from the stored language when no initial is given', () => {
    window.localStorage.setItem(LANG_STORAGE_KEY, 'en')
    function Probe() {
      const { lang } = useLang()
      return <span data-testid="lang">{lang}</span>
    }
    render(
      <LangProvider>
        <Probe />
      </LangProvider>,
    )
    expect(screen.getByTestId('lang')).toHaveTextContent('en')
  })

  it('refuses to be used outside the provider', () => {
    expect(() => renderHook(() => useLang())).toThrow(/within <LangProvider>/)
  })
})
