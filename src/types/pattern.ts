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

/**
 * Programming languages the example code is shown in, in tab order (the first is the
 * default and must be required). `required` languages must exist for every pattern;
 * the others are expected too (see CLAUDE.md) but a pattern without them still works,
 * its tab is simply hidden. To add a language: add it here, add its Shiki grammar in
 * lib/highlighter.ts, then write code/<id>.ts for every pattern.
 */
export const CODE_LANGS = [
  { id: 'java', label: 'Java', short: 'Java', required: true },
  { id: 'csharp', label: 'C#', short: 'C#', required: true },
  { id: 'ts', label: 'TypeScript', short: 'TS', required: true },
  { id: 'python', label: 'Python', short: 'Python', required: false },
  { id: 'go', label: 'Go', short: 'Go', required: false },
  { id: 'rust', label: 'Rust', short: 'Rust', required: false },
  { id: 'cpp', label: 'C++', short: 'C++', required: false },
  { id: 'php', label: 'PHP', short: 'PHP', required: false },
  { id: 'ruby', label: 'Ruby', short: 'Ruby', required: false },
  { id: 'swift', label: 'Swift', short: 'Swift', required: false },
] as const
export type CodeLang = (typeof CODE_LANGS)[number]['id']
export type RequiredCodeLang = Extract<(typeof CODE_LANGS)[number], { required: true }>['id']

export interface CodeSnippet {
  /** Label shown above the code, e.g. "checkout.ts" or "Checkout.java". */
  filename: string
  /**
   * Source code in the CodeSet's language. Conventions:
   * - `// {{key}}` → replaced with `codeComments[key]` in the current UI language.
   * - `// @step:a,b` at the end of a line → that line lights up while visual step
   *   `a` or `b` is running. The marker is stripped before display.
   */
  source: string
}

/** The three snippets of one pattern in one programming language. */
export interface CodeSet {
  /** Section 3 — the code that is highlighted in sync with the Visual. */
  main: CodeSnippet
  /** Section 4 — the messy version. */
  without: CodeSnippet
  /** Section 4 — the clean pattern version. */
  with: CodeSnippet
}

/** One CodeSet per programming language; every language uses the same @step ids. */
export type PatternCode = Record<RequiredCodeLang, CodeSet> & Partial<Record<CodeLang, CodeSet>>

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
