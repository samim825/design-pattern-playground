import { useSyncExternalStore } from 'react'
import { CODE_LANGS, type CodeLang } from '@/types/pattern'

export const CODE_LANG_STORAGE_KEY = 'dpp-code-lang'

function readSaved(): CodeLang {
  try {
    const saved = localStorage.getItem(CODE_LANG_STORAGE_KEY)
    return CODE_LANGS.find((l) => l.id === saved)?.id ?? CODE_LANGS[0].id
  } catch {
    return CODE_LANGS[0].id
  }
}

let current: CodeLang = readSaved()
const listeners = new Set<() => void>()

export function setCodeLang(lang: CodeLang) {
  current = lang
  try {
    localStorage.setItem(CODE_LANG_STORAGE_KEY, lang)
  } catch {
    // storage unavailable (private mode) — the choice still works for this session
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** The programming language the example code is shown in, shared by every code panel. */
export function useCodeLang(): CodeLang {
  return useSyncExternalStore(subscribe, () => current)
}
