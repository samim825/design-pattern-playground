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
const toneBar: Record<Tone, string> = {
  neutral: 'bg-mustard text-on-accent',
  bad: 'bg-chili text-cream',
  good: 'bg-bottle text-cream',
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
    <div className="overflow-hidden rounded-xl border-2 border-edge bg-code shadow-hard">
      <div className={`flex items-center gap-2 border-b-2 border-edge px-3 py-1.5 ${toneBar[tone]}`}>
        <span aria-hidden="true" className="flex gap-1">
          <span className="size-2 rounded-full bg-current opacity-80" />
          <span className="size-2 rounded-full bg-current opacity-50" />
          <span className="size-2 rounded-full bg-current opacity-30" />
        </span>
        <span lang="en" className="truncate font-mono text-xs font-bold">
          {filename}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label={t('code.copy')}
          title={copied ? t('code.copied') : t('code.copy')}
          className="ml-auto grid size-7 shrink-0 place-items-center rounded-md hover:bg-black/10"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      </div>
      <div ref={scrollRef} className="relative overflow-auto" style={{ maxHeight }}>
        <pre className="min-w-max py-3 font-mono text-[13px] leading-6 text-[#e6edf3]">
          <code>
            {prepared.lines.map((line, i) => {
              const active = isActive(i)
              return (
                <div
                  key={i}
                  data-active={active}
                  className={`flex border-l-4 pr-4 transition-colors duration-300 ${
                    active ? 'border-[#f2bf45] bg-[#f2bf45]/15' : 'border-transparent'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`w-10 shrink-0 pr-3 text-right tabular-nums select-none ${
                      active ? 'font-bold text-[#f2bf45]' : 'text-[#5d6f68]'
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
