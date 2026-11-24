import type { ComponentType, LazyExoticComponent } from 'react'

export type Lang = 'en' | 'bn'
export const LANGS: readonly Lang[] = ['en', 'bn']

export type Category = 'creational' | 'structural' | 'behavioral'
export const CATEGORIES: readonly Category[] = ['creational', 'structural', 'behavioral']

/** Recursively optional — used for translations, which fall back to English. */
export type DeepPartial<T> = T extends readonly (infer U)[]
  ? readonly U[] | U[]
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T

/**
 * Everything a learner reads on a pattern page. Each pattern writes one
 * `content.en.ts` (complete) and one `content.bn.ts` (DeepPartial, falls back to EN).
 */
export interface PatternContent {
  /** Pattern name, e.g. "Strategy" — keep the English name in every language. */
  title: string
  /** One-line hook shown under the title. */
  tagline: string
  /** The pattern's intent in one or two sentences. */
  intent: string
  /** Section 1 — the relatable real-world story. */
  scenario: {
    title: string
    paragraphs: string[]
    /** The pain point the pattern solves (shown as a callout). */
    problem: string
  }
  /** Section 2 — free-form labels used by the pattern's Visual.tsx. */
  visual: Record<string, string>
  /** Captions for each step of the visualization, keyed by step id. */
  steps: Record<string, string>
  /** Translated code comments; code.ts refers to them as `// {{key}}`. */
  codeComments: Record<string, string>
  /** Section 4 — Without vs With. */
  compare: {
    without: { title: string; points: string[] }
    with: { title: string; points: string[] }
    benefit: string
    whenToUse: string[]
  }
}

export interface CodeSnippet {
  /** Label shown above the code, e.g. "checkout.ts". */
  filename: string
  /**
   * TypeScript source. Conventions:
   * - `// {{key}}` → replaced with `codeComments[key]` in the current language.
   * - `// @step:a,b` at the end of a line → that line lights up while visual step
   *   `a` or `b` is running. The marker is stripped before display.
   */
  source: string
}

export interface PatternCode {
  /** Section 3 — the code that is highlighted in sync with the Visual. */
  main: CodeSnippet
  /** Section 4 — the messy version. */
  without: CodeSnippet
  /** Section 4 — the clean pattern version. */
  with: CodeSnippet
}

export interface VisualProps<C extends PatternContent = PatternContent> {
  content: C
  lang: Lang
  /** Report which code step is "running" (null = nothing). Drives the code highlight. */
  onCodeStep: (codeStep: string | null) => void
}

export interface PatternDefinition<C extends PatternContent = PatternContent> {
  /** URL slug — must equal the folder name, e.g. "strategy". */
  id: string
  category: Category
  /** An emoji shown in the sidebar and page header. */
  icon: string
  content: { en: C; bn: DeepPartial<C> }
  code: PatternCode
  Visual: LazyExoticComponent<ComponentType<VisualProps<C>>>
}
