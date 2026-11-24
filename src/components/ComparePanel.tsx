import { useTranslation } from 'react-i18next'
import type { PreparedCode } from '@/lib/code'
import type { CodeSnippet, PatternContent } from '@/types/pattern'
import { CodePanel } from './CodePanel'
import { Card } from './ui/Section'
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
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 xl:grid-cols-2">
        {columns.map((col) => (
          <div key={col.key} className="flex min-w-0 flex-col gap-3">
            <div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  col.tone === 'bad'
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                }`}
              >
                {col.tone === 'bad' ? <CrossIcon /> : <CheckIcon />} {col.label}
              </span>
              <h3 className="mt-2 font-semibold text-slate-900 dark:text-white">{col.data.title}</h3>
            </div>
            <CodePanel prepared={col.code.prepared} filename={col.code.snippet.filename} tone={col.tone} maxHeight="26rem" />
            <ul className="prose-text flex flex-col gap-1.5 text-sm">
              {col.data.points.map((p, i) => (
                <li key={i} className="flex gap-2">
                  <span
                    className={`mt-1 shrink-0 ${col.tone === 'bad' ? 'text-rose-500' : 'text-emerald-500'}`}
                    aria-hidden="true"
                  >
                    {col.tone === 'bad' ? <CrossIcon /> : <CheckIcon />}
                  </span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-emerald-200 bg-emerald-50/60 p-5 dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <h3 className="mb-2 font-semibold text-emerald-800 dark:text-emerald-300">💡 {t('pattern.benefit')}</h3>
          <p className="prose-text text-sm">{compare.benefit}</p>
        </Card>
        <Card className="p-5">
          <h3 className="mb-2 font-semibold text-slate-900 dark:text-white">🧭 {t('pattern.whenToUse')}</h3>
          <ul className="prose-text flex list-disc flex-col gap-1 pl-5 text-sm marker:text-indigo-400">
            {compare.whenToUse.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
