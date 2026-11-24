import type { DeepPartial } from '@/types/pattern'

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * Deep-merge a partial translation over the complete English base.
 * Missing keys (or empty strings) fall back to English; arrays are replaced whole.
 */
export function mergeWithFallback<T>(base: T, override: DeepPartial<T> | undefined): T {
  if (override === undefined || override === null) return base
  if (Array.isArray(base)) return (Array.isArray(override) && override.length > 0 ? override : base) as T
  if (isPlainObject(base) && isPlainObject(override)) {
    const out: Record<string, unknown> = { ...base }
    for (const key of Object.keys(override)) {
      out[key] = mergeWithFallback((base as Record<string, unknown>)[key], override[key] as never)
    }
    return out as T
  }
  if (typeof override === 'string' && override.trim() === '') return base
  return override as T
}

/**
 * Paths present in `base` (English) but missing/empty in `override` (Bangla).
 * Used in dev to warn about incomplete translations.
 */
export function findMissing(base: unknown, override: unknown, path = ''): string[] {
  if (override === undefined || override === null) return [path || '(root)']
  if (typeof override === 'string') return override.trim() === '' ? [path] : []
  if (Array.isArray(base)) return Array.isArray(override) && override.length > 0 ? [] : [path]
  if (isPlainObject(base) && isPlainObject(override)) {
    return Object.keys(base).flatMap((key) => findMissing(base[key], override[key], path ? `${path}.${key}` : key))
  }
  return []
}
