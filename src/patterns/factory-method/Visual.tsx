import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { StepControls } from '@/components/ui/StepControls'
import { Caption, Connector, Node, Packet, Stage, StatusDot, type Status } from '@/components/visual'
import { type PlayerStep, useStepPlayer } from '@/hooks/useStepPlayer'
import { formatNumber, formatTaka } from '@/lib/format'
import { fill } from '@/lib/template'
import type { CodeView, VisualProps } from '@/types/pattern'
import type { FactoryMethodContent } from './content.en'

/*
 * "Sathi Courier Dispatcher": a 3-level game.
 *   Level 1  no pattern: the learner picks every vehicle (code panel shows `without`)
 *   Level 2  Factory Method: the learner picks a branch, its createTransport() makes the vehicle
 *   Level 3  the learner builds SylhetBranch + Drone without editing old code (code panel shows `with`)
 * Every delivery is a step timeline, so the code panel lights up in sync.
 */

type Labels = FactoryMethodContent['visual']
type LabelKey = keyof Labels
type City = 'dhaka' | 'chattogram' | 'barishal' | 'sylhet'
type VehicleId = 'van' | 'truck' | 'launch' | 'drone'
type Level = 1 | 2 | 3
type Choice = VehicleId | City

/* ------------------------------------------------------------------ */
/* Scenario data                                                       */
/* ------------------------------------------------------------------ */

const VEHICLES: Record<VehicleId, { productClass: string; emoji: string; fee: number }> = {
  van: { productClass: 'RickshawVan', emoji: '🛺', fee: 60 },
  truck: { productClass: 'Truck', emoji: '🚚', fee: 150 },
  launch: { productClass: 'Launch', emoji: '⛴️', fee: 120 },
  drone: { productClass: 'Drone', emoji: '🚁', fee: 200 },
}

interface CityInfo {
  branchClass: string
  icon: string
  color: string
  vehicle: VehicleId
  dest: LabelKey
  eta: LabelKey
  how: string
  fail: string
  obstacle: string
  tracking: string
  route: string
}

// Fees are illustrative only (the UI says so).
const CITIES: Record<City, CityInfo> = {
  dhaka: {
    branchClass: 'DhakaBranch',
    icon: '🏙️',
    color: '#C2410C',
    vehicle: 'van',
    dest: 'mirpur',
    eta: 'etaDhaka',
    how: 'howDhaka',
    fail: 'fail-lanes',
    obstacle: '🚧',
    tracking: 'SC-1024',
    route: 'repeating-linear-gradient(90deg, #C2410C33 0 10px, transparent 10px 18px)',
  },
  chattogram: {
    branchClass: 'ChattogramBranch',
    icon: '⚓',
    color: '#4B5563',
    vehicle: 'truck',
    dest: 'agrabad',
    eta: 'etaChattogram',
    how: 'howChattogram',
    fail: 'fail-highway',
    obstacle: '⏰',
    tracking: 'SC-2048',
    route:
      'linear-gradient(#4B556340, #4B556340) center / 100% 100%, repeating-linear-gradient(90deg, #F5C518 0 14px, transparent 14px 26px) center / 100% 3px no-repeat',
  },
  barishal: {
    branchClass: 'BarishalBranch',
    icon: '🌊',
    color: '#1D6FA5',
    vehicle: 'launch',
    dest: 'bhola',
    eta: 'etaBarishal',
    how: 'howBarishal',
    fail: 'fail-river',
    obstacle: '🌊',
    tracking: 'SC-4096',
    route: 'repeating-linear-gradient(90deg, #1D6FA540 0 20px, #1D6FA526 20px 40px)',
  },
  sylhet: {
    branchClass: 'SylhetBranch',
    icon: '🍃',
    color: '#2F7D4F',
    vehicle: 'drone',
    dest: 'srimangal',
    eta: 'etaSylhet',
    how: 'howDhaka',
    fail: 'fail-lanes',
    obstacle: '⛰️',
    tracking: 'SC-8192',
    route: 'repeating-linear-gradient(90deg, #2F7D4F33 0 16px, transparent 16px 24px)',
  },
}

interface Order {
  item: LabelKey
  emoji: string
  city: City
}

const ORDERS: Record<Level, Order[]> = {
  1: [
    { item: 'saree', emoji: '🥻', city: 'dhaka' },
    { item: 'hilsa', emoji: '🐟', city: 'barishal' },
    { item: 'laptop', emoji: '💻', city: 'chattogram' },
  ],
  2: [
    { item: 'mango', emoji: '🥭', city: 'chattogram' },
    { item: 'books', emoji: '📚', city: 'dhaka' },
    { item: 'hilsa', emoji: '🐟', city: 'barishal' },
  ],
  3: [
    { item: 'tea', emoji: '🍵', city: 'sylhet' },
    { item: 'saree', emoji: '🥻', city: 'dhaka' },
    { item: 'tea', emoji: '🍵', city: 'sylhet' },
  ],
}

const LEVELS: Level[] = [1, 2, 3]
const LEVEL_ICON: Record<Level, string> = { 1: '🧑‍💼', 2: '🏢', 3: '🚁' }
const LEVEL1_VEHICLES: VehicleId[] = ['van', 'truck', 'launch']
const OLD_CITIES: City[] = ['dhaka', 'chattogram', 'barishal']
const METHODS = ['sendParcel()', 'createTransport()', 'deliver()'] as const
const LEVEL1_IF_LINES = 14

/* ------------------------------------------------------------------ */
/* Saved progress (per viewer; the game works without it)             */
/* ------------------------------------------------------------------ */

interface Progress {
  unlocked: Level
  stars: Partial<Record<Level, number>>
  coins: number
}
const STORAGE_KEY = 'dpp-factory-method-game'
const FRESH: Progress = { unlocked: 1, stars: {}, coins: 0 }

function loadProgress(): Progress {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<Progress> | null
    if (!saved) return FRESH
    const unlocked = saved.unlocked === 2 || saved.unlocked === 3 ? saved.unlocked : 1
    return { unlocked, stars: saved.stars ?? {}, coins: Number(saved.coins) || 0 }
  } catch {
    return FRESH
  }
}

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

type Kind = 'l1-start' | 'l1-switch' | 'l1-new' | 'send' | 'call-factory' | 'create' | 'book' | 'deliver' | 'drive' | 'result'

interface GameStep extends PlayerStep {
  kind: Kind
  caption: string
}

/** Step ids double as code-step ids: they match the `// @step:` markers in code/*.ts. */
function buildSteps(level: Level, order: Order, choice: Choice | null): GameStep[] {
  if (!choice) return []
  if (level === 1) {
    const ok = choice === CITIES[order.city].vehicle
    return [
      { id: 'l1-start', kind: 'l1-start', caption: 'l1-start' },
      { id: 'l1-switch', kind: 'l1-switch', caption: 'l1-switch' },
      { id: `l1-new-${choice}`, kind: 'l1-new', caption: 'l1-new', duration: 1600 },
      { id: 'l1-deliver', kind: 'drive', caption: 'l1-deliver', duration: 2300 },
      { id: 'l1-result', kind: 'result', caption: ok ? 'l1-ok' : CITIES[order.city].fail, duration: 1000 },
    ]
  }
  if (choice === 'sylhet') {
    return [
      { id: 'sylhet-send', kind: 'send', caption: 'sylhet-send' },
      { id: 'sylhet-create', kind: 'create', caption: 'sylhet-create', duration: 1800 },
      { id: 'sylhet-book', codeStep: 'sylhet-send', kind: 'book', caption: 'sylhet-book' },
      { id: 'sylhet-deliver', kind: 'drive', caption: 'sylhet-deliver', duration: 2300 },
      { id: 'sylhet-done', kind: 'result', caption: 'sylhet-done', duration: 1000 },
    ]
  }
  return [
    { id: 'client-send', kind: 'send', caption: 'client-send' },
    { id: 'call-factory', kind: 'call-factory', caption: 'call-factory', duration: 1600 },
    { id: `${choice}-create`, kind: 'create', caption: 'create', duration: 1800 },
    { id: 'book', kind: 'book', caption: 'book' },
    { id: 'deliver', kind: 'deliver', caption: 'deliver' },
    { id: `${choice}-deliver`, kind: 'drive', caption: 'drive', duration: 2300 },
    { id: 'done', kind: 'result', caption: 'done', duration: 1000 },
  ]
}

const SHAKE_A = [0, -7, 7, -4, 4, 0]
const SHAKE_B = [0, 7, -7, 4, -4, 0]
const starText = (n: number) => '★'.repeat(n) + '☆'.repeat(3 - n)

/* ------------------------------------------------------------------ */
/* Visual                                                              */
/* ------------------------------------------------------------------ */

export default function FactoryMethodVisual({ content, lang, onCodeStep, onCodeView }: VisualProps<FactoryMethodContent>) {
  const v = content.visual
  const captions: Record<string, string> = content.steps
  const label = (key: LabelKey) => v[key]

  const [progress, setProgress] = useState<Progress>(loadProgress)
  const [level, setLevel] = useState<Level>(1)
  const [orderIdx, setOrderIdx] = useState(0)
  const [results, setResults] = useState<('ok' | 'fail')[]>([])
  const [mistakes, setMistakes] = useState(0)
  const [choice, setChoice] = useState<Choice | null>('van') // level 1, order 1 is a guided tutorial
  const [hint, setHint] = useState<{ key: string; values?: Record<string, string> } | null>(null)
  const [shake, setShake] = useState<{ id: string; n: number }>({ id: '', n: 0 })
  const [sylhetBuilt, setSylhetBuilt] = useState(false)
  const [builder, setBuilder] = useState<'product' | 'method' | 'ready' | null>(null)
  const [levelDone, setLevelDone] = useState(false)
  const [lastStars, setLastStars] = useState(0)

  const order = ORDERS[level][orderIdx]
  const city = CITIES[order.city]
  const steps = useMemo(() => buildSteps(level, order, choice), [level, order, choice])
  const player = useStepPlayer(steps)
  const step = player.step
  const kind = step?.kind ?? null
  const reachedIndex = (k: Kind) => steps.findIndex((s) => s.kind === k)
  const reached = (k: Kind) => {
    const at = reachedIndex(k)
    return at >= 0 && player.index >= at
  }

  // What gets created and where it goes.
  const vehicleId: VehicleId | null =
    level === 1 ? ((choice as VehicleId | null) ?? null) : choice ? CITIES[choice as City].vehicle : null
  const vehicle = vehicleId ? VEHICLES[vehicleId] : null
  const branch = level > 1 && choice ? CITIES[choice as City] : null
  const willSucceed = level === 1 ? choice === city.vehicle : true
  const created = level === 1 ? reached('l1-new') : reached('create')
  const accent = branch?.color ?? city.color
  // A finished delivery's result is derived; it is saved when the learner moves on.
  const outcome: 'ok' | 'fail' | null = player.done ? (willSucceed ? 'ok' : 'fail') : null
  const pendingCoins = outcome === 'ok' && vehicle ? vehicle.fee : 0

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
    } catch {
      // storage unavailable: progress lasts for this visit only
    }
  }, [progress])

  /* ---------------- code panel sync ---------------- */

  const view: CodeView =
    level === 1
      ? 'without'
      : builder || choice === 'sylhet' || (level === 3 && order.city === 'sylhet' && !levelDone)
        ? 'with'
        : 'main'
  useEffect(() => {
    onCodeView?.(view)
  }, [view, onCodeView])
  useEffect(() => () => onCodeView?.('main'), [onCodeView])

  let idleCode: string | null = null
  if (level === 1) idleCode = levelDone ? 'l1-todo' : choice ? `l1-new-${choice}` : null
  else if (builder === 'product') idleCode = 'build-product'
  else if (builder) idleCode = 'build-creator'
  else if (choice && choice !== 'sylhet' && !levelDone) idleCode = 'pick-branch'
  const codeStep = step ? (step.codeStep ?? step.id) : idleCode
  useEffect(() => {
    onCodeStep(codeStep)
  }, [codeStep, onCodeStep])

  /* ---------------- actions ---------------- */

  const bump = (id: string) => setShake((s) => ({ id, n: s.n + 1 }))
  const shakeAnim = (id: string) => (shake.id === id ? { x: shake.n % 2 ? SHAKE_A : SHAKE_B } : { x: 0 })
  const busy = player.index >= 0

  const startLevel = (n: Level) => {
    player.reset()
    setLevel(n)
    setOrderIdx(0)
    setResults([])
    setMistakes(0)
    setChoice(n === 1 ? 'van' : null)
    setHint(null)
    setSylhetBuilt(false)
    setBuilder(null)
    setLevelDone(false)
  }

  const restartGame = () => {
    setProgress(FRESH)
    startLevel(1)
  }

  const pickVehicle = (id: VehicleId) => {
    if (busy || outcome) return
    player.reset()
    setHint(null)
    setChoice(id)
  }

  const pickBranch = (c: City) => {
    if (busy || outcome) return
    if (c === 'sylhet' && !sylhetBuilt) {
      if (order.city === 'sylhet') {
        setChoice(null)
        setHint(null)
        setBuilder('product')
      }
      return
    }
    if (order.city === 'sylhet' && !sylhetBuilt) {
      bump(c)
      setHint({ key: 'need-build' })
      return
    }
    if (c !== order.city) {
      bump(c)
      setMistakes((m) => m + 1)
      setHint({ key: 'wrong-branch', values: { branch: label(c) } })
      return
    }
    player.reset()
    setHint(null)
    setChoice(c)
  }

  const answerProduct = (id: VehicleId) => {
    if (id === 'drone') {
      setHint(null)
      setBuilder('method')
      return
    }
    bump(`p-${id}`)
    setMistakes((m) => m + 1)
    setHint({ key: 'build-product-wrong', values: { vehicle: label(id) } })
  }

  const answerMethod = (m: (typeof METHODS)[number]) => {
    if (m === 'createTransport()') {
      setHint(null)
      setBuilder('ready')
      return
    }
    bump(`m-${m}`)
    setMistakes((x) => x + 1)
    setHint({ key: m === 'sendParcel()' ? 'wrong-sendParcel' : 'wrong-deliver' })
  }

  const openBranch = () => {
    player.reset()
    setSylhetBuilt(true)
    setBuilder(null)
    setChoice('sylhet')
    setHint({ key: 'build-done' })
  }

  const finishLevel = () => {
    const stars = mistakes === 0 ? 3 : mistakes === 1 ? 2 : 1
    setLastStars(stars)
    setProgress((p) => ({
      ...p,
      unlocked: Math.max(p.unlocked, Math.min(level + 1, 3)) as Level,
      stars: { ...p.stars, [level]: Math.max(p.stars[level] ?? 0, stars) },
    }))
    setLevelDone(true)
    setChoice(null)
  }

  const isLastOrder = orderIdx + 1 >= ORDERS[level].length
  const afterOutcome = () => {
    const wasOk = outcome === 'ok'
    setResults((r) => {
      const next = [...r]
      next[orderIdx] ??= wasOk ? 'ok' : 'fail' // the first attempt counts for the dots
      return next
    })
    if (wasOk) setProgress((p) => ({ ...p, coins: p.coins + pendingCoins }))
    player.reset()
    setHint(null)
    setChoice(null)
    if (!wasOk) {
      setMistakes((m) => m + 1)
      return // try the same order again
    }
    if (isLastOrder) finishLevel()
    else setOrderIdx(orderIdx + 1)
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
    dest: label(city.dest),
    vehicle: vehicleId ? label(vehicleId) : '',
    productClass: vehicle?.productClass ?? '',
    branchClass: branch?.branchClass ?? '',
    tracking: (branch ?? city).tracking,
    fee: vehicle ? formatTaka(vehicle.fee, lang) : '',
    eta: label(city.eta),
    how: captions[city.how] ?? '',
    ...hint?.values,
  }
  let captionKey: string
  if (step) captionKey = step.caption
  else if (hint) captionKey = hint.key
  else if (levelDone) captionKey = `level${level}-done`
  else if (builder === 'product') captionKey = 'build-product'
  else if (builder === 'method') captionKey = 'build-creator'
  else if (builder === 'ready') captionKey = 'build-ready'
  else if (level === 1) captionKey = choice ? (orderIdx === 0 && results.length === 0 ? 'tutorial' : 'picked1') : 'idle1'
  else if (choice) captionKey = 'ready'
  else captionKey = order.city === 'sylhet' && !sylhetBuilt ? 'need-build' : 'idle2'
  const caption = fill(captions[captionKey] ?? '', values)

  /* ---------------- pieces ---------------- */

  const sharedStatus = (kinds: Kind[]): Status => {
    const ats = kinds.map(reachedIndex).filter((n) => n >= 0)
    if (!ats.length) return 'pending'
    if (player.index > Math.max(...ats)) return 'done'
    if (player.index >= Math.min(...ats)) return 'active'
    return 'pending'
  }

  const pickerButton = (
    id: string,
    selected: boolean,
    color: string,
    icon: string,
    text: string,
    onClick: () => void,
    extra = '',
  ) => (
    <motion.button
      key={id}
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      animate={shakeAnim(id)}
      transition={{ duration: 0.4 }}
      className={`flex min-w-0 flex-col items-center gap-0.5 rounded-lg border-2 border-edge px-1 py-2 text-xs font-bold transition-[box-shadow,background-color] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chili ${
        selected ? 'text-white shadow-hard-sm' : 'bg-card text-ink hover:shadow-hard-sm'
      } ${extra}`}
      style={selected ? { backgroundColor: color } : undefined}
    >
      <span className="text-lg" aria-hidden="true">
        {icon}
      </span>
      <span className="max-w-full truncate">{text}</span>
    </motion.button>
  )

  const orderOf = fill(v.orderOf, {
    n: formatNumber(orderIdx + 1, lang),
    total: formatNumber(ORDERS[level].length, lang),
  })

  return (
    <div className="flex flex-col gap-4">
      {/* ── HUD: levels + coins ─────────────────────────────── */}
      <div className="flex flex-wrap items-stretch gap-2">
        <div role="tablist" aria-label={v.levelsLabel} className="grid min-w-0 flex-1 grid-cols-3 gap-2">
          {LEVELS.map((n) => {
            const locked = n > progress.unlocked
            const selected = n === level
            const stars = progress.stars[n] ?? 0
            return (
              <button
                key={n}
                type="button"
                role="tab"
                aria-selected={selected}
                disabled={locked}
                onClick={() => startLevel(n)}
                title={label(`level${n}Title` as LabelKey)}
                className={`flex flex-col items-center rounded-lg border-2 border-edge px-1 py-1.5 text-xs font-bold transition-[transform,box-shadow] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chili ${
                  selected
                    ? 'bg-bottle text-cream shadow-hard-sm'
                    : locked
                      ? 'cursor-not-allowed bg-paper-deep text-ink-soft/60'
                      : 'bg-card text-ink hover:-translate-y-0.5 hover:shadow-hard-sm'
                }`}
              >
                <span>{fill(v.levelLabel, { n: formatNumber(n, lang) })}</span>
                <span aria-label={locked ? v.locked : `${stars}/3`} className="tracking-widest">
                  {locked ? '🔒' : starText(stars)}
                </span>
              </button>
            )
          })}
        </div>
        <div className="relative flex items-center gap-1 rounded-lg border-2 border-edge bg-mustard px-2.5 text-sm font-bold text-on-accent tabular-nums shadow-hard-sm">
          <span aria-hidden="true">💰</span>
          <span className="sr-only">{v.earned}</span>
          {formatTaka(progress.coins + pendingCoins, lang)}
          <AnimatePresence>
            {pendingCoins > 0 && (
              <motion.span
                key={`${level}-${orderIdx}`}
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 0, y: -28 }}
                transition={{ duration: 1.4 }}
                className="pointer-events-none absolute -top-1 right-1 text-xs font-extrabold text-bottle dark:text-jade"
                aria-hidden="true"
              >
                +{formatTaka(pendingCoins, lang)}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Stage>
        {/* ── Mission ─────────────────────────────────────────── */}
        <div className="mb-4 flex items-start gap-3">
          <span
            aria-hidden="true"
            className="grid size-10 shrink-0 place-items-center rounded-lg border-2 border-edge bg-maroon text-xl shadow-hard-sm"
          >
            {LEVEL_ICON[level]}
          </span>
          <div className="min-w-0 flex-1">
            <p className="label-caps text-chili">{fill(v.levelLabel, { n: formatNumber(level, lang) })}</p>
            <h3 className="font-display text-lg leading-tight font-bold text-ink">{label(`level${level}Title` as LabelKey)}</h3>
            <p className="prose-text mt-0.5 text-sm text-ink-soft">{label(`level${level}Goal` as LabelKey)}</p>
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {levelDone ? (
            /* ── Level complete ─────────────────────────────── */
            <motion.div
              key={`done-${level}`}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 rounded-xl border-2 border-edge bg-card p-4 text-center shadow-hard-sm"
            >
              <motion.p
                className="text-4xl"
                aria-hidden="true"
                initial={{ rotate: -20, scale: 0.4 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 12 }}
              >
                🎉
              </motion.p>
              <h3 className="font-display text-2xl font-bold text-ink">{fill(v.levelDone, { n: formatNumber(level, lang) })}</h3>
              <p className="text-3xl tracking-widest text-maroon dark:text-mustard" aria-label={`${lastStars}/3`}>
                {starText(lastStars)}
              </p>
              {level === 1 && (
                <>
                  <p className="prose-text text-sm text-ink">{v.l1Teaser}</p>
                  <code
                    lang="en"
                    className="w-full max-w-xs truncate rounded-md border-2 border-dashed border-chili px-2 py-1 font-mono text-xs text-chili"
                  >
                    {"case 'sylhet' → ???"}
                  </code>
                </>
              )}
              {level === 2 && <p className="prose-text text-sm text-ink">{v.l2Summary}</p>}
              {level === 3 && (
                <div className="w-full text-left">
                  <p className="mb-1 label-caps text-ink-soft">{v.recapTitle}</p>
                  <ul className="prose-text flex flex-col gap-1.5 text-sm text-ink">
                    {[v.recap1, v.recap2, v.recap3].map((r, i) => (
                      <li key={i} className="flex gap-2">
                        <span aria-hidden="true">{['😣', '🏭', '🚀'][i]}</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex flex-wrap justify-center gap-2">
                {level < 3 ? (
                  <Button variant="primary" onClick={() => startLevel((level + 1) as Level)} data-game="next-level">
                    {v.nextLevel} →
                  </Button>
                ) : (
                  <Button variant="primary" onClick={restartGame}>
                    {v.playAgain}
                  </Button>
                )}
                <Button onClick={() => startLevel(level)}>{v.replayLevel}</Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key={`play-${level}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* ── Client: order + choice ─────────────────────── */}
              <Node
                role={v.clientRole}
                title={`📥 ${v.ordersTitle}`}
                active={kind === 'send' || kind === 'l1-start' || kind === 'result'}
                accent={accent}
              >
                <div className="mb-3 flex items-center gap-1.5">
                  {ORDERS[level].map((_, i) => {
                    const r = results[i] ?? (i === orderIdx ? outcome : null)
                    return (
                      <span
                        key={i}
                        aria-hidden="true"
                        className={`grid size-5 place-items-center rounded-full border-2 text-[10px] font-bold ${
                          r === 'ok'
                            ? 'border-edge bg-bottle text-cream'
                            : r === 'fail'
                              ? 'border-edge bg-chili text-cream'
                              : i === orderIdx
                                ? 'border-edge bg-mustard text-on-accent'
                                : 'border-dashed border-edge/40'
                        }`}
                      >
                        {r === 'ok' ? '✓' : r === 'fail' ? '✗' : ''}
                      </span>
                    )
                  })}
                  <span className="ml-auto label-caps text-ink-soft">{orderOf}</span>
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`${level}-${orderIdx}`}
                    initial={{ x: 40, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -40, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="mb-3 flex items-center gap-3 rounded-lg border-2 border-dashed border-edge/50 bg-paper p-2.5"
                  >
                    <span className="text-3xl" aria-hidden="true">
                      {order.emoji}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-ink">{label(order.item)}</p>
                      <p className="truncate text-sm text-ink-soft">
                        📍 {label(city.dest)} · {label(order.city)}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <p id="fm-pick-label" className="mb-1.5 label-caps text-ink-soft">
                  {level === 1 ? v.pickVehicle : v.pickBranch}
                </p>
                {level === 1 ? (
                  <div role="radiogroup" aria-labelledby="fm-pick-label" className="grid grid-cols-3 gap-2">
                    {LEVEL1_VEHICLES.map((id) =>
                      pickerButton(id, choice === id, '#0b6b4f', VEHICLES[id].emoji, label(id), () => pickVehicle(id)),
                    )}
                  </div>
                ) : (
                  <div
                    role="radiogroup"
                    aria-labelledby="fm-pick-label"
                    className={`grid gap-2 ${level === 3 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}
                  >
                    {OLD_CITIES.map((c) =>
                      pickerButton(c, choice === c, CITIES[c].color, CITIES[c].icon, label(c), () => pickBranch(c)),
                    )}
                    {level === 3 &&
                      (sylhetBuilt
                        ? pickerButton('sylhet', choice === 'sylhet', CITIES.sylhet.color, CITIES.sylhet.icon, label('sylhet'), () =>
                            pickBranch('sylhet'),
                          )
                        : pickerButton(
                            'sylhet',
                            builder !== null,
                            CITIES.sylhet.color,
                            '🔨',
                            `${v.buildSlot}: ${label('sylhet')}`,
                            () => pickBranch('sylhet'),
                            builder === null ? 'border-dashed' : '',
                          ))}
                  </div>
                )}
              </Node>

              <Connector
                label={level === 1 ? 'sendParcel(p, city)' : 'sendParcel(parcel)'}
                down={kind === 'send' || kind === 'l1-start'}
                up={kind === 'result' && willSucceed}
                downPacket={
                  <Packet color={accent}>
                    {order.emoji} {label(order.item)}
                  </Packet>
                }
                upPacket={<Packet color="#0b6b4f">🧾 {formatTaka(vehicle?.fee ?? 0, lang)}</Packet>}
                runKey={player.index}
              />

              {/* ── Middle: the dispatcher (L1) or the branch (L2/3) ── */}
              {level === 1 ? (
                <Node
                  role={v.dispatcherRole}
                  title="sendParcel()"
                  active={kind === 'l1-switch' || kind === 'l1-new'}
                  accent="#B91C1C"
                  mono
                >
                  <p className="mb-2 text-xs font-semibold text-ink-soft">{v.casesLabel}</p>
                  <ul className="flex flex-col gap-1" lang="en">
                    {LEVEL1_VEHICLES.map((id, i) => {
                      const c = OLD_CITIES[i]
                      const lit = choice === id && (kind === 'l1-new' || (!busy && !outcome))
                      return (
                        <motion.li
                          key={c}
                          animate={{ x: lit && kind === 'l1-new' ? 4 : 0 }}
                          className={`flex min-w-0 items-center gap-1 rounded-md border-2 px-2 py-1 font-mono text-[11px] sm:text-xs ${
                            lit ? 'border-edge bg-card font-bold shadow-hard-sm' : 'border-transparent text-ink-soft'
                          } ${kind === 'l1-switch' ? 'bg-chili/10' : ''}`}
                        >
                          <span className="truncate">{`'${c}'`}</span>
                          <span aria-hidden="true">→</span>
                          <span className="truncate font-bold" style={{ color: CITIES[c].color }}>
                            new {VEHICLES[id].productClass}()
                          </span>
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
                <Node
                  role={v.creatorRole}
                  title={builder ? 'SylhetBranch' : (branch?.branchClass ?? 'CourierBranch')}
                  active={builder !== null || kind === 'call-factory' || kind === 'create' || kind === 'book' || kind === 'deliver'}
                  accent={builder ? CITIES.sylhet.color : accent}
                  mono
                >
                  <p className="-mt-1 mb-3 flex flex-wrap items-center gap-1.5 font-mono text-xs text-ink-soft" lang="en">
                    {v.extendsLabel} <span className="font-bold text-ink">CourierBranch</span>
                    <span className="rounded border border-edge/40 px-1 py-px font-sans text-[10px] tracking-wider uppercase">
                      {v.creatorTag}
                    </span>
                    {(builder || choice === 'sylhet') && (
                      <span className="rounded bg-bottle px-1.5 py-px font-sans text-[10px] font-bold text-cream uppercase">
                        {v.newTag}
                      </span>
                    )}
                  </p>

                  {builder ? (
                    /* ── Level 3 builder ─────────────────────── */
                    <div
                      className="flex flex-col gap-3 rounded-lg border-2 border-dashed p-3"
                      style={{ borderColor: CITIES.sylhet.color }}
                    >
                      <p className="font-display font-bold text-ink">🔨 {v.builderTitle}</p>

                      <div>
                        <p className="label-caps text-ink-soft">{v.builderStep1}</p>
                        <p className="mb-2 text-sm text-ink">{v.q1}</p>
                        <div role="radiogroup" aria-label={v.q1} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {(['van', 'truck', 'launch', 'drone'] as VehicleId[]).map((id) =>
                            pickerButton(
                              `p-${id}`,
                              builder !== 'product' && id === 'drone',
                              CITIES.sylhet.color,
                              VEHICLES[id].emoji,
                              label(id),
                              () => {
                                if (builder === 'product') answerProduct(id)
                              },
                              builder !== 'product' && id !== 'drone' ? 'opacity-40' : '',
                            ),
                          )}
                        </div>
                        {builder !== 'product' && (
                          <motion.code
                            lang="en"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-2 block truncate rounded-md bg-code px-2 py-1 font-mono text-xs text-[#7ee2a8]"
                          >
                            + class Drone implements Transport
                          </motion.code>
                        )}
                      </div>

                      {builder !== 'product' && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                          <p className="label-caps text-ink-soft">{v.builderStep2}</p>
                          <p className="mb-2 text-sm text-ink">{v.q2}</p>
                          <div role="radiogroup" aria-label={v.q2} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            {METHODS.map((m) => {
                              const right = m === 'createTransport()'
                              const solved = builder === 'ready'
                              return (
                                <motion.button
                                  key={m}
                                  type="button"
                                  role="radio"
                                  aria-checked={solved && right}
                                  lang="en"
                                  animate={shakeAnim(`m-${m}`)}
                                  transition={{ duration: 0.4 }}
                                  onClick={() => {
                                    if (builder === 'method') answerMethod(m)
                                  }}
                                  className={`truncate rounded-lg border-2 border-edge px-2 py-1.5 font-mono text-xs font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chili ${
                                    solved && right
                                      ? 'text-white shadow-hard-sm'
                                      : solved
                                        ? 'bg-card text-ink opacity-40'
                                        : 'bg-card text-ink hover:shadow-hard-sm'
                                  }`}
                                  style={solved && right ? { backgroundColor: CITIES.sylhet.color } : undefined}
                                >
                                  {m}
                                </motion.button>
                              )
                            })}
                          </div>
                          {builder === 'ready' && (
                            <motion.code
                              lang="en"
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-2 block truncate rounded-md bg-code px-2 py-1 font-mono text-xs text-[#7ee2a8]"
                            >
                              + createTransport() → new Drone()
                            </motion.code>
                          )}
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
                          <Button variant="primary" onClick={openBranch} data-game="open-branch">
                            🎉 {v.openBranch}
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {/* Inherited workflow */}
                      <ol className="grid grid-cols-3 gap-1.5">
                        {(
                          [
                            [v.stepCreate, ['call-factory', 'create']],
                            [v.stepBook, ['book']],
                            [v.stepDeliver, ['deliver', 'drive']],
                          ] as [string, Kind[]][]
                        ).map(([text, kinds]) => {
                          const status = sharedStatus(kinds)
                          return (
                            <li
                              key={text}
                              className={`flex min-w-0 items-center gap-1.5 rounded-md border-2 px-1.5 py-1 text-xs ${
                                status === 'active' ? 'border-edge bg-card font-bold shadow-hard-sm' : 'border-transparent'
                              } ${status === 'pending' ? 'text-ink-soft/70' : 'text-ink'}`}
                            >
                              <StatusDot status={status} color={accent} />
                              <span className="min-w-0 truncate">{text}</span>
                            </li>
                          )
                        })}
                      </ol>

                      <motion.div
                        animate={{ scale: kind === 'call-factory' || kind === 'create' ? 1.02 : 1 }}
                        className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border-2 px-2.5 py-1.5"
                        style={{
                          borderColor: kind === 'call-factory' || kind === 'create' ? accent : `${accent}66`,
                          backgroundColor: `${accent}14`,
                        }}
                      >
                        <span className="text-xs font-semibold text-ink-soft">{v.overrideLabel}</span>
                        <code lang="en" className="truncate font-mono text-xs font-bold" style={{ color: accent }}>
                          {vehicle ? `return new ${vehicle.productClass}()` : '…'}
                        </code>
                      </motion.div>

                      <div className="flex items-center gap-2 rounded-lg border-2 border-dashed border-edge/50 bg-paper py-1 pr-1 pl-3">
                        <code lang="en" className="font-mono text-xs font-bold text-ink-soft">
                          {v.transportSlot}:
                        </code>
                        <div className="relative h-7 min-w-0 flex-1 overflow-hidden">
                          <AnimatePresence mode="popLayout" initial={false}>
                            {created && vehicle ? (
                              <motion.span
                                key={`made-${vehicle.productClass}`}
                                lang="en"
                                initial={{ y: 30, opacity: 0, scale: 0.6 }}
                                animate={{ y: 0, opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                                className="absolute inset-0 flex items-center justify-center gap-1 truncate rounded-md border-2 border-[#2b1d16] px-2 font-mono text-xs font-bold text-white"
                                style={{ backgroundColor: accent }}
                              >
                                {vehicle.emoji} {vehicle.productClass}
                              </motion.span>
                            ) : (
                              <motion.span
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center truncate text-xs text-ink-soft/70 italic"
                              >
                                {v.notCreated}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  )}
                </Node>
              )}

              <Connector
                label={
                  level === 1
                    ? `new ${vehicle?.productClass ?? '???'}()`
                    : kind === 'deliver' || kind === 'drive'
                      ? 'deliver(to)'
                      : 'createTransport()'
                }
                down={kind === 'l1-new' || kind === 'create' || kind === 'deliver'}
                downPacket={
                  kind === 'deliver' ? (
                    <Packet color={accent}>
                      {order.emoji} {label(order.item)}
                    </Packet>
                  ) : (
                    <Packet color={accent}>
                      ✨ <span lang="en">new {vehicle?.productClass}()</span>
                    </Packet>
                  )
                }
                runKey={player.index}
              />

              {/* ── Product: the vehicle on its route ──────────── */}
              <Node
                role={v.productRole}
                title={created && vehicle ? vehicle.productClass : 'Transport'}
                active={kind === 'l1-new' || kind === 'create' || kind === 'drive'}
                accent={accent}
                mono
              >
                <p className="-mt-1 mb-3 flex flex-wrap items-center gap-1.5 font-mono text-xs text-ink-soft" lang="en">
                  {v.implementsLabel} <span className="font-bold text-ink">Transport</span>
                  <span className="rounded border border-edge/40 px-1 py-px font-sans text-[10px] tracking-wider uppercase">
                    {v.productTag}
                  </span>
                </p>

                <AnimatePresence mode="wait" initial={false}>
                  {created && vehicle ? (
                    <motion.div
                      key={`route-${level}-${orderIdx}-${choice}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="rounded-lg border p-3"
                      style={{ borderColor: `${city.color}55`, backgroundColor: `${city.color}0d` }}
                    >
                      <div className="mb-1 flex justify-between gap-2 text-xs font-bold text-ink-soft">
                        <span className="truncate">🏢 {label(order.city)}</span>
                        <span className="truncate">📍 {label(city.dest)}</span>
                      </div>
                      <div
                        className={`relative h-11 overflow-hidden rounded-md border-2 ${
                          reached('result') && !willSucceed ? 'border-chili' : 'border-edge/40'
                        }`}
                        style={{ background: city.route }}
                      >
                        <motion.span
                          className="absolute top-1/2 text-2xl leading-none"
                          initial={false}
                          animate={{
                            left: reached('drive') ? (willSucceed ? 'calc(100% - 2.25rem)' : 'calc(50% - 1rem)') : '0.25rem',
                            rotate: reached('result') && !willSucceed ? [0, -12, 12, -8, 0] : 0,
                          }}
                          transition={{ duration: kind === 'drive' ? 2 : 0.5, ease: 'easeInOut' }}
                          style={{ y: '-50%' }}
                          aria-hidden="true"
                        >
                          <motion.span
                            className="inline-block -scale-x-100"
                            animate={vehicleId === 'drone' && kind === 'drive' ? { y: [0, -6, 0] } : { y: 0 }}
                            transition={{ repeat: vehicleId === 'drone' && kind === 'drive' ? Infinity : 0, duration: 0.6 }}
                          >
                            {vehicle.emoji}
                          </motion.span>
                        </motion.span>
                        <AnimatePresence>
                          {reached('result') && !willSucceed && (
                            <motion.span
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="absolute top-1/2 left-[calc(50%+1.5rem)] -translate-y-1/2 text-2xl"
                              aria-hidden="true"
                            >
                              {city.obstacle}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2 text-sm">
                        <span className="font-bold tabular-nums">💰 {formatTaka(vehicle.fee, lang)}</span>
                        <AnimatePresence>
                          {reached('result') && (
                            <motion.span
                              initial={{ scale: 1.6, opacity: 0, rotate: -12 }}
                              animate={{ scale: 1, opacity: 1, rotate: -6 }}
                              className={`rounded border-2 px-2 py-0.5 label-caps ${
                                willSucceed
                                  ? 'border-bottle text-bottle dark:border-jade dark:text-jade'
                                  : 'border-chili text-chili'
                              }`}
                            >
                              {willSucceed ? `✓ ${v.delivered}` : `✗ ${v.failed}`}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.p
                      key="waiting"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="rounded-lg border-2 border-dashed border-edge/40 px-3 py-5 text-center text-sm text-ink-soft"
                    >
                      {v.waiting}
                    </motion.p>
                  )}
                </AnimatePresence>
              </Node>
            </motion.div>
          )}
        </AnimatePresence>
      </Stage>

      {/* ── Caption + what to do next ──────────────────────── */}
      <Caption label={v.whatsHappening} text={caption} stepKey={`${captionKey}-${lang}-${orderIdx}`} />

      {outcome && !levelDone && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
          <Button variant="primary" onClick={afterOutcome} data-game="after-outcome">
            {outcome === 'fail' ? `↻ ${v.tryAgain}` : isLastOrder ? `🏁 ${v.finishLevel}` : `${v.nextOrder} →`}
          </Button>
        </motion.div>
      )}

      {!levelDone && (
        <StepControls
          player={controls}
          playLabel={`🚀 ${v.dispatchButton}`}
          disabled={!choice || outcome !== null || builder !== null}
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
