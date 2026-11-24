import { Suspense, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatternContent } from '@/hooks/usePatternContent'
import { useLang } from '@/i18n'
import { prepareCode } from '@/lib/code'
import { formatNumber } from '@/lib/format'
import type { PatternDefinition } from '@/types/pattern'
import { CodePanel } from './CodePanel'
import { ComparePanel } from './ComparePanel'
import { BarCard, Card, Section } from './ui/Section'

/**
 * The fixed 4-section layout every pattern uses:
 * 1. Scenario  2. Interactive visual  3. Code (synced)  4. Without vs With
 */
export function PatternPage({ pattern }: { pattern: PatternDefinition }) {
  const { t } = useTranslation()
  const lang = useLang()
  const content = usePatternContent(pattern)
  const [codeStep, setCodeStep] = useState<string | null>(null)
  const { Visual, code } = pattern

  const prepared = useMemo(
    () => ({
      main: prepareCode(code.main.source, content.codeComments),
      without: prepareCode(code.without.source, content.codeComments),
      with: prepareCode(code.with.source, content.codeComments),
    }),
    [code, content.codeComments],
  )

  const activeLineIndex = codeStep === null ? -1 : prepared.main.lines.findIndex((l) => l.steps.includes(codeStep))

  return (
    <article className="mx-auto flex max-w-7xl flex-col gap-12 px-4 py-8 lg:px-8 lg:py-10">
      {/* Title: maroon hero card */}
      <header className="relative overflow-hidden rounded-xl border-2 border-edge bg-maroon text-cream shadow-hard">
        <SunburstDecor />
        <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-7">
          <span
            aria-hidden="true"
            className="grid size-18 shrink-0 place-items-center rounded-full border-4 border-mustard bg-cream text-4xl shadow-[0_0_0_3px_#2b1d16]"
          >
            {pattern.icon}
          </span>
          <div className="min-w-0">
            <p className="label-caps text-mustard">{t(`category.${pattern.category}`)}</p>
            <h1 className="mt-1 font-display text-4xl leading-tight font-extrabold sm:text-5xl">{content.title}</h1>
            <p className="prose-text mt-2 max-w-3xl text-base text-cream/90 sm:text-lg">{content.tagline}</p>
          </div>
        </div>
        <div className="rickshaw-strip h-2 border-t-2 border-edge" aria-hidden="true" />
      </header>

      {/* 1. Scenario */}
      <Section id="scenario" number={1} title={t('pattern.sections.scenario')}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Card className="p-6">
            <h3 className="mb-3 font-display text-xl font-bold text-ink">{content.scenario.title}</h3>
            <div className="prose-text flex flex-col gap-3 leading-relaxed">
              {content.scenario.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </Card>
          <div className="flex flex-col gap-6">
            <BarCard label={t('pattern.problem')} icon="😣" tone="chili">
              <p className="prose-text text-sm">{content.scenario.problem}</p>
            </BarCard>
            <BarCard label={t('pattern.intent')} icon="🎯" tone="bottle">
              <p className="prose-text text-sm">{content.intent}</p>
            </BarCard>
          </div>
        </div>
      </Section>

      {/* 2 + 3. Visual and synced code, side by side on wide screens */}
      <div className="grid grid-cols-1 gap-12 xl:grid-cols-2 xl:gap-6">
        <Section id="visual" number={2} title={t('pattern.sections.visual')}>
          <Suspense
            fallback={<Card className="grid h-96 place-items-center text-sm text-ink-soft">{t('pattern.loadingVisual')}</Card>}
          >
            <Visual content={content} lang={lang} onCodeStep={setCodeStep} />
          </Suspense>
          {/* On narrow screens the code panel is below — show the running line here too. */}
          {activeLineIndex >= 0 && (
            <div className="mt-4 flex items-center gap-2 overflow-hidden rounded-lg border-2 border-edge bg-code px-3 py-2 shadow-hard-sm xl:hidden">
              <span className="shrink-0 label-caps text-[#f2bf45]">
                {t('pattern.runningLine', { line: formatNumber(activeLineIndex + 1, lang) })}
              </span>
              <code lang="en" className="truncate font-mono text-xs text-[#e6edf3]">
                {prepared.main.lines[activeLineIndex].text.trim()}
              </code>
            </div>
          )}
        </Section>

        <Section id="code" number={3} title={t('pattern.sections.code')}>
          <div className="xl:sticky xl:top-24">
            <CodePanel prepared={prepared.main} filename={code.main.filename} activeStep={codeStep} />
          </div>
        </Section>
      </div>

      {/* 4. Without vs With */}
      <Section id="compare" number={4} title={t('pattern.sections.compare')}>
        <ComparePanel
          compare={content.compare}
          without={{ snippet: code.without, prepared: prepared.without }}
          withPattern={{ snippet: code.with, prepared: prepared.with }}
        />
      </Section>
    </article>
  )
}

/** Faint sun rays in the hero corner, a nod to rickshaw-art backdrops. */
function SunburstDecor() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute -top-10 -right-10 size-64 text-mustard opacity-15"
      viewBox="0 0 200 200"
    >
      <circle cx="100" cy="100" r="34" fill="currentColor" />
      {Array.from({ length: 16 }, (_, i) => (
        <rect
          key={i}
          x="96"
          y="12"
          width="8"
          height="40"
          rx="4"
          fill="currentColor"
          transform={`rotate(${i * 22.5} 100 100)`}
        />
      ))}
    </svg>
  )
}
