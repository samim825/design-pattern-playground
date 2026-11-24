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
import type { AbstractFactoryContent } from './content.en'

/*
 * "Rongdhonu Combo Counter": a 3-level game.
 *   Level 1  no pattern: the learner picks every dish by name; mixed combos get sent back (code panel: `without`)
 *   Level 2  Abstract Factory: the learner picks a kitchen, which makes a whole matching combo (`main`)
 *   Level 3  the learner opens ThaiKitchen + its dishes without editing serveCombo() (`with`)
 * Every turn is a step timeline, so the code panel lights up in sync.
 */

type Labels = AbstractFactoryContent['visual']
type LabelKey = keyof Labels
type Cuisine = 'deshi' | 'chinese' | 'thai'
type Course = 'main' | 'side' | 'dessert'
type DishId = 'kacchi' | 'borhani' | 'firni' | 'friedrice' | 'cornsoup' | 'pudding' | 'padthai' | 'tomyum' | 'mango'

/* ------------------------------------------------------------------ */
/* Scenario data                                                       */
/* ------------------------------------------------------------------ */

const COURSES: Course[] = ['main', 'side', 'dessert']
const COURSE_TYPE: Record<Course, string> = { main: 'MainDish', side: 'Side', dessert: 'Dessert' }
const COURSE_LABEL: Record<Course, LabelKey> = { main: 'courseMain', side: 'courseSide', dessert: 'courseDessert' }
const CREATE: Record<Course, string> = { main: 'createMain', side: 'createSide', dessert: 'createDessert' }

interface Dish {
  cuisine: Cuisine
  course: Course
  emoji: string
  price: number
  /** The class in code, and the name the level-1 client passes to createDish(). */
  cls: string
  code: string
}

// Prices are illustrative only (the UI says so).
const DISHES: Record<DishId, Dish> = {
  kacchi: { cuisine: 'deshi', course: 'main', emoji: '🍛', price: 320, cls: 'Kacchi', code: 'kacchi' },
  borhani: { cuisine: 'deshi', course: 'side', emoji: '🥛', price: 60, cls: 'Borhani', code: 'borhani' },
  firni: { cuisine: 'deshi', course: 'dessert', emoji: '🥣', price: 70, cls: 'Firni', code: 'firni' },
  friedrice: { cuisine: 'chinese', course: 'main', emoji: '🍚', price: 300, cls: 'FriedRice', code: 'fried-rice' },
  cornsoup: { cuisine: 'chinese', course: 'side', emoji: '🍲', price: 140, cls: 'CornSoup', code: 'corn-soup' },
  pudding: { cuisine: 'chinese', course: 'dessert', emoji: '🍮', price: 80, cls: 'Pudding', code: 'pudding' },
  padthai: { cuisine: 'thai', course: 'main', emoji: '🍜', price: 380, cls: 'PadThai', code: 'pad-thai' },
  tomyum: { cuisine: 'thai', course: 'side', emoji: '🥘', price: 180, cls: 'TomYum', code: 'tom-yum' },
  mango: { cuisine: 'thai', course: 'dessert', emoji: '🥭', price: 90, cls: 'MangoStickyRice', code: 'mango' },
}

interface Kitchen {
  cls: string
  icon: string
  color: string
  menu: Record<Course, DishId>
}

const KITCHENS: Record<Cuisine, Kitchen> = {
  deshi: { cls: 'DeshiKitchen', icon: '🍛', color: '#B45309', menu: { main: 'kacchi', side: 'borhani', dessert: 'firni' } },
  chinese: { cls: 'ChineseKitchen', icon: '🥢', color: '#B91C1C', menu: { main: 'friedrice', side: 'cornsoup', dessert: 'pudding' } },
  thai: { cls: 'ThaiKitchen', icon: '🌶️', color: '#15803D', menu: { main: 'padthai', side: 'tomyum', dessert: 'mango' } },
}
const comboTotal = (c: Cuisine) => COURSES.reduce((sum, course) => sum + DISHES[KITCHENS[c].menu[course]].price, 0)

interface Customer {
  name: LabelKey
  emoji: string
  wants: Cuisine
}

const CUSTOMERS: Record<Level, Customer[]> = {
  1: [
    { name: 'nusrat', emoji: '👩', wants: 'deshi' },
    { name: 'rahim', emoji: '👨', wants: 'chinese' },
    { name: 'karim', emoji: '🧔', wants: 'deshi' },
  ],
  2: [
    { name: 'rahim', emoji: '👨', wants: 'chinese' },
    { name: 'mitu', emoji: '👧', wants: 'deshi' },
    { name: 'nusrat', emoji: '👩', wants: 'chinese' },
  ],
  3: [
    { name: 'karim', emoji: '🧔', wants: 'thai' },
    { name: 'mitu', emoji: '👧', wants: 'deshi' },
    { name: 'rahim', emoji: '👨', wants: 'thai' },
  ],
}

/** Level 1 menu, shuffled so the families aren't grouped. */
const L1_DISHES: DishId[] = ['cornsoup', 'kacchi', 'pudding', 'borhani', 'friedrice', 'firni']
const TUTORIAL_PICKS: DishId[] = ['kacchi', 'borhani', 'firni']
const LEVEL_ICON: Record<Level, string> = { 1: '🍽️', 2: '🏭', 3: '🌶️' }

type CourseState = 'empty' | 'ok' | 'mixed' | 'missing'

function courseCheck(picks: DishId[], course: Course, wants: Cuisine): { dish?: DishId; state: Exclude<CourseState, 'empty'> } {
  const dish = picks.find((d) => DISHES[d].course === course)
  if (!dish) return { state: 'missing' }
  return { dish, state: DISHES[dish].cuisine === wants ? 'ok' : 'mixed' }
}

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

type Kind = 'order' | 'start' | 'dish' | 'create' | 'serve' | 'result'

interface GameStep extends PlayerStep {
  kind: Kind
  caption: string
  course?: Course
}

/** Step ids double as code-step ids: they match the `// @step:` markers in code/*.ts. */
function buildSteps(level: Level, customer: Customer, picks: DishId[], kitchen: Cuisine | null): GameStep[] {
  if (level === 1) {
    if (picks.length !== 3) return []
    const checks = COURSES.map((c) => courseCheck(picks, c, customer.wants))
    const firstBad = checks.find((c) => c.state !== 'ok')
    return [
      { id: 'l1-order', kind: 'order', caption: 'l1-order' },
      { id: 'l1-start', kind: 'start', caption: 'l1-start' },
      ...COURSES.map<GameStep>((c, i) => ({
        id: `l1-${c}`,
        kind: 'dish',
        course: c,
        caption: `l1-dish-${checks[i].state}`,
        duration: 1500,
      })),
      {
        id: 'l1-result',
        kind: 'result',
        caption: !firstBad ? 'l1-ok' : firstBad.state === 'mixed' ? 'l1-mixed' : 'l1-missing',
        duration: 1100,
      },
    ]
  }
  if (!kitchen) return []
  if (kitchen === 'thai') {
    return [
      { id: 'thai-order', kind: 'order', caption: 'thai-order' },
      ...COURSES.map<GameStep>((c) => ({ id: `thai-${c}`, kind: 'create', course: c, caption: `create-${c}`, duration: 1400 })),
      { id: 'thai-serve', codeStep: 'thai-order', kind: 'serve', caption: 'serve' },
      { id: 'thai-done', kind: 'result', caption: 'thai-done', duration: 1000 },
    ]
  }
  return [
    { id: 'order', kind: 'order', caption: 'order' },
    ...COURSES.map<GameStep>((c) => ({ id: `${kitchen}-${c}`, kind: 'create', course: c, caption: `create-${c}`, duration: 1400 })),
    { id: 'serve', kind: 'serve', caption: 'serve' },
    { id: 'done', kind: 'result', caption: 'done', duration: 1000 },
  ]
}

/* ------------------------------------------------------------------ */
/* Visual                                                              */
/* ------------------------------------------------------------------ */

export default function AbstractFactoryVisual({ content, lang, onCodeStep, onCodeView }: VisualProps<AbstractFactoryContent>) {
  const v = content.visual
  const captions: Record<string, string> = content.steps
  const label = (key: LabelKey) => v[key]

  const { progress, addCoins, completeLevel, reset: resetProgress } = useGameProgress('dpp-abstract-factory-game')
  const shake = useShake()
  const [level, setLevel] = useState<Level>(1)
  const [custIdx, setCustIdx] = useState(0)
  const [results, setResults] = useState<('ok' | 'fail')[]>([])
  const [mistakes, setMistakes] = useState(0)
  const [picks, setPicks] = useState<DishId[]>(TUTORIAL_PICKS) // level 1, customer 1 is a guided tutorial
  const [kitchen, setKitchen] = useState<Cuisine | null>(null)
  const [thaiBuilt, setThaiBuilt] = useState(false)
  const [panel, setPanel] = useState<'q1' | 'q2' | 'ready' | null>(null)
  const [hint, setHint] = useState<{ key: string; values?: Record<string, string> } | null>(null)
  const [levelDone, setLevelDone] = useState(false)
  const [lastStars, setLastStars] = useState(0)

  const customer = CUSTOMERS[level][custIdx]
  const wants = customer.wants
  const steps = useMemo(() => buildSteps(level, customer, picks, kitchen), [level, customer, picks, kitchen])
  const player = useStepPlayer(steps)
  const step = player.step
  const kind = step?.kind ?? null
  const busy = player.index >= 0
  const at = (id: string) => steps.findIndex((s) => s.id === id)
  const reached = (id: string) => {
    const i = at(id)
    return i >= 0 && player.index >= i
  }

  const checks = COURSES.map((c) => courseCheck(picks, c, wants))
  const l1Ok = picks.length === 3 && checks.every((c) => c.state === 'ok')
  const willSucceed = level === 1 ? l1Ok : true
  const outcome: 'ok' | 'fail' | null = player.done ? (willSucceed ? 'ok' : 'fail') : null
  const pendingCoins = outcome === 'ok' ? comboTotal(wants) : 0
  const accent = KITCHENS[level === 1 ? wants : (kitchen ?? wants)].color

  /* ---------------- code panel sync ---------------- */

  const view: CodeView =
    level === 1
      ? 'without'
      : level === 3 && (panel || kitchen === 'thai' || (wants === 'thai' && !levelDone))
        ? 'with'
        : 'main'
  useEffect(() => {
    onCodeView?.(view)
  }, [view, onCodeView])
  useEffect(() => () => onCodeView?.('main'), [onCodeView])

  let idleCode: string | null = null
  if (level === 1) idleCode = levelDone ? 'l1-todo' : 'l1-order'
  else if (panel === 'q1') idleCode = 'build-kitchen'
  else if (panel) idleCode = 'thai-order'
  else if (kitchen === 'thai') idleCode = 'thai-order'
  else if (kitchen && !levelDone) idleCode = 'pick-kitchen'
  const codeStep = step ? (step.codeStep ?? step.id) : idleCode
  useEffect(() => {
    onCodeStep(codeStep)
  }, [codeStep, onCodeStep])

  /* ---------------- actions ---------------- */

  const resetTurn = () => {
    player.reset()
    setPicks([])
    setKitchen(null)
    setHint(null)
  }

  const startLevel = (n: Level) => {
    resetTurn()
    setLevel(n)
    setCustIdx(0)
    setResults([])
    setMistakes(0)
    if (n === 1) setPicks(TUTORIAL_PICKS)
    setThaiBuilt(false)
    setPanel(null)
    setLevelDone(false)
  }

  const restartGame = () => {
    resetProgress()
    startLevel(1)
  }

  const tapDish = (d: DishId) => {
    if (busy) return
    if (!picks.includes(d) && picks.length >= 3) {
      shake.bump(d) // a combo is exactly three dishes
      return
    }
    player.reset()
    setHint(null)
    setPicks((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d]))
  }

  const pickKitchen = (c: Cuisine) => {
    if (busy || panel) return
    if (c === 'thai' && !thaiBuilt) {
      if (wants === 'thai') {
        setHint(null)
        setKitchen(null)
        setPanel('q1')
      } else {
        shake.bump(c)
        setHint({ key: 'wrong-kitchen', values: { picked: label('thai') } })
      }
      return
    }
    if (wants === 'thai' && !thaiBuilt) {
      shake.bump(c)
      setHint({ key: 'need-build' })
      return
    }
    if (c !== wants) {
      shake.bump(c)
      setMistakes((m) => m + 1)
      setHint({ key: 'wrong-kitchen', values: { picked: label(c) } })
      return
    }
    player.reset()
    setHint(null)
    setKitchen(c)
  }

  const answerQ1 = (id: 'newFamily' | 'ifElse' | 'flag') => {
    if (panel !== 'q1') return
    if (id === 'newFamily') {
      setHint(null)
      setPanel('q2')
      return
    }
    shake.bump(`q1-${id}`)
    setMistakes((m) => m + 1)
    setHint({ key: id === 'ifElse' ? 'wrong-ifelse' : 'wrong-flag' })
  }

  const answerQ2 = (id: 'nothing' | 'case' | 'method') => {
    if (panel !== 'q2') return
    if (id === 'nothing') {
      setHint(null)
      setPanel('ready')
      return
    }
    shake.bump(`q2-${id}`)
    setMistakes((m) => m + 1)
    setHint({ key: id === 'case' ? 'wrong-case' : 'wrong-method' })
  }

  const openThai = () => {
    player.reset()
    setThaiBuilt(true)
    setPanel(null)
    setKitchen('thai')
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
    resetTurn()
    if (!wasOk) {
      setMistakes((m) => m + 1)
      return // try the same customer again
    }
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

  const lower = (s: string) => (lang === 'en' ? s.toLowerCase() : s)
  const firstBad = checks.find((c) => c.state !== 'ok')
  const capCourse = step?.course ?? COURSES[checks.findIndex((c) => c.state !== 'ok')] ?? 'main'
  const capCheck = level === 1 ? (step?.course ? checks[COURSES.indexOf(step.course)] : firstBad) : undefined
  const capDish: DishId | undefined =
    level === 1 ? capCheck?.dish : step?.course && kitchen ? KITCHENS[kitchen].menu[step.course] : undefined
  const values: Record<string, string> = {
    name: label(customer.name),
    cuisine: label(wants),
    kitchenClass: kitchen ? KITCHENS[kitchen].cls : '',
    dish: capDish ? label(capDish) : '',
    code: capDish ? DISHES[capDish].code : '',
    dishCuisine: capDish ? label(DISHES[capDish].cuisine) : '',
    course: lower(label(COURSE_LABEL[capCourse])),
    total: formatTaka(comboTotal(wants), lang),
    ...(!step ? hint?.values : undefined),
  }

  let captionKey: string
  if (step) captionKey = step.caption
  else if (hint) captionKey = hint.key
  else if (levelDone) captionKey = `level${level}-done`
  else if (panel === 'q1') captionKey = 'build-q1'
  else if (panel === 'q2') captionKey = 'build-q2'
  else if (panel === 'ready') captionKey = 'build-ready'
  else if (level === 1) captionKey = picks.length === 3 ? (custIdx === 0 && results.length === 0 ? 'tutorial' : 'picked1') : 'idle1'
  else if (kitchen === wants) captionKey = 'ready'
  else captionKey = wants === 'thai' && !thaiBuilt ? 'need-build' : 'idle2'
  const caption = fill(captions[captionKey] ?? '', values)

  /* ---------------- pieces ---------------- */

  const status = (id: string): Status => {
    const i = at(id)
    if (i < 0 || player.index < i) return 'pending'
    return player.index === i ? 'active' : 'done'
  }

  const customerOf = fill(v.customerOf, {
    n: formatNumber(custIdx + 1, lang),
    total: formatNumber(CUSTOMERS[level].length, lang),
  })
  const ready = level === 1 ? picks.length === 3 : kitchen === wants

  // The combo tray: what has landed for each course so far.
  const traySlots = COURSES.map((c, i) => {
    if (level === 1) {
      return reached(`l1-${c}`) ? { course: c, dish: checks[i].dish, state: checks[i].state as CourseState } : { course: c, state: 'empty' as CourseState }
    }
    const id = kitchen === 'thai' ? `thai-${c}` : `${kitchen}-${c}`
    return kitchen && reached(id) ? { course: c, dish: KITCHENS[kitchen].menu[c], state: 'ok' as CourseState } : { course: c, state: 'empty' as CourseState }
  })

  const tray = (
    <div className="rounded-lg border-2 border-edge/50 bg-paper p-2.5">
      <ul className="flex flex-col gap-1.5">
        {traySlots.map((slot) => (
          <motion.li
            key={slot.course}
            animate={{ x: slot.state === 'mixed' || slot.state === 'missing' ? [0, -4, 4, 0] : 0 }}
            className={`flex min-w-0 items-center gap-2 rounded-md border-2 px-2 py-1 text-xs ${
              slot.state === 'ok'
                ? 'border-bottle/50 bg-bottle/10 text-ink dark:border-jade/60'
                : slot.state === 'mixed' || slot.state === 'missing'
                  ? 'border-chili bg-chili/10 text-chili'
                  : 'border-dashed border-edge/30 text-ink-soft/60'
            }`}
          >
            <span className="w-14 shrink-0 font-semibold sm:w-16">{label(COURSE_LABEL[slot.course])}</span>
            <code lang="en" className="hidden shrink-0 font-mono text-[10px] text-ink-soft sm:inline">
              {COURSE_TYPE[slot.course]}
            </code>
            <AnimatePresence mode="popLayout" initial={false}>
              {slot.dish ? (
                <motion.span
                  key={slot.dish}
                  initial={{ y: -14, opacity: 0, scale: 0.8 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="ml-auto flex min-w-0 items-center gap-1 truncate font-bold"
                >
                  <span aria-hidden="true">{DISHES[slot.dish].emoji}</span>
                  <span className="truncate">{label(slot.dish)}</span>
                  {slot.state === 'mixed' && <span className="shrink-0 font-sans text-[10px] uppercase">· {v.mixedTag}</span>}
                </motion.span>
              ) : slot.state === 'missing' ? (
                <span className="ml-auto font-bold">✗ {v.missingTag}</span>
              ) : null}
            </AnimatePresence>
          </motion.li>
        ))}
      </ul>
      {traySlots.every((s) => s.state === 'empty') && (
        <p className="mt-2 text-center text-xs text-ink-soft/70 italic">{v.emptyTray}</p>
      )}
      <AnimatePresence>
        {kind === 'result' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`mt-3 flex items-center justify-between gap-2 rounded-lg border-2 px-3 py-2 text-sm font-bold ${
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
                {willSucceed ? '😋' : '😖'}
              </motion.span>
              {willSucceed ? v.served : v.sentBack}
            </span>
            {willSucceed && <span className="tabular-nums">{formatTaka(comboTotal(wants), lang)}</span>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
                    {"createDish('pad-thai') → ???"}
                  </code>
                </>
              )}
              {level === 2 && <p className="prose-text text-sm text-ink">{v.l2Summary}</p>}
              {level === 3 && (
                <Recap
                  title={v.recapTitle}
                  items={[
                    { icon: '😖', text: v.recap1 },
                    { icon: '🏭', text: v.recap2 },
                    { icon: '🌶️', text: v.recap3 },
                  ]}
                />
              )}
            </LevelCompleteCard>
          ) : (
            <motion.div key={`play-${level}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* ── Client: customer + choice ──────────────────── */}
              <Node
                role={v.clientRole}
                title={`🛎️ ${v.counterTitle}`}
                active={kind === 'order' || kind === 'result'}
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
                        <span className="shrink-0 tabular-nums">{formatTaka(comboTotal(wants), lang)}</span>
                      </p>
                      <span
                        className="mt-1 inline-flex items-center gap-1 rounded-full border-2 border-[#2b1d16] px-2 py-0.5 text-xs font-bold text-white"
                        style={{ backgroundColor: KITCHENS[wants].color }}
                      >
                        <span aria-hidden="true">{KITCHENS[wants].icon}</span> {fill(v.wantsCombo, { cuisine: label(wants) })}
                      </span>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {level === 1 ? (
                  <>
                    <p id="af-pick-label" className="mb-1.5 label-caps text-ink-soft">
                      {v.pickDishes}
                    </p>
                    <div role="group" aria-labelledby="af-pick-label" className="grid grid-cols-3 gap-2">
                      {L1_DISHES.map((d) => (
                        <ChoiceButton
                          key={d}
                          role="checkbox"
                          selected={picks.includes(d)}
                          color="#0b6b4f"
                          icon={DISHES[d].emoji}
                          text={label(d)}
                          onClick={() => tapDish(d)}
                          animate={shake.anim(d)}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mb-2">
                      <span className="inline-flex items-center gap-1 rounded-full border-2 border-bottle/60 bg-bottle/10 px-2 py-0.5 text-xs font-bold text-bottle dark:text-jade">
                        ✓ {v.noNames}
                      </span>
                    </p>
                    <p id="af-kitchen-label" className="mb-1.5 label-caps text-ink-soft">
                      {v.pickKitchen}
                    </p>
                    <div
                      role="radiogroup"
                      aria-labelledby="af-kitchen-label"
                      className={`grid gap-2 ${level === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}
                    >
                      {(['deshi', 'chinese'] as Cuisine[]).map((c) => (
                        <ChoiceButton
                          key={c}
                          selected={kitchen === c}
                          color={KITCHENS[c].color}
                          icon={KITCHENS[c].icon}
                          text={label(c)}
                          onClick={() => pickKitchen(c)}
                          animate={shake.anim(c)}
                        />
                      ))}
                      {level === 3 && (
                        <ChoiceButton
                          selected={thaiBuilt ? kitchen === 'thai' : panel !== null}
                          color={KITCHENS.thai.color}
                          icon={thaiBuilt ? KITCHENS.thai.icon : '🔨'}
                          text={thaiBuilt ? label('thai') : `${v.buildSlot}: ${label('thai')}`}
                          onClick={() => pickKitchen('thai')}
                          animate={shake.anim('thai')}
                          className={!thaiBuilt && panel === null ? 'border-dashed' : ''}
                        />
                      )}
                    </div>
                  </>
                )}
              </Node>

              <Connector
                label={level === 1 ? 'serveCombo(…)' : 'serveCombo(k)'}
                down={kind === 'order' || kind === 'start'}
                up={kind === 'result' && willSucceed}
                downPacket={<Packet color={accent}>🧾 {label(wants)}</Packet>}
                upPacket={
                  <Packet color="#0b6b4f">
                    😋 {formatTaka(comboTotal(wants), lang)}
                  </Packet>
                }
                runKey={player.index}
              />

              {/* ── Middle: createDish() (L1) or the ConcreteFactory (L2/3) ── */}
              {level === 1 ? (
                <Node role={v.noPatternRole} title="createDish()" active={kind === 'start' || kind === 'dish'} accent="#B91C1C" mono>
                  <ul className="flex flex-col gap-1" lang="en">
                    {(['kacchi', 'borhani', 'firni', 'friedrice', 'cornsoup', 'pudding'] as DishId[]).map((d) => {
                      const picked = picks.includes(d)
                      const running = kind === 'dish' && step?.course === DISHES[d].course && picked
                      const wrong = picked && DISHES[d].cuisine !== wants
                      return (
                        <motion.li
                          key={d}
                          animate={{ x: running ? 4 : 0 }}
                          className={`flex min-w-0 items-center gap-1 rounded-md border-2 px-2 py-0.5 font-mono text-[11px] sm:text-xs ${
                            running
                              ? `bg-card font-bold shadow-hard-sm ${wrong ? 'border-chili' : 'border-edge'}`
                              : picked
                                ? 'border-edge/40 font-bold text-ink'
                                : 'border-transparent text-ink-soft/70'
                          }`}
                        >
                          <span className="truncate">{`'${DISHES[d].code}'`}</span>
                          <span aria-hidden="true">→</span>
                          <span className="truncate font-bold" style={{ color: KITCHENS[DISHES[d].cuisine].color }}>
                            new {DISHES[d].cls}()
                          </span>
                        </motion.li>
                      )
                    })}
                  </ul>
                  <p className="mt-2 flex items-center justify-between gap-2 border-t-2 border-dashed border-edge/40 pt-2 text-xs text-ink-soft">
                    <span>{v.casesLabel}</span>
                    <span className="font-mono font-bold text-chili tabular-nums">{formatNumber(6, lang)}</span>
                  </p>
                </Node>
              ) : (
                <Node
                  role={v.concreteFactoryRole}
                  title={panel ? 'ThaiKitchen' : kitchen ? KITCHENS[kitchen].cls : 'Kitchen'}
                  active={panel !== null || kind === 'create'}
                  accent={panel ? KITCHENS.thai.color : accent}
                  mono
                >
                  <p className="-mt-1 mb-3 flex flex-wrap items-center gap-1.5 font-mono text-xs text-ink-soft" lang="en">
                    {v.implementsLabel} <span className="font-bold text-ink">Kitchen</span>
                    <span className="rounded border border-edge/40 px-1 py-px font-sans text-[10px] tracking-wider uppercase">
                      {v.abstractFactoryTag}
                    </span>
                    {(panel || kitchen === 'thai') && (
                      <span className="rounded bg-bottle px-1.5 py-px font-sans text-[10px] font-bold text-cream uppercase">
                        {v.newTag}
                      </span>
                    )}
                  </p>

                  {panel ? (
                    /* ── Level 3 builder ─────────────────────── */
                    <div className="flex flex-col gap-3 rounded-lg border-2 border-dashed p-3" style={{ borderColor: KITCHENS.thai.color }}>
                      <p className="font-display font-bold text-ink">🔨 {v.builderTitle}</p>
                      <div>
                        <p className="label-caps text-ink-soft">{v.builderStep1}</p>
                        <p className="mb-2 text-sm text-ink">{v.q1}</p>
                        <div role="radiogroup" aria-label={v.q1} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          {(
                            [
                              ['newFamily', v.q1NewFamily],
                              ['ifElse', v.q1IfElse],
                              ['flag', v.q1Flag],
                            ] as const
                          ).map(([id, text]) => (
                            <ChoiceButton
                              key={id}
                              selected={panel !== 'q1' && id === 'newFamily'}
                              color={KITCHENS.thai.color}
                              text={text}
                              onClick={() => answerQ1(id)}
                              animate={shake.anim(`q1-${id}`)}
                              className={panel !== 'q1' && id !== 'newFamily' ? 'opacity-40' : ''}
                            />
                          ))}
                        </div>
                        {panel !== 'q1' && <NewCodeChip>+ class ThaiKitchen implements Kitchen (+ PadThai, TomYum, MangoStickyRice)</NewCodeChip>}
                      </div>

                      {panel !== 'q1' && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                          <p className="label-caps text-ink-soft">{v.builderStep2}</p>
                          <p className="mb-2 text-sm text-ink">{v.q2}</p>
                          <div role="radiogroup" aria-label={v.q2} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            {(
                              [
                                ['nothing', v.q2Nothing],
                                ['case', v.q2Case],
                                ['method', v.q2Method],
                              ] as const
                            ).map(([id, text]) => (
                              <ChoiceButton
                                key={id}
                                selected={panel === 'ready' && id === 'nothing'}
                                color={KITCHENS.thai.color}
                                text={text}
                                onClick={() => answerQ2(id)}
                                animate={shake.anim(`q2-${id}`)}
                                className={panel === 'ready' && id !== 'nothing' ? 'opacity-40' : ''}
                              />
                            ))}
                          </div>
                          {panel === 'ready' && <NewCodeChip>+ serveCombo(new ThaiKitchen())</NewCodeChip>}
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
                          <Button variant="primary" onClick={openThai} data-game="open-branch">
                            🌶️ {v.openKitchen}
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  ) : kitchen ? (
                    <ol
                      className="flex flex-col gap-1 rounded-lg border p-2.5"
                      style={{ borderColor: `${accent}55`, backgroundColor: `${accent}0d` }}
                    >
                      {COURSES.map((c) => {
                        const st = status(kitchen === 'thai' ? `thai-${c}` : `${kitchen}-${c}`)
                        const dish = KITCHENS[kitchen].menu[c]
                        return (
                          <motion.li
                            key={c}
                            animate={{ x: st === 'active' ? 4 : 0 }}
                            className={`flex min-w-0 items-center gap-2 rounded-md border-2 px-2 py-0.5 ${
                              st === 'active' ? 'border-edge bg-card font-bold shadow-hard-sm' : 'border-transparent'
                            } ${st === 'pending' ? 'text-ink-soft/70' : 'text-ink'}`}
                          >
                            <StatusDot status={st} color={accent} />
                            <code lang="en" className="truncate font-mono text-[11px] sm:text-xs">
                              {CREATE[c]}() → new {DISHES[dish].cls}()
                            </code>
                          </motion.li>
                        )
                      })}
                    </ol>
                  ) : (
                    <p className="rounded-lg border-2 border-dashed border-edge/40 px-3 py-4 text-center text-sm text-ink-soft">
                      {v.noKitchen}
                    </p>
                  )}
                </Node>
              )}

              <Connector
                label={
                  step?.course
                    ? level === 1
                      ? `createDish(…)`
                      : `${CREATE[step.course]}()`
                    : level === 1
                      ? 'createDish(…)'
                      : 'createMain()…'
                }
                down={kind === 'dish' || kind === 'create'}
                up={kind === 'serve'}
                downPacket={
                  capDish && step?.course ? (
                    <Packet color={KITCHENS[DISHES[capDish].cuisine].color}>
                      {DISHES[capDish].emoji} {label(capDish)}
                    </Packet>
                  ) : undefined
                }
                upPacket={<Packet color="#0b6b4f">🍽️ ×3</Packet>}
                runKey={player.index}
              />

              {/* ── Bottom: the combo tray (concrete products) ───── */}
              <Node
                role={v.productsRole}
                title={v.trayTitle}
                active={kind === 'dish' || kind === 'create' || kind === 'serve'}
                accent={accent}
              >
                <p className="-mt-1 mb-3 flex flex-wrap items-center gap-1.5 font-mono text-xs text-ink-soft" lang="en">
                  MainDish · Side · Dessert
                  <span className="rounded border border-edge/40 px-1 py-px font-sans text-[10px] tracking-wider uppercase">
                    {v.abstractProductTag}
                  </span>
                </p>
                {tray}
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
        <StepControls player={controls} playLabel={`🍽️ ${v.serveButton}`} disabled={!ready || outcome !== null || panel !== null} />
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-soft">
        <p>* {v.priceNote}</p>
        <Button variant="ghost" onClick={restartGame} className="px-2 py-0.5 text-xs">
          ↺ {v.restart}
        </Button>
      </div>
    </div>
  )
}
