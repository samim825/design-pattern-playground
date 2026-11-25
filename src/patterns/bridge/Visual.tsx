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
import type { CodeView, Lang, VisualProps } from '@/types/pattern'
import type { BridgeContent } from './content.en'

/*
 * "Haat Bazar notifications": a 3-level game.
 *   Level 1  no pattern: one class per type × channel pair; the learner picks (or copy-pastes) the pair class (`without`)
 *   Level 2  Bridge: the learner picks a message type (Abstraction) and a channel (Implementor) separately (`main`)
 *   Level 3  the learner builds WhatsAppChannel: 1 new class, every old type uses it, 0 old lines edited (`with`)
 * Every turn is a step timeline, so the code panel lights up in sync.
 */

type Labels = BridgeContent['visual']
type LabelKey = keyof Labels
type MsgType = 'otp' | 'promo' | 'alert'
type Chan = 'sms' | 'email' | 'push' | 'whatsapp'
interface Pair {
  type: MsgType
  channel: Chan
}

/* ------------------------------------------------------------------ */
/* Scenario data                                                       */
/* ------------------------------------------------------------------ */

const TYPES: MsgType[] = ['otp', 'promo', 'alert']
const TYPE: Record<MsgType, { cls: string; short: string; icon: string; color: string; msg: LabelKey }> = {
  otp: { cls: 'OtpNotification', short: 'Otp', icon: '🔑', color: '#0F766E', msg: 'msgOtp' },
  promo: { cls: 'PromoNotification', short: 'Promo', icon: '🎁', color: '#BE185D', msg: 'msgPromo' },
  alert: { cls: 'AlertNotification', short: 'Alert', icon: '🚚', color: '#C2410C', msg: 'msgAlert' },
}
const CHAN: Record<Chan, { cls: string; short: string; icon: string; color: string; gateway: string }> = {
  sms: { cls: 'SmsChannel', short: 'Sms', icon: '💬', color: '#2563EB', gateway: 'smsGateway' },
  email: { cls: 'EmailChannel', short: 'Email', icon: '📧', color: '#92400E', gateway: 'mailer' },
  push: { cls: 'PushChannel', short: 'Push', icon: '🔔', color: '#7C3AED', gateway: 'push' },
  whatsapp: { cls: 'WhatsAppChannel', short: 'WhatsApp', icon: '🟢', color: '#128C7E', gateway: 'whatsapp' },
}
const pairClass = (p: Pair) => `${TYPE[p.type].short}${CHAN[p.channel].short}`
const samePair = (a: Pair, b: Pair) => a.type === b.type && a.channel === b.channel

interface Turn extends Pair {
  name: LabelKey
  emoji: string
  amount: number
  /** The OTP shown in the message (OTP turns only). */
  code: string
  /** Level 1: the pair classes offered (existing ones, or "write it" if missing). */
  options?: Pair[]
}

const TURNS: Record<Level, Turn[]> = {
  1: [
    {
      name: 'nusrat',
      emoji: '👩',
      amount: 1250,
      type: 'otp',
      channel: 'sms',
      code: '4821',
      options: [
        { type: 'otp', channel: 'sms' },
        { type: 'promo', channel: 'email' },
      ],
    },
    {
      name: 'karim',
      emoji: '🧔',
      amount: 850,
      type: 'alert',
      channel: 'push',
      code: '',
      options: [
        { type: 'otp', channel: 'sms' },
        { type: 'alert', channel: 'push' },
        { type: 'promo', channel: 'email' },
      ],
    },
    {
      name: 'mitu',
      emoji: '👧',
      amount: 2400,
      type: 'promo',
      channel: 'sms',
      code: '',
      options: [
        { type: 'promo', channel: 'email' },
        { type: 'otp', channel: 'sms' },
        { type: 'promo', channel: 'sms' },
        { type: 'alert', channel: 'push' },
      ],
    },
  ],
  2: [
    { name: 'nusrat', emoji: '👩', amount: 1250, type: 'alert', channel: 'email', code: '' },
    { name: 'karim', emoji: '🧔', amount: 850, type: 'otp', channel: 'push', code: '7305' },
    { name: 'mitu', emoji: '👧', amount: 2400, type: 'promo', channel: 'sms', code: '' },
  ],
  3: [
    { name: 'karim', emoji: '🧔', amount: 850, type: 'otp', channel: 'whatsapp', code: '5190' },
    { name: 'nusrat', emoji: '👩', amount: 1250, type: 'alert', channel: 'push', code: '' },
    { name: 'mitu', emoji: '👧', amount: 2400, type: 'promo', channel: 'whatsapp', code: '' },
  ],
}

/** Level 1: the pair classes that already exist before turn `idx` (each earlier turn wrote its own pair). */
const START_SHELF: Pair[] = [
  { type: 'otp', channel: 'sms' },
  { type: 'promo', channel: 'email' },
]
function shelfFor(idx: number): Pair[] {
  const shelf = [...START_SHELF]
  for (const t of TURNS[1].slice(0, idx)) if (!shelf.some((p) => samePair(p, t))) shelf.push({ type: t.type, channel: t.channel })
  return shelf
}

const LEVEL_ICON: Record<Level, string> = { 1: '🧱', 2: '🌉', 3: '🟢' }
const BN_DIGITS = '০১২৩৪৫৬৭৮৯'
const digits = (s: string, lang: Lang) => (lang === 'bn' ? s.replace(/\d/g, (d) => BN_DIGITS[Number(d)]) : s)

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

type Kind = 'pick' | 'write' | 'wire' | 'send' | 'format' | 'delegate' | 'deliver' | 'result'

interface GameStep extends PlayerStep {
  kind: Kind
  caption: string
}

/** Step ids double as code-step ids: they match the `// @step:` markers in code/*.ts. */
function buildSteps(level: Level, turnIdx: number, turn: Turn, choice: Pair | null, type: MsgType | null, chan: Chan | null): GameStep[] {
  if (level === 1) {
    if (!choice) return []
    const writes = !shelfFor(turnIdx).some((p) => samePair(p, choice))
    const typeOk = choice.type === turn.type
    const chanOk = choice.channel === turn.channel
    return [
      { id: 'l1-pick', kind: 'pick', caption: 'l1-pick' },
      ...(writes ? [{ id: 'l1-write', kind: 'write' as Kind, caption: 'l1-write', duration: 1800 }] : []),
      { id: 'l1-send', kind: 'send', caption: 'l1-send' },
      { id: 'l1-format', kind: 'format', caption: typeOk ? 'l1-format-ok' : 'l1-format-bad', duration: 1500 },
      { id: 'l1-deliver', kind: 'deliver', caption: chanOk ? 'l1-deliver-ok' : 'l1-deliver-bad', duration: 1500 },
      {
        id: 'l1-result',
        kind: 'result',
        caption: !typeOk ? 'l1-fail-type' : !chanOk ? 'l1-fail-channel' : 'l1-ok',
        duration: 1100,
      },
    ]
  }
  if (type !== turn.type || chan !== turn.channel) return []
  if (chan === 'whatsapp') {
    const run = `wa-run-${type}`
    return [
      { id: 'wa-wire', codeStep: `wa-wire-${type}`, kind: 'wire', caption: 'wa-wire' },
      { id: 'wa-call', codeStep: run, kind: 'send', caption: 'send' },
      { id: 'wa-format', codeStep: run, kind: 'format', caption: 'wa-format', duration: 1500 },
      { id: 'wa-delegate', codeStep: 'wa-deliver', kind: 'delegate', caption: 'wa-delegate', duration: 1500 },
      { id: 'wa-send', kind: 'deliver', caption: 'wa-send', duration: 1500 },
      { id: 'wa-done', codeStep: run, kind: 'result', caption: 'wa-done', duration: 1000 },
    ]
  }
  return [
    { id: 'wire', kind: 'wire', caption: 'wire' },
    { id: 'send', kind: 'send', caption: 'send' },
    { id: type, kind: 'format', caption: 'format', duration: 1500 },
    { id: `delegate-${type}`, kind: 'delegate', caption: 'delegate', duration: 1500 },
    { id: chan, kind: 'deliver', caption: 'deliver', duration: 1500 },
    { id: 'done', kind: 'result', caption: 'done', duration: 1000 },
  ]
}

/* ------------------------------------------------------------------ */
/* Visual                                                              */
/* ------------------------------------------------------------------ */

export default function BridgeVisual({ content, lang, onCodeStep, onCodeView }: VisualProps<BridgeContent>) {
  const v = content.visual
  const captions: Record<string, string> = content.steps
  const label = (key: LabelKey) => v[key]

  const { progress, addCoins, completeLevel, reset: resetProgress } = useGameProgress('dpp-bridge-game')
  const shake = useShake()
  const [level, setLevel] = useState<Level>(1)
  const [turnIdx, setTurnIdx] = useState(0)
  const [results, setResults] = useState<('ok' | 'fail')[]>([])
  const [mistakes, setMistakes] = useState(0)
  const [choice, setChoice] = useState<Pair | null>(TURNS[1][0]) // level 1, message 1 is a guided tutorial
  const [pickedType, setPickedType] = useState<MsgType | null>(null)
  const [pickedChan, setPickedChan] = useState<Chan | null>(null)
  const [waBuilt, setWaBuilt] = useState(false)
  const [panel, setPanel] = useState<'q1' | 'q2' | 'ready' | null>(null)
  const [hint, setHint] = useState<{ key: string; values?: Record<string, string> } | null>(null)
  const [levelDone, setLevelDone] = useState(false)
  const [lastStars, setLastStars] = useState(0)

  const turn = TURNS[level][turnIdx]
  const steps = useMemo(
    () => buildSteps(level, turnIdx, turn, choice, pickedType, pickedChan),
    [level, turnIdx, turn, choice, pickedType, pickedChan],
  )
  const player = useStepPlayer(steps)
  const step = player.step
  const kind = step?.kind ?? null
  const busy = player.index >= 0
  const reachedKind = (k: Kind) => {
    const i = steps.findIndex((s) => s.kind === k)
    return i >= 0 && player.index >= i
  }
  const stepIs = (...kinds: Kind[]) => kind !== null && kinds.includes(kind)

  const shelf = shelfFor(turnIdx)
  const writing = level === 1 && choice !== null && !shelf.some((p) => samePair(p, choice))
  const willSucceed = level === 1 ? choice !== null && samePair(choice, turn) : true
  const outcome: 'ok' | 'fail' | null = player.done ? (willSucceed ? 'ok' : 'fail') : null
  const pendingCoins = outcome === 'ok' ? turn.amount : 0

  // What actually runs: level 1 → the picked pair class; levels 2/3 → the picked type + channel.
  const runType: MsgType | null = level === 1 ? (choice?.type ?? null) : pickedType
  const runChan: Chan | null = level === 1 ? (choice?.channel ?? null) : pickedChan
  const channels: Chan[] = level === 3 ? ['sms', 'email', 'push', 'whatsapp'] : ['sms', 'email', 'push']
  const classCount = level === 1 ? shelf.length + (writing && reachedKind('write') ? 1 : 0) : 3 + (waBuilt ? 4 : 3)
  const accent = runChan ? CHAN[runChan].color : '#0b6b4f'

  /* ---------------- code panel sync ---------------- */

  const view: CodeView =
    level === 1
      ? 'without'
      : level === 3 && (panel || pickedChan === 'whatsapp' || (turn.channel === 'whatsapp' && !levelDone))
        ? 'with'
        : 'main'
  useEffect(() => {
    onCodeView?.(view)
  }, [view, onCodeView])
  useEffect(() => () => onCodeView?.('main'), [onCodeView])

  let idleCode: string | null = null
  if (level === 1) idleCode = levelDone ? 'l1-count' : writing ? 'l1-write' : 'l1-pick'
  else if (panel === 'q1') idleCode = 'build-channel'
  else if (panel) idleCode = 'build-deliver'
  else if (pickedChan === 'whatsapp') idleCode = pickedType === 'otp' || pickedType === 'promo' ? `wa-wire-${pickedType}` : 'wa-deliver'
  else if (view === 'main' && !levelDone) idleCode = pickedType && pickedChan ? 'wire' : (pickedType ?? pickedChan)
  const codeStep = step ? (step.codeStep ?? step.id) : idleCode
  useEffect(() => {
    onCodeStep(codeStep)
  }, [codeStep, onCodeStep])

  /* ---------------- actions ---------------- */

  const resetTurn = () => {
    player.reset()
    setChoice(null)
    setPickedType(null)
    setPickedChan(null)
    setHint(null)
  }

  const startLevel = (n: Level) => {
    resetTurn()
    setLevel(n)
    setTurnIdx(0)
    setResults([])
    setMistakes(0)
    if (n === 1) setChoice(TURNS[1][0])
    setWaBuilt(false)
    setPanel(null)
    setLevelDone(false)
  }

  const restartGame = () => {
    resetProgress()
    startLevel(1)
  }

  const pickClass = (p: Pair) => {
    if (busy) return
    player.reset()
    setHint(null)
    setChoice(p)
  }

  const pickType = (t: MsgType) => {
    if (busy || panel) return
    if (t !== turn.type) {
      shake.bump(`t-${t}`)
      setMistakes((m) => m + 1)
      setHint({ key: 'wrong-type', values: { picked: label(t) } })
      return
    }
    player.reset()
    setHint(null)
    setPickedType(t)
  }

  const pickChan = (c: Chan) => {
    if (busy || panel) return
    if (c === 'whatsapp' && !waBuilt) {
      if (turn.channel === 'whatsapp') {
        setHint(null)
        setPanel('q1')
      } else {
        shake.bump(`c-${c}`)
        setHint({ key: 'wrong-channel', values: { picked: label(c) } })
      }
      return
    }
    if (turn.channel === 'whatsapp' && !waBuilt) {
      shake.bump(`c-${c}`)
      setHint({ key: 'need-build' })
      return
    }
    if (c !== turn.channel) {
      shake.bump(`c-${c}`)
      setMistakes((m) => m + 1)
      setHint({ key: 'wrong-channel', values: { picked: label(c) } })
      return
    }
    player.reset()
    setHint(null)
    setPickedChan(c)
  }

  const answerQ1 = (id: 'channel' | 'pairs' | 'edit') => {
    if (panel !== 'q1') return
    if (id === 'channel') {
      setHint(null)
      setPanel('q2')
      return
    }
    shake.bump(`q1-${id}`)
    setMistakes((m) => m + 1)
    setHint({ key: id === 'pairs' ? 'wrong-q1-pairs' : 'wrong-q1-edit' })
  }

  const answerQ2 = (id: 'how' | 'texts' | 'types') => {
    if (panel !== 'q2') return
    if (id === 'how') {
      setHint(null)
      setPanel('ready')
      return
    }
    shake.bump(`q2-${id}`)
    setMistakes((m) => m + 1)
    setHint({ key: id === 'texts' ? 'wrong-q2-texts' : 'wrong-q2-types' })
  }

  const plugWhatsApp = () => {
    player.reset()
    setWaBuilt(true)
    setPanel(null)
    setPickedChan('whatsapp')
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
      return // try the same message again
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

  const messageText = (t: MsgType) => fill(label(TYPE[t].msg), { code: digits(turn.code || '4821', lang) })
  const values: Record<string, string> = {
    name: label(turn.name),
    amount: formatTaka(turn.amount, lang),
    type: label(turn.type),
    channel: label(turn.channel),
    cls: choice ? pairClass(choice) : '',
    count: formatNumber(shelf.length + (writing ? 1 : 0), lang),
    gotType: runType ? label(runType) : '',
    gotChannel: runChan ? label(runChan) : '',
    text: runType ? messageText(runType) : '',
    typeCls: TYPE[pickedType ?? turn.type].cls,
    chanCls: CHAN[pickedChan ?? turn.channel].cls,
    classes: formatNumber(classCount, lang),
    ...(!step ? hint?.values : undefined),
  }

  let captionKey: string
  if (step) captionKey = step.caption
  else if (hint) captionKey = hint.key
  else if (levelDone) captionKey = `level${level}-done`
  else if (panel === 'q1') captionKey = 'build-q1'
  else if (panel === 'q2') captionKey = 'build-q2'
  else if (panel === 'ready') captionKey = 'build-ready'
  else if (level === 1)
    captionKey = !choice ? 'idle1' : turnIdx === 0 && results.length === 0 ? 'tutorial' : writing ? 'picked1-write' : 'picked1'
  else if (pickedType && pickedChan) captionKey = 'ready'
  else captionKey = turn.channel === 'whatsapp' && !waBuilt ? 'need-build' : 'idle2'
  const caption = fill(captions[captionKey] ?? '', values)

  /* ---------------- pieces ---------------- */

  const turnOf = fill(v.orderOf, { n: formatNumber(turnIdx + 1, lang), total: formatNumber(TURNS[level].length, lang) })
  const ready = level === 1 ? choice !== null : pickedType === turn.type && pickedChan === turn.channel
  const delivered = reachedKind('deliver')
  const pill = (icon: string, text: string, color: string) => (
    <span
      className="inline-flex max-w-full items-center gap-1 truncate rounded-full border-2 border-[#2b1d16] px-2 py-0.5 text-xs font-bold text-white"
      style={{ backgroundColor: color }}
    >
      <span aria-hidden="true">{icon}</span> {text}
    </span>
  )

  // Middle node rows: WHAT (message type) and HOW (channel / bridge field).
  const whatLit = stepIs('format')
  const howLit = level === 1 ? stepIs('deliver') : stepIs('wire', 'delegate')

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
                    {'+ OtpWhatsApp, PromoWhatsApp, ???'}
                  </code>
                </>
              )}
              {level === 2 && <p className="prose-text text-sm text-ink">{v.l2Summary}</p>}
              {level === 3 && (
                <Recap
                  title={v.recapTitle}
                  items={[
                    { icon: '🧱', text: v.recap1 },
                    { icon: '🌉', text: v.recap2 },
                    { icon: '🟢', text: v.recap3 },
                  ]}
                />
              )}
            </LevelCompleteCard>
          ) : (
            <motion.div key={`play-${level}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* ── Client: the customer + the learner's choice ─────────── */}
              <Node role={v.clientRole} title={`📱 ${v.appTitle}`} active={stepIs('pick', 'write', 'wire', 'send', 'result')} accent={accent}>
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
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-ink-soft">{v.needs}</span>
                        {pill(TYPE[turn.type].icon, label(turn.type), TYPE[turn.type].color)}
                        <span aria-hidden="true" className="text-xs font-bold text-ink-soft">
                          +
                        </span>
                        {pill(CHAN[turn.channel].icon, label(turn.channel), CHAN[turn.channel].color)}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {panel ? (
                  /* ── Level 3 builder ─────────────────────────── */
                  <div className="flex flex-col gap-3 rounded-lg border-2 border-dashed p-3" style={{ borderColor: CHAN.whatsapp.color }}>
                    <p className="font-display font-bold text-ink">🔨 {v.builderTitle}</p>
                    <div>
                      <p className="label-caps text-ink-soft">{v.builderStep1}</p>
                      <p className="mb-2 text-sm text-ink">{v.q1}</p>
                      <div role="radiogroup" aria-label={v.q1} className="grid grid-cols-1 gap-2">
                        {(
                          [
                            ['channel', v.q1Channel],
                            ['pairs', v.q1Pairs],
                            ['edit', v.q1Edit],
                          ] as const
                        ).map(([id, text]) => (
                          <ChoiceButton
                            key={id}
                            selected={panel !== 'q1' && id === 'channel'}
                            color={CHAN.whatsapp.color}
                            text={text}
                            onClick={() => answerQ1(id)}
                            animate={shake.anim(`q1-${id}`)}
                            className={panel !== 'q1' && id !== 'channel' ? 'opacity-40' : ''}
                          />
                        ))}
                      </div>
                      {panel !== 'q1' && <NewCodeChip>+ class WhatsAppChannel implements Channel</NewCodeChip>}
                    </div>

                    {panel !== 'q1' && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <p className="label-caps text-ink-soft">{v.builderStep2}</p>
                        <p className="mb-2 text-sm text-ink">{v.q2}</p>
                        <div role="radiogroup" aria-label={v.q2} className="grid grid-cols-1 gap-2">
                          {(
                            [
                              ['how', v.q2How],
                              ['texts', v.q2Texts],
                              ['types', v.q2Types],
                            ] as const
                          ).map(([id, text]) => (
                            <ChoiceButton
                              key={id}
                              selected={panel === 'ready' && id === 'how'}
                              color={CHAN.whatsapp.color}
                              text={text}
                              onClick={() => answerQ2(id)}
                              animate={shake.anim(`q2-${id}`)}
                              className={panel === 'ready' && id !== 'how' ? 'opacity-40' : ''}
                            />
                          ))}
                        </div>
                        {panel === 'ready' && <NewCodeChip>+ deliver(to, text) → whatsapp.sendMessage(…)</NewCodeChip>}
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
                        <Button variant="primary" onClick={plugWhatsApp} data-game="open-branch">
                          🟢 {v.useChannel}
                        </Button>
                      </motion.div>
                    )}
                  </div>
                ) : level === 1 ? (
                  <>
                    <p id="br-shelf-label" className="mb-1.5 label-caps text-ink-soft">
                      {v.shelfLabel}
                    </p>
                    <div role="radiogroup" aria-labelledby="br-shelf-label" className="grid grid-cols-2 gap-2">
                      {(turn.options ?? []).map((p) => {
                        const exists = shelf.some((s) => samePair(s, p))
                        const id = pairClass(p)
                        return (
                          <ChoiceButton
                            key={id}
                            selected={choice !== null && samePair(choice, p)}
                            color="#0b6b4f"
                            icon={exists ? '📄' : '✍️'}
                            text={exists ? id : `+ ${id}`}
                            onClick={() => pickClass(p)}
                            animate={shake.anim(id)}
                            mono
                            className={exists ? '' : 'border-dashed'}
                          />
                        )
                      })}
                    </div>
                    <p className="mt-1.5 text-xs text-ink-soft">{v.writeHint}</p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t-2 border-dashed border-edge/40 pt-2 text-xs text-ink-soft">
                      <span className="flex items-center gap-1.5">
                        {v.classesSoFar}
                        <motion.span
                          key={classCount}
                          initial={{ scale: 1.6 }}
                          animate={{ scale: 1 }}
                          className="font-mono text-sm font-bold text-chili tabular-nums"
                        >
                          {formatNumber(classCount, lang)}
                        </motion.span>
                      </span>
                      <span>
                        {v.allPairs} <span className="font-mono font-bold text-ink">{formatNumber(9, lang)}</span>
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <p id="br-type-label" className="mb-1.5 label-caps text-ink-soft">
                      {v.typeLabel}
                    </p>
                    <div role="radiogroup" aria-labelledby="br-type-label" className="grid grid-cols-3 gap-2">
                      {TYPES.map((t) => (
                        <ChoiceButton
                          key={t}
                          selected={pickedType === t}
                          color={TYPE[t].color}
                          icon={TYPE[t].icon}
                          text={label(t)}
                          onClick={() => pickType(t)}
                          animate={shake.anim(`t-${t}`)}
                        />
                      ))}
                    </div>
                    <p id="br-chan-label" className="mt-3 mb-1.5 label-caps text-ink-soft">
                      {v.channelLabel}
                    </p>
                    <div
                      role="radiogroup"
                      aria-labelledby="br-chan-label"
                      className={`grid gap-2 ${level === 3 ? 'grid-cols-2 min-[400px]:grid-cols-4' : 'grid-cols-3'}`}
                    >
                      {channels.map((c) => {
                        const unbuilt = c === 'whatsapp' && !waBuilt
                        return (
                          <ChoiceButton
                            key={c}
                            selected={unbuilt ? false : pickedChan === c}
                            color={CHAN[c].color}
                            icon={unbuilt ? '🔨' : CHAN[c].icon}
                            text={label(c)}
                            onClick={() => pickChan(c)}
                            animate={shake.anim(`c-${c}`)}
                            className={unbuilt ? 'border-dashed' : ''}
                          />
                        )
                      })}
                    </div>
                    <p className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t-2 border-dashed border-edge/40 pt-2 text-xs text-ink-soft">
                      <span className="font-semibold text-ink">
                        {fill(v.classMath, {
                          types: formatNumber(3, lang),
                          channels: formatNumber(channels.length - (waBuilt || level < 3 ? 0 : 1), lang),
                          sum: formatNumber(classCount, lang),
                        })}
                      </span>
                      <span className="font-bold text-chili">
                        {fill(v.vsPairs, { pairs: formatNumber(3 * (classCount - 3), lang) })}
                      </span>
                    </p>
                  </>
                )}
              </Node>

              <Connector
                label={level === 1 ? `${choice ? pairClass(choice) : '…'}.send(…)` : 'notification.send(…)'}
                down={stepIs('send')}
                up={stepIs('result') && willSucceed}
                downPacket={
                  <Packet color={accent}>
                    {turn.emoji} {label(turn.name)}
                  </Packet>
                }
                upPacket={<Packet color="#0b6b4f">✅ {formatTaka(turn.amount, lang)}</Packet>}
                runKey={player.index}
              />

              {/* ── Middle: the pair class (L1) or the Abstraction with its bridge field (L2/3) ── */}
              <Node
                role={level === 1 ? v.noPatternRole : v.abstractionRole}
                title={level === 1 ? (choice ? pairClass(choice) : '?') : pickedType ? TYPE[pickedType].cls : 'Notification'}
                active={stepIs('pick', 'write', 'wire', 'send', 'format', 'delegate') || (level === 1 && stepIs('deliver'))}
                accent={level === 1 ? '#B91C1C' : runType ? TYPE[runType].color : accent}
                mono
              >
                {level > 1 && (
                  <p className="-mt-1 mb-3 font-mono text-xs text-ink-soft" lang="en">
                    {v.extendsLabel} <span className="font-bold text-ink">Notification</span>
                  </p>
                )}
                <ul className="flex flex-col gap-1.5">
                  <motion.li
                    animate={{ x: whatLit ? 4 : 0 }}
                    className={`flex min-w-0 items-center gap-2 rounded-md border-2 px-2 py-1 ${
                      whatLit ? 'border-edge bg-card shadow-hard-sm' : 'border-transparent'
                    }`}
                  >
                    <span className="w-24 shrink-0 text-xs text-ink-soft sm:w-28">{v.whatLabel}</span>
                    {runType ? (
                      <span className="min-w-0 flex-1 truncate text-xs font-bold" style={{ color: TYPE[runType].color }}>
                        {TYPE[runType].icon} {reachedKind('format') ? `“${messageText(runType)}”` : label(runType)}
                      </span>
                    ) : (
                      <span className="text-xs text-ink-soft/70">{v.pickType}</span>
                    )}
                  </motion.li>
                  <motion.li
                    animate={{ x: howLit ? 4 : 0 }}
                    className={`flex min-w-0 items-center gap-2 rounded-md border-2 px-2 py-1 ${
                      howLit ? 'border-edge bg-card shadow-hard-sm' : 'border-transparent'
                    }`}
                  >
                    <span className="w-24 shrink-0 text-xs text-ink-soft sm:w-28">{level === 1 ? v.howLabel : `🌉 ${v.bridgeLabel}`}</span>
                    {runChan ? (
                      <code lang="en" className="min-w-0 flex-1 truncate font-mono text-[11px] font-bold sm:text-xs" style={{ color: CHAN[runChan].color }}>
                        {level === 1 ? `${CHAN[runChan].gateway}.send(…)` : CHAN[runChan].cls}
                      </code>
                    ) : (
                      <span className="text-xs text-ink-soft/70">{v.pickChannel}</span>
                    )}
                  </motion.li>
                </ul>
                {level === 1 && runType && (
                  <p className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-bold uppercase">
                    <span className="rounded border-2 border-chili/60 px-1.5 py-px text-chili">🔗 {v.weldedTag}</span>
                    <AnimatePresence>
                      {writing && reachedKind('write') && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.6 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="rounded border-2 border-maroon/60 px-1.5 py-px text-maroon dark:border-mustard/60 dark:text-mustard"
                        >
                          📋 {v.copiedTag}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </p>
                )}
              </Node>

              <Connector
                label={level === 1 ? `${runChan ? CHAN[runChan].gateway : '…'}.send(…)` : 'channel.deliver(…)'}
                down={level === 1 ? stepIs('deliver') : stepIs('delegate')}
                downPacket={
                  <Packet color={runType ? TYPE[runType].color : accent}>
                    {runType ? `${TYPE[runType].icon} ${label(runType)}` : '…'}
                  </Packet>
                }
                runKey={player.index}
              />

              {/* ── Bottom: the gateway (L1) or the ConcreteImplementor (L2/3) + the customer's phone ── */}
              <Node
                role={level === 1 ? v.serviceRole : v.implementorRole}
                title={runChan ? (level === 1 ? CHAN[runChan].gateway : CHAN[runChan].cls) : 'Channel'}
                active={stepIs('deliver', 'result')}
                accent={accent}
                mono
              >
                {level > 1 && (
                  <p className="-mt-1 mb-3 flex flex-wrap items-center gap-1.5 font-mono text-xs text-ink-soft" lang="en">
                    {v.implementsLabel} <span className="font-bold text-ink">Channel</span>
                    {runChan === 'whatsapp' && (
                      <span className="rounded bg-bottle px-1.5 py-px font-sans text-[10px] font-bold text-cream uppercase">{v.newTag}</span>
                    )}
                  </p>
                )}
                <p className="mb-1.5 label-caps text-ink-soft">📱 {v.phoneLabel}</p>
                <ul className="flex flex-col gap-1">
                  {channels.map((c) => {
                    const watching = c === turn.channel
                    const landed = delivered && c === runChan && runType !== null
                    return (
                      <li
                        key={c}
                        className={`flex min-w-0 items-center gap-2 rounded-md border-2 px-2 py-1 text-xs ${
                          watching ? 'border-dashed border-mustard bg-mustard/10' : 'border-edge/20'
                        }`}
                      >
                        <span aria-hidden="true">{CHAN[c].icon}</span>
                        <span className="w-16 shrink-0 truncate font-semibold text-ink">{label(c)}</span>
                        <AnimatePresence mode="wait">
                          {landed ? (
                            <motion.span
                              key="msg"
                              initial={{ opacity: 0, x: -16 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0 }}
                              className="min-w-0 flex-1 truncate rounded-full border-2 px-2 py-px font-semibold text-ink"
                              style={{ borderColor: TYPE[runType].color }}
                            >
                              {TYPE[runType].icon} {messageText(runType)}
                            </motion.span>
                          ) : (
                            <span className="min-w-0 flex-1" />
                          )}
                        </AnimatePresence>
                        {watching && (
                          <span className="shrink-0 text-[10px] font-bold text-ink-soft" title={v.checksHere}>
                            👀 <span className="hidden min-[400px]:inline">{v.checksHere}</span>
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ul>
                <AnimatePresence>
                  {stepIs('result') && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className={`mt-3 flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-bold ${
                        willSucceed ? 'border-bottle text-bottle dark:border-jade dark:text-jade' : 'border-chili text-chili'
                      }`}
                    >
                      <motion.span
                        aria-hidden="true"
                        className="text-2xl"
                        animate={willSucceed ? { scale: [1, 1.25, 1] } : { rotate: [0, -12, 12, -8, 0] }}
                        transition={{ duration: 0.6 }}
                      >
                        {willSucceed ? '✅' : '📭'}
                      </motion.span>
                      {willSucceed ? v.delivered : v.missed}
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
            {outcome === 'fail' ? `↻ ${v.tryAgain}` : isLastTurn ? `🏁 ${v.finishLevel}` : `${v.nextMessage} →`}
          </Button>
        </motion.div>
      )}

      {!levelDone && (
        <StepControls player={controls} playLabel={`📨 ${v.sendButton}`} disabled={!ready || outcome !== null || panel !== null} />
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
