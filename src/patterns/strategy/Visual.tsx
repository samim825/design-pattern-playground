import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { StepControls } from '@/components/ui/StepControls'
import { Caption, Connector, Node, Packet, Stage, StatusDot, type Status } from '@/components/visual'
import { type PlayerStep, useStepPlayer } from '@/hooks/useStepPlayer'
import { formatNumber, formatTaka } from '@/lib/format'
import { fill } from '@/lib/template'
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

/** Step ids double as code-step ids — they match the `// @step:` markers in code/*.ts. */
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
  const procStatus = (i: number): Status => {
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
  const receiptPacket = <Packet color="#0b6b4f">🧾 Receipt</Packet>

  return (
    <div className="flex flex-col gap-4">
      <Stage>
        {/* ── Client ─────────────────────────────────────────── */}
        <Node role={v.clientRole} title={`🛒 ${v.clientTitle}`} active={kind === 'client-pay' || kind === 'done'} accent="#0b6b4f">
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
              <li className="mt-1 flex justify-between gap-2 border-t-2 border-dashed border-edge/40 pt-1 font-bold">
                <span>{v.total}</span>
                <span className="tabular-nums">{formatTaka(AMOUNT, lang)}</span>
              </li>
            </ul>

            <div>
              <p id="strategy-method-label" className="mb-1.5 label-caps text-ink-soft">
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
                      className={`flex flex-col items-center gap-0.5 rounded-lg border-2 border-edge px-1 py-2 text-sm font-bold transition-[transform,box-shadow,background-color] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chili ${
                        selected
                          ? '-translate-y-0.5 text-white shadow-hard-sm'
                          : 'bg-card text-ink hover:-translate-y-0.5 hover:shadow-hard-sm'
                      }`}
                      style={selected ? { backgroundColor: m.color } : undefined}
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
                className="mt-3 rounded-lg border-2 border-dashed border-edge bg-paper p-3 text-sm"
              >
                <div className="mb-1 flex items-center justify-between font-display font-bold text-ink">
                  <span>🧾 {v.receiptTitle}</span>
                  <span className="rotate-[-6deg] rounded border-2 border-bottle px-2 py-0.5 label-caps text-bottle">✓ {v.paid}</span>
                </div>
                <dl className="grid grid-cols-3 gap-2 tabular-nums">
                  <div>
                    <dt className="label-caps text-ink-soft">{v.amount}</dt>
                    <dd>{formatTaka(AMOUNT, lang)}</dd>
                  </div>
                  <div>
                    <dt className="label-caps text-ink-soft">{v.fee}</dt>
                    <dd>{formatTaka(fee, lang)}</dd>
                  </div>
                  <div>
                    <dt className="label-caps text-ink-soft">{v.total}</dt>
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
        <Node role={v.contextRole} title={v.contextTitle} active={kind === 'delegate'} accent="#0b6b4f" mono>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex items-center gap-2 rounded-lg border-2 border-dashed border-edge/50 bg-paper py-1.5 pr-1.5 pl-3">
              <code lang="en" className="font-mono text-xs font-bold text-ink-soft">
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
                    className="absolute inset-0 flex items-center justify-center gap-1 rounded-md border-2 border-[#2b1d16] px-2 font-mono text-xs font-bold text-white"
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
              className="inline-flex items-center gap-1 rounded-full border-2 border-bottle/60 bg-bottle/10 px-2 py-0.5 text-xs font-bold text-bottle dark:text-jade"
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
                <span className="text-ink-soft">{v.implementsLabel}</span>
              </p>
              <ol className="flex flex-col gap-1.5">
                {method.procs.map((proc, i) => {
                  const status = procStatus(i)
                  return (
                    <motion.li
                      key={proc}
                      animate={{ x: status === 'active' ? 4 : 0 }}
                      className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors ${
                        status === 'active' ? 'border-2 border-edge bg-card font-bold shadow-hard-sm' : 'border-2 border-transparent'
                      } ${status === 'pending' ? 'text-ink-soft/70' : ''}`}
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
      </Stage>

      {/* ── Caption ──────────────────────────────────────────── */}
      <Caption label={v.whatsHappening} text={caption} stepKey={`${captionKey}-${lang}`} />

      <StepControls player={controls} playLabel={fill(v.payButton, { amount: formatTaka(AMOUNT, lang) })} />
      <p className="text-xs text-ink-soft">* {v.feeNote}</p>
    </div>
  )
}
