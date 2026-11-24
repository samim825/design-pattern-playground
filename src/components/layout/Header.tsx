import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { LanguageToggle } from '../LanguageToggle'
import { ThemeToggle } from '../ThemeToggle'
import { LogoIcon, MenuIcon } from '../ui/icons'

export function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { t } = useTranslation()
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
      <div className="flex h-14 items-center gap-2 px-4 lg:px-6">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label={t('nav.openMenu')}
          className="-ml-1 grid size-9 place-items-center rounded-lg text-xl text-slate-600 hover:bg-slate-200/70 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <MenuIcon />
        </button>
        <Link to="/" className="flex min-w-0 items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <LogoIcon className="size-7 shrink-0" />
          <span className="hidden truncate sm:inline">{t('app.name')}</span>
          <span className="truncate sm:hidden">{t('app.shortName')}</span>
        </Link>
        <div className="ml-auto flex items-center gap-1.5">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
