import type { HighlighterCore, ThemedToken } from 'shiki/core'
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'

let highlighter: Promise<HighlighterCore> | undefined

/** Shiki core with only TypeScript + two themes, loaded once on first use. */
function getHighlighter(): Promise<HighlighterCore> {
  highlighter ??= createHighlighterCore({
    themes: [import('shiki/themes/github-light.mjs'), import('shiki/themes/github-dark.mjs')],
    langs: [import('shiki/langs/typescript.mjs')],
    engine: createJavaScriptRegexEngine(),
  }).catch((err: unknown) => {
    highlighter = undefined // allow a retry next time instead of caching the failure
    throw err
  })
  return highlighter
}

/** Tokens carry `--shiki-light` / `--shiki-dark` CSS variables (see index.css). */
export async function tokenize(code: string): Promise<ThemedToken[][]> {
  const h = await getHighlighter()
  return h.codeToTokens(code, {
    lang: 'typescript',
    themes: { light: 'github-light', dark: 'github-dark' },
    defaultColor: false,
  }).tokens
}
