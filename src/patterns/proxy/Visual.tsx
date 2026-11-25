import { AnimatePresence, motion } from 'framer-motion'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { ChoiceButton, GameHud, LevelCompleteCard, MissionBanner, NewCodeChip, Recap } from '@/components/game'
import { type Level, starsFor, useGameProgress, useShake } from '@/components/game/state'
import { Button } from '@/components/ui/Button'
import { StepControls } from '@/components/ui/StepControls'
import { Caption, Connector, Node, Packet, Stage, StatusDot } from '@/components/visual'
import { type PlayerStep, useStepPlayer } from '@/hooks/useStepPlayer'
import { formatNumber, formatTaka } from '@/lib/format'
import { fill } from '@/lib/template'
import type { CodeView, VisualProps } from '@/types/pattern'
import type { ProxyContent } from './content.en'

/*
 * "Nusrat's remittance counter": a 3-level game.
 *   Level 1  no pattern: the counter gets every rate itself; the learner picks the source by hand (slow bank,
 *            hand-written notebook or the last rate on screen); a hurried customer walks out, a blank note
 *            quotes ৳0, the last rate quotes the wrong currency (`without`)
 *   Level 2  Proxy: the learner picks which RateService to plug into the counter; the shared
 *            CachedRateService answers repeats from its cache and only forwards misses to the bank (`main`)
 *   Level 3  the learner builds LoggingRateService (2 questions) and stacks it on top of the cache (`with`)
 * Every turn is a step timeline, so the code panel lights up in sync.
 */

type Labels = ProxyContent['visual']
type LabelKey = keyof Labels
type Cur = 'USD' | 'SAR' | 'MYR'
type Src = 'bank' | 'notebook' | 'last'
type Wire = 'bank' | 'shared' | 'fresh'
type L1Result = 'ok' | 'slow' | 'blank' | 'none' | 'wrong'
type Mood = 'served' | 'left' | 'wrong' | 'norate'

/* ------------------------------------------------------------------ */
/* Scenario data (illustrative rates, fees and timings)                */
/* ------------------------------------------------------------------ */

const OK_COLOR = '#0b6b4f'
const FAIL_COLOR = '#B91C1C'
const PROXY_COLOR = '#7C3AED'
const LOG_COLOR = '#C2410C'
const BANK_COLOR = '#1D4ED8'

const RATE: Record<Cur, number> = { USD: 122, SAR: 32.5, MYR: 27 }
const CUR_COLOR: Record<Cur, string> = { USD: '#1D4ED8', SAR: '#0F766E', MYR: '#B45309' }
/** One bank call: seconds the customer waits, and the fee the shop pays (৳). */
const BANK_SECONDS = 3
const BANK_FEE = 2
/** What the shop earns for serving one customer (৳). */
const SERVICE = 10
const PATIENCE = { patient: 5, hurry: 1 }

interface Req {
  name: LabelKey
  emoji: string
  cur: Cur
  amount: number
  hurry?: boolean
}

/** Each turn is a small queue: one customer in levels 1 and 3, two in level 2. */
const TURNS: Record<Level, Req[][]> = {
  1: [
    [{ name: 'rahim', emoji: '👨', cur: 'USD', amount: 500 }],
    [{ name: 'karim', emoji: '🧔', cur: 'SAR', amount: 2000 }],
    [{ name: 'mitu', emoji: '👩', cur: 'USD', amount: 300, hurry: true }],
  ],
  2: [
    [
      { name: 'tania', emoji: '👩‍🎓', cur: 'USD', amount: 200 },
      { name: 'rahim', emoji: '👨', cur: 'USD', amount: 500, hurry: true },
    ],
    [
      { name: 'karim', emoji: '🧔', cur: 'SAR', amount: 1500 },
      { name: 'mitu', emoji: '👩', cur: 'USD', amount: 300, hurry: true },
    ],
    [
      { name: 'sumon', emoji: '🧑', cur: 'MYR', amount: 2000 },
      { name: 'tania', emoji: '👩‍🎓', cur: 'SAR', amount: 800, hurry: true },
    ],
  ],
  3: [
    [{ name: 'karim', emoji: '🧔', cur: 'SAR', amount: 2000 }],
    [{ name: 'mitu', emoji: '👩', cur: 'SAR', amount: 1000, hurry: true }],
    [{ name: 'rahim', emoji: '👨', cur: 'USD', amount: 400 }],
  ],
}
/** Level 1, customer 1 is a guided tutorial: the bank is pre-selected. */
const TUTORIAL_PICK: Src = 'bank'
const SOURCES: { id: Src; icon: string; label: LabelKey }[] = [
  { id: 'bank', icon: '🏦', label: 'srcBank' },
  { id: 'notebook', icon: '📝', label: 'srcNotebook' },
  { id: 'last', icon: '🖥️', label: 'srcLast' },
]
const WIRES: { id: Wire; icon: string; label: LabelKey; color: string }[] = [
  { id: 'bank', icon: '🏦', label: 'wireBank', color: BANK_COLOR },
  { id: 'fresh', icon: '🔁', label: 'wireFresh', color: LOG_COLOR },
  { id: 'shared', icon: '🛡️', label: 'wireShared', color: PROXY_COLOR },
]
const LEVEL_ICON: Record<Level, string> = { 1: '📝', 2: '🛡️', 3: '🧾' }

/** Currencies asked in the earlier turns of a level, in order (what the notebook / shared cache holds). */
const knownBefore = (level: Level, turnIdx: number): Cur[] => {
  const seen: Cur[] = []
  for (const turn of TURNS[level].slice(0, turnIdx)) for (const r of turn) if (!seen.includes(r.cur)) seen.push(r.cur)
  return seen
}

/** Level 1: the counter picked the source itself. */
function judgeL1(src: Src, req: Req, turnIdx: number) {
  const notebook = knownBefore(1, turnIdx)
  const lastCur: Cur | null = turnIdx > 0 ? TURNS[1][turnIdx - 1][0].cur : null
  let result: L1Result
  let rate: number
  if (src === 'bank') {
    result = req.hurry ? 'slow' : 'ok'
    rate = RATE[req.cur]
  } else if (src === 'notebook') {
    const found = notebook.includes(req.cur)
    result = found ? 'ok' : 'blank'
    rate = found ? RATE[req.cur] : 0
  } else if (lastCur === null) {
    result = 'none'
    rate = 0
  } else {
    result = lastCur === req.cur ? 'ok' : 'wrong'
    rate = RATE[lastCur]
  }
  const repeat = src === 'bank' && notebook.includes(req.cur)
  const mood: Mood = result === 'ok' ? 'served' : result === 'slow' ? 'left' : result === 'wrong' ? 'wrong' : 'norate'
  const coins = result === 'ok' ? SERVICE - (src === 'bank' ? BANK_FEE : 0) : 0
  return { result, rate, lastCur, notebook, repeat, mood, coins, found: notebook.includes(req.cur) }
}

/** Levels 2–3: what happens to each request with this RateService plugged in. */
function simulate(level: Level, turnIdx: number, wire: Wire) {
  const before = knownBefore(level, turnIdx)
  const cache = new Set<Cur>(wire === 'shared' ? before : [])
  const seen = new Set<Cur>(before)
  const reqs = TURNS[level][turnIdx].map((req) => {
    const hit = wire !== 'bank' && wire !== 'fresh' && cache.has(req.cur)
    if (!hit && wire === 'shared') cache.add(req.cur)
    const repeat = !hit && seen.has(req.cur)
    seen.add(req.cur)
    const waited = hit ? 0 : BANK_SECONDS
    const mood: Mood = waited > (req.hurry ? PATIENCE.hurry : PATIENCE.patient) ? 'left' : 'served'
    return { req, hit, repeat, waited, mood }
  })
  const ok = reqs.every((r) => r.mood === 'served')
  const calls = reqs.filter((r) => !r.hit).length
  const coins = ok ? reqs.length * SERVICE - calls * BANK_FEE : 0
  return { reqs, ok, calls, coins, cacheBefore: wire === 'shared' ? before : [] }
}

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

type Kind =
  | 'start'
  | 'route'
  | 'call'
  | 'note'
  | 'lookup'
  | 'reply'
  | 'result'
  | 'wire'
  | 'ask'
  | 'fresh'
  | 'check'
  | 'hit'
  | 'forward'
  | 'bank'
  | 'store'
  | 'log'
  | 'delegate'
  | 'done'

interface GameStep extends PlayerStep {
  kind: Kind
  caption: string
  /** Index of the request in the turn's queue this step is about. */
  req: number
}

/** Step codeSteps match the `// @step:` markers in code/*.ts. */
function buildSteps(level: Level, turnIdx: number, pick: Src | null, wire: Wire | null, ready: boolean): GameStep[] {
  if (!ready) return []
  if (level === 1) {
    if (!pick) return []
    const req = TURNS[1][turnIdx][0]
    const j = judgeL1(pick, req, turnIdx)
    const middle: GameStep[] =
      pick === 'bank'
        ? [
            { id: 'l1-call', kind: 'call', caption: 'l1-call', req: 0, duration: 2000 },
            { id: 'l1-note', kind: 'note', caption: 'l1-note', req: 0, duration: 1600 },
          ]
        : [
            {
              id: 'l1-lookup',
              codeStep: `l1-${pick}`,
              kind: 'lookup',
              caption: pick === 'notebook' ? (j.found ? 'l1-lookup-found' : 'l1-lookup-blank') : j.lastCur ? 'l1-lookup-last' : 'l1-lookup-none',
              req: 0,
              duration: 1800,
            },
          ]
    return [
      { id: 'l1-start', kind: 'start', caption: 'l1-start', req: 0, duration: 1400 },
      { id: 'l1-route', codeStep: `l1-${pick}`, kind: 'route', caption: `l1-route-${pick}`, req: 0, duration: 1500 },
      ...middle,
      { id: 'l1-reply', kind: 'reply', caption: 'l1-reply', req: 0, duration: 1500 },
      { id: 'l1-result', kind: 'result', caption: j.result === 'ok' ? 'l1-ok' : `l1-fail-${j.result}`, req: 0, duration: 1500 },
    ]
  }

  const l3 = level === 3
  const w: Wire = l3 ? 'shared' : (wire ?? 'shared')
  const sim = simulate(level, turnIdx, w)
  const out: GameStep[] = [
    { id: 'wire', codeStep: l3 ? 'wire-new' : 'wire', kind: 'wire', caption: l3 ? 'wire-new' : `wire-${w}`, req: 0, duration: 1600 },
  ]
  sim.reqs.forEach(({ hit, mood }, i) => {
    const cs = (l2: string, l3id: string) => (l3 ? l3id : l2)
    out.push({ id: `ask-${i}`, codeStep: cs('ask', 'ask-new'), kind: 'ask', caption: l3 ? 'ask-new' : 'ask', req: i, duration: 1300 })
    if (l3) {
      out.push({ id: `log-${i}`, codeStep: 'log', kind: 'log', caption: 'log', req: i, duration: 1500 })
      out.push({ id: `delegate-${i}`, codeStep: 'delegate', kind: 'delegate', caption: 'delegate', req: i, duration: 1300 })
    }
    if (w === 'bank') {
      out.push({ id: `bank-${i}`, codeStep: 'bank', kind: 'bank', caption: 'bank-direct', req: i, duration: 2000 })
    } else {
      if (w === 'fresh') out.push({ id: `fresh-${i}`, codeStep: 'wire', kind: 'fresh', caption: 'fresh', req: i, duration: 1500 })
      out.push({ id: `check-${i}`, codeStep: cs('check', 'cache'), kind: 'check', caption: hit ? 'check-hit' : 'check-miss', req: i, duration: 1500 })
      if (hit) {
        out.push({ id: `hit-${i}`, codeStep: cs('hit', 'cache'), kind: 'hit', caption: 'hit', req: i, duration: 1400 })
      } else {
        out.push({ id: `forward-${i}`, codeStep: cs('forward', 'cache'), kind: 'forward', caption: 'forward', req: i, duration: 1200 })
        out.push({ id: `bank-${i}`, codeStep: cs('bank', 'bank-new'), kind: 'bank', caption: 'bank', req: i, duration: 2000 })
        out.push({ id: `store-${i}`, codeStep: cs('store', 'cache'), kind: 'store', caption: 'store', req: i, duration: 1400 })
      }
    }
    const reply = l3 ? 'reply-new' : hit ? 'reply-fast' : mood === 'left' ? 'reply-left' : 'reply-slow'
    out.push({ id: `reply-${i}`, codeStep: cs('reply', 'reply-new'), kind: 'reply', caption: reply, req: i, duration: 1400 })
  })
  out.push({
    id: 'done',
    codeStep: l3 ? 'done-new' : 'done',
    kind: 'done',
    caption: l3 ? 'done-new' : sim.ok ? 'done-ok' : `done-${w}`,
    req: sim.reqs.length - 1,
    duration: 1500,
  })
  return out
}

/* ------------------------------------------------------------------ */
/* Visual                                                              */
/* ------------------------------------------------------------------ */

export default function ProxyVisual({ content, lang, onCodeStep, onCodeView }: VisualProps<ProxyContent>) {
  const v = content.visual
  const captions: Record<string, string> = content.steps
  const label = (key: LabelKey) => v[key]

  const { progress, addCoins, completeLevel, reset: resetProgress } = useGameProgress('dpp-proxy-game')
  const shake = useShake()
  const [level, setLevel] = useState<Level>(1)
  const [turnIdx, setTurnIdx] = useState(0)
  const [results, setResults] = useState<('ok' | 'fail')[]>([])
  const [mistakes, setMistakes] = useState(0)
  const [pick, setPick] = useState<Src | null>(TUTORIAL_PICK) // level 1, customer 1 is a guided tutorial
  const [wire, setWire] = useState<Wire | null>(null)
  const [built, setBuilt] = useState(false)
  const [panel, setPanel] = useState<'q1' | 'q2' | 'ready' | null>(null)
  const [hint, setHint] = useState<{ key: string } | null>(null)
  const [levelDone, setLevelDone] = useState(false)
  const [lastStars, setLastStars] = useState(0)

  const queue = TURNS[level][turnIdx]
  const ready = level === 1 ? pick !== null : level === 2 ? wire !== null : built
  const steps = useMemo(() => buildSteps(level, turnIdx, pick, wire, ready), [level, turnIdx, pick, wire, ready])
  const player = useStepPlayer(steps)
  const step = player.step
  const kind = step?.kind ?? null
  const busy = player.index >= 0
  const stepIs = (...kinds: Kind[]) => kind !== null && kinds.includes(kind)
  /** Has the run reached a step of this kind for request i (at or before the current step)? */
  const reached = (k: Kind, i: number) => steps.slice(0, player.index + 1).some((s) => s.kind === k && s.req === i)

  const effWire: Wire = level === 3 ? 'shared' : (wire ?? 'shared')
  const l1 = level === 1 && pick ? judgeL1(pick, queue[0], turnIdx) : null
  const sim = level === 1 ? null : simulate(level, turnIdx, effWire)
  const willSucceed = l1 ? l1.result === 'ok' : (sim?.ok ?? false)
  const outcome: 'ok' | 'fail' | null = player.done ? (willSucceed ? 'ok' : 'fail') : null
  const turnCoins = l1 ? l1.coins : (sim?.coins ?? 0)
  const pendingCoins = outcome === 'ok' ? turnCoins : 0
  const accent = level === 1 ? FAIL_COLOR : level === 3 ? LOG_COLOR : PROXY_COLOR
  const reqIdx = step?.req ?? 0
  const cur = queue[reqIdx] ?? queue[0]

  /* ---------------- code panel sync ---------------- */

  const view: CodeView = level === 1 ? 'without' : level === 2 ? 'main' : 'with'
  useEffect(() => {
    onCodeView?.(view)
  }, [view, onCodeView])
  useEffect(() => () => onCodeView?.('main'), [onCodeView])

  let idleCode: string | null = null
  if (level === 1) idleCode = levelDone ? 'l1-copy' : pick ? `l1-${pick}` : 'l1-start'
  else if (levelDone) idleCode = null
  else if (level === 2) idleCode = 'wire'
  else idleCode = panel === 'q1' ? 'build-class' : panel === 'q2' ? 'build-hold' : panel === 'ready' ? 'client-same' : 'wire-new'
  const codeStep = step ? (step.codeStep ?? step.id) : idleCode
  useEffect(() => {
    onCodeStep(codeStep)
  }, [codeStep, onCodeStep])

  /* ---------------- actions ---------------- */

  const resetTurn = () => {
    player.reset()
    setPick(null)
    setHint(null)
  }

  const startLevel = (n: Level) => {
    resetTurn()
    setLevel(n)
    setTurnIdx(0)
    setResults([])
    setMistakes(0)
    if (n === 1) setPick(TUTORIAL_PICK)
    setWire(null)
    setBuilt(false)
    setPanel(n === 3 ? 'q1' : null)
    setLevelDone(false)
  }

  const restartGame = () => {
    resetProgress()
    startLevel(1)
  }

  const choose = (s: Src) => {
    if (busy) return
    player.reset()
    setHint(null)
    setPick(s)
  }

  const plug = (w: Wire) => {
    if (busy) return
    player.reset()
    setHint(null)
    setWire(w)
  }

  const answerQ1 = (id: 'implements' | 'extends' | 'counter') => {
    if (panel !== 'q1') return
    if (id === 'implements') {
      setHint(null)
      setPanel('q2')
      return
    }
    shake.bump(`q1-${id}`)
    setMistakes((m) => m + 1)
    setHint({ key: id === 'extends' ? 'wrong-q1-extends' : 'wrong-q1-counter' })
  }

  const answerQ2 = (id: 'inner' | 'bank' | 'counter') => {
    if (panel !== 'q2') return
    if (id === 'inner') {
      setHint(null)
      setPanel('ready')
      return
    }
    shake.bump(`q2-${id}`)
    setMistakes((m) => m + 1)
    setHint({ key: id === 'bank' ? 'wrong-q2-bank' : 'wrong-q2-counter' })
  }

  const plugLogging = () => {
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
    resetTurn() // level 2: the plugged-in RateService stays for the next customers
    if (!wasOk) {
      setMistakes((m) => m + 1)
      return // the same customers again
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

  const amountText = (r: Req) => `${formatNumber(r.amount, lang)} ${r.cur}`
  const usedRate = l1 ? l1.rate : RATE[cur.cur]
  const simReq = sim?.reqs[reqIdx]
  const auditBefore = level === 3 ? TURNS[3].slice(0, turnIdx).flat() : []
  const values: Record<string, string> = {
    name: label(cur.name),
    amount: amountText(cur),
    cur: cur.cur,
    rate: formatTaka(level === 1 ? usedRate : RATE[cur.cur], lang),
    quote: formatTaka(cur.amount * (level === 1 ? usedRate : RATE[cur.cur]), lang),
    rightQuote: formatTaka(cur.amount * RATE[cur.cur], lang),
    lastRate: l1?.lastCur ? formatTaka(RATE[l1.lastCur], lang) : '',
    lastCur: l1?.lastCur ?? '',
    source: pick ? label(SOURCES.find((s) => s.id === pick)!.label) : '',
    patience: label(cur.hurry ? 'hurry' : 'patient'),
    queue: queue.map((r) => `${label(r.name)} · ${r.cur}`).join(', '),
    wiring: wire ? label(WIRES.find((w) => w.id === wire)!.label) : '',
    coins: formatTaka(turnCoins, lang),
    calls: formatNumber(sim?.calls ?? 0, lang),
    s: formatNumber(simReq?.waited ?? BANK_SECONDS, lang),
    logs: formatNumber(auditBefore.length + 1, lang),
  }

  let captionKey: string
  if (step) captionKey = step.caption
  else if (hint) captionKey = hint.key
  else if (levelDone) captionKey = `level${level}-done`
  else if (panel === 'q1') captionKey = 'build-q1'
  else if (panel === 'q2') captionKey = 'build-q2'
  else if (panel === 'ready') captionKey = 'build-ready'
  else if (level === 1) captionKey = turnIdx === 0 && results.length === 0 && pick === TUTORIAL_PICK ? 'tutorial' : pick ? 'picked1' : 'idle1'
  else if (level === 2) captionKey = wire ? 'picked2' : 'idle2'
  else captionKey = 'build-done'
  const caption = fill(captions[captionKey] ?? '', values)

  /* ---------------- pieces ---------------- */

  const turnOf = fill(v.turnOf, { n: formatNumber(turnIdx + 1, lang), total: formatNumber(TURNS[level].length, lang) })
  const finished = stepIs('result', 'done')
  const secs = (n: number) => fill(v.secs, { s: formatNumber(n, lang) })

  const curChip = (c: Cur, extra?: ReactNode, glow = false, key?: string) => (
    <motion.span
      key={key ?? c}
      layout
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: glow ? [1, 1.12, 1] : 1 }}
      transition={{ duration: 0.4 }}
      className={`inline-flex items-center gap-1 rounded-md border-2 px-1.5 py-0.5 font-mono text-[11px] font-bold text-ink ${
        glow ? 'border-edge bg-mustard text-on-accent shadow-hard-sm' : 'border-edge/40 bg-card'
      }`}
    >
      <span className="size-2 rounded-full" style={{ backgroundColor: CUR_COLOR[c] }} aria-hidden="true" />
      <span lang="en">{c}</span>
      {extra}
    </motion.span>
  )

  /** A status line inside a node. */
  const statusLine = (text: string, tone: 'ok' | 'bad' | 'idle' | 'info', icon?: string) => (
    <AnimatePresence mode="wait" initial={false}>
      <motion.p
        key={text}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className={`text-[11px] leading-snug ${
          tone === 'ok' ? 'font-semibold text-bottle dark:text-jade' : tone === 'bad' ? 'font-bold text-chili' : tone === 'info' ? 'font-semibold text-ink' : 'text-ink-soft'
        }`}
      >
        {icon && <span aria-hidden="true">{icon} </span>}
        {text}
      </motion.p>
    </AnimatePresence>
  )

  /* Customer mood once their reply has arrived. */
  const moodOf = (i: number): Mood | null => {
    if (!busy || !reached('reply', i)) return null
    if (l1) return l1.mood
    return sim?.reqs[i]?.mood ?? null
  }
  const moodLine = (r: Req, i: number) => {
    const mood = moodOf(i)
    if (mood === null) return statusLine(busy && reqIdx === i ? v.waitingMood : label(r.hurry ? 'hurry' : 'patient'), r.hurry ? 'info' : 'idle', r.hurry ? '🏃' : '⏳')
    if (mood === 'served') {
      const q = formatTaka(r.amount * (l1 ? l1.rate : RATE[r.cur]), lang)
      return statusLine(fill(v.servedMood, { quote: q }), 'ok', '😊')
    }
    if (mood === 'left') return statusLine(fill(v.leftMood, { s: formatNumber(BANK_SECONDS, lang) }), 'bad', '😠')
    if (mood === 'wrong') return statusLine(v.wrongMood, 'bad', '😱')
    return statusLine(v.noRateMood, 'bad', '😵')
  }

  /* Bank: calls and fees so far in this run, and whether one was a repeat. */
  const bankSteps = steps.slice(0, player.index + 1).filter((s) => s.kind === 'bank' || s.kind === 'call')
  const callsSoFar = busy ? bankSteps.length : 0
  const wastedCur: Cur | null = (() => {
    for (const s of bankSteps) {
      if (l1 ? l1.repeat : sim?.reqs[s.req]?.repeat) return queue[s.req].cur
    }
    return null
  })()
  const bankBusy = stepIs('bank', 'call')

  const bankNode = (
    <Node role={v.realRole} title="🏦 BankRateService" active={bankBusy} accent={wastedCur && bankBusy ? FAIL_COLOR : BANK_COLOR} mono>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <code lang="en" className="truncate font-mono text-[11px] text-ink-soft">
            {v.bankWait}
          </code>
          {statusLine(bankBusy ? v.busyBank : v.idleBank, bankBusy ? 'info' : 'idle', bankBusy ? '⏱' : undefined)}
        </div>
        <div className="h-2.5 overflow-hidden rounded-full border-2 border-edge/50 bg-paper" aria-hidden="true">
          {bankBusy && (
            <motion.div
              key={`bar-${player.index}`}
              className="h-full bg-chili"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: (step?.duration ?? 2000) / 1000 / player.speed, ease: 'linear' }}
            />
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <span
            className={`rounded-md border-2 px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${
              wastedCur ? 'border-chili bg-chili text-cream' : 'border-edge/40 text-ink'
            }`}
          >
            🧾 {fill(v.calls, { n: formatNumber(callsSoFar, lang), fee: formatTaka(callsSoFar * BANK_FEE, lang) })}
          </span>
          {wastedCur && <span className="text-[11px] font-bold text-chili">⚠️ {fill(v.wasted, { cur: wastedCur })}</span>}
        </div>
      </div>
    </Node>
  )

  /* Proxy (CachedRateService): its cache. */
  const cacheNow: Cur[] = (() => {
    if (!sim) return []
    if (effWire === 'fresh') {
      if (!busy) return []
      return reached('store', reqIdx) ? [queue[reqIdx].cur] : []
    }
    const rows = [...sim.cacheBefore]
    if (busy) sim.reqs.forEach((r, i) => !r.hit && reached('store', i) && !rows.includes(r.req.cur) && rows.push(r.req.cur))
    return rows
  })()
  const checking = stepIs('check', 'hit')
  const proxyActive = stepIs('fresh', 'check', 'hit', 'forward', 'store')
  const hitNow = checking && simReq?.hit

  const proxyNode = (
    <Node
      role={v.proxyRole}
      title="🛡️ CachedRateService"
      active={proxyActive}
      accent={stepIs('check') && !simReq?.hit ? BANK_COLOR : PROXY_COLOR}
      mono
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="label-caps text-ink-soft">{v.cacheLabel}:</span>
        <AnimatePresence initial={false}>
          {cacheNow.length === 0 ? (
            <motion.span key="empty" className="text-[11px] text-ink-soft" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {v.cacheEmpty}
            </motion.span>
          ) : (
            cacheNow.map((c) =>
              curChip(
                c,
                <span className="font-sans tabular-nums">{formatTaka(RATE[c], lang)}</span>,
                Boolean(hitNow && c === cur.cur) || (stepIs('store') && c === cur.cur),
              ),
            )
          )}
        </AnimatePresence>
      </div>
      <div className="mt-2 flex min-h-5 flex-wrap items-center gap-2">
        {stepIs('fresh') && (
          <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="rounded border-2 border-chili px-1.5 text-[10px] font-bold text-chili uppercase">
            🆕 {v.newProxyTag}
          </motion.span>
        )}
        {checking && simReq && (
          <motion.span
            key={`tag-${player.index}`}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`rounded px-1.5 text-[10px] font-bold uppercase ${simReq.hit ? 'bg-bottle text-cream' : 'bg-chili text-cream'}`}
          >
            {simReq.hit ? `⚡ ${v.hitTag} · ${secs(0)} · ${formatTaka(0, lang)}` : `✗ ${v.missTag} · ${cur.cur}`}
          </motion.span>
        )}
      </div>
    </Node>
  )

  /* Level 3: LoggingRateService and its audit log. */
  const auditRows = [...auditBefore, ...(busy && reached('log', 0) ? [queue[0]] : [])]
  const loggingNode = (
    <Node role={v.proxyRole} title="🧾 LoggingRateService" active={stepIs('log', 'delegate')} accent={LOG_COLOR} mono>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="label-caps text-ink-soft">{v.auditLabel}:</span>
        <span className="rounded bg-bottle px-1 text-[9px] font-bold text-cream uppercase">{v.newTag}</span>
      </div>
      <ol className="mt-1.5 flex flex-col gap-1">
        <AnimatePresence initial={false}>
          {auditRows.length === 0 ? (
            <motion.li key="none" className="text-[11px] text-ink-soft" exit={{ opacity: 0 }}>
              {v.auditEmpty}
            </motion.li>
          ) : (
            auditRows.map((r, i) => (
              <motion.li
                key={`${i}-${r.cur}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex min-w-0 items-center gap-2 rounded-md border-2 px-2 py-0.5 text-[11px] ${
                  stepIs('log') && i === auditRows.length - 1 ? 'border-edge bg-mustard/30' : 'border-edge/30'
                }`}
              >
                <span className="font-mono text-ink-soft tabular-nums">#{formatNumber(i + 1, lang)}</span>
                <span className="min-w-0 flex-1 truncate font-semibold text-ink">{label(r.name)}</span>
                {curChip(r.cur)}
              </motion.li>
            ))
          )}
        </AnimatePresence>
      </ol>
    </Node>
  )

  const resultBanner = (
    <AnimatePresence>
      {finished && (
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
            {willSucceed ? '✅' : l1?.result === 'wrong' ? '😱' : '😠'}
          </motion.span>
          {willSucceed ? fill(v.resultOk, { coins: formatTaka(turnCoins, lang) }) : v.resultBad}
        </motion.div>
      )}
    </AnimatePresence>
  )

  /* Packets. */
  const askPacket = (
    <Packet color={CUR_COLOR[cur.cur]}>
      💱 <span lang="en">{cur.cur}?</span>
    </Packet>
  )
  const rateOk = level === 1 ? (l1?.result === 'ok' || l1?.result === 'slow') : true
  const ratePacket = (
    <Packet color={rateOk ? OK_COLOR : FAIL_COLOR}>
      {rateOk ? '✓' : '✗'} {formatTaka(level === 1 ? usedRate : RATE[cur.cur], lang)}
    </Packet>
  )
  const hitPacket = <Packet color={OK_COLOR}>⚡ {formatTaka(RATE[cur.cur], lang)}</Packet>
  const replyPacket = simReq?.hit ? hitPacket : ratePacket

  /* L1 middle: the counter's own if/else. */
  const l1Row = (s: Src) => {
    const lit = pick === s && stepIs('route', 'lookup', 'note')
    const chosen = pick === s
    let detail: ReactNode
    if (s === 'bank') detail = <span className="text-[11px] text-ink-soft tabular-nums">{`${secs(BANK_SECONDS)} · ${formatTaka(BANK_FEE, lang)}`}</span>
    else if (s === 'notebook') {
      const notes = [...(l1?.notebook ?? knownBefore(1, turnIdx))]
      if (busy && reached('note', 0) && !notes.includes(queue[0].cur)) notes.push(queue[0].cur)
      detail = (
        <span className="flex flex-wrap justify-end gap-1">
          <AnimatePresence initial={false}>
            {notes.length === 0 ? (
              <motion.span key="blank" className="text-[11px] text-ink-soft" exit={{ opacity: 0 }}>
                {v.emptyNotes}
              </motion.span>
            ) : (
              notes.map((c) => curChip(c, <span className="font-sans tabular-nums">{formatTaka(RATE[c], lang)}</span>, (stepIs('note') || (stepIs('lookup') && pick === 'notebook')) && c === queue[0].cur))
            )}
          </AnimatePresence>
        </span>
      )
    } else {
      const lastCur: Cur | null = turnIdx > 0 ? TURNS[1][turnIdx - 1][0].cur : null
      detail = lastCur ? (
        curChip(lastCur, <span className="font-sans tabular-nums">{formatTaka(RATE[lastCur], lang)}</span>, stepIs('lookup') && pick === 'last')
      ) : (
        <span className="text-[11px] text-ink-soft">{v.noneYet}</span>
      )
    }
    const src = SOURCES.find((x) => x.id === s)!
    return (
      <motion.li
        key={s}
        layout
        animate={{ x: lit ? 4 : 0 }}
        className={`flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 rounded-md border-2 px-2 py-1 text-xs ${
          lit ? 'border-edge bg-card shadow-hard-sm' : chosen ? 'border-dashed border-edge/50' : 'border-transparent'
        }`}
      >
        <StatusDot status={lit ? 'active' : chosen && player.index > 1 ? 'done' : 'pending'} color={accent} />
        <span className="min-w-0 flex-1 truncate font-bold text-ink">
          <span aria-hidden="true">{src.icon} </span>
          {s === 'bank' ? v.srcBank : s === 'notebook' ? v.notebookLabel : v.lastLabel}
        </span>
        <span className="ml-auto shrink-0">{detail}</span>
      </motion.li>
    )
  }

  /* L3 builder. */
  const builder = (
    <div className="flex flex-col gap-3 rounded-lg border-2 border-dashed p-3" style={{ borderColor: LOG_COLOR }}>
      <p className="font-display font-bold text-ink">🔨 {v.builderTitle}</p>
      <div>
        <p className="label-caps text-ink-soft">{v.builderStep1}</p>
        <p className="mb-2 text-sm text-ink">{v.q1}</p>
        <div role="radiogroup" aria-label={v.builderStep1} className="grid grid-cols-1 gap-2">
          {(
            [
              ['extends', v.q1Extends, true],
              ['counter', v.q1Counter, false],
              ['implements', v.q1Implements, true],
            ] as const
          ).map(([id, text, mono]) => (
            <ChoiceButton
              key={id}
              selected={panel !== 'q1' && id === 'implements'}
              color={LOG_COLOR}
              text={text}
              onClick={() => answerQ1(id)}
              animate={shake.anim(`q1-${id}`)}
              mono={mono}
              className={panel !== 'q1' && id !== 'implements' ? 'opacity-40' : ''}
            />
          ))}
        </div>
        {panel !== 'q1' && <NewCodeChip>+ class LoggingRateService implements RateService</NewCodeChip>}
      </div>

      {panel !== 'q1' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="label-caps text-ink-soft">{v.builderStep2}</p>
          <p className="mb-2 text-sm text-ink">{v.q2}</p>
          <div role="radiogroup" aria-label={v.builderStep2} className="grid grid-cols-1 gap-2">
            {(
              [
                ['bank', v.q2Bank],
                ['inner', v.q2Inner],
                ['counter', v.q2Counter],
              ] as const
            ).map(([id, text]) => (
              <ChoiceButton
                key={id}
                selected={panel === 'ready' && id === 'inner'}
                color={LOG_COLOR}
                text={text}
                onClick={() => answerQ2(id)}
                animate={shake.anim(`q2-${id}`)}
                className={panel === 'ready' && id !== 'inner' ? 'opacity-40' : ''}
              />
            ))}
          </div>
          {panel === 'ready' && <NewCodeChip>+ return inner.getRate(currency)</NewCodeChip>}
        </motion.div>
      )}

      {panel === 'ready' && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full border-2 border-bottle bg-bottle/10 px-2 py-0.5 text-xs font-bold text-bottle dark:border-jade dark:text-jade">
            ✓ {v.zeroEdits}
          </span>
          <Button variant="primary" onClick={plugLogging} data-game="open-branch">
            🔌 {v.plugLogging}
          </Button>
        </motion.div>
      )}
    </div>
  )

  const curLabel = `"${cur.cur}"`

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
                    {'+ if (notebook.has(cur)) … ×3 ???'}
                  </code>
                </>
              )}
              {level === 2 && <p className="prose-text text-sm text-ink">{v.l2Summary}</p>}
              {level === 3 && (
                <Recap
                  title={v.recapTitle}
                  items={[
                    { icon: '📝', text: v.recap1 },
                    { icon: '🛡️', text: v.recap2 },
                    { icon: '🧾', text: v.recap3 },
                  ]}
                />
              )}
            </LevelCompleteCard>
          ) : (
            <motion.div key={`play-${level}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* ── Client: the counter, the queue and the learner's choice ── */}
              <Node role={v.clientRole} title={`🏪 ${v.counterTitle}`} active={stepIs('start', 'ask', 'reply', 'result', 'done')} accent={accent}>
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
                  <motion.ul
                    key={`${level}-${turnIdx}`}
                    initial={{ x: 40, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -40, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="mb-3 flex flex-col gap-2"
                  >
                    {queue.map((r, i) => (
                      <li
                        key={i}
                        className={`flex items-center gap-3 rounded-lg border-2 border-dashed bg-paper p-2.5 transition-colors ${
                          busy && reqIdx === i && !finished ? 'border-edge' : 'border-edge/50'
                        }`}
                      >
                        <span className="text-3xl" aria-hidden="true">
                          {r.emoji}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="flex items-baseline justify-between gap-2 font-bold text-ink">
                            <span className="truncate">{label(r.name)}</span>
                            <span className="shrink-0 tabular-nums">{amountText(r)}</span>
                          </p>
                          <div className="mt-0.5">{moodLine(r, i)}</div>
                        </div>
                      </li>
                    ))}
                  </motion.ul>
                </AnimatePresence>

                {level === 1 ? (
                  <>
                    <p id="px-pick-label" className="mb-1.5 label-caps text-ink-soft">
                      {v.pickLabel}
                    </p>
                    <div role="radiogroup" aria-labelledby="px-pick-label" className="grid grid-cols-1 gap-2 min-[560px]:grid-cols-3">
                      {SOURCES.map((s) => (
                        <ChoiceButton
                          key={s.id}
                          selected={pick === s.id}
                          color={s.id === 'bank' ? BANK_COLOR : s.id === 'notebook' ? OK_COLOR : LOG_COLOR}
                          icon={s.icon}
                          text={label(s.label)}
                          onClick={() => choose(s.id)}
                          animate={shake.anim(`p-${s.id}`)}
                        />
                      ))}
                    </div>
                    <p className="mt-2 border-t-2 border-dashed border-edge/40 pt-2 text-xs font-semibold text-chili">⚠️ {v.knowsL1}</p>
                  </>
                ) : level === 2 ? (
                  <>
                    <p id="px-wire-label" className="mb-1.5 label-caps text-ink-soft">
                      {v.wireLabel}
                    </p>
                    <div role="radiogroup" aria-labelledby="px-wire-label" className="grid grid-cols-1 gap-2">
                      {WIRES.map((w) => (
                        <ChoiceButton
                          key={w.id}
                          selected={wire === w.id}
                          color={w.color}
                          icon={w.icon}
                          text={label(w.label)}
                          onClick={() => plug(w.id)}
                          animate={shake.anim(`w-${w.id}`)}
                        />
                      ))}
                    </div>
                    <p className="mt-1.5 text-xs text-ink-soft">{v.wireHint}</p>
                    <p className="mt-2 border-t-2 border-dashed border-edge/40 pt-2 text-xs font-semibold text-ink">✓ {v.knowsL2}</p>
                  </>
                ) : panel ? (
                  builder
                ) : (
                  <>
                    <p className="text-xs font-semibold text-ink">✓ {v.knowsL2}</p>
                    <p className="mt-1 text-xs font-semibold text-bottle dark:text-jade">{v.othersSame}</p>
                  </>
                )}
              </Node>

              {level === 1 ? (
                <>
                  <Connector
                    label={`counter.quote(${curLabel}, …)`}
                    down={stepIs('start')}
                    up={stepIs('reply', 'result')}
                    downPacket={askPacket}
                    upPacket={ratePacket}
                    runKey={player.index}
                  />

                  {/* ── Middle: the counter's own if/else and hand-made cache ── */}
                  <Node role={v.noPatternRole} title={v.quoteTitle} active={stepIs('route', 'lookup', 'note')} accent={FAIL_COLOR} mono>
                    <ol className="flex flex-col gap-1.5">{SOURCES.map((s) => l1Row(s.id))}</ol>
                    <p className="mt-2 text-[10px] font-bold uppercase">
                      <span className="rounded border-2 border-chili/60 px-1.5 py-px text-chili">✍️ {v.handTag}</span>
                    </p>
                  </Node>

                  <Connector
                    label={`bank.getRate(${curLabel})`}
                    down={stepIs('call') && pick === 'bank'}
                    up={stepIs('note')}
                    downPacket={askPacket}
                    upPacket={ratePacket}
                    runKey={player.index}
                  />

                  {bankNode}
                  {resultBanner}
                </>
              ) : (
                <>
                  <Connector
                    label={`rates.getRate(${curLabel})`}
                    down={stepIs('ask')}
                    up={stepIs('reply')}
                    downPacket={askPacket}
                    upPacket={replyPacket}
                    runKey={player.index}
                  />

                  {/* ── Subject: whatever RateService is plugged in ── */}
                  <Node
                    role={v.subjectRole}
                    title="RateService"
                    active={stepIs('wire')}
                    accent={accent}
                    mono
                    className="!bg-paper"
                  >
                    <p className="-mt-1 mb-3 text-[11px] text-ink-soft">{v.subjectNote}</p>

                    {level === 3 &&
                      (built ? (
                        <>
                          {loggingNode}
                          <Connector
                            label={`inner.getRate(${curLabel})`}
                            down={stepIs('delegate')}
                            up={stepIs('reply')}
                            downPacket={askPacket}
                            upPacket={replyPacket}
                            runKey={player.index}
                          />
                        </>
                      ) : (
                        <div className="mb-3 flex min-w-0 items-center gap-2 rounded-xl border-2 border-dashed border-edge/50 p-2 text-xs text-ink-soft opacity-70">
                          <span aria-hidden="true">🔨</span>
                          <code lang="en" className="min-w-0 truncate font-mono font-bold text-ink">
                            LoggingRateService
                          </code>
                          <span className="ml-auto shrink-0">{v.notBuilt}</span>
                        </div>
                      ))}

                    {level === 2 && effWire === 'bank' && wire !== null ? (
                      <div className="mb-3 flex min-w-0 items-center gap-2 rounded-xl border-2 border-dashed border-edge/50 p-2 text-xs text-ink-soft opacity-70">
                        <span aria-hidden="true">🛡️</span>
                        <code lang="en" className="min-w-0 truncate font-mono font-bold text-ink">
                          CachedRateService
                        </code>
                        <span className="ml-auto shrink-0">{v.notWired}</span>
                      </div>
                    ) : (
                      <>
                        {proxyNode}
                        <Connector
                          label={`real.getRate(${curLabel})`}
                          down={stepIs('forward')}
                          up={stepIs('store')}
                          downPacket={askPacket}
                          upPacket={ratePacket}
                          runKey={player.index}
                        />
                      </>
                    )}

                    {bankNode}
                  </Node>

                  {resultBanner}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Stage>

      <Caption label={v.whatsHappening} text={caption} stepKey={`${captionKey}-${lang}-${turnIdx}-${player.index}`} />

      {outcome && !levelDone && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
          <Button variant="primary" onClick={afterOutcome} data-game="after-outcome">
            {outcome === 'fail' ? `↻ ${v.tryAgain}` : isLastTurn ? `🏁 ${v.finishLevel}` : `${v.nextCustomer} →`}
          </Button>
        </motion.div>
      )}

      {!levelDone && (
        <StepControls player={controls} playLabel={`💱 ${v.askButton}`} disabled={!ready || outcome !== null || panel !== null} />
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
