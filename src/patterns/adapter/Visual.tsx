import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { ChoiceButton, GameHud, LevelCompleteCard, MissionBanner, NewCodeChip, Recap } from '@/components/game'
import { type Level, starsFor, useGameProgress, useShake } from '@/components/game/state'
import { Button } from '@/components/ui/Button'
import { StepControls } from '@/components/ui/StepControls'
import { Caption, Connector, Node, Packet, Stage } from '@/components/visual'
import { type PlayerStep, useStepPlayer } from '@/hooks/useStepPlayer'
import { formatNumber, formatTaka } from '@/lib/format'
import { fill } from '@/lib/template'
import type { CodeView, VisualProps } from '@/types/pattern'
import type { AdapterContent } from './content.en'

/*
 * "Rahim's Checkout": a 3-level game.
 *   Level 1  no pattern: the learner rewrites checkout() in the bank SDK's own language (code panel: `without`)
 *   Level 2  Adapter: the learner plugs a processor into Checkout; the adapter translates call, unit and reply (`main`)
 *   Level 3  the learner adds JamunaWalletAdapter for a second SDK, with 0 edits to Checkout (`with`)
 * Every turn is a step timeline, so the code panel lights up in sync.
 */

type Labels = AdapterContent['visual']
type LabelKey = keyof Labels
type Provider = 'bkash' | 'padma' | 'jamuna'
type Option = Provider | 'raw'
type Field = 'method' | 'amount' | 'result'

/* ------------------------------------------------------------------ */
/* Scenario data                                                       */
/* ------------------------------------------------------------------ */

const PROVIDERS: Record<Provider, { icon: string; color: string; cls: string; sdk: string; api: string }> = {
  bkash: { icon: '📱', color: '#E2136E', cls: 'BkashProcessor', sdk: 'bKash API', api: 'charge(amount)' },
  padma: {
    icon: '🏦',
    color: '#0F766E',
    cls: 'PadmaBankAdapter',
    sdk: 'PadmaBankSdk',
    api: 'makeTransfer({ amountInPaisa, currency, ref })',
  },
  jamuna: { icon: '👛', color: '#7C3AED', cls: 'JamunaWalletAdapter', sdk: 'JamunaWalletSdk', api: 'debit(amountText, currency): boolean' },
}

const FIELDS: Field[] = ['method', 'amount', 'result']
const FIELD_LABEL: Record<Field, LabelKey> = { method: 'fieldMethod', amount: 'fieldAmount', result: 'fieldResult' }

interface Turn {
  name: LabelKey
  emoji: string
  amount: number
  provider: Provider
  /** Level 1: which fields show the wrong option first. */
  flip?: Partial<Record<Field, boolean>>
}

const TURNS: Record<Level, Turn[]> = {
  1: [
    { name: 'nusrat', emoji: '👩', amount: 1250, provider: 'padma' },
    { name: 'karim', emoji: '🧔', amount: 3400, provider: 'padma', flip: { amount: true } },
    { name: 'mitu', emoji: '👧', amount: 780, provider: 'padma', flip: { method: true, result: true } },
  ],
  2: [
    { name: 'nusrat', emoji: '👩', amount: 1250, provider: 'padma' },
    { name: 'mitu', emoji: '👧', amount: 780, provider: 'bkash' },
    { name: 'karim', emoji: '🧔', amount: 3400, provider: 'padma' },
  ],
  3: [
    { name: 'karim', emoji: '🧔', amount: 780, provider: 'jamuna' },
    { name: 'nusrat', emoji: '👩', amount: 3400, provider: 'padma' },
    { name: 'mitu', emoji: '👧', amount: 2150, provider: 'jamuna' },
  ],
}

const LEVEL_ICON: Record<Level, string> = { 1: '🧵', 2: '🔌', 3: '👛' }

/** Level 1: the two code options for a field; index 0 is right unless flipped. */
function fieldOptions(turn: Turn, f: Field): { code: string; correct: boolean }[] {
  const options =
    f === 'method'
      ? [
          { code: 'makeTransfer({…})', correct: true },
          { code: 'pay(…)', correct: false },
        ]
      : f === 'amount'
        ? [
            { code: `${turn.amount * 100}`, correct: true },
            { code: `${turn.amount}`, correct: false },
          ]
        : [
            { code: "res.status === 'OK'", correct: true },
            { code: 'res.receipt', correct: false },
          ]
  return turn.flip?.[f] ? options.reverse() : options
}
const correctIndex = (turn: Turn, f: Field) => (turn.flip?.[f] ? 1 : 0)
const tutorialAnswers = (turn: Turn): Record<Field, number | null> => ({
  method: correctIndex(turn, 'method'),
  amount: correctIndex(turn, 'amount'),
  result: correctIndex(turn, 'result'),
})
const EMPTY_ANSWERS: Record<Field, number | null> = { method: null, amount: null, result: null }

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

type Kind = 'call' | 'field' | 'wire' | 'order' | 'client' | 'adapter' | 'translate' | 'convert' | 'reply' | 'receipt' | 'service' | 'result'

interface GameStep extends PlayerStep {
  kind: Kind
  caption: string
  field?: Field
}

/** Step ids double as code-step ids: they match the `// @step:` markers in code/*.ts. */
function buildSteps(level: Level, turn: Turn, answers: Record<Field, number | null>, plugged: Provider | null): GameStep[] {
  if (level === 1) {
    if (FIELDS.some((f) => answers[f] === null)) return []
    const firstBad = FIELDS.find((f) => answers[f] !== correctIndex(turn, f))
    return [
      { id: 'l1-call', kind: 'call', caption: 'l1-call' },
      ...FIELDS.map<GameStep>((f) => ({
        id: `l1-${f}`,
        kind: 'field',
        field: f,
        caption: `l1-${f}-${answers[f] === correctIndex(turn, f) ? 'ok' : 'bad'}`,
        duration: 1400,
      })),
      { id: 'l1-check', kind: 'result', caption: firstBad ? `l1-fail-${firstBad}` : 'l1-ok', duration: 1100 },
    ]
  }
  if (!plugged) return []
  if (plugged === 'bkash') {
    return [
      { id: 'wire', kind: 'wire', caption: 'wire' },
      { id: 'order', kind: 'order', caption: 'order' },
      { id: 'client-pay', kind: 'client', caption: 'client-pay' },
      { id: 'bkash-pay', kind: 'service', caption: 'bkash-pay', duration: 1600 },
      { id: 'done', kind: 'result', caption: 'done', duration: 1000 },
    ]
  }
  if (plugged === 'jamuna') {
    return [
      { id: 'j-wire', kind: 'wire', caption: 'j-wire' },
      { id: 'j-order', kind: 'order', caption: 'order' },
      { id: 'j-client', codeStep: 'j-order', kind: 'client', caption: 'client-pay' },
      { id: 'j-pay', kind: 'adapter', caption: 'j-pay' },
      { id: 'j-translate', kind: 'convert', caption: 'j-translate', duration: 1600 },
      { id: 'j-check', kind: 'reply', caption: 'j-check' },
      { id: 'j-receipt', kind: 'receipt', caption: 'j-receipt' },
      { id: 'j-done', kind: 'result', caption: 'j-done', duration: 1000 },
    ]
  }
  return [
    { id: 'wire', kind: 'wire', caption: 'wire' },
    { id: 'order', kind: 'order', caption: 'order' },
    { id: 'client-pay', kind: 'client', caption: 'client-pay' },
    { id: 'adapter-pay', kind: 'adapter', caption: 'adapter-pay' },
    { id: 'translate', kind: 'translate', caption: 'translate' },
    { id: 'to-paisa', kind: 'convert', caption: 'to-paisa', duration: 1600 },
    { id: 'check-status', kind: 'reply', caption: 'check-status' },
    { id: 'to-receipt', kind: 'receipt', caption: 'to-receipt' },
    { id: 'done', kind: 'result', caption: 'done', duration: 1000 },
  ]
}

/* ------------------------------------------------------------------ */
/* Visual                                                              */
/* ------------------------------------------------------------------ */

export default function AdapterVisual({ content, lang, onCodeStep, onCodeView }: VisualProps<AdapterContent>) {
  const v = content.visual
  const captions: Record<string, string> = content.steps
  const label = (key: LabelKey) => v[key]

  const { progress, addCoins, completeLevel, reset: resetProgress } = useGameProgress('dpp-adapter-game')
  const shake = useShake()
  const [level, setLevel] = useState<Level>(1)
  const [turnIdx, setTurnIdx] = useState(0)
  const [results, setResults] = useState<('ok' | 'fail')[]>([])
  const [mistakes, setMistakes] = useState(0)
  const [answers, setAnswers] = useState<Record<Field, number | null>>(tutorialAnswers(TURNS[1][0])) // guided tutorial
  const [plugged, setPlugged] = useState<Provider | null>(null)
  const [jamunaBuilt, setJamunaBuilt] = useState(false)
  const [panel, setPanel] = useState<'q1' | 'q2' | 'ready' | null>(null)
  const [hint, setHint] = useState<{ key: string; values?: Record<string, string> } | null>(null)
  const [levelDone, setLevelDone] = useState(false)
  const [lastStars, setLastStars] = useState(0)

  const turn = TURNS[level][turnIdx]
  const steps = useMemo(() => buildSteps(level, turn, answers, plugged), [level, turn, answers, plugged])
  const player = useStepPlayer(steps)
  const step = player.step
  const kind = step?.kind ?? null
  const busy = player.index >= 0
  const reachedKind = (k: Kind) => {
    const i = steps.findIndex((s) => s.kind === k)
    return i >= 0 && player.index >= i
  }
  const stepIs = (...kinds: Kind[]) => kind !== null && kinds.includes(kind)

  const firstBad = FIELDS.find((f) => answers[f] !== null && answers[f] !== correctIndex(turn, f))
  const l1Ok = FIELDS.every((f) => answers[f] === correctIndex(turn, f))
  const willSucceed = level === 1 ? l1Ok : true
  const outcome: 'ok' | 'fail' | null = player.done ? (willSucceed ? 'ok' : 'fail') : null
  const pendingCoins = outcome === 'ok' ? turn.amount : 0
  const active: Provider = level === 1 ? 'padma' : (plugged ?? turn.provider)
  const accent = PROVIDERS[active].color

  /* ---------------- code panel sync ---------------- */

  const view: CodeView =
    level === 1
      ? 'without'
      : level === 3 && (panel || plugged === 'jamuna' || (turn.provider === 'jamuna' && !levelDone))
        ? 'with'
        : 'main'
  useEffect(() => {
    onCodeView?.(view)
  }, [view, onCodeView])
  useEffect(() => () => onCodeView?.('main'), [onCodeView])

  const firstEmpty = FIELDS.find((f) => answers[f] === null)
  let idleCode: string | null = null
  if (level === 1) idleCode = levelDone ? 'l1-todo' : firstEmpty ? `l1-${firstEmpty}` : 'l1-call'
  else if (panel === 'q1') idleCode = 'build-adapter'
  else if (panel) idleCode = 'j-translate'
  else if (hint?.key === 'wrong-raw') idleCode = 'adapter-pay'
  else if (plugged === 'jamuna') idleCode = 'j-wire'
  else if (plugged && !levelDone) idleCode = 'wire'
  const codeStep = step ? (step.codeStep ?? step.id) : idleCode
  useEffect(() => {
    onCodeStep(codeStep)
  }, [codeStep, onCodeStep])

  /* ---------------- actions ---------------- */

  const resetTurn = () => {
    player.reset()
    setAnswers(EMPTY_ANSWERS)
    setPlugged(null)
    setHint(null)
  }

  const startLevel = (n: Level) => {
    resetTurn()
    setLevel(n)
    setTurnIdx(0)
    setResults([])
    setMistakes(0)
    if (n === 1) setAnswers(tutorialAnswers(TURNS[1][0]))
    setJamunaBuilt(false)
    setPanel(null)
    setLevelDone(false)
  }

  const restartGame = () => {
    resetProgress()
    startLevel(1)
  }

  const answer = (f: Field, i: number) => {
    if (busy) return
    player.reset()
    setHint(null)
    setAnswers((a) => ({ ...a, [f]: i }))
  }

  const plug = (o: Option) => {
    if (busy || panel) return
    if (o === 'raw') {
      shake.bump('raw')
      setMistakes((m) => m + 1)
      setHint({ key: 'wrong-raw' })
      return
    }
    if (o === 'jamuna' && !jamunaBuilt) {
      if (turn.provider === 'jamuna') {
        setHint(null)
        setPlugged(null)
        setPanel('q1')
      } else {
        shake.bump(o)
        setHint({ key: 'wrong-provider', values: { picked: label('jamuna') } })
      }
      return
    }
    if (turn.provider === 'jamuna' && !jamunaBuilt) {
      shake.bump(o)
      setHint({ key: 'need-build' })
      return
    }
    if (o !== turn.provider) {
      shake.bump(o)
      setMistakes((m) => m + 1)
      setHint({ key: 'wrong-provider', values: { picked: label(o) } })
      return
    }
    player.reset()
    setHint(null)
    setPlugged(o)
  }

  const answerQ1 = (id: 'adapter' | 'checkout' | 'interface') => {
    if (panel !== 'q1') return
    if (id === 'adapter') {
      setHint(null)
      setPanel('q2')
      return
    }
    shake.bump(`q1-${id}`)
    setMistakes((m) => m + 1)
    setHint({ key: id === 'checkout' ? 'wrong-q1-checkout' : 'wrong-q1-interface' })
  }

  const answerQ2 = (id: 'text' | 'paisa' | 'nothing') => {
    if (panel !== 'q2') return
    if (id === 'text') {
      setHint(null)
      setPanel('ready')
      return
    }
    shake.bump(`q2-${id}`)
    setMistakes((m) => m + 1)
    setHint({ key: id === 'paisa' ? 'wrong-q2-paisa' : 'wrong-q2-nothing' })
  }

  const plugJamuna = () => {
    player.reset()
    setJamunaBuilt(true)
    setPanel(null)
    setPlugged('jamuna')
    setHint({ key: 'build-done' })
  }

  const finishLevel = () => {
    const stars = starsFor(mistakes)
    setLastStars(stars)
    completeLevel(level, stars)
    setLevelDone(true)
  }

  const isLastTurn = turnIdx + 1 >= TURNS[level].length
  const afterOutcome = () => {
    const wasOk = outcome === 'ok'
    setResults((r) => {
      const next = [...r]
      next[turnIdx] ??= wasOk ? 'ok' : 'fail' // the first attempt counts for the dots
      return next
    })
    if (wasOk) addCoins(pendingCoins)
    resetTurn()
    if (!wasOk) {
      setMistakes((m) => m + 1)
      return // try the same order again
    }
    if (isLastTurn) finishLevel()
    else setTurnIdx(turnIdx + 1)
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

  const values: Record<string, string> = {
    name: label(turn.name),
    amount: formatTaka(turn.amount, lang),
    provider: label(turn.provider),
    processor: plugged ? `${PROVIDERS[plugged].cls}` : '',
    paisa: formatNumber(turn.amount * 100, lang),
    wrongValue: formatNumber(turn.amount, lang),
    charged: formatTaka(turn.amount / 100, lang),
    text: turn.amount.toFixed(2),
    ...(!step ? hint?.values : undefined),
  }

  let captionKey: string
  if (step) captionKey = step.caption
  else if (hint) captionKey = hint.key
  else if (levelDone) captionKey = `level${level}-done`
  else if (panel === 'q1') captionKey = 'build-q1'
  else if (panel === 'q2') captionKey = 'build-q2'
  else if (panel === 'ready') captionKey = 'build-ready'
  else if (level === 1) captionKey = firstEmpty ? 'idle1' : turnIdx === 0 && results.length === 0 ? 'tutorial' : 'picked1'
  else if (plugged === turn.provider) captionKey = 'ready'
  else captionKey = turn.provider === 'jamuna' && !jamunaBuilt ? 'need-build' : 'idle2'
  const caption = fill(captions[captionKey] ?? '', values)

  /* ---------------- pieces ---------------- */

  const turnOf = fill(v.orderOf, { n: formatNumber(turnIdx + 1, lang), total: formatNumber(TURNS[level].length, lang) })
  const ready = level === 1 ? !firstEmpty : plugged === turn.provider

  // Level 1: what the bank SDK actually received, and what happened.
  const l1Method = answers.method !== null ? fieldOptions(turn, 'method')[answers.method] : null
  const l1Amount = answers.amount !== null ? fieldOptions(turn, 'amount')[answers.amount] : null
  const bankCharged =
    level === 1
      ? l1Method?.correct
        ? l1Amount?.correct
          ? turn.amount
          : turn.amount / 100
        : null
      : turn.amount
  const failText =
    level === 1 && !willSucceed && firstBad
      ? firstBad === 'method'
        ? 'TypeError'
        : firstBad === 'amount'
          ? `${v.charged} ${formatTaka(turn.amount / 100, lang)}`
          : 'undefined'
      : ''

  // Level 2/3: the adapter's translation table.
  const rows =
    plugged === 'jamuna'
      ? [
          { inText: `pay(${turn.amount})`, outText: 'debit(…)', lit: stepIs('adapter'), done: reachedKind('adapter') },
          { inText: `${turn.amount}`, outText: `"${turn.amount.toFixed(2)}"`, lit: stepIs('convert'), done: reachedKind('convert') },
          { inText: 'Receipt', outText: 'true', lit: stepIs('reply', 'receipt'), done: reachedKind('receipt'), reply: true },
        ]
      : [
          { inText: `pay(${turn.amount})`, outText: 'makeTransfer({…})', lit: stepIs('adapter', 'translate'), done: reachedKind('translate') },
          {
            inText: `${turn.amount}`,
            outText: `amountInPaisa: ${turn.amount * 100}`,
            lit: stepIs('convert'),
            done: reachedKind('convert'),
          },
          { inText: 'Receipt', outText: "{ status: 'OK' }", lit: stepIs('reply', 'receipt'), done: reachedKind('receipt'), reply: true },
        ]

  return (
    <div className="flex flex-col gap-4">
      <GameHud
        level={level}
        progress={progress}
        pendingCoins={pendingCoins}
        gainKey={`${level}-${turnIdx}`}
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
                    {'jamuna.debit("780.00", ???)'}
                  </code>
                </>
              )}
              {level === 2 && <p className="prose-text text-sm text-ink">{v.l2Summary}</p>}
              {level === 3 && (
                <Recap
                  title={v.recapTitle}
                  items={[
                    { icon: '🧵', text: v.recap1 },
                    { icon: '🔌', text: v.recap2 },
                    { icon: '👛', text: v.recap3 },
                  ]}
                />
              )}
            </LevelCompleteCard>
          ) : (
            <motion.div key={`play-${level}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* ── Client: the order + Checkout wiring ─────────── */}
              <Node
                role={v.clientRole}
                title={`🛒 ${v.checkoutTitle}`}
                active={stepIs('call', 'wire', 'order', 'client', 'result')}
                accent={accent}
              >
                <div className="mb-3 flex items-center gap-1.5">
                  {TURNS[level].map((_, i) => {
                    const r = results[i] ?? (i === turnIdx ? outcome : null)
                    return (
                      <span
                        key={i}
                        aria-hidden="true"
                        className={`grid size-5 place-items-center rounded-full border-2 text-[10px] font-bold ${
                          r === 'ok'
                            ? 'border-edge bg-bottle text-cream'
                            : r === 'fail'
                              ? 'border-edge bg-chili text-cream'
                              : i === turnIdx
                                ? 'border-edge bg-mustard text-on-accent'
                                : 'border-dashed border-edge/40'
                        }`}
                      >
                        {r === 'ok' ? '✓' : r === 'fail' ? '✗' : ''}
                      </span>
                    )
                  })}
                  <span className="ml-auto label-caps text-ink-soft">{turnOf}</span>
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`${level}-${turnIdx}`}
                    initial={{ x: 40, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -40, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="mb-3 flex items-center gap-3 rounded-lg border-2 border-dashed border-edge/50 bg-paper p-2.5"
                  >
                    <span className="text-3xl" aria-hidden="true">
                      {turn.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-baseline justify-between gap-2 font-bold text-ink">
                        <span className="truncate">{label(turn.name)}</span>
                        <span className="shrink-0 tabular-nums">{formatTaka(turn.amount, lang)}</span>
                      </p>
                      <span
                        className="mt-1 inline-flex max-w-full items-center gap-1 truncate rounded-full border-2 border-[#2b1d16] px-2 py-0.5 text-xs font-bold text-white"
                        style={{ backgroundColor: PROVIDERS[turn.provider].color }}
                      >
                        <span aria-hidden="true">{PROVIDERS[turn.provider].icon}</span>{' '}
                        {fill(v.paysWith, { provider: label(turn.provider) })}
                      </span>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {panel ? (
                  /* ── Level 3 builder ─────────────────────────── */
                  <div className="flex flex-col gap-3 rounded-lg border-2 border-dashed p-3" style={{ borderColor: PROVIDERS.jamuna.color }}>
                    <p className="font-display font-bold text-ink">🔨 {v.builderTitle}</p>
                    <div>
                      <p className="label-caps text-ink-soft">{v.builderStep1}</p>
                      <p className="mb-2 text-sm text-ink">{v.q1}</p>
                      <div role="radiogroup" aria-label={v.q1} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {(
                          [
                            ['adapter', v.q1Adapter],
                            ['checkout', v.q1Checkout],
                            ['interface', v.q1Interface],
                          ] as const
                        ).map(([id, text]) => (
                          <ChoiceButton
                            key={id}
                            selected={panel !== 'q1' && id === 'adapter'}
                            color={PROVIDERS.jamuna.color}
                            text={text}
                            onClick={() => answerQ1(id)}
                            animate={shake.anim(`q1-${id}`)}
                            className={panel !== 'q1' && id !== 'adapter' ? 'opacity-40' : ''}
                          />
                        ))}
                      </div>
                      {panel !== 'q1' && <NewCodeChip>+ class JamunaWalletAdapter implements PaymentProcessor</NewCodeChip>}
                    </div>

                    {panel !== 'q1' && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <p className="label-caps text-ink-soft">{v.builderStep2}</p>
                        <p className="mb-2 text-sm text-ink">{v.q2}</p>
                        <div role="radiogroup" aria-label={v.q2} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          {(
                            [
                              ['text', v.q2Text],
                              ['paisa', v.q2Paisa],
                              ['nothing', v.q2Nothing],
                            ] as const
                          ).map(([id, text]) => (
                            <ChoiceButton
                              key={id}
                              selected={panel === 'ready' && id === 'text'}
                              color={PROVIDERS.jamuna.color}
                              text={text}
                              onClick={() => answerQ2(id)}
                              animate={shake.anim(`q2-${id}`)}
                              className={panel === 'ready' && id !== 'text' ? 'opacity-40' : ''}
                            />
                          ))}
                        </div>
                        {panel === 'ready' && <NewCodeChip>+ wallet.debit(amount.toFixed(2), 'BDT') → Receipt</NewCodeChip>}
                      </motion.div>
                    )}

                    {panel === 'ready' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-wrap items-center justify-between gap-2"
                      >
                        <span className="rounded-full border-2 border-bottle bg-bottle/10 px-2 py-0.5 text-xs font-bold text-bottle dark:border-jade dark:text-jade">
                          ✓ {v.zeroEdits}
                        </span>
                        <Button variant="primary" onClick={plugJamuna} data-game="open-branch">
                          👛 {v.useAdapter}
                        </Button>
                      </motion.div>
                    )}
                  </div>
                ) : level === 1 ? (
                  <>
                    <p className="mb-1.5 label-caps text-ink-soft">{v.rewriteLabel}</p>
                    <div className="flex flex-col gap-2.5">
                      {FIELDS.map((f) => (
                        <div key={f} className="flex flex-col gap-1">
                          <span className="text-xs font-semibold text-ink-soft">{label(FIELD_LABEL[f])}</span>
                          <div role="radiogroup" aria-label={label(FIELD_LABEL[f])} className="grid grid-cols-1 gap-1.5 min-[400px]:grid-cols-2">
                            {fieldOptions(turn, f).map((o, i) => (
                              <ChoiceButton
                                key={i}
                                selected={answers[f] === i}
                                color="#0b6b4f"
                                text={o.code}
                                onClick={() => answer(f, i)}
                                animate={shake.anim(`${f}-${i}`)}
                                mono
                                className="py-1.5"
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p id="ad-plug-label" className="mb-1.5 label-caps text-ink-soft">
                      {v.plugLabel}
                    </p>
                    <div role="radiogroup" aria-labelledby="ad-plug-label" className="grid grid-cols-3 gap-2">
                      <ChoiceButton
                        selected={plugged === 'bkash'}
                        color={PROVIDERS.bkash.color}
                        icon={PROVIDERS.bkash.icon}
                        text={label('bkash')}
                        onClick={() => plug('bkash')}
                        animate={shake.anim('bkash')}
                      />
                      {level === 2 && (
                        <ChoiceButton
                          selected={false}
                          color="#B91C1C"
                          icon="🧩"
                          text={v.optRawSdk}
                          onClick={() => plug('raw')}
                          animate={shake.anim('raw')}
                        />
                      )}
                      <ChoiceButton
                        selected={plugged === 'padma'}
                        color={PROVIDERS.padma.color}
                        icon="🔌"
                        text={label('padma')}
                        onClick={() => plug('padma')}
                        animate={shake.anim('padma')}
                      />
                      {level === 3 && (
                        <ChoiceButton
                          selected={jamunaBuilt ? plugged === 'jamuna' : panel !== null}
                          color={PROVIDERS.jamuna.color}
                          icon={jamunaBuilt ? '🔌' : '🔨'}
                          text={jamunaBuilt ? label('jamuna') : `${v.buildSlot}: ${label('jamuna')}`}
                          onClick={() => plug('jamuna')}
                          animate={shake.anim('jamuna')}
                          className={!jamunaBuilt ? 'border-dashed' : ''}
                        />
                      )}
                    </div>
                  </>
                )}
              </Node>

              <Connector
                label={level === 1 ? 'checkout(order)' : `pay(${turn.amount})`}
                down={stepIs('call', 'client', 'adapter')}
                up={stepIs('result') && willSucceed}
                downPacket={<Packet color={accent}>💸 {formatTaka(turn.amount, lang)}</Packet>}
                upPacket={<Packet color="#0b6b4f">🧾 Receipt</Packet>}
                runKey={player.index}
              />

              {/* ── Middle: checkout() welded to the SDK (L1) or the Adapter (L2/3) ── */}
              {level === 1 ? (
                <Node role={v.noPatternRole} title="checkout()" active={stepIs('call', 'field')} accent="#B91C1C" mono>
                  <ol className="flex flex-col gap-1">
                    {FIELDS.map((f) => {
                      const i = answers[f]
                      const o = i === null ? null : fieldOptions(turn, f)[i]
                      const idx = steps.findIndex((s) => s.id === `l1-${f}`)
                      const st = idx < 0 || player.index < idx ? 'pending' : player.index === idx ? 'active' : 'done'
                      const checked = st !== 'pending'
                      return (
                        <motion.li
                          key={f}
                          animate={{ x: st === 'active' ? 4 : 0 }}
                          className={`flex min-w-0 items-center gap-2 rounded-md border-2 px-2 py-1 ${
                            st === 'active' ? 'border-edge bg-card shadow-hard-sm' : 'border-transparent'
                          }`}
                        >
                          <span className="w-20 shrink-0 truncate text-xs text-ink-soft sm:w-28">{label(FIELD_LABEL[f])}</span>
                          <code
                            lang="en"
                            className={`min-w-0 flex-1 truncate rounded-md border-2 px-2 py-0.5 font-mono text-[11px] font-bold sm:text-xs ${
                              !o
                                ? 'border-dashed border-edge/40 text-ink-soft/50'
                                : checked && !o.correct
                                  ? 'border-chili bg-chili/10 text-chili'
                                  : checked
                                    ? 'border-bottle/60 bg-bottle/10 text-ink'
                                    : 'border-edge/60 bg-card text-ink'
                            }`}
                          >
                            {o ? o.code : '?'}
                          </code>
                          <span className="w-5 shrink-0 text-center text-sm font-bold" aria-hidden="true">
                            {checked && o ? (o.correct ? '✓' : '✗') : ''}
                          </span>
                        </motion.li>
                      )
                    })}
                  </ol>
                  <p className="mt-2 flex items-center justify-between gap-2 border-t-2 border-dashed border-edge/40 pt-2 text-xs text-ink-soft">
                    <span>{v.sdkDetails}</span>
                    <span className="font-mono font-bold text-chili tabular-nums">{formatNumber(FIELDS.length, lang)}</span>
                  </p>
                </Node>
              ) : plugged === 'bkash' ? (
                <Node role={v.processorRole} title="BkashProcessor" active={stepIs('client', 'service')} accent={accent} mono>
                  <p className="inline-flex items-center gap-1 rounded-full border-2 border-bottle/60 bg-bottle/10 px-2 py-0.5 text-xs font-bold text-bottle dark:text-jade">
                    ✓ {v.noAdapterNeeded}
                  </p>
                </Node>
              ) : (
                <Node
                  role={v.adapterRole}
                  title={panel ? 'JamunaWalletAdapter' : plugged ? PROVIDERS[plugged].cls : 'PaymentProcessor'}
                  active={stepIs('adapter', 'translate', 'convert', 'reply', 'receipt')}
                  accent={accent}
                  mono
                >
                  <p className="-mt-1 mb-3 flex flex-wrap items-center gap-1.5 font-mono text-xs text-ink-soft" lang="en">
                    {v.implementsLabel} <span className="font-bold text-ink">PaymentProcessor</span>
                    <span className="rounded border border-edge/40 px-1 py-px font-sans text-[10px] tracking-wider uppercase">
                      {v.targetTag}
                    </span>
                    {(panel || plugged === 'jamuna') && (
                      <span className="rounded bg-bottle px-1.5 py-px font-sans text-[10px] font-bold text-cream uppercase">
                        {v.newTag}
                      </span>
                    )}
                  </p>
                  {plugged ? (
                    <div className="rounded-lg border p-2.5" style={{ borderColor: `${accent}55`, backgroundColor: `${accent}0d` }}>
                      <div className="mb-1.5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-x-2 text-[10px] font-bold text-ink-soft uppercase">
                        <span>{v.inLabel}</span>
                        <span />
                        <span>{v.outLabel}</span>
                      </div>
                      <ul className="flex flex-col gap-1">
                        {rows.map((r, i) => (
                          <motion.li
                            key={i}
                            animate={{ x: r.lit ? 4 : 0 }}
                            className={`grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2 rounded-md border-2 px-1.5 py-0.5 ${
                              r.lit ? 'border-edge bg-card shadow-hard-sm' : 'border-transparent'
                            } ${!r.done && !r.lit ? 'opacity-60' : ''}`}
                          >
                            <code lang="en" className="truncate font-mono text-[11px] font-bold text-ink sm:text-xs">
                              {r.inText}
                            </code>
                            <span aria-hidden="true" className="text-xs font-bold" style={{ color: accent }}>
                              {r.reply ? '⇠' : '⇢'}
                            </span>
                            <code lang="en" className="truncate font-mono text-[11px] font-bold sm:text-xs" style={{ color: accent }}>
                              {r.outText}
                            </code>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="rounded-lg border-2 border-dashed border-edge/40 px-3 py-4 text-center text-sm text-ink-soft">
                      {v.noProcessor}
                    </p>
                  )}
                </Node>
              )}

              <Connector
                label={
                  level === 1
                    ? `padma.${l1Method?.correct === false ? 'pay' : 'makeTransfer'}(…)`
                    : plugged === 'bkash'
                      ? 'charge(amount)'
                      : plugged === 'jamuna'
                        ? 'debit(…)'
                        : 'makeTransfer(…)'
                }
                down={stepIs('field', 'translate', 'convert', 'service')}
                up={stepIs('reply')}
                downPacket={
                  <Packet color={accent}>
                    <span lang="en">
                      {level === 1
                        ? (l1Amount?.code ?? '…')
                        : plugged === 'jamuna'
                          ? `"${turn.amount.toFixed(2)}"`
                          : plugged === 'padma'
                            ? `${turn.amount * 100}`
                            : formatTaka(turn.amount, lang)}
                    </span>
                  </Packet>
                }
                upPacket={
                  <Packet color="#0b6b4f">
                    <span lang="en">{plugged === 'jamuna' ? 'true' : "status: 'OK'"}</span>
                  </Packet>
                }
                runKey={player.index}
              />

              {/* ── Bottom: the Adaptee (the bank's SDK) ─────────── */}
              <Node
                role={active === 'bkash' && level > 1 ? v.serviceRole : v.adapteeRole}
                title={PROVIDERS[active].sdk}
                active={stepIs('field', 'translate', 'convert', 'service', 'reply')}
                accent={accent}
                mono
              >
                <p className="mb-2 text-xs text-ink-soft">{v.adapteeApi}</p>
                <code
                  lang="en"
                  className="block truncate rounded-md border-2 border-edge/40 bg-paper px-2 py-1 font-mono text-[11px] font-bold text-ink sm:text-xs"
                >
                  {PROVIDERS[active].api}
                </code>
                <div className="mt-2 flex items-center justify-between gap-2 text-sm">
                  <span className="text-xs text-ink-soft">{v.charged}</span>
                  <span className="font-bold tabular-nums">
                    {reachedKind('result') && bankCharged !== null ? formatTaka(bankCharged, lang) : busy ? '…' : '—'}
                  </span>
                </div>
                <AnimatePresence>
                  {stepIs('result') && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className={`mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border-2 px-3 py-2 text-sm font-bold ${
                        willSucceed ? 'border-bottle text-bottle dark:border-jade dark:text-jade' : 'border-chili text-chili'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <motion.span
                          aria-hidden="true"
                          className="text-2xl"
                          animate={willSucceed ? { scale: [1, 1.25, 1] } : { rotate: [0, -12, 12, -8, 0] }}
                          transition={{ duration: 0.6 }}
                        >
                          {willSucceed ? '✅' : '💥'}
                        </motion.span>
                        {willSucceed ? v.paid : v.failed}
                      </span>
                      {!willSucceed && (
                        <code lang="en" className="font-mono text-xs">
                          {failText}
                        </code>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Node>
            </motion.div>
          )}
        </AnimatePresence>
      </Stage>

      <Caption label={v.whatsHappening} text={caption} stepKey={`${captionKey}-${lang}-${turnIdx}`} />

      {outcome && !levelDone && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
          <Button variant="primary" onClick={afterOutcome} data-game="after-outcome">
            {outcome === 'fail' ? `↻ ${v.tryAgain}` : isLastTurn ? `🏁 ${v.finishLevel}` : `${v.nextOrder} →`}
          </Button>
        </motion.div>
      )}

      {!levelDone && (
        <StepControls player={controls} playLabel={`💳 ${v.payButton}`} disabled={!ready || outcome !== null || panel !== null} />
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-soft">
        <p>* {v.note}</p>
        <Button variant="ghost" onClick={restartGame} className="px-2 py-0.5 text-xs">
          ↺ {v.restart}
        </Button>
      </div>
    </div>
  )
}
