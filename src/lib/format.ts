import type { Lang } from '@/types/pattern'

const locales: Record<Lang, string> = { en: 'en-US', bn: 'bn-BD' }

/** 1250 → "1,250" (EN) or "১,২৫০" (BN). */
export function formatNumber(n: number, lang: Lang, maxFractionDigits = 2): string {
  return new Intl.NumberFormat(locales[lang], { maximumFractionDigits: maxFractionDigits }).format(n)
}

/** Money: whole amounts as-is, otherwise always two decimals (৳12.50, not ৳12.5). */
export function formatTaka(n: number, lang: Lang): string {
  const decimals = Number.isInteger(n) ? 0 : 2
  const text = new Intl.NumberFormat(locales[lang], {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n)
  return `৳${text}`
}
