import { AnimatePresence, motion } from 'framer-motion'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { ChoiceButton, GameHud, LevelCompleteCard, MissionBanner, NewCodeChip, Recap } from '@/components/game'
import { type Level, starsFor, useGameProgress, useShake } from '@/components/game/state'
import { Button } from '@/components/ui/Button'
import { StepControls } from '@/components/ui/StepControls'
import { Caption, Connector, Node, Packet, Stage, StatusDot } from '@/components/visual'
import { type PlayerStep, useStepPlayer } from '@/hooks/useStepPlayer'
import { formatNumber, formatTaka } from '@/lib/format'
import { fill } from '@/lib/template'
import type { CodeView, VisualProps } from '@/types/pattern'
import type { ChainContent } from './content.en'

/*
 * "Dhanshiri Bank loan desk": a 3-level game.
 *   Level 1  no pattern: the desk (client) picks the approver itself; a junior signing beyond the limit
 *            gets an audit flag, a senior getting a small file makes the customer wait (`without`)
 *   Level 2  Chain of Responsibility: the learner wires the chain with setNext(); the desk hands every
 *            loan to the first handler and it travels until someone can sign (`main`)
 *   Level 3  the learner adds RegionalManager and links it between manager and head office (`with`)
 * Every turn is a step timeline, so the code panel lights up in sync.
 */

type Labels = ChainContent['visual']
type LabelKey = keyof Labels
type H = 'officer' | 'manager' | 'regional' | 'head'
type Result = 'ok' | 'over' | 'slow' | 'nobody'

/* ------------------------------------------------------------------ */
/* Scenario data                                                       */
/* ------------------------------------------------------------------ */

const OK_COLOR = '#0b6b4f'
const FAIL_COLOR = '#B91C1C'
const FEE_RATE = 0.01

const HANDLER: Record<H, { icon: string; cls: string; ref: string; limit: number; wait: LabelKey; color: string; rank: number }> = {
  officer: { icon: '🧑‍💼', cls: 'LoanOfficer', ref: 'officer', limit: 50_000, wait: 'waitSameDay', color: '#0F766E', rank: 0 },
  manager: { icon: '👔', cls: 'BranchManager', ref: 'manager', limit: 500_000, wait: 'wait2Days', color: '#C2410C', rank: 1 },
  regional: { icon: '🏢', cls: 'RegionalManager', ref: 'regional', limit: 2_000_000, wait: 'wait3Days', color: '#7C3AED', rank: 2 },
  head: { icon: '🏛️', cls: 'HeadOffice', ref: 'head', limit: 5_000_000, wait: 'wait3Weeks', color: '#1D4ED8', rank: 3 },
}
const L1_APPROVERS: H[] = ['officer', 'manager', 'head']
/** Chain tiles are shown shuffled, so the learner has to think about the order. */
const TILES_L2: H[] = ['head', 'officer', 'manager']
const TILES_L3: H[] = ['head', 'regional', 'officer', 'manager']
const L2_CHAIN: H[] = ['officer', 'manager', 'head']
const L3_CHAIN: H[] = ['officer', 'manager', 'regional', 'head']

interface Turn {
  name: LabelKey
  emoji: string
  amount: number
  purpose: LabelKey
}

const TURNS: Record<Level, Turn[]> = {
  1: [
    { name: 'mitu', emoji: '👩', amount: 30_000, purpose: 'forSewing' },
    { name: 'karim', emoji: '🧔', amount: 300_000, purpose: 'forShop' },
    { name: 'rahim', emoji: '👨', amount: 2_500_000, purpose: 'forGarment' },
  ],
  2: [
    { name: 'nusrat', emoji: '👩‍💻', amount: 40_000, purpose: 'forLaptop' },
    { name: 'tania', emoji: '👩‍🎓', amount: 250_000, purpose: 'forBoutique' },
    { name: 'rahim', emoji: '👨', amount: 1_800_000, purpose: 'forPickup' },
  ],
  3: [
    { name: 'mitu', emoji: '👩', amount: 1_200_000, purpose: 'forBakery' },
    { name: 'karim', emoji: '🧔', amount: 80_000, purpose: 'forFridge' },
    { name: 'nusrat', emoji: '👩‍💻', amount: 3_500_000, purpose: 'forPoultry' },
  ],
}
/** Level 1, loan 1 is a guided tutorial: the right approver is pre-selected. */
const TUTORIAL_PICK: H = 'officer'

/** The most junior handler (of those that exist) whose limit covers the amount. */
const rightFor = (amount: number, pool: H[]): H | null =>
  [...pool].sort((a, b) => HANDLER[a].rank - HANDLER[b].rank).find((h) => amount <= HANDLER[h].limit) ?? null

/** Level 1: the desk picked `pick` itself. */
function judgePick(pick: H, amount: number): Result {
  const right = rightFor(amount, L1_APPROVERS)
  if (pick === right) return 'ok'
  return HANDLER[pick].limit < amount ? 'over' : 'slow'
}

/** Levels 2 and 3: run the loan through the learner's chain. */
function runChain(chain: H[], amount: number, pool: H[]) {
  const visits: { h: H; can: boolean }[] = []
  let by: H | null = null
  for (const h of chain) {
    const can = amount <= HANDLER[h].limit
    visits.push({ h, can })
    if (can) {
      by = h
      break
    }
  }
  const result: Result = by === null ? 'nobody' : by === rightFor(amount, pool) ? 'ok' : 'slow'
  return { visits, by, result }
}

const LEVEL_ICON: Record<Level, string> = { 1: '🧾', 2: '⛓️', 3: '🏢' }

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

type Kind = 'start' | 'route' | 'sign' | 'judge' | 'result' | 'wire' | 'check' | 'pass' | 'approve' | 'reject' | 'done'

interface GameStep extends PlayerStep {
  kind: Kind
  caption: string
  /** Levels 2–3: index in the chain of the handler this step is about. */
  at?: number
}

/** Step ids double as code-step ids: they match the `// @step:` markers in code/*.ts. */
function buildSteps(level: Level, turn: Turn, pick: H | null, chain: H[], pool: H[], ready: boolean): GameStep[] {
  if (!ready) return []
  if (level === 1) {
    if (!pick) return []
    const res = judgePick(pick, turn.amount)
    return [
      { id: 'l1-start', kind: 'start', caption: 'l1-start' },
      { id: 'l1-route', codeStep: `l1-${pick}`, kind: 'route', caption: 'l1-route', duration: 1500 },
      { id: 'l1-sign', kind: 'sign', caption: 'l1-sign', duration: 1600 },
      { id: 'l1-check', codeStep: 'l1-pick', kind: 'judge', caption: `l1-check-${res}`, duration: 1900 },
      { id: 'l1-result', kind: 'result', caption: res === 'ok' ? 'l1-ok' : `l1-fail-${res}`, duration: 1200 },
    ]
  }
  const l3 = level === 3
  const { visits, result } = runChain(chain, turn.amount, pool)
  const codeOf = (h: H, l2: string) => (l3 ? (h === 'regional' ? 'regional' : `hop-${h}`) : l2)
  const hops = visits.flatMap<GameStep>(({ h, can }, i) => {
    const check: GameStep = { id: `check-${i}`, codeStep: codeOf(h, 'check'), kind: 'check', at: i, caption: can ? 'check-yes' : 'check-no', duration: 1600 }
    if (can) {
      const caption = result === 'slow' ? 'approve-slow' : l3 && h === 'regional' ? 'approve-new' : 'approve'
      return [check, { id: 'approve', codeStep: codeOf(h, 'approve'), kind: 'approve', at: i, caption, duration: 1700 }]
    }
    if (i < chain.length - 1) return [check, { id: `pass-${i}`, codeStep: codeOf(h, 'pass'), kind: 'pass', at: i, caption: 'pass', duration: 1400 }]
    return [check, { id: 'reject', codeStep: codeOf(h, 'reject'), kind: 'reject', at: i, caption: 'reject', duration: 1700 }]
  })
  return [
    { id: 'wire', codeStep: l3 ? 'wire-new' : 'wire', kind: 'wire', caption: l3 ? 'wire-new' : 'wire', duration: 1400 },
    { id: 'submit', codeStep: l3 ? 'submit-new' : 'submit', kind: 'start', caption: 'submit', duration: 1400 },
    ...hops,
    {
      id: 'done',
      codeStep: l3 ? 'done-new' : 'done',
      kind: 'done',
      caption: result === 'ok' ? (l3 ? 'done-new' : 'done-ok') : `done-${result}`,
      duration: 1300,
    },
  ]
}

/* ------------------------------------------------------------------ */
/* Visual                                                              */
/* ------------------------------------------------------------------ */

export default function ChainVisual({ content, lang, onCodeStep, onCodeView }: VisualProps<ChainContent>) {
  const v = content.visual
  const captions: Record<string, string> = content.steps
  const label = (key: LabelKey) => v[key]

  const { progress, addCoins, completeLevel, reset: resetProgress } = useGameProgress('dpp-chain-of-responsibility-game')
  const shake = useShake()
  const [level, setLevel] = useState<Level>(1)
  const [turnIdx, setTurnIdx] = useState(0)
  const [results, setResults] = useState<('ok' | 'fail')[]>([])
  const [mistakes, setMistakes] = useState(0)
  const [pick, setPick] = useState<H | null>(TUTORIAL_PICK) // level 1, loan 1 is a guided tutorial
  const [chain, setChain] = useState<H[]>([])
  const [built, setBuilt] = useState(false)
  const [panel, setPanel] = useState<'q1' | 'q2' | 'ready' | null>(null)
  const [hint, setHint] = useState<{ key: string } | null>(null)
  const [levelDone, setLevelDone] = useState(false)
  const [lastStars, setLastStars] = useState(0)

  const turn = TURNS[level][turnIdx]
  const pool: H[] = level === 3 && built ? L3_CHAIN : L2_CHAIN
  const ready = level === 1 ? pick !== null : chain.length >= 2 && (level < 3 || built)
  const steps = useMemo(() => buildSteps(level, turn, pick, chain, pool, ready), [level, turn, pick, chain, pool, ready])
  const player = useStepPlayer(steps)
  const step = player.step
  const kind = step?.kind ?? null
  const busy = player.index >= 0
  const stepIs = (...kinds: Kind[]) => kind !== null && kinds.includes(kind)

  const run = level === 1 ? null : runChain(chain, turn.amount, pool)
  const result: Result | null = level === 1 ? (pick ? judgePick(pick, turn.amount) : null) : run ? run.result : null
  const willSucceed = result === 'ok'
  const outcome: 'ok' | 'fail' | null = player.done ? (willSucceed ? 'ok' : 'fail') : null
  const fee = turn.amount * FEE_RATE
  const pendingCoins = outcome === 'ok' ? fee : 0
  const signer: H | null = level === 1 ? pick : (run?.by ?? null)
  const right = rightFor(turn.amount, level === 1 ? L1_APPROVERS : pool)
  const accent = level === 1 ? FAIL_COLOR : level === 3 ? HANDLER.regional.color : OK_COLOR

  /* ---------------- code panel sync ---------------- */

  const view: CodeView = level === 1 ? 'without' : level === 2 ? 'main' : 'with'
  useEffect(() => {
    onCodeView?.(view)
  }, [view, onCodeView])
  useEffect(() => () => onCodeView?.('main'), [onCodeView])

  let idleCode: string | null = null
  if (level === 1) idleCode = levelDone ? 'l1-copy' : 'l1-pick'
  else if (levelDone) idleCode = null
  else if (level === 2) idleCode = 'wire'
  else idleCode = panel === 'q1' ? 'build-link' : panel === 'q2' ? 'client-same' : panel === 'ready' ? 'build-class' : 'wire-new'
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
    setChain(n === 3 ? L2_CHAIN : [])
    setBuilt(false)
    setPanel(n === 3 ? 'q1' : null)
    setLevelDone(false)
  }

  const restartGame = () => {
    resetProgress()
    startLevel(1)
  }

  const choose = (h: H) => {
    if (busy) return
    player.reset()
    setHint(null)
    setPick(h)
  }

  const tapLink = (h: H) => {
    if (busy) return
    player.reset()
    setHint(null)
    setChain(chain.includes(h) ? chain.filter((x) => x !== h) : [...chain, h])
  }

  const answerQ1 = (id: 'between' | 'first' | 'last') => {
    if (panel !== 'q1') return
    if (id === 'between') {
      setHint(null)
      setPanel('q2')
      return
    }
    shake.bump(`q1-${id}`)
    setMistakes((m) => m + 1)
    setHint({ key: id === 'first' ? 'wrong-q1-first' : 'wrong-q1-last' })
  }

  const answerQ2 = (id: 'nothing' | 'desk' | 'edit') => {
    if (panel !== 'q2') return
    if (id === 'nothing') {
      setHint(null)
      setPanel('ready')
      return
    }
    shake.bump(`q2-${id}`)
    setMistakes((m) => m + 1)
    setHint({ key: id === 'desk' ? 'wrong-q2-desk' : 'wrong-q2-edit' })
  }

  const linkRegional = () => {
    player.reset()
    setBuilt(true)
    setChain(L3_CHAIN)
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
    resetTurn() // the chain stays wired: fix it, or reuse it for the next loan
    if (!wasOk) {
      setMistakes((m) => m + 1)
      return // the same loan again
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

  const stepHandler = step?.at !== undefined ? chain[step.at] : (signer ?? chain[0])
  const waitOf = (h: H | null) => (h ? label(HANDLER[h].wait) : '')
  const values: Record<string, string> = {
    name: label(turn.name),
    amount: formatTaka(turn.amount, lang),
    purpose: label(turn.purpose),
    approver: pick ? HANDLER[pick].cls : '',
    limit: formatTaka(HANDLER[(level === 1 ? pick : stepHandler) ?? 'officer'].limit, lang),
    right: right ? HANDLER[right].cls : '',
    wait: waitOf(signer),
    rightWait: waitOf(right),
    fee: formatTaka(fee, lang),
    officerLimit: formatTaka(HANDLER.officer.limit, lang),
    regionalLimit: formatTaka(HANDLER.regional.limit, lang),
    headLimit: formatTaka(HANDLER.head.limit, lang),
    chain: chain.map((h) => HANDLER[h].cls).join(' → '),
    first: chain[0] ? HANDLER[chain[0]].ref : '',
    handler: stepHandler ? HANDLER[stepHandler].cls : '',
  }

  let captionKey: string
  if (step) captionKey = step.caption
  else if (hint) captionKey = hint.key
  else if (levelDone) captionKey = `level${level}-done`
  else if (panel === 'q1') captionKey = 'build-q1'
  else if (panel === 'q2') captionKey = 'build-q2'
  else if (panel === 'ready') captionKey = 'build-ready'
  else if (level === 1) captionKey = turnIdx === 0 && results.length === 0 && pick === TUTORIAL_PICK ? 'tutorial' : pick ? 'picked1' : 'idle1'
  else captionKey = chain.length === 0 ? 'idle2' : chain.length < 2 ? 'wiring2' : 'picked2'
  const caption = fill(captions[captionKey] ?? '', values)

  /* ---------------- pieces ---------------- */

  const turnOf = fill(v.loanOf, { n: formatNumber(turnIdx + 1, lang), total: formatNumber(TURNS[level].length, lang) })
  const finished = stepIs('result', 'done')
  const at = step?.at ?? -1
  const signedAt = run && run.by ? chain.indexOf(run.by) : -1

  const chip = (text: string, key?: string) => (
    <span key={key ?? text} className="rounded-full border-2 border-edge/40 bg-card px-2 py-0.5 text-xs font-semibold text-ink">
      {text}
    </span>
  )
  const limitText = (h: H) => fill(v.upTo, { limit: formatTaka(HANDLER[h].limit, lang) })

  /** A status line inside an approver / handler card. */
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

  /* Level 1: what an approver card says. */
  const l1Status = (h: H) => {
    const reachedSign = player.index >= 2 && pick === h
    if (!reachedSign) return statusLine(v.waiting, 'idle')
    if (result === 'ok') return statusLine(fill(v.signedOk, { wait: waitOf(h) }), 'ok', '✓')
    if (result === 'over') return statusLine(v.signedOver, 'bad', '❌')
    return statusLine(fill(v.signedSlow, { wait: waitOf(h) }), 'bad', '🐢')
  }

  /* Levels 2–3: what a handler card in the chain says. */
  const chainStatus = (h: H, i: number) => {
    const visit = run?.visits[i]
    const reached = visit !== undefined && busy && (at >= i || finished)
    if (!reached) return statusLine(busy ? v.notReached : v.waiting, 'idle')
    if (visit.can) {
      const signedNow = stepIs('approve', 'done')
      if (!signedNow) return statusLine(v.canYes, 'info', '✓')
      return result === 'ok' ? statusLine(fill(v.signedOk, { wait: waitOf(h) }), 'ok', '✍️') : statusLine(fill(v.signedSlow, { wait: waitOf(h) }), 'bad', '🐢')
    }
    if (i === chain.length - 1) return statusLine(v.endOfChain, 'bad', '⛔')
    return statusLine(v.canNo, 'info', '↓')
  }

  const linkTile = (h: H, i: number, list: H[]) => {
    const pos = chain.indexOf(h)
    return (
      <ChoiceButton
        key={h}
        role="checkbox"
        selected={pos >= 0}
        color={HANDLER[h].color}
        icon={pos >= 0 ? `${HANDLER[h].icon} ${formatNumber(pos + 1, lang)}` : HANDLER[h].icon}
        text={HANDLER[h].cls}
        onClick={() => tapLink(h)}
        animate={shake.anim(`t-${h}`)}
        className={list.length % 2 === 1 && i === list.length - 1 ? 'col-span-2' : ''}
        mono
      />
    )
  }

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
            {willSucceed ? '✅' : result === 'over' ? '🚨' : result === 'nobody' ? '⛔' : '😵'}
          </motion.span>
          {willSucceed ? fill(v.resultOk, { amount: formatTaka(turn.amount, lang) }) : v.resultBad}
        </motion.div>
      )}
    </AnimatePresence>
  )

  const loanPacket = (
    <Packet color={level === 1 ? FAIL_COLOR : accent}>
      📁 {formatTaka(turn.amount, lang)}
    </Packet>
  )
  const backPacket = <Packet color={willSucceed ? OK_COLOR : FAIL_COLOR}>{willSucceed ? '✅' : '😵'} {label(turn.name)}</Packet>

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
                    {'+ else if (amount <= 2_000_000) ×3 ???'}
                  </code>
                </>
              )}
              {level === 2 && <p className="prose-text text-sm text-ink">{v.l2Summary}</p>}
              {level === 3 && (
                <Recap
                  title={v.recapTitle}
                  items={[
                    { icon: '🧾', text: v.recap1 },
                    { icon: '⛓️', text: v.recap2 },
                    { icon: '🏢', text: v.recap3 },
                  ]}
                />
              )}
            </LevelCompleteCard>
          ) : (
            <motion.div key={`play-${level}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* ── Client: the customer + the learner's choice ─────────── */}
              <Node role={v.clientRole} title={`🏦 ${v.deskTitle}`} active={stepIs('start', 'result', 'done')} accent={accent}>
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
                        {chip(`📁 ${label(turn.purpose)}`, 'purpose')}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {panel ? (
                  /* ── Level 3 builder ─────────────────────────── */
                  <div className="flex flex-col gap-3 rounded-lg border-2 border-dashed p-3" style={{ borderColor: HANDLER.regional.color }}>
                    <p className="font-display font-bold text-ink">🔨 {v.builderTitle}</p>
                    <div>
                      <p className="label-caps text-ink-soft">{v.builderStep1}</p>
                      <p className="mb-2 text-sm text-ink">{fill(v.q1, { limit: formatTaka(HANDLER.regional.limit, lang) })}</p>
                      <div role="radiogroup" aria-label={v.builderStep1} className="grid grid-cols-1 gap-2">
                        {(
                          [
                            ['first', v.q1First],
                            ['between', v.q1Between],
                            ['last', v.q1Last],
                          ] as const
                        ).map(([id, text]) => (
                          <ChoiceButton
                            key={id}
                            selected={panel !== 'q1' && id === 'between'}
                            color={HANDLER.regional.color}
                            text={text}
                            onClick={() => answerQ1(id)}
                            animate={shake.anim(`q1-${id}`)}
                            className={panel !== 'q1' && id !== 'between' ? 'opacity-40' : ''}
                          />
                        ))}
                      </div>
                      {panel !== 'q1' && <NewCodeChip>+ .setNext(new RegionalManager())</NewCodeChip>}
                    </div>

                    {panel !== 'q1' && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <p className="label-caps text-ink-soft">{v.builderStep2}</p>
                        <p className="mb-2 text-sm text-ink">{v.q2}</p>
                        <div role="radiogroup" aria-label={v.builderStep2} className="grid grid-cols-1 gap-2">
                          {(
                            [
                              ['desk', v.q2Desk],
                              ['edit', v.q2Edit],
                              ['nothing', v.q2Nothing],
                            ] as const
                          ).map(([id, text]) => (
                            <ChoiceButton
                              key={id}
                              selected={panel === 'ready' && id === 'nothing'}
                              color={HANDLER.regional.color}
                              text={text}
                              onClick={() => answerQ2(id)}
                              animate={shake.anim(`q2-${id}`)}
                              className={panel === 'ready' && id !== 'nothing' ? 'opacity-40' : ''}
                            />
                          ))}
                        </div>
                        {panel === 'ready' && <NewCodeChip>officer.handle(loan)</NewCodeChip>}
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
                        <Button variant="primary" onClick={linkRegional} data-game="open-branch">
                          🔗 {v.linkRegional}
                        </Button>
                      </motion.div>
                    )}
                  </div>
                ) : level === 1 ? (
                  <>
                    <p id="cor-pick-label" className="mb-1.5 label-caps text-ink-soft">
                      {v.pickLabel}
                    </p>
                    <div role="radiogroup" aria-labelledby="cor-pick-label" className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-3">
                      {L1_APPROVERS.map((h) => (
                        <ChoiceButton
                          key={h}
                          selected={pick === h}
                          color={HANDLER[h].color}
                          icon={HANDLER[h].icon}
                          text={HANDLER[h].cls}
                          onClick={() => choose(h)}
                          animate={shake.anim(`p-${h}`)}
                          mono
                        />
                      ))}
                    </div>
                    <p className="mt-2 border-t-2 border-dashed border-edge/40 pt-2 text-xs font-semibold text-chili">⚠️ {v.knowsL1}</p>
                  </>
                ) : (
                  <>
                    <p id="cor-chain-label" className="mb-1.5 label-caps text-ink-soft">
                      {v.chainLabel}
                    </p>
                    <div role="group" aria-labelledby="cor-chain-label" className="grid grid-cols-2 gap-2">
                      {(level === 3 ? TILES_L3 : TILES_L2).map((h, i, list) => linkTile(h, i, list))}
                    </div>
                    <p className="mt-1.5 text-xs text-ink-soft">{v.chainHint}</p>
                    <p className="mt-2 border-t-2 border-dashed border-edge/40 pt-2 text-xs font-semibold text-ink">✓ {v.knowsL2}</p>
                    {level === 3 && <p className="mt-1 text-xs font-semibold text-bottle dark:text-jade">{v.othersSame}</p>}
                  </>
                )}
              </Node>

              {level === 1 ? (
                <>
                  <Connector
                    label="desk.submit(loan, to)"
                    down={stepIs('start')}
                    up={finished}
                    downPacket={loanPacket}
                    upPacket={backPacket}
                    runKey={player.index}
                  />

                  {/* ── Middle: the desk's own if/else ladder ── */}
                  <Node role={v.noPatternRole} title="LoanDesk.submit()" active={stepIs('start', 'route')} accent={FAIL_COLOR} mono>
                    <p className="-mt-1 mb-2 label-caps text-ink-soft">{v.ladderLabel}</p>
                    <ol className="flex flex-col gap-1.5">
                      {L1_APPROVERS.map((h) => {
                        const lit = stepIs('route') && pick === h
                        const chosen = pick === h
                        return (
                          <motion.li
                            key={h}
                            layout
                            animate={{ x: lit ? 4 : 0 }}
                            className={`flex min-w-0 items-center gap-2 rounded-md border-2 px-2 py-1 text-xs ${
                              lit ? 'border-edge bg-card shadow-hard-sm' : chosen ? 'border-dashed border-edge/50' : 'border-transparent'
                            }`}
                          >
                            <StatusDot status={lit ? 'active' : chosen && player.index > 1 ? 'done' : 'pending'} color={HANDLER[h].color} />
                            <code lang="en" className="min-w-0 flex-1 truncate font-mono font-bold text-ink">
                              {HANDLER[h].cls}
                            </code>
                            <span className="shrink-0 text-[11px] text-ink-soft tabular-nums">
                              {h === 'head' ? v.anyAmount : `≤ ${formatTaka(HANDLER[h].limit, lang)}`}
                            </span>
                          </motion.li>
                        )
                      })}
                    </ol>
                    <p className="mt-2 text-[10px] font-bold uppercase">
                      <span className="rounded border-2 border-chili/60 px-1.5 py-px text-chili">🔗 {v.knowsAllTag}</span>
                    </p>
                  </Node>

                  <Connector
                    label={`${pick === 'head' ? 'headOffice' : pick ? HANDLER[pick].ref : '…'}.approve()`}
                    down={stepIs('route')}
                    up={finished}
                    downPacket={loanPacket}
                    upPacket={backPacket}
                    runKey={player.index}
                  />

                  {/* ── Bottom: the approvers, who sign whatever they get ── */}
                  <Node role={v.approversRole} title={`🏦 ${v.approversTitle}`} active={stepIs('sign', 'judge')} accent={pick ? HANDLER[pick].color : accent}>
                    <div className="flex flex-col gap-2">
                      {L1_APPROVERS.map((h) => (
                        <Node
                          key={h}
                          role={v.approverRole}
                          title={`${HANDLER[h].icon} ${HANDLER[h].cls}`}
                          active={pick === h && stepIs('sign', 'judge')}
                          accent={pick === h && result !== 'ok' && player.index >= 3 ? FAIL_COLOR : HANDLER[h].color}
                          mono
                          className="!p-2"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                            <span className="text-[11px] text-ink-soft tabular-nums">{limitText(h)}</span>
                            {l1Status(h)}
                          </div>
                        </Node>
                      ))}
                    </div>
                    {resultBanner}
                  </Node>
                </>
              ) : (
                <>
                  <Connector
                    label={`${chain[0] ? HANDLER[chain[0]].ref : 'officer'}.handle(loan)`}
                    down={stepIs('start')}
                    up={finished}
                    downPacket={loanPacket}
                    upPacket={backPacket}
                    runKey={player.index}
                  />

                  {/* ── The chain: handler → next → next … ── */}
                  {chain.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-edge/50 bg-card/60 p-4 text-center text-sm text-ink-soft">⛓️ {v.emptyChain}</div>
                  ) : (
                    chain.map((h, i) => (
                      <Fragment key={h}>
                        {i > 0 && (
                          <Connector
                            label="next.handle(loan)"
                            down={stepIs('wire') || (stepIs('pass') && at === i - 1)}
                            up={finished && signedAt >= i}
                            downPacket={stepIs('wire') ? <Packet color={accent}>🔗 setNext</Packet> : loanPacket}
                            upPacket={backPacket}
                            runKey={player.index}
                          />
                        )}
                        <Node
                          role={v.handlerRole}
                          title={`${HANDLER[h].icon} ${HANDLER[h].cls}`}
                          active={at === i || (stepIs('done') && signedAt === i)}
                          accent={at === i && result !== 'ok' && stepIs('approve', 'reject') ? FAIL_COLOR : HANDLER[h].color}
                          mono
                          className="!p-2"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                            <span className="text-[11px] text-ink-soft tabular-nums">
                              {limitText(h)}
                              {h === 'regional' && built && (
                                <span className="ml-1.5 rounded bg-bottle px-1 text-[9px] font-bold text-cream uppercase">{v.newTag}</span>
                              )}
                            </span>
                            {chainStatus(h, i)}
                          </div>
                        </Node>
                      </Fragment>
                    ))
                  )}

                  {level === 3 && !built && (
                    <div className="mt-3 flex min-w-0 items-center gap-2 rounded-xl border-2 border-dashed border-edge/50 p-2 text-xs text-ink-soft opacity-70">
                      <span aria-hidden="true">🔨</span>
                      <code lang="en" className="min-w-0 truncate font-mono font-bold text-ink">
                        {HANDLER.regional.cls}
                      </code>
                      <span className="ml-auto shrink-0">{v.notBuilt}</span>
                    </div>
                  )}

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
            {outcome === 'fail' ? `↻ ${v.tryAgain}` : isLastTurn ? `🏁 ${v.finishLevel}` : `${v.nextLoan} →`}
          </Button>
        </motion.div>
      )}

      {!levelDone && (
        <StepControls player={controls} playLabel={`📁 ${v.submitButton}`} disabled={!ready || outcome !== null || panel !== null} />
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
