import { AnimatePresence, motion } from 'framer-motion'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { ChoiceButton, GameHud, LevelCompleteCard, MissionBanner, NewCodeChip, Recap } from '@/components/game'
import { type Level, starsFor, useGameProgress, useShake } from '@/components/game/state'
import { Button } from '@/components/ui/Button'
import { StepControls } from '@/components/ui/StepControls'
import { Caption, Connector, Node, Packet, Stage } from '@/components/visual'
import { type PlayerStep, useStepPlayer } from '@/hooks/useStepPlayer'
import { formatNumber, formatTaka } from '@/lib/format'
import { fill } from '@/lib/template'
import type { CodeView, VisualProps } from '@/types/pattern'
import type { DecoratorContent } from './content.en'

/*
 * "Rahim mama's fuchka cart": a 3-level game.
 *   Level 1  no pattern: one subclass per combination of toppings; the learner picks (or copy-pastes)
 *            the class that matches each order; the wrong class serves the wrong plate (`without`)
 *   Level 2  Decorator: the learner wraps a plain Fuchka in one topping at a time, then watches
 *            cost() pass inward through the layers and the price grow on the way out (`main`)
 *   Level 3  the learner builds TokDoi, one new decorator; old classes untouched (`with`)
 * Every turn is a step timeline, so the code panel lights up in sync.
 */

type Labels = DecoratorContent['visual']
type LabelKey = keyof Labels
type Top = 'egg' | 'chanachur' | 'spicy' | 'tokdoi'

/* ------------------------------------------------------------------ */
/* Scenario data                                                       */
/* ------------------------------------------------------------------ */

const BASE = 60
const CORE_COLOR = '#0b6b4f'
const TOPS: Top[] = ['egg', 'chanachur', 'spicy', 'tokdoi']
const TOP: Record<Top, { cls: string; part: string; icon: string; price: number; color: string }> = {
  egg: { cls: 'Egg', part: 'Egg', icon: '🥚', price: 20, color: '#B45309' },
  chanachur: { cls: 'Chanachur', part: 'Chanachur', icon: '🥜', price: 10, color: '#7C3AED' },
  spicy: { cls: 'ExtraSpicy', part: 'Spicy', icon: '🌶️', price: 5, color: '#B91C1C' },
  tokdoi: { cls: 'TokDoi', part: 'TokDoi', icon: '🥣', price: 30, color: '#0F766E' },
}

const sorted = (tops: Top[]) => [...tops].sort((a, b) => TOPS.indexOf(a) - TOPS.indexOf(b))
const sameMix = (a: Top[], b: Top[]) => sorted(a).join() === sorted(b).join()
const countOf = (tops: Top[], t: Top) => tops.filter((x) => x === t).length
const priceOf = (tops: Top[]) => BASE + tops.reduce((s, t) => s + TOP[t].price, 0)
const comboClass = (tops: Top[]) => `FuchkaWith${sorted(tops).map((t) => TOP[t].part).join('And')}`

interface Turn {
  name: LabelKey
  emoji: string
  /** The toppings the customer wants (a topping may repeat: double egg). */
  want: Top[]
  /** Level 1: the combination classes offered (existing ones, or "copy-paste it" if missing). */
  options?: Top[][]
}

const TURNS: Record<Level, Turn[]> = {
  1: [
    { name: 'nusrat', emoji: '👩', want: ['egg'], options: [['egg'], ['spicy']] },
    { name: 'karim', emoji: '🧔', want: ['egg', 'spicy'], options: [['egg'], ['spicy'], ['egg', 'spicy']] },
    {
      name: 'mitu',
      emoji: '👧',
      want: ['chanachur', 'spicy'],
      options: [['spicy'], ['egg', 'spicy'], ['chanachur'], ['chanachur', 'spicy']],
    },
  ],
  2: [
    { name: 'nusrat', emoji: '👩', want: ['egg', 'spicy'] },
    { name: 'karim', emoji: '🧔', want: ['egg', 'chanachur', 'spicy'] },
    { name: 'mitu', emoji: '👧', want: ['egg', 'egg', 'chanachur'] },
  ],
  3: [
    { name: 'tania', emoji: '👩‍🎓', want: ['tokdoi', 'chanachur'] },
    { name: 'nusrat', emoji: '👩', want: ['egg', 'tokdoi'] },
    { name: 'karim', emoji: '🧔', want: ['tokdoi', 'egg', 'spicy'] },
  ],
}

/** Level 1: the combination classes that exist before turn `idx` (each earlier order left its class behind). */
const START_SHELF: Top[][] = [['egg'], ['spicy']]
function shelfFor(idx: number): Top[][] {
  const shelf = [...START_SHELF]
  for (const t of TURNS[1].slice(0, idx)) if (!shelf.some((s) => sameMix(s, t.want))) shelf.push(t.want)
  return shelf
}
/** Plain fuchka + every subset of the 3 starting toppings. */
const ALL_COMBOS = 8

const LEVEL_ICON: Record<Level, string> = { 1: '🧱', 2: '🧅', 3: '🥣' }

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

type Kind = 'pick' | 'write' | 'serve' | 'cost' | 'describe' | 'result' | 'call' | 'in' | 'core' | 'out' | 'done'

interface GameStep extends PlayerStep {
  kind: Kind
  caption: string
  /** Levels 2/3: index into the layers (inner → outer); -1 is the plain Fuchka at the core. */
  layer?: number
  /** Price returned so far, and the price the layer got from inside. */
  sum?: number
  prev?: number
}

/** Step ids double as code-step ids: they match the `// @step:` markers in code/*.ts. */
function buildSteps(level: Level, choice: Top[] | null, writes: boolean, layers: Top[], ready: boolean): GameStep[] {
  if (level === 1) {
    if (!choice) return []
    return [
      { id: 'l1-pick', kind: 'pick', caption: 'l1-pick' },
      ...(writes ? [{ id: 'l1-write', kind: 'write' as Kind, caption: 'l1-write', duration: 1800 }] : []),
      { id: 'l1-serve', kind: 'serve', caption: 'l1-serve' },
      { id: 'l1-cost', kind: 'cost', caption: 'l1-cost', duration: 1500 },
      { id: 'l1-describe', kind: 'describe', caption: 'l1-describe', duration: 1500 },
      { id: 'l1-result', kind: 'result', caption: 'result', duration: 1100 },
    ]
  }
  if (!ready) return []
  const l3 = level === 3
  const code = (id: string, t: Top) => (l3 ? (t === 'tokdoi' ? id : 'inner-old') : id)
  const steps: GameStep[] = [{ id: 'call', codeStep: l3 ? 'call-new' : 'call', kind: 'call', caption: 'call' }]
  for (let i = layers.length - 1; i >= 0; i--) {
    const t = layers[i]
    steps.push({ id: `in-${t}`, codeStep: code(`in-${t}`, t), kind: 'in', caption: l3 && t === 'tokdoi' ? 'in-new' : 'in', layer: i, duration: 1200 })
  }
  let sum = BASE
  steps.push({ id: 'core', codeStep: l3 ? 'inner-old' : 'core', kind: 'core', caption: 'core', layer: -1, sum, duration: 1300 })
  layers.forEach((t, i) => {
    const prev = sum
    sum += TOP[t].price
    steps.push({ id: `out-${t}`, codeStep: code(`out-${t}`, t), kind: 'out', caption: l3 && t === 'tokdoi' ? 'out-new' : 'out', layer: i, prev, sum, duration: 1400 })
  })
  steps.push({ id: 'describe', codeStep: l3 ? 'describe-new' : 'describe', kind: 'describe', caption: 'describe', sum, duration: 1700 })
  steps.push({ id: 'done', codeStep: l3 ? 'done-new' : 'done', kind: 'done', caption: l3 ? 'done-new' : 'done', sum, duration: 1200 })
  return steps
}

/* ------------------------------------------------------------------ */
/* Visual                                                              */
/* ------------------------------------------------------------------ */

export default function DecoratorVisual({ content, lang, onCodeStep, onCodeView }: VisualProps<DecoratorContent>) {
  const v = content.visual
  const captions: Record<string, string> = content.steps
  const label = (key: LabelKey) => v[key]

  const { progress, addCoins, completeLevel, reset: resetProgress } = useGameProgress('dpp-decorator-game')
  const shake = useShake()
  const [level, setLevel] = useState<Level>(1)
  const [turnIdx, setTurnIdx] = useState(0)
  const [results, setResults] = useState<('ok' | 'fail')[]>([])
  const [mistakes, setMistakes] = useState(0)
  const [choice, setChoice] = useState<Top[] | null>(TURNS[1][0].want) // level 1, order 1 is a guided tutorial
  const [layers, setLayers] = useState<Top[]>([])
  const [built, setBuilt] = useState(false)
  const [panel, setPanel] = useState<'q1' | 'q2' | 'ready' | null>(null)
  const [hint, setHint] = useState<{ key: string; values?: Record<string, string> } | null>(null)
  const [levelDone, setLevelDone] = useState(false)
  const [lastStars, setLastStars] = useState(0)

  const turn = TURNS[level][turnIdx]
  const shelf = shelfFor(turnIdx)
  const writing = level === 1 && choice !== null && !shelf.some((s) => sameMix(s, choice))
  const complete = level > 1 && sameMix(layers, turn.want) && (level < 3 || built)
  const steps = useMemo(() => buildSteps(level, choice, writing, layers, complete), [level, choice, writing, layers, complete])
  const player = useStepPlayer(steps)
  const step = player.step
  const kind = step?.kind ?? null
  const busy = player.index >= 0
  const reachedKind = (k: Kind) => {
    const i = steps.findIndex((s) => s.kind === k)
    return i >= 0 && player.index >= i
  }
  const stepIs = (...kinds: Kind[]) => kind !== null && kinds.includes(kind)

  const willSucceed = level === 1 ? choice !== null && sameMix(choice, turn.want) : true
  const outcome: 'ok' | 'fail' | null = player.done ? (willSucceed ? 'ok' : 'fail') : null
  const wantPrice = priceOf(turn.want)
  const pendingCoins = outcome === 'ok' ? wantPrice : 0
  const classCount = 1 + shelf.length + (writing && reachedKind('write') ? 1 : 0)
  const decoratorCount = level === 3 && built ? 4 : 3
  const accent = level === 3 ? TOP.tokdoi.color : CORE_COLOR

  /* ---------------- code panel sync ---------------- */

  const view: CodeView = level === 1 ? 'without' : level === 2 ? 'main' : 'with'
  useEffect(() => {
    onCodeView?.(view)
  }, [view, onCodeView])
  useEffect(() => () => onCodeView?.('main'), [onCodeView])

  const lastTop = layers[layers.length - 1]
  let idleCode: string | null = null
  if (level === 1) idleCode = levelDone ? 'l1-count' : writing ? 'l1-write' : 'l1-pick'
  else if (levelDone) idleCode = null
  else if (level === 2) idleCode = lastTop ? `wrap-${lastTop}` : 'base'
  else if (panel === 'q1' || !built) idleCode = 'build-class'
  else if (panel) idleCode = 'build-cost'
  else idleCode = !lastTop ? 'base-new' : lastTop === 'tokdoi' ? 'wrap-tokdoi' : 'wrap-old'
  const codeStep = step ? (step.codeStep ?? step.id) : idleCode
  useEffect(() => {
    onCodeStep(codeStep)
  }, [codeStep, onCodeStep])

  /* ---------------- actions ---------------- */

  const resetTurn = () => {
    player.reset()
    setChoice(null)
    setLayers([])
    setHint(null)
  }

  const startLevel = (n: Level) => {
    resetTurn()
    setLevel(n)
    setTurnIdx(0)
    setResults([])
    setMistakes(0)
    if (n === 1) setChoice(TURNS[1][0].want)
    setBuilt(false)
    setPanel(null)
    setLevelDone(false)
  }

  const restartGame = () => {
    resetProgress()
    startLevel(1)
  }

  const pickClass = (tops: Top[]) => {
    if (busy) return
    player.reset()
    setHint(null)
    setChoice(tops)
  }

  const wrap = (t: Top, next: Top[]) => {
    player.reset()
    setLayers(next)
    setHint(sameMix(next, turn.want) ? null : { key: 'wrapped', values: { layer: TOP[t].cls, count: formatNumber(next.length, lang) } })
  }

  const tapTopping = (t: Top) => {
    if (busy || panel) return
    if (level === 3 && !built) {
      if (t === 'tokdoi') {
        setHint(null)
        setPanel('q1')
      } else {
        shake.bump(`t-${t}`)
        setHint({ key: 'need-build' })
      }
      return
    }
    const need = countOf(turn.want, t)
    if (need === 0 || countOf(layers, t) >= need) {
      shake.bump(`t-${t}`)
      setMistakes((m) => m + 1)
      setHint({ key: need === 0 ? 'wrong-topping' : 'wrong-enough', values: { topping: label(t), add: `+${formatTaka(TOP[t].price, lang)}` } })
      return
    }
    wrap(t, [...layers, t])
  }

  const answerQ1 = (id: 'decorator' | 'subclasses' | 'flag') => {
    if (panel !== 'q1') return
    if (id === 'decorator') {
      setHint(null)
      setPanel('q2')
      return
    }
    shake.bump(`q1-${id}`)
    setMistakes((m) => m + 1)
    setHint({ key: id === 'subclasses' ? 'wrong-q1-subclasses' : 'wrong-q1-flag' })
  }

  const answerQ2 = (id: 'inner' | 'own' | 'fixed') => {
    if (panel !== 'q2') return
    if (id === 'inner') {
      setHint(null)
      setPanel('ready')
      return
    }
    shake.bump(`q2-${id}`)
    setMistakes((m) => m + 1)
    setHint({ key: id === 'own' ? 'wrong-q2-own' : 'wrong-q2-fixed' })
  }

  const plugTokDoi = () => {
    player.reset()
    setBuilt(true)
    setPanel(null)
    setLayers([...layers, 'tokdoi'])
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
      return // serve the same order again
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

  const describe = (tops: Top[]) => [v.fuchka, ...tops.map((t) => label(t))].join(' + ')
  const wantText = [
    v.fuchka,
    ...sorted([...new Set(turn.want)]).map((t) => {
      const n = countOf(turn.want, t)
      return n > 1 ? `${label(t)} ${fill(v.times, { n: formatNumber(n, lang) })}` : label(t)
    }),
  ].join(' + ')
  const stepTop = step?.layer !== undefined && step.layer >= 0 ? layers[step.layer] : null
  const values: Record<string, string> = {
    name: label(turn.name),
    amount: formatTaka(wantPrice, lang),
    want: wantText,
    cls: choice ? comboClass(choice) : '',
    got: choice ? describe(sorted(choice)) : '',
    gotAmount: formatTaka(choice ? priceOf(choice) : 0, lang),
    classes: formatNumber(classCount, lang),
    count: formatNumber(layers.length, lang),
    layer: stepTop ? TOP[stepTop].cls : '',
    add: stepTop ? `+${formatTaka(TOP[stepTop].price, lang)}` : '',
    prev: formatTaka(step?.prev ?? 0, lang),
    sum: formatTaka(step?.sum ?? 0, lang),
    desc: describe(layers),
    ...(!step ? hint?.values : undefined),
  }

  let captionKey: string
  if (step) captionKey = step.caption === 'result' ? (willSucceed ? 'l1-ok' : 'l1-fail') : step.caption
  else if (hint) captionKey = hint.key
  else if (levelDone) captionKey = `level${level}-done`
  else if (panel === 'q1') captionKey = 'build-q1'
  else if (panel === 'q2') captionKey = 'build-q2'
  else if (panel === 'ready') captionKey = 'build-ready'
  else if (level === 1)
    captionKey = !choice ? 'idle1' : turnIdx === 0 && results.length === 0 ? 'tutorial' : writing ? 'picked1-write' : 'picked1'
  else if (complete) captionKey = 'ready'
  else captionKey = level === 3 && !built && turn.want.includes('tokdoi') ? 'need-build' : 'idle2'
  const caption = fill(captions[captionKey] ?? '', values)

  /* ---------------- pieces ---------------- */

  const turnOf = fill(v.orderOf, { n: formatNumber(turnIdx + 1, lang), total: formatNumber(TURNS[level].length, lang) })
  const ready = level === 1 ? choice !== null : complete
  const offered: Top[] = level === 3 ? TOPS : TOPS.filter((t) => t !== 'tokdoi')
  const pill = (t: Top, text: string, extra: ReactNode = null, dim = false) => (
    <span
      key={t}
      className={`inline-flex max-w-full items-center gap-1 rounded-full border-2 border-[#2b1d16] px-2 py-0.5 text-xs font-bold text-white ${dim ? 'opacity-50' : ''}`}
      style={{ backgroundColor: TOP[t].color }}
    >
      <span aria-hidden="true">{TOP[t].icon}</span>
      <span className="truncate">{text}</span>
      {extra}
    </span>
  )
  const wantPills = (marks: boolean) =>
    sorted([...new Set(turn.want)]).map((t) => {
      const n = countOf(turn.want, t)
      const text = n > 1 ? `${label(t)} ${fill(v.times, { n: formatNumber(n, lang) })}` : label(t)
      const has = choice !== null && choice.includes(t)
      return pill(t, text, marks ? <span aria-hidden="true">{has ? '✓' : '✗'}</span> : null, marks && !has)
    })

  // Levels 2/3: which layer the call is in, and which layers have answered.
  const activeLayer = stepIs('in', 'core', 'out') ? (step?.layer ?? null) : null
  const answered = (i: number) => {
    const at = steps.findIndex((s) => (i < 0 ? s.kind === 'core' : s.kind === 'out' && s.layer === i))
    return at >= 0 && player.index >= at
  }
  const waiting = (i: number) => {
    const at = steps.findIndex((s) => s.kind === 'in' && s.layer === i)
    return at >= 0 && player.index >= at && !answered(i)
  }
  const sumAt = (i: number) => priceOf(layers.slice(0, i + 1))
  const runTop: Top | null = stepTop ?? (stepIs('in', 'out') ? null : (lastTop ?? null))
  const shownTop: Top = runTop ?? 'egg'

  const movingPill = (color: string, text: string) => (
    <motion.span
      layoutId="dec-call"
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      className="shrink-0 rounded-full border-2 border-[#2b1d16] px-1.5 py-px font-mono text-[10px] font-bold whitespace-nowrap text-white"
      style={{ backgroundColor: color }}
      lang="en"
    >
      {text}
    </motion.span>
  )

  const renderLayer = (i: number): ReactNode => {
    if (i < 0) {
      const lit = activeLayer === -1
      return (
        <motion.div
          animate={{ scale: lit ? 1.02 : 1 }}
          className={`flex min-w-0 items-center gap-1.5 rounded-md border-2 px-2 py-1.5 text-xs ${
            lit ? 'border-edge bg-mustard/20 shadow-hard-sm' : 'border-bottle/60 bg-paper dark:border-jade/60'
          }`}
        >
          <span aria-hidden="true">🥟</span>
          <code lang="en" className="min-w-0 flex-1 truncate font-mono font-bold text-ink">
            Fuchka
          </code>
          <span className="shrink-0 text-[10px] font-bold text-ink-soft uppercase">{v.coreTag}</span>
          <span className="shrink-0 text-ink-soft tabular-nums">{formatTaka(BASE, lang)}</span>
          {lit && movingPill(CORE_COLOR, `↑ ${formatTaka(BASE, lang)}`)}
        </motion.div>
      )
    }
    const t = layers[i]
    const lit = activeLayer === i
    const done = answered(i)
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`min-w-0 rounded-lg border-2 p-1.5 ${lit ? 'bg-mustard/15 shadow-hard-sm' : waiting(i) ? 'bg-mustard/5' : ''}`}
        style={{ borderColor: TOP[t].color }}
      >
        <div className="mb-1 flex min-w-0 items-center gap-1.5 text-xs">
          <span aria-hidden="true">{TOP[t].icon}</span>
          <code lang="en" className="min-w-0 flex-1 truncate font-mono font-bold text-ink">
            {TOP[t].cls}
          </code>
          <span className="shrink-0 font-bold tabular-nums" style={{ color: TOP[t].color }}>
            +{formatTaka(TOP[t].price, lang)}
          </span>
          {lit && step?.kind === 'in' && movingPill(TOP[t].color, 'cost() ↓')}
          {lit && step?.kind === 'out' && movingPill(TOP[t].color, `↑ ${formatTaka(sumAt(i), lang)}`)}
          {!lit && done && (
            <span className="shrink-0 rounded-full bg-bottle px-1.5 font-bold text-cream tabular-nums">= {formatTaka(sumAt(i), lang)}</span>
          )}
        </div>
        {renderLayer(i - 1)}
      </motion.div>
    )
  }

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
                    {'+ FuchkaWithTokDoi, …, ???'}
                  </code>
                </>
              )}
              {level === 2 && <p className="prose-text text-sm text-ink">{v.l2Summary}</p>}
              {level === 3 && (
                <Recap
                  title={v.recapTitle}
                  items={[
                    { icon: '🧱', text: v.recap1 },
                    { icon: '🧅', text: v.recap2 },
                    { icon: '🥣', text: v.recap3 },
                  ]}
                />
              )}
            </LevelCompleteCard>
          ) : (
            <motion.div key={`play-${level}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* ── Client: the customer + the learner's choice ─────────── */}
              <Node role={v.clientRole} title={`🛒 ${v.cartTitle}`} active={stepIs('pick', 'write', 'serve', 'call', 'result', 'done')} accent={accent}>
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
                        <span className="shrink-0 tabular-nums">{formatTaka(wantPrice, lang)}</span>
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-ink-soft">
                          {v.wants} 🥟 {v.fuchka} +
                        </span>
                        {wantPills(false)}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {panel ? (
                  /* ── Level 3 builder ─────────────────────────── */
                  <div className="flex flex-col gap-3 rounded-lg border-2 border-dashed p-3" style={{ borderColor: TOP.tokdoi.color }}>
                    <p className="font-display font-bold text-ink">🔨 {v.builderTitle}</p>
                    <div>
                      <p className="label-caps text-ink-soft">{v.builderStep1}</p>
                      <p className="mb-2 text-sm text-ink">{v.q1}</p>
                      <div role="radiogroup" aria-label={v.q1} className="grid grid-cols-1 gap-2">
                        {(
                          [
                            ['decorator', v.q1Decorator],
                            ['subclasses', v.q1Subclasses],
                            ['flag', v.q1Flag],
                          ] as const
                        ).map(([id, text]) => (
                          <ChoiceButton
                            key={id}
                            selected={panel !== 'q1' && id === 'decorator'}
                            color={TOP.tokdoi.color}
                            text={text}
                            onClick={() => answerQ1(id)}
                            animate={shake.anim(`q1-${id}`)}
                            className={panel !== 'q1' && id !== 'decorator' ? 'opacity-40' : ''}
                          />
                        ))}
                      </div>
                      {panel !== 'q1' && <NewCodeChip>+ class TokDoi extends Topping</NewCodeChip>}
                    </div>

                    {panel !== 'q1' && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <p className="label-caps text-ink-soft">{v.builderStep2}</p>
                        <p className="mb-2 text-sm text-ink">{v.q2}</p>
                        <div role="radiogroup" aria-label={v.q2} className="grid grid-cols-1 gap-2">
                          {(
                            [
                              ['inner', v.q2Inner],
                              ['own', v.q2Own],
                              ['fixed', v.q2Fixed],
                            ] as const
                          ).map(([id, text]) => (
                            <ChoiceButton
                              key={id}
                              selected={panel === 'ready' && id === 'inner'}
                              color={TOP.tokdoi.color}
                              text={text}
                              onClick={() => answerQ2(id)}
                              animate={shake.anim(`q2-${id}`)}
                              mono
                              className={panel === 'ready' && id !== 'inner' ? 'opacity-40' : ''}
                            />
                          ))}
                        </div>
                        {panel === 'ready' && <NewCodeChip>+ cost() → inner.cost() + 30</NewCodeChip>}
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
                        <Button variant="primary" onClick={plugTokDoi} data-game="open-branch">
                          🥣 {v.useTokDoi}
                        </Button>
                      </motion.div>
                    )}
                  </div>
                ) : level === 1 ? (
                  <>
                    <p id="dc-shelf-label" className="mb-1.5 label-caps text-ink-soft">
                      {v.shelfLabel}
                    </p>
                    <div role="radiogroup" aria-labelledby="dc-shelf-label" className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
                      {(turn.options ?? []).map((tops) => {
                        const exists = shelf.some((s) => sameMix(s, tops))
                        const id = comboClass(tops)
                        return (
                          <ChoiceButton
                            key={id}
                            selected={choice !== null && sameMix(choice, tops)}
                            color={CORE_COLOR}
                            icon={exists ? '📄' : '✍️'}
                            text={exists ? id : `+ ${id}`}
                            onClick={() => pickClass(tops)}
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
                        {v.allCombos} <span className="font-mono font-bold text-ink">{formatNumber(ALL_COMBOS, lang)}</span>
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <p id="dc-top-label" className="mb-1.5 label-caps text-ink-soft">
                      {v.toppingsLabel}
                    </p>
                    <div
                      role="group"
                      aria-labelledby="dc-top-label"
                      className={`grid gap-2 ${level === 3 ? 'grid-cols-2 min-[400px]:grid-cols-4' : 'grid-cols-3'}`}
                    >
                      {offered.map((t) => {
                        const unbuilt = t === 'tokdoi' && !built
                        const have = countOf(layers, t)
                        return (
                          <ChoiceButton
                            key={t}
                            role="checkbox"
                            selected={have > 0}
                            color={TOP[t].color}
                            icon={unbuilt ? '🔨' : TOP[t].icon}
                            text={have > 1 ? `${label(t)} ${fill(v.times, { n: formatNumber(have, lang) })}` : label(t)}
                            onClick={() => tapTopping(t)}
                            animate={shake.anim(`t-${t}`)}
                            className={unbuilt ? 'border-dashed' : ''}
                          />
                        )
                      })}
                    </div>
                    <p className="mt-2 border-t-2 border-dashed border-edge/40 pt-2 text-xs font-semibold text-ink">
                      {fill(v.classMath, { n: formatNumber(2 + decoratorCount, lang) })}
                    </p>
                  </>
                )}
              </Node>

              <Connector
                label={level === 1 ? 'serve(plate)' : stepIs('describe') ? 'plate.describe()' : 'plate.cost()'}
                down={stepIs('serve', 'call', 'describe')}
                up={stepIs('result', 'done')}
                downPacket={
                  <Packet color={accent}>
                    {level === 1 ? `🧾 ${label(turn.name)}` : stepIs('describe') ? '🧾 describe()' : '🥟 cost()'}
                  </Packet>
                }
                upPacket={
                  <Packet color={willSucceed ? CORE_COLOR : '#B91C1C'}>
                    {willSucceed ? '✅' : '😵'} {formatTaka(level === 1 ? (choice ? priceOf(choice) : 0) : (step?.sum ?? 0), lang)}
                  </Packet>
                }
                runKey={player.index}
              />

              {/* ── Middle: the combination class (L1) or the Snack classes (L2/3) ── */}
              {level === 1 ? (
                <Node
                  role={v.noPatternRole}
                  title={choice ? comboClass(choice) : '?'}
                  active={stepIs('pick', 'write', 'serve', 'cost', 'describe')}
                  accent="#B91C1C"
                  mono
                >
                  <ul className="flex flex-col gap-1.5">
                    {(
                      [
                        ['cost', 'cost()', choice ? `return ${priceOf(choice)}` : '…'],
                        ['describe', 'describe()', choice ? `"${describe(sorted(choice))}"` : '…'],
                      ] as const
                    ).map(([k, method, body]) => {
                      const lit = stepIs(k)
                      return (
                        <motion.li
                          key={k}
                          animate={{ x: lit ? 4 : 0 }}
                          className={`flex min-w-0 items-center gap-2 rounded-md border-2 px-2 py-1 text-xs ${
                            lit ? 'border-edge bg-card shadow-hard-sm' : 'border-transparent'
                          }`}
                        >
                          <code lang="en" className="w-20 shrink-0 font-mono font-bold text-ink">
                            {method}
                          </code>
                          <code className="min-w-0 flex-1 truncate font-mono text-ink-soft">{body}</code>
                        </motion.li>
                      )
                    })}
                  </ul>
                  {choice && (
                    <p className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-bold uppercase">
                      <span className="rounded border-2 border-chili/60 px-1.5 py-px text-chili">🔒 {v.hardcodedTag}</span>
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
              ) : (
                <Node role={v.componentRole} title="Snack" active={stepIs('call', 'describe', 'done')} accent={accent} mono>
                  <p className="-mt-1 mb-3 font-mono text-xs text-ink-soft" lang="en">
                    cost() · describe()
                  </p>
                  <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
                    <Node role={v.concreteComponentRole} title="Fuchka" active={stepIs('core')} mono className="!p-2">
                      <code lang="en" className="block truncate font-mono text-[11px] text-ink-soft">
                        return {BASE}
                      </code>
                    </Node>
                    <Node role={v.decoratorRole} title="Topping" active={stepIs('in', 'out')} accent={accent} mono className="!p-2">
                      <code lang="en" className="block truncate font-mono text-[11px] text-ink-soft">
                        inner: Snack
                      </code>
                    </Node>
                    <Node
                      role={v.concreteDecoratorRole}
                      title={TOP[shownTop].cls}
                      active={stepIs('in', 'out')}
                      accent={TOP[shownTop].color}
                      mono
                      className="!p-2 min-[400px]:col-span-2"
                    >
                      <div className={`grid grid-cols-2 gap-1.5 ${level === 2 ? 'min-[400px]:grid-cols-3' : ''}`}>
                        {offered.map((t) => {
                          const unbuilt = t === 'tokdoi' && !built
                          const lit = stepIs('in', 'out') && stepTop === t
                          return (
                            <span
                              key={t}
                              lang="en"
                              className={`flex min-w-0 items-center gap-1 rounded-md border-2 px-1.5 py-0.5 font-mono text-[11px] ${
                                lit ? 'border-edge bg-mustard/20 font-bold text-ink shadow-hard-sm' : unbuilt ? 'border-dashed border-edge/40 text-ink-soft' : 'border-edge/30 text-ink'
                              }`}
                            >
                              <span aria-hidden="true">{unbuilt ? '🔨' : TOP[t].icon}</span>
                              <span className="min-w-0 flex-1 truncate">{TOP[t].cls}</span>
                              {t === 'tokdoi' && built ? (
                                <span className="shrink-0 rounded bg-bottle px-1 font-sans text-[9px] font-bold text-cream uppercase">{v.newTag}</span>
                              ) : (
                                <span className="shrink-0 text-ink-soft">+{TOP[t].price}</span>
                              )}
                            </span>
                          )
                        })}
                      </div>
                    </Node>
                  </div>
                </Node>
              )}

              <Connector
                label={level === 1 ? 'return …' : 'inner.cost()'}
                down={level === 1 ? stepIs('cost', 'describe') : stepIs('in')}
                up={level === 1 ? false : stepIs('core', 'out')}
                downPacket={
                  level === 1 ? (
                    <Packet color="#B91C1C">{stepIs('cost') ? `🔒 ${formatTaka(choice ? priceOf(choice) : 0, lang)}` : '🔒 "…"'}</Packet>
                  ) : (
                    <Packet color={stepTop ? TOP[stepTop].color : accent}>
                      {stepTop ? `${TOP[stepTop].icon} ${TOP[stepTop].cls}` : ''} → inner
                    </Packet>
                  )
                }
                upPacket={
                  <Packet color={stepTop ? TOP[stepTop].color : CORE_COLOR}>
                    {stepIs('core') ? `🥟 ${formatTaka(BASE, lang)}` : `+${formatTaka(stepTop ? TOP[stepTop].price : 0, lang)} = ${formatTaka(step?.sum ?? 0, lang)}`}
                  </Packet>
                }
                runKey={player.index}
              />

              {/* ── Bottom: the served plate (L1) or the wrapped plate object (L2/3) ── */}
              {level === 1 ? (
                <Node role={v.plateRole} title="plate" active={stepIs('cost', 'describe', 'result')} accent={accent} mono>
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="w-16 shrink-0 font-semibold text-ink-soft">{v.ordered}</span>
                      {wantPills(reachedKind('describe'))}
                    </div>
                    <div className="flex min-h-7 flex-wrap items-center gap-1.5">
                      <span className="w-16 shrink-0 font-semibold text-ink-soft">{v.served}</span>
                      <AnimatePresence>
                        {reachedKind('describe') &&
                          choice &&
                          sorted(choice).map((t) => (
                            <motion.span key={t} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                              {pill(t, label(t), <span aria-hidden="true">{turn.want.includes(t) ? '✓' : '✗'}</span>)}
                            </motion.span>
                          ))}
                      </AnimatePresence>
                      {reachedKind('cost') && (
                        <span className="ml-auto font-bold text-ink tabular-nums">{formatTaka(choice ? priceOf(choice) : 0, lang)}</span>
                      )}
                    </div>
                  </div>
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
                          {willSucceed ? '✅' : '😵'}
                        </motion.span>
                        {willSucceed ? fill(v.servedOk, { amount: formatTaka(wantPrice, lang) }) : v.servedBad}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Node>
              ) : (
                <Node role={v.objectRole} title="plate" active={stepIs('in', 'core', 'out', 'describe')} accent={accent} mono>
                  {layers.length === 0 && <p className="mb-2 text-xs text-ink-soft">{v.plainPlate}</p>}
                  {renderLayer(layers.length - 1)}
                  <AnimatePresence>
                    {reachedKind('describe') && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border-2 px-3 py-2 text-sm font-bold ${
                          stepIs('done') ? 'border-bottle text-bottle dark:border-jade dark:text-jade' : 'border-edge/40 text-ink'
                        }`}
                      >
                        <motion.span
                          aria-hidden="true"
                          className="text-xl"
                          animate={stepIs('done') ? { scale: [1, 1.25, 1] } : {}}
                          transition={{ duration: 0.6 }}
                        >
                          {stepIs('done') ? '✅' : '🧾'}
                        </motion.span>
                        <span className="label-caps text-ink-soft">{v.receiptLabel}</span>
                        <span className="min-w-0">“{describe(layers)}”</span>
                        <span className="ml-auto tabular-nums">{formatTaka(priceOf(layers), lang)}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Node>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Stage>

      <Caption label={v.whatsHappening} text={caption} stepKey={`${captionKey}-${lang}-${turnIdx}-${player.index}`} />

      {outcome && !levelDone && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
          <Button variant="primary" onClick={afterOutcome} data-game="after-outcome">
            {outcome === 'fail' ? `↻ ${v.tryAgain}` : isLastTurn ? `🏁 ${v.finishLevel}` : `${v.nextOrder} →`}
          </Button>
        </motion.div>
      )}

      {!levelDone && (
        <StepControls player={controls} playLabel={`🥟 ${v.serveButton}`} disabled={!ready || outcome !== null || panel !== null} />
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
