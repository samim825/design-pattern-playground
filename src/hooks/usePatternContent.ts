import { useMemo } from 'react'
import { useLang } from '@/i18n'
import { findMissing, mergeWithFallback } from '@/lib/merge'
import type { PatternContent, PatternDefinition } from '@/types/pattern'

const warned = new Set<string>()

/** Pattern content in the current language; anything missing in Bangla falls back to English. */
export function usePatternContent(pattern: PatternDefinition): PatternContent {
  const lang = useLang()
  return useMemo(() => {
    if (lang === 'en') return pattern.content.en
    if (import.meta.env.DEV && !warned.has(pattern.id)) {
      warned.add(pattern.id)
      const missing = findMissing(pattern.content.en, pattern.content.bn)
      if (missing.length > 0) {
        console.warn(`[i18n] ${pattern.id}: missing Bangla content (falls back to English): ${missing.join(', ')}`)
      }
    }
    return mergeWithFallback(pattern.content.en, pattern.content.bn)
  }, [lang, pattern])
}
