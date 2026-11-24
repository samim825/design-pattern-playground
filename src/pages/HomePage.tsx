import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Card } from '@/components/ui/Section'
import { ArrowRightIcon } from '@/components/ui/icons'
import { useLang } from '@/i18n'
import { formatNumber } from '@/lib/format'
import { getNavEntries, patterns } from '@/patterns/registry'
import { CATEGORIES } from '@/types/pattern'

const entries = getNavEntries()
const comingCount = entries.filter((e) => !e.available).length
const familyIcons = { creational: '🏭', structural: '🧩', behavioral: '💬' } as const

export function HomePage() {
  const { t } = useTranslation()
  const lang = useLang()
  const first = patterns[0]

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-14 px-4 py-10 lg:px-8 lg:py-14">
      {/* Hero */}
      <section className="text-center">
        <p className="mb-3 text-sm font-semibold tracking-wide text-indigo-600 dark:text-indigo-400">{t('home.eyebrow')}</p>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-balance text-slate-900 sm:text-5xl dark:text-white">
          {t('home.title')}
        </h1>
        <p className="prose-text mx-auto mt-5 max-w-2xl text-lg text-slate-600 dark:text-slate-400">{t('home.subtitle')}</p>
        {first && (
          <Link
            to={`/patterns/${first.id}`}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-lg shadow-indigo-600/20 transition-colors hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            {first.icon} {t('home.cta', { name: first.content.en.title })} <ArrowRightIcon />
          </Link>
        )}
      </section>

      {/* What are design patterns */}
      <section>
        <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">{t('home.what.title')}</h2>
        <div className="prose-text flex flex-col gap-3 text-slate-700 dark:text-slate-300">
          {t('home.what.body', { returnObjects: true }).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <h3 className="mt-8 mb-3 font-semibold text-slate-900 dark:text-white">{t('home.families')}</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {CATEGORIES.map((c) => (
            <Card key={c} className="p-5">
              <div className="mb-2 text-2xl" aria-hidden="true">
                {familyIcons[c]}
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white">{t(`category.${c}`)}</h4>
              <p className="prose-text mt-1 text-sm text-slate-600 dark:text-slate-400">{t(`categoryInfo.${c}`)}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How to use */}
      <section>
        <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">{t('home.how.title')}</h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t('home.how.steps', { returnObjects: true }).map((s, i) => (
            <li key={i}>
              <Card className="h-full p-5">
                <span className="grid size-8 place-items-center rounded-full bg-indigo-600 text-sm font-bold text-white dark:bg-indigo-500">
                  {formatNumber(i + 1, lang)}
                </span>
                <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">{s.title}</h3>
                <p className="prose-text mt-1 text-sm text-slate-600 dark:text-slate-400">{s.body}</p>
              </Card>
            </li>
          ))}
        </ol>
        <p className="prose-text mt-4 rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-900 dark:bg-indigo-500/10 dark:text-indigo-200">
          {t('home.tip')}
        </p>
      </section>

      {/* Available patterns */}
      <section>
        <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">{t('home.available')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {patterns.map((p) => (
            <Link key={p.id} to={`/patterns/${p.id}`} className="group">
              <Card className="h-full p-5 transition-colors group-hover:border-indigo-400 dark:group-hover:border-indigo-500">
                <div className="flex items-center gap-3">
                  <span className="text-3xl" aria-hidden="true">
                    {p.icon}
                  </span>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{p.content.en.title}</h3>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400">{t(`category.${p.category}`)}</p>
                  </div>
                  <ArrowRightIcon className="ml-auto text-slate-400 transition-transform group-hover:translate-x-1" />
                </div>
                <p className="prose-text mt-3 text-sm text-slate-600 dark:text-slate-400">
                  {(lang === 'bn' && p.content.bn.tagline) || p.content.en.tagline}
                </p>
              </Card>
            </Link>
          ))}
        </div>
        {comingCount > 0 && (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            {t('home.comingCount', { formatted: formatNumber(comingCount, lang) })}
          </p>
        )}
      </section>
    </div>
  )
}
