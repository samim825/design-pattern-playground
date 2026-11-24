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
    <div
      role="group"
      aria-label={t('language.label')}
      className="flex rounded-lg border-2 border-[#2b1d16] bg-[#fdf3dc] p-0.5 shadow-[2px_2px_0_0_#2b1d16]"
    >
      {OPTIONS.map((o) => (
        <button
          key={o.lang}
          type="button"
          lang={o.lang}
          aria-pressed={lang === o.lang}
          onClick={() => void i18n.changeLanguage(o.lang)}
          className={`rounded-md px-2.5 py-0.5 text-sm font-bold transition-colors ${
            lang === o.lang ? 'bg-[#e0393e] text-[#fdf3dc]' : 'text-[#6d5747] hover:text-[#2b1d16]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
