import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { PatternPage } from '@/components/PatternPage'
import { catalog } from '@/patterns/catalog'
import { getPattern, patterns } from '@/patterns/registry'
import { NotFoundPage } from './NotFoundPage'

export function PatternRoute() {
  const { id } = useParams()
  const pattern = getPattern(id)
  if (pattern) return <PatternPage key={pattern.id} pattern={pattern} />

  const planned = catalog.find((c) => c.id === id)
  if (planned) return <ComingSoon name={planned.name} icon={planned.icon} />

  return <NotFoundPage />
}

function ComingSoon({ name, icon }: { name: string; icon: string }) {
  const { t } = useTranslation()
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <p className="text-6xl grayscale" aria-hidden="true">
        {icon}
      </p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">{t('comingSoon.title', { name })}</h1>
      <p className="prose-text mt-2 text-slate-600 dark:text-slate-400">{t('comingSoon.body')}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {patterns.map((p) => (
          <Link
            key={p.id}
            to={`/patterns/${p.id}`}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium hover:border-indigo-400 dark:border-slate-700 dark:bg-slate-900"
          >
            {p.icon} {p.content.en.title}
          </Link>
        ))}
      </div>
      <Link to="/" className="mt-8 inline-block font-medium text-indigo-600 hover:underline dark:text-indigo-400">
        ← {t('comingSoon.back')}
      </Link>
    </div>
  )
}
