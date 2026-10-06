// THEME PROVIDER (operator request 2026-10-06): owns the chosen cosmetic theme, writes it to
// `<html data-theme>` (src/index.css re-maps the colour variables from that attribute), keeps
// `<meta name="theme-color">` on the theme's page surface, and persists the choice under
// `THEME_STORAGE_KEY`. The pre-paint script in index.html applies the same attribute from the same
// key before the first paint, so there is no flash; this provider then takes over on mount.
// Storage access is wrapped like src/i18n/LangProvider.tsx: a blocked localStorage is a missing
// preference, never an error.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { THEME_COLOR, THEME_STORAGE_KEY, initialTheme, type Theme } from './themes'

export { THEME_STORAGE_KEY }

function readStored(): unknown {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY)
  } catch {
    return null
  }
}

function writeStored(theme: Theme): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Not persisting is acceptable; the theme still applies for this page view.
  }
}

/** The OS preference, read once at start. jsdom has no `matchMedia`; that counts as "no preference". */
function prefersDark(): boolean {
  try {
    return (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    )
  } catch {
    return false
  }
}

/** Apply a theme to the document: the attribute the CSS keys on, and the browser-UI colour. */
export function applyTheme(theme: Theme, doc: Document = document): void {
  doc.documentElement.dataset.theme = theme
  doc.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
}

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children, initial }: { children: ReactNode; initial?: Theme }) {
  const [theme, setThemeState] = useState<Theme>(
    () => initial ?? initialTheme(readStored(), prefersDark()),
  )

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    writeStored(next)
  }, [])

  const value = useMemo<ThemeContextValue>(() => ({ theme, setTheme }), [theme, setTheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/** The current theme and its setter. Must be used under ThemeProvider. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>')
  return ctx
}
