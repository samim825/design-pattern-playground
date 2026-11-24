import { useTranslation } from 'react-i18next'
import { setCodeLang, useCodeLang } from '@/hooks/useCodeLang'
import { CODE_LANGS } from '@/types/pattern'

/** TS | Java | C# switch. Every code panel on the page follows the same choice. */
export function CodeLangTabs({ className = '' }: { className?: string }) {
  const { t } = useTranslation()
  const current = useCodeLang()

  return (
    <div
      role="radiogroup"
      aria-label={t('code.language')}
      className={`inline-flex rounded-lg border-2 border-edge bg-card p-0.5 shadow-hard-sm ${className}`}
    >
      {CODE_LANGS.map((l) => {
        const selected = l.id === current
        return (
          <button
            key={l.id}
            type="button"
            role="radio"
            aria-checked={selected}
            title={l.label}
            data-code-lang={l.id}
            onClick={() => setCodeLang(l.id)}
            lang="en"
            className={`rounded-md px-3 py-1 font-mono text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chili ${
              selected ? 'bg-bottle text-cream' : 'text-ink-soft hover:bg-paper-deep hover:text-ink'
            }`}
          >
            {l.short}
          </button>
        )
      })}
    </div>
  )
}
