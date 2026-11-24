import { useTranslation } from 'react-i18next'
import type { PreparedCode } from '@/lib/code'
import type { CodeSnippet, PatternContent } from '@/types/pattern'
import { CodePanel } from './CodePanel'
import { BarCard } from './ui/Section'
import { CheckIcon, CrossIcon } from './ui/icons'

/** Section 4: messy version vs pattern version, side by side (stacked on small screens). */
export function ComparePanel({
  compare,
  without,
  withPattern,
}: {
  compare: PatternContent['compare']
  without: { snippet: CodeSnippet; prepared: PreparedCode }
  withPattern: { snippet: CodeSnippet; prepared: PreparedCode }
}) {
  const { t } = useTranslation()

  const columns = [
    { key: 'without', label: t('pattern.without'), data: compare.without, code: without, tone: 'bad' as const },
    { key: 'with', label: t('pattern.with'), data: compare.with, code: withPattern, tone: 'good' as const },
  ]

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2 xl:gap-6">
        {columns.map((col) => (
          <div key={col.key} className="flex min-w-0 flex-col gap-3">
            <div>
              <span
                className={`inline-flex items-center gap-1 rounded-md border-2 border-edge px-2 py-0.5 label-caps shadow-hard-sm ${
                  col.tone === 'bad' ? 'bg-chili text-cream' : 'bg-bottle text-cream'
                }`}
              >
                {col.tone === 'bad' ? <CrossIcon /> : <CheckIcon />} {col.label}
              </span>
              <h3 className="mt-2 font-display text-lg font-bold text-ink">{col.data.title}</h3>
            </div>
            <CodePanel prepared={col.code.prepared} filename={col.code.snippet.filename} tone={col.tone} maxHeight="26rem" />
            <ul className="prose-text flex flex-col gap-1.5 text-sm">
              {col.data.points.map((p, i) => (
                <li key={i} className="flex gap-2">
                  <span className={`mt-1 shrink-0 ${col.tone === 'bad' ? 'text-chili' : 'text-jade'}`} aria-hidden="true">
                    {col.tone === 'bad' ? <CrossIcon /> : <CheckIcon />}
                  </span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <BarCard label={t('pattern.benefit')} icon="💡" tone="bottle">
          <p className="prose-text text-sm">{compare.benefit}</p>
        </BarCard>
        <BarCard label={t('pattern.whenToUse')} icon="🧭" tone="mustard">
          <ul className="prose-text flex list-disc flex-col gap-1 pl-5 text-sm marker:text-chili">
            {compare.whenToUse.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </BarCard>
      </div>
    </div>
  )
}
