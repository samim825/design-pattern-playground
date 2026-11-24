import { useCallback, useState } from 'react'

export type Theme = 'light' | 'dark'
const STORAGE_KEY = 'dpp-theme'

/** The pre-paint script in index.html already set the class; read it back. */
const current = (): Theme => (document.documentElement.classList.contains('dark') ? 'dark' : 'light')

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(current)

  const setTheme = useCallback((next: Theme) => {
    document.documentElement.classList.toggle('dark', next === 'dark')
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore storage errors
    }
    setThemeState(next)
  }, [])

  const toggle = useCallback(() => setTheme(current() === 'dark' ? 'light' : 'dark'), [setTheme])

  return { theme, setTheme, toggle }
}
