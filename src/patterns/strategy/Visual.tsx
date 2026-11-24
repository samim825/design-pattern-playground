import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { ChoiceButton, GameHud, LevelCompleteCard, MissionBanner, NewCodeChip, Recap } from '@/components/game'
import { type Level, starsFor, useGameProgress, useShake } from '@/components/game/state'
import { Button } from '@/components/ui/Button'
import { StepControls } from '@/components/ui/StepControls'
import { Caption, Connector, Node, Packet, Stage, StatusDot, type Status } from '@/components/visual'
import { type PlayerStep, useStepPlayer } from '@/hooks/useStepPlayer'
import { formatNumber, formatTaka } from '@/lib/format'
import { fill } from '@/lib/template'
import type { CodeView, VisualProps } from '@/types/pattern'
import type { StrategyContent } from './content.en'

/*
 * "Rahim's Shop Checkout": a 3-level game.
 *   Level 1  no pattern: the learner ticks each method's steps in one big checkout() (code panel: `without`)
 *   Level 2  Strategy: the learner plugs the right strategy into Checkout, and swaps it when a customer
 *            changes their mind (code panel: `main`)
 *   Level 3  the learner adds RocketPayment without editing Checkout (code panel: `with`)
 * Every payment is a step timeline, so the code panel lights up in sync.
 */

type Labels = StrategyContent['visual']
type LabelKey = keyof Labels
type MethodId = 'bkash' | 'nagad' | 'card' | 'rocket'
type ProcId = 'otp' | 'pin' | '3ds' | 'bank'

/* ------------------------------------------------------------------ */
/* Scenario data                                                       */
/* ------------------------------------------------------------------ */

interface Method {
  className: string
  rate: number
  color: string
  icon: string
  procs: ProcId[]
}

// Fees are illustrative only (the UI says so).
const METHODS: Record<MethodId, Method> = {
  bkash: { className: 'BkashPayment', rate: 0.0185, color: '#E2136E', icon: '📱', procs: ['otp', 'pin'] },
  nagad: { className: 'NagadPayment', rate: 0.01, color: '#F26522', icon: '📲', procs: ['otp'] },
  card: { className: 'CardPayment', rate: 0.025, color: '#2563EB', icon: '💳', procs: ['3ds', 'bank'] },
  rocket: { className: 'RocketPayment', rate: 0.018, color: '#8C3494', icon: '🚀', procs: ['otp'] },
}
const OLD_METHODS: MethodId[] = ['bkash', 'nagad', 'card']
const ALL_PROCS: ProcId[] = ['otp', 'pin', '3ds', 'bank']
const PROC_ICON: Record<ProcId, string> = { otp: '🔢', pin: '🔐', '3ds': '🛡️', bank: '🏦' }

interface Customer {
  name: LabelKey
  emoji: string
  amount: number
  method: MethodId
  /** The customer changes their mind after the first strategy is plugged in. */
  changeTo?: MethodId
}

const CUSTOMERS: Record<Level, Customer[]> = {
  1: [
    { name: 'rahim', emoji: '👨', amount: 1250, method: 'bkash' },
    { name: 'nusrat', emoji: '👩', amount: 3400, method: 'card' },
    { name: 'karim', emoji: '🧔', amount: 780, method: 'nagad' },
  ],
  2: [
    { name: 'mitu', emoji: '👧', amount: 2150, method: 'nagad' },
    { name: 'karim', emoji: '🧔', amount: 780, method: 'card' },
    { name: 'rahim', emoji: '👨', amount: 1250, method: 'bkash', changeTo: 'card' },
  ],
  3: [
    { name: 'karim', emoji: '🧔', amount: 1600, method: 'rocket' },
    { name: 'nusrat', emoji: '👩', amount: 3400, method: 'bkash' },
    { name: 'mitu', emoji: '👧', amount: 950, method: 'rocket' },
  ],
}

const LEVEL_ICON: Record<Level, string> = { 1: '🧾', 2: '🔌', 3: '🚀' }
const LEVEL1_IF_LINES = 22
const round2 = (n: number) => Math.round(n * 100) / 100

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

type Kind = 'l1-start' | 'branch' | 'pay' | 'delegate' | 'proc' | 'receipt' | 'result'
type ProcStep = ProcId | 'fee'

interface GameStep extends PlayerStep {
  kind: Kind
  caption: string
  proc?: ProcStep
  wrong?: boolean
}

function level1Result(method: MethodId, ticks: ProcId[]) {
  const needed = METHODS[method].procs
  const missing = needed.filter((p) => !ticks.includes(p))
  const extra = ticks.filter((p) => !needed.includes(p))
  return { ok: !missing.length && !extra.length, missing, extra }
}

/** Step ids double as code-step ids: they match the `// @step:` markers in code/*.ts. */
function buildSteps(level: Level, customer: Customer, ticks: ProcId[], strategy: MethodId | null): GameStep[] {
  if (level === 1) {
    if (!ticks.length) return []
    const m = customer.method
    const r = level1Result(m, ticks)
    return [
      { id: 'l1-start', kind: 'l1-start', caption: 'l1-start' },
      { id: `l1-${m}`, kind: 'branch', caption: 'l1-branch' },
      ...ALL_PROCS.filter((p) => ticks.includes(p)).map<GameStep>((p) =>
        METHODS[m].procs.includes(p)
          ? { id: `l1-${m}-${p}`, kind: 'proc', proc: p, caption: 'l1-step', duration: 1400 }
          : { id: `l1-x-${p}`, codeStep: `l1-${m}`, kind: 'proc', proc: p, wrong: true, caption: 'l1-wrong', duration: 1400 },
      ),
      {
        id: 'l1-result',
        kind: 'result',
        caption: r.ok ? 'l1-ok' : r.extra.length ? 'fail-extra' : 'fail-missing',
        duration: 1000,
      },
    ]
  }
  if (!strategy) return []
  if (strategy === 'rocket') {
    return [
      { id: 'rocket-pay', kind: 'pay', caption: 'rocket-pay' },
      { id: 'rocket-delegate', codeStep: 'rocket-pay', kind: 'delegate', caption: 'rocket-delegate' },
      { id: 'rocket-fee', kind: 'proc', proc: 'fee', caption: 'rocket-fee', duration: 1400 },
      { id: 'rocket-otp', kind: 'proc', proc: 'otp', caption: 'rocket-otp', duration: 1400 },
      { id: 'rocket-receipt', kind: 'receipt', caption: 'rocket-receipt' },
      { id: 'rocket-done', kind: 'result', caption: 'rocket-done', duration: 1000 },
    ]
  }
  return [
    { id: 'client-pay', kind: 'pay', caption: 'client-pay' },
    { id: 'delegate', kind: 'delegate', caption: 'delegate' },
    ...(['fee', ...METHODS[strategy].procs] as ProcStep[]).map<GameStep>((p) => ({
      id: `${strategy}-${p}`,
      kind: 'proc',
      proc: p,
      caption: p,
      duration: 1400,
    })),
    { id: `${strategy}-receipt`, kind: 'receipt', caption: 'receipt' },
    { id: 'done', kind: 'result', caption: 'done', duration: 1000 },
  ]
}

/* ------------------------------------------------------------------ */
/* Visual                                                              */
/* ------------------------------------------------------------------ */

export default function StrategyVisual({ content, lang, onCodeStep, onCodeView }: VisualProps<StrategyContent>) {
  const v = content.visual
  const captions: Record<string, string> = content.steps
  const label = (key: LabelKey) => v[key]
  const procLabel: Record<ProcStep, string> = {
    fee: v.procFee,
    otp: v.procOtp,
    pin: v.procPin,
    '3ds': v.proc3ds,
    bank: v.procBank,
  }

  const { progress, addCoins, completeLevel, reset: resetProgress } = useGameProgress('dpp-strategy-game')
  const shake = useShake()
  const [level, setLevel] = useState<Level>(1)
  const [custIdx, setCustIdx] = useState(0)
  const [results, setResults] = useState<('ok' | 'fail')[]>([])
  const [mistakes, setMistakes] = useState(0)
  const [ticks, setTicks] = useState<ProcId[]>(['otp', 'pin']) // level 1, customer 1 is a guided tutorial
  const [strategy, setStrategy] = useState<MethodId | null>(null)
  const [changed, setChanged] = useState(false)
  const [swapCount, setSwapCount] = useState(0)
  const [rocketBuilt, setRocketBuilt] = useState(false)
  const [builder, setBuilder] = useState<'q1' | 'q2' | 'ready' | null>(null)
  const [hint, setHint] = useState<{ key: string; values?: Record<string, string> } | null>(null)
  const [levelDone, setLevelDone] = useState(false)
  const [lastStars, setLastStars] = useState(0)

  const customer = CUSTOMERS[level][custIdx]
  const wanted: MethodId = changed && customer.changeTo ? customer.changeTo : customer.method
  const steps = useMemo(() => buildSteps(level, customer, ticks, strategy), [level, customer, ticks, strategy])
  const player = useStepPlayer(steps)
  const step = player.step
  const kind = step?.kind ?? null
  const busy = player.index >= 0

  // The method that actually runs: in level 1 the customer's, later the plugged-in strategy.
  const running: MethodId | null = level === 1 ? customer.method : strategy
  const method = running ? METHODS[running] : null
  const fee = method ? round2(customer.amount * method.rate) : 0
  const l1 = level1Result(customer.method, ticks)
  const willSucceed = level === 1 ? l1.ok : true
  const outcome: 'ok' | 'fail' | null = player.done ? (willSucceed ? 'ok' : 'fail') : null
  const pendingCoins = outcome === 'ok' ? customer.amount : 0
  const accent = method?.color ?? METHODS[customer.method].color

  /* ---------------- code panel sync ---------------- */

  const view: CodeView =
    level === 1
      ? 'without'
      : builder || strategy === 'rocket' || (level === 3 && customer.method === 'rocket' && !levelDone)
        ? 'with'
        : 'main'
  useEffect(() => {
    onCodeView?.(view)
  }, [view, onCodeView])
  useEffect(() => () => onCodeView?.('main'), [onCodeView])

  let idleCode: string | null = null
  if (level === 1) idleCode = levelDone ? 'l1-todo' : `l1-${customer.method}`
  else if (builder === 'q1') idleCode = 'build-strategy'
  else if (builder) idleCode = 'build-plug'
  else if (strategy && !levelDone) idleCode = strategy === 'rocket' ? 'rocket-set' : 'set-strategy'
  const codeStep = step ? (step.codeStep ?? step.id) : idleCode
  useEffect(() => {
    onCodeStep(codeStep)
  }, [codeStep, onCodeStep])

  /* ---------------- actions ---------------- */

  const startLevel = (n: Level) => {
    player.reset()
    setLevel(n)
    setCustIdx(0)
    setResults([])
    setMistakes(0)
    setTicks(n === 1 ? ['otp', 'pin'] : [])
    setStrategy(null)
    setChanged(false)
    setRocketBuilt(false)
    setBuilder(null)
    setHint(null)
    setLevelDone(false)
  }

  const restartGame = () => {
    resetProgress()
    startLevel(1)
  }

  const toggleTick = (p: ProcId) => {
    if (busy) return
    player.reset()
    setHint(null)
    setTicks((t) => (t.includes(p) ? t.filter((x) => x !== p) : [...t, p]))
  }

  const plug = (m: MethodId) => {
    if (busy) return
    if (m === 'rocket' && !rocketBuilt) {
      if (customer.method === 'rocket') {
        setHint(null)
        setStrategy(null)
        setBuilder('q1')
      }
      return
    }
    if (customer.method === 'rocket' && !rocketBuilt) {
      shake.bump(m)
      setHint({ key: 'need-build' })
      return
    }
    if (m === strategy) return
    if (m !== wanted) {
      shake.bump(m)
      setMistakes((x) => x + 1)
      setHint({ key: 'wrong-strategy', values: { picked: label(m) } })
      return
    }
    player.reset()
    const isSwap = strategy !== null
    setStrategy(m)
    if (isSwap) setSwapCount((c) => c + 1)
    if (customer.changeTo && !changed) {
      // The customer changes their mind right after the first strategy is plugged in.
      setChanged(true)
      setHint({ key: 'change-mind', values: { method: label(customer.changeTo) } })
    } else {
      setHint(isSwap ? { key: 'swapped', values: { className: METHODS[m].className } } : null)
    }
  }

  const answerQ1 = (choice: 'elseif' | 'newClass' | 'inBkash') => {
    if (builder !== 'q1') return
    if (choice === 'newClass') {
      setHint(null)
      setBuilder('q2')
      return
    }
    shake.bump(`q1-${choice}`)
    setMistakes((x) => x + 1)
    setHint({ key: choice === 'elseif' ? 'wrong-elseif' : 'wrong-in-bkash' })
  }

  const answerQ2 = (choice: 'nothing' | 'addCase' | 'newMethod') => {
    if (builder !== 'q2') return
    if (choice === 'nothing') {
      setHint(null)
      setBuilder('ready')
      return
    }
    shake.bump(`q2-${choice}`)
    setMistakes((x) => x + 1)
    setHint({ key: choice === 'addCase' ? 'wrong-add-case' : 'wrong-new-method' })
  }

  const plugRocket = () => {
    player.reset()
    setRocketBuilt(true)
    setBuilder(null)
    setStrategy('rocket')
    setHint({ key: 'build-done' })
  }

  const finishLevel = () => {
    const stars = starsFor(mistakes)
    setLastStars(stars)
    completeLevel(level, stars)
    setLevelDone(true)
  }

  const isLastCustomer = custIdx + 1 >= CUSTOMERS[level].length
  const afterOutcome = () => {
    const wasOk = outcome === 'ok'
    setResults((r) => {
      const next = [...r]
      next[custIdx] ??= wasOk ? 'ok' : 'fail' // the first attempt counts for the dots
      return next
    })
    if (wasOk) addCoins(pendingCoins)
    player.reset()
    setHint(null)
    if (!wasOk) {
      setMistakes((m) => m + 1)
      setTicks([])
      return // try the same customer again
    }
    setTicks([])
    setChanged(false)
    if (isLastCustomer) finishLevel()
    else setCustIdx(custIdx + 1)
  }

  // Starting a run clears any hint.
  const controls = {
    ...player,
    play: () => {
      setHint(null)
      player.play()
    },
    next: () => {
      setHint(null)
      player.next()
    },
  }

  /* ---------------- caption ---------------- */

  const currentProc = step?.proc
  const values: Record<string, string> = {
    name: label(customer.name),
    amount: formatTaka(customer.amount, lang),
    method: running ? label(running) : label(wanted),
    methodId: customer.method,
    className: strategy ? METHODS[strategy].className : '',
    fee: formatTaka(fee, lang),
    rate: method ? `${formatNumber(method.rate * 100, lang)}%` : '',
    step: currentProc ? procLabel[currentProc] : '',
    missing: l1.missing.map((p) => procLabel[p]).join(', '),
    extra: l1.extra.map((p) => procLabel[p]).join(', '),
  }
  if (!step && hint?.key === 'wrong-strategy') values.method = label(wanted)
  Object.assign(values, hint && !step ? hint.values : undefined)

  let captionKey: string
  if (step) captionKey = step.caption
  else if (hint) captionKey = hint.key
  else if (levelDone) captionKey = `level${level}-done`
  else if (builder === 'q1') captionKey = 'build-q1'
  else if (builder === 'q2') captionKey = 'build-q2'
  else if (builder === 'ready') captionKey = 'build-ready'
  else if (level === 1)
    captionKey = ticks.length ? (custIdx === 0 && results.length === 0 ? 'tutorial' : 'picked1') : 'idle1'
  else if (strategy === wanted) captionKey = 'set-strategy'
  else captionKey = customer.method === 'rocket' && !rocketBuilt ? 'need-build' : 'idle2'
  const caption = fill(captions[captionKey] ?? '', values)

  /* ---------------- pieces ---------------- */

  const stepStatus = (id: string): Status => {
    const at = steps.findIndex((s) => s.id === id)
    if (at < 0 || player.index < at) return 'pending'
    return player.index === at ? 'active' : 'done'
  }

  // Steps shown in the bottom node: level 1 = what the learner ticked, later = the strategy's own steps.
  const procRows: { id: string; proc: ProcStep; wrong: boolean }[] =
    level === 1
      ? steps.filter((s) => s.kind === 'proc').map((s) => ({ id: s.id, proc: s.proc!, wrong: !!s.wrong }))
      : running
        ? (['fee', ...METHODS[running].procs] as ProcStep[]).map((p) => ({ id: `${running}-${p}`, proc: p, wrong: false }))
        : []

  const customerOf = fill(v.customerOf, {
    n: formatNumber(custIdx + 1, lang),
    total: formatNumber(CUSTOMERS[level].length, lang),
  })

  const methodBadge = (m: MethodId, struck = false) => (
    <span
      className={`inline-flex items-center gap-1 rounded-full border-2 border-[#2b1d16] px-2 py-0.5 text-xs font-bold text-white ${
        struck ? 'line-through opacity-50' : ''
      }`}
      style={{ backgroundColor: METHODS[m].color }}
    >
      <span aria-hidden="true">{METHODS[m].icon}</span> {label(m)}
    </span>
  )

  const receipt = (
    <AnimatePresence>
      {kind === 'result' && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          className="mt-3 rounded-lg border-2 border-dashed border-edge bg-paper p-3 text-sm"
        >
          <div className="mb-1 flex items-center justify-between font-display font-bold text-ink">
            <span>🧾 {v.receiptTitle}</span>
            <span
              className={`rotate-[-6deg] rounded border-2 px-2 py-0.5 label-caps ${
                willSucceed ? 'border-bottle text-bottle dark:border-jade dark:text-jade' : 'border-chili text-chili'
              }`}
            >
              {willSucceed ? `✓ ${v.paid}` : `✗ ${v.declined}`}
            </span>
          </div>
          {willSucceed && (
            <dl className="grid grid-cols-3 gap-2 tabular-nums">
              <div>
                <dt className="label-caps text-ink-soft">{v.amount}</dt>
                <dd>{formatTaka(customer.amount, lang)}</dd>
              </div>
              <div>
                <dt className="label-caps text-ink-soft">{v.fee}</dt>
                <dd>{formatTaka(fee, lang)}</dd>
              </div>
              <div>
                <dt className="label-caps text-ink-soft">{v.total}</dt>
                <dd className="font-bold">{formatTaka(round2(customer.amount + fee), lang)}</dd>
              </div>
            </dl>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div className="flex flex-col gap-4">
      <GameHud
        level={level}
        progress={progress}
        pendingCoins={pendingCoins}
        gainKey={`${level}-${custIdx}`}
        onPickLevel={startLevel}
        titles={{ 1: v.level1Title, 2: v.level2Title, 3: v.level3Title }}
        labels={v}
        lang={lang}
      />

      <Stage>
        <MissionBanner
          icon={LEVEL_ICON[level]}
          levelText={fill(v.levelLabel, { n: formatNumber(level, lang) })}
          title={label(`level${level}Title` as LabelKey)}
          goal={label(`level${level}Goal` as LabelKey)}
        />

        <AnimatePresence mode="wait" initial={false}>
          {levelDone ? (
            <LevelCompleteCard
              key={`done-${level}`}
              title={fill(v.levelDone, { n: formatNumber(level, lang) })}
              stars={lastStars}
              primary={
                level < 3
                  ? { label: `${v.nextLevel} →`, onClick: () => startLevel((level + 1) as Level) }
                  : { label: v.playAgain, onClick: restartGame }
              }
              secondary={{ label: v.replayLevel, onClick: () => startLevel(level) }}
            >
              {level === 1 && (
                <>
                  <p className="prose-text text-sm text-ink">{v.l1Teaser}</p>
                  <code
                    lang="en"
                    className="w-full max-w-xs truncate rounded-md border-2 border-dashed border-chili px-2 py-1 font-mono text-xs text-chili"
                  >
                    {"else if (method === 'rocket') ???"}
                  </code>
                </>
              )}
              {level === 2 && <p className="prose-text text-sm text-ink">{v.l2Summary}</p>}
              {level === 3 && (
                <Recap
                  title={v.recapTitle}
                  items={[
                    { icon: '😣', text: v.recap1 },
                    { icon: '🔌', text: v.recap2 },
                    { icon: '🚀', text: v.recap3 },
                  ]}
                />
              )}
            </LevelCompleteCard>
          ) : (
            <motion.div key={`play-${level}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* ── Client: customer + choice ──────────────────── */}
              <Node
                role={v.clientRole}
                title={`🛒 ${v.customersTitle}`}
                active={kind === 'l1-start' || kind === 'pay' || kind === 'result'}
                accent={accent}
              >
                <div className="mb-3 flex items-center gap-1.5">
                  {CUSTOMERS[level].map((_, i) => {
                    const r = results[i] ?? (i === custIdx ? outcome : null)
                    return (
                      <span
                        key={i}
                        aria-hidden="true"
                        className={`grid size-5 place-items-center rounded-full border-2 text-[10px] font-bold ${
                          r === 'ok'
                            ? 'border-edge bg-bottle text-cream'
                            : r === 'fail'
                              ? 'border-edge bg-chili text-cream'
                              : i === custIdx
                                ? 'border-edge bg-mustard text-on-accent'
                                : 'border-dashed border-edge/40'
                        }`}
                      >
                        {r === 'ok' ? '✓' : r === 'fail' ? '✗' : ''}
                      </span>
                    )
                  })}
                  <span className="ml-auto label-caps text-ink-soft">{customerOf}</span>
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`${level}-${custIdx}`}
                    initial={{ x: 40, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -40, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="mb-3 flex items-center gap-3 rounded-lg border-2 border-dashed border-edge/50 bg-paper p-2.5"
                  >
                    <span className="text-3xl" aria-hidden="true">
                      {customer.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-baseline justify-between gap-2 font-bold text-ink">
                        <span className="truncate">{label(customer.name)}</span>
                        <span className="tabular-nums">{formatTaka(customer.amount, lang)}</span>
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-ink-soft">
                        <span>{v.wantsToPay}</span>
                        {changed && customer.changeTo && methodBadge(customer.method, true)}
                        <motion.span
                          key={wanted}
                          initial={changed ? { scale: 1.4, rotate: -8 } : false}
                          animate={{ scale: 1, rotate: 0 }}
                        >
                          {methodBadge(wanted)}
                        </motion.span>
                        {changed && customer.changeTo && (
                          <span className="font-bold text-chili">💬 {v.changedMind}</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <p id="st-pick-label" className="mb-1.5 label-caps text-ink-soft">
                  {level === 1 ? v.pickSteps : v.pickStrategy}
                </p>
                {level === 1 ? (
                  <div role="group" aria-labelledby="st-pick-label" className="grid grid-cols-2 gap-2">
                    {ALL_PROCS.map((p) => (
                      <ChoiceButton
                        key={p}
                        role="checkbox"
                        selected={ticks.includes(p)}
                        color="#0b6b4f"
                        icon={PROC_ICON[p]}
                        text={procLabel[p]}
                        onClick={() => toggleTick(p)}
                        animate={shake.anim(p)}
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    role="radiogroup"
                    aria-labelledby="st-pick-label"
                    className={`grid gap-2 ${level === 3 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}
                  >
                    {OLD_METHODS.map((m) => (
                      <ChoiceButton
                        key={m}
                        selected={strategy === m}
                        color={METHODS[m].color}
                        icon={METHODS[m].icon}
                        text={label(m)}
                        onClick={() => plug(m)}
                        animate={shake.anim(m)}
                      />
                    ))}
                    {level === 3 && (
                      <ChoiceButton
                        selected={rocketBuilt ? strategy === 'rocket' : builder !== null}
                        color={METHODS.rocket.color}
                        icon={rocketBuilt ? METHODS.rocket.icon : '🔨'}
                        text={rocketBuilt ? label('rocket') : `${v.buildSlot}: ${label('rocket')}`}
                        onClick={() => plug('rocket')}
                        animate={shake.anim('rocket')}
                        className={!rocketBuilt && builder === null ? 'border-dashed' : ''}
                      />
                    )}
                  </div>
                )}
              </Node>

              <Connector
                label={level === 1 ? `checkout(${customer.amount})` : `checkout.pay(${customer.amount})`}
                down={kind === 'l1-start' || kind === 'pay'}
                up={kind === 'result' && willSucceed}
                downPacket={
                  <Packet color={accent}>
                    💸 {formatTaka(customer.amount, lang)}
                  </Packet>
                }
                upPacket={<Packet color="#0b6b4f">🧾 Receipt</Packet>}
                runKey={player.index}
              />

              {/* ── Middle: one big checkout() (L1) or the Context (L2/3) ── */}
              {level === 1 ? (
                <Node role={v.noPatternRole} title="checkout()" active={kind === 'branch'} accent="#B91C1C" mono>
                  <p className="mb-2 text-xs font-semibold text-ink-soft">{v.branchesLabel}</p>
                  <ul className="flex flex-col gap-1">
                    {OLD_METHODS.map((m) => {
                      const lit = m === customer.method && (kind === 'branch' || !busy)
                      return (
                        <motion.li
                          key={m}
                          animate={{ x: lit && kind === 'branch' ? 4 : 0 }}
                          className={`flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-md border-2 px-2 py-1 text-[11px] sm:text-xs ${
                            lit ? 'border-edge bg-card font-bold shadow-hard-sm' : 'border-transparent text-ink-soft'
                          }`}
                        >
                          <code lang="en" className="font-mono font-bold" style={{ color: METHODS[m].color }}>
                            {`'${m}'`}
                          </code>
                          <span aria-hidden="true">→</span>
                          <span className="tabular-nums">{formatNumber(METHODS[m].rate * 100, lang)}%</span>
                          {METHODS[m].procs.map((p) => (
                            <span key={p} className="rounded bg-paper-deep px-1">
                              {procLabel[p]}
                            </span>
                          ))}
                        </motion.li>
                      )
                    })}
                  </ul>
                  <p className="mt-2 flex items-center justify-between gap-2 border-t-2 border-dashed border-edge/40 pt-2 text-xs text-ink-soft">
                    <span>{v.linesLabel}</span>
                    <span className="font-mono font-bold text-chili tabular-nums">{formatNumber(LEVEL1_IF_LINES, lang)}</span>
                  </p>
                </Node>
              ) : (
                <Node role={v.contextRole} title={v.contextTitle} active={kind === 'delegate'} accent={accent} mono>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <div className="flex min-w-0 items-center gap-2 rounded-lg border-2 border-dashed border-edge/50 bg-paper py-1.5 pr-1.5 pl-3">
                      <code lang="en" className="font-mono text-xs font-bold text-ink-soft">
                        strategy:
                      </code>
                      <div className="relative h-8 w-40 overflow-hidden">
                        <AnimatePresence mode="popLayout" initial={false}>
                          {strategy ? (
                            <motion.span
                              key={strategy}
                              lang="en"
                              initial={{ y: -36, opacity: 0, rotate: -6 }}
                              animate={{ y: 0, opacity: 1, rotate: 0 }}
                              exit={{ y: 36, opacity: 0, rotate: 6 }}
                              transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                              className="absolute inset-0 flex items-center justify-center gap-1 truncate rounded-md border-2 border-[#2b1d16] px-2 font-mono text-xs font-bold text-white"
                              style={{ backgroundColor: METHODS[strategy].color }}
                            >
                              {METHODS[strategy].icon} {METHODS[strategy].className}
                            </motion.span>
                          ) : (
                            <motion.span
                              key="empty"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 flex items-center justify-center text-xs text-ink-soft/70 italic"
                            >
                              {v.emptySlot}
                            </motion.span>
                          )}
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
                    {swapCount > 0 && hint?.key === 'swapped' && (
                      <motion.span
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="inline-flex items-center gap-1 rounded-full border-2 border-mustard bg-mustard/20 px-2 py-0.5 text-xs font-bold text-ink"
                      >
                        ↻ {v.swapped}
                      </motion.span>
                    )}
                  </div>
                </Node>
              )}

              <Connector
                label={level === 1 ? `case '${customer.method}'` : 'strategy.pay()'}
                down={kind === 'branch' || kind === 'delegate'}
                up={kind === 'receipt'}
                downPacket={<Packet color={accent}>💸 {formatTaka(customer.amount, lang)}</Packet>}
                upPacket={<Packet color="#0b6b4f">🧾 Receipt</Packet>}
                runKey={player.index}
              />

              {/* ── Bottom: the steps (L1) or the ConcreteStrategy (L2/3) ── */}
              <Node
                role={level === 1 ? v.processingRole : v.strategyRole}
                title={level === 1 ? label(customer.method) : builder ? 'RocketPayment' : (method?.className ?? 'PaymentStrategy')}
                active={builder !== null || kind === 'proc' || kind === 'receipt'}
                accent={builder ? METHODS.rocket.color : accent}
                mono={level > 1}
              >
                {level > 1 && (
                  <div className={`mb-3 grid gap-2 ${level === 3 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
                    {(level === 3 ? [...OLD_METHODS, 'rocket' as const] : OLD_METHODS).map((m) => {
                      const lit = m === strategy
                      const ghost = m === 'rocket' && !rocketBuilt
                      return (
                        <motion.div
                          key={m}
                          lang="en"
                          animate={{ opacity: lit ? 1 : ghost ? 0.25 : 0.45, scale: lit ? 1 : 0.95 }}
                          className={`truncate rounded-md border-2 px-1.5 py-1 text-center font-mono text-[11px] font-semibold sm:text-xs ${
                            ghost ? 'border-dashed' : ''
                          }`}
                          style={{
                            borderColor: METHODS[m].color,
                            color: lit ? '#fff' : METHODS[m].color,
                            backgroundColor: lit ? METHODS[m].color : 'transparent',
                          }}
                        >
                          {METHODS[m].className}
                        </motion.div>
                      )
                    })}
                  </div>
                )}

                {builder ? (
                  /* ── Level 3 builder ─────────────────────────── */
                  <div className="flex flex-col gap-3 rounded-lg border-2 border-dashed p-3" style={{ borderColor: METHODS.rocket.color }}>
                    <p className="font-display font-bold text-ink">🔨 {v.builderTitle}</p>
                    <div>
                      <p className="label-caps text-ink-soft">{v.builderStep1}</p>
                      <p className="mb-2 text-sm text-ink">{v.q1}</p>
                      <div role="radiogroup" aria-label={v.q1} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {(
                          [
                            ['elseif', v.q1ElseIf],
                            ['newClass', v.q1NewClass],
                            ['inBkash', v.q1InBkash],
                          ] as const
                        ).map(([id, text]) => (
                          <ChoiceButton
                            key={id}
                            selected={builder !== 'q1' && id === 'newClass'}
                            color={METHODS.rocket.color}
                            text={text}
                            onClick={() => answerQ1(id)}
                            animate={shake.anim(`q1-${id}`)}
                            className={builder !== 'q1' && id !== 'newClass' ? 'opacity-40' : ''}
                          />
                        ))}
                      </div>
                      {builder !== 'q1' && <NewCodeChip>+ class RocketPayment implements PaymentStrategy</NewCodeChip>}
                    </div>

                    {builder !== 'q1' && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <p className="label-caps text-ink-soft">{v.builderStep2}</p>
                        <p className="mb-2 text-sm text-ink">{v.q2}</p>
                        <div role="radiogroup" aria-label={v.q2} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          {(
                            [
                              ['nothing', v.q2Nothing],
                              ['addCase', v.q2AddCase],
                              ['newMethod', v.q2NewMethod],
                            ] as const
                          ).map(([id, text]) => (
                            <ChoiceButton
                              key={id}
                              selected={builder === 'ready' && id === 'nothing'}
                              color={METHODS.rocket.color}
                              text={text}
                              onClick={() => answerQ2(id)}
                              animate={shake.anim(`q2-${id}`)}
                              className={builder === 'ready' && id !== 'nothing' ? 'opacity-40' : ''}
                            />
                          ))}
                        </div>
                        {builder === 'ready' && <NewCodeChip>+ checkout.setStrategy(new RocketPayment())</NewCodeChip>}
                      </motion.div>
                    )}

                    {builder === 'ready' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-wrap items-center justify-between gap-2"
                      >
                        <span className="rounded-full border-2 border-bottle bg-bottle/10 px-2 py-0.5 text-xs font-bold text-bottle dark:border-jade dark:text-jade">
                          ✓ {v.zeroEdits}
                        </span>
                        <Button variant="primary" onClick={plugRocket} data-game="open-branch">
                          🚀 {v.openStrategy}
                        </Button>
                      </motion.div>
                    )}
                  </div>
                ) : procRows.length ? (
                  <div
                    className="rounded-lg border p-3"
                    style={{ borderColor: `${accent}55`, backgroundColor: `${accent}0d` }}
                  >
                    {level > 1 && method && (
                      <p className="mb-2 font-mono text-xs" lang="en">
                        <span className="font-semibold" style={{ color: method.color }}>
                          {method.className}
                        </span>{' '}
                        <span className="text-ink-soft">{v.implementsLabel}</span>
                      </p>
                    )}
                    <ol className="flex flex-col gap-1.5">
                      {procRows.map((row) => {
                        const status = stepStatus(row.id)
                        const failedHere = row.wrong && status !== 'pending'
                        return (
                          <motion.li
                            key={row.id}
                            animate={{ x: status === 'active' ? 4 : 0 }}
                            className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors ${
                              status === 'active' ? 'border-2 border-edge bg-card font-bold shadow-hard-sm' : 'border-2 border-transparent'
                            } ${status === 'pending' ? 'text-ink-soft/70' : ''}`}
                          >
                            {failedHere && status === 'done' ? (
                              <span className="grid size-5 shrink-0 place-items-center rounded-full border-2 border-edge bg-chili text-[10px] font-bold text-cream">
                                ✗
                              </span>
                            ) : (
                              <StatusDot status={status} color={accent} />
                            )}
                            <span className="min-w-0">{procLabel[row.proc]}</span>
                            {failedHere && (
                              <span className="ml-auto text-xs font-bold text-chili">
                                {fill(v.procNotNeeded, { method: label(customer.method) })}
                              </span>
                            )}
                            {row.proc === 'fee' && method && (
                              <span className="ml-auto text-xs tabular-nums">
                                {formatNumber(method.rate * 100, lang)}%
                                {status !== 'pending' && <> → {formatTaka(fee, lang)}</>}
                              </span>
                            )}
                          </motion.li>
                        )
                      })}
                    </ol>
                    {receipt}
                  </div>
                ) : (
                  <p className="rounded-lg border-2 border-dashed border-edge/40 px-3 py-5 text-center text-sm text-ink-soft">
                    {level === 1 ? v.pickSteps : v.noStrategy}
                  </p>
                )}
              </Node>
            </motion.div>
          )}
        </AnimatePresence>
      </Stage>

      <Caption label={v.whatsHappening} text={caption} stepKey={`${captionKey}-${lang}-${custIdx}`} />

      {outcome && !levelDone && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
          <Button variant="primary" onClick={afterOutcome} data-game="after-outcome">
            {outcome === 'fail' ? `↻ ${v.tryAgain}` : isLastCustomer ? `🏁 ${v.finishLevel}` : `${v.nextCustomer} →`}
          </Button>
        </motion.div>
      )}

      {!levelDone && (
        <StepControls
          player={controls}
          playLabel={`💳 ${v.payButton}`}
          disabled={(level === 1 ? !ticks.length : strategy !== wanted) || outcome !== null || builder !== null}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-soft">
        <p>* {v.feeNote}</p>
        <Button variant="ghost" onClick={restartGame} className="px-2 py-0.5 text-xs">
          ↺ {v.restart}
        </Button>
      </div>
    </div>
  )
}
