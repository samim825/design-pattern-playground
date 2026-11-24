import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ThemedToken } from 'shiki/core'
import type { PreparedCode } from '@/lib/code'
import { CheckIcon, CopyIcon } from './ui/icons'

function useTokens(code: string): ThemedToken[][] | null {
  const [result, setResult] = useState<{ code: string; tokens: ThemedToken[][] } | null>(null)
  useEffect(() => {
    let alive = true
    // Shiki is loaded on demand so it stays out of the main bundle.
    import('@/lib/highlighter')
      .then((m) => m.tokenize(code))
      .then(
      (tokens) => alive && setResult({ code, tokens }),
      (err: unknown) => console.error('[CodePanel] highlighting failed', err),
    )
    return () => {
      alive = false
    }
  }, [code])
  return result?.code === code ? result.tokens : null
}

type Tone = 'neutral' | 'bad' | 'good'
const toneDot: Record<Tone, string> = {
  neutral: 'bg-indigo-400',
  bad: 'bg-rose-500',
  good: 'bg-emerald-500',
}

/**
 * Syntax-highlighted code with line numbers. Lines tagged with the active step
 * light up and are scrolled into view inside the panel.
 */
export function CodePanel({
  prepared,
  filename,
  activeStep = null,
  tone = 'neutral',
  maxHeight = '32rem',
}: {
  prepared: PreparedCode
  filename: string
  activeStep?: string | null
  tone?: Tone
  maxHeight?: string
}) {
  const { t } = useTranslation()
  const tokens = useTokens(prepared.code)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  const isActive = (i: number) => activeStep !== null && prepared.lines[i].steps.includes(activeStep)

  // Keep the running line visible — scroll the panel only, never the page.
  useEffect(() => {
    const container = scrollRef.current
    if (!container || activeStep === null) return
    const first = container.querySelector<HTMLElement>('[data-active="true"]')
    if (!first) return
    const top = first.offsetTop
    const bottom = top + first.offsetHeight
    if (top < container.scrollTop + 24 || bottom > container.scrollTop + container.clientHeight - 24) {
      container.scrollTo({ top: Math.max(top - container.clientHeight / 3, 0), behavior: 'smooth' })
    }
  }, [activeStep])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prepared.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable — ignore
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0d1117]">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-800 dark:bg-slate-900">
        <span className={`size-2.5 rounded-full ${toneDot[tone]}`} aria-hidden="true" />
        <span lang="en" className="font-mono text-xs text-slate-600 dark:text-slate-400">
          {filename}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label={t('code.copy')}
          title={copied ? t('code.copied') : t('code.copy')}
          className="ml-auto grid size-7 place-items-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          {copied ? <CheckIcon className="text-emerald-500" /> : <CopyIcon />}
        </button>
      </div>
      <div ref={scrollRef} className="relative overflow-auto" style={{ maxHeight }}>
        <pre className="min-w-max py-3 font-mono text-[13px] leading-6">
          <code>
            {prepared.lines.map((line, i) => {
              const active = isActive(i)
              return (
                <div
                  key={i}
                  data-active={active}
                  className={`flex border-l-[3px] pr-4 transition-colors duration-300 ${
                    active
                      ? 'border-amber-400 bg-amber-100/80 dark:border-amber-400 dark:bg-amber-400/15'
                      : 'border-transparent'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`w-10 shrink-0 pr-3 text-right tabular-nums select-none ${
                      active ? 'text-amber-600 dark:text-amber-300' : 'text-slate-400 dark:text-slate-600'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="whitespace-pre">
                    {tokens?.[i]
                      ? tokens[i].map((tok, j) => (
                          <span key={j} className="shiki-token" style={tok.htmlStyle as React.CSSProperties}>
                            {tok.content}
                          </span>
                        ))
                      : line.text || ' '}
                    {tokens?.[i]?.length === 0 && ' '}
                  </span>
                </div>
              )
            })}
          </code>
        </pre>
      </div>
    </div>
  )
}
