import type { CodeLang, PatternCode } from '@/types/pattern'

export interface PreparedLine {
  text: string
  /** Visual step ids that light up this line. */
  steps: string[]
}

export interface PreparedCode {
  code: string
  lines: PreparedLine[]
}

/** `// @step:a,b` (or `# @step:a,b` for languages with # comments) at the end of a line. */
const STEP_MARKER = /\s*(?:\/\/|#)\s*@step:([\w,-]+)\s*$/
const PLACEHOLDER = /\{\{(\w+)\}\}/g

/**
 * Turn a pattern's raw snippet into display code:
 * strips `// @step:x` markers (remembering which line they were on) and fills
 * `{{key}}` comment placeholders with text in the current language.
 */
export function prepareCode(source: string, comments: Record<string, string>): PreparedCode {
  const rawLines = source.replace(/^\n+|\s+$/g, '').split('\n')
  const lines = rawLines.map<PreparedLine>((raw) => {
    let steps: string[] = []
    const marker = raw.match(STEP_MARKER)
    let text = raw
    if (marker) {
      steps = marker[1].split(',').filter(Boolean)
      text = raw.slice(0, marker.index)
    }
    text = text.replace(PLACEHOLDER, (_, key: string) => {
      const value = comments[key]
      if (value === undefined && import.meta.env.DEV) console.warn(`[code] missing code comment "${key}"`)
      return value ?? key
    })
    return { text: text.trimEnd(), steps }
  })
  return { code: lines.map((l) => l.text).join('\n'), lines }
}

/** Every step id used by `// @step:` markers in a snippet. */
export function stepIds(source: string): Set<string> {
  const ids = new Set<string>()
  for (const raw of source.split('\n')) {
    const marker = raw.match(STEP_MARKER)
    marker?.[1].split(',').filter(Boolean).forEach((id) => ids.add(id))
  }
  return ids
}

/** Warn (dev only) when a language's main snippet doesn't use the same step ids as TypeScript. */
export function checkStepParity(patternId: string, code: PatternCode) {
  const reference = stepIds(code.ts.main.source)
  for (const lang of Object.keys(code) as CodeLang[]) {
    const set = code[lang]
    if (!set) continue
    const ids = stepIds(set.main.source)
    const missing = [...reference].filter((id) => !ids.has(id))
    const extra = [...ids].filter((id) => !reference.has(id))
    if (missing.length || extra.length) {
      console.warn(
        `[code] ${patternId}/${lang}: @step markers differ from TypeScript` +
          (missing.length ? ` (missing: ${missing.join(', ')})` : '') +
          (extra.length ? ` (extra: ${extra.join(', ')})` : ''),
      )
    }
  }
}
