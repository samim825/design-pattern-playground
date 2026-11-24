import { AnimatePresence, motion } from 'framer-motion'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { StepControls } from '@/components/ui/StepControls'
import { type PlayerStep, useStepPlayer } from '@/hooks/useStepPlayer'
import { formatNumber, formatTaka } from '@/lib/format'
import type { VisualProps } from '@/types/pattern'
import type { StrategyContent } from './content.en'

/* ------------------------------------------------------------------ */
/* Scenario data                                                       */
/* ------------------------------------------------------------------ */

const CART = [
  { key: 'tshirt', price: 850, icon: '👕' },
  { key: 'mug', price: 400, icon: '☕' },
] as const
const AMOUNT = CART.reduce((sum, item) => sum + item.price, 0) // 1250

type MethodId = 'bkash' | 'nagad' | 'card'
type ProcId = 'fee' | 'otp' | 'pin' | '3ds' | 'bank'

interface Method {
  id: MethodId
  className: string
  rate: number
  color: string
  icon: string
  /** The processing steps this strategy runs, in order. */
  procs: ProcId[]
}

// Fees are illustrative only (the UI says so).
const METHODS: Method[] = [
  { id: 'bkash', className: 'BkashPayment', rate: 0.0185, color: '#E2136E', icon: '📱', procs: ['fee', 'otp', 'pin'] },
  { id: 'nagad', className: 'NagadPayment', rate: 0.01, color: '#F26522', icon: '📲', procs: ['fee', 'otp'] },
  { id: 'card', className: 'CardPayment', rate: 0.025, color: '#2563EB', icon: '💳', procs: ['fee', '3ds', 'bank'] },
]

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

type StepKind = 'client-pay' | 'delegate' | 'process' | 'receipt' | 'done'

interface VisualStep extends PlayerStep {
  kind: StepKind
  proc?: ProcId
}

/** Step ids double as code-step ids — they match the `// @step:` markers in code.ts. */
function buildSteps(m: Method): VisualStep[] {
  return [
    { id: 'client-pay', kind: 'client-pay' },
    { id: 'delegate', kind: 'delegate' },
    ...m.procs.map<VisualStep>((proc) => ({ id: `${m.id}-${proc}`, kind: 'process', proc, duration: 1600 })),
    { id: `${m.id}-receipt`, kind: 'receipt' },
    { id: 'done', kind: 'done', duration: 1000 },
  ]
}

const round2 = (n: number) => Math.round(n * 100) / 100
const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => values[key] ?? `{{${key}}}`)

/* ------------------------------------------------------------------ */
/* Visual                                                              */
/* ------------------------------------------------------------------ */

export default function StrategyVisual({ content, lang, onCodeStep }: VisualProps<StrategyContent>) {
  const v = content.visual
  const captions: Record<string, string> = content.steps

  const [methodId, setMethodId] = useState<MethodId>('bkash')
  const [swapCount, setSwapCount] = useState(0)
  const [justSwapped, setJustSwapped] = useState(false)

  const method = METHODS.find((m) => m.id === methodId) ?? METHODS[0]
  const steps = useMemo(() => buildSteps(method), [method])
  const player = useStepPlayer(steps)
  const step = player.step
  const kind = step?.kind ?? null

  const fee = round2(AMOUNT * method.rate)
  const total = round2(AMOUNT + fee)

  // Which code line(s) are "running": the current step, or setStrategy right after a swap.
  const codeStep = step ? (step.codeStep ?? step.id) : justSwapped ? 'set-strategy' : null
  useEffect(() => {
    onCodeStep(codeStep)
  }, [codeStep, onCodeStep])

  const selectMethod = (id: MethodId) => {
    if (id === methodId && player.index < 0) return
    player.reset()
    setMethodId(id)
    setJustSwapped(true)
    setSwapCount((c) => c + 1)
  }

  // Starting a run clears the "just swapped" highlight.
  const controls = {
    ...player,
    play: () => {
      setJustSwapped(false)
      player.play()
    },
    next: () => {
      setJustSwapped(false)
      player.next()
    },
  }

  const values = {
    amount: formatTaka(AMOUNT, lang),
    fee: formatTaka(fee, lang),
    total: formatTaka(total, lang),
    rate: `${formatNumber(method.rate * 100, lang)}%`,
    method: v[method.id],
    className: method.className,
  }
  const captionKey = step ? (step.kind === 'process' ? step.proc! : step.kind) : justSwapped ? 'set-strategy' : 'idle'
  const caption = fill(captions[captionKey] ?? '', values)

  const procLabel: Record<ProcId, string> = {
    fee: v.procFee,
    otp: v.procOtp,
    pin: v.procPin,
    '3ds': v.proc3ds,
    bank: v.procBank,
  }
  const procStatus = (i: number): 'pending' | 'active' | 'done' => {
    const stepIndex = 2 + i // after client-pay and delegate
    if (player.index > stepIndex) return 'done'
    if (player.index === stepIndex) return 'active'
    return 'pending'
  }

  const amountPacket = (
    <Packet color={method.color}>
      💸 {formatTaka(AMOUNT, lang)}
    </Packet>
  )
  const receiptPacket = <Packet color="#059669">🧾 Receipt</Packet>

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        {/* ── Client ─────────────────────────────────────────── */}
        <Node role={v.clientRole} title={`🛒 ${v.clientTitle}`} active={kind === 'client-pay' || kind === 'done'} accent="#6366f1">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
            <ul className="flex flex-col gap-1 text-sm">
              {CART.map((item) => (
                <li key={item.key} className="flex justify-between gap-2">
                  <span>
                    {item.icon} {v[item.key]}
                  </span>
                  <span className="tabular-nums">{formatTaka(item.price, lang)}</span>
                </li>
              ))}
              <li className="mt-1 flex justify-between gap-2 border-t border-dashed border-slate-300 pt-1 font-semibold dark:border-slate-700">
                <span>{v.total}</span>
                <span className="tabular-nums">{formatTaka(AMOUNT, lang)}</span>
              </li>
            </ul>

            <div>
              <p id="strategy-method-label" className="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                {v.chooseMethod}
              </p>
              <div role="radiogroup" aria-labelledby="strategy-method-label" className="grid grid-cols-3 gap-2">
                {METHODS.map((m) => {
                  const selected = m.id === methodId
                  return (
                    <button
                      key={m.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => selectMethod(m.id)}
                      className={`flex flex-col items-center gap-0.5 rounded-xl border-2 px-1 py-2 text-sm font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
                        selected
                          ? 'text-white shadow-md'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600'
                      }`}
                      style={selected ? { backgroundColor: m.color, borderColor: m.color } : undefined}
                    >
                      <span className="text-lg" aria-hidden="true">
                        {m.icon}
                      </span>
                      {v[m.id]}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {kind === 'done' && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                className="mt-3 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm dark:border-emerald-500/40 dark:bg-emerald-500/10"
              >
                <div className="mb-1 flex items-center justify-between font-semibold text-emerald-800 dark:text-emerald-300">
                  <span>🧾 {v.receiptTitle}</span>
                  <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs text-white">✓ {v.paid}</span>
                </div>
                <dl className="grid grid-cols-3 gap-2 tabular-nums">
                  <div>
                    <dt className="text-xs text-slate-500 dark:text-slate-400">{v.amount}</dt>
                    <dd>{formatTaka(AMOUNT, lang)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500 dark:text-slate-400">{v.fee}</dt>
                    <dd>{formatTaka(fee, lang)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500 dark:text-slate-400">{v.total}</dt>
                    <dd className="font-bold">{formatTaka(total, lang)}</dd>
                  </div>
                </dl>
              </motion.div>
            )}
          </AnimatePresence>
        </Node>

        <Connector
          label={`checkout.pay(${AMOUNT})`}
          down={kind === 'client-pay'}
          up={kind === 'done'}
          downPacket={amountPacket}
          upPacket={receiptPacket}
          runKey={player.index}
        />

        {/* ── Context: Checkout ──────────────────────────────── */}
        <Node role={v.contextRole} title={v.contextTitle} active={kind === 'delegate'} accent="#6366f1" mono>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex items-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 py-1.5 pr-1.5 pl-3 dark:border-slate-600 dark:bg-slate-800/60">
              <code lang="en" className="font-mono text-xs text-slate-500 dark:text-slate-400">
                strategy:
              </code>
              <div className="relative h-8 min-w-36 overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={method.id}
                    lang="en"
                    initial={{ y: -36, opacity: 0, rotate: -6 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: 36, opacity: 0, rotate: 6 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                    className="absolute inset-0 flex items-center justify-center gap-1 rounded-md px-2 font-mono text-xs font-semibold text-white shadow"
                    style={{ backgroundColor: method.color }}
                  >
                    {method.icon} {method.className}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
            <motion.span
              key={swapCount}
              initial={swapCount > 0 ? { scale: 1.15, opacity: 0.4 } : false}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
            >
              ✓ {v.unchanged}
            </motion.span>
          </div>
        </Node>

        <Connector
          label="strategy.pay(amount)"
          down={kind === 'delegate'}
          up={kind === 'receipt'}
          downPacket={amountPacket}
          upPacket={receiptPacket}
          runKey={player.index}
        />

        {/* ── Concrete strategies ────────────────────────────── */}
        <Node
          role={v.strategyRole}
          title="PaymentStrategy"
          active={kind === 'process' || kind === 'receipt'}
          accent={method.color}
          mono
        >
          <div className="mb-3 grid grid-cols-3 gap-2">
            {METHODS.map((m) => {
              const selected = m.id === methodId
              return (
                <motion.div
                  key={m.id}
                  lang="en"
                  animate={{ opacity: selected ? 1 : 0.4, scale: selected ? 1 : 0.95 }}
                  className="truncate rounded-md border-2 px-1.5 py-1 text-center font-mono text-[11px] font-semibold sm:text-xs"
                  style={{ borderColor: m.color, color: selected ? '#fff' : m.color, backgroundColor: selected ? m.color : 'transparent' }}
                >
                  {m.className}
                </motion.div>
              )
            })}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={method.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="rounded-lg border p-3"
              style={{ borderColor: `${method.color}55`, backgroundColor: `${method.color}0d` }}
            >
              <p className="mb-2 font-mono text-xs" lang="en">
                <span className="font-semibold" style={{ color: method.color }}>
                  {method.className}
                </span>{' '}
                <span className="text-slate-500 dark:text-slate-400">{v.implementsLabel}</span>
              </p>
              <ol className="flex flex-col gap-1.5">
                {method.procs.map((proc, i) => {
                  const status = procStatus(i)
                  return (
                    <motion.li
                      key={proc}
                      animate={{ x: status === 'active' ? 4 : 0 }}
                      className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors ${
                        status === 'active' ? 'bg-white font-semibold shadow-sm dark:bg-slate-800' : ''
                      } ${status === 'pending' ? 'text-slate-400 dark:text-slate-500' : ''}`}
                    >
                      <StatusDot status={status} color={method.color} />
                      <span>{procLabel[proc]}</span>
                      {proc === 'fee' && (
                        <span className="ml-auto text-xs tabular-nums">
                          {formatNumber(method.rate * 100, lang)}%
                          {status !== 'pending' && <> → {formatTaka(fee, lang)}</>}
                        </span>
                      )}
                    </motion.li>
                  )
                })}
              </ol>
            </motion.div>
          </AnimatePresence>
        </Node>
      </div>

      {/* ── Caption ──────────────────────────────────────────── */}
      <div className="min-h-24 rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-3 dark:border-indigo-500/30 dark:bg-indigo-500/10">
        <p className="mb-1 text-xs font-semibold tracking-wide text-indigo-700 uppercase dark:text-indigo-300">
          {v.whatsHappening}
        </p>
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={`${captionKey}-${lang}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="prose-text text-sm text-slate-700 dark:text-slate-200"
            aria-live="polite"
          >
            {caption}
          </motion.p>
        </AnimatePresence>
      </div>

      <StepControls player={controls} playLabel={fill(v.payButton, { amount: formatTaka(AMOUNT, lang) })} />
      <p className="text-xs text-slate-500 dark:text-slate-400">* {v.feeNote}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

function Node({
  role,
  title,
  active,
  accent,
  mono = false,
  children,
}: {
  role: string
  title: string
  active: boolean
  accent: string
  mono?: boolean
  children: ReactNode
}) {
  return (
    <motion.div
      animate={{ scale: active ? 1.015 : 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="relative rounded-xl border-2 border-slate-200 bg-white p-3 transition-[border-color,box-shadow] duration-300 sm:p-4 dark:border-slate-700 dark:bg-slate-900"
      style={active ? { borderColor: accent, boxShadow: `0 0 0 4px ${accent}26` } : undefined}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-slate-500 uppercase dark:bg-slate-800 dark:text-slate-400">
          {role}
        </span>
        <span
          lang={mono ? 'en' : undefined}
          className={`font-semibold text-slate-900 dark:text-white ${mono ? 'font-mono text-sm' : ''}`}
        >
          {title}
        </span>
      </div>
      {children}
    </motion.div>
  )
}

/** Vertical arrow between two nodes; a packet travels down (request) or up (receipt). */
function Connector({
  label,
  down,
  up,
  downPacket,
  upPacket,
  runKey,
}: {
  label: string
  down: boolean
  up: boolean
  downPacket: ReactNode
  upPacket: ReactNode
  runKey: number
}) {
  const active = down || up
  return (
    <div className="relative h-16">
      <div
        className={`absolute inset-y-1 left-1/2 w-0.5 -translate-x-1/2 transition-colors ${
          active ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'
        }`}
      />
      <svg
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 transition-colors ${
          active ? 'text-indigo-500' : 'text-slate-300 dark:text-slate-700'
        }`}
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
          active ? 'font-semibold text-indigo-600 dark:text-indigo-300' : 'text-slate-400 dark:text-slate-500'
        }`}
      >
        {label}
      </code>
      <AnimatePresence>
        {down && (
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
        {up && (
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

function Packet({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-white shadow-md"
      style={{ backgroundColor: color }}
    >
      {children}
    </span>
  )
}

function StatusDot({ status, color }: { status: 'pending' | 'active' | 'done'; color: string }) {
  if (status === 'done') {
    return (
      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500 text-[11px] text-white">✓</span>
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
  return <span className="size-5 shrink-0 rounded-full border-2 border-slate-300 dark:border-slate-600" />
}
