import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLang } from '@/i18n'
import { formatNumber } from '@/lib/format'
import { getNavEntries } from '@/patterns/registry'
import { LanguageToggle } from '../LanguageToggle'
import { ThemeToggle } from '../ThemeToggle'
import { LogoIcon, MenuIcon } from '../ui/icons'

const entries = getNavEntries()
const built = entries.filter((e) => e.available).length

export function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { t } = useTranslation()
  const lang = useLang()
  return (
    <header className="sticky top-0 z-30">
      <div className="rickshaw-strip h-1.5" aria-hidden="true" />
      <div className="border-b-4 border-chili bg-bottle text-cream">
        <div className="flex h-15 items-center gap-2 px-4 lg:px-6">
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label={t('nav.openMenu')}
            className="-ml-1 grid size-9 place-items-center rounded-lg text-xl hover:bg-cream/10 lg:hidden"
          >
            <MenuIcon />
          </button>
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <LogoIcon className="size-9 shrink-0" />
            <span className="flex min-w-0 flex-col leading-none">
              <span className="truncate font-display text-lg font-extrabold sm:text-xl">
                <span className="hidden sm:inline">{t('app.name')}</span>
                <span className="sm:hidden">{t('app.shortName')}</span>
              </span>
              <span className="mt-0.5 hidden truncate text-xs font-semibold text-mustard sm:block">{t('app.tagline')}</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <div
              className="hidden items-center gap-2 rounded-full border-2 border-[#2b1d16] bg-mustard px-3 py-1 text-xs font-bold text-on-accent md:flex"
              title={t('nav.progress', { built: formatNumber(built, lang), total: formatNumber(entries.length, lang) })}
            >
              <span aria-hidden="true">♟️</span>
              <span className="tabular-nums">
                {formatNumber(built, lang)}/{formatNumber(entries.length, lang)}
              </span>
              <span className="h-1.5 w-16 overflow-hidden rounded-full bg-[#2b1d16]/20">
                <span className="block h-full rounded-full bg-[#2b1d16]" style={{ width: `${(built / entries.length) * 100}%` }} />
              </span>
            </div>
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
