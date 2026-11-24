import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router'
import { useLang } from '@/i18n'
import { formatNumber } from '@/lib/format'
import { getNavEntries } from '@/patterns/registry'
import { CATEGORIES, type Category } from '@/types/pattern'

const entries = getNavEntries()

const categoryStyle: Record<Category, { icon: string; bar: string }> = {
  creational: { icon: '🏭', bar: 'bg-mustard' },
  structural: { icon: '🧩', bar: 'bg-jade' },
  behavioral: { icon: '💬', bar: 'bg-chili' },
}

/** Pattern list grouped by category. Rendered inside the desktop aside and the mobile drawer. */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation()
  const lang = useLang()

  return (
    <nav aria-label={t('nav.patterns')} className="flex flex-col gap-4 p-4 pb-10">
      <NavLink
        to="/"
        end
        onClick={onNavigate}
        className={({ isActive }) =>
          `flex items-center gap-2 rounded-xl border-2 border-edge px-3 py-2 text-sm font-bold shadow-hard-sm transition-colors ${
            isActive ? 'bg-bottle text-cream' : 'bg-card text-ink hover:bg-paper'
          }`
        }
      >
        <span aria-hidden="true">🏠</span> {t('nav.home')}
      </NavLink>

      {CATEGORIES.map((category) => {
        const items = entries.filter((e) => e.category === category)
        const ready = items.filter((e) => e.available).length
        return (
          <div key={category} className="overflow-hidden rounded-xl border-2 border-edge bg-card shadow-hard">
            <div className={`h-1.5 ${categoryStyle[category].bar}`} aria-hidden="true" />
            <div className="flex items-center gap-2 px-3 pt-2.5 pb-1.5">
              <span aria-hidden="true">{categoryStyle[category].icon}</span>
              <h3 className="font-display text-base leading-tight font-bold text-ink">{t(`category.${category}`)}</h3>
              <span className="ml-auto font-mono text-xs font-bold text-chili tabular-nums">
                {formatNumber(ready, lang)}/{formatNumber(items.length, lang)}
              </span>
            </div>
            <ul className="flex flex-col gap-0.5 px-2 pb-2">
              {items.map((e) => (
                <li key={e.id}>
                  <NavLink
                    to={`/patterns/${e.id}`}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-lg border-2 px-2 py-1 text-sm transition-colors ${
                        isActive
                          ? 'border-chili bg-chili/10 font-bold text-ink'
                          : e.available
                            ? 'border-transparent font-semibold text-ink hover:bg-ink/5'
                            : 'border-transparent text-ink-soft/80 hover:text-ink-soft'
                      }`
                    }
                  >
                    <span aria-hidden="true" className={`w-5 text-center ${e.available ? '' : 'opacity-40 grayscale'}`}>
                      {e.icon}
                    </span>
                    <span className="truncate">{e.name}</span>
                    {!e.available && (
                      <span className="ml-auto shrink-0 rounded border border-ink-soft/40 px-1.5 text-[10px] font-semibold text-ink-soft">
                        {t('nav.soon')}
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}
