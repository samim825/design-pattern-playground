import { useTranslation } from 'react-i18next'
import { SPEEDS, type StepPlayer } from '@/hooks/useStepPlayer'
import { useLang } from '@/i18n'
import { formatNumber } from '@/lib/format'
import { Button } from './Button'
import { PauseIcon, PlayIcon, ResetIcon, StepIcon } from './icons'

/** Play / Pause / Step / Reset / Speed bar shared by every Visual. */
export function StepControls({
  player,
  playLabel,
  disabled = false,
}: {
  player: StepPlayer
  /** Optional label for the main button, e.g. "Pay ৳1,250". */
  playLabel?: string
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const lang = useLang()
  const { playing, done, index, total } = player

  return (
    <div className="flex flex-wrap items-center gap-2">
      {playing ? (
        <Button variant="primary" onClick={player.pause}>
          <PauseIcon /> {t('player.pause')}
        </Button>
      ) : (
        <Button variant="primary" onClick={player.play} disabled={disabled}>
          <PlayIcon /> {done ? t('player.replay') : (playLabel ?? t('player.play'))}
        </Button>
      )}
      <Button onClick={player.next} disabled={disabled || done} aria-label={t('player.step')}>
        <StepIcon /> <span className="hidden sm:inline">{t('player.step')}</span>
      </Button>
      <Button variant="ghost" onClick={player.reset} disabled={index < 0} aria-label={t('player.reset')}>
        <ResetIcon /> <span className="hidden sm:inline">{t('player.reset')}</span>
      </Button>

      <div className="ml-auto flex items-center gap-2">
        <div role="group" aria-label={t('player.speed')} className="flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={player.speed === s}
              onClick={() => player.setSpeed(s)}
              className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                player.speed === s
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-600 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {formatNumber(s, lang)}×
            </button>
          ))}
        </div>
        <span className="hidden text-xs tabular-nums text-slate-500 sm:inline dark:text-slate-400">
          {formatNumber(Math.max(index + 1, 0), lang)}/{formatNumber(total, lang)}
        </span>
      </div>
    </div>
  )
}
