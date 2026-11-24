/**
 * Shared building blocks for "learn by playing" pattern games: level tabs with
 * stars, a ৳ counter, shakeable choice buttons, the mission banner and the
 * level-complete card. Labels come from each pattern's content (no UI text here).
 */
import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { formatNumber, formatTaka } from '@/lib/format'
import { fill } from '@/lib/template'
import type { Lang } from '@/types/pattern'
import { type GameProgress, type Level, LEVELS, starText } from './state'

/* ------------------------------------------------------------------ */
/* HUD: level tabs + ৳ counter                                         */
/* ------------------------------------------------------------------ */

export function GameHud({
  level,
  progress,
  pendingCoins,
  gainKey,
  onPickLevel,
  titles,
  labels,
  lang,
}: {
  level: Level
  progress: GameProgress
  /** Earned in the delivery/payment on screen, not yet saved. */
  pendingCoins: number
  /** Changes for every new gain so the "+৳" pop replays. */
  gainKey: string
  onPickLevel: (level: Level) => void
  titles: Record<Level, string>
  labels: { levelsLabel: string; levelLabel: string; locked: string; earned: string }
  lang: Lang
}) {
  return (
    <div className="flex flex-wrap items-stretch gap-2">
      <div role="tablist" aria-label={labels.levelsLabel} className="grid min-w-0 flex-1 grid-cols-3 gap-2">
        {LEVELS.map((n) => {
          const locked = n > progress.unlocked
          const selected = n === level
          const stars = progress.stars[n] ?? 0
          return (
            <button
              key={n}
              type="button"
              role="tab"
              aria-selected={selected}
              disabled={locked}
              onClick={() => onPickLevel(n)}
              title={titles[n]}
              className={`flex flex-col items-center rounded-lg border-2 border-edge px-1 py-1.5 text-xs font-bold transition-[transform,box-shadow] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chili ${
                selected
                  ? 'bg-bottle text-cream shadow-hard-sm'
                  : locked
                    ? 'cursor-not-allowed bg-paper-deep text-ink-soft/60'
                    : 'bg-card text-ink hover:-translate-y-0.5 hover:shadow-hard-sm'
              }`}
            >
              <span>{fill(labels.levelLabel, { n: formatNumber(n, lang) })}</span>
              <span aria-label={locked ? labels.locked : `${stars}/3`} className="tracking-widest">
                {locked ? '🔒' : starText(stars)}
              </span>
            </button>
          )
        })}
      </div>
      <div className="relative flex items-center gap-1 rounded-lg border-2 border-edge bg-mustard px-2.5 text-sm font-bold text-on-accent tabular-nums shadow-hard-sm">
        <span aria-hidden="true">💰</span>
        <span className="sr-only">{labels.earned}</span>
        {formatTaka(progress.coins + pendingCoins, lang)}
        <AnimatePresence>
          {pendingCoins > 0 && (
            <motion.span
              key={gainKey}
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 0, y: -28 }}
              transition={{ duration: 1.4 }}
              className="pointer-events-none absolute -top-1 right-1 text-xs font-extrabold text-bottle dark:text-jade"
              aria-hidden="true"
            >
              +{formatTaka(pendingCoins, lang)}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Mission banner, choice button, level-complete card                  */
/* ------------------------------------------------------------------ */

export function MissionBanner({ icon, levelText, title, goal }: { icon: string; levelText: string; title: string; goal: string }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span
        aria-hidden="true"
        className="grid size-10 shrink-0 place-items-center rounded-lg border-2 border-edge bg-maroon text-xl shadow-hard-sm"
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="label-caps text-chili">{levelText}</p>
        <h3 className="font-display text-lg leading-tight font-bold text-ink">{title}</h3>
        <p className="prose-text mt-0.5 text-sm text-ink-soft">{goal}</p>
      </div>
    </div>
  )
}

/** A radio (or checkbox) choice tile (icon + label) that can shake when the choice is wrong. */
export function ChoiceButton({
  selected,
  color,
  icon,
  text,
  onClick,
  animate,
  mono = false,
  role = 'radio',
  className = '',
}: {
  selected: boolean
  color: string
  icon?: string
  text: string
  onClick: () => void
  animate: { x: number | number[] }
  mono?: boolean
  /** 'checkbox' for multi-select tiles. */
  role?: 'radio' | 'checkbox'
  className?: string
}) {
  return (
    <motion.button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onClick}
      animate={animate}
      transition={{ duration: 0.4 }}
      lang={mono ? 'en' : undefined}
      className={`flex min-w-0 flex-col items-center gap-0.5 rounded-lg border-2 border-edge px-1 py-2 text-xs font-bold transition-[box-shadow,background-color] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chili ${
        selected ? 'text-white shadow-hard-sm' : 'bg-card text-ink hover:shadow-hard-sm'
      } ${mono ? 'font-mono' : ''} ${className}`}
      style={selected ? { backgroundColor: color } : undefined}
    >
      {icon && (
        <span className="text-lg" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="max-w-full truncate">{text}</span>
    </motion.button>
  )
}

export function LevelCompleteCard({
  title,
  stars,
  children,
  primary,
  secondary,
}: {
  title: string
  stars: number
  children?: ReactNode
  primary: { label: string; onClick: () => void }
  secondary: { label: string; onClick: () => void }
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-3 rounded-xl border-2 border-edge bg-card p-4 text-center shadow-hard-sm"
    >
      <motion.p
        className="text-4xl"
        aria-hidden="true"
        initial={{ rotate: -20, scale: 0.4 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 12 }}
      >
        🎉
      </motion.p>
      <h3 className="font-display text-2xl font-bold text-ink">{title}</h3>
      <p className="text-3xl tracking-widest text-maroon dark:text-mustard" aria-label={`${stars}/3`}>
        {starText(stars)}
      </p>
      {children}
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="primary" onClick={primary.onClick} data-game="next-level">
          {primary.label}
        </Button>
        <Button onClick={secondary.onClick}>{secondary.label}</Button>
      </div>
    </motion.div>
  )
}

/** "What you learned" list for the final card. */
export function Recap({ title, items }: { title: string; items: { icon: string; text: string }[] }) {
  return (
    <div className="w-full text-left">
      <p className="mb-1 label-caps text-ink-soft">{title}</p>
      <ul className="prose-text flex flex-col gap-1.5 text-sm text-ink">
        {items.map((r, i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden="true">{r.icon}</span>
            <span>{r.text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Small "+ new code" chip shown when the learner writes a class in a builder. */
export function NewCodeChip({ children }: { children: ReactNode }) {
  return (
    <motion.code
      lang="en"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 block truncate rounded-md bg-code px-2 py-1 font-mono text-xs text-[#7ee2a8]"
    >
      {children}
    </motion.code>
  )
}
