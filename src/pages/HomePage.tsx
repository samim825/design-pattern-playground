import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { BarCard, Card } from '@/components/ui/Section'
import { ArrowRightIcon } from '@/components/ui/icons'
import { useLang } from '@/i18n'
import { formatNumber } from '@/lib/format'
import { getNavEntries, patterns } from '@/patterns/registry'
import { CATEGORIES, type Category } from '@/types/pattern'

const entries = getNavEntries()
const comingCount = entries.filter((e) => !e.available).length
const families: Record<Category, { icon: string; bar: string }> = {
  creational: { icon: '🏭', bar: 'bg-mustard' },
  structural: { icon: '🧩', bar: 'bg-jade' },
  behavioral: { icon: '💬', bar: 'bg-chili' },
}
const stepColors = ['bg-chili', 'bg-mustard', 'bg-jade', 'bg-bottle']

export function HomePage() {
  const { t } = useTranslation()
  const lang = useLang()
  const first = patterns[0]

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-14 px-4 py-8 lg:px-8 lg:py-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-xl border-2 border-edge bg-maroon text-cream shadow-hard">
        <div className="relative px-6 py-10 text-center sm:px-10 sm:py-14">
          <p className="label-caps text-mustard">{t('home.eyebrow')}</p>
          <h1 className="mx-auto mt-3 max-w-3xl font-display text-4xl leading-tight font-extrabold text-balance sm:text-5xl">
            {t('home.title')}
          </h1>
          <p className="prose-text mx-auto mt-4 max-w-2xl text-lg text-cream/90">{t('home.subtitle')}</p>
          {first && (
            <Link
              to={`/patterns/${first.id}`}
              className="mt-8 inline-flex items-center gap-2 rounded-xl border-2 border-[#2b1d16] bg-mustard px-5 py-2.5 font-display text-lg font-bold text-on-accent shadow-[4px_4px_0_0_#2b1d16] transition-transform hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              {first.icon} {t('home.cta', { name: first.content.en.title })} <ArrowRightIcon />
            </Link>
          )}
        </div>
        <div className="rickshaw-strip h-2 border-t-2 border-edge" aria-hidden="true" />
      </section>

      {/* What are design patterns */}
      <section>
        <BarCard label={t('home.what.title')} icon="📖" tone="mustard" bodyClassName="p-6">
          <div className="prose-text flex flex-col gap-3">
            {t('home.what.body', { returnObjects: true }).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </BarCard>
        <h2 className="mt-10 mb-4 font-display text-2xl font-bold text-ink">{t('home.families')}</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {CATEGORIES.map((c) => (
            <Card key={c} className="overflow-hidden">
              <div className={`h-2 border-b-2 border-edge ${families[c].bar}`} aria-hidden="true" />
              <div className="p-5">
                <div className="mb-2 text-3xl" aria-hidden="true">
                  {families[c].icon}
                </div>
                <h3 className="font-display text-lg font-bold text-ink">{t(`category.${c}`)}</h3>
                <p className="prose-text mt-1 text-sm text-ink-soft">{t(`categoryInfo.${c}`)}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* How to use */}
      <section>
        <h2 className="mb-4 font-display text-2xl font-bold text-ink">{t('home.how.title')}</h2>
        <ol className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {t('home.how.steps', { returnObjects: true }).map((s, i) => (
            <li key={i}>
              <Card className="h-full p-5">
                <span
                  className={`grid size-9 rotate-[-4deg] place-items-center rounded-lg border-2 border-edge font-display text-lg font-extrabold shadow-hard-sm ${stepColors[i % 4]} ${
                    i === 1 ? 'text-on-accent' : 'text-cream'
                  }`}
                >
                  {formatNumber(i + 1, lang)}
                </span>
                <h3 className="mt-3 font-display text-lg font-bold text-ink">{s.title}</h3>
                <p className="prose-text mt-1 text-sm text-ink-soft">{s.body}</p>
              </Card>
            </li>
          ))}
        </ol>
        <p className="prose-text mt-6 rounded-xl border-2 border-dashed border-edge bg-card/80 px-4 py-3 text-sm">💡 {t('home.tip')}</p>
      </section>

      {/* Available patterns */}
      <section>
        <h2 className="mb-4 font-display text-2xl font-bold text-ink">{t('home.available')}</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {patterns.map((p) => (
            <Link key={p.id} to={`/patterns/${p.id}`} className="group">
              <Card className="h-full p-5 transition-transform group-hover:-translate-y-1">
                <div className="flex items-center gap-3">
                  <span className="grid size-12 place-items-center rounded-full border-2 border-edge bg-paper text-2xl" aria-hidden="true">
                    {p.icon}
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-bold text-ink">{p.content.en.title}</h3>
                    <p className="label-caps text-chili">{t(`category.${p.category}`)}</p>
                  </div>
                  <ArrowRightIcon className="ml-auto text-xl text-ink-soft transition-transform group-hover:translate-x-1" />
                </div>
                <p className="prose-text mt-3 text-sm text-ink-soft">
                  {(lang === 'bn' && p.content.bn.tagline) || p.content.en.tagline}
                </p>
              </Card>
            </Link>
          ))}
        </div>
        {comingCount > 0 && (
          <p className="mt-4 text-sm font-semibold text-ink-soft">
            {t('home.comingCount', { formatted: formatNumber(comingCount, lang) })}
          </p>
        )}
      </section>
    </div>
  )
}
