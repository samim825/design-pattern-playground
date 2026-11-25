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
import type { CodeView, Lang, VisualProps } from '@/types/pattern'
import type { IteratorContent } from './content.en'

/*
 * "Mirpur Tigers' batting order": a 3-level game.
 *   Level 1  no pattern: Squad hands out its raw list and Nusrat (the scorer) writes a loop by hand for every
 *            request. Off-by-one, an in-place sort and a list that becomes a Map all break things (`without`)
 *   Level 2  Iterator: Nusrat asks the squad for the right iterator; her while (it.hasNext()) loop never changes (`main`)
 *   Level 3  the learner builds LeftHandedIterator (2 questions), which wraps any old iterator (`with`)
 * Every turn is a step timeline whose steps carry a snapshot, so the code panel and every node stay in sync.
 */

type Labels = IteratorContent['visual']
type LabelKey = keyof Labels

/* ------------------------------------------------------------------ */
/* The squad (made-up names and figures)                               */
/* ------------------------------------------------------------------ */

type MemberId = 'rahim' | 'sumon' | 'tania' | 'jamal' | 'rafiq' | 'mitu' | 'babu'
type Role = 'batter' | 'keeper' | 'allrounder' | 'bowler'
interface Member {
  sr: number
  role: Role
  left: boolean
  jersey: number
}
const MEMBERS: Record<MemberId, Member> = {
  rahim: { sr: 128, role: 'batter', left: false, jersey: 7 },
  sumon: { sr: 142, role: 'keeper', left: true, jersey: 1 },
  tania: { sr: 155, role: 'allrounder', left: false, jersey: 10 },
  jamal: { sr: 96, role: 'batter', left: true, jersey: 23 },
  rafiq: { sr: 118, role: 'allrounder', left: true, jersey: 18 },
  mitu: { sr: 74, role: 'bowler', left: false, jersey: 9 },
  babu: { sr: 135, role: 'allrounder', left: true, jersey: 5 },
}
const ROLE: Record<Role, { icon: string; label: LabelKey }> = {
  batter: { icon: '🏏', label: 'roleBatter' },
  keeper: { icon: '🧤', label: 'roleKeeper' },
  allrounder: { icon: '⭐', label: 'roleAllrounder' },
  bowler: { icon: '🎯', label: 'roleBowler' },
}
const SQUAD: MemberId[] = ['rahim', 'sumon', 'tania', 'jamal', 'rafiq', 'mitu']
const SQUAD7: MemberId[] = [...SQUAD, 'babu']
const bySR = (ids: MemberId[]) => [...ids].sort((a, b) => MEMBERS[b].sr - MEMBERS[a].sr)
const isAr = (id: MemberId) => MEMBERS[id].role === 'allrounder'
const isLeft = (id: MemberId) => MEMBERS[id].left

type IterKind = 'order' | 'sr' | 'ar'
const ITER: Record<IterKind, { cls: string; factory: string; note: LabelKey }> = {
  order: { cls: 'BattingOrderIterator', factory: 'battingOrder', note: 'iterOrder' },
  sr: { cls: 'StrikeRateIterator', factory: 'byStrikeRate', note: 'iterSr' },
  ar: { cls: 'AllRounderIterator', factory: 'allRounders', note: 'iterAr' },
}

type L1Opt = 'zero' | 'one' | 'minus' | 'copy' | 'inPlace' | 'reverse' | 'values' | 'oldLoop' | 'filter'
type Opt = L1Opt | IterKind
const L1_OPT_LABEL: Record<L1Opt, LabelKey> = {
  zero: 'optZero',
  one: 'optOne',
  minus: 'optMinus',
  copy: 'optCopy',
  inPlace: 'optInPlace',
  reverse: 'optReverse',
  values: 'optValues',
  oldLoop: 'optOldLoop',
  filter: 'optFilter',
}
/** Level 1: Nusrat's hand-written loop for each choice (code stays in English). */
const LOOP_CODE: Record<L1Opt, [string, string]> = {
  zero: ['for (let i = 0; i < players.length; i++)', '  announce(players[i].name)'],
  one: ['for (let i = 1; i <= players.length; i++)', '  announce(players[i].name)'],
  minus: ['for (let i = 0; i < players.length - 1; i++)', '  announce(players[i].name)'],
  copy: ['const copy = [...players].sort(bySR)', 'for (const p of copy) announce(p.name)'],
  inPlace: ['players.sort(bySR)', 'for (const p of players) announce(p.name)'],
  reverse: ['for (let i = players.length - 1; i >= 0; i--)', '  announce(players[i].name)'],
  values: ['for (const p of players.values())', '  if (p.role === "all-rounder") announce(p.name)'],
  oldLoop: ['for (let i = 0; i < players.length; i++)', '  if (players[i].role === "all-rounder") …'],
  filter: ['players.filter((p) => p.role === "all-rounder")', '  .forEach((p) => announce(p.name))'],
}

interface Turn {
  /** Karim bhai's request. */
  req: LabelKey
  /** Level 2: the request's id in the failure captions. */
  key?: string
  squad: MemberId[]
  expected: MemberId[]
  choices?: Opt[]
  /** Level 3: the old iterator that LeftHandedIterator wraps. */
  inner?: 'order' | 'sr'
}

const TURNS: Record<Level, Turn[]> = {
  1: [
    { req: 'reqOrder', squad: SQUAD, expected: SQUAD, choices: ['zero', 'one', 'minus'] },
    { req: 'reqForm', squad: SQUAD, expected: bySR(SQUAD), choices: ['inPlace', 'copy', 'reverse'] },
    { req: 'reqSuperOver', squad: SQUAD, expected: SQUAD.filter(isAr), choices: ['oldLoop', 'filter', 'values'] },
  ],
  2: [
    { req: 'reqSuperOver', key: 'superOver', squad: SQUAD, expected: SQUAD.filter(isAr), choices: ['order', 'ar', 'sr'] },
    { req: 'reqFinal', key: 'final', squad: SQUAD, expected: SQUAD, choices: ['sr', 'ar', 'order'] },
    { req: 'reqForm', key: 'form', squad: SQUAD, expected: bySR(SQUAD), choices: ['order', 'sr', 'ar'] },
  ],
  3: [
    { req: 'reqLefty1', squad: SQUAD, inner: 'order', expected: SQUAD.filter(isLeft) },
    { req: 'reqLefty2', squad: SQUAD, inner: 'sr', expected: bySR(SQUAD).filter(isLeft) },
    { req: 'reqLefty3', squad: SQUAD7, inner: 'order', expected: SQUAD7.filter(isLeft) },
  ],
}
/** Level 1, turn 1 is a guided tutorial: the right choice is pre-selected. */
const TUTORIAL_PICK: Opt = 'zero'
const PRIZE = 500
const LEVEL_ICON: Record<Level, string> = { 1: '✍️', 2: '🔁', 3: '🫲' }

const FAIL_COLOR = '#B91C1C'
const ITER_COLOR = '#0E7490'
const NEW_COLOR = '#C2410C'
const CALL_COLOR = '#0b6b4f'
const SKIP_COLOR = '#6B7280'

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

type Kind = 'request' | 'create' | 'sort' | 'loopStart' | 'read' | 'skip' | 'hasNext' | 'keep' | 'next' | 'noMore' | 'crash' | 'map' | 'nextMatch' | 'end'
type NodeId = 'client' | 'loop' | 'iterator' | 'squad'
interface Conn {
  n: 1 | 2
  up: boolean
  text: string
  color: string
}
interface Snap {
  /** The squad's own stored order (the cards). */
  order: MemberId[]
  storage: 'array' | 'map'
  /** Where the loop / iterator points right now. */
  cursor: MemberId | null
  marks: Partial<Record<MemberId, 'skip' | 'yield'>>
  /** Names Nusrat has called out. */
  lineup: MemberId[]
  /** A sorted copy (level 1 copy, StrikeRateIterator's own list). */
  copy: MemberId[] | null
  /** Level 1: "i = 2". */
  idx: string | null
  /** Iterator cursor (levels 2-3; in level 3 the inner iterator's). */
  pos: number
  has: boolean | null
  /** Level 3: the left-hander LeftHandedIterator is holding. */
  found: MemberId | null
  crash: string | null
  scrambled: boolean
  created: boolean
}
interface GameStep extends PlayerStep {
  kind: Kind
  caption: string
  cv: Record<string, string>
  node: NodeId
  conns: Conn[]
  snap: Snap
}

function initSnap(level: Level, turnIdx: number): Snap {
  const turn = TURNS[level][turnIdx]
  return {
    order: turn.squad,
    storage: 'array',
    cursor: null,
    marks: {},
    lineup: [],
    copy: null,
    idx: null,
    pos: 0,
    has: null,
    found: null,
    crash: null,
    scrambled: false,
    created: false,
  }
}

const sameList = (a: MemberId[], b: MemberId[]) => a.length === b.length && a.every((x, i) => x === b[i])
const succeeded = (turn: Turn, s: Snap) => !s.crash && !s.scrambled && sameList(s.lineup, turn.expected)

const DURATION: Partial<Record<Kind, number>> = {
  request: 1600,
  create: 1500,
  sort: 1800,
  loopStart: 1500,
  read: 1100,
  skip: 1000,
  hasNext: 950,
  keep: 1200,
  next: 1150,
  noMore: 1400,
  crash: 2200,
  map: 1900,
  nextMatch: 2300,
  end: 1800,
}

/** Builds a turn's timeline. `add` applies a change to the snapshot, then records a step. */
function buildSteps(level: Level, turnIdx: number, pick: Opt | null, v: Labels, lang: Lang): GameStep[] {
  const turn = TURNS[level][turnIdx]
  if (level < 3 && !pick) return []
  const out: GameStep[] = []
  let s = initSnap(level, turnIdx)
  const num = (n: number) => formatNumber(n, lang)
  const name = (id: MemberId) => v[id]

  const add = (kind: Kind, node: NodeId, codeStep: string, opts: { caption?: string; cv?: Record<string, string>; conns?: Conn[]; change?: (x: Snap) => Snap } = {}) => {
    if (opts.change) s = opts.change(s)
    out.push({
      id: `${kind}-${out.length}`,
      codeStep,
      duration: DURATION[kind] ?? 1300,
      kind,
      caption: opts.caption ?? kind,
      cv: opts.cv ?? {},
      node,
      conns: opts.conns ?? [],
      snap: s,
    })
  }
  const call = (id: MemberId): Conn => ({ n: 1, up: true, text: `📣 ${name(id)}`, color: CALL_COLOR })
  const yieldTo = (x: Snap, id: MemberId): Snap => ({ ...x, cursor: id, marks: { ...x.marks, [id]: 'yield' }, lineup: [...x.lineup, id] })

  /* ---------------- level 1: hand-written loops over the raw list ---------------- */
  if (level === 1) {
    const o = pick as L1Opt
    const n = turn.squad.length
    add('request', 'client', 'l1-expose', { caption: 'l1-request' })
    const readAt = (i: number, list: MemberId[], code: string, caption: string) => {
      const id = list[i]
      add('read', 'loop', code, {
        caption,
        cv: { i: num(i), name: name(id), sr: num(MEMBERS[id].sr) },
        conns: [{ n: 2, up: true, text: `[${i}] ${name(id)}`, color: CALL_COLOR }, call(id)],
        change: (x) => ({ ...yieldTo(x, id), idx: list === turn.squad ? `i = ${i}` : x.idx }),
      })
    }

    if (o === 'zero' || o === 'one' || o === 'minus') {
      const start = o === 'one' ? 1 : 0
      const stop = o === 'one' ? n + 1 : o === 'minus' ? n - 1 : n
      add('loopStart', 'loop', 'l1-loop', {
        caption: `l1-start-${o}`,
        cv: { n: num(n), name: name(turn.squad[0]) },
        change: (x) => ({ ...x, idx: `i = ${start}`, cursor: o === 'one' ? turn.squad[0] : null, marks: o === 'one' ? { [turn.squad[0]]: 'skip' } : {} }),
      })
      let crashed = false
      for (let i = start; i < stop; i++) {
        if (i >= n) {
          crashed = true
          add('crash', 'loop', 'l1-read', {
            caption: 'l1-crash',
            cv: { i: num(i), last: num(n - 1) },
            conns: [{ n: 2, up: true, text: `[${i}] undefined`, color: FAIL_COLOR }],
            change: (x) => ({ ...x, idx: `i = ${i}`, cursor: null, crash: "TypeError: Cannot read properties of undefined (reading 'name')" }),
          })
          break
        }
        readAt(i, turn.squad, 'l1-read', 'l1-read')
      }
      if (!crashed)
        add('noMore', 'loop', 'l1-loop', {
          caption: o === 'minus' ? 'l1-loop-end-minus' : 'l1-loop-end',
          cv: { i: num(stop), n: num(n), name: name(turn.squad[n - 1]) },
          change: (x) => ({ ...x, idx: `i = ${stop}`, cursor: null }),
        })
    } else if (o === 'reverse') {
      add('loopStart', 'loop', 'l1-loop', { caption: 'l1-start-reverse', cv: { last: num(n - 1) }, change: (x) => ({ ...x, idx: `i = ${n - 1}` }) })
      for (let i = n - 1; i >= 0; i--) readAt(i, turn.squad, 'l1-read', 'l1-read')
      add('noMore', 'loop', 'l1-loop', { caption: 'l1-loop-end-reverse', change: (x) => ({ ...x, idx: 'i = -1', cursor: null }) })
    } else if (o === 'copy' || o === 'inPlace') {
      const sorted = bySR(turn.squad)
      if (o === 'copy') add('sort', 'loop', 'l1-sort', { caption: 'l1-sort-copy', change: (x) => ({ ...x, copy: sorted }) })
      else add('sort', 'squad', 'l1-sort', { caption: 'l1-sort-inplace', change: (x) => ({ ...x, order: sorted }) })
      sorted.forEach((_, i) => readAt(i, sorted, 'l1-read-sorted', 'l1-read-sorted'))
      if (o === 'inPlace')
        add('nextMatch', 'squad', 'l1-expose', {
          caption: 'l1-next-match',
          cv: { name: name(sorted[0]), opener: name(turn.squad[0]) },
          change: (x) => ({ ...x, scrambled: true, cursor: sorted[0] }),
        })
    } else {
      add('map', 'squad', 'l1-map', { caption: 'l1-map', change: (x) => ({ ...x, storage: 'map' }) })
      if (o === 'values') {
        turn.squad.forEach((id) => {
          const tag = `${MEMBERS[id].jersey}: ${name(id)}`
          if (isAr(id))
            add('read', 'loop', 'l1-filter', {
              caption: 'l1-read-ar',
              cv: { name: name(id) },
              conns: [{ n: 2, up: true, text: tag, color: CALL_COLOR }, call(id)],
              change: (x) => yieldTo(x, id),
            })
          else
            add('skip', 'loop', 'l1-loop-map', {
              caption: 'l1-skip',
              cv: { name: name(id), role: v[ROLE[MEMBERS[id].role].label] },
              conns: [{ n: 2, up: true, text: tag, color: SKIP_COLOR }],
              change: (x) => ({ ...x, cursor: id, marks: { ...x.marks, [id]: 'skip' } }),
            })
        })
        add('noMore', 'loop', 'l1-loop-map', { caption: 'l1-map-end', change: (x) => ({ ...x, cursor: null }) })
      } else if (o === 'oldLoop') {
        add('noMore', 'loop', 'l1-loop-map', { caption: 'l1-oldloop', change: (x) => ({ ...x, idx: 'i = 0 · length = undefined' }) })
      } else {
        add('crash', 'loop', 'l1-loop-map', { caption: 'l1-filter-crash', change: (x) => ({ ...x, crash: 'TypeError: players.filter is not a function' }) })
      }
    }
    add('end', 'client', 'l1-expose', { caption: succeeded(turn, s) ? 'l1-ok' : `l1-fail-${o}`, cv: { coins: formatTaka(PRIZE, lang) } })
    return out
  }

  /* ---------------- level 2: ask the squad for an iterator ---------------- */
  if (level === 2) {
    const k = pick as IterKind
    const it = ITER[k]
    add('request', 'client', 'request', {
      caption: 'request',
      cv: { call: `squad.${it.factory}()` },
      conns: [{ n: 1, up: false, text: `${it.factory}()`, color: ITER_COLOR }],
    })
    add('create', 'squad', `create-${k}`, {
      caption: 'create',
      cv: { cls: it.cls },
      conns: [{ n: 2, up: true, text: `new ${it.cls.replace('Iterator', '…')}`, color: ITER_COLOR }],
      change: (x) => ({ ...x, created: true }),
    })
    const list = k === 'sr' ? bySR(s.order) : s.order
    if (k === 'sr') add('sort', 'iterator', 'sort-copy', { caption: 'sort-copy', change: (x) => ({ ...x, copy: list }) })
    add('loopStart', 'client', 'loop', { caption: 'loop-start' })
    const hasCode = k === 'ar' ? 'ar-has-next' : 'has-next'
    let asked = false
    list.forEach((id, p) => {
      if (k === 'ar' && !isAr(id)) {
        add('skip', 'iterator', 'skip', {
          caption: 'skip-ar',
          cv: { name: name(id), role: v[ROLE[MEMBERS[id].role].label] },
          conns: [
            ...(asked ? [] : [{ n: 1 as const, up: false, text: 'hasNext()?', color: ITER_COLOR }]),
            { n: 2, up: true, text: `${ROLE[MEMBERS[id].role].icon} ${name(id)}`, color: SKIP_COLOR },
          ],
          change: (x) => ({ ...x, cursor: id, pos: p + 1, has: null, marks: { ...x.marks, [id]: 'skip' } }),
        })
        asked = true
        return
      }
      add('hasNext', 'iterator', hasCode, {
        caption: 'has-next-yes',
        cv: { name: name(id) },
        conns: [asked ? { n: 1, up: true, text: 'true', color: CALL_COLOR } : { n: 1, up: false, text: 'hasNext()?', color: ITER_COLOR }],
        change: (x) => ({ ...x, cursor: id, pos: p, has: true }),
      })
      asked = false
      add('next', 'iterator', 'next', {
        caption: 'next',
        cv: { name: name(id), sr: num(MEMBERS[id].sr) },
        conns: [{ n: 2, up: true, text: `[${p}] ${name(id)}`, color: ITER_COLOR }, call(id)],
        change: (x) => ({ ...yieldTo(x, id), pos: p + 1 }),
      })
    })
    add('noMore', 'iterator', hasCode, {
      caption: 'has-next-no',
      conns: [{ n: 1, up: true, text: 'false', color: SKIP_COLOR }],
      change: (x) => ({ ...x, cursor: null, has: false }),
    })
    add('end', 'client', 'loop', { caption: succeeded(turn, s) ? 'l2-ok' : `l2-fail-${turn.key}-${k}`, cv: { coins: formatTaka(PRIZE, lang) } })
    return out
  }

  /* ---------------- level 3: LeftHandedIterator wraps an old iterator ---------------- */
  const inner = turn.inner!
  const list = inner === 'sr' ? bySR(s.order) : s.order
  add('create', 'client', 'lh-create', {
    caption: 'l3-create',
    cv: { factory: ITER[inner].factory },
    conns: [{ n: 1, up: false, text: 'new LeftHanded…', color: NEW_COLOR }],
    change: (x) => ({ ...x, created: true, copy: inner === 'sr' ? list : null }),
  })
  add('loopStart', 'client', 'loop', { caption: 'l3-loop' })
  list.forEach((id, p) => {
    if (!isLeft(id)) {
      add('skip', 'iterator', 'lh-skip', {
        caption: 'lh-skip',
        cv: { name: name(id) },
        conns: [{ n: 2, up: true, text: `${name(id)} · ${v.handRightShort}`, color: SKIP_COLOR }],
        change: (x) => ({ ...x, cursor: id, pos: p + 1, has: null, marks: { ...x.marks, [id]: 'skip' } }),
      })
      return
    }
    add('keep', 'iterator', 'lh-keep', {
      caption: 'lh-keep',
      cv: { name: name(id) },
      conns: [{ n: 2, up: true, text: `${name(id)} · ${v.handLeftShort}`, color: NEW_COLOR }],
      change: (x) => ({ ...x, cursor: id, pos: p + 1, found: id, has: true }),
    })
    add('next', 'iterator', 'lh-next', {
      caption: 'lh-next',
      cv: { name: name(id) },
      conns: [call(id)],
      change: (x) => ({ ...yieldTo(x, id), found: null }),
    })
  })
  add('noMore', 'iterator', 'lh-has-next', {
    caption: 'lh-no-more',
    conns: [{ n: 1, up: true, text: 'false', color: SKIP_COLOR }],
    change: (x) => ({ ...x, cursor: null, has: false }),
  })
  add('end', 'client', 'loop', { caption: `l3-done-${turnIdx + 1}`, cv: { coins: formatTaka(PRIZE, lang) } })
  return out
}

/* ------------------------------------------------------------------ */
/* Visual                                                              */
/* ------------------------------------------------------------------ */

export default function IteratorVisual({ content, lang, onCodeStep, onCodeView }: VisualProps<IteratorContent>) {
  const v = content.visual
  const captions: Record<string, string> = content.steps
  const label = (key: LabelKey) => v[key]
  const money = (n: number) => formatTaka(n, lang)
  const num = (n: number) => formatNumber(n, lang)

  const { progress, addCoins, completeLevel, reset: resetProgress } = useGameProgress('dpp-iterator-game')
  const shake = useShake()
  const [level, setLevel] = useState<Level>(1)
  const [turnIdx, setTurnIdx] = useState(0)
  const [results, setResults] = useState<('ok' | 'fail')[]>([])
  const [mistakes, setMistakes] = useState(0)
  const [pick, setPick] = useState<Opt | null>(TUTORIAL_PICK) // level 1, turn 1 is a guided tutorial
  const [panel, setPanel] = useState<'q1' | 'q2' | 'ready' | null>(null)
  const [built, setBuilt] = useState(false)
  const [hint, setHint] = useState<{ key: string } | null>(null)
  const [levelDone, setLevelDone] = useState(false)
  const [lastStars, setLastStars] = useState(0)

  const turn = TURNS[level][turnIdx]
  const ready = level === 3 ? built : pick !== null
  const steps = useMemo(() => (ready ? buildSteps(level, turnIdx, pick, v, lang) : []), [ready, level, turnIdx, pick, v, lang])
  const player = useStepPlayer(steps)
  const step = player.step
  const kind = step?.kind ?? null
  const busy = player.index >= 0
  const stepIs = (...kinds: Kind[]) => kind !== null && kinds.includes(kind)
  const snap = step?.snap ?? initSnap(level, turnIdx)

  const lastSnap = steps.length ? steps[steps.length - 1].snap : null
  const willSucceed = Boolean(lastSnap && succeeded(turn, lastSnap))
  const outcome: 'ok' | 'fail' | null = player.done ? (willSucceed ? 'ok' : 'fail') : null
  const pendingCoins = outcome === 'ok' ? PRIZE : 0
  const accent = level === 1 ? FAIL_COLOR : level === 3 ? NEW_COLOR : ITER_COLOR

  /* ---------------- code panel sync ---------------- */

  const view: CodeView = level === 1 ? 'without' : level === 2 ? 'main' : 'with'
  useEffect(() => {
    onCodeView?.(view)
  }, [view, onCodeView])
  useEffect(() => () => onCodeView?.('main'), [onCodeView])

  let idleCode: string | null
  if (levelDone) idleCode = null
  else if (level === 1) idleCode = turnIdx === 0 ? 'l1-loop' : turnIdx === 1 ? 'l1-sort' : 'l1-map'
  else if (level === 2) idleCode = pick ? `create-${pick}` : 'request'
  else idleCode = panel === 'q1' ? 'build-class' : panel === 'q2' ? 'build-wrap' : 'lh-create'
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
    setBuilt(false)
    setPanel(n === 3 ? 'q1' : null)
    setLevelDone(false)
  }

  const restartGame = () => {
    resetProgress()
    startLevel(1)
  }

  const choose = (o: Opt) => {
    if (busy) return
    player.reset()
    setHint(null)
    setPick(o)
  }

  const answerQ1 = (a: 'clientIf' | 'squadMethod' | 'implements') => {
    if (panel !== 'q1') return
    if (a === 'implements') {
      setHint(null)
      setPanel('q2')
      return
    }
    shake.bump(`q1-${a}`)
    setMistakes((m) => m + 1)
    setHint({ key: `wrong-q1-${a}` })
  }

  const answerQ2 = (a: 'readList' | 'sortList' | 'wrap') => {
    if (panel !== 'q2') return
    if (a === 'wrap') {
      setHint(null)
      setPanel('ready')
      return
    }
    shake.bump(`q2-${a}`)
    setMistakes((m) => m + 1)
    setHint({ key: `wrong-q2-${a}` })
  }

  const plugIterator = () => {
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
    if (!wasOk && pick) shake.bump(`o-${pick}`)
    resetTurn()
    if (!wasOk) {
      setMistakes((m) => m + 1)
      return // the same turn again
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

  const optText = (o: Opt) => (level === 1 ? label(L1_OPT_LABEL[o as L1Opt]) : `squad.${ITER[o as IterKind].factory}()`)
  const values: Record<string, string> = {
    req: label(turn.req),
    choice: pick ? optText(pick) : '',
    ...(step?.cv ?? {}),
  }

  let captionKey: string
  if (step) captionKey = step.caption
  else if (hint) captionKey = hint.key
  else if (levelDone) captionKey = `level${level}-done`
  else if (panel === 'q1') captionKey = 'build-q1'
  else if (panel === 'q2') captionKey = 'build-q2'
  else if (panel === 'ready') captionKey = 'build-ready'
  else if (level === 3) captionKey = `idle3-${turnIdx + 1}`
  else if (level === 1 && turnIdx === 0 && results.length === 0 && pick === TUTORIAL_PICK) captionKey = 'tutorial'
  else captionKey = pick ? `picked${level}` : `idle${level}-${turnIdx + 1}`
  const caption = fill(captions[captionKey] ?? '', values)

  /* ---------------- pieces ---------------- */

  const turnOf = fill(v.turnOf, { n: num(turnIdx + 1), total: num(TURNS[level].length) })
  const finished = stepIs('end')
  const active = (n: NodeId) => step?.node === n
  const iterKind: IterKind | null = level === 2 && pick ? (pick as IterKind) : null

  /* Karim bhai's request. */
  const request = (
    <div className={`mb-3 rounded-lg border-2 border-edge bg-bottle px-3 py-2 text-cream shadow-hard-sm transition-transform ${stepIs('request') ? 'scale-[1.02]' : ''}`}>
      <p className="label-caps text-cream/80">📣 {v.captainSays}</p>
      <p className="mt-0.5 text-sm leading-snug font-semibold">{label(turn.req)}</p>
    </div>
  )

  /* The names Nusrat has called out, checked against what Karim bhai asked for. */
  const missing = finished ? Math.max(0, turn.expected.length - snap.lineup.length) : 0
  const lineup = (
    <div>
      <p className="mb-1 label-caps text-ink-soft">🎙️ {v.calledOut}</p>
      <ol className="flex min-h-7 flex-wrap items-center gap-1">
        <AnimatePresence initial={false}>
          {snap.lineup.map((id, i) => {
            const ok = turn.expected[i] === id
            return (
              <motion.li
                key={`${i}-${id}`}
                initial={{ opacity: 0, y: 10, scale: 0.7 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`rounded-md border-2 px-1.5 py-px text-[11px] font-bold ${ok ? 'border-bottle text-bottle dark:border-jade dark:text-jade' : 'border-chili bg-chili text-cream'}`}
              >
                {num(i + 1)}. {v[id]}
              </motion.li>
            )
          })}
        </AnimatePresence>
        {Array.from({ length: missing }, (_, i) => (
          <li key={`miss-${i}`} className="rounded-md border-2 border-dashed border-chili px-1.5 py-px text-[11px] font-bold text-chili">
            {num(snap.lineup.length + i + 1)}. ?
          </li>
        ))}
        {snap.lineup.length === 0 && missing === 0 && <li className="text-xs text-ink-soft">{v.nobodyYet}</li>}
      </ol>
    </div>
  )

  /* Choices for levels 1 and 2, collapsed to one line while a run plays. */
  const choices =
    turn.choices &&
    (busy && pick ? (
      <p className="mt-3 rounded-md border-2 border-dashed border-edge/50 px-2 py-1 text-xs font-bold text-ink">
        <span className="label-caps text-ink-soft">{v.yourChoice}:</span>{' '}
        <span className="font-mono break-words" lang="en">
          {optText(pick)}
        </span>
      </p>
    ) : (
      <>
        <p id="it-pick-label" className="mt-3 mb-1.5 label-caps text-ink-soft">
          {level === 1 ? v.pickLabel1 : v.pickLabel2}
        </p>
        <div role="radiogroup" aria-labelledby="it-pick-label" className={`grid grid-cols-1 gap-1.5 ${level === 2 ? 'sm:grid-cols-3' : ''}`}>
          {turn.choices.map((o) => (
            <ChoiceButton
              key={o}
              selected={pick === o}
              color={accent}
              text={optText(o)}
              onClick={() => choose(o)}
              animate={shake.anim(`o-${o}`)}
              mono={level === 2}
              className="px-2 py-1.5 text-left [&>span:last-child]:whitespace-normal [&>span:last-child]:break-words"
            />
          ))}
        </div>
      </>
    ))

  /* A small list of names (a sorted copy), with the cursor on it. */
  const copyList = (list: MemberId[], title: string) => (
    <div className="mt-2">
      <p className="mb-1 text-[11px] font-semibold text-ink-soft">{title}</p>
      <ol className="flex flex-wrap gap-1">
        {list.map((id, i) => (
          <li
            key={id}
            className={`rounded border-2 px-1 text-[10px] font-bold transition-colors ${
              snap.cursor === id ? 'border-edge bg-mustard text-on-accent' : snap.marks[id] ? 'border-edge/30 text-ink-soft' : 'border-edge/50 text-ink'
            }`}
          >
            {num(i + 1)}. {v[id]} <span className="font-normal tabular-nums">{num(MEMBERS[id].sr)}</span>
          </li>
        ))}
      </ol>
    </div>
  )

  const codeChip = (text: string, tone: 'plain' | 'yes' | 'no' = 'plain') => (
    <code
      lang="en"
      className={`rounded border-2 px-1.5 py-px font-mono text-[11px] font-bold ${
        tone === 'yes' ? 'border-bottle text-bottle dark:border-jade dark:text-jade' : tone === 'no' ? 'border-chili text-chili' : 'border-edge/40 text-ink'
      }`}
    >
      {text}
    </code>
  )
  const hasChip = snap.has === null ? null : codeChip(`hasNext() → ${snap.has}`, snap.has ? 'yes' : 'no')

  /* Level 1: Nusrat's own loop. */
  const loopPick = level === 1 && pick ? (pick as L1Opt) : null
  const litLine = stepIs('read', 'skip') ? 1 : stepIs('loopStart', 'sort', 'noMore', 'crash') ? 0 : -1
  const loopNode = (
    <Node role={v.loopRole} title={v.loopTitle} active={active('loop')} accent={FAIL_COLOR}>
      {loopPick ? (
        <ol lang="en" className="flex flex-col gap-0.5 rounded-lg bg-code p-2 font-mono text-[11px] leading-snug text-[#e8dcc8]">
          {LOOP_CODE[loopPick].map((line, i) => (
            <li key={i} className={`rounded px-1 break-words whitespace-pre-wrap ${litLine === i ? 'bg-[#fbbf24] text-[#2b1d16]' : ''}`}>
              {line}
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-xs text-ink-soft">✍️ {v.pickLoop}</p>
      )}
      {snap.idx && <div className="mt-2 flex flex-wrap gap-1.5">{codeChip(snap.idx)}</div>}
      {snap.copy && copyList(snap.copy, v.copyLabel)}
      <AnimatePresence>
        {snap.crash && (
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: [1, 1.05, 1] }}
            exit={{ opacity: 0 }}
            className="mt-2 rounded-md border-2 border-edge bg-chili px-2 py-1 text-xs font-bold text-cream"
          >
            💥 {v.crashTitle}{' '}
            <code lang="en" className="block font-mono text-[11px] font-normal break-words">
              {snap.crash}
            </code>
          </motion.p>
        )}
      </AnimatePresence>
    </Node>
  )

  /* Level 2: the iterator Nusrat asked for. */
  const iterNode = iterKind ? (
    <motion.div animate={{ opacity: snap.created ? 1 : 0.55 }}>
      <Node role={v.concreteIteratorRole} title={ITER[iterKind].cls} active={active('iterator')} accent={ITER_COLOR} mono>
        <div className="flex flex-wrap gap-1.5">
          {codeChip(`pos = ${snap.pos}`)}
          {hasChip}
        </div>
        <p className="mt-1.5 text-[11px] text-ink-soft">{label(ITER[iterKind].note)}</p>
        {snap.copy && copyList(snap.copy, v.ownCopy)}
      </Node>
    </motion.div>
  ) : (
    <div className="rounded-xl border-2 border-dashed border-edge/50 p-3 text-center text-xs text-ink-soft">🔁 {v.pickIterator}</div>
  )

  /* Level 3: LeftHandedIterator wrapping an old iterator. */
  const inner = turn.inner ?? 'order'
  const lhNode = (
    <motion.div animate={{ opacity: built ? 1 : 0.6 }}>
      <Node role={v.concreteIteratorRole} title="LeftHandedIterator" active={active('iterator')} accent={NEW_COLOR} mono>
        {built ? (
          <>
            <div className="flex flex-wrap gap-1.5">
              {codeChip(`found = ${snap.found ? v[snap.found] : 'null'}`, snap.found ? 'yes' : 'plain')}
              {hasChip}
            </div>
            <p className="mt-1.5 text-[11px] text-ink-soft">{v.lhNote}</p>
            <div className="mt-2 border-l-2 border-dashed border-edge/40 pl-2">
              <Node role={v.innerRole} title={ITER[inner].cls} active={false} accent={ITER_COLOR} mono className="!p-2">
                <div className="flex flex-wrap gap-1.5">{codeChip(`pos = ${snap.pos}`)}</div>
                {snap.copy && copyList(snap.copy, v.ownCopy)}
              </Node>
            </div>
          </>
        ) : (
          <p className="text-xs text-ink-soft">🔨 {v.notBuilt}</p>
        )}
      </Node>
    </motion.div>
  )

  /* The squad: its own list, with the cursor walking the cards. */
  const storageCode =
    level > 1 ? 'private players: Player[]' : snap.storage === 'map' ? 'public players: Map<number, Player>' : 'public players: Player[]'
  const card = (id: MemberId, i: number) => {
    const m = MEMBERS[id]
    const mark = snap.marks[id]
    const here = snap.cursor === id
    const isNew = level === 3 && !SQUAD.includes(id)
    const key = snap.storage === 'map' ? `${num(m.jersey)}:` : `#${num(i + 1)}`
    return (
      <motion.li
        layout
        key={id}
        transition={{ duration: 0.5 }}
        className={`relative min-w-0 rounded-lg border-2 px-1.5 py-1 transition-colors ${
          here
            ? 'border-edge bg-mustard text-on-accent shadow-hard-sm'
            : mark === 'skip'
              ? 'border-dashed border-edge/40 bg-paper text-ink opacity-45'
              : 'border-edge/60 bg-paper text-ink'
        }`}
      >
        <p className="flex items-center justify-between gap-1 text-xs font-bold">
          <span className="min-w-0 truncate">
            <span className="font-mono text-[10px] opacity-70">{key}</span> {v[id]}
          </span>
          <span aria-hidden="true" className="shrink-0">
            {here ? '👉' : mark === 'yield' ? '✅' : mark === 'skip' ? '⏭' : isNew ? '🆕' : ''}
          </span>
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1 text-[10px] leading-tight font-semibold">
          <span className="tabular-nums">
            {v.srLabel} {num(m.sr)}
          </span>
          <span aria-hidden="true">·</span>
          <span className={level === 3 && m.left ? 'rounded bg-maroon px-1 text-cream' : ''}>{m.left ? v.handLeft : v.handRight}</span>
        </p>
        <p className={`text-[10px] leading-tight ${level === 2 && m.role === 'allrounder' ? 'font-bold' : ''}`}>
          <span aria-hidden="true">{ROLE[m.role].icon}</span> {label(ROLE[m.role].label)}
        </p>
      </motion.li>
    )
  }
  const squadNode = (
    <Node role={level === 1 ? v.exposedRole : v.squadRole} title={v.squadTitle} active={active('squad')} accent={level === 1 ? FAIL_COLOR : ITER_COLOR}>
      <p className="mb-2 flex flex-wrap items-center gap-1.5 text-[11px]">
        <code lang="en" className="rounded bg-code px-1.5 py-0.5 font-mono text-[#e8dcc8]">
          {storageCode}
        </code>
        <span className="text-ink-soft">{level === 1 ? v.storagePublic : `🔒 ${v.storagePrivate}`}</span>
      </p>
      <AnimatePresence>
        {snap.scrambled && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0 }} className="mb-2 text-xs font-bold text-chili">
            ⚠️ {v.scrambled}
          </motion.p>
        )}
      </AnimatePresence>
      <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">{snap.order.map((id, i) => card(id, i))}</ul>
    </Node>
  )

  /* Levels 2-3: the two interfaces. */
  const classChip = (name: string, tone: 'old' | 'new' | 'missing') => (
    <code
      key={name}
      lang="en"
      className={`rounded border-2 px-1.5 font-mono text-[10px] ${
        tone === 'new' ? 'border-edge bg-mustard text-on-accent' : tone === 'missing' ? 'border-dashed border-edge/40 text-ink-soft' : 'border-edge/40 text-ink'
      }`}
    >
      {name}
    </code>
  )
  const legend = (
    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Node role={v.aggregateRole} title="Team" active={false} accent={ITER_COLOR} mono className="!bg-paper">
        <code lang="en" className="block font-mono text-[11px] leading-snug text-ink">
          battingOrder()
          <br />
          byStrikeRate()
          <br />
          allRounders()
        </code>
        <p className="mt-1.5 text-[11px] text-ink-soft">{v.teamNote}</p>
      </Node>
      <Node role={v.iteratorRole} title="PlayerIterator" active={false} accent={ITER_COLOR} mono className="!bg-paper">
        <code lang="en" className="block font-mono text-[11px] leading-snug text-ink">
          hasNext(): boolean
          <br />
          next(): Player
        </code>
        <p className="mt-1.5 mb-2 text-[11px] text-ink-soft">{v.iteratorNote}</p>
        <div className="flex flex-wrap gap-1.5">
          {classChip('BattingOrderIterator', 'old')}
          {classChip('StrikeRateIterator', 'old')}
          {classChip('AllRounderIterator', 'old')}
          {level === 3 && classChip(`LeftHandedIterator · ${built ? v.newTag : v.notBuilt}`, built ? 'new' : 'missing')}
        </div>
      </Node>
    </div>
  )

  const crashed = Boolean(lastSnap?.crash)
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
            {willSucceed ? '🏆' : crashed ? '💥' : '😵'}
          </motion.span>
          {willSucceed ? fill(v.resultOk, { coins: money(PRIZE) }) : crashed ? v.resultCrash : v.resultBad}
        </motion.div>
      )}
    </AnimatePresence>
  )

  const conn = (n: 1 | 2) => step?.conns.find((c) => c.n === n && !c.up)
  const connUp = (n: 1 | 2) => step?.conns.find((c) => c.n === n && c.up)
  const pkt = (c: Conn | undefined): ReactNode => (c ? <Packet color={c.color}>{c.text}</Packet> : null)
  const conn1Label = level === 1 ? 'for (…) announce(…)' : 'hasNext() · next()'
  const conn2Label = level === 1 ? 'squad.players' : level === 2 ? 'players[pos]' : 'inner.next()'

  /* L3 builder. */
  const builder = (
    <div className="mt-3 flex flex-col gap-3 rounded-lg border-2 border-dashed p-3" style={{ borderColor: NEW_COLOR }}>
      <p className="font-display font-bold text-ink">🔨 {v.builderTitle}</p>
      <div>
        <p className="label-caps text-ink-soft">{v.builderStep1}</p>
        <p className="mb-2 text-sm text-ink">{v.q1}</p>
        <div role="radiogroup" aria-label={v.builderStep1} className="grid grid-cols-1 gap-2">
          {(
            [
              ['clientIf', v.q1ClientIf, false],
              ['implements', v.q1Implements, true],
              ['squadMethod', v.q1SquadMethod, false],
            ] as const
          ).map(([a, text, mono]) => (
            <ChoiceButton
              key={a}
              selected={panel !== 'q1' && a === 'implements'}
              color={NEW_COLOR}
              text={text}
              onClick={() => answerQ1(a)}
              animate={shake.anim(`q1-${a}`)}
              mono={mono}
              className={`[&>span:last-child]:whitespace-normal [&>span:last-child]:break-words ${panel !== 'q1' && a !== 'implements' ? 'opacity-40' : ''}`}
            />
          ))}
        </div>
        {panel !== 'q1' && <NewCodeChip>+ class LeftHandedIterator implements PlayerIterator</NewCodeChip>}
      </div>

      {panel !== 'q1' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="label-caps text-ink-soft">{v.builderStep2}</p>
          <p className="mb-2 text-sm text-ink">{v.q2}</p>
          <div role="radiogroup" aria-label={v.builderStep2} className="grid grid-cols-1 gap-2">
            {(
              [
                ['readList', v.q2ReadList],
                ['sortList', v.q2SortList],
                ['wrap', v.q2Wrap],
              ] as const
            ).map(([a, text]) => (
              <ChoiceButton
                key={a}
                selected={panel === 'ready' && a === 'wrap'}
                color={NEW_COLOR}
                text={text}
                onClick={() => answerQ2(a)}
                animate={shake.anim(`q2-${a}`)}
                className={`[&>span:last-child]:whitespace-normal [&>span:last-child]:break-words ${panel === 'ready' && a !== 'wrap' ? 'opacity-40' : ''}`}
              />
            ))}
          </div>
          {panel === 'ready' && <NewCodeChip>+ constructor(inner: PlayerIterator) · skip right-handers in hasNext()</NewCodeChip>}
        </motion.div>
      )}

      {panel === 'ready' && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full border-2 border-bottle bg-bottle/10 px-2 py-0.5 text-xs font-bold text-bottle dark:border-jade dark:text-jade">
            ✓ {v.zeroEdits}
          </span>
          <Button variant="primary" onClick={plugIterator} data-game="open-branch">
            🫲 {v.useLh}
          </Button>
        </motion.div>
      )}
    </div>
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
              primary={level < 3 ? { label: `${v.nextLevel} →`, onClick: () => startLevel((level + 1) as Level) } : { label: v.playAgain, onClick: restartGame }}
              secondary={{ label: v.replayLevel, onClick: () => startLevel(level) }}
            >
              {level === 1 && (
                <>
                  <p className="prose-text text-sm text-ink">{v.l1Teaser}</p>
                  <code lang="en" className="w-full max-w-xs truncate rounded-md border-2 border-dashed border-chili px-2 py-1 font-mono text-xs text-chili">
                    {'+ for (???) if (p.leftHanded) …'}
                  </code>
                </>
              )}
              {level === 2 && <p className="prose-text text-sm text-ink">{v.l2Summary}</p>}
              {level === 3 && (
                <Recap
                  title={v.recapTitle}
                  items={[
                    { icon: '✍️', text: v.recap1 },
                    { icon: '🔁', text: v.recap2 },
                    { icon: '🫲', text: v.recap3 },
                  ]}
                />
              )}
            </LevelCompleteCard>
          ) : (
            <motion.div key={`play-${level}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* ── Client: Nusrat the scorer, Karim bhai's request, the names called out, the learner's choice ── */}
              <Node role={v.clientRole} title={`📋 ${v.scorerTitle}`} active={active('client')} accent={accent}>
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

                {request}
                {lineup}

                {level < 3 ? (
                  <>
                    {choices}
                    <p className={`mt-2 border-t-2 border-dashed border-edge/40 pt-2 text-xs font-semibold ${level === 1 ? 'text-chili' : 'text-ink'}`}>
                      {level === 1 ? `⚠️ ${v.knowsL1}` : `✓ ${v.knowsL2}`}
                    </p>
                  </>
                ) : panel ? null : (
                  <>
                    <p className="mt-2 border-t-2 border-dashed border-edge/40 pt-2 text-xs font-semibold text-ink">✓ {v.knowsL2}</p>
                    <p className="mt-1 text-xs font-semibold text-bottle dark:text-jade">{v.othersSame}</p>
                  </>
                )}
              </Node>

              {level === 3 && panel && builder}

              <Connector label={conn1Label} down={Boolean(conn(1))} up={Boolean(connUp(1))} downPacket={pkt(conn(1))} upPacket={pkt(connUp(1))} runKey={player.index} />

              {level === 1 ? loopNode : level === 2 ? iterNode : lhNode}

              <Connector label={conn2Label} down={Boolean(conn(2))} up={Boolean(connUp(2))} downPacket={pkt(conn(2))} upPacket={pkt(connUp(2))} runKey={player.index} />

              {squadNode}
              {level > 1 && legend}
              {resultBanner}
            </motion.div>
          )}
        </AnimatePresence>
      </Stage>

      <Caption label={v.whatsHappening} text={caption} stepKey={`${captionKey}-${lang}-${turnIdx}-${player.index}`} />

      {outcome && !levelDone && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
          <Button variant="primary" onClick={afterOutcome} data-game="after-outcome">
            {outcome === 'fail' ? `↻ ${v.tryAgain}` : isLastTurn ? `🏁 ${v.finishLevel}` : `${v.nextTurn} →`}
          </Button>
        </motion.div>
      )}

      {!levelDone && <StepControls player={controls} playLabel={`▶ ${v.playButton}`} disabled={!ready || outcome !== null || panel !== null} />}

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-soft">
        <p>* {v.note}</p>
        <Button variant="ghost" onClick={restartGame} className="px-2 py-0.5 text-xs">
          ↺ {v.restart}
        </Button>
      </div>
    </div>
  )
}
