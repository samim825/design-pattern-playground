import { useMemo } from 'react'
import { useLang } from '@/i18n'
import { mergeWithFallback } from '@/lib/merge'
import type { PatternContent, PatternDefinition } from '@/types/pattern'

/** Pattern content in the current language; anything missing in Bangla falls back to English. */
export function usePatternContent(pattern: PatternDefinition): PatternContent {
  const lang = useLang()
  return useMemo(
    () => (lang === 'en' ? pattern.content.en : mergeWithFallback(pattern.content.en, pattern.content.bn)),
    [lang, pattern],
  )
}
