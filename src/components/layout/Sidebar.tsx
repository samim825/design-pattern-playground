import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router'
import { useLang } from '@/i18n'
import { formatNumber } from '@/lib/format'
import { getNavEntries } from '@/patterns/registry'
import { CATEGORIES } from '@/types/pattern'

const entries = getNavEntries()
const builtCount = entries.filter((e) => e.available).length

const linkBase = 'flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors'
const linkClass = ({ isActive }: { isActive: boolean }) =>
  `${linkBase} ${
    isActive
      ? 'bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70'
  }`

/** Pattern list grouped by category. Rendered inside the desktop aside and the mobile drawer. */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation()
  const lang = useLang()

  return (
    <nav aria-label={t('nav.patterns')} className="flex flex-col gap-5 p-3 pb-8">
      <div>
        <NavLink to="/" end onClick={onNavigate} className={linkClass}>
          <span aria-hidden="true">🏠</span> {t('nav.home')}
        </NavLink>
        <p className="mt-3 px-3 text-xs text-slate-500 dark:text-slate-400">
          {t('nav.progress', { built: formatNumber(builtCount, lang), total: formatNumber(entries.length, lang) })}
        </p>
        <div className="mx-3 mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-indigo-500"
            style={{ width: `${(builtCount / Math.max(entries.length, 1)) * 100}%` }}
          />
        </div>
      </div>

      {CATEGORIES.map((category) => (
        <div key={category}>
          <h3 className="mb-1 px-3 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
            {t(`category.${category}`)}
          </h3>
          <ul className="flex flex-col gap-0.5">
            {entries
              .filter((e) => e.category === category)
              .map((e) => (
                <li key={e.id}>
                  {e.available ? (
                    <NavLink to={`/patterns/${e.id}`} onClick={onNavigate} className={linkClass}>
                      <span aria-hidden="true" className="w-5 text-center">
                        {e.icon}
                      </span>
                      {e.name}
                    </NavLink>
                  ) : (
                    <NavLink
                      to={`/patterns/${e.id}`}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        `${linkBase} ${
                          isActive ? 'bg-slate-100 dark:bg-slate-800/70' : ''
                        } text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400`
                      }
                    >
                      <span aria-hidden="true" className="w-5 text-center opacity-50 grayscale">
                        {e.icon}
                      </span>
                      <span className="truncate">{e.name}</span>
                      <span className="ml-auto shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        {t('nav.soon')}
                      </span>
                    </NavLink>
                  )}
                </li>
              ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}
