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
      <h1 className="mt-4 text-2xl font-bold text-ink font-display">{t('comingSoon.title', { name })}</h1>
      <p className="prose-text mt-2 text-ink-soft">{t('comingSoon.body')}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {patterns.map((p) => (
          <Link
            key={p.id}
            to={`/patterns/${p.id}`}
            className="rounded-lg border-2 border-edge bg-card px-3 py-1.5 text-sm font-bold shadow-hard-sm hover:bg-mustard hover:text-on-accent"
          >
            {p.icon} {p.content.en.title}
          </Link>
        ))}
      </div>
      <Link to="/" className="mt-8 inline-block font-medium text-chili hover:underline">
        ← {t('comingSoon.back')}
      </Link>
    </div>
  )
}
