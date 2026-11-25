import type { Category, PatternDefinition } from '@/types/pattern'
import { abstractFactory } from './abstract-factory'
import { adapter } from './adapter'
import { bridge } from './bridge'
import { builder } from './builder'
import { catalog } from './catalog'
import { chainOfResponsibility } from './chain-of-responsibility'
import { composite } from './composite'
import { decorator } from './decorator'
import { facade } from './facade'
import { factoryMethod } from './factory-method'
import { prototype } from './prototype'
import { singleton } from './singleton'
import { strategy } from './strategy'

/**
 * Every BUILT pattern, in sidebar order. To add one: create src/patterns/<id>/,
 * then import it above and add it to this list.
 */
export const patterns: PatternDefinition[] = [
  factoryMethod,
  abstractFactory,
  builder,
  prototype,
  singleton,
  adapter,
  bridge,
  composite,
  decorator,
  facade,
  chainOfResponsibility,
  strategy,
]

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
