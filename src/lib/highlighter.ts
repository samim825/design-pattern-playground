import type { HighlighterCore, LanguageInput, ThemedToken } from 'shiki/core'
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import type { CodeLang } from '@/types/pattern'

/** Shiki grammar per code language, each loaded only when first shown. */
const GRAMMARS: Record<CodeLang, { id: string; load: () => LanguageInput }> = {
  ts: { id: 'typescript', load: () => import('shiki/langs/typescript.mjs') },
  java: { id: 'java', load: () => import('shiki/langs/java.mjs') },
  csharp: { id: 'csharp', load: () => import('shiki/langs/csharp.mjs') },
  python: { id: 'python', load: () => import('shiki/langs/python.mjs') },
  go: { id: 'go', load: () => import('shiki/langs/go.mjs') },
  rust: { id: 'rust', load: () => import('shiki/langs/rust.mjs') },
  cpp: { id: 'cpp', load: () => import('shiki/langs/cpp.mjs') },
  php: { id: 'php', load: () => import('shiki/langs/php.mjs') },
  ruby: { id: 'ruby', load: () => import('shiki/langs/ruby.mjs') },
  swift: { id: 'swift', load: () => import('shiki/langs/swift.mjs') },
}

let highlighter: Promise<HighlighterCore> | undefined
const loaded = new Map<CodeLang, Promise<void>>()

/** Shiki core with two themes, loaded once on first use. Grammars are added on demand. */
function getHighlighter(): Promise<HighlighterCore> {
  highlighter ??= createHighlighterCore({
    themes: [import('shiki/themes/github-light.mjs'), import('shiki/themes/github-dark.mjs')],
    langs: [],
    engine: createJavaScriptRegexEngine(),
  }).catch((err: unknown) => {
    highlighter = undefined // allow a retry next time instead of caching the failure
    throw err
  })
  return highlighter
}

function ensureLanguage(h: HighlighterCore, lang: CodeLang): Promise<void> {
  let ready = loaded.get(lang)
  if (!ready) {
    ready = h.loadLanguage(GRAMMARS[lang].load()).catch((err: unknown) => {
      loaded.delete(lang)
      throw err
    })
    loaded.set(lang, ready)
  }
  return ready
}

/** Tokens carry `--shiki-light` / `--shiki-dark` CSS variables (see index.css). */
export async function tokenize(code: string, lang: CodeLang): Promise<ThemedToken[][]> {
  const h = await getHighlighter()
  await ensureLanguage(h, lang)
  return h.codeToTokens(code, {
    lang: GRAMMARS[lang].id,
    themes: { light: 'github-light', dark: 'github-dark' },
    defaultColor: false,
  }).tokens
}
