import { useTranslation } from 'react-i18next'
import { useLang } from '@/i18n'
import type { Lang } from '@/types/pattern'

const OPTIONS: { lang: Lang; label: string }[] = [
  { lang: 'en', label: 'EN' },
  { lang: 'bn', label: 'বাংলা' },
]

export function LanguageToggle() {
  const { t, i18n } = useTranslation()
  const lang = useLang()
  return (
    <div role="group" aria-label={t('language.label')} className="flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
      {OPTIONS.map((o) => (
        <button
          key={o.lang}
          type="button"
          lang={o.lang}
          aria-pressed={lang === o.lang}
          onClick={() => void i18n.changeLanguage(o.lang)}
          className={`rounded-md px-2.5 py-1 text-sm font-medium transition-colors ${
            o.lang === 'bn' ? 'font-bangla' : ''
          } ${
            lang === o.lang
              ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-600 dark:text-white'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
