import type { Lang } from '@/types/pattern'

const locales: Record<Lang, string> = { en: 'en-US', bn: 'bn-BD' }

/** 1250 → "1,250" (EN) or "১,২৫০" (BN). */
export function formatNumber(n: number, lang: Lang, maxFractionDigits = 2): string {
  return new Intl.NumberFormat(locales[lang], { maximumFractionDigits: maxFractionDigits }).format(n)
}

export function formatTaka(n: number, lang: Lang): string {
  return `৳${formatNumber(n, lang)}`
}
