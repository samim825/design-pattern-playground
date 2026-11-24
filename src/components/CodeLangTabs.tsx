import { useTranslation } from 'react-i18next'
import { setCodeLang } from '@/hooks/useCodeLang'
import { CODE_LANGS, type CodeLang } from '@/types/pattern'

/** Java | C# | TS | … switch. Every code panel on the page follows the same choice. */
export function CodeLangTabs({
  available,
  current,
  className = '',
}: {
  /** Languages this pattern has code for. */
  available: readonly CodeLang[]
  /** The language actually shown (falls back when the saved one is missing). */
  current: CodeLang
  className?: string
}) {
  const { t } = useTranslation()

  return (
    <div
      role="radiogroup"
      aria-label={t('code.language')}
      className={`inline-flex max-w-full flex-wrap gap-0.5 rounded-lg border-2 border-edge bg-card p-0.5 shadow-hard-sm ${className}`}
    >
      {CODE_LANGS.filter((l) => available.includes(l.id)).map((l) => {
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
            className={`rounded-md px-2.5 py-1 font-mono text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chili ${
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
