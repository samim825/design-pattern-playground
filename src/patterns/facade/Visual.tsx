import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { ChoiceButton, GameHud, LevelCompleteCard, MissionBanner, NewCodeChip, Recap } from '@/components/game'
import { type Level, starsFor, useGameProgress, useShake } from '@/components/game/state'
import { Button } from '@/components/ui/Button'
import { StepControls } from '@/components/ui/StepControls'
import { Caption, Connector, Node, Packet, Stage, StatusDot } from '@/components/visual'
import { type PlayerStep, useStepPlayer } from '@/hooks/useStepPlayer'
import { formatNumber, formatTaka } from '@/lib/format'
import { fill } from '@/lib/template'
import type { CodeView, VisualProps } from '@/types/pattern'
import type { FacadeContent } from './content.en'

/*
 * "Sagar Travels": a 3-level game.
 *   Level 1  no pattern: the counter screen (client) calls bus, hotel, guide and SMS itself; the learner
 *            taps the calls in order; a wrong order or a forgotten call breaks the trip (`without`)
 *   Level 2  Facade: the learner picks a package and makes one bookTrip() call; the facade calls every
 *            subsystem in the right order (`main`)
 *   Level 3  the learner adds InsuranceService inside the facade; client code untouched (`with`)
 * Every turn is a step timeline, so the code panel lights up in sync.
 */

type Labels = FacadeContent['visual']
type LabelKey = keyof Labels
type Svc = 'bus' | 'hotel' | 'guide' | 'sms' | 'insure'
type Pkg = 'budget' | 'classic' | 'family'
type CallStatus = 'ok' | 'bad' | 'extra' | 'early'

/* ------------------------------------------------------------------ */
/* Scenario data                                                       */
/* ------------------------------------------------------------------ */

const FACADE_COLOR = '#0b6b4f'
const FAIL_COLOR = '#B91C1C'
const SEAT = 1500
const NIGHT = 3000
const GUIDE_FEE = 2000
const PREMIUM = 100

const SVC: Record<Svc, { icon: string; cls: string; call: string; color: string }> = {
  bus: { icon: '🚌', cls: 'BusService', call: 'bus.reserve()', color: '#C2410C' },
  hotel: { icon: '🏨', cls: 'HotelService', call: 'hotel.book()', color: '#0F766E' },
  guide: { icon: '🧭', cls: 'GuideService', call: 'guide.assign()', color: '#7C3AED' },
  sms: { icon: '💬', cls: 'SmsService', call: 'sms.sendTicket()', color: '#1D4ED8' },
  insure: { icon: '🛡️', cls: 'InsuranceService', call: 'insurance.cover()', color: '#BE185D' },
}

const PKGS: Pkg[] = ['budget', 'classic', 'family']
const PKG: Record<Pkg, { nights: number; guide: boolean; icon: string; label: LabelKey }> = {
  budget: { nights: 2, guide: false, icon: '🎒', label: 'pkgBudget' },
  classic: { nights: 2, guide: true, icon: '🏖️', label: 'pkgClassic' },
  family: { nights: 3, guide: true, icon: '👨‍👩‍👧‍👦', label: 'pkgFamily' },
}

interface Turn {
  name: LabelKey
  emoji: string
  people: number
  /** The package the customer wants (nights + guide). */
  pkg: Pkg
  /** Level 1: the order the call tiles are shown in. */
  tiles?: Svc[]
}

const TURNS: Record<Level, Turn[]> = {
  1: [
    { name: 'rahim', emoji: '👨‍👩‍👧‍👦', people: 4, pkg: 'family', tiles: ['bus', 'hotel', 'guide', 'sms'] },
    { name: 'karim', emoji: '🧔', people: 2, pkg: 'classic', tiles: ['sms', 'guide', 'bus', 'hotel'] },
    { name: 'mitu', emoji: '👧', people: 3, pkg: 'budget', tiles: ['guide', 'sms', 'hotel', 'bus'] },
  ],
  2: [
    { name: 'karim', emoji: '🧔', people: 2, pkg: 'budget' },
    { name: 'nusrat', emoji: '👩', people: 4, pkg: 'family' },
    { name: 'mitu', emoji: '👧', people: 3, pkg: 'classic' },
  ],
  3: [
    { name: 'tania', emoji: '👩‍🎓', people: 2, pkg: 'classic' },
    { name: 'rahim', emoji: '👨‍👩‍👧‍👦', people: 5, pkg: 'family' },
    { name: 'karim', emoji: '🧔', people: 2, pkg: 'budget' },
  ],
}
/** Level 1, trip 1 is a guided tutorial: the right order is pre-selected. */
const TUTORIAL_SEQ: Svc[] = ['bus', 'hotel', 'guide', 'sms']

const priceOf = (people: number, pkg: Pkg, insured: boolean) =>
  people * SEAT + PKG[pkg].nights * NIGHT + (PKG[pkg].guide ? GUIDE_FEE : 0) + (insured ? people * PREMIUM : 0)

/** Level 1: run the learner's call order and find what breaks. */
type Reason = 'hotel' | 'guide' | 'extra' | 'sms' | 'nobus' | 'nohotel' | 'noguide' | 'nosms'
function simulate(seq: Svc[], wantGuide: boolean): { calls: { svc: Svc; status: CallStatus }[]; reason: Reason | null } {
  const done = new Set<Svc>()
  const calls = seq.map((svc) => {
    let status: CallStatus = 'ok'
    if (svc === 'hotel' && !done.has('bus')) status = 'bad'
    else if (svc === 'guide' && !wantGuide) status = 'extra'
    else if (svc === 'guide' && !done.has('hotel')) status = 'bad'
    else if (svc === 'sms' && !(done.has('bus') && done.has('hotel') && (!wantGuide || done.has('guide')))) status = 'early'
    done.add(svc)
    return { svc, status }
  })
  const first = calls.find((c) => c.status !== 'ok')
  let reason: Reason | null = null
  if (first) reason = first.svc === 'hotel' ? 'hotel' : first.svc === 'guide' ? (first.status === 'extra' ? 'extra' : 'guide') : 'sms'
  else if (!done.has('bus')) reason = 'nobus'
  else if (!done.has('hotel')) reason = 'nohotel'
  else if (wantGuide && !done.has('guide')) reason = 'noguide'
  else if (!done.has('sms')) reason = 'nosms'
  return { calls, reason }
}

const LEVEL_ICON: Record<Level, string> = { 1: '🧾', 2: '🏛️', 3: '🛡️' }

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

type Kind = 'start' | 'sub' | 'result' | 'done'

interface GameStep extends PlayerStep {
  kind: Kind
  caption: string
  svc?: Svc
  status?: CallStatus
}

/** Step ids double as code-step ids: they match the `// @step:` markers in code/*.ts. */
function buildSteps(level: Level, seq: Svc[], wantGuide: boolean, pkg: Pkg | null, ready: boolean): GameStep[] {
  if (level === 1) {
    if (seq.length < 3) return []
    const { calls } = simulate(seq, wantGuide)
    return [
      { id: 'l1-start', kind: 'start', caption: 'l1-start' },
      ...calls.map<GameStep>(({ svc, status }) => ({
        id: `l1-${svc}`,
        kind: 'sub',
        svc,
        status,
        caption: status === 'ok' ? `l1-${svc}` : `l1-${svc}-${status}`,
        duration: status === 'ok' ? 1500 : 1900,
      })),
      { id: 'l1-result', kind: 'result', caption: 'result', duration: 1200 },
    ]
  }
  if (!ready || !pkg) return []
  const l3 = level === 3
  const sub = (svc: Svc, caption: string = svc): GameStep => ({
    id: svc,
    codeStep: l3 && svc !== 'insure' && svc !== 'sms' ? 'sub-old' : l3 && svc === 'sms' ? 'sms-new' : svc,
    kind: 'sub',
    svc,
    status: 'ok',
    caption,
    duration: 1500,
  })
  return [
    { id: 'call', codeStep: l3 ? 'call-new' : 'call', kind: 'start', caption: l3 ? 'call-new' : 'call', duration: 1500 },
    sub('bus'),
    ...(l3 ? [sub('insure')] : []),
    sub('hotel'),
    ...(PKG[pkg].guide ? [sub('guide')] : []),
    sub('sms', l3 ? 'sms-new' : 'sms'),
    { id: 'done', codeStep: l3 ? 'done-new' : 'done', kind: 'done', caption: l3 ? 'done-new' : 'done', duration: 1300 },
  ]
}

/* ------------------------------------------------------------------ */
/* Visual                                                              */
/* ------------------------------------------------------------------ */

export default function FacadeVisual({ content, lang, onCodeStep, onCodeView }: VisualProps<FacadeContent>) {
  const v = content.visual
  const captions: Record<string, string> = content.steps
  const label = (key: LabelKey) => v[key]

  const { progress, addCoins, completeLevel, reset: resetProgress } = useGameProgress('dpp-facade-game')
  const shake = useShake()
  const [level, setLevel] = useState<Level>(1)
  const [turnIdx, setTurnIdx] = useState(0)
  const [results, setResults] = useState<('ok' | 'fail')[]>([])
  const [mistakes, setMistakes] = useState(0)
  const [seq, setSeq] = useState<Svc[]>(TUTORIAL_SEQ) // level 1, trip 1 is a guided tutorial
  const [pkg, setPkg] = useState<Pkg | null>(null)
  const [built, setBuilt] = useState(false)
  const [panel, setPanel] = useState<'q1' | 'q2' | 'ready' | null>(null)
  const [hint, setHint] = useState<{ key: string; values?: Record<string, string> } | null>(null)
  const [levelDone, setLevelDone] = useState(false)
  const [lastStars, setLastStars] = useState(0)

  const turn = TURNS[level][turnIdx]
  const want = PKG[turn.pkg]
  const ready = level === 1 ? seq.length >= 3 : pkg !== null && (level < 3 || built)
  const steps = useMemo(() => buildSteps(level, seq, want.guide, pkg, ready), [level, seq, want.guide, pkg, ready])
  const player = useStepPlayer(steps)
  const step = player.step
  const kind = step?.kind ?? null
  const busy = player.index >= 0
  const stepIs = (...kinds: Kind[]) => kind !== null && kinds.includes(kind)

  const sim = level === 1 ? simulate(seq, want.guide) : null
  const willSucceed = sim ? sim.reason === null : true
  const outcome: 'ok' | 'fail' | null = player.done ? (willSucceed ? 'ok' : 'fail') : null
  const insured = level === 3 && built
  const wantPrice = priceOf(turn.people, turn.pkg, insured)
  const pendingCoins = outcome === 'ok' ? wantPrice : 0
  const accent = level === 3 ? SVC.insure.color : FACADE_COLOR

  /* ---------------- code panel sync ---------------- */

  const view: CodeView = level === 1 ? 'without' : level === 2 ? 'main' : 'with'
  useEffect(() => {
    onCodeView?.(view)
  }, [view, onCodeView])
  useEffect(() => () => onCodeView?.('main'), [onCodeView])

  const lastCall = seq[seq.length - 1]
  let idleCode: string | null = null
  if (level === 1) idleCode = levelDone ? 'l1-copy' : lastCall ? `l1-${lastCall}` : 'l1-start'
  else if (levelDone) idleCode = null
  else if (level === 2) idleCode = 'pick'
  else idleCode = panel === 'q1' ? 'build-class' : panel ? 'build-call' : 'client-same'
  const codeStep = step ? (step.codeStep ?? step.id) : idleCode
  useEffect(() => {
    onCodeStep(codeStep)
  }, [codeStep, onCodeStep])

  /* ---------------- actions ---------------- */

  const resetTurn = () => {
    player.reset()
    setSeq([])
    setPkg(null)
    setHint(null)
  }

  const startLevel = (n: Level) => {
    resetTurn()
    setLevel(n)
    setTurnIdx(0)
    setResults([])
    setMistakes(0)
    if (n === 1) setSeq(TUTORIAL_SEQ)
    setBuilt(false)
    setPanel(n === 3 ? 'q1' : null)
    setLevelDone(false)
  }

  const restartGame = () => {
    resetProgress()
    startLevel(1)
  }

  const tapCall = (svc: Svc) => {
    if (busy) return
    player.reset()
    setHint(null)
    setSeq(seq.includes(svc) ? seq.filter((s) => s !== svc) : [...seq, svc])
  }

  const pkgDetail = (p: Pkg) =>
    fill(v.pkgDetail, {
      nights: fill(v.nightsCount, { n: formatNumber(PKG[p].nights, lang) }),
      guide: PKG[p].guide ? v.withGuide : v.noGuide,
    })

  const pickPackage = (p: Pkg) => {
    if (busy || panel) return
    if (p !== turn.pkg) {
      shake.bump(`p-${p}`)
      setMistakes((m) => m + 1)
      setHint({ key: 'wrong-package', values: { pkg: label(PKG[p].label), pkgWant: pkgDetail(p) } })
      return
    }
    player.reset()
    setHint(null)
    setPkg(p)
  }

  const answerQ1 = (id: 'facade' | 'clients' | 'bus') => {
    if (panel !== 'q1') return
    if (id === 'facade') {
      setHint(null)
      setPanel('q2')
      return
    }
    shake.bump(`q1-${id}`)
    setMistakes((m) => m + 1)
    setHint({ key: id === 'clients' ? 'wrong-q1-clients' : 'wrong-q1-bus' })
  }

  const answerQ2 = (id: 'nothing' | 'call' | 'param') => {
    if (panel !== 'q2') return
    if (id === 'nothing') {
      setHint(null)
      setPanel('ready')
      return
    }
    shake.bump(`q2-${id}`)
    setMistakes((m) => m + 1)
    setHint({ key: id === 'call' ? 'wrong-q2-call' : 'wrong-q2-param' })
  }

  const plugInsurance = () => {
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
    resetTurn()
    if (!wasOk) {
      setMistakes((m) => m + 1)
      return // book the same trip again
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

  const nightsText = fill(v.nightsCount, { n: formatNumber(want.nights, lang) })
  const wantText = [fill(v.peopleCount, { n: formatNumber(turn.people, lang) }), nightsText, want.guide ? v.withGuide : v.noGuide].join(' · ')
  const values: Record<string, string> = {
    name: label(turn.name),
    people: formatNumber(turn.people, lang),
    want: wantText,
    amount: formatTaka(wantPrice, lang),
    order: seq.map((s) => SVC[s].call).join(' → '),
    arrive: v.arrive,
    depart: v.depart,
    nights: nightsText,
    fee: formatTaka(GUIDE_FEE, lang),
    pkg: pkg ? label(PKG[pkg].label) : '',
    call: `agency.bookTrip(${turn.pkg}, ${turn.people})`,
    premium: formatTaka(turn.people * PREMIUM, lang),
    premiumEach: formatTaka(PREMIUM, lang),
    ...(!step ? hint?.values : undefined),
  }

  let captionKey: string
  if (step) captionKey = step.caption === 'result' ? (sim?.reason ? `l1-fail-${sim.reason}` : 'l1-ok') : step.caption
  else if (hint) captionKey = hint.key
  else if (levelDone) captionKey = `level${level}-done`
  else if (panel === 'q1') captionKey = 'build-q1'
  else if (panel === 'q2') captionKey = 'build-q2'
  else if (panel === 'ready') captionKey = 'build-ready'
  else if (level === 1)
    captionKey = turnIdx === 0 && results.length === 0 && seq.join() === TUTORIAL_SEQ.join() ? 'tutorial' : seq.length === 0 ? 'idle1' : seq.length < 3 ? 'picked1-more' : 'picked1'
  else captionKey = pkg ? 'picked2' : 'idle2'
  const caption = fill(captions[captionKey] ?? '', values)

  /* ---------------- pieces ---------------- */

  const turnOf = fill(v.tripOf, { n: formatNumber(turnIdx + 1, lang), total: formatNumber(TURNS[level].length, lang) })
  // Which subsystems appear, and how far each has got in the current run.
  const services: Svc[] = level === 3 ? ['bus', 'insure', 'hotel', 'guide', 'sms'] : ['bus', 'hotel', 'guide', 'sms']
  // The subsystem cards: the new (wide) InsuranceService card goes last so the 2-column grid has no gaps.
  const grid: Svc[] = level === 3 ? ['bus', 'hotel', 'guide', 'sms', 'insure'] : services
  const stepOf = (svc: Svc) => steps.findIndex((s) => s.svc === svc)
  const reached = (svc: Svc) => {
    const i = stepOf(svc)
    return i >= 0 && player.index >= i
  }
  const statusOf = (svc: Svc): CallStatus | null => (reached(svc) ? (steps[stepOf(svc)].status ?? 'ok') : null)
  const activeSvc = stepIs('sub') ? (step?.svc ?? null) : null
  const dotFor = (svc: Svc) => (activeSvc === svc ? 'active' : reached(svc) ? 'done' : 'pending')

  const chip = (text: string, key?: string) => (
    <span key={key ?? text} className="rounded-full border-2 border-edge/40 bg-card px-2 py-0.5 text-xs font-semibold text-ink">
      {text}
    </span>
  )

  const resultLine = (svc: Svc): { text: string; bad: boolean } | null => {
    const s = statusOf(svc)
    if (!s) return null
    const n = formatNumber(turn.people, lang)
    if (svc === 'bus') return { text: fill(v.busOk, { n, arrive: v.arrive }), bad: false }
    if (svc === 'hotel') return s === 'ok' ? { text: fill(v.hotelOk, { nights: nightsText, arrive: v.arrive }), bad: false } : { text: fill(v.hotelBad, { depart: v.depart }), bad: true }
    if (svc === 'guide')
      return s === 'ok' ? { text: v.guideOk, bad: false } : s === 'extra' ? { text: fill(v.guideExtra, { fee: formatTaka(GUIDE_FEE, lang) }), bad: true } : { text: v.guideBad, bad: true }
    if (svc === 'sms') return s === 'ok' ? { text: v.smsOk, bad: false } : { text: v.smsEarly, bad: true }
    return { text: fill(v.insureOk, { n }), bad: false }
  }

  const finished = stepIs('result', 'done')

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
                    {'+ insurance.cover() ×3 ???'}
                  </code>
                </>
              )}
              {level === 2 && <p className="prose-text text-sm text-ink">{v.l2Summary}</p>}
              {level === 3 && (
                <Recap
                  title={v.recapTitle}
                  items={[
                    { icon: '🧾', text: v.recap1 },
                    { icon: '🏛️', text: v.recap2 },
                    { icon: '🛡️', text: v.recap3 },
                  ]}
                />
              )}
            </LevelCompleteCard>
          ) : (
            <motion.div key={`play-${level}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* ── Client: the customer + the learner's choice ─────────── */}
              <Node role={v.clientRole} title={`🧳 ${v.counterTitle}`} active={stepIs('start', 'result', 'done')} accent={accent}>
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
                        <span className="text-xs text-ink-soft">{v.wants}</span>
                        {chip(`👥 ${fill(v.peopleCount, { n: formatNumber(turn.people, lang) })}`, 'people')}
                        {chip(`🌙 ${nightsText}`, 'nights')}
                        {chip(`🧭 ${want.guide ? v.withGuide : v.noGuide}`, 'guide')}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {panel ? (
                  /* ── Level 3 builder ─────────────────────────── */
                  <div className="flex flex-col gap-3 rounded-lg border-2 border-dashed p-3" style={{ borderColor: SVC.insure.color }}>
                    <p className="font-display font-bold text-ink">🔨 {v.builderTitle}</p>
                    <div>
                      <p className="label-caps text-ink-soft">{v.builderStep1}</p>
                      <p className="mb-2 text-sm text-ink">{v.q1}</p>
                      <div role="radiogroup" aria-label={v.q1} className="grid grid-cols-1 gap-2">
                        {(
                          [
                            ['facade', v.q1Facade],
                            ['clients', v.q1Clients],
                            ['bus', v.q1Bus],
                          ] as const
                        ).map(([id, text]) => (
                          <ChoiceButton
                            key={id}
                            selected={panel !== 'q1' && id === 'facade'}
                            color={SVC.insure.color}
                            text={text}
                            onClick={() => answerQ1(id)}
                            animate={shake.anim(`q1-${id}`)}
                            className={panel !== 'q1' && id !== 'facade' ? 'opacity-40' : ''}
                          />
                        ))}
                      </div>
                      {panel !== 'q1' && <NewCodeChip>+ policy = insurance.cover(seat, people)</NewCodeChip>}
                    </div>

                    {panel !== 'q1' && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <p className="label-caps text-ink-soft">{v.builderStep2}</p>
                        <p className="mb-2 text-sm text-ink">{v.q2}</p>
                        <div role="radiogroup" aria-label={v.q2} className="grid grid-cols-1 gap-2">
                          {(
                            [
                              ['nothing', v.q2Nothing],
                              ['call', v.q2Call],
                              ['param', v.q2Param],
                            ] as const
                          ).map(([id, text]) => (
                            <ChoiceButton
                              key={id}
                              selected={panel === 'ready' && id === 'nothing'}
                              color={SVC.insure.color}
                              text={text}
                              onClick={() => answerQ2(id)}
                              animate={shake.anim(`q2-${id}`)}
                              className={panel === 'ready' && id !== 'nothing' ? 'opacity-40' : ''}
                            />
                          ))}
                        </div>
                        {panel === 'ready' && <NewCodeChip>agency.bookTrip(pkg, people, phone)</NewCodeChip>}
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
                        <Button variant="primary" onClick={plugInsurance} data-game="open-branch">
                          🛡️ {v.useInsurance}
                        </Button>
                      </motion.div>
                    )}
                  </div>
                ) : level === 1 ? (
                  <>
                    <p id="fc-calls-label" className="mb-1.5 label-caps text-ink-soft">
                      {v.callsLabel}
                    </p>
                    <div role="group" aria-labelledby="fc-calls-label" className="grid grid-cols-2 gap-2">
                      {(turn.tiles ?? []).map((svc) => {
                        const at = seq.indexOf(svc)
                        return (
                          <ChoiceButton
                            key={svc}
                            role="checkbox"
                            selected={at >= 0}
                            color={SVC[svc].color}
                            icon={at >= 0 ? `${SVC[svc].icon} ${formatNumber(at + 1, lang)}` : SVC[svc].icon}
                            text={SVC[svc].call}
                            onClick={() => tapCall(svc)}
                            animate={shake.anim(`c-${svc}`)}
                            mono
                          />
                        )
                      })}
                    </div>
                    <p className="mt-1.5 text-xs text-ink-soft">{v.callsHint}</p>
                    <p className="mt-2 border-t-2 border-dashed border-edge/40 pt-2 text-xs font-semibold text-chili">⚠️ {v.knowsL1}</p>
                  </>
                ) : (
                  <>
                    <p id="fc-pkg-label" className="mb-1.5 label-caps text-ink-soft">
                      {v.packageLabel}
                    </p>
                    <div role="radiogroup" aria-labelledby="fc-pkg-label" className="grid grid-cols-1 gap-2 min-[560px]:grid-cols-3">
                      {PKGS.map((p) => (
                        <ChoiceButton
                          key={p}
                          selected={pkg === p}
                          color={accent}
                          icon={`${PKG[p].icon} ${label(PKG[p].label)}`}
                          text={pkgDetail(p)}
                          onClick={() => pickPackage(p)}
                          animate={shake.anim(`p-${p}`)}
                        />
                      ))}
                    </div>
                    <p className="mt-2 border-t-2 border-dashed border-edge/40 pt-2 text-xs font-semibold text-ink">✓ {v.knowsL2}</p>
                    {level === 3 && <p className="mt-1 text-xs font-semibold text-bottle dark:text-jade">📱🌐☎️ {v.clientsSame}</p>}
                  </>
                )}
              </Node>

              <Connector
                label={level === 1 ? 'screen.book(trip)' : 'agency.bookTrip(pkg)'}
                down={stepIs('start')}
                up={finished}
                downPacket={<Packet color={accent}>🧳 {label(turn.name)}</Packet>}
                upPacket={
                  <Packet color={willSucceed ? FACADE_COLOR : FAIL_COLOR}>
                    {willSucceed ? '✅' : '😵'} {formatTaka(wantPrice, lang)}
                  </Packet>
                }
                runKey={player.index}
              />

              {/* ── Middle: the client's own call list (L1) or the facade (L2/3) ── */}
              {level === 1 ? (
                <Node role={v.noPatternRole} title="TripScreen.book()" active={stepIs('start', 'sub')} accent={FAIL_COLOR} mono>
                  <p className="-mt-1 mb-2 label-caps text-ink-soft">{v.yourOrder}</p>
                  {seq.length === 0 ? (
                    <p className="text-xs text-ink-soft">{v.emptyOrder}</p>
                  ) : (
                    <ol className="flex flex-col gap-1.5">
                      <AnimatePresence initial={false}>
                        {seq.map((svc, i) => {
                          const s = statusOf(svc)
                          const lit = activeSvc === svc
                          return (
                            <motion.li
                              key={svc}
                              layout
                              initial={{ opacity: 0, x: -12 }}
                              animate={{ opacity: 1, x: lit ? 4 : 0 }}
                              exit={{ opacity: 0 }}
                              className={`flex min-w-0 items-center gap-2 rounded-md border-2 px-2 py-1 text-xs ${
                                lit ? 'border-edge bg-card shadow-hard-sm' : 'border-transparent'
                              }`}
                            >
                              <StatusDot status={dotFor(svc)} color={SVC[svc].color} />
                              <span className="w-4 shrink-0 text-right font-bold text-ink-soft tabular-nums">{formatNumber(i + 1, lang)}</span>
                              <code lang="en" className="min-w-0 flex-1 truncate font-mono font-bold text-ink">
                                {SVC[svc].call}
                              </code>
                              {s && s !== 'ok' && (
                                <span aria-hidden="true" className="shrink-0">
                                  ❌
                                </span>
                              )}
                            </motion.li>
                          )
                        })}
                      </AnimatePresence>
                    </ol>
                  )}
                  <p className="mt-2 text-[10px] font-bold uppercase">
                    <span className="rounded border-2 border-chili/60 px-1.5 py-px text-chili">🔗 {v.knowsAllTag}</span>
                  </p>
                </Node>
              ) : (
                <Node role={v.facadeRole} title="TripFacade" active={stepIs('start', 'sub', 'done')} accent={accent} mono>
                  <p className="-mt-1 mb-2 truncate font-mono text-xs text-ink-soft" lang="en">
                    bookTrip(pkg, people, phone)
                  </p>
                  <p className="mb-1.5 label-caps text-ink-soft">{v.facadeOrder}</p>
                  <ol className="flex flex-col gap-1.5">
                    {services.map((svc) => {
                      const unbuilt = svc === 'insure' && !built
                      const skip = svc === 'guide' && pkg !== null && !PKG[pkg].guide
                      const lit = activeSvc === svc
                      return (
                        <motion.li
                          key={svc}
                          layout
                          animate={{ x: lit ? 4 : 0 }}
                          className={`flex min-w-0 items-center gap-2 rounded-md border-2 px-2 py-1 text-xs ${
                            lit ? 'border-edge bg-card shadow-hard-sm' : unbuilt ? 'border-dashed border-edge/40' : 'border-transparent'
                          } ${skip || unbuilt ? 'opacity-50' : ''}`}
                        >
                          {unbuilt ? (
                            <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center">
                              🔨
                            </span>
                          ) : (
                            <StatusDot status={dotFor(svc)} color={SVC[svc].color} />
                          )}
                          <code lang="en" className="min-w-0 flex-1 truncate font-mono font-bold text-ink">
                            {SVC[svc].call}
                          </code>
                          {svc === 'insure' && built && (
                            <span className="shrink-0 rounded bg-bottle px-1 text-[9px] font-bold text-cream uppercase">{v.newTag}</span>
                          )}
                          {skip && <span className="shrink-0 text-[10px] font-bold text-ink-soft uppercase">{v.skipped}</span>}
                          {unbuilt && <span className="shrink-0 text-[10px] text-ink-soft">{v.notBuilt}</span>}
                        </motion.li>
                      )
                    })}
                  </ol>
                </Node>
              )}

              <Connector
                label={activeSvc ? SVC[activeSvc].call : level === 1 ? (seq[0] ? SVC[seq[0]].call : '…') : 'bus.reserve()'}
                down={stepIs('sub')}
                downPacket={
                  activeSvc ? (
                    <Packet color={step?.status === 'ok' ? SVC[activeSvc].color : FAIL_COLOR}>
                      {SVC[activeSvc].icon} {step?.status === 'ok' ? '→' : '⚠️'}
                    </Packet>
                  ) : null
                }
                runKey={player.index}
              />

              {/* ── Bottom: the subsystems ── */}
              <Node role={v.subsystemsRole} title={`🏖️ ${v.subsystemsTitle}`} active={stepIs('sub')} accent={activeSvc ? SVC[activeSvc].color : accent}>
                <div className="grid grid-cols-2 gap-2">
                  {grid.map((svc) => {
                    const unbuilt = svc === 'insure' && !built
                    const line = resultLine(svc)
                    return (
                      <Node
                        key={svc}
                        role={v.subsystemRole}
                        title={SVC[svc].cls}
                        active={activeSvc === svc}
                        accent={step?.status && step.status !== 'ok' ? FAIL_COLOR : SVC[svc].color}
                        mono
                        className={`!p-2 ${svc === 'insure' ? 'col-span-2' : ''} ${unbuilt ? 'border-dashed opacity-60' : ''}`}
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.p
                            key={line ? `${svc}-${line.bad}` : `${svc}-idle`}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`text-[11px] leading-snug ${line ? (line.bad ? 'font-bold text-chili' : 'font-semibold text-bottle dark:text-jade') : 'text-ink-soft'}`}
                          >
                            <span aria-hidden="true">{unbuilt ? '🔨' : SVC[svc].icon}</span> {line ? `${line.bad ? '❌' : '✓'} ${line.text}` : unbuilt ? v.notBuilt : v.notCalled}
                          </motion.p>
                        </AnimatePresence>
                      </Node>
                    )
                  })}
                </div>

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
                        {willSucceed ? '✅' : '😵'}
                      </motion.span>
                      {willSucceed ? fill(v.tripOk, { amount: formatTaka(wantPrice, lang) }) : v.tripBad}
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
            {outcome === 'fail' ? `↻ ${v.tryAgain}` : isLastTurn ? `🏁 ${v.finishLevel}` : `${v.nextTrip} →`}
          </Button>
        </motion.div>
      )}

      {!levelDone && (
        <StepControls player={controls} playLabel={`🧳 ${v.bookButton}`} disabled={!ready || outcome !== null || panel !== null} />
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
