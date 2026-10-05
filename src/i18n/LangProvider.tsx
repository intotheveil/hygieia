import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { LANGS, dictionaries, type Dictionary, type Lang } from './dictionary'

export const LANG_STORAGE_KEY = 'hygieia.lang'

/** Narrow an unknown value to a supported language, or null. */
export function toLang(value: unknown): Lang | null {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value)
    ? (value as Lang)
    : null
}

/**
 * Pick the starting language. Pure: takes the stored value and the browser locale as arguments,
 * so it can be tested without touching globals. Order: a stored choice wins; otherwise a Greek
 * browser gets Greek; otherwise English. Never throws on junk input.
 */
export function initialLang(stored: unknown, navigatorLanguage: string | undefined): Lang {
  const fromStorage = toLang(stored)
  if (fromStorage) return fromStorage
  return navigatorLanguage?.toLowerCase().startsWith('el') ? 'el' : 'en'
}

function readStored(): unknown {
  // localStorage can throw (private mode, blocked storage): a missing preference is not an error.
  try {
    return window.localStorage.getItem(LANG_STORAGE_KEY)
  } catch {
    return null
  }
}

function writeStored(lang: Lang): void {
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang)
  } catch {
    // Not persisting is acceptable; the choice still applies for this page view.
  }
}

interface LangContextValue {
  lang: Lang
  t: Dictionary
  setLang: (lang: Lang) => void
  toggle: () => void
}

const LangContext = createContext<LangContextValue | null>(null)

export function LangProvider({ children, initial }: { children: ReactNode; initial?: Lang }) {
  const [lang, setLangState] = useState<Lang>(
    () => initial ?? initialLang(readStored(), navigator.language),
  )

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    writeStored(next)
  }, [])
  const toggle = useCallback(() => setLang(lang === 'el' ? 'en' : 'el'), [lang, setLang])

  const value = useMemo<LangContextValue>(
    () => ({ lang, t: dictionaries[lang], setLang, toggle }),
    [lang, setLang, toggle],
  )
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

/** The current language, its dictionary and the switchers. Must be used under LangProvider. */
export function useLang(): LangContextValue {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used within <LangProvider>')
  return ctx
}
