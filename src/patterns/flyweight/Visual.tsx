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
import type { FlyweightContent } from './content.en'

/*
 * "Dhaka Rickshaw Map": a 3-level game.
 *   Level 1  no pattern: every Rickshaw object loads its own 250 KB of pictures; the learner picks how many
 *            rickshaws the map loads; too many freezes the phone, too few leaves an empty map (`without`)
 *   Level 2  Flyweight: the learner sorts each field into the shared VehicleModel (intrinsic) or each
 *            Vehicle (extrinsic); the factory creates the model once and reuses it (`main`)
 *   Level 3  the learner registers a CNG model with the same factory and requests CNGs through it (`with`)
 * Thousands of vehicles are drawn as a small sample of dots plus a counter, so the DOM stays tiny.
 */

type Labels = FlyweightContent['visual']
type LabelKey = keyof Labels
type Field = 'sprite' | 'hoodArt' | 'bell' | 'xy' | 'heading' | 'isFree'
type Reason = 'crash' | 'few' | 'pile' | 'facing' | 'busy'
type CngPick = 'cng' | 'rickshaw' | 'new'

/* ------------------------------------------------------------------ */
/* Scenario data (illustrative sizes, 1 KB = 1,000 bytes)              */
/* ------------------------------------------------------------------ */

const OK_COLOR = '#0b6b4f'
const FAIL_COLOR = '#B91C1C'
const RICK_COLOR = '#C2410C'
const CNG_COLOR = '#15803D'
const BUDGET = 50_000_000
/** Booking fees the app earns per vehicle it shows (৳). */
const RATE = 2

const FIELDS: Field[] = ['sprite', 'hoodArt', 'bell', 'xy', 'heading', 'isFree']
const FIELD: Record<Field, { icon: string; code: string; bytes: number; intrinsic: boolean }> = {
  sprite: { icon: '🖼️', code: 'sprite', bytes: 200_000, intrinsic: true },
  hoodArt: { icon: '🎨', code: 'hoodArt', bytes: 50_000, intrinsic: true },
  bell: { icon: '🔔', code: 'bell', bytes: 20_000, intrinsic: true },
  xy: { icon: '📍', code: 'x, y', bytes: 16, intrinsic: false },
  heading: { icon: '🧭', code: 'heading', bytes: 8, intrinsic: false },
  isFree: { icon: '🟢', code: 'isFree', bytes: 1, intrinsic: false },
}
const L1_FIELDS: Field[] = ['sprite', 'hoodArt', 'xy', 'heading']
const bytesOf = (fields: Field[]) => fields.reduce((sum, f) => sum + FIELD[f].bytes, 0)
/** Level 1: one Rickshaw object with its own pictures. */
const PER_RICKSHAW = bytesOf(L1_FIELDS)
const RICK_MODEL = bytesOf(['sprite', 'hoodArt', 'bell'])
const CNG_MODEL = 240_000
const OWN_FULL = bytesOf(['xy', 'heading', 'isFree'])

interface Turn {
  name: LabelKey
  emoji: string
  area: LabelKey
  when: LabelKey
  /** Rickshaws on the street. */
  n: number
  /** Level 1: how many rickshaws the map may load. */
  options?: number[]
  /** Level 2: the fields this version of the map has, and which of them are new. */
  fields?: Field[]
  newFields?: Field[]
  /** Level 3: CNGs on the street, and the order the call tiles are shown in. */
  cngs?: number
  picks?: CngPick[]
}

const TURNS: Record<Level, Turn[]> = {
  1: [
    { name: 'mitu', emoji: '👩', area: 'dhanmondi', when: 'morning', n: 120, options: [40, 80, 120] },
    { name: 'karim', emoji: '🧔', area: 'mirpur', when: 'noon', n: 400, options: [400, 180, 60] },
    { name: 'rahim', emoji: '👨', area: 'farmgate', when: 'rush', n: 2000, options: [2000, 300, 160] },
  ],
  2: [
    { name: 'rahim', emoji: '👨', area: 'farmgate', when: 'rush', n: 2000, fields: ['sprite', 'xy'], newFields: ['sprite', 'xy'] },
    {
      name: 'karim',
      emoji: '🧔',
      area: 'chawkbazar',
      when: 'evening',
      n: 5000,
      fields: ['sprite', 'hoodArt', 'xy', 'heading'],
      newFields: ['hoodArt', 'heading'],
    },
    { name: 'tania', emoji: '👩‍🎓', area: 'citywide', when: 'eidEve', n: 10_000, fields: FIELDS, newFields: ['bell', 'isFree'] },
  ],
  3: [
    { name: 'mitu', emoji: '👩', area: 'gulshan', when: 'morning', n: 3000, cngs: 1000, picks: ['new', 'cng', 'rickshaw'] },
    { name: 'karim', emoji: '🧔', area: 'airport', when: 'noon', n: 2000, cngs: 4000, picks: ['cng', 'rickshaw', 'new'] },
    { name: 'rahim', emoji: '👨', area: 'citywide', when: 'eidEve', n: 10_000, cngs: 5000, picks: ['rickshaw', 'new', 'cng'] },
  ],
}
/** Level 1, area 1 is a guided tutorial: "All 120" is pre-selected. */
const TUTORIAL_LIMIT = 120

const PICK: Record<CngPick, string> = {
  cng: "factory.get('cng')",
  rickshaw: "factory.get('rickshaw')",
  new: 'new VehicleModel(…)',
}

/** Level 2: the fields that start out shared in a turn (the old ones, already sorted right). */
const initialShared = (level: Level, turnIdx: number): Field[] => {
  const t = TURNS[level][turnIdx]
  return level === 2 ? (t.fields ?? []).filter((f) => FIELD[f].intrinsic && !t.newFields?.includes(f)) : []
}

/** Level 1: does `limit` rickshaws fit, and is it the most that fits? */
function judge1(limit: number, options: number[]): Reason | null {
  if (limit * PER_RICKSHAW > BUDGET) return 'crash'
  if (options.some((o) => o > limit && o * PER_RICKSHAW <= BUDGET)) return 'few'
  return null
}

/** Level 2: memory and the first thing that breaks with this split. */
function sim2(fields: Field[], shared: Field[], n: number) {
  const sharedFields = fields.filter((f) => shared.includes(f))
  const ownFields = fields.filter((f) => !shared.includes(f))
  const sharedBytes = bytesOf(sharedFields)
  const ownBytes = bytesOf(ownFields)
  const used = sharedBytes + n * ownBytes
  const heavyOwn = ownFields.filter((f) => FIELD[f].intrinsic).sort((a, b) => FIELD[b].bytes - FIELD[a].bytes)[0] ?? null
  let reason: Reason | null = null
  if (used > BUDGET) reason = 'crash'
  else if (sharedFields.includes('xy')) reason = 'pile'
  else if (sharedFields.includes('heading')) reason = 'facing'
  else if (sharedFields.includes('isFree')) reason = 'busy'
  return { sharedFields, ownFields, sharedBytes, ownBytes, used, heavyOwn, reason, naive: n * bytesOf(fields) }
}

const LEVEL_ICON: Record<Level, string> = { 1: '🖼️', 2: '🪶', 3: '🛺' }

function formatBytes(b: number, lang: Lang): string {
  if (b >= 1e9) return `${formatNumber(b / 1e9, lang, 1)} GB`
  if (b >= 1e6) return `${formatNumber(b / 1e6, lang, 1)} MB`
  if (b >= 1e3) return `${formatNumber(b / 1e3, lang, 0)} KB`
  return `${formatNumber(b, lang)} B`
}

/* ------------------------------------------------------------------ */
/* The map sample: a few dots stand in for thousands of vehicles       */
/* ------------------------------------------------------------------ */

const SLOTS = Array.from({ length: 30 }, (_, i) => ({
  x: ((i * 61 + 13) % 88) + 3,
  y: ((i * 29 + 7) % 78) + 6,
  rot: ((i * 47) % 70) - 35,
}))

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

type Kind = 'pre' | 'start' | 'create' | 'copy' | 'reuse' | 'place' | 'fill' | 'result'

interface GameStep extends PlayerStep {
  kind: Kind
  caption: string
}

/** Step ids double as code-step ids: they match the `// @step:` markers in code/*.ts. */
function buildSteps(level: Level, ready: boolean, overflow: boolean): GameStep[] {
  if (!ready) return []
  if (level === 1)
    return [
      { id: 'l1-start', kind: 'start', caption: 'l1-start' },
      { id: 'l1-new', kind: 'create', caption: 'l1-new', duration: 1500 },
      { id: 'l1-copy', kind: 'copy', caption: 'l1-copy', duration: 1800 },
      { id: 'l1-fill', kind: 'fill', caption: overflow ? 'l1-fill-over' : 'l1-fill', duration: 1900 },
      { id: 'l1-result', kind: 'result', caption: 'result', duration: 1200 },
    ]
  if (level === 2)
    return [
      { id: 'request', kind: 'start', caption: 'request' },
      { id: 'miss', kind: 'create', caption: 'miss', duration: 1700 },
      { id: 'hit', kind: 'reuse', caption: 'hit', duration: 1600 },
      { id: 'place', kind: 'place', caption: 'place', duration: 1600 },
      { id: 'fill', kind: 'fill', caption: overflow ? 'fill-over' : 'fill', duration: 1900 },
      { id: 'draw', kind: 'result', caption: 'result', duration: 1300 },
    ]
  return [
    { id: 'l3-rickshaws', kind: 'pre', caption: 'l3-rickshaws', duration: 1700 },
    { id: 'l3-request', kind: 'start', caption: 'l3-request' },
    { id: 'l3-miss', kind: 'create', caption: 'l3-miss', duration: 1600 },
    { id: 'l3-hit', kind: 'reuse', caption: 'l3-hit', duration: 1600 },
    { id: 'l3-place', kind: 'place', caption: 'l3-place', duration: 1500 },
    { id: 'l3-fill', kind: 'fill', caption: 'l3-fill', duration: 1800 },
    { id: 'l3-draw', kind: 'result', caption: 'l3-draw', duration: 1300 },
  ]
}

/* ------------------------------------------------------------------ */
/* Visual                                                              */
/* ------------------------------------------------------------------ */

export default function FlyweightVisual({ content, lang, onCodeStep, onCodeView }: VisualProps<FlyweightContent>) {
  const v = content.visual
  const captions: Record<string, string> = content.steps
  const label = (key: LabelKey) => v[key]
  const bytes = (b: number) => formatBytes(b, lang)
  const num = (n: number) => formatNumber(n, lang)

  const { progress, addCoins, completeLevel, reset: resetProgress } = useGameProgress('dpp-flyweight-game')
  const shake = useShake()
  const [level, setLevel] = useState<Level>(1)
  const [turnIdx, setTurnIdx] = useState(0)
  const [results, setResults] = useState<('ok' | 'fail')[]>([])
  const [mistakes, setMistakes] = useState(0)
  const [limit, setLimit] = useState<number | null>(TUTORIAL_LIMIT) // level 1, area 1 is a guided tutorial
  const [shared, setShared] = useState<Field[]>([])
  const [touched, setTouched] = useState(false)
  const [pick, setPick] = useState<CngPick | null>(null)
  const [built, setBuilt] = useState(false)
  const [panel, setPanel] = useState<'q1' | 'q2' | 'ready' | null>(null)
  const [hint, setHint] = useState<{ key: string; values?: Record<string, string> } | null>(null)
  const [levelDone, setLevelDone] = useState(false)
  const [lastStars, setLastStars] = useState(0)

  const turn = TURNS[level][turnIdx]
  const fields = turn.fields ?? []
  const cngs = turn.cngs ?? 0

  // Outcome of the current choice, known before Play (the timeline only reveals it).
  const s2 = sim2(fields, shared, turn.n)
  const reason: Reason | null = level === 1 ? (limit === null ? null : judge1(limit, turn.options ?? [])) : level === 2 ? s2.reason : null
  const shownCount = level === 1 ? (limit ?? 0) : turn.n + cngs
  const l3Used = RICK_MODEL + CNG_MODEL + (turn.n + cngs) * OWN_FULL
  const finalUsed = level === 1 ? (limit ?? 0) * PER_RICKSHAW : level === 2 ? s2.used : l3Used
  const overflow = finalUsed > BUDGET
  const earned = shownCount * RATE

  const ready = level === 1 ? limit !== null : level === 2 ? true : built && pick === 'cng'
  const steps = useMemo(() => buildSteps(level, ready, overflow), [level, ready, overflow])
  const player = useStepPlayer(steps)
  const step = player.step
  const kind = step?.kind ?? null
  const busy = player.index >= 0
  const stepIs = (...kinds: Kind[]) => kind !== null && kinds.includes(kind)
  const reached = (k: Kind) => {
    const i = steps.findIndex((s) => s.kind === k)
    return i >= 0 && player.index >= i
  }

  const outcome: 'ok' | 'fail' | null = player.done ? (reason === null ? 'ok' : 'fail') : null
  const pendingCoins = outcome === 'ok' ? earned : 0
  const accent = level === 1 ? FAIL_COLOR : level === 3 ? CNG_COLOR : OK_COLOR

  /* ---------------- code panel sync ---------------- */

  const view: CodeView = level === 1 ? 'without' : level === 2 ? 'main' : 'with'
  useEffect(() => {
    onCodeView?.(view)
  }, [view, onCodeView])
  useEffect(() => () => onCodeView?.('main'), [onCodeView])

  let idleCode: string | null
  if (level === 1) idleCode = levelDone ? 'l1-math' : 'l1-start'
  else if (levelDone) idleCode = null
  else if (level === 2) idleCode = 'split'
  else idleCode = panel === 'q1' ? 'build-model' : 'build-use'
  const codeStep = step ? (step.codeStep ?? step.id) : idleCode
  useEffect(() => {
    onCodeStep(codeStep)
  }, [codeStep, onCodeStep])

  /* ---------------- actions ---------------- */

  const resetTurn = (lvl: Level, idx: number) => {
    player.reset()
    setLimit(null)
    setPick(null)
    setHint(null)
    setTouched(false)
    setShared(initialShared(lvl, idx))
  }

  const startLevel = (n: Level) => {
    resetTurn(n, 0)
    setLevel(n)
    setTurnIdx(0)
    setResults([])
    setMistakes(0)
    if (n === 1) setLimit(TUTORIAL_LIMIT)
    setBuilt(false)
    setPanel(n === 3 ? 'q1' : null)
    setLevelDone(false)
  }

  const restartGame = () => {
    resetProgress()
    startLevel(1)
  }

  const chooseLimit = (o: number) => {
    if (busy) return
    player.reset()
    setHint(null)
    setLimit(o)
  }

  const toggleField = (f: Field) => {
    if (busy) return
    player.reset()
    setHint(null)
    setTouched(true)
    setShared(shared.includes(f) ? shared.filter((x) => x !== f) : [...shared, f])
  }

  const naiveCng = bytes(cngs * CNG_MODEL)

  const chooseCng = (p: CngPick) => {
    if (busy || panel) return
    if (p !== 'cng') {
      shake.bump(`k-${p}`)
      setMistakes((m) => m + 1)
      setHint({ key: p === 'rickshaw' ? 'wrong-pick-rickshaw' : 'wrong-pick-new' })
      return
    }
    player.reset()
    setHint(null)
    setPick(p)
  }

  const answerQ1 = (id: 'model' | 'pos' | 'all') => {
    if (panel !== 'q1') return
    if (id === 'model') {
      setHint(null)
      setPanel('q2')
      return
    }
    shake.bump(`q1-${id}`)
    setMistakes((m) => m + 1)
    setHint({ key: id === 'pos' ? 'wrong-q1-pos' : 'wrong-q1-all' })
  }

  const answerQ2 = (id: 'factory' | 'screen' | 'edit') => {
    if (panel !== 'q2') return
    if (id === 'factory') {
      setHint(null)
      setPanel('ready')
      return
    }
    shake.bump(`q2-${id}`)
    setMistakes((m) => m + 1)
    setHint({ key: id === 'screen' ? 'wrong-q2-screen' : 'wrong-q2-edit' })
  }

  const addCngs = () => {
    player.reset()
    setBuilt(true)
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
    if (!wasOk) {
      // Try the same area again, keeping the learner's choice so they can fix it.
      player.reset()
      setHint(null)
      setMistakes((m) => m + 1)
      return
    }
    if (isLastTurn) {
      resetTurn(level, turnIdx)
      finishLevel()
    } else {
      resetTurn(level, turnIdx + 1)
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

  /* ---------------- what the stage shows right now ---------------- */

  // Memory used so far in the run.
  let memNow = 0
  if (level === 1) memNow = stepIs('create') ? PER_RICKSHAW : stepIs('copy') ? 2 * PER_RICKSHAW : stepIs('fill', 'result') ? finalUsed : 0
  else if (level === 2)
    memNow = stepIs('create', 'reuse') ? s2.sharedBytes : stepIs('place') ? s2.sharedBytes + 2 * s2.ownBytes : stepIs('fill', 'result') ? finalUsed : 0
  else if (busy) {
    const rickBase = RICK_MODEL + turn.n * OWN_FULL
    memNow = stepIs('pre', 'start') ? rickBase : stepIs('create', 'reuse') ? rickBase + CNG_MODEL : stepIs('place') ? rickBase + CNG_MODEL + 2 * OWN_FULL : finalUsed
  }
  const bursting = overflow && stepIs('fill', 'result')
  const frozen = overflow && stepIs('result')

  // Map dots: how many of the 30 sample slots are drawn.
  const total = turn.n + cngs
  const rickSlots = level === 3 ? Math.round((SLOTS.length * turn.n) / total) : SLOTS.length
  let drawn = 0
  if (level === 1) {
    const all = Math.max(1, Math.round((SLOTS.length * (limit ?? 0)) / turn.n))
    drawn = stepIs('create') ? 1 : stepIs('copy') ? Math.min(2, all) : stepIs('fill', 'result') ? all : 0
  } else if (level === 2) drawn = stepIs('place') ? 2 : stepIs('fill', 'result') ? SLOTS.length : 0
  else drawn = stepIs('pre', 'start', 'create', 'reuse') ? rickSlots : stepIs('place') ? rickSlots + 2 : stepIs('fill', 'result') ? SLOTS.length : 0
  const showBug = level === 2 && stepIs('result') ? reason : null

  /* ---------------- caption ---------------- */

  const list = (fs: Field[], empty: string) => (fs.length ? fs.map((f) => FIELD[f].code).join(', ') : empty)
  const values: Record<string, string> = {
    name: label(turn.name),
    area: label(turn.area),
    when: label(turn.when),
    onStreet: num(turn.n),
    n: level === 1 ? num(limit ?? 0) : num(turn.n),
    shown: num(limit ?? 0),
    hidden: num(Math.max(0, turn.n - (limit ?? 0))),
    per: bytes(PER_RICKSHAW),
    budget: bytes(BUDGET),
    used: bytes(finalUsed),
    amount: formatTaka(earned, lang),
    shared: list(s2.sharedFields, v.sharedNone),
    own: list(s2.ownFields, '—'),
    sharedBytes: bytes(s2.sharedBytes),
    ownBytes: bytes(s2.ownBytes),
    naive: bytes(s2.naive),
    field: s2.heavyOwn ? FIELD[s2.heavyOwn].code : '',
    newFields: list(turn.newFields ?? [], ''),
    rickshaws: num(turn.n),
    cngs: num(cngs),
    total: num(total),
    models: bytes(RICK_MODEL + CNG_MODEL),
    cngModel: bytes(CNG_MODEL),
    naiveCng,
    ...(!step ? hint?.values : undefined),
  }

  let captionKey: string
  if (step) {
    if (step.caption !== 'result') captionKey = step.caption
    else if (level === 1) captionKey = reason ? `l1-fail-${reason}` : turn.n > (limit ?? 0) ? 'l1-ok-hidden' : 'l1-ok'
    else captionKey = reason ? `l2-fail-${reason}` : 'l2-ok'
  } else if (hint) captionKey = hint.key
  else if (levelDone) captionKey = `level${level}-done`
  else if (panel === 'q1') captionKey = 'build-q1'
  else if (panel === 'q2') captionKey = 'build-q2'
  else if (panel === 'ready') captionKey = 'build-ready'
  else if (level === 1)
    captionKey = turnIdx === 0 && results.length === 0 && limit === TUTORIAL_LIMIT ? 'tutorial' : limit === null ? 'idle1' : 'picked1'
  else if (level === 2) captionKey = touched ? 'picked2' : turnIdx === 0 ? 'idle2' : 'idle2-more'
  else captionKey = pick ? 'picked3' : 'idle3'
  const caption = fill(captions[captionKey] ?? '', values)

  /* ---------------- pieces ---------------- */

  const turnOf = fill(v.turnOf, { n: num(turnIdx + 1), total: num(TURNS[level].length) })

  const chip = (text: string, key?: string) => (
    <span key={key ?? text} className="rounded-full border-2 border-edge/40 bg-card px-2 py-0.5 text-xs font-semibold text-ink">
      {text}
    </span>
  )
  const fieldChip = (f: Field, tone: 'shared' | 'own' | 'bad') => (
    <span
      key={f}
      lang="en"
      className={`inline-flex items-center gap-1 rounded-md border-2 px-1.5 py-px font-mono text-[11px] font-bold ${
        tone === 'bad' ? 'border-chili text-chili' : tone === 'shared' ? 'border-bottle/60 text-bottle dark:border-jade dark:text-jade' : 'border-edge/40 text-ink'
      }`}
    >
      <span aria-hidden="true">{FIELD[f].icon}</span>
      {FIELD[f].code}
    </span>
  )

  const memoryBar = (
    <div className="mt-3">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="label-caps text-ink-soft">{v.memoryLabel}</span>
        <span className={`font-mono text-xs font-bold tabular-nums ${bursting ? 'text-chili' : 'text-ink'}`}>
          {fill(v.memoryOf, { used: bytes(memNow), budget: bytes(BUDGET) })}
        </span>
      </div>
      <motion.div
        className="h-4 overflow-hidden rounded-full border-2 border-edge bg-paper"
        animate={bursting ? { x: [0, -5, 5, -3, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className={`h-full ${bursting ? 'bg-chili' : memNow > BUDGET * 0.75 ? 'bg-mustard' : 'bg-bottle dark:bg-jade'}`}
          initial={false}
          animate={{ width: `${Math.max(memNow > 0 ? 1.5 : 0, Math.min(100, (memNow / BUDGET) * 100))}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </motion.div>
      {level > 1 && stepIs('fill', 'result') && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1 text-[11px] text-ink-soft">
          {fill(v.naiveNote, { naive: bytes(level === 2 ? s2.naive : total * (RICK_MODEL + OWN_FULL)) })}
        </motion.p>
      )}
    </div>
  )

  const mapSample = (
    <div className="relative h-36 overflow-hidden rounded-lg border-2 border-edge/60 bg-paper">
      {/* a couple of "roads" */}
      <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 bg-edge/10" />
      <span aria-hidden="true" className="absolute inset-y-0 left-1/3 w-2 bg-edge/10" />
      {SLOTS.map((s, i) => {
        const cng = level === 3 && i >= rickSlots
        const on = i < drawn
        const pile = showBug === 'pile' && on
        const rot = showBug === 'facing' ? 0 : s.rot
        return (
          <motion.span
            key={i}
            aria-hidden="true"
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-edge/30 bg-[#fff8e7] p-px text-sm leading-none"
            initial={false}
            animate={{
              left: `${pile ? 50 : s.x}%`,
              top: `${pile ? 50 : s.y}%`,
              rotate: on ? rot : 0,
              opacity: on ? (frozen ? 0.35 : 1) : 0.18,
              scale: on ? 1 : 0.8,
            }}
            transition={{ duration: 0.6, delay: on && stepIs('fill', 'result') ? (i % 10) * 0.03 : 0 }}
            style={{ filter: on && !frozen ? (showBug === 'busy' ? 'grayscale(1) sepia(1) hue-rotate(-50deg) saturate(5)' : 'none') : 'grayscale(1)' }}
          >
            {cng ? '🛺' : '🚲'}
          </motion.span>
        )
      })}
      <AnimatePresence>
        {frozen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 grid place-items-center bg-chili/15 p-2"
          >
            <span className="rounded-lg border-2 border-chili bg-card px-2 py-1 text-center text-xs font-bold text-chili shadow-hard-sm">
              📵 {fill(v.froze, { area: label(turn.area) })}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  const resultBadge = (() => {
    if (!stepIs('result')) return null
    let text = fill(v.drawnOk, { n: num(shownCount) })
    let bad = false
    if (reason === 'crash') [text, bad] = [fill(v.froze, { area: label(turn.area) }), true]
    else if (reason === 'few') [text, bad] = [fill(v.tooFew, { n: num(limit ?? 0) }), true]
    else if (reason === 'pile') [text, bad] = [v.pileUp, true]
    else if (reason === 'facing') [text, bad] = [v.sameWay, true]
    else if (reason === 'busy') [text, bad] = [v.allBusy, true]
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`mt-3 flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-bold ${
          bad ? 'border-chili text-chili' : 'border-bottle text-bottle dark:border-jade dark:text-jade'
        }`}
      >
        <motion.span
          aria-hidden="true"
          className="text-2xl"
          animate={bad ? { rotate: [0, -12, 12, -8, 0] } : { scale: [1, 1.25, 1] }}
          transition={{ duration: 0.6 }}
        >
          {bad ? '😵' : '✅'}
        </motion.span>
        <span>
          {text}
          {!bad && level === 1 && turn.n > shownCount && (
            <span className="block text-xs font-semibold text-chili">{fill(v.hiddenNote, { n: num(turn.n - shownCount) })}</span>
          )}
        </span>
      </motion.div>
    )
  })()

  /* ---------------- middle node pieces ---------------- */

  // Level 1: Rickshaw objects piling up in memory, each with its own pictures.
  const objectsNow = stepIs('create') ? 1 : stepIs('copy') ? 2 : stepIs('fill', 'result') ? (limit ?? 0) : 0
  const objectCards = Math.min(objectsNow, 6)

  // Levels 2–3: the factory's cache.
  const rickCached = level === 2 ? reached('create') : busy
  const cngCached = level === 3 && reached('create')
  const tagFor = (type: 'rickshaw' | 'cng') => {
    if (level === 2 && type === 'rickshaw') return stepIs('create') ? 'miss' : stepIs('reuse', 'place', 'fill') ? 'hit' : null
    if (level === 3 && type === 'cng') return stepIs('create') ? 'miss' : stepIs('reuse', 'place', 'fill') ? 'hit' : null
    if (level === 3 && type === 'rickshaw') return stepIs('pre') ? 'hit' : null
    return null
  }
  const modelRow = (type: 'rickshaw' | 'cng') => {
    const tag = tagFor(type)
    const isCng = type === 'cng'
    const sharedHere: Field[] = level === 2 ? s2.sharedFields : ['sprite', 'hoodArt', 'bell']
    const size = isCng ? CNG_MODEL : level === 2 ? s2.sharedBytes : RICK_MODEL
    return (
      <motion.div key={type} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
        <Node
          role={v.flyweightRole}
          title={`${isCng ? '🛺' : '🚲'} VehicleModel`}
          active={tag !== null}
          accent={isCng ? CNG_COLOR : RICK_COLOR}
          mono
          className="!p-2"
        >
          <div className="-mt-1 flex flex-wrap items-center gap-1.5">
            <code lang="en" className="font-mono text-xs font-bold text-ink-soft">
              '{type}' →
            </code>
            {isCng ? (
              <span lang="en" className="rounded-md border-2 border-bottle/60 px-1.5 py-px font-mono text-[11px] font-bold text-bottle dark:border-jade dark:text-jade">
                🖼️ cng.png · 🎨 cage · 📯 horn
              </span>
            ) : sharedHere.length ? (
              sharedHere.map((f) => fieldChip(f, 'shared'))
            ) : (
              <span className="text-xs text-ink-soft">{v.sharedNone}</span>
            )}
            <span className="ml-auto font-mono text-xs font-bold text-ink tabular-nums">{bytes(size)}</span>
          </div>
          <AnimatePresence>
            {tag && (
              <motion.p
                key={tag}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className={`mt-1.5 inline-block rounded px-1.5 text-[10px] font-bold uppercase ${tag === 'miss' ? 'bg-mustard text-on-accent' : 'bg-bottle text-cream'}`}
              >
                {tag === 'miss' ? v.missTag : v.hitTag}
              </motion.p>
            )}
          </AnimatePresence>
        </Node>
      </motion.div>
    )
  }

  const ownFieldsNow: Field[] = level === 2 ? s2.ownFields : ['xy', 'heading', 'isFree']
  const placing = stepIs('place', 'fill')

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
          levelText={fill(v.levelLabel, { n: num(level) })}
          title={label(`level${level}Title` as LabelKey)}
          goal={label(`level${level}Goal` as LabelKey)}
        />

        <AnimatePresence mode="wait" initial={false}>
          {levelDone ? (
            <LevelCompleteCard
              key={`done-${level}`}
              title={fill(v.levelDone, { n: num(level) })}
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
                    {'10,000 × 250 KB = 2.5 GB ???'}
                  </code>
                </>
              )}
              {level === 2 && <p className="prose-text text-sm text-ink">{v.l2Summary}</p>}
              {level === 3 && (
                <Recap
                  title={v.recapTitle}
                  items={[
                    { icon: '🖼️', text: v.recap1 },
                    { icon: '🪶', text: v.recap2 },
                    { icon: '🛺', text: v.recap3 },
                  ]}
                />
              )}
            </LevelCompleteCard>
          ) : (
            <motion.div key={`play-${level}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* ── Client: the rider's area + the learner's choice ─────────── */}
              <Node role={v.clientRole} title={`📱 ${v.appTitle}`} active={stepIs('pre', 'start', 'result')} accent={accent}>
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
                        <span className="truncate">{fill(v.opensMap, { name: label(turn.name) })}</span>
                        <span className="shrink-0 tabular-nums">{formatTaka(earned, lang)}</span>
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {chip(`📍 ${label(turn.area)} · ${label(turn.when)}`, 'area')}
                        {chip(`🚲 ${fill(v.rickshawCount, { n: num(turn.n) })}`, 'rick')}
                        {level === 3 && chip(`🛺 ${fill(v.cngCount, { n: num(cngs) })}`, 'cng')}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {panel ? (
                  /* ── Level 3 builder ─────────────────────────── */
                  <div className="flex flex-col gap-3 rounded-lg border-2 border-dashed p-3" style={{ borderColor: CNG_COLOR }}>
                    <p className="font-display font-bold text-ink">🔨 {v.builderTitle}</p>
                    <div>
                      <p className="label-caps text-ink-soft">{v.builderStep1}</p>
                      <p className="mb-2 text-sm text-ink">{v.q1}</p>
                      <div role="radiogroup" aria-label={v.q1} className="grid grid-cols-1 gap-2">
                        {(
                          [
                            ['pos', v.q1Pos],
                            ['model', v.q1Model],
                            ['all', v.q1All],
                          ] as const
                        ).map(([id, text]) => (
                          <ChoiceButton
                            key={id}
                            selected={panel !== 'q1' && id === 'model'}
                            color={CNG_COLOR}
                            text={text}
                            onClick={() => answerQ1(id)}
                            animate={shake.anim(`q1-${id}`)}
                            className={panel !== 'q1' && id !== 'model' ? 'opacity-40' : ''}
                          />
                        ))}
                      </div>
                      {panel !== 'q1' && <NewCodeChip>+ new VehicleModel(cng.png, cage, horn)</NewCodeChip>}
                    </div>

                    {panel !== 'q1' && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <p className="label-caps text-ink-soft">{v.builderStep2}</p>
                        <p className="mb-2 text-sm text-ink">{v.q2}</p>
                        <div role="radiogroup" aria-label={v.q2} className="grid grid-cols-1 gap-2">
                          {(
                            [
                              ['screen', v.q2Screen],
                              ['edit', v.q2Edit],
                              ['factory', v.q2Factory],
                            ] as const
                          ).map(([id, text]) => (
                            <ChoiceButton
                              key={id}
                              selected={panel === 'ready' && id === 'factory'}
                              color={CNG_COLOR}
                              text={text}
                              onClick={() => answerQ2(id)}
                              animate={shake.anim(`q2-${id}`)}
                              className={panel === 'ready' && id !== 'factory' ? 'opacity-40' : ''}
                            />
                          ))}
                        </div>
                        {panel === 'ready' && <NewCodeChip>+ factory.register('cng', …)</NewCodeChip>}
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
                        <Button variant="primary" onClick={addCngs} data-game="open-branch">
                          🛺 {v.useCng}
                        </Button>
                      </motion.div>
                    )}
                  </div>
                ) : level === 1 ? (
                  <>
                    <p id="fw-limit-label" className="mb-1.5 label-caps text-ink-soft">
                      {v.limitLabel}
                    </p>
                    <div role="radiogroup" aria-labelledby="fw-limit-label" className="grid grid-cols-3 gap-2">
                      {(turn.options ?? []).map((o) => (
                        <ChoiceButton
                          key={o}
                          selected={limit === o}
                          color={RICK_COLOR}
                          icon={`🚲 ${num(o)}`}
                          text={o === turn.n ? v.optAll : v.optNearest}
                          onClick={() => chooseLimit(o)}
                          animate={shake.anim(`l-${o}`)}
                        />
                      ))}
                    </div>
                    <p className="mt-2 border-t-2 border-dashed border-edge/40 pt-2 text-xs font-semibold text-chili">
                      ⚠️ {fill(v.perObjectNote, { per: bytes(PER_RICKSHAW), budget: bytes(BUDGET) })}
                    </p>
                  </>
                ) : level === 2 ? (
                  <>
                    <p id="fw-split-label" className="mb-1.5 label-caps text-ink-soft">
                      {v.splitLabel}
                    </p>
                    <div role="group" aria-labelledby="fw-split-label" className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
                      {fields.map((f) => (
                        <ChoiceButton
                          key={f}
                          role="checkbox"
                          selected={shared.includes(f)}
                          color={OK_COLOR}
                          icon={turnIdx > 0 && turn.newFields?.includes(f) ? `✨ ${FIELD[f].icon}` : FIELD[f].icon}
                          text={`${FIELD[f].code} · ${bytes(FIELD[f].bytes)}`}
                          onClick={() => toggleField(f)}
                          animate={shake.anim(`f-${f}`)}
                          mono
                        />
                      ))}
                    </div>
                    <p className="mt-1.5 text-xs text-ink-soft">
                      {v.splitHint}
                      {turnIdx > 0 && ` ✨ = ${v.newTag}`}
                    </p>
                  </>
                ) : (
                  <>
                    <p id="fw-cng-label" className="mb-1.5 label-caps text-ink-soft">
                      {v.cngCallLabel}
                    </p>
                    <div role="radiogroup" aria-labelledby="fw-cng-label" className="grid grid-cols-1 gap-2">
                      {(turn.picks ?? []).map((p) => (
                        <ChoiceButton
                          key={p}
                          selected={pick === p}
                          color={CNG_COLOR}
                          text={PICK[p]}
                          onClick={() => chooseCng(p)}
                          animate={shake.anim(`k-${p}`)}
                          mono
                        />
                      ))}
                    </div>
                    <p className="mt-2 border-t-2 border-dashed border-edge/40 pt-2 text-xs font-semibold text-ink">✓ {v.clientNote}</p>
                  </>
                )}
              </Node>

              <Connector
                label={level === 1 ? 'showArea(area, n)' : 'factory.get(type)'}
                down={stepIs('pre', 'start')}
                up={stepIs('reuse')}
                downPacket={
                  <Packet color={level === 1 ? FAIL_COLOR : stepIs('pre') || level === 2 ? RICK_COLOR : CNG_COLOR}>
                    {level === 1 ? `🚲 ×${num(limit ?? 0)}` : stepIs('pre') || level === 2 ? "🚲 'rickshaw'" : "🛺 'cng'"}
                  </Packet>
                }
                upPacket={<Packet color={OK_COLOR}>🪶 VehicleModel</Packet>}
                runKey={player.index}
              />

              {/* ── Middle: Rickshaw objects (L1) or the flyweight factory (L2/3) ── */}
              {level === 1 ? (
                <Node role={v.noPatternRole} title="Rickshaw" active={stepIs('create', 'copy', 'fill')} accent={FAIL_COLOR} mono>
                  <div className="-mt-1 mb-2 flex flex-wrap items-center gap-1.5">
                    {L1_FIELDS.map((f) => fieldChip(f, FIELD[f].intrinsic ? 'bad' : 'own'))}
                  </div>
                  <p className="mb-2 text-xs font-semibold text-ink">{fill(v.perObject, { per: bytes(PER_RICKSHAW) })}</p>
                  <div className="flex min-h-9 flex-wrap items-center gap-1.5">
                    <AnimatePresence>
                      {Array.from({ length: objectCards }, (_, i) => (
                        <motion.span
                          key={i}
                          layout
                          initial={{ opacity: 0, y: -10, scale: 0.8 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className={`rounded-md border-2 px-1.5 py-0.5 text-xs font-bold ${
                            i === 1 && stepIs('copy') ? 'border-chili bg-chili/10 text-chili' : 'border-edge/50 bg-card text-ink'
                          }`}
                        >
                          <span aria-hidden="true">🖼️🎨</span> <span className="font-mono tabular-nums">{bytes(PER_RICKSHAW)}</span>
                        </motion.span>
                      ))}
                    </AnimatePresence>
                    {objectsNow > objectCards && (
                      <span className="text-xs font-bold text-chili">{fill(v.moreObjects, { n: num(objectsNow - objectCards) })}</span>
                    )}
                  </div>
                  {stepIs('copy') && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1 text-xs font-bold text-chili">
                      ⚠️ {v.samePicture}
                    </motion.p>
                  )}
                  {objectsNow > 0 && (
                    <p className="mt-1 text-xs font-semibold text-ink-soft">{fill(v.objectsInMemory, { n: num(objectsNow) })}</p>
                  )}
                </Node>
              ) : (
                <Node role={v.factoryRole} title="ModelFactory" active={stepIs('pre', 'start', 'create', 'reuse')} accent={accent} mono>
                  <p className="-mt-1 mb-1.5 label-caps text-ink-soft" lang="en">
                    {v.cacheLabel}
                  </p>
                  <div className="flex flex-col gap-2">
                    <AnimatePresence initial={false}>
                      {rickCached && modelRow('rickshaw')}
                      {cngCached && modelRow('cng')}
                    </AnimatePresence>
                    {!rickCached && !cngCached && <p className="text-xs text-ink-soft">{v.cacheEmpty}</p>}
                    {level === 3 && !built && (
                      <p className="rounded-md border-2 border-dashed border-edge/40 px-2 py-1 text-xs text-ink-soft">
                        <code lang="en" className="font-mono font-bold">
                          'cng'
                        </code>{' '}
                        · 🔨 {v.notBuilt}
                      </p>
                    )}
                  </div>
                </Node>
              )}

              <Connector
                label={level === 1 ? 'new Rickshaw(…)' : 'new Vehicle(…)'}
                down={level === 1 ? stepIs('create', 'copy', 'fill') : stepIs('place', 'fill')}
                downPacket={
                  level === 1 ? (
                    <Packet color={stepIs('create') ? RICK_COLOR : FAIL_COLOR}>🖼️ +{bytes(stepIs('fill') ? finalUsed : PER_RICKSHAW)}</Packet>
                  ) : s2.heavyOwn && level === 2 ? (
                    <Packet color={FAIL_COLOR}>
                      {FIELD[s2.heavyOwn].icon} +{bytes(s2.ownBytes)}
                    </Packet>
                  ) : (
                    <Packet color={OK_COLOR}>📍 +{bytes(level === 2 ? s2.ownBytes : OWN_FULL)}</Packet>
                  )
                }
                runKey={player.index}
              />

              {/* ── Bottom: the phone's map (L1) or the Vehicle contexts (L2/3) ── */}
              <Node
                role={level === 1 ? v.phoneRole : v.contextRole}
                title={level === 1 ? `🗺️ ${fill(v.mapTitle, { area: label(turn.area) })}` : `Vehicle ×${num(drawn > 0 ? total : 0)}`}
                active={stepIs('place', 'fill', 'result') || (level === 1 && stepIs('create', 'copy'))}
                accent={bursting || showBug ? FAIL_COLOR : accent}
                mono={level > 1}
              >
                {level > 1 && (
                  <div className="-mt-1 mb-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-ink-soft">{v.ownLabel}</span>
                    {ownFieldsNow.map((f) => fieldChip(f, FIELD[f].intrinsic ? 'bad' : 'own'))}
                    <motion.span
                      animate={placing ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                      className={`ml-auto font-mono text-xs font-bold tabular-nums ${level === 2 && s2.heavyOwn ? 'text-chili' : 'text-ink'}`}
                    >
                      = {bytes(level === 2 ? s2.ownBytes : OWN_FULL)}
                    </motion.span>
                  </div>
                )}
                {mapSample}
                <p className="mt-1 text-[10px] text-ink-soft">{v.ghostNote}</p>
                {memoryBar}
                {resultBadge}
              </Node>
            </motion.div>
          )}
        </AnimatePresence>
      </Stage>

      <Caption label={v.whatsHappening} text={caption} stepKey={`${captionKey}-${lang}-${turnIdx}-${player.index}`} />

      {outcome && !levelDone && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
          <Button variant="primary" onClick={afterOutcome} data-game="after-outcome">
            {outcome === 'fail' ? `↻ ${v.tryAgain}` : isLastTurn ? `🏁 ${v.finishLevel}` : `${v.nextArea} →`}
          </Button>
        </motion.div>
      )}

      {!levelDone && (
        <StepControls
          player={controls}
          playLabel={level === 3 ? `🛺 ${v.showVehicles}` : `🚲 ${v.showButton}`}
          disabled={!ready || outcome !== null || panel !== null}
        />
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
