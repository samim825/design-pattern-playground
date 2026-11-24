import { useTranslation } from 'react-i18next'
import { useTheme } from '@/hooks/useTheme'
import { MoonIcon, SunIcon } from './ui/icons'

export function ThemeToggle() {
  const { t } = useTranslation()
  const { theme, toggle } = useTheme()
  const label = theme === 'dark' ? t('theme.toLight') : t('theme.toDark')
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="grid size-9 place-items-center rounded-lg text-lg text-slate-600 transition-colors hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}
