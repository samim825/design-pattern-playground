import { Suspense, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatternContent } from '@/hooks/usePatternContent'
import { useLang } from '@/i18n'
import { prepareCode } from '@/lib/code'
import { formatNumber } from '@/lib/format'
import type { PatternDefinition } from '@/types/pattern'
import { CodePanel } from './CodePanel'
import { ComparePanel } from './ComparePanel'
import { Card, Section } from './ui/Section'

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
      {/* Title */}
      <header>
        <p className="mb-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">{t(`category.${pattern.category}`)}</p>
        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          <span aria-hidden="true">{pattern.icon}</span>
          {content.title}
        </h1>
        <p className="prose-text mt-3 max-w-3xl text-lg text-slate-600 dark:text-slate-400">{content.tagline}</p>
      </header>

      {/* 1. Scenario */}
      <Section id="scenario" number={1} title={t('pattern.sections.scenario')}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Card className="p-6">
            <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">{content.scenario.title}</h3>
            <div className="prose-text flex flex-col gap-3 leading-relaxed">
              {content.scenario.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </Card>
          <div className="flex flex-col gap-4">
            <Card className="border-rose-200 bg-rose-50/60 p-5 dark:border-rose-500/30 dark:bg-rose-500/10">
              <h3 className="mb-2 font-semibold text-rose-800 dark:text-rose-300">😣 {t('pattern.problem')}</h3>
              <p className="prose-text text-sm">{content.scenario.problem}</p>
            </Card>
            <Card className="border-indigo-200 bg-indigo-50/60 p-5 dark:border-indigo-500/30 dark:bg-indigo-500/10">
              <h3 className="mb-2 font-semibold text-indigo-800 dark:text-indigo-300">🎯 {t('pattern.intent')}</h3>
              <p className="prose-text text-sm">{content.intent}</p>
            </Card>
          </div>
        </div>
      </Section>

      {/* 2 + 3. Visual and synced code, side by side on wide screens */}
      <div className="grid grid-cols-1 gap-10 xl:grid-cols-2 xl:gap-6">
        <Section id="visual" number={2} title={t('pattern.sections.visual')}>
          <Suspense
            fallback={
              <Card className="grid h-96 place-items-center text-sm text-slate-500">{t('pattern.loadingVisual')}</Card>
            }
          >
            <Visual content={content} lang={lang} onCodeStep={setCodeStep} />
          </Suspense>
          {/* On narrow screens the code panel is below — show the running line here too. */}
          {activeLineIndex >= 0 && (
            <div className="mt-3 flex items-center gap-2 overflow-hidden rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 xl:hidden dark:border-amber-400/30 dark:bg-amber-400/10">
              <span className="shrink-0 text-xs font-medium text-amber-700 dark:text-amber-300">
                {t('pattern.runningLine', { line: formatNumber(activeLineIndex + 1, lang) })}
              </span>
              <code lang="en" className="truncate font-mono text-xs">
                {prepared.main.lines[activeLineIndex].text.trim()}
              </code>
            </div>
          )}
        </Section>

        <Section id="code" number={3} title={t('pattern.sections.code')}>
          <div className="xl:sticky xl:top-20">
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
