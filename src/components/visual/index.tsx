/**
 * Shared building blocks for pattern visualizations (Visual.tsx).
 * Reuse these so every pattern looks like one app; extend here (not in a
 * pattern folder) when a new pattern needs a variant.
 */
import { AnimatePresence, motion } from 'framer-motion'
import { type ReactNode, useEffect, useRef } from 'react'
import { scrollNodeIntoView } from './follow'

export type Status = 'pending' | 'active' | 'done'

/** The framed "stage" that holds a visualization's nodes. */
export function Stage({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border-2 border-edge bg-paper-deep p-3 shadow-hard sm:p-5 ${className}`}>{children}</div>
  )
}

/**
 * An object/participant in the pattern (Client, Context, Strategy, Builder…).
 * `role` is the pattern role label; `title` is the class or object name.
 */
export function Node({
  role,
  title,
  active,
  accent = '#0b6b4f',
  mono = false,
  className = '',
  children,
}: {
  role: string
  title: string
  active: boolean
  /** Glow colour while active. */
  accent?: string
  /** Render the title as code (class names). */
  mono?: boolean
  className?: string
  children?: ReactNode
}) {
  // While a run is being followed, bring the node where the action is into view.
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (active) scrollNodeIntoView(ref.current)
  }, [active])

  return (
    <motion.div
      ref={ref}
      data-node-active={active}
      animate={{ scale: active ? 1.015 : 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`relative scroll-mt-28 scroll-mb-44 rounded-xl border-2 border-edge bg-card p-3 shadow-hard-sm transition-[box-shadow] duration-300 sm:p-4 ${className}`}
      style={active ? { boxShadow: `4px 4px 0 0 var(--c-shade), 0 0 0 4px ${accent}55` } : undefined}
    >
      <div className={`flex flex-wrap items-center gap-2 ${children ? 'mb-3' : ''}`}>
        <span className="rounded border-2 border-edge/40 px-1.5 py-px text-[10px] font-bold tracking-[0.15em] text-ink-soft uppercase">
          {role}
        </span>
        <span
          lang={mono ? 'en' : undefined}
          className={`font-bold text-ink ${mono ? 'font-mono text-sm' : 'font-display text-base'}`}
        >
          {title}
        </span>
      </div>
      {children}
    </motion.div>
  )
}

/**
 * Vertical arrow between two stacked nodes. While `down`/`up` is true a packet
 * travels along it (request down, result up). Change `runKey` to replay.
 */
export function Connector({
  label,
  down = false,
  up = false,
  downPacket,
  upPacket,
  runKey,
}: {
  /** Method call shown next to the arrow, e.g. "checkout.pay(1250)". Stays in English. */
  label: string
  down?: boolean
  up?: boolean
  downPacket?: ReactNode
  upPacket?: ReactNode
  runKey: number
}) {
  const active = down || up
  return (
    <div className="relative h-16">
      <div
        className={`absolute inset-y-1 left-1/2 w-1 -translate-x-1/2 rounded-full transition-colors ${
          active ? 'bg-chili' : 'bg-edge/40'
        }`}
      />
      <svg
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 transition-colors ${active ? 'text-chili' : 'text-edge/40'}`}
        width="12"
        height="8"
        viewBox="0 0 12 8"
        aria-hidden="true"
      >
        <path d="M0 0h12L6 8z" fill="currentColor" />
      </svg>
      <code
        lang="en"
        className={`absolute top-1/2 right-[calc(50%+1rem)] -translate-y-1/2 truncate font-mono text-[11px] transition-colors sm:text-xs ${
          active ? 'font-bold text-chili' : 'text-ink-soft/70'
        }`}
      >
        {label}
      </code>
      <AnimatePresence>
        {down && downPacket && (
          <motion.div
            key={`down-${runKey}`}
            className="absolute left-[calc(50%+0.75rem)]"
            initial={{ top: '-15%', opacity: 0 }}
            animate={{ top: '55%', opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          >
            {downPacket}
          </motion.div>
        )}
        {up && upPacket && (
          <motion.div
            key={`up-${runKey}`}
            className="absolute left-[calc(50%+0.75rem)]"
            initial={{ top: '70%', opacity: 0 }}
            animate={{ top: '0%', opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          >
            {upPacket}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** A message/data pill that travels along a Connector. */
export function Packet({ color = '#0b6b4f', children }: { color?: string; children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border-2 border-[#2b1d16] px-2 py-0.5 text-xs font-bold whitespace-nowrap text-white"
      style={{ backgroundColor: color }}
    >
      {children}
    </span>
  )
}

/** pending ○ / active spinner / done ✓ — for step lists inside a node. */
export function StatusDot({ status, color = '#0b6b4f' }: { status: Status; color?: string }) {
  if (status === 'done') {
    return (
      <span className="grid size-5 shrink-0 place-items-center rounded-full border-2 border-edge bg-bottle text-[10px] font-bold text-cream">
        ✓
      </span>
    )
  }
  if (status === 'active') {
    return (
      <motion.span
        className="size-5 shrink-0 rounded-full border-[3px] border-t-transparent"
        style={{ borderColor: color, borderTopColor: 'transparent' }}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
      />
    )
  }
  return <span className="size-5 shrink-0 rounded-full border-2 border-dashed border-edge/40" />
}

/**
 * The "What's happening" speech bubble under a visualization. It sticks to the
 * bottom of the screen while the stage is in view, so the explanation stays
 * readable while the page follows the action.
 */
export function Caption({ label, text, stepKey }: { label: string; text: string; stepKey: string }) {
  return (
    <div className="sticky bottom-2 z-20 min-h-24 rounded-xl border-2 border-edge bg-card px-4 py-3 shadow-hard">
      <p className="mb-1 label-caps text-chili">💬 {label}</p>
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={stepKey}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="prose-text text-sm text-ink"
          aria-live="polite"
          data-caption
        >
          {text}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
