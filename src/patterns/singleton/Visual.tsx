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
import type { SingletonContent } from './content.en'

/*
 * "Karim's Cash Box": a 3-level game.
 *   Level 1  no pattern: the learner hands each salesperson shopBox or new CashBox(); a new box splits the money (`without`)
 *   Level 2  Singleton: the learner picks getInstance() (new CashBox() doesn't compile); one box for everyone (`main`)
 *   Level 3  the learner writes BkashCounter, which reuses the same instance (`with`)
 * Every turn is a step timeline, so the code panel lights up in sync.
 */

type Labels = SingletonContent['visual']
type LabelKey = keyof Labels
type Choice = 'shared' | 'new' | 'get'

/* ------------------------------------------------------------------ */
/* Scenario data                                                       */
/* ------------------------------------------------------------------ */

interface Turn {
  seller: LabelKey
  emoji: string
  item: LabelKey
  amount: number
  /** Level 3: a payment at Nusrat's bKash counter instead of a sale on the floor. */
  bkash?: boolean
}

// Sales are illustrative only (the UI says so).
const TURNS: Record<Level, Turn[]> = {
  1: [
    { seller: 'rahim', emoji: '👨', item: 'saree', amount: 1500 },
    { seller: 'mitu', emoji: '👧', item: 'panjabi', amount: 1200 },
    { seller: 'rahim', emoji: '👨', item: 'threePiece', amount: 800 },
  ],
  2: [
    { seller: 'rahim', emoji: '👨', item: 'saree', amount: 1500 },
    { seller: 'mitu', emoji: '👧', item: 'panjabi', amount: 1200 },
    { seller: 'rahim', emoji: '👨', item: 'threePiece', amount: 800 },
  ],
  3: [
    { seller: 'nusrat', emoji: '👩', item: 'bkashPayment', amount: 2000, bkash: true },
    { seller: 'mitu', emoji: '👧', item: 'panjabi', amount: 1200 },
    { seller: 'nusrat', emoji: '👩', item: 'bkashPayment', amount: 600, bkash: true },
  ],
}
const baseOf = (level: Level, idx: number) => TURNS[level].slice(0, idx).reduce((sum, t) => sum + t.amount, 0)

const LEVEL_ICON: Record<Level, string> = { 1: '📦', 2: '☝️', 3: '📱' }
const BKASH = '#E2136E'

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

type Kind = 'open' | 'get' | 'check' | 'create' | 'return' | 'add' | 'count' | 'result'

interface GameStep extends PlayerStep {
  kind: Kind
  caption: string
}

/** Step ids double as code-step ids: they match the `// @step:` markers in code/*.ts. */
function buildSteps(level: Level, turnIdx: number, turn: Turn, choice: Choice | null): GameStep[] {
  if (!choice) return []
  if (level === 1) {
    return [
      { id: 'l1-open', kind: 'open', caption: 'l1-open' },
      choice === 'shared'
        ? { id: 'l1-shared', kind: 'get', caption: 'l1-shared', duration: 1500 }
        : { id: 'l1-new', kind: 'create', caption: 'l1-new', duration: 1500 },
      { id: 'l1-add', kind: 'add', caption: 'l1-add' },
      { id: 'l1-count', kind: 'count', caption: 'l1-count', duration: 1500 },
      { id: 'l1-result', codeStep: 'l1-count', kind: 'result', caption: choice === 'shared' ? 'l1-ok' : 'l1-fail', duration: 1100 },
    ]
  }
  if (choice !== 'get') return []
  if (turn.bkash) {
    return [
      { id: 'b-start', kind: 'open', caption: 'b-start' },
      { id: 'b-receive', kind: 'open', caption: 'b-receive' },
      { id: 'b-call', kind: 'get', caption: 'b-call' },
      { id: 'b-same', codeStep: 'b-call', kind: 'return', caption: 'b-same', duration: 1500 },
      { id: 'b-add', kind: 'add', caption: 'b-add' },
      { id: 'b-count', kind: 'count', caption: 'b-count' },
      { id: 'b-done', kind: 'result', caption: 'b-done', duration: 1000 },
    ]
  }
  const first = level === 2 && turnIdx === 0
  return [
    { id: 'sell', kind: 'open', caption: 'sell' },
    { id: 'call', kind: 'get', caption: 'call' },
    { id: 'check', kind: 'check', caption: first ? 'check' : 'check-exists' },
    ...(first ? [{ id: 'create', kind: 'create' as Kind, caption: 'create', duration: 1700 }] : []),
    { id: 'return', kind: 'return', caption: 'return' },
    { id: 'add', kind: 'add', caption: 'add' },
    { id: 'count', kind: 'count', caption: 'count' },
    { id: 'done', kind: 'result', caption: 'done', duration: 1000 },
  ]
}

/* ------------------------------------------------------------------ */
/* Visual                                                              */
/* ------------------------------------------------------------------ */

export default function SingletonVisual({ content, lang, onCodeStep, onCodeView }: VisualProps<SingletonContent>) {
  const v = content.visual
  const captions: Record<string, string> = content.steps
  const label = (key: LabelKey) => v[key]

  const { progress, addCoins, completeLevel, reset: resetProgress } = useGameProgress('dpp-singleton-game')
  const shake = useShake()
  const [level, setLevel] = useState<Level>(1)
  const [turnIdx, setTurnIdx] = useState(0)
  const [results, setResults] = useState<('ok' | 'fail')[]>([])
  const [mistakes, setMistakes] = useState(0)
  const [choice, setChoice] = useState<Choice | null>('shared') // level 1, sale 1 is a guided tutorial
  const [counterBuilt, setCounterBuilt] = useState(false)
  const [panel, setPanel] = useState<'q1' | 'q2' | 'ready' | null>(null)
  const [hint, setHint] = useState<{ key: string; values?: Record<string, string> } | null>(null)
  const [levelDone, setLevelDone] = useState(false)
  const [lastStars, setLastStars] = useState(0)

  const turn = TURNS[level][turnIdx]
  const base = baseOf(level, turnIdx)
  const steps = useMemo(() => buildSteps(level, turnIdx, turn, choice), [level, turnIdx, turn, choice])
  const player = useStepPlayer(steps)
  const step = player.step
  const kind = step?.kind ?? null
  const busy = player.index >= 0
  const at = (id: string) => steps.findIndex((s) => s.id === id)
  const reached = (id: string) => {
    const i = at(id)
    return i >= 0 && player.index >= i
  }
  const reachedKind = (k: Kind) => {
    const i = steps.findIndex((s) => s.kind === k)
    return i >= 0 && player.index >= i
  }

  const willSucceed = level === 1 ? choice === 'shared' : true
  const outcome: 'ok' | 'fail' | null = player.done ? (willSucceed ? 'ok' : 'fail') : null
  const pendingCoins = outcome === 'ok' ? turn.amount : 0
  const accent = turn.bkash ? BKASH : '#0b6b4f'
  const added = reachedKind('add')
  const expected = base + turn.amount

  // Where the money is.
  const box1Total = base + (added && (level > 1 || choice === 'shared') ? turn.amount : 0)
  const secondBox = level === 1 && choice === 'new' && reached('l1-new')
  const box2Total = secondBox && added ? turn.amount : 0
  const counted = box1Total
  const instanceExists = level === 3 || turnIdx > 0 || reached('create')

  /* ---------------- code panel sync ---------------- */

  const view: CodeView =
    level === 1 ? 'without' : level === 3 && (panel || (turn.bkash && !levelDone)) ? 'with' : 'main'
  useEffect(() => {
    onCodeView?.(view)
  }, [view, onCodeView])
  useEffect(() => () => onCodeView?.('main'), [onCodeView])

  let idleCode: string | null = null
  if (level === 1) idleCode = levelDone ? 'l1-todo' : choice === 'shared' ? 'l1-shared' : choice === 'new' ? 'l1-new' : 'l1-open'
  else if (panel === 'q1') idleCode = 'build-counter'
  else if (panel) idleCode = 'b-call'
  else if (hint?.key === 'wrong-new') idleCode = 'blocked'
  else if (turn.bkash && counterBuilt && !levelDone) idleCode = 'b-start'
  else if (choice === 'get' && !levelDone) idleCode = 'call'
  const codeStep = step ? (step.codeStep ?? step.id) : idleCode
  useEffect(() => {
    onCodeStep(codeStep)
  }, [codeStep, onCodeStep])

  /* ---------------- actions ---------------- */

  const resetTurn = (nextTurn?: Turn) => {
    player.reset()
    // Once built, the bKash counter always asks for the one box; no choice needed.
    setChoice(nextTurn?.bkash && counterBuilt ? 'get' : null)
    setHint(null)
  }

  const startLevel = (n: Level) => {
    player.reset()
    setHint(null)
    setLevel(n)
    setTurnIdx(0)
    setResults([])
    setMistakes(0)
    setChoice(n === 1 ? 'shared' : null)
    setCounterBuilt(false)
    setPanel(null)
    setLevelDone(false)
  }

  const restartGame = () => {
    resetProgress()
    startLevel(1)
  }

  const pick = (c: Choice) => {
    if (busy || panel) return
    if (level > 1 && c === 'new') {
      shake.bump('new')
      setMistakes((m) => m + 1)
      setHint({ key: 'wrong-new' })
      return
    }
    player.reset()
    setHint(null)
    setChoice(c)
  }

  const openBuilder = () => {
    if (busy || panel) return
    setHint(null)
    setPanel('q1')
  }

  const answerQ1 = (id: 'get' | 'new' | 'own') => {
    if (panel !== 'q1') return
    if (id === 'get') {
      setHint(null)
      setPanel('q2')
      return
    }
    shake.bump(`q1-${id}`)
    setMistakes((m) => m + 1)
    setHint({ key: id === 'new' ? 'wrong-q1-new' : 'wrong-q1-own' })
  }

  const answerQ2 = (id: 'control' | 'fast' | 'replace') => {
    if (panel !== 'q2') return
    if (id === 'control') {
      setHint(null)
      setPanel('ready')
      return
    }
    shake.bump(`q2-${id}`)
    setMistakes((m) => m + 1)
    setHint({ key: id === 'fast' ? 'wrong-q2-fast' : 'wrong-q2-replace' })
  }

  const openCounter = () => {
    player.reset()
    setCounterBuilt(true)
    setPanel(null)
    setChoice('get')
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
    if (!wasOk) {
      resetTurn(turn)
      setMistakes((m) => m + 1)
      return // try the same sale again
    }
    if (isLastTurn) {
      resetTurn()
      finishLevel()
    } else {
      resetTurn(TURNS[level][turnIdx + 1])
      setTurnIdx(turnIdx + 1)
    }
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
    name: label(turn.seller),
    item: label(turn.item),
    amount: formatTaka(turn.amount, lang),
    base: formatTaka(base, lang),
    expected: formatTaka(expected, lang),
    counted: formatTaka(level === 1 ? base + (choice === 'shared' ? turn.amount : 0) : expected, lang),
    boxTotal: formatTaka(expected, lang),
    boxName: choice === 'new' ? v.secondBox : v.shopBox,
    ...(!step ? hint?.values : undefined),
  }

  let captionKey: string
  if (step) captionKey = step.caption
  else if (hint) captionKey = hint.key
  else if (levelDone) captionKey = `level${level}-done`
  else if (panel === 'q1') captionKey = 'build-q1'
  else if (panel === 'q2') captionKey = 'build-q2'
  else if (panel === 'ready') captionKey = 'build-ready'
  else if (level === 1) captionKey = choice ? (turnIdx === 0 && results.length === 0 ? 'tutorial' : 'picked1') : 'idle1'
  else if (turn.bkash && !counterBuilt) captionKey = 'need-build'
  else if (choice === 'get') captionKey = turn.bkash ? 'build-done' : 'ready'
  else captionKey = 'idle2'
  const caption = fill(captions[captionKey] ?? '', values)

  /* ---------------- pieces ---------------- */

  const status = (id: string): Status => {
    const i = at(id)
    if (i < 0 || player.index < i) return 'pending'
    return player.index === i ? 'active' : 'done'
  }

  const shiftOf = fill(v.shiftOf, { n: formatNumber(turnIdx + 1, lang), total: formatNumber(TURNS[level].length, lang) })
  const ready = level === 1 ? choice !== null : choice === 'get'
  const blockedFlash = hint?.key === 'wrong-new'

  const cashBox = (title: string, total: number, tone: 'main' | 'stray', key: string) => (
    <motion.div
      key={key}
      layout
      initial={{ scale: 0.4, opacity: 0, y: -10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`flex min-w-0 flex-col items-center gap-0.5 rounded-lg border-2 px-3 py-2 ${
        tone === 'stray' ? 'border-chili bg-chili/10' : 'border-edge bg-card shadow-hard-sm'
      }`}
    >
      <span className="text-2xl" aria-hidden="true">
        📦
      </span>
      <code lang="en" className={`truncate font-mono text-[11px] font-bold ${tone === 'stray' ? 'text-chili' : 'text-ink'}`}>
        {title}
      </code>
      <motion.span key={total} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="text-sm font-bold tabular-nums">
        {formatTaka(total, lang)}
      </motion.span>
    </motion.div>
  )

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
                    {'partTimer.box = new CashBox() ???'}
                  </code>
                </>
              )}
              {level === 2 && <p className="prose-text text-sm text-ink">{v.l2Summary}</p>}
              {level === 3 && (
                <Recap
                  title={v.recapTitle}
                  items={[
                    { icon: '📦', text: v.recap1 },
                    { icon: '☝️', text: v.recap2 },
                    { icon: '📱', text: v.recap3 },
                  ]}
                />
              )}
            </LevelCompleteCard>
          ) : (
            <motion.div key={`play-${level}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* ── Client: the salesperson (or the bKash counter) ── */}
              <Node
                role={v.clientRole}
                title={`🛍️ ${v.floorTitle}`}
                active={kind === 'open' || kind === 'get'}
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
                  <span className="ml-auto label-caps text-ink-soft">{shiftOf}</span>
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
                        <span className="truncate">{label(turn.seller)}</span>
                        <span className="shrink-0 tabular-nums">{formatTaka(turn.amount, lang)}</span>
                      </p>
                      <p className="truncate text-xs text-ink-soft">
                        {turn.bkash ? `📱 ${v.atBkash}` : fill(v.sells, { item: label(turn.item) })}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {panel ? (
                  /* ── Level 3 builder: BkashCounter is client code ── */
                  <div className="flex flex-col gap-3 rounded-lg border-2 border-dashed p-3" style={{ borderColor: BKASH }}>
                    <p className="font-display font-bold text-ink">🔨 {v.builderTitle}</p>
                    <div>
                      <p className="label-caps text-ink-soft">{v.builderStep1}</p>
                      <p className="mb-2 text-sm text-ink">{v.q1}</p>
                      <div role="radiogroup" aria-label={v.q1} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {(
                          [
                            ['get', v.q1Get],
                            ['new', v.q1New],
                            ['own', v.q1Own],
                          ] as const
                        ).map(([id, text]) => (
                          <ChoiceButton
                            key={id}
                            selected={panel !== 'q1' && id === 'get'}
                            color={BKASH}
                            text={text}
                            onClick={() => answerQ1(id)}
                            animate={shake.anim(`q1-${id}`)}
                            mono={id !== 'own'}
                            className={panel !== 'q1' && id !== 'get' ? 'opacity-40' : ''}
                          />
                        ))}
                      </div>
                      {panel !== 'q1' && <NewCodeChip>+ class BkashCounter {'{'} … CashBox.getInstance() … {'}'}</NewCodeChip>}
                    </div>

                    {panel !== 'q1' && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <p className="label-caps text-ink-soft">{v.builderStep2}</p>
                        <p className="mb-2 text-sm text-ink">{v.q2}</p>
                        <div role="radiogroup" aria-label={v.q2} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          {(
                            [
                              ['control', v.q2Control],
                              ['fast', v.q2Fast],
                              ['replace', v.q2Replace],
                            ] as const
                          ).map(([id, text]) => (
                            <ChoiceButton
                              key={id}
                              selected={panel === 'ready' && id === 'control'}
                              color={BKASH}
                              text={text}
                              onClick={() => answerQ2(id)}
                              animate={shake.anim(`q2-${id}`)}
                              className={panel === 'ready' && id !== 'control' ? 'opacity-40' : ''}
                            />
                          ))}
                        </div>
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
                        <Button variant="primary" onClick={openCounter} data-game="open-branch">
                          📱 {v.useCounter}
                        </Button>
                      </motion.div>
                    )}
                  </div>
                ) : level === 1 ? (
                  <>
                    <p id="sg-pick-label" className="mb-1.5 label-caps text-ink-soft">
                      {fill(v.giveBox, { name: label(turn.seller) })}
                    </p>
                    <div role="radiogroup" aria-labelledby="sg-pick-label" className="grid grid-cols-2 gap-2">
                      <ChoiceButton
                        selected={choice === 'shared'}
                        color="#0b6b4f"
                        icon="📦"
                        text={v.optShared}
                        onClick={() => pick('shared')}
                        animate={shake.anim('shared')}
                      />
                      <ChoiceButton
                        selected={choice === 'new'}
                        color="#B91C1C"
                        icon="✨"
                        text={v.optNew}
                        onClick={() => pick('new')}
                        animate={shake.anim('new')}
                        mono
                      />
                    </div>
                  </>
                ) : turn.bkash && !counterBuilt ? (
                  <div role="radiogroup" aria-label={v.builderTitle} className="grid grid-cols-1 gap-2">
                    <ChoiceButton
                      selected={false}
                      color={BKASH}
                      icon="🔨"
                      text={`${v.buildSlot}: BkashCounter`}
                      onClick={openBuilder}
                      animate={shake.anim('build')}
                      className="border-dashed"
                    />
                  </div>
                ) : turn.bkash ? (
                  <p className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="rounded bg-bottle px-1.5 py-px text-[10px] font-bold text-cream uppercase">{v.newTag}</span>
                    <code lang="en" className="font-mono font-bold text-ink">
                      BkashCounter → CashBox.getInstance()
                    </code>
                  </p>
                ) : (
                  <>
                    <p id="sg-pick-label" className="mb-1.5 label-caps text-ink-soft">
                      {fill(v.howGet, { name: label(turn.seller) })}
                    </p>
                    <div role="radiogroup" aria-labelledby="sg-pick-label" className="grid grid-cols-2 gap-2">
                      <ChoiceButton
                        selected={choice === 'get'}
                        color="#0b6b4f"
                        icon="🔑"
                        text={v.optGet}
                        onClick={() => pick('get')}
                        animate={shake.anim('get')}
                        mono
                      />
                      <ChoiceButton
                        selected={false}
                        color="#B91C1C"
                        icon="✨"
                        text={v.optNew}
                        onClick={() => pick('new')}
                        animate={shake.anim('new')}
                        mono
                      />
                    </div>
                  </>
                )}
              </Node>

              <Connector
                label={level === 1 ? (choice === 'new' ? 'new CashBox()' : 'shopBox') : 'getInstance()'}
                down={kind === 'get' || kind === 'create' || kind === 'check'}
                up={kind === 'return'}
                downPacket={<Packet color={accent}>🔑 {label(turn.seller)}</Packet>}
                upPacket={<Packet color="#0b6b4f">📦 CashBox</Packet>}
                runKey={player.index}
              />

              {/* ── Middle: the boxes (L1) or the Singleton (L2/3) ── */}
              {level === 1 ? (
                <Node role={v.noPatternRole} title="class CashBox" active={kind === 'create' || kind === 'add'} accent="#B91C1C" mono>
                  <p className="mb-2 text-xs font-semibold text-ink-soft">{v.countersLabel}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <AnimatePresence>
                      {cashBox('shopBox', box1Total, 'main', 'box1')}
                      {secondBox && cashBox(v.secondBox, box2Total, 'stray', 'box2')}
                    </AnimatePresence>
                  </div>
                  <p className="mt-2 flex items-center justify-between gap-2 border-t-2 border-dashed border-edge/40 pt-2 text-xs text-ink-soft">
                    <span>{v.instancesLabel}</span>
                    <span className={`font-mono font-bold tabular-nums ${secondBox ? 'text-chili' : 'text-ink'}`}>
                      {formatNumber(secondBox ? 2 : 1, lang)}
                    </span>
                  </p>
                </Node>
              ) : (
                <Node
                  role={v.singletonRole}
                  title="CashBox"
                  active={kind === 'check' || kind === 'create' || kind === 'return' || kind === 'add'}
                  accent="#0b6b4f"
                  mono
                >
                  <p className="-mt-1 mb-3">
                    <motion.span
                      animate={blockedFlash ? { scale: [1, 1.15, 1], rotate: [0, -3, 3, 0] } : { scale: 1 }}
                      transition={{ duration: 0.5 }}
                      className={`inline-flex items-center gap-1 rounded-full border-2 px-2 py-0.5 font-mono text-xs font-bold ${
                        blockedFlash ? 'border-chili bg-chili/15 text-chili' : 'border-edge/40 text-ink-soft'
                      }`}
                      lang="en"
                    >
                      🔒 {v.privateCtor}
                    </motion.span>
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-2 rounded-lg border-2 border-dashed border-edge/50 bg-paper p-2.5">
                      <code lang="en" className="shrink-0 font-mono text-xs font-bold text-ink-soft">
                        {v.instanceSlot}:
                      </code>
                      <AnimatePresence mode="popLayout" initial={false}>
                        {instanceExists ? (
                          <div key="box" className="min-w-0 flex-1">
                            {cashBox('CashBox', box1Total, 'main', 'instance')}
                          </div>
                        ) : (
                          <motion.span
                            key="none"
                            exit={{ opacity: 0 }}
                            className="flex-1 text-center text-xs text-ink-soft/70 italic"
                          >
                            {v.notCreated}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                    <div>
                      <p className="mb-1.5 label-caps text-ink-soft">{v.getSteps}</p>
                      <ol className="flex flex-col gap-1">
                        {(
                          [
                            [v.stepCheck, turn.bkash ? 'b-call' : 'check'],
                            [v.stepCreate, 'create'],
                            [v.stepReturn, turn.bkash ? 'b-same' : 'return'],
                          ] as [string, string][]
                        ).map(([text, id]) => {
                          const skipped = id === 'create' && choice === 'get' && at('create') < 0
                          const st = status(id)
                          return (
                            <motion.li
                              key={text}
                              animate={{ x: st === 'active' ? 4 : 0 }}
                              className={`flex min-w-0 items-center gap-2 rounded-md border-2 px-2 py-0.5 text-xs ${
                                st === 'active' ? 'border-edge bg-card font-bold shadow-hard-sm' : 'border-transparent'
                              } ${st === 'pending' ? 'text-ink-soft/70' : 'text-ink'} ${skipped && busy ? 'line-through opacity-50' : ''}`}
                            >
                              <StatusDot status={st} color={accent} />
                              <span className="min-w-0 truncate">{text}</span>
                            </motion.li>
                          )
                        })}
                      </ol>
                    </div>
                  </div>
                </Node>
              )}

              <Connector
                label="add(amount)"
                down={kind === 'add'}
                up={kind === 'count'}
                downPacket={<Packet color={accent}>💵 {formatTaka(turn.amount, lang)}</Packet>}
                upPacket={<Packet color="#0b6b4f">🧮 {formatTaka(counted, lang)}</Packet>}
                runKey={player.index}
              />

              {/* ── Bottom: Karim counts the box ─────────────────── */}
              <Node role={v.ownerRole} title={`🧔 ${v.ownerTitle}`} active={kind === 'count' || kind === 'result'} accent={accent}>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg border-2 border-edge/40 bg-paper p-2">
                    <dt className="label-caps text-ink-soft">{v.salesSoFar}</dt>
                    <dd className="font-bold tabular-nums">{formatTaka(expected, lang)}</dd>
                  </div>
                  <div
                    className={`rounded-lg border-2 p-2 ${
                      reachedKind('count')
                        ? willSucceed
                          ? 'border-bottle/60 bg-bottle/10'
                          : 'border-chili bg-chili/10'
                        : 'border-edge/40 bg-paper'
                    }`}
                  >
                    <dt className="label-caps text-ink-soft">{v.counted}</dt>
                    <dd className="font-bold tabular-nums">{reachedKind('count') ? formatTaka(counted, lang) : '—'}</dd>
                  </div>
                </dl>
                <AnimatePresence>
                  {kind === 'result' && (
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
                          {willSucceed ? '✅' : '❌'}
                        </motion.span>
                        {willSucceed ? v.match : v.mismatch}
                      </span>
                      {!willSucceed && (
                        <span className="text-xs font-semibold">{fill(v.lostIn, { amount: formatTaka(turn.amount, lang) })}</span>
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
            {outcome === 'fail' ? `↻ ${v.tryAgain}` : isLastTurn ? `🏁 ${v.finishLevel}` : `${v.nextSale} →`}
          </Button>
        </motion.div>
      )}

      {!levelDone && (
        <StepControls player={controls} playLabel={`🛍️ ${v.openButton}`} disabled={!ready || outcome !== null || panel !== null} />
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
