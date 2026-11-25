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
import type { CodeView, Lang, VisualProps } from '@/types/pattern'
import type { CompositeContent } from './content.en'

/*
 * "Karim's Bazar Sodai": a 3-level game.
 *   Level 1  no pattern: billTotal() has one nested loop per level of bags; the learner picks how many run,
 *            or copy-pastes a deeper one; too few loops skip the deepest items and the bill comes out short (`without`)
 *   Level 2  Composite: Item and Bag share getPrice(); the learner picks the node to call it on and watches
 *            the recursion walk the tree (`main`)
 *   Level 3  the learner builds GiftBox (a new Composite with a ৳50 wrap fee); old code untouched (`with`)
 * Every turn is a step timeline, so the code panel lights up in sync.
 */

type Labels = CompositeContent['visual']
type LabelKey = keyof Labels
type NodeKind = 'item' | 'bag' | 'gift'

interface TNode {
  id: LabelKey
  icon: string
  kind: NodeKind
  price?: number
  children?: TNode[]
}

/* ------------------------------------------------------------------ */
/* Scenario data                                                       */
/* ------------------------------------------------------------------ */

const WRAP_FEE = 50
const GIFT_COLOR = '#B45309'
const item = (id: LabelKey, icon: string, price: number): TNode => ({ id, icon, kind: 'item', price })
const bag = (id: LabelKey, icon: string, children: TNode[]): TNode => ({ id, icon, kind: 'bag', children })
const gift = (children: TNode[]): TNode => ({ id: 'giftBox', icon: '🎁', kind: 'gift', children })

function find(node: TNode, id: string): TNode | null {
  if (node.id === id) return node
  for (const c of node.children ?? []) {
    const hit = find(c, id)
    if (hit) return hit
  }
  return null
}
function priceOf(node: TNode): number {
  if (node.kind === 'item') return node.price ?? 0
  return (node.kind === 'gift' ? WRAP_FEE : 0) + (node.children ?? []).reduce((s, c) => s + priceOf(c), 0)
}
/** Leaves with their nesting depth: the root's own items are depth 1. */
function leafDepths(node: TNode, depth = 0): { node: TNode; depth: number }[] {
  if (node.kind === 'item') return [{ node, depth }]
  return (node.children ?? []).flatMap((c) => leafDepths(c, depth + 1))
}
const depthOf = (tree: TNode) => Math.max(...leafDepths(tree).map((l) => l.depth))

interface Turn {
  name: LabelKey
  emoji: string
  tree: TNode
  /** Level 1: the loop counts offered. */
  loops?: number[]
  /** Levels 2/3: the node the customer asks about, and the nodes offered. */
  target?: LabelKey
  options?: LabelKey[]
}

const L2_TREE = bag('juteBag', '🧺', [
  bag('fishBag', '🐟', [item('ilish', '🐟', 1200), item('rui', '🐠', 450)]),
  bag('vegBag', '🥬', [item('potato', '🥔', 60), bag('chiliBag', '🌶️', [item('greenChili', '🌶️', 40)])]),
  item('eggs', '🥚', 150),
])
const L2_OPTIONS: LabelKey[] = ['juteBag', 'fishBag', 'vegBag', 'chiliBag', 'eggs']

const TURNS: Record<Level, Turn[]> = {
  1: [
    {
      name: 'nusrat',
      emoji: '👩',
      loops: [1, 2],
      tree: bag('order', '🧾', [item('eggs', '🥚', 150), bag('fishBag', '🐟', [item('ilish', '🐟', 1200), item('rui', '🐠', 450)])]),
    },
    {
      name: 'mitu',
      emoji: '👧',
      loops: [1, 2, 3],
      tree: bag('order', '🧾', [
        item('dal', '🫘', 140),
        bag('vegBag', '🥬', [item('potato', '🥔', 60), item('onion', '🧅', 90), bag('chiliBag', '🌶️', [item('greenChili', '🌶️', 40)])]),
      ]),
    },
    {
      name: 'rahim',
      emoji: '🧔',
      loops: [2, 3, 4],
      tree: bag('order', '🧾', [
        item('salt', '🧂', 40),
        bag('bigBag', '🛍️', [
          item('oil', '🫗', 190),
          bag('meatBag', '🥩', [item('beef', '🥩', 750), bag('spiceBag', '🧄', [item('garlic', '🧄', 80), item('ginger', '🫚', 60)])]),
        ]),
      ]),
    },
  ],
  2: [
    { name: 'nusrat', emoji: '👩', tree: L2_TREE, target: 'fishBag', options: L2_OPTIONS },
    { name: 'rahim', emoji: '🧔', tree: L2_TREE, target: 'vegBag', options: L2_OPTIONS },
    { name: 'karim', emoji: '🛵', tree: L2_TREE, target: 'juteBag', options: L2_OPTIONS },
  ],
  3: [
    {
      name: 'mitu',
      emoji: '👧',
      tree: bag('juteBag', '🧺', [gift([item('semai', '🍜', 120), item('sugar', '🍚', 140)]), item('milk', '🥛', 90)]),
      target: 'juteBag',
      options: ['juteBag', 'giftBox', 'semai', 'milk'],
    },
    {
      name: 'rahim',
      emoji: '🧔',
      tree: bag('juteBag', '🧺', [gift([bag('fishBag', '🐟', [item('ilish', '🐟', 1200)]), item('mishti', '🍮', 300)]), item('rice', '🌾', 400)]),
      target: 'giftBox',
      options: ['juteBag', 'giftBox', 'fishBag', 'rice'],
    },
    {
      name: 'nusrat',
      emoji: '👩',
      tree: bag('juteBag', '🧺', [
        gift([item('ghee', '🧈', 350), item('semai', '🍜', 120)]),
        bag('vegBag', '🥬', [item('potato', '🥔', 60), item('onion', '🧅', 90)]),
      ]),
      target: 'juteBag',
      options: ['juteBag', 'giftBox', 'vegBag', 'ghee'],
    },
  ],
}

/** Level 1: how many loops billTotal() already has before turn `idx` (each earlier order needed its depth). */
function loopsBefore(idx: number): number {
  return Math.max(2, ...TURNS[1].slice(0, idx).map((t) => depthOf(t.tree)))
}

const LEVEL_ICON: Record<Level, string> = { 1: '🔁', 2: '🌳', 3: '🎁' }
const LOOP_DESC: LabelKey[] = ['loopDesc1', 'loopDesc2', 'loopDesc3', 'loopDesc4']

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

type Kind = 'call' | 'write' | 'loop' | 'skip' | 'ret' | 'result' | 'make' | 'open' | 'recurse' | 'leaf' | 'btotal' | 'done'

interface Frame {
  id: LabelKey
  sum: number
}

interface GameStep extends PlayerStep {
  kind: Kind
  caption: string
  /** The node being visited (levels 2/3). */
  node?: LabelKey
  /** Level 1: loop number, leaves counted / skipped so far, items this step talks about. */
  loop?: number
  counted?: LabelKey[]
  skipped?: LabelKey[]
  items?: LabelKey[]
  added?: number
  sum?: number
  /** Levels 2/3: price returned by `node`, its caller, the call stack and finished nodes. */
  price?: number
  parent?: LabelKey
  stack?: Frame[]
  results?: Partial<Record<LabelKey, number>>
}

/** Level 1: billTotal() with `chosen` nested loops on an order that `existing` loops already handle. */
function loopSteps(tree: TNode, existing: number, chosen: number): GameStep[] {
  const leaves = leafDepths(tree)
  let sum = 0
  let counted: LabelKey[] = []
  const steps: GameStep[] = [{ id: 'l1-call', kind: 'call', caption: 'l1-call' }]
  if (chosen > existing) steps.push({ id: 'l1-write', codeStep: `l1-write-${chosen}`, kind: 'write', caption: 'l1-write', duration: 1800 })
  for (let k = 1; k <= chosen; k++) {
    const at = leaves.filter((l) => l.depth === k).map((l) => l.node)
    const added = at.reduce((s, n) => s + (n.price ?? 0), 0)
    sum += added
    counted = [...counted, ...at.map((n) => n.id)]
    steps.push({
      id: `l1-loop-${k}`,
      kind: 'loop',
      caption: at.length ? 'l1-loop' : 'l1-loop-empty',
      loop: k,
      counted,
      items: at.map((n) => n.id),
      added,
      sum,
      duration: 1500,
    })
  }
  const skipped = leaves.filter((l) => l.depth > chosen).map((l) => l.node.id)
  if (skipped.length) steps.push({ id: 'l1-skip', kind: 'skip', caption: 'l1-skip', counted, skipped, items: skipped, sum, duration: 1800 })
  steps.push({ id: 'l1-total', kind: 'ret', caption: 'l1-total', counted, skipped, sum })
  steps.push({ id: 'l1-result', kind: 'result', caption: skipped.length ? 'l1-short' : 'l1-ok', counted, skipped, sum, duration: 1100 })
  return steps
}

/** Levels 2/3: target.getPrice(), walked depth-first exactly like the recursion in the code. */
function walkSteps(level: Level, tree: TNode, targetId: LabelKey): GameStep[] {
  const target = find(tree, targetId)
  if (!target) return []
  const l3 = level === 3
  const steps: GameStep[] = []
  const stack: Frame[] = []
  const results: Partial<Record<LabelKey, number>> = {}
  const push = (s: GameStep) => steps.push({ ...s, stack: stack.map((f) => ({ ...f })), results: { ...results } })

  if (l3) push({ id: 'gift-make', kind: 'make', caption: 'gift-make', duration: 1700 })
  push({ id: 'call', codeStep: l3 ? 'gift-call' : 'call', kind: 'call', caption: 'call', node: target.id })

  const visit = (node: TNode, inGift: boolean, isTarget: boolean): number => {
    const outer = inGift ? 'gift-child' : 'gift-outer'
    if (node.kind === 'item') {
      const price = node.price ?? 0
      results[node.id] = price
      const top = stack[stack.length - 1]
      if (top) top.sum += price
      push({ id: 'leaf', codeStep: l3 ? outer : 'leaf', kind: 'leaf', caption: 'leaf', node: node.id, price, parent: top?.id, sum: top?.sum, duration: 1100 })
      return price
    }
    const isGift = node.kind === 'gift'
    stack.push({ id: node.id, sum: isGift ? WRAP_FEE : 0 })
    push({
      id: isTarget ? 'open' : 'recurse',
      codeStep: !l3 ? (isTarget ? 'open' : 'recurse') : isGift ? 'gift-open' : outer,
      kind: isTarget ? 'open' : 'recurse',
      caption: isGift ? 'gift-open' : isTarget ? 'open' : 'recurse',
      node: node.id,
      duration: 1300,
    })
    for (const c of node.children ?? []) visit(c, inGift || isGift, false)
    const frame = stack.pop()
    const total = frame?.sum ?? 0
    results[node.id] = total
    const top = stack[stack.length - 1]
    if (top) top.sum += total
    push({
      id: 'bag-total',
      codeStep: !l3 ? 'bag-total' : isGift ? 'gift-total' : outer,
      kind: 'btotal',
      caption: isGift ? 'gift-total' : 'bag-total',
      node: node.id,
      price: total,
      duration: 1100,
    })
    return total
  }
  visit(target, false, true)
  push({ id: 'done', codeStep: l3 ? 'gift-done' : 'done', kind: 'done', caption: l3 ? 'gift-done' : 'done', node: target.id, duration: 1100 })
  return steps
}

/* ------------------------------------------------------------------ */
/* The bazar tree                                                      */
/* ------------------------------------------------------------------ */

interface TreeCtx {
  label: (k: LabelKey) => string
  lang: Lang
  level: Level
  active: LabelKey | null
  picked: LabelKey | null
  counted: Set<LabelKey>
  skipped: Set<LabelKey>
  results: Partial<Record<LabelKey, number>>
  giftBuilt: boolean
  noClassYet: string
}

function TreeNode({ node, ctx }: { node: TNode; ctx: TreeCtx }) {
  const active = ctx.active === node.id
  const picked = ctx.picked === node.id
  if (node.kind === 'item') {
    const counted = ctx.counted.has(node.id) || ctx.results[node.id] !== undefined
    const skipped = ctx.skipped.has(node.id)
    return (
      <motion.li
        animate={{ x: active ? 4 : 0, scale: active ? 1.02 : 1 }}
        className={`flex min-w-0 items-center gap-1.5 rounded-md border-2 px-1.5 py-0.5 text-xs ${
          active ? 'border-edge bg-mustard/15 shadow-hard-sm' : picked ? 'border-chili' : skipped ? 'border-chili/40 border-dashed' : 'border-transparent'
        }`}
      >
        <span aria-hidden="true">{node.icon}</span>
        <span className={`min-w-0 flex-1 truncate font-semibold ${skipped ? 'text-chili line-through' : 'text-ink'}`}>{ctx.label(node.id)}</span>
        <span className="shrink-0 text-ink-soft tabular-nums">{formatTaka(node.price ?? 0, ctx.lang)}</span>
        <span
          aria-hidden="true"
          className={`w-4 shrink-0 text-center font-bold ${skipped ? 'text-chili' : 'text-bottle dark:text-jade'}`}
        >
          {skipped ? '✗' : counted ? '✓' : ''}
        </span>
      </motion.li>
    )
  }
  const isGift = node.kind === 'gift'
  const total = ctx.results[node.id]
  const unbuilt = isGift && !ctx.giftBuilt
  return (
    <motion.li
      animate={{ scale: active ? 1.01 : 1 }}
      className={`min-w-0 rounded-lg border-2 p-1.5 ${isGift ? 'border-dashed' : ''} ${
        active ? 'border-edge bg-mustard/10 shadow-hard-sm' : picked ? 'border-chili' : isGift ? '' : 'border-edge/40'
      }`}
      style={!active && !picked && isGift ? { borderColor: GIFT_COLOR } : undefined}
    >
      <div className="flex min-w-0 items-center gap-1.5 text-xs">
        <span aria-hidden="true">{node.icon}</span>
        <span className="min-w-0 flex-1 truncate font-bold text-ink">{ctx.label(node.id)}</span>
        {ctx.level > 1 && node.id !== 'order' && (
          <code lang="en" className="shrink-0 font-mono text-[10px] text-ink-soft">
            {unbuilt ? `🔨 ${ctx.noClassYet}` : isGift ? 'GiftBox' : 'Bag'}
          </code>
        )}
        <AnimatePresence>
          {total !== undefined && (
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="shrink-0 rounded-full bg-bottle px-1.5 font-bold text-cream tabular-nums"
            >
              = {formatTaka(total, ctx.lang)}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <ul className="mt-1 flex flex-col gap-1 pl-2">
        {(node.children ?? []).map((c) => (
          <TreeNode key={c.id} node={c} ctx={ctx} />
        ))}
      </ul>
    </motion.li>
  )
}

/* ------------------------------------------------------------------ */
/* Visual                                                              */
/* ------------------------------------------------------------------ */

export default function CompositeVisual({ content, lang, onCodeStep, onCodeView }: VisualProps<CompositeContent>) {
  const v = content.visual
  const captions: Record<string, string> = content.steps
  const label = (key: LabelKey) => v[key]

  const { progress, addCoins, completeLevel, reset: resetProgress } = useGameProgress('dpp-composite-game')
  const shake = useShake()
  const [level, setLevel] = useState<Level>(1)
  const [turnIdx, setTurnIdx] = useState(0)
  const [results, setResults] = useState<('ok' | 'fail')[]>([])
  const [mistakes, setMistakes] = useState(0)
  const [loopChoice, setLoopChoice] = useState<number | null>(2) // level 1, order 1 is a guided tutorial
  const [picked, setPicked] = useState<LabelKey | null>(null)
  const [giftBuilt, setGiftBuilt] = useState(false)
  const [panel, setPanel] = useState<'q1' | 'q2' | 'ready' | null>(null)
  const [hint, setHint] = useState<{ key: string; values?: Record<string, string> } | null>(null)
  const [levelDone, setLevelDone] = useState(false)
  const [lastStars, setLastStars] = useState(0)

  const turn = TURNS[level][turnIdx]
  const tree = turn.tree
  const existing = level === 1 ? loopsBefore(turnIdx) : 0
  const target = level === 1 ? tree : (find(tree, turn.target ?? tree.id) ?? tree)
  const needed = priceOf(target)
  const canRun = level === 1 ? loopChoice !== null : picked === turn.target && (level < 3 || giftBuilt)

  const steps = useMemo(() => {
    if (level === 1) return loopChoice ? loopSteps(tree, existing, loopChoice) : []
    return canRun && picked ? walkSteps(level, tree, picked) : []
  }, [level, tree, existing, loopChoice, canRun, picked])
  const player = useStepPlayer(steps)
  const step = player.step
  const kind = step?.kind ?? null
  const busy = player.index >= 0
  const reachedKind = (k: Kind) => {
    const i = steps.findIndex((s) => s.kind === k)
    return i >= 0 && player.index >= i
  }
  const stepIs = (...kinds: Kind[]) => kind !== null && kinds.includes(kind)

  const writing = level === 1 && loopChoice !== null && loopChoice > existing
  const willSucceed = level === 1 ? loopChoice !== null && loopChoice >= depthOf(tree) : true
  const outcome: 'ok' | 'fail' | null = player.done ? (willSucceed ? 'ok' : 'fail') : null
  const pendingCoins = outcome === 'ok' ? needed : 0
  const loopCount = existing + (writing && reachedKind('write') ? 1 : 0)

  /* ---------------- code panel sync ---------------- */

  const view: CodeView = level === 1 ? 'without' : level === 2 ? 'main' : 'with'
  useEffect(() => {
    onCodeView?.(view)
  }, [view, onCodeView])
  useEffect(() => () => onCodeView?.('main'), [onCodeView])

  let idleCode: string | null = null
  if (level === 1) idleCode = levelDone ? 'l1-skip' : writing ? `l1-write-${loopChoice}` : 'l1-call'
  else if (levelDone) idleCode = null
  else if (level === 2) idleCode = picked ? 'pick' : null
  else if (panel === 'q1' || !giftBuilt) idleCode = 'build-class'
  else if (panel) idleCode = 'build-sum'
  else if (picked) idleCode = 'gift-call'
  const codeStep = step ? (step.codeStep ?? step.id) : idleCode
  useEffect(() => {
    onCodeStep(codeStep)
  }, [codeStep, onCodeStep])

  /* ---------------- actions ---------------- */

  const resetTurn = () => {
    player.reset()
    setLoopChoice(null)
    setPicked(null)
    setHint(null)
  }

  const startLevel = (n: Level) => {
    resetTurn()
    setLevel(n)
    setTurnIdx(0)
    setResults([])
    setMistakes(0)
    if (n === 1) setLoopChoice(2)
    setGiftBuilt(false)
    setPanel(null)
    setLevelDone(false)
  }

  const restartGame = () => {
    resetProgress()
    startLevel(1)
  }

  const pickLoops = (n: number) => {
    if (busy) return
    player.reset()
    setHint(null)
    setLoopChoice(n)
  }

  const pickNode = (id: LabelKey) => {
    if (busy || panel) return
    const node = find(tree, id)
    if (!node) return
    if (level === 3 && !giftBuilt) {
      if (node.kind === 'gift') {
        setHint(null)
        setPanel('q1')
      } else {
        shake.bump(`n-${id}`)
        setHint({ key: 'need-build' })
      }
      return
    }
    if (id !== turn.target) {
      shake.bump(`n-${id}`)
      setMistakes((m) => m + 1)
      const key =
        node.kind === 'item'
          ? 'wrong-leaf'
          : find(target, id)
            ? 'wrong-part'
            : find(node, target.id)
              ? 'wrong-whole'
              : 'wrong-other'
      setHint({ key, values: { picked: label(id), price: formatTaka(priceOf(node), lang) } })
      return
    }
    player.reset()
    setHint(null)
    setPicked(id)
  }

  const answerQ1 = (id: 'class' | 'if' | 'loop') => {
    if (panel !== 'q1') return
    if (id === 'class') {
      setHint(null)
      setPanel('q2')
      return
    }
    shake.bump(`q1-${id}`)
    setMistakes((m) => m + 1)
    setHint({ key: id === 'if' ? 'wrong-q1-if' : 'wrong-q1-loop' })
  }

  const answerQ2 = (id: 'recurse' | 'fee' | 'field') => {
    if (panel !== 'q2') return
    if (id === 'recurse') {
      setHint(null)
      setPanel('ready')
      return
    }
    shake.bump(`q2-${id}`)
    setMistakes((m) => m + 1)
    setHint({ key: id === 'fee' ? 'wrong-q2-fee' : 'wrong-q2-field' })
  }

  const plugGiftBox = () => {
    player.reset()
    setGiftBuilt(true)
    setPanel(null)
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
      return // bill the same order again
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

  const list = (ids: LabelKey[] | undefined) => (ids ?? []).map(label).join(', ')
  const lastSum = step?.sum ?? 0
  const values: Record<string, string> = {
    name: label(turn.name),
    amount: formatTaka(needed, lang),
    target: label(target.id),
    total: formatTaka(needed, lang),
    n: formatNumber(loopChoice ?? 0, lang),
    have: formatNumber(existing, lang),
    loops: formatNumber(loopCount, lang),
    k: formatNumber(step?.loop ?? 0, lang),
    desc: step?.loop ? label(LOOP_DESC[step.loop - 1]) : '',
    items: list(step?.items),
    added: formatTaka(step?.added ?? 0, lang),
    sum: formatTaka(lastSum, lang),
    short: formatTaka(needed - lastSum, lang),
    node: step?.node ? label(step.node) : '',
    price: formatTaka(step?.price ?? 0, lang),
    parent: step?.parent ? label(step.parent) : '',
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
    captionKey = !loopChoice ? 'idle1' : turnIdx === 0 && results.length === 0 ? 'tutorial' : writing ? 'picked1-write' : 'picked1'
  else if (level === 3 && !giftBuilt) captionKey = 'need-build'
  else captionKey = picked ? 'ready' : 'idle2'
  const caption = fill(captions[captionKey] ?? '', values)

  /* ---------------- pieces ---------------- */

  const turnOf = fill(v.orderOf, { n: formatNumber(turnIdx + 1, lang), total: formatNumber(TURNS[level].length, lang) })
  const counted = new Set<LabelKey>(step?.counted ?? [])
  const skipped = new Set<LabelKey>(step?.skipped ?? [])
  const activeNode = step?.node && !stepIs('call', 'done') ? find(tree, step.node) : null
  const treeCtx: TreeCtx = {
    label,
    lang,
    level,
    active: activeNode?.id ?? null,
    picked: level > 1 ? (picked ?? null) : null,
    counted,
    skipped,
    results: step?.results ?? {},
    giftBuilt,
    noClassYet: v.noClassYet,
  }
  const stack = step?.stack ?? []
  const short = stepIs('result') && !willSucceed
  const leafLit = stepIs('leaf')
  const bagLit = stepIs('open', 'recurse', 'btotal') && activeNode?.kind === 'bag'
  const giftLit = stepIs('make') || (stepIs('open', 'recurse', 'btotal') && activeNode?.kind === 'gift')
  const shownLoops = Math.min(4, Math.max(existing, loopChoice ?? 0))
  const loopStatus = (k: number): Status => {
    if (step?.kind === 'loop' && step.loop === k) return 'active'
    return reachedKind('loop') && (loopChoice ?? 0) >= k && steps.some((s, i) => s.loop === k && i <= player.index) ? 'done' : 'pending'
  }
  const accent = level === 3 ? GIFT_COLOR : '#0b6b4f'

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
                    {'for (const evenDeeper of ???)'}
                  </code>
                </>
              )}
              {level === 2 && <p className="prose-text text-sm text-ink">{v.l2Summary}</p>}
              {level === 3 && (
                <Recap
                  title={v.recapTitle}
                  items={[
                    { icon: '🔁', text: v.recap1 },
                    { icon: '🌳', text: v.recap2 },
                    { icon: '🎁', text: v.recap3 },
                  ]}
                />
              )}
            </LevelCompleteCard>
          ) : (
            <motion.div key={`play-${level}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* ── Client: the customer + the learner's choice ─────────── */}
              <Node role={v.clientRole} title={`📱 ${v.appTitle}`} active={stepIs('call', 'write', 'result', 'done')} accent={accent}>
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
                      {level === 1 ? (
                        <p className="flex items-baseline justify-between gap-2 font-bold text-ink">
                          <span className="truncate">{label(turn.name)}</span>
                          <span className="shrink-0 text-xs font-semibold text-ink-soft">
                            {v.receipts} <span className="text-sm font-bold text-ink tabular-nums">{formatTaka(needed, lang)}</span>
                          </span>
                        </p>
                      ) : (
                        <>
                          <p className="font-bold text-ink">
                            {label(turn.name)} <span className="text-xs font-normal text-ink-soft">{v.asks}</span>
                          </p>
                          <p className="text-sm text-ink">
                            “{target.id === tree.id ? v.askWhole : fill(v.askPart, { target: label(target.id) })}”
                          </p>
                        </>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {panel ? (
                  /* ── Level 3 builder ─────────────────────────── */
                  <div className="flex flex-col gap-3 rounded-lg border-2 border-dashed p-3" style={{ borderColor: GIFT_COLOR }}>
                    <p className="font-display font-bold text-ink">🔨 {v.builderTitle}</p>
                    <div>
                      <p className="label-caps text-ink-soft">{v.builderStep1}</p>
                      <p className="mb-2 text-sm text-ink">{v.q1}</p>
                      <div role="radiogroup" aria-label={v.q1} className="grid grid-cols-1 gap-2">
                        {(
                          [
                            ['class', v.q1Class],
                            ['if', v.q1If],
                            ['loop', v.q1Loop],
                          ] as const
                        ).map(([id, text]) => (
                          <ChoiceButton
                            key={id}
                            selected={panel !== 'q1' && id === 'class'}
                            color={GIFT_COLOR}
                            text={text}
                            onClick={() => answerQ1(id)}
                            animate={shake.anim(`q1-${id}`)}
                            className={panel !== 'q1' && id !== 'class' ? 'opacity-40' : ''}
                          />
                        ))}
                      </div>
                      {panel !== 'q1' && <NewCodeChip>+ GiftBox implements BazarItem</NewCodeChip>}
                    </div>

                    {panel !== 'q1' && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <p className="label-caps text-ink-soft">{v.builderStep2}</p>
                        <p className="mb-2 text-sm text-ink">{v.q2}</p>
                        <div role="radiogroup" aria-label={v.q2} className="grid grid-cols-1 gap-2">
                          {(
                            [
                              ['recurse', v.q2Recurse],
                              ['fee', v.q2Fee],
                              ['field', v.q2Field],
                            ] as const
                          ).map(([id, text]) => (
                            <ChoiceButton
                              key={id}
                              selected={panel === 'ready' && id === 'recurse'}
                              color={GIFT_COLOR}
                              text={text}
                              onClick={() => answerQ2(id)}
                              animate={shake.anim(`q2-${id}`)}
                              className={panel === 'ready' && id !== 'recurse' ? 'opacity-40' : ''}
                            />
                          ))}
                        </div>
                        {panel === 'ready' && <NewCodeChip>+ 50 + Σ child.getPrice()</NewCodeChip>}
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
                        <Button variant="primary" onClick={plugGiftBox} data-game="open-branch">
                          🎁 {v.useGiftBox}
                        </Button>
                      </motion.div>
                    )}
                  </div>
                ) : level === 1 ? (
                  <>
                    <p id="cp-loops-label" className="mb-1.5 label-caps text-ink-soft">
                      {v.loopsLabel}
                    </p>
                    <div role="radiogroup" aria-labelledby="cp-loops-label" className="grid grid-cols-3 gap-2">
                      {(turn.loops ?? []).map((n) => {
                        const exists = n <= existing
                        return (
                          <ChoiceButton
                            key={n}
                            selected={loopChoice === n}
                            color="#0b6b4f"
                            icon={exists ? '📄' : '✍️'}
                            text={fill(exists ? v.loopsN : v.writeLoop, { n: formatNumber(n, lang) })}
                            onClick={() => pickLoops(n)}
                            animate={shake.anim(`l-${n}`)}
                            className={exists ? '' : 'border-dashed'}
                          />
                        )
                      })}
                    </div>
                    <p className="mt-1.5 text-xs text-ink-soft">{v.writeHint}</p>
                    <p className="mt-2 flex items-center gap-1.5 border-t-2 border-dashed border-edge/40 pt-2 text-xs text-ink-soft">
                      {v.loopsWritten}
                      <motion.span
                        key={loopCount}
                        initial={{ scale: 1.6 }}
                        animate={{ scale: 1 }}
                        className="font-mono text-sm font-bold text-chili tabular-nums"
                      >
                        {formatNumber(loopCount, lang)}
                      </motion.span>
                    </p>
                  </>
                ) : (
                  <>
                    <p id="cp-node-label" className="mb-1.5 font-mono text-xs font-bold text-ink-soft" lang="en">
                      {v.pickLabel}
                    </p>
                    <div role="radiogroup" aria-labelledby="cp-node-label" className="grid grid-cols-2 gap-2 min-[400px]:grid-cols-3">
                      {(turn.options ?? []).map((id) => {
                        const node = find(tree, id)
                        const unbuilt = node?.kind === 'gift' && !giftBuilt
                        return (
                          <ChoiceButton
                            key={id}
                            selected={!unbuilt && picked === id}
                            color={node?.kind === 'gift' ? GIFT_COLOR : '#0b6b4f'}
                            icon={unbuilt ? '🔨' : node?.icon}
                            text={label(id)}
                            onClick={() => pickNode(id)}
                            animate={shake.anim(`n-${id}`)}
                            className={unbuilt ? 'border-dashed' : ''}
                          />
                        )
                      })}
                    </div>
                  </>
                )}
              </Node>

              <Connector
                label={level === 1 ? 'billTotal(order)' : 'picked.getPrice()'}
                down={stepIs('call')}
                up={stepIs('result', 'done')}
                downPacket={<Packet color={accent}>🧾 {level === 1 ? label(turn.name) : label(target.id)}</Packet>}
                upPacket={
                  <Packet color={short ? '#B91C1C' : '#0b6b4f'}>
                    {short ? '😵' : '✅'} {formatTaka(level === 1 ? lastSum : needed, lang)}
                  </Packet>
                }
                runKey={player.index}
              />

              {/* ── Middle: billTotal() loops (L1) or the Component with its Leaf / Composite classes (L2/3) ── */}
              {level === 1 ? (
                <Node role={v.noPatternRole} title="billTotal(order)" active={stepIs('call', 'write', 'loop', 'skip', 'ret')} accent="#B91C1C" mono>
                  <ul className="flex flex-col gap-1.5">
                    {Array.from({ length: shownLoops }, (_, i) => i + 1).map((k) => {
                      const copied = k > existing
                      const runs = (loopChoice ?? 0) >= k
                      const lit = step?.kind === 'loop' && step.loop === k
                      const done = loopStatus(k) === 'done'
                      const added = steps.find((s) => s.loop === k)?.added ?? 0
                      return (
                        <motion.li
                          key={k}
                          animate={{ x: lit ? 4 : 0 }}
                          style={{ marginLeft: `${(k - 1) * 0.5}rem` }}
                          className={`flex min-w-0 items-center gap-2 rounded-md border-2 px-2 py-1 text-xs ${
                            lit ? 'border-edge bg-card shadow-hard-sm' : copied ? 'border-dashed border-maroon/50 dark:border-mustard/50' : 'border-transparent'
                          } ${runs ? '' : 'opacity-40'}`}
                        >
                          <StatusDot status={loopStatus(k)} color="#B91C1C" />
                          <code lang="en" className="shrink-0 font-mono font-bold text-ink">
                            for #{k}
                          </code>
                          <span className="min-w-0 flex-1 truncate text-ink-soft">{label(LOOP_DESC[k - 1])}</span>
                          {copied && (!writing || reachedKind('write')) && (
                            <span className="shrink-0 rounded border-2 border-maroon/60 px-1 text-[10px] font-bold text-maroon uppercase dark:border-mustard/60 dark:text-mustard">
                              📋 <span className="hidden min-[400px]:inline">{v.copiedTag}</span>
                            </span>
                          )}
                          {done && added > 0 && (
                            <span className="shrink-0 font-bold text-bottle tabular-nums dark:text-jade">+{formatTaka(added, lang)}</span>
                          )}
                        </motion.li>
                      )
                    })}
                  </ul>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t-2 border-dashed border-edge/40 pt-2 text-xs">
                    <span className="font-mono font-bold text-ink" lang="en">
                      {v.sumLabel} = <span className="tabular-nums">{formatTaka(lastSum, lang)}</span>
                    </span>
                    <AnimatePresence>
                      {reachedKind('skip') && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.6 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="rounded border-2 border-chili/60 px-1.5 py-px font-bold text-chili"
                        >
                          ⚠ {fill(v.skippedTag, { n: formatNumber(skipped.size, lang) })}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </Node>
              ) : (
                <Node role={v.componentRole} title="BazarItem" active={stepIs('call', 'make')} accent={accent} mono>
                  <p className="-mt-1 mb-3 font-mono text-xs text-ink-soft" lang="en">
                    getPrice(): number
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Node role={v.leafRole} title="Item" active={leafLit} mono className="!p-2">
                      <code lang="en" className="block truncate font-mono text-[11px] text-ink-soft">
                        return price
                      </code>
                    </Node>
                    <Node role={v.compositeRole} title="Bag" active={bagLit} mono className="!p-2">
                      <code lang="en" className="block truncate font-mono text-[11px] text-ink-soft">
                        Σ getPrice()
                      </code>
                    </Node>
                    {level === 3 && (
                      <Node
                        role={v.compositeRole}
                        title="GiftBox"
                        active={giftLit}
                        accent={GIFT_COLOR}
                        mono
                        className={`col-span-2 !p-2 ${giftBuilt ? '' : 'border-dashed opacity-70'}`}
                      >
                        <p className="flex min-w-0 items-center gap-2">
                          <code lang="en" className="min-w-0 flex-1 truncate font-mono text-[11px] text-ink-soft">
                            {giftBuilt ? '৳50 + Σ getPrice()' : '?'}
                          </code>
                          <span
                            className={`shrink-0 rounded px-1.5 py-px text-[10px] font-bold uppercase ${giftBuilt ? 'bg-bottle text-cream' : 'text-ink-soft'}`}
                          >
                            {giftBuilt ? v.newTag : `🔨 ${v.noClassYet}`}
                          </span>
                        </p>
                      </Node>
                    )}
                  </div>
                  <p className="mt-3 mb-1 label-caps text-ink-soft">{v.stackLabel}</p>
                  <div className="flex min-h-7 flex-wrap items-center gap-1">
                    {stack.length === 0 && <span className="text-xs text-ink-soft/70">{v.stackEmpty}</span>}
                    <AnimatePresence initial={false}>
                      {stack.map((f, i) => {
                        const n = find(tree, f.id)
                        return (
                          <motion.span
                            key={f.id}
                            layout
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            className={`inline-flex max-w-full items-center gap-1 rounded-full border-2 px-2 py-px text-[11px] font-bold ${
                              i === stack.length - 1 ? 'border-edge bg-mustard text-on-accent' : 'border-edge/40 text-ink'
                            }`}
                          >
                            <span aria-hidden="true">{n?.icon}</span>
                            <span className="truncate">{label(f.id)}</span>
                            <span className="tabular-nums">{formatTaka(f.sum, lang)}</span>
                          </motion.span>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                </Node>
              )}

              <Connector
                label={level === 1 ? 'for … of items' : 'child.getPrice()'}
                down={level === 1 ? stepIs('loop', 'skip') && !(step?.added ?? 0) : stepIs('open', 'recurse', 'make')}
                up={level === 1 ? stepIs('loop') && (step?.added ?? 0) > 0 : stepIs('leaf', 'btotal')}
                downPacket={
                  <Packet color={level === 1 ? '#B91C1C' : stepIs('make') || activeNode?.kind === 'gift' ? GIFT_COLOR : '#0b6b4f'}>
                    {level === 1 ? (stepIs('skip') ? '🙈' : '🔍') : stepIs('make') ? '🎁 add()' : `${activeNode?.icon ?? ''} getPrice()`}
                  </Packet>
                }
                upPacket={<Packet color="#0b6b4f">+{formatTaka(level === 1 ? (step?.added ?? 0) : (step?.price ?? 0), lang)}</Packet>}
                runKey={player.index}
              />

              {/* ── Bottom: the bazar tree ── */}
              <Node
                role={level === 1 ? v.dataRole : v.treeRole}
                title="order"
                active={stepIs('loop', 'skip', 'open', 'recurse', 'leaf', 'btotal')}
                accent={accent}
                mono
              >
                <ul className="flex flex-col gap-1">
                  <TreeNode node={tree} ctx={treeCtx} />
                </ul>
                <AnimatePresence>
                  {stepIs('result', 'done') && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className={`mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border-2 px-3 py-2 text-sm font-bold ${
                        short ? 'border-chili text-chili' : 'border-bottle text-bottle dark:border-jade dark:text-jade'
                      }`}
                    >
                      <motion.span
                        aria-hidden="true"
                        className="text-2xl"
                        animate={short ? { rotate: [0, -12, 12, -8, 0] } : { scale: [1, 1.25, 1] }}
                        transition={{ duration: 0.6 }}
                      >
                        {short ? '😵' : '✅'}
                      </motion.span>
                      {level === 1 ? fill(v.billed, { amount: formatTaka(lastSum, lang) }) : `${label(target.id)} = ${formatTaka(needed, lang)}`}
                      {short && <span className="font-semibold">· {fill(v.shortBy, { amount: formatTaka(needed - lastSum, lang) })}</span>}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Node>
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
        <StepControls player={controls} playLabel={`🧾 ${v.billButton}`} disabled={!canRun || outcome !== null || panel !== null} />
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
