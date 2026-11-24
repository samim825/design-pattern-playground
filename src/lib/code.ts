export interface PreparedLine {
  text: string
  /** Visual step ids that light up this line. */
  steps: string[]
}

export interface PreparedCode {
  code: string
  lines: PreparedLine[]
}

const STEP_MARKER = /\s*\/\/\s*@step:([\w,-]+)\s*$/
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
