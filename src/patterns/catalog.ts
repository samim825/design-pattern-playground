import type { Category } from '@/types/pattern'

export interface CatalogEntry {
  id: string
  /** Pattern names stay in English in every language. */
  name: string
  category: Category
  icon: string
}

/**
 * The 23 classic Gang-of-Four patterns. Anything here that is NOT in
 * registry.ts shows in the sidebar as "Coming soon".
 */
export const catalog: CatalogEntry[] = [
  { id: 'factory-method', name: 'Factory Method', category: 'creational', icon: '🏭' },
  { id: 'abstract-factory', name: 'Abstract Factory', category: 'creational', icon: '🏗️' },
  { id: 'builder', name: 'Builder', category: 'creational', icon: '🧱' },
  { id: 'prototype', name: 'Prototype', category: 'creational', icon: '🧬' },
  { id: 'singleton', name: 'Singleton', category: 'creational', icon: '☝️' },

  { id: 'adapter', name: 'Adapter', category: 'structural', icon: '🔌' },
  { id: 'bridge', name: 'Bridge', category: 'structural', icon: '🌉' },
  { id: 'composite', name: 'Composite', category: 'structural', icon: '🌳' },
  { id: 'decorator', name: 'Decorator', category: 'structural', icon: '🎁' },
  { id: 'facade', name: 'Facade', category: 'structural', icon: '🏛️' },
  { id: 'flyweight', name: 'Flyweight', category: 'structural', icon: '🪶' },
  { id: 'proxy', name: 'Proxy', category: 'structural', icon: '🛡️' },

  { id: 'chain-of-responsibility', name: 'Chain of Responsibility', category: 'behavioral', icon: '⛓️' },
  { id: 'command', name: 'Command', category: 'behavioral', icon: '🎮' },
  { id: 'interpreter', name: 'Interpreter', category: 'behavioral', icon: '🗣️' },
  { id: 'iterator', name: 'Iterator', category: 'behavioral', icon: '🔁' },
  { id: 'mediator', name: 'Mediator', category: 'behavioral', icon: '🤝' },
  { id: 'memento', name: 'Memento', category: 'behavioral', icon: '💾' },
  { id: 'observer', name: 'Observer', category: 'behavioral', icon: '👀' },
  { id: 'state', name: 'State', category: 'behavioral', icon: '🚦' },
  { id: 'strategy', name: 'Strategy', category: 'behavioral', icon: '♟️' },
  { id: 'template-method', name: 'Template Method', category: 'behavioral', icon: '📋' },
  { id: 'visitor', name: 'Visitor', category: 'behavioral', icon: '🧳' },
]
