import type { Category, PatternDefinition } from '@/types/pattern'
import { catalog } from './catalog'

/**
 * Every BUILT pattern. To add one: create src/patterns/<id>/ and add ONE line here.
 */
export const patterns: PatternDefinition[] = []

export function getPattern(id: string | undefined): PatternDefinition | undefined {
  return patterns.find((p) => p.id === id)
}

export interface NavEntry {
  id: string
  name: string
  icon: string
  category: Category
  available: boolean
}

/** Catalog + registry merged: built patterns are links, the rest are "Coming soon". */
export function getNavEntries(): NavEntry[] {
  const entries: NavEntry[] = catalog.map((c) => {
    const built = getPattern(c.id)
    return built
      ? { id: c.id, name: built.content.en.title, icon: built.icon, category: built.category, available: true }
      : { ...c, available: false }
  })
  for (const p of patterns) {
    if (!catalog.some((c) => c.id === p.id)) {
      entries.push({ id: p.id, name: p.content.en.title, icon: p.icon, category: p.category, available: true })
    }
  }
  return entries
}
