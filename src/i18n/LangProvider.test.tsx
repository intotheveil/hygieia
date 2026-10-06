import type { ReactNode } from 'react'
import { act, render, renderHook, screen } from '@testing-library/react'
import { LANG_STORAGE_KEY, LangProvider, initialLang, toLang, useLang } from './LangProvider'
import { appDictionaries } from './app'
import { skincareCopy, skincareEl, skincareEn } from './features/skincare.ts'

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

describe('useLang(<feature>Copy) — route features (perf, 2026-10-06)', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <LangProvider initial="el">{children}</LangProvider>
  )

  it('gives the app dictionary plus the feature literal of the current language', () => {
    const { result } = renderHook(() => useLang(skincareCopy), { wrapper })
    expect(result.current.t.skincareTitle).toBe(skincareEl.skincareTitle)
    expect(result.current.t.langName).toBe(appDictionaries.el.langName)
    act(() => result.current.toggle())
    expect(result.current.t.skincareTitle).toBe(skincareEn.skincareTitle)
    expect(result.current.t.langName).toBe(appDictionaries.en.langName)
  })

  it('keeps the merged dictionary stable per language across renders (safe in memo deps)', () => {
    const { result, rerender } = renderHook(() => useLang(skincareCopy), { wrapper })
    const first = result.current.t
    rerender()
    expect(result.current.t).toBe(first)
    act(() => result.current.toggle())
    const english = result.current.t
    expect(english).not.toBe(first)
    act(() => result.current.toggle())
    expect(result.current.t).toBe(first)
  })

  it('leaves the plain useLang() dictionary without the route feature', () => {
    const { result } = renderHook(() => useLang(), { wrapper })
    expect(result.current.t).toBe(appDictionaries.el)
    expect(Object.hasOwn(result.current.t, 'skincareTitle')).toBe(false)
  })

  it('refuses to be used outside the provider with a feature too', () => {
    expect(() => renderHook(() => useLang(skincareCopy))).toThrow(/within <LangProvider>/)
  })
})
