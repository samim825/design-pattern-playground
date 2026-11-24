import type { PatternContent, PatternDefinition } from '@/types/pattern'

/**
 * Typed helper for a pattern's index.ts. Keeps the pattern's own content type
 * for its Visual, then erases it so the registry can hold every pattern in one list.
 */
export function definePattern<C extends PatternContent>(def: PatternDefinition<C>): PatternDefinition {
  return def as unknown as PatternDefinition
}
