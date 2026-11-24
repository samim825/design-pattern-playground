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
import type { BuilderContent } from './content.en'

/*
 * "Karim's PC Shop": a 3-level game.
 *   Level 1  no pattern: the learner fills new PC(…) argument by argument (code panel: `without`)
 *   Level 2  Builder + Director: the learner picks the Director's recipe; the builder installs parts by name (`main`)
 *   Level 3  the learner adds QuotationBuilder; the same recipes now print price quotes (`with`)
 * Every turn is a step timeline, so the code panel lights up in sync.
 */

type Labels = BuilderContent['visual']
type LabelKey = keyof Labels
type PartKind = 'cpu' | 'ram' | 'storage' | 'gpu' | 'casing'
type PresetId = 'office' | 'student' | 'gaming'
type BuilderId = 'pc' | 'quote'
type TrayItem = PartKind | 'null'

/* ------------------------------------------------------------------ */
/* Scenario data                                                       */
/* ------------------------------------------------------------------ */

const KINDS: PartKind[] = ['cpu', 'ram', 'storage', 'gpu', 'casing']
const PARAM: Record<PartKind, string> = { cpu: 'cpu', ram: 'ramGb', storage: 'storage', gpu: 'gpu', casing: 'casing' }
const SETTER: Record<PartKind, string> = {
  cpu: 'setCpu',
  ram: 'setRam',
  storage: 'setStorage',
  gpu: 'setGpu',
  casing: 'setCasing',
}
const KIND_ICON: Record<PartKind, string> = { cpu: '🧠', ram: '🧩', storage: '💾', gpu: '🎮', casing: '🗄️' }
const KIND_LABEL: Record<PartKind, LabelKey> = {
  cpu: 'partCpu',
  ram: 'partRam',
  storage: 'partStorage',
  gpu: 'partGpu',
  casing: 'partCasing',
}

interface Part {
  value: string
  /** The argument as it appears in code. */
  arg: string
  price: number
}
interface Preset {
  method: string
  icon: string
  color: string
  need: LabelKey
  parts: Partial<Record<PartKind, Part>>
}

// Prices are illustrative only (the UI says so).
const PRESETS: Record<PresetId, Preset> = {
  office: {
    method: 'buildOffice',
    icon: '🗂️',
    color: '#0E7490',
    need: 'needOffice',
    parts: {
      cpu: { value: 'Core i3', arg: "'Core i3'", price: 12500 },
      ram: { value: '8GB RAM', arg: '8', price: 2800 },
      storage: { value: '256GB SSD', arg: "'256GB SSD'", price: 3000 },
      casing: { value: 'Mini tower', arg: "'Mini tower'", price: 3500 },
    },
  },
  student: {
    method: 'buildStudent',
    icon: '🎓',
    color: '#7C3AED',
    need: 'needStudent',
    parts: {
      cpu: { value: 'Core i5', arg: "'Core i5'", price: 19000 },
      ram: { value: '16GB RAM', arg: '16', price: 5200 },
      storage: { value: '512GB SSD', arg: "'512GB SSD'", price: 4800 },
      casing: { value: 'Mid tower', arg: "'Mid tower'", price: 4500 },
    },
  },
  gaming: {
    method: 'buildGaming',
    icon: '🎮',
    color: '#B91C1C',
    need: 'needGaming',
    parts: {
      cpu: { value: 'Ryzen 7', arg: "'Ryzen 7'", price: 32000 },
      ram: { value: '32GB RAM', arg: '32', price: 10500 },
      storage: { value: '1TB NVMe', arg: "'1TB NVMe'", price: 8500 },
      gpu: { value: 'RTX 4060', arg: "'RTX 4060'", price: 38000 },
      casing: { value: 'RGB tower', arg: "'RGB tower'", price: 7500 },
    },
  },
}
const PRESET_IDS: PresetId[] = ['office', 'student', 'gaming']
const kindsOf = (p: PresetId) => KINDS.filter((k) => PRESETS[p].parts[k])
const totalOf = (p: PresetId) => kindsOf(p).reduce((sum, k) => sum + (PRESETS[p].parts[k]?.price ?? 0), 0)

interface Customer {
  name: LabelKey
  emoji: string
  preset: PresetId
  wants: BuilderId
  /** Level 1: the order the parts lie on the counter (deliberately not constructor order). */
  tray?: TrayItem[]
}

const CUSTOMERS: Record<Level, Customer[]> = {
  1: [
    { name: 'nusrat', emoji: '👩', preset: 'office', wants: 'pc', tray: ['casing', 'ram', 'cpu', 'null', 'storage'] },
    { name: 'rahim', emoji: '👨', preset: 'gaming', wants: 'pc', tray: ['gpu', 'storage', 'casing', 'cpu', 'ram'] },
    { name: 'mitu', emoji: '👧', preset: 'student', wants: 'pc', tray: ['ram', 'null', 'casing', 'storage', 'cpu'] },
  ],
  2: [
    { name: 'mitu', emoji: '👧', preset: 'student', wants: 'pc' },
    { name: 'rahim', emoji: '👨', preset: 'gaming', wants: 'pc' },
    { name: 'nusrat', emoji: '👩', preset: 'office', wants: 'pc' },
  ],
  3: [
    { name: 'rahim', emoji: '👨', preset: 'gaming', wants: 'quote' },
    { name: 'nusrat', emoji: '👩', preset: 'office', wants: 'pc' },
    { name: 'mitu', emoji: '👧', preset: 'student', wants: 'quote' },
  ],
}

const TUTORIAL_SLOTS: (TrayItem | null)[] = ['cpu', 'ram', 'storage', 'null', 'casing']
const EMPTY_SLOTS: (TrayItem | null)[] = [null, null, null, null, null]
const LEVEL_ICON: Record<Level, string> = { 1: '🧱', 2: '🧑‍🔧', 3: '🧾' }
const BUILDER_CLASS: Record<BuilderId, string> = { pc: 'PCBuilder', quote: 'QuotationBuilder' }
const BUILDER_ICON: Record<BuilderId, string> = { pc: '🖥️', quote: '🧾' }
const QUOTE_COLOR = '#B45309'
const ARG_COUNT = 7

/** What each constructor position must receive for a preset ('null' when the part is not wanted). */
const expected = (p: PresetId, i: number): TrayItem => (PRESETS[p].parts[KINDS[i]] ? KINDS[i] : 'null')

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

type Kind = 'call' | 'arg' | 'new' | 'director' | 'part' | 'build' | 'result'

interface GameStep extends PlayerStep {
  kind: Kind
  caption: string
  slot?: number
  part?: PartKind
}

/** Step ids double as code-step ids: they match the `// @step:` markers in code/*.ts. */
function buildSteps(level: Level, customer: Customer, slots: (TrayItem | null)[], preset: PresetId | null, builder: BuilderId | null): GameStep[] {
  if (level === 1) {
    if (slots.some((s) => s === null)) return []
    const ok = slots.every((s, i) => s === expected(customer.preset, i))
    return [
      { id: 'l1-call', kind: 'call', caption: 'l1-call' },
      ...KINDS.map<GameStep>((k, i) => {
        const right = slots[i] === expected(customer.preset, i)
        return {
          id: `l1-${k}`,
          kind: 'arg',
          slot: i,
          caption: right ? (slots[i] === 'null' ? 'l1-arg-null' : 'l1-arg-ok') : 'l1-arg-bad',
          duration: 1300,
        }
      }),
      { id: 'l1-boot', codeStep: 'l1-call', kind: 'result', caption: ok ? 'l1-ok' : 'l1-fail', duration: 1100 },
    ]
  }
  if (!preset || !builder) return []
  if (builder === 'quote') {
    return [
      { id: 'q-new', kind: 'new', caption: 'q-new' },
      { id: 'q-director', kind: 'director', caption: 'q-director' },
      ...kindsOf(preset).map<GameStep>((k) => ({ id: `q-${k}`, kind: 'part', part: k, caption: 'q-part', duration: 1200 })),
      { id: 'q-build', kind: 'build', caption: 'q-build' },
      { id: 'q-done', kind: 'result', caption: 'q-done', duration: 1000 },
    ]
  }
  return [
    { id: 'new-builder', kind: 'new', caption: 'new-builder' },
    { id: `director-${preset}`, kind: 'director', caption: 'director' },
    ...kindsOf(preset).map<GameStep>((k) => ({ id: `${preset}-${k}`, kind: 'part', part: k, caption: 'part', duration: 1200 })),
    { id: 'build', kind: 'build', caption: 'build' },
    {
      id: 'done',
      kind: 'result',
      caption: PRESETS[preset].parts.gpu ? 'done' : 'done-no-gpu',
      duration: 1000,
    },
  ]
}

/* ------------------------------------------------------------------ */
/* Visual                                                              */
/* ------------------------------------------------------------------ */

export default function BuilderVisual({ content, lang, onCodeStep, onCodeView }: VisualProps<BuilderContent>) {
  const v = content.visual
  const captions: Record<string, string> = content.steps
  const label = (key: LabelKey) => v[key]

  const { progress, addCoins, completeLevel, reset: resetProgress } = useGameProgress('dpp-builder-game')
  const shake = useShake()
  const [level, setLevel] = useState<Level>(1)
  const [custIdx, setCustIdx] = useState(0)
  const [results, setResults] = useState<('ok' | 'fail')[]>([])
  const [mistakes, setMistakes] = useState(0)
  const [slots, setSlots] = useState<(TrayItem | null)[]>(TUTORIAL_SLOTS) // level 1, customer 1 is a guided tutorial
  const [preset, setPreset] = useState<PresetId | null>(null)
  const [builderChoice, setBuilderChoice] = useState<BuilderId | null>(null)
  const [quoteBuilt, setQuoteBuilt] = useState(false)
  const [panel, setPanel] = useState<'q1' | 'q2' | 'ready' | null>(null)
  const [hint, setHint] = useState<{ key: string; values?: Record<string, string> } | null>(null)
  const [levelDone, setLevelDone] = useState(false)
  const [lastStars, setLastStars] = useState(0)

  const customer = CUSTOMERS[level][custIdx]
  const builder: BuilderId | null = level === 2 ? 'pc' : level === 3 ? builderChoice : null
  const steps = useMemo(() => buildSteps(level, customer, slots, preset, builder), [level, customer, slots, preset, builder])
  const player = useStepPlayer(steps)
  const step = player.step
  const kind = step?.kind ?? null
  const busy = player.index >= 0
  const at = (id: string) => steps.findIndex((s) => s.id === id)
  const reachedId = (id: string) => {
    const i = at(id)
    return i >= 0 && player.index >= i
  }
  const reachedKind = (k: Kind) => {
    const i = steps.findIndex((s) => s.kind === k)
    return i >= 0 && player.index >= i
  }

  const shownPreset: PresetId = preset ?? customer.preset
  const recipe = PRESETS[shownPreset]
  const l1Ok = slots.every((s, i) => s === expected(customer.preset, i))
  const willSucceed = level === 1 ? l1Ok : true
  const outcome: 'ok' | 'fail' | null = player.done ? (willSucceed ? 'ok' : 'fail') : null
  const pendingCoins = outcome === 'ok' && (level === 1 || builder === 'pc') ? totalOf(customer.preset) : 0
  const accent = level === 1 ? PRESETS[customer.preset].color : builder === 'quote' ? QUOTE_COLOR : recipe.color

  /* ---------------- code panel sync ---------------- */

  const view: CodeView =
    level === 1
      ? 'without'
      : level === 3 && (panel || builderChoice === 'quote' || (customer.wants === 'quote' && !levelDone))
        ? 'with'
        : 'main'
  useEffect(() => {
    onCodeView?.(view)
  }, [view, onCodeView])
  useEffect(() => () => onCodeView?.('main'), [onCodeView])

  const firstEmpty = slots.findIndex((s) => s === null)
  let idleCode: string | null = null
  if (level === 1) idleCode = levelDone ? 'l1-todo' : firstEmpty >= 0 ? `l1-${KINDS[firstEmpty]}` : 'l1-call'
  else if (panel === 'q1') idleCode = 'build-q-class'
  else if (panel) idleCode = 'q-director'
  else if (preset && builder === 'quote') idleCode = 'q-director'
  else if (preset && builder === 'pc' && !levelDone) idleCode = `director-${preset}`
  const codeStep = step ? (step.codeStep ?? step.id) : idleCode
  useEffect(() => {
    onCodeStep(codeStep)
  }, [codeStep, onCodeStep])

  /* ---------------- actions ---------------- */

  const resetTurn = () => {
    player.reset()
    setSlots(EMPTY_SLOTS)
    setPreset(null)
    setBuilderChoice(null)
    setHint(null)
  }

  const startLevel = (n: Level) => {
    resetTurn()
    setLevel(n)
    setCustIdx(0)
    setResults([])
    setMistakes(0)
    if (n === 1) setSlots(TUTORIAL_SLOTS)
    setQuoteBuilt(false)
    setPanel(null)
    setLevelDone(false)
  }

  const restartGame = () => {
    resetProgress()
    startLevel(1)
  }

  const tapTray = (item: TrayItem) => {
    if (busy) return
    player.reset()
    setHint(null)
    setSlots((s) => {
      const placed = s.indexOf(item)
      const next = [...s]
      if (placed >= 0) next[placed] = null // tap again to take it back
      else {
        const empty = next.indexOf(null)
        if (empty >= 0) next[empty] = item
      }
      return next
    })
  }

  const clearSlot = (i: number) => {
    if (busy) return
    player.reset()
    setSlots((s) => s.map((x, j) => (j === i ? null : x)))
  }

  const pickPreset = (p: PresetId) => {
    if (busy || panel) return
    if (p !== customer.preset) {
      shake.bump(`preset-${p}`)
      setMistakes((m) => m + 1)
      setHint({ key: 'wrong-preset', values: { preset: label(p) } })
      return
    }
    player.reset()
    setHint(null)
    setPreset(p)
  }

  const pickBuilder = (b: BuilderId) => {
    if (busy || panel) return
    if (b === 'quote' && !quoteBuilt) {
      if (customer.wants === 'quote') {
        setHint(null)
        setPanel('q1')
      } else {
        shake.bump('builder-quote')
        setHint({ key: 'wrong-builder' })
      }
      return
    }
    if (b !== customer.wants) {
      shake.bump(`builder-${b}`)
      if (customer.wants === 'quote' && !quoteBuilt) {
        setHint({ key: 'need-build' })
      } else {
        setMistakes((m) => m + 1)
        setHint({ key: 'wrong-builder' })
      }
      return
    }
    player.reset()
    setHint(null)
    setBuilderChoice(b)
  }

  const answerQ1 = (id: 'implements' | 'extendsDirector' | 'inPc') => {
    if (panel !== 'q1') return
    if (id === 'implements') {
      setHint(null)
      setPanel('q2')
      return
    }
    shake.bump(`q1-${id}`)
    setMistakes((m) => m + 1)
    setHint({ key: id === 'extendsDirector' ? 'wrong-extends-director' : 'wrong-in-pc' })
  }

  const answerQ2 = (id: 'nothing' | 'newMethod' | 'flag') => {
    if (panel !== 'q2') return
    if (id === 'nothing') {
      setHint(null)
      setPanel('ready')
      return
    }
    shake.bump(`q2-${id}`)
    setMistakes((m) => m + 1)
    setHint({ key: id === 'newMethod' ? 'wrong-new-method' : 'wrong-flag' })
  }

  const plugQuoteBuilder = () => {
    player.reset()
    setQuoteBuilt(true)
    setPanel(null)
    setBuilderChoice('quote')
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

  const trayLabel = (item: TrayItem) => (item === 'null' ? 'null' : (PRESETS[customer.preset].parts[item]?.value ?? ''))
  const firstWrong = slots.findIndex((s, i) => s !== expected(customer.preset, i))
  const capSlot = step?.slot ?? (firstWrong >= 0 ? firstWrong : 0)
  const capPart = step?.part ? recipe.parts[step.part] : undefined
  const values: Record<string, string> = {
    name: label(customer.name),
    need: label(PRESETS[customer.preset].need),
    want: label(customer.wants === 'pc' ? 'wantsPc' : 'wantsQuote'),
    method: recipe.method,
    total: formatTaka(totalOf(level === 1 ? customer.preset : shownPreset), lang),
    n: formatNumber(capSlot + 1, lang),
    param: PARAM[KINDS[capSlot]],
    part: slots[capSlot] ? trayLabel(slots[capSlot]) : '',
    call: step?.part && capPart ? `${SETTER[step.part]}(${capPart.arg})` : '',
    value: capPart?.value ?? '',
    price: capPart ? formatTaka(capPart.price, lang) : '',
    ...(!step ? hint?.values : undefined),
  }

  let captionKey: string
  if (step) captionKey = step.caption
  else if (hint) captionKey = hint.key
  else if (levelDone) captionKey = `level${level}-done`
  else if (panel === 'q1') captionKey = 'build-q1'
  else if (panel === 'q2') captionKey = 'build-q2'
  else if (panel === 'ready') captionKey = 'build-ready'
  else if (level === 1) captionKey = firstEmpty >= 0 ? 'idle1' : custIdx === 0 && results.length === 0 ? 'tutorial' : 'filled1'
  else if (level === 2) captionKey = preset ? 'ready' : 'idle2'
  else if (preset && builderChoice) captionKey = builderChoice === 'quote' ? 'ready-q' : 'ready'
  else captionKey = customer.wants === 'quote' && !quoteBuilt ? 'need-build' : 'idle3'
  const caption = fill(captions[captionKey] ?? '', values)

  /* ---------------- pieces ---------------- */

  const partStatus = (id: string): Status => {
    const i = at(id)
    if (i < 0 || player.index < i) return 'pending'
    return player.index === i ? 'active' : 'done'
  }

  const customerOf = fill(v.customerOf, {
    n: formatNumber(custIdx + 1, lang),
    total: formatNumber(CUSTOMERS[level].length, lang),
  })

  const ready =
    level === 1
      ? firstEmpty < 0
      : level === 2
        ? preset === customer.preset
        : preset === customer.preset && builderChoice === customer.wants

  // Rows of the PC case: level 1 shows what went into each position, later levels what the builder installed.
  const caseRows = KINDS.map((k, i) => {
    if (level === 1) {
      const item = slots[i]
      const checked = reachedId(`l1-${k}`)
      const right = item === expected(customer.preset, i)
      return {
        kind: k,
        text: checked && item ? (item === 'null' ? v.skipped : trayLabel(item)) : '',
        state: !checked ? 'empty' : item === 'null' && right ? 'skipped' : right ? 'ok' : 'bad',
      }
    }
    const part = recipe.parts[k]
    if (!part) return { kind: k, text: preset ? v.skipped : '', state: preset ? 'skipped' : 'empty' }
    const installed = reachedId(`${shownPreset}-${k}`)
    return { kind: k, text: installed ? part.value : '', state: installed ? 'ok' : 'empty' }
  })

  const resultBanner = (
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
              animate={willSucceed ? { scale: [1, 1.2, 1] } : { x: [0, -4, 4, -3, 3, 0] }}
              transition={{ duration: 0.6 }}
            >
              {willSucceed ? '🖥️' : '💨'}
            </motion.span>
            {willSucceed ? v.boots : v.noBoot}
          </span>
          {willSucceed && <span className="tabular-nums">{formatTaka(totalOf(customer.preset), lang)}</span>}
        </motion.div>
      )}
    </AnimatePresence>
  )

  const pcCase = (
    <div className="rounded-lg border-2 border-edge/50 bg-paper p-2.5">
      <ul className="flex flex-col gap-1">
        {caseRows.map((row) => (
          <motion.li
            key={row.kind}
            animate={{ x: row.state === 'bad' ? [0, -4, 4, 0] : 0 }}
            className={`flex min-w-0 items-center gap-2 rounded-md border-2 px-2 py-1 text-xs ${
              row.state === 'ok'
                ? 'border-bottle/50 bg-bottle/10 text-ink dark:border-jade/60'
                : row.state === 'bad'
                  ? 'border-chili bg-chili/10 text-chili'
                  : row.state === 'skipped'
                    ? 'border-dashed border-edge/30 text-ink-soft/60'
                    : 'border-dashed border-edge/30 text-ink-soft/50'
            }`}
          >
            <span aria-hidden="true">{KIND_ICON[row.kind]}</span>
            <span className="w-20 shrink-0 truncate font-semibold sm:w-24">{label(KIND_LABEL[row.kind])}</span>
            <AnimatePresence mode="popLayout" initial={false}>
              {row.text && (
                <motion.span
                  key={row.text}
                  lang="en"
                  initial={{ y: -14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`ml-auto truncate font-mono font-bold ${row.state === 'skipped' ? 'line-through' : ''}`}
                >
                  {row.state === 'bad' && '✗ '}
                  {row.text}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.li>
        ))}
      </ul>
      {!caseRows.some((r) => r.text) && <p className="mt-2 text-center text-xs text-ink-soft/70 italic">{v.emptyCase}</p>}
      {resultBanner}
    </div>
  )

  const quotePaper = (
    <div className="rounded-lg border-2 border-dashed border-edge bg-paper p-3 text-sm">
      <p className="mb-2 font-display font-bold text-ink">🧾 {v.quoteTitle}</p>
      <ul className="flex flex-col gap-1">
        {kindsOf(shownPreset).map((k) =>
          reachedId(`q-${k}`) ? (
            <motion.li
              key={k}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex justify-between gap-2 border-b border-dotted border-edge/40 pb-0.5"
            >
              <span lang="en" className="truncate font-mono text-xs">
                {recipe.parts[k]?.value}
              </span>
              <span className="tabular-nums">{formatTaka(recipe.parts[k]?.price ?? 0, lang)}</span>
            </motion.li>
          ) : null,
        )}
      </ul>
      {!reachedKind('part') && <p className="text-center text-xs text-ink-soft/70 italic">{v.emptyQuote}</p>}
      <AnimatePresence>
        {reachedKind('build') && (
          <motion.p
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-2 flex justify-between gap-2 border-t-2 border-edge pt-1 font-bold"
          >
            <span>{v.total}</span>
            <span className="tabular-nums">{formatTaka(totalOf(shownPreset), lang)}</span>
          </motion.p>
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
                    {'new PC(…, …, …, …, …, …, …, ???)'}
                  </code>
                </>
              )}
              {level === 2 && <p className="prose-text text-sm text-ink">{v.l2Summary}</p>}
              {level === 3 && (
                <Recap
                  title={v.recapTitle}
                  items={[
                    { icon: '😣', text: v.recap1 },
                    { icon: '🧑‍🔧', text: v.recap2 },
                    { icon: '🧾', text: v.recap3 },
                  ]}
                />
              )}
            </LevelCompleteCard>
          ) : (
            <motion.div key={`play-${level}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* ── Client: customer + choices ─────────────────── */}
              <Node
                role={v.clientRole}
                title={`🛒 ${v.counterTitle}`}
                active={kind === 'call' || kind === 'new' || kind === 'result'}
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
                    className="mb-3 flex items-start gap-3 rounded-lg border-2 border-dashed border-edge/50 bg-paper p-2.5"
                  >
                    <span className="text-3xl" aria-hidden="true">
                      {customer.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-baseline justify-between gap-2 font-bold text-ink">
                        <span className="truncate">{label(customer.name)}</span>
                        {level === 3 && (
                          <span className="shrink-0 rounded-full border-2 border-edge/40 px-2 text-xs">
                            {BUILDER_ICON[customer.wants]} {label(customer.wants === 'pc' ? 'wantsPc' : 'wantsQuote')}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-ink-soft">
                        {v.needsLabel}: {label(PRESETS[customer.preset].need)}
                      </p>
                      {level === 1 && (
                        <div className="mt-1.5 flex flex-wrap gap-1" lang="en">
                          {customer.tray?.map((item) =>
                            item === 'null' ? (
                              <span key={item} lang={lang} className="rounded bg-chili/10 px-1.5 text-[11px] font-semibold text-chili">
                                ✗ {v.noGpu}
                              </span>
                            ) : (
                              <span key={item} className="rounded bg-paper-deep px-1.5 font-mono text-[11px] text-ink">
                                {KIND_ICON[item]} {trayLabel(item)}
                              </span>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {level === 1 ? (
                  <>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <p id="bd-pick-label" className="label-caps text-ink-soft">
                        {v.pickParts}
                      </p>
                      <Button variant="ghost" onClick={() => setSlots(EMPTY_SLOTS)} disabled={busy} className="px-2 py-0.5 text-xs">
                        ↺ {v.clearSlots}
                      </Button>
                    </div>
                    <div role="group" aria-labelledby="bd-pick-label" className="grid grid-cols-3 gap-2">
                      {customer.tray?.map((item) => (
                        <ChoiceButton
                          key={item}
                          role="checkbox"
                          selected={slots.includes(item)}
                          color="#0b6b4f"
                          icon={item === 'null' ? '∅' : KIND_ICON[item]}
                          text={item === 'null' ? v.nullCard : trayLabel(item)}
                          onClick={() => tapTray(item)}
                          animate={shake.anim(item)}
                          mono={item !== 'null'}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    {level === 3 && (
                      <>
                        <p id="bd-builder-label" className="mb-1.5 label-caps text-ink-soft">
                          {v.pickBuilder}
                        </p>
                        <div role="radiogroup" aria-labelledby="bd-builder-label" className="mb-3 grid grid-cols-2 gap-2">
                          <ChoiceButton
                            selected={builderChoice === 'pc'}
                            color={recipe.color}
                            icon={BUILDER_ICON.pc}
                            text={`${v.pcBuilder} · PCBuilder`}
                            onClick={() => pickBuilder('pc')}
                            animate={shake.anim('builder-pc')}
                          />
                          <ChoiceButton
                            selected={quoteBuilt ? builderChoice === 'quote' : panel !== null}
                            color={QUOTE_COLOR}
                            icon={quoteBuilt ? BUILDER_ICON.quote : '🔨'}
                            text={quoteBuilt ? `${v.quoteBuilder} · QuotationBuilder` : `${v.buildSlot}: ${v.quoteBuilder}`}
                            onClick={() => pickBuilder('quote')}
                            animate={shake.anim('builder-quote')}
                            className={!quoteBuilt && panel === null ? 'border-dashed' : ''}
                          />
                        </div>
                      </>
                    )}
                    <p id="bd-preset-label" className="mb-1.5 label-caps text-ink-soft">
                      {v.pickPreset}
                    </p>
                    <div role="radiogroup" aria-labelledby="bd-preset-label" className="grid grid-cols-3 gap-2">
                      {PRESET_IDS.map((p) => (
                        <ChoiceButton
                          key={p}
                          selected={preset === p}
                          color={PRESETS[p].color}
                          icon={PRESETS[p].icon}
                          text={label(p)}
                          onClick={() => pickPreset(p)}
                          animate={shake.anim(`preset-${p}`)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </Node>

              <Connector
                label={level === 1 ? 'new PC(…)' : `${recipe.method}(b)`}
                down={kind === 'call' || kind === 'new' || kind === 'director'}
                up={kind === 'result' && willSucceed}
                downPacket={
                  level === 1 ? (
                    <Packet color={accent}>🧩 ×5</Packet>
                  ) : (
                    <Packet color={accent}>
                      {BUILDER_ICON[builder ?? 'pc']} <span lang="en">{BUILDER_CLASS[builder ?? 'pc']}</span>
                    </Packet>
                  )
                }
                upPacket={
                  <Packet color="#0b6b4f">
                    {builder === 'quote' ? '🧾' : '🖥️'} {formatTaka(totalOf(customer.preset), lang)}
                  </Packet>
                }
                runKey={player.index}
              />

              {/* ── Middle: the long constructor (L1) or the Director (L2/3) ── */}
              {level === 1 ? (
                <Node role={v.noPatternRole} title="new PC(…)" active={kind === 'call' || kind === 'arg'} accent="#B91C1C" mono>
                  <ol className="flex flex-col gap-1">
                    {KINDS.map((k, i) => {
                      const item = slots[i]
                      const status = partStatus(`l1-${k}`)
                      const right = item === expected(customer.preset, i)
                      const checked = status === 'done' || status === 'active'
                      return (
                        <motion.li
                          key={k}
                          animate={{ x: status === 'active' ? 4 : 0 }}
                          className={`flex min-w-0 items-center gap-2 rounded-md border-2 px-2 py-1 ${
                            status === 'active' ? 'border-edge bg-card shadow-hard-sm' : 'border-transparent'
                          }`}
                        >
                          <span className="grid size-5 shrink-0 place-items-center rounded-full bg-paper-deep text-[10px] font-bold tabular-nums">
                            {formatNumber(i + 1, lang)}
                          </span>
                          <code lang="en" className="w-16 shrink-0 font-mono text-[11px] text-ink-soft sm:text-xs">
                            {PARAM[k]}
                          </code>
                          <button
                            type="button"
                            onClick={() => clearSlot(i)}
                            disabled={busy || !item}
                            lang="en"
                            className={`min-w-0 flex-1 truncate rounded-md border-2 px-2 py-0.5 text-left font-mono text-xs font-bold ${
                              !item
                                ? 'border-dashed border-edge/40 text-ink-soft/50'
                                : checked && !right
                                  ? 'border-chili bg-chili/10 text-chili'
                                  : checked
                                    ? 'border-bottle/60 bg-bottle/10 text-ink'
                                    : 'border-edge/60 bg-card text-ink'
                            }`}
                          >
                            {item ? trayLabel(item) : '?'}
                          </button>
                          <span className="w-5 shrink-0 text-center text-sm font-bold" aria-hidden="true">
                            {checked ? (right ? '✓' : '✗') : ''}
                          </span>
                        </motion.li>
                      )
                    })}
                    <li className="flex items-center gap-2 px-2 py-0.5 font-mono text-[11px] text-ink-soft/60" lang="en">
                      <span className="w-5 shrink-0 text-center">…</span>
                      wifi, rgb = false, false
                    </li>
                  </ol>
                  <p className="mt-2 flex items-center justify-between gap-2 border-t-2 border-dashed border-edge/40 pt-2 text-xs text-ink-soft">
                    <span>{v.argsLabel}</span>
                    <span className="font-mono font-bold text-chili tabular-nums">{formatNumber(ARG_COUNT, lang)}</span>
                  </p>
                </Node>
              ) : (
                <Node
                  role={v.directorRole}
                  title={v.directorTitle}
                  active={kind === 'director' || kind === 'part'}
                  accent={accent}
                  mono
                >
                  <p className="-mt-1 mb-3">
                    <span className="inline-flex items-center gap-1 rounded-full border-2 border-bottle/60 bg-bottle/10 px-2 py-0.5 text-xs font-bold text-bottle dark:text-jade">
                      ✓ {v.onlyInterface}
                    </span>
                  </p>
                  {preset ? (
                    <div className="rounded-lg border p-2.5" style={{ borderColor: `${recipe.color}55`, backgroundColor: `${recipe.color}0d` }}>
                      <p lang="en" className="mb-1.5 font-mono text-xs font-bold" style={{ color: recipe.color }}>
                        {recipe.method}(b)
                      </p>
                      <ol className="flex flex-col gap-1">
                        {KINDS.map((k) => {
                          const part = recipe.parts[k]
                          if (!part) {
                            return (
                              <li key={k} lang="en" className="flex items-center gap-2 px-2 py-0.5 font-mono text-[11px] text-ink-soft/50">
                                <span className="size-5 shrink-0" />
                                <span className="line-through">b.{SETTER[k]}(…)</span>
                                <span lang={lang} className="ml-auto font-sans">
                                  {v.skipped}
                                </span>
                              </li>
                            )
                          }
                          const status = partStatus(builder === 'quote' ? `q-${k}` : `${preset}-${k}`)
                          return (
                            <motion.li
                              key={k}
                              animate={{ x: status === 'active' ? 4 : 0 }}
                              className={`flex min-w-0 items-center gap-2 rounded-md border-2 px-2 py-0.5 ${
                                status === 'active' ? 'border-edge bg-card font-bold shadow-hard-sm' : 'border-transparent'
                              } ${status === 'pending' ? 'text-ink-soft/70' : 'text-ink'}`}
                            >
                              <StatusDot status={status} color={accent} />
                              <code lang="en" className="truncate font-mono text-[11px] sm:text-xs">
                                b.{SETTER[k]}({part.arg})
                              </code>
                            </motion.li>
                          )
                        })}
                      </ol>
                    </div>
                  ) : (
                    <p className="rounded-lg border-2 border-dashed border-edge/40 px-3 py-4 text-center text-sm text-ink-soft">
                      {v.noRecipe}
                    </p>
                  )}
                </Node>
              )}

              <Connector
                label={
                  kind === 'part' && step?.part
                    ? `${SETTER[step.part]}(…)`
                    : level === 1
                      ? 'PC'
                      : builder === 'quote'
                        ? 'getQuote()'
                        : 'build()'
                }
                down={kind === 'arg' || kind === 'part'}
                up={kind === 'build'}
                downPacket={
                  kind === 'arg' && step?.slot !== undefined && slots[step.slot] ? (
                    <Packet color={accent}>
                      <span lang="en">{trayLabel(slots[step.slot]!)}</span>
                    </Packet>
                  ) : step?.part && capPart ? (
                    <Packet color={accent}>
                      {KIND_ICON[step.part]} <span lang="en">{capPart.value}</span>
                    </Packet>
                  ) : undefined
                }
                upPacket={
                  <Packet color="#0b6b4f">
                    {builder === 'quote' ? '🧾 Quote' : '🖥️ PC'}
                  </Packet>
                }
                runKey={player.index}
              />

              {/* ── Bottom: the PC (L1) or the ConcreteBuilder (L2/3) ── */}
              <Node
                role={level === 1 ? v.productRole : v.concreteBuilderRole}
                title={
                  level === 1
                    ? 'PC'
                    : panel
                      ? 'QuotationBuilder'
                      : builder
                        ? BUILDER_CLASS[builder]
                        : 'ComputerBuilder'
                }
                active={panel !== null || kind === 'arg' || kind === 'part' || kind === 'build'}
                accent={panel ? QUOTE_COLOR : accent}
                mono
              >
                {level > 1 && (
                  <p className="-mt-1 mb-3 flex flex-wrap items-center gap-1.5 font-mono text-xs text-ink-soft" lang="en">
                    {v.implementsLabel} <span className="font-bold text-ink">ComputerBuilder</span>
                    <span className="rounded border border-edge/40 px-1 py-px font-sans text-[10px] tracking-wider uppercase">
                      {v.builderTag}
                    </span>
                    {(panel || builder === 'quote') && (
                      <span className="rounded bg-bottle px-1.5 py-px font-sans text-[10px] font-bold text-cream uppercase">
                        {v.newTag}
                      </span>
                    )}
                  </p>
                )}

                {panel ? (
                  /* ── Level 3 builder ─────────────────────────── */
                  <div className="flex flex-col gap-3 rounded-lg border-2 border-dashed p-3" style={{ borderColor: QUOTE_COLOR }}>
                    <p className="font-display font-bold text-ink">🔨 {v.builderTitle}</p>
                    <div>
                      <p className="label-caps text-ink-soft">{v.builderStep1}</p>
                      <p className="mb-2 text-sm text-ink">{v.q1}</p>
                      <div role="radiogroup" aria-label={v.q1} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {(
                          [
                            ['implements', v.q1Implements],
                            ['extendsDirector', v.q1ExtendsDirector],
                            ['inPc', v.q1InPc],
                          ] as const
                        ).map(([id, text]) => (
                          <ChoiceButton
                            key={id}
                            selected={panel !== 'q1' && id === 'implements'}
                            color={QUOTE_COLOR}
                            text={text}
                            onClick={() => answerQ1(id)}
                            animate={shake.anim(`q1-${id}`)}
                            className={panel !== 'q1' && id !== 'implements' ? 'opacity-40' : ''}
                          />
                        ))}
                      </div>
                      {panel !== 'q1' && <NewCodeChip>+ class QuotationBuilder implements ComputerBuilder</NewCodeChip>}
                    </div>

                    {panel !== 'q1' && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <p className="label-caps text-ink-soft">{v.builderStep2}</p>
                        <p className="mb-2 text-sm text-ink">{v.q2}</p>
                        <div role="radiogroup" aria-label={v.q2} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          {(
                            [
                              ['nothing', v.q2Nothing],
                              ['newMethod', v.q2NewMethod],
                              ['flag', v.q2Flag],
                            ] as const
                          ).map(([id, text]) => (
                            <ChoiceButton
                              key={id}
                              selected={panel === 'ready' && id === 'nothing'}
                              color={QUOTE_COLOR}
                              text={text}
                              onClick={() => answerQ2(id)}
                              animate={shake.anim(`q2-${id}`)}
                              className={panel === 'ready' && id !== 'nothing' ? 'opacity-40' : ''}
                            />
                          ))}
                        </div>
                        {panel === 'ready' && <NewCodeChip>+ technician.buildGaming(new QuotationBuilder())</NewCodeChip>}
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
                        <Button variant="primary" onClick={plugQuoteBuilder} data-game="open-branch">
                          🧾 {v.useBuilder}
                        </Button>
                      </motion.div>
                    )}
                  </div>
                ) : builder === 'quote' ? (
                  quotePaper
                ) : (
                  <>
                    {pcCase}
                    {level > 1 && (
                      <AnimatePresence>
                        {reachedKind('build') && (
                          <motion.p
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-2 flex flex-wrap items-center gap-1.5 font-mono text-xs text-ink-soft"
                            lang="en"
                          >
                            build() → <span className="font-bold text-ink">PC</span>
                            <span className="rounded border border-edge/40 px-1 py-px font-sans text-[10px] tracking-wider uppercase">
                              {v.productTag}
                            </span>
                          </motion.p>
                        )}
                      </AnimatePresence>
                    )}
                  </>
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
        <StepControls player={controls} playLabel={`🔧 ${v.buildButton}`} disabled={!ready || outcome !== null || panel !== null} />
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
