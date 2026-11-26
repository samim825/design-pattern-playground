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
import type { MediatorContent } from './content.en'

/*
 * "Evening rush at Osmani airport, Sylhet": a 3-level game.
 *   Level 1  no pattern: every plane radios every other plane before landing. The learner picks whom the
 *            new plane radios; miss the one on final and two planes meet on the runway (`without`)
 *   Level 2  Mediator: planes only talk to SylhetTower, which owns the runway state and the queue.
 *            The learner picks the right message to the tower or the tower's reply (`main`)
 *   Level 3  the learner builds Helicopter (2 questions): an air ambulance with priority, 0 old lines edited (`with`)
 * Every turn is a step timeline whose steps carry a snapshot, so the code panel and every node stay in sync.
 */

type Labels = MediatorContent['visual']
type LabelKey = keyof Labels

/* ------------------------------------------------------------------ */
/* The aircraft (made-up airlines, call signs and figures)             */
/* ------------------------------------------------------------------ */

type AcId = 'pa101' | 'mg207' | 'kc33' | 'sa412' | 'rescue1'
type AcClass = 'PassengerPlane' | 'CargoPlane' | 'Helicopter'
const AC: Record<AcId, { call: string; airline: LabelKey; cls: AcClass; icon: string; color: string }> = {
  pa101: { call: 'PA-101', airline: 'airPadma', cls: 'PassengerPlane', icon: '✈️', color: '#0E7490' },
  mg207: { call: 'MG-207', airline: 'airMeghna', cls: 'PassengerPlane', icon: '✈️', color: '#7C3AED' },
  kc33: { call: 'KC-33', airline: 'airKarnaphuli', cls: 'CargoPlane', icon: '📦', color: '#B45309' },
  sa412: { call: 'SA-412', airline: 'airSurma', cls: 'PassengerPlane', icon: '✈️', color: '#0F766E' },
  rescue1: { call: 'Rescue-1', airline: 'airRescue', cls: 'Helicopter', icon: '🚁', color: '#C2410C' },
}
const call = (id: AcId) => AC[id].call

type PStatus = 'arriving' | 'circling' | 'final' | 'holding' | 'cleared' | 'runway' | 'landed' | 'goAround' | 'parked'
const STATUS: Record<PStatus, { label: LabelKey; tone: 'plain' | 'warn' | 'ok' | 'bad' }> = {
  arriving: { label: 'stArriving', tone: 'plain' },
  circling: { label: 'stCircling', tone: 'plain' },
  final: { label: 'stFinal', tone: 'warn' },
  holding: { label: 'stHolding', tone: 'warn' },
  cleared: { label: 'stCleared', tone: 'ok' },
  runway: { label: 'stRunway', tone: 'warn' },
  landed: { label: 'stLanded', tone: 'ok' },
  goAround: { label: 'stGoAround', tone: 'bad' },
  parked: { label: 'stParked', tone: 'ok' },
}

type L1Opt = 'none' | 'pa' | 'pamg' | 'all'
type L2Opt = 'tower' | 'justLand' | 'askKc' | 'replyHold' | 'replyLand' | 'replyGoAround' | 'notify' | 'broadcast' | 'silent'
type Opt = L1Opt | L2Opt
const OPT_LABEL: Record<Opt, LabelKey> = {
  none: 'optNone',
  pa: 'optPa',
  pamg: 'optPaMg',
  all: 'optAll',
  tower: 'optTower',
  justLand: 'optJustLand',
  askKc: 'optAskKc',
  replyHold: 'optReplyHold',
  replyLand: 'optReplyLand',
  replyGoAround: 'optReplyGoAround',
  notify: 'optNotify',
  broadcast: 'optBroadcast',
  silent: 'optSilent',
}
/** Options shown as code (monospace). */
const MONO_OPT: Opt[] = ['tower', 'notify']

interface Turn {
  /** The situation, shown on the turn card. */
  situation: LabelKey
  /** The question above the choices. */
  ask?: LabelKey
  planes: AcId[]
  start: Partial<Record<AcId, PStatus>>
  runway: AcId[]
  queue: AcId[]
  /** The plane that arrives in this turn. */
  arriving?: AcId
  /** Level 1: the plane that is really on final (hidden until asked). */
  onFinal?: AcId
  choices?: Opt[]
}

const TURNS: Record<Level, Turn[]> = {
  1: [
    {
      situation: 'sit1-1',
      ask: 'ask1',
      planes: ['pa101', 'mg207'],
      start: { pa101: 'final', mg207: 'arriving' },
      runway: [],
      queue: [],
      arriving: 'mg207',
      onFinal: 'pa101',
      choices: ['pa', 'none'],
    },
    {
      situation: 'sit1-2',
      ask: 'ask1',
      planes: ['pa101', 'mg207', 'kc33'],
      start: { pa101: 'circling', mg207: 'final', kc33: 'arriving' },
      runway: [],
      queue: [],
      arriving: 'kc33',
      onFinal: 'mg207',
      choices: ['pa', 'all', 'none'],
    },
    {
      situation: 'sit1-3',
      ask: 'ask1',
      planes: ['pa101', 'mg207', 'kc33', 'sa412'],
      start: { pa101: 'circling', mg207: 'circling', kc33: 'final', sa412: 'arriving' },
      runway: [],
      queue: [],
      arriving: 'sa412',
      onFinal: 'kc33',
      choices: ['pa', 'pamg', 'all'],
    },
  ],
  2: [
    {
      situation: 'sit2-1',
      ask: 'ask2-1',
      planes: ['pa101', 'kc33'],
      start: { pa101: 'arriving', kc33: 'runway' },
      runway: ['kc33'],
      queue: [],
      arriving: 'pa101',
      choices: ['askKc', 'tower', 'justLand'],
    },
    {
      situation: 'sit2-2',
      ask: 'ask2-2',
      planes: ['pa101', 'mg207'],
      start: { pa101: 'runway', mg207: 'arriving' },
      runway: ['pa101'],
      queue: [],
      arriving: 'mg207',
      choices: ['replyLand', 'replyGoAround', 'replyHold'],
    },
    {
      situation: 'sit2-3',
      ask: 'ask2-3',
      planes: ['pa101', 'kc33', 'mg207'],
      start: { pa101: 'runway', kc33: 'holding', mg207: 'holding' },
      runway: ['pa101'],
      queue: ['kc33', 'mg207'],
      choices: ['broadcast', 'notify', 'silent'],
    },
  ],
  3: [
    {
      situation: 'sit3-1',
      planes: ['mg207', 'kc33', 'rescue1'],
      start: { mg207: 'runway', kc33: 'holding' },
      runway: ['mg207'],
      queue: ['kc33'],
      arriving: 'rescue1',
    },
    {
      situation: 'sit3-2',
      planes: ['pa101', 'rescue1'],
      start: { pa101: 'circling' },
      runway: [],
      queue: [],
      arriving: 'rescue1',
    },
    {
      situation: 'sit3-3',
      planes: ['kc33', 'pa101', 'mg207', 'rescue1'],
      start: { kc33: 'runway', pa101: 'holding', mg207: 'holding' },
      runway: ['kc33'],
      queue: ['pa101', 'mg207'],
      arriving: 'rescue1',
    },
  ],
}
/** Level 1, turn 1 is a guided tutorial: the right choice is pre-selected. */
const TUTORIAL_PICK: Opt = 'pa'
/** Landing fee the airport earns per safe landing (made up). */
const FEE = 12000
const LEVEL_ICON: Record<Level, string> = { 1: '📻', 2: '🗼', 3: '🚁' }

const FAIL_COLOR = '#B91C1C'
const TOWER_COLOR = '#0E7490'
const NEW_COLOR = '#C2410C'
const OK_COLOR = '#0b6b4f'
const WAIT_COLOR = '#6B7280'

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

type Kind =
  | 'arrive'
  | 'ask'
  | 'reply'
  | 'hold'
  | 'land'
  | 'conflict'
  | 'goAround'
  | 'request'
  | 'check'
  | 'queue'
  | 'vacate'
  | 'free'
  | 'clear'
  | 'skip'
  | 'noLink'
  | 'unannounced'
  | 'taxi'
  | 'broadcast'
  | 'unaware'
  | 'waiting'
  | 'stuck'
  | 'create'
  | 'priority'
  | 'end'
type NodeId = AcId | 'mesh' | 'tower' | 'runway'
interface Conn {
  n: 1 | 2
  up: boolean
  text: string
  color: string
}
interface Say {
  at: AcId | 'tower'
  text: string
  tone: 'out' | 'in' | 'bad'
}
interface Snap {
  present: AcId[]
  status: Partial<Record<AcId, PStatus>>
  /** Level 1: planes whose status the arriving plane has learned by radio. */
  known: AcId[]
  runway: AcId[]
  queue: AcId[]
  /** What the tower believes. */
  runwayFree: boolean
  /** Level 1: direct links between planes. */
  links: number
  landed: number
  fail: 'conflict' | 'stuck' | null
  noLink: boolean
}
interface GameStep extends PlayerStep {
  kind: Kind
  caption: string
  cv: Record<string, string>
  node: NodeId
  conns: Conn[]
  say: Say[]
  /** Level 1: the radio link a message travels along in the mesh. */
  link?: [AcId, AcId]
  snap: Snap
}

const pairs = (n: number) => (n * (n - 1)) / 2

function initSnap(level: Level, turnIdx: number): Snap {
  const turn = TURNS[level][turnIdx]
  const present = level === 3 ? turn.planes.filter((p) => p !== 'rescue1') : turn.planes
  return {
    present,
    status: { ...turn.start },
    known: [],
    runway: turn.runway,
    queue: turn.queue,
    runwayFree: turn.runway.length === 0,
    links: level === 1 ? pairs(turn.planes.length - 1) : 0,
    landed: 0,
    fail: null,
    noLink: false,
  }
}

const DURATION: Partial<Record<Kind, number>> = {
  arrive: 1700,
  ask: 1300,
  reply: 1300,
  conflict: 2300,
  goAround: 1900,
  request: 1300,
  check: 1300,
  noLink: 1900,
  unannounced: 1700,
  broadcast: 1700,
  stuck: 2000,
  create: 1500,
  priority: 1700,
  end: 1800,
}

/** Builds a turn's timeline. `add` applies a change to the snapshot, then records a step. */
function buildSteps(level: Level, turnIdx: number, pick: Opt | null, v: Labels, lang: Lang): GameStep[] {
  const turn = TURNS[level][turnIdx]
  if (level < 3 && !pick) return []
  const out: GameStep[] = []
  let s = initSnap(level, turnIdx)

  const add = (
    kind: Kind,
    node: NodeId,
    codeStep: string,
    opts: { caption?: string; cv?: Record<string, string>; conns?: Conn[]; say?: Say[]; link?: [AcId, AcId]; change?: (x: Snap) => Snap } = {},
  ) => {
    if (opts.change) s = opts.change(s)
    out.push({
      id: `${kind}-${out.length}`,
      codeStep,
      duration: DURATION[kind] ?? 1250,
      kind,
      caption: opts.caption ?? kind,
      cv: opts.cv ?? {},
      node,
      conns: opts.conns ?? [],
      say: opts.say ?? [],
      link: opts.link,
      snap: s,
    })
  }
  const st = (x: Snap, changes: Partial<Record<AcId, PStatus>>): Snap => ({ ...x, status: { ...x.status, ...changes } })
  const fee = formatTaka(FEE, lang)

  /* Shared pieces for levels 2-3 (code ids differ: level 3 runs the `with` snippet). */
  const l3 = level === 3
  const planeCode = (id: AcId, l2Code: string) => (l3 ? (id === 'rescue1' ? '' : AC[id].cls === 'CargoPlane' ? 'p-cargo' : 'p-pass') : l2Code)
  const towerCode = (l2Code: string) => (l3 ? 't-act' : l2Code)

  const request = (id: AcId) =>
    add('request', id, id === 'rescue1' ? 'h-request' : planeCode(id, 'request'), {
      caption: id === 'rescue1' ? 'h-request' : 'request',
      cv: { plane: call(id) },
      conns: [{ n: 1, up: false, text: `requestLanding(${call(id)})`, color: TOWER_COLOR }],
      say: [{ at: id, text: `📻 → 🗼 ${v.sayRequest}`, tone: 'out' }],
    })
  const check = () =>
    add('check', 'tower', towerCode('check-runway'), {
      caption: s.runwayFree ? 'check-free' : 'check-busy',
      cv: { on: s.runway.map(call).join(', ') },
    })
  const queueUp = (id: AcId, front: boolean) => {
    if (front)
      add('priority', 'tower', 'h-priority', {
        caption: 'h-priority',
        cv: { plane: call(id), queue: s.queue.map(call).join(', ') },
      })
    add('queue', 'tower', towerCode('queue'), {
      caption: front ? 'queue-front' : 'queue',
      change: (x) => ({ ...x, queue: front ? [id, ...x.queue] : [...x.queue, id] }),
      cv: { plane: call(id) },
    })
  }
  const holdIt = (id: AcId, front = false) =>
    add('hold', id, id === 'rescue1' ? towerCode('hold') : planeCode(id, 'hold'), {
      caption: front ? 'hold-front' : 'hold',
      cv: { plane: call(id), pos: formatNumber(s.queue.indexOf(id) + 1, lang) },
      conns: [{ n: 1, up: true, text: `${call(id)}: hold`, color: WAIT_COLOR }],
      say: [
        { at: 'tower', text: `🗼 → ${call(id)}: ${v.sayHold}`, tone: 'out' },
        { at: id, text: `🔁 ${v.sayHolding}`, tone: 'in' },
      ],
      change: (x) => st(x, { [id]: 'holding' }),
    })
  const vacate = (id: AcId) =>
    add('vacate', 'runway', id === 'rescue1' ? 'h-vacate' : planeCode(id, 'vacate'), {
      caption: id === 'rescue1' ? 'h-vacate' : 'vacate',
      cv: { plane: call(id) },
      conns: [{ n: 2, up: true, text: `notify(${call(id)}, 'landed')`, color: OK_COLOR }],
      change: (x) => st({ ...x, runway: x.runway.filter((r) => r !== id) }, { [id]: 'parked' }),
    })
  const free = () =>
    add('free', 'tower', towerCode('runway-free'), {
      caption: s.queue.length ? 'runway-free' : 'runway-free-empty',
      cv: { next: s.queue[0] ? call(s.queue[0]) : '' },
      change: (x) => ({ ...x, runwayFree: true }),
    })
  /** The tower clears a plane: from the queue (`fromQueue`) or straight away. */
  const clearIt = (id: AcId, fromQueue: boolean) =>
    add('clear', 'tower', towerCode(fromQueue ? 'clear-next' : 'clear'), {
      caption: fromQueue ? 'clear-next' : 'clear',
      cv: { plane: call(id) },
      conns: [{ n: 1, up: true, text: `${call(id)}: cleared ✓`, color: OK_COLOR }],
      say: [
        { at: 'tower', text: `🗼 → ${call(id)}: ${v.sayCleared}`, tone: 'out' },
        { at: id, text: `✅ ${v.sayCleared}`, tone: 'in' },
      ],
      change: (x) => st({ ...x, runwayFree: false, queue: x.queue.filter((q) => q !== id) }, { [id]: 'cleared' }),
    })
  const land = (id: AcId) =>
    add('land', 'runway', id === 'rescue1' ? 'h-land' : planeCode(id, 'land'), {
      caption: id === 'rescue1' ? 'h-land' : 'land',
      cv: { plane: call(id), fee },
      conns: [{ n: 2, up: false, text: `${AC[id].icon} ${call(id)}`, color: AC[id].color }],
      change: (x) => st({ ...x, runway: [...x.runway, id], landed: x.landed + 1 }, { [id]: 'runway' }),
    })
  /** A plane flies past the tower without clearance, straight onto the runway. */
  const unannounced = (ids: AcId[], code: string) => {
    add('unannounced', 'tower', code, {
      caption: 'unannounced',
      cv: { planes: ids.map(call).join(' + ') },
      conns: [{ n: 1, up: false, text: `⚠️ ${ids.map(call).join(' + ')}`, color: FAIL_COLOR }],
      say: [{ at: 'tower', text: `❓ ${v.sayWho}`, tone: 'bad' }],
      change: (x) => st(x, Object.fromEntries(ids.map((i) => [i, 'final']))),
    })
  }
  const conflict = (ids: AcId[], code: string, caption: string) => {
    const already = s.runway.filter((r) => !ids.includes(r))
    add('conflict', 'runway', code, {
      caption,
      cv: { planes: [...already, ...ids].map(call).join(' + ') },
      conns: [{ n: 2, up: false, text: `${ids.map((i) => AC[i].icon).join('')} ${ids.map(call).join(' + ')}`, color: FAIL_COLOR }],
      change: (x) => st({ ...x, runway: [...x.runway, ...ids], fail: 'conflict' }, Object.fromEntries(ids.map((i) => [i, 'runway']))),
    })
    const all = [...already, ...ids]
    add('goAround', 'runway', code, {
      caption: 'go-around',
      cv: { planes: all.map(call).join(' + ') },
      say: all.map((i) => ({ at: i, text: `↗️ ${v.sayGoAround}`, tone: 'bad' as const })),
      change: (x) => st({ ...x, runway: [] }, Object.fromEntries(all.map((i) => [i, 'goAround']))),
    })
  }

  /* ---------------- level 1: every plane radios every other plane ---------------- */
  if (level === 1) {
    const o = pick as L1Opt
    const arr = turn.arriving!
    const fin = turn.onFinal!
    const others = turn.planes.filter((p) => p !== arr)
    const asked: AcId[] = o === 'none' ? [] : o === 'pa' ? ['pa101'] : o === 'pamg' ? ['pa101', 'mg207'] : others
    const n = turn.planes.length
    add('arrive', arr, 'l1-arrive', {
      caption: 'l1-arrive',
      cv: { plane: call(arr), added: formatNumber(n - 1, lang), links: formatNumber(pairs(n), lang), n: formatNumber(n, lang) },
      change: (x) => ({ ...x, links: pairs(n) }),
    })
    let heard = false
    for (const id of asked) {
      add('ask', id, 'l1-ask', {
        caption: 'l1-ask',
        cv: { from: call(arr), to: call(id) },
        link: [arr, id],
        say: [
          { at: arr, text: `📻 → ${call(id)}: ${v.sayLanding}`, tone: 'out' },
          { at: id, text: `📻 ${call(arr)}: ${v.sayLanding}`, tone: 'in' },
        ],
      })
      const isFinal = id === fin
      add('reply', id, 'l1-reply', {
        caption: isFinal ? 'l1-reply-final' : 'l1-reply-circling',
        cv: { from: call(arr), to: call(id) },
        link: [id, arr],
        say: [{ at: id, text: `📻 → ${call(arr)}: ${isFinal ? v.sayOnFinal : v.sayCircling}`, tone: 'out' }],
        change: (x) => ({ ...x, known: [...x.known, id] }),
      })
      if (isFinal) {
        heard = true
        break // the loop returns on the first "yes"
      }
    }
    if (heard) {
      add('hold', arr, 'l1-hold', {
        caption: 'l1-hold',
        cv: { plane: call(arr), other: call(fin) },
        say: [{ at: arr, text: `🔁 ${v.sayHolding}`, tone: 'in' }],
        change: (x) => st(x, { [arr]: 'holding' }),
      })
      add('land', 'runway', 'l1-land', {
        caption: 'l1-land-first',
        cv: { plane: call(fin), fee },
        conns: [{ n: 2, up: false, text: `${AC[fin].icon} ${call(fin)}`, color: AC[fin].color }],
        change: (x) => st({ ...x, runway: [fin], landed: x.landed + 1 }, { [fin]: 'runway' }),
      })
      add('land', 'runway', 'l1-land', {
        caption: 'l1-land-second',
        cv: { plane: call(arr), other: call(fin), fee },
        link: [fin, arr],
        conns: [{ n: 2, up: false, text: `${AC[arr].icon} ${call(arr)}`, color: AC[arr].color }],
        say: [{ at: fin, text: `📻 → ${call(arr)}: ${v.sayVacated}`, tone: 'out' }],
        change: (x) => st({ ...x, runway: [arr], landed: x.landed + 1 }, { [fin]: 'parked', [arr]: 'runway' }),
      })
    } else {
      add('land', 'runway', 'l1-land', {
        caption: asked.length ? 'l1-land-blind' : 'l1-land-none',
        cv: { plane: call(arr) },
        conns: [{ n: 2, up: false, text: `${AC[arr].icon} ${call(arr)}`, color: AC[arr].color }],
        change: (x) => st({ ...x, runway: [arr] }, { [arr]: 'runway' }),
      })
      conflict([fin], 'l1-conflict', 'l1-conflict')
    }
    add('end', 'runway', 'l1-try', {
      caption: s.fail ? 'l1-fail' : 'l1-ok',
      cv: { plane: call(arr), missed: call(fin), coins: formatTaka(s.landed * FEE, lang), links: formatNumber(s.links, lang) },
      change: (x) => ({ ...x, known: turn.planes }),
    })
    return out
  }

  /* ---------------- level 2: talk to the tower ---------------- */
  if (level === 2) {
    const o = pick as L2Opt
    if (turnIdx === 0) {
      // PA-101 arrives while KC-33 is on the runway.
      if (o === 'tower') {
        request('pa101')
        check()
        queueUp('pa101', false)
        holdIt('pa101')
        vacate('kc33')
        free()
        clearIt('pa101', true)
        land('pa101')
      } else if (o === 'justLand') {
        add('skip', 'pa101', 'request', { caption: 'l2-skip-tower', say: [{ at: 'pa101', text: `👀 ${v.sayLooksClear}`, tone: 'bad' }] })
        unannounced(['pa101'], 'request')
        conflict(['pa101'], 'conflict', 'conflict')
      } else {
        add('noLink', 'pa101', 'only-tower', {
          caption: 'l2-no-link',
          say: [{ at: 'pa101', text: `📵 → KC-33 ✗`, tone: 'bad' }],
          change: (x) => ({ ...x, noLink: true }),
        })
        add('waiting', 'kc33', 'only-tower', { caption: 'l2-no-answer', say: [{ at: 'kc33', text: `🎧 ${v.sayTowerOnly}`, tone: 'in' }] })
        unannounced(['pa101'], 'request')
        conflict(['pa101'], 'conflict', 'conflict')
      }
    } else if (turnIdx === 1) {
      // MG-207 asks while PA-101 is still on the runway: what does the tower reply?
      request('mg207')
      check()
      if (o === 'replyHold') {
        queueUp('mg207', false)
        holdIt('mg207')
        vacate('pa101')
        free()
        clearIt('mg207', true)
        land('mg207')
      } else if (o === 'replyLand') {
        add('clear', 'tower', 'clear', {
          caption: 'l2-clear-anyway',
          conns: [{ n: 1, up: true, text: 'MG-207: cleared ✓', color: FAIL_COLOR }],
          say: [{ at: 'tower', text: `🗼 → MG-207: ${v.sayCleared}`, tone: 'bad' }],
          change: (x) => st(x, { mg207: 'cleared' }),
        })
        conflict(['mg207'], 'conflict', 'conflict-tower')
      } else {
        add('goAround', 'mg207', 'queue', {
          caption: 'l2-sent-away',
          conns: [{ n: 1, up: true, text: 'MG-207: go around', color: FAIL_COLOR }],
          say: [{ at: 'mg207', text: `↗️ ${v.sayGoAround}`, tone: 'bad' }],
          change: (x) => st(x, { mg207: 'goAround' }),
        })
        vacate('pa101')
        free()
        add('stuck', 'mg207', 'queue', {
          caption: 'l2-stuck-goaround',
          say: [{ at: 'mg207', text: `⛽ ${v.sayFuel}`, tone: 'bad' }],
          change: (x) => ({ ...x, fail: 'stuck' }),
        })
      }
    } else {
      // PA-101 is done on the runway; KC-33 and MG-207 are holding.
      if (o === 'notify') {
        vacate('pa101')
        free()
        clearIt('kc33', true)
        land('kc33')
        vacate('kc33')
        free()
        clearIt('mg207', true)
        land('mg207')
      } else if (o === 'broadcast') {
        add('taxi', 'runway', 'vacate', {
          caption: 'l2-taxi',
          cv: { plane: 'PA-101' },
          change: (x) => st({ ...x, runway: [] }, { pa101: 'parked' }),
        })
        add('broadcast', 'pa101', 'vacate', {
          caption: 'l2-broadcast',
          say: [
            { at: 'pa101', text: `📻 → KC-33, MG-207: ${v.sayFree}`, tone: 'bad' },
            { at: 'kc33', text: `📻 ${v.sayFree}`, tone: 'in' },
            { at: 'mg207', text: `📻 ${v.sayFree}`, tone: 'in' },
          ],
        })
        unannounced(['kc33', 'mg207'], 'vacate')
        conflict(['kc33', 'mg207'], 'conflict', 'conflict-both')
      } else {
        add('taxi', 'runway', 'vacate', {
          caption: 'l2-taxi-silent',
          change: (x) => st({ ...x, runway: [] }, { pa101: 'parked' }),
        })
        add('unaware', 'tower', 'runway-free', { caption: 'l2-tower-unaware', say: [{ at: 'tower', text: `🤷 ${v.sayStillBusy}`, tone: 'bad' }] })
        add('waiting', 'kc33', 'hold', { caption: 'l2-still-holding', cv: { plane: 'KC-33' }, say: [{ at: 'kc33', text: `🔁 ${v.sayHolding}`, tone: 'in' }] })
        add('waiting', 'mg207', 'hold', { caption: 'l2-still-holding', cv: { plane: 'MG-207' }, say: [{ at: 'mg207', text: `⛽ ${v.sayFuel}`, tone: 'bad' }] })
        add('stuck', 'runway', 'runway-free', { caption: 'l2-stuck-silent', change: (x) => ({ ...x, fail: 'stuck' }) })
      }
    }
    add('end', 'tower', out[out.length - 1].codeStep ?? 'request', {
      caption: s.fail ? `l2-fail-${o}` : `l2-ok-${turnIdx + 1}`,
      cv: { coins: formatTaka(s.landed * FEE, lang) },
    })
    return out
  }

  /* ---------------- level 3: Rescue-1, the new colleague ---------------- */
  add('create', 'rescue1', 'h-create', {
    caption: 'h-create',
    change: (x) => st({ ...x, present: [...x.present, 'rescue1'] }, { rescue1: 'arriving' }),
  })
  request('rescue1')
  if (turnIdx === 1) {
    check()
    clearIt('rescue1', false)
    land('rescue1')
    request('pa101')
    queueUp('pa101', false)
    holdIt('pa101')
    vacate('rescue1')
    free()
    clearIt('pa101', true)
    land('pa101')
  } else {
    const blocker = s.runway[0]
    const next = s.queue[0]
    queueUp('rescue1', true)
    holdIt('rescue1', true)
    vacate(blocker)
    free()
    clearIt('rescue1', true)
    land('rescue1')
    vacate('rescue1')
    free()
    clearIt(next, true)
  }
  add('end', 'tower', 'h-request', { caption: `l3-done-${turnIdx + 1}`, cv: { coins: formatTaka(s.landed * FEE, lang) } })
  return out
}

/* ------------------------------------------------------------------ */
/* Visual                                                              */
/* ------------------------------------------------------------------ */

/** Plane positions in the level-1 radio mesh (viewBox 300 × 120), by number of planes. */
const MESH_POS: Record<number, [number, number][]> = {
  2: [
    [70, 60],
    [230, 60],
  ],
  3: [
    [150, 24],
    [60, 92],
    [240, 92],
  ],
  4: [
    [60, 26],
    [240, 26],
    [60, 94],
    [240, 94],
  ],
}

export default function MediatorVisual({ content, lang, onCodeStep, onCodeView }: VisualProps<MediatorContent>) {
  const v = content.visual
  const captions: Record<string, string> = content.steps
  const label = (key: LabelKey) => v[key]
  const money = (n: number) => formatTaka(n, lang)
  const num = (n: number) => formatNumber(n, lang)

  const { progress, addCoins, completeLevel, reset: resetProgress } = useGameProgress('dpp-mediator-game')
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
  const snap = step?.snap ?? initSnap(level, turnIdx)

  const lastSnap = steps.length ? steps[steps.length - 1].snap : null
  const willSucceed = Boolean(lastSnap && !lastSnap.fail)
  const outcome: 'ok' | 'fail' | null = player.done ? (willSucceed ? 'ok' : 'fail') : null
  const pendingCoins = outcome === 'ok' && lastSnap ? lastSnap.landed * FEE : 0
  const accent = level === 1 ? FAIL_COLOR : level === 3 ? NEW_COLOR : TOWER_COLOR

  /* ---------------- code panel sync ---------------- */

  const view: CodeView = level === 1 ? 'without' : level === 2 ? 'main' : 'with'
  useEffect(() => {
    onCodeView?.(view)
  }, [view, onCodeView])
  useEffect(() => () => onCodeView?.('main'), [onCodeView])

  let idleCode: string | null
  if (levelDone) idleCode = null
  else if (level === 1) idleCode = pick ? 'l1-ask' : 'l1-arrive'
  else if (level === 2)
    idleCode =
      pick === 'askKc'
        ? 'only-tower'
        : turnIdx === 0
          ? 'request'
          : turnIdx === 1
            ? pick === 'replyLand'
              ? 'clear'
              : 'queue'
            : pick === 'silent'
              ? 'runway-free'
              : 'vacate'
  else idleCode = panel === 'q1' ? 'build-class' : panel === 'q2' ? 'build-priority' : 'h-create'
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

  const answerQ1 = (a: 'tower' | 'allPlanes' | 'runway') => {
    if (panel !== 'q1') return
    if (a === 'tower') {
      setHint(null)
      setPanel('q2')
      return
    }
    shake.bump(`q1-${a}`)
    setMistakes((m) => m + 1)
    setHint({ key: `wrong-q1-${a}` })
  }

  const answerQ2 = (a: 'radioPlanes' | 'editPlanes' | 'priority') => {
    if (panel !== 'q2') return
    if (a === 'priority') {
      setHint(null)
      setPanel('ready')
      return
    }
    shake.bump(`q2-${a}`)
    setMistakes((m) => m + 1)
    setHint({ key: `wrong-q2-${a}` })
  }

  const flyIn = () => {
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

  const optText = (o: Opt) => label(OPT_LABEL[o])
  const values: Record<string, string> = {
    plane: turn.arriving ? call(turn.arriving) : '',
    choice: pick ? optText(pick) : '',
    fee: money(FEE),
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
  const finished = kind === 'end'
  const active = (n: NodeId) => step?.node === n
  const sayAt = (at: AcId | 'tower') => step?.say.filter((x) => x.at === at) ?? []

  const chip = (text: string, tone: 'plain' | 'ok' | 'bad' | 'warn' = 'plain') => (
    <code
      lang="en"
      className={`rounded border-2 px-1.5 py-px font-mono text-[11px] font-bold ${
        tone === 'ok'
          ? 'border-bottle text-bottle dark:border-jade dark:text-jade'
          : tone === 'bad'
            ? 'border-chili text-chili'
            : tone === 'warn'
              ? 'border-edge bg-mustard text-on-accent'
              : 'border-edge/40 text-ink'
      }`}
    >
      {text}
    </code>
  )

  /** Radio messages popping up inside a node. */
  const bubbles = (at: AcId | 'tower') => (
    <AnimatePresence mode="popLayout" initial={false}>
      {sayAt(at).map((m, i) => (
        <motion.p
          key={`${player.index}-${i}`}
          initial={{ opacity: 0, y: m.tone === 'in' ? -12 : 8, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className={`mt-1.5 rounded-md border-2 px-1.5 py-0.5 text-[11px] leading-snug font-semibold break-words ${
            m.tone === 'bad' ? 'border-chili bg-chili/10 text-chili' : m.tone === 'in' ? 'border-edge/40 bg-paper text-ink' : 'border-edge bg-mustard text-on-accent'
          }`}
        >
          {m.text}
        </motion.p>
      ))}
    </AnimatePresence>
  )

  /* The turn card: situation, dots, the learner's choice. */
  const choices =
    turn.choices &&
    (busy && pick ? (
      <p className="mt-3 rounded-md border-2 border-dashed border-edge/50 px-2 py-1 text-xs font-bold text-ink">
        <span className="label-caps text-ink-soft">{v.yourChoice}:</span>{' '}
        <span className={`break-words ${MONO_OPT.includes(pick) ? 'font-mono' : ''}`} lang={MONO_OPT.includes(pick) ? 'en' : undefined}>
          {optText(pick)}
        </span>
      </p>
    ) : (
      <>
        <p id="md-pick-label" className="mt-3 mb-1.5 label-caps text-ink-soft">
          {turn.ask ? fill(label(turn.ask), values) : ''}
        </p>
        <div role="radiogroup" aria-labelledby="md-pick-label" className="grid grid-cols-1 gap-1.5">
          {turn.choices.map((o) => (
            <ChoiceButton
              key={o}
              selected={pick === o}
              color={accent}
              text={optText(o)}
              onClick={() => choose(o)}
              animate={shake.anim(`o-${o}`)}
              mono={MONO_OPT.includes(o)}
              className="px-2 py-1.5 text-left [&>span:last-child]:whitespace-normal [&>span:last-child]:break-words"
            />
          ))}
        </div>
      </>
    ))

  const turnCard = (
    <div className="mb-3 rounded-xl border-2 border-edge bg-card p-3 shadow-hard-sm">
      <div className="mb-2 flex items-center gap-1.5">
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
      <div className="rounded-lg border-2 border-edge bg-bottle px-3 py-2 text-cream shadow-hard-sm">
        <p className="label-caps text-cream/80">🗼 {v.situationLabel}</p>
        <p className="mt-0.5 text-sm leading-snug font-semibold">{label(turn.situation)}</p>
      </div>
      {level < 3 ? choices : null}
    </div>
  )

  /* One aircraft. */
  const planeNode = (id: AcId) => {
    const a = AC[id]
    const status = snap.status[id]
    const hidden = level === 1 && id !== turn.arriving && !snap.known.includes(id) && status !== 'runway' && status !== 'goAround' && status !== 'parked'
    const stInfo = status ? STATUS[status] : null
    const isNew = id === 'rescue1'
    return (
      <motion.div
        key={id}
        layout
        initial={{ opacity: 0, scale: 0.8, y: -16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="min-w-0"
      >
        <Node
          role={level === 1 ? v.planeRole : v.colleagueRole}
          title={a.call}
          active={active(id)}
          accent={isNew ? NEW_COLOR : level === 1 ? FAIL_COLOR : TOWER_COLOR}
          mono
          className="h-full !p-2.5"
        >
          <p className="-mt-1 truncate text-[11px] text-ink-soft">
            <span aria-hidden="true">{a.icon}</span> {label(a.airline)}
          </p>
          {level > 1 && (
            <p className="mt-0.5 truncate">
              <code lang="en" className={`font-mono text-[10px] ${isNew ? 'rounded bg-mustard px-1 text-on-accent' : 'text-ink-soft'}`}>
                {a.cls}
              </code>
            </p>
          )}
          <p className="mt-1">
            {hidden ? (
              <span className="rounded border-2 border-dashed border-edge/40 px-1.5 text-[11px] font-bold text-ink-soft">? {v.stUnknown}</span>
            ) : stInfo ? (
              <span
                className={`rounded border-2 px-1.5 text-[11px] font-bold ${
                  stInfo.tone === 'ok'
                    ? 'border-bottle text-bottle dark:border-jade dark:text-jade'
                    : stInfo.tone === 'bad'
                      ? 'border-chili bg-chili text-cream'
                      : stInfo.tone === 'warn'
                        ? 'border-edge bg-mustard text-on-accent'
                        : 'border-edge/40 text-ink'
                }`}
              >
                {label(stInfo.label)}
              </span>
            ) : null}
          </p>
          {level === 1 && id === turn.arriving && (
            <p className="mt-1 text-[10px] leading-tight font-semibold text-chili">
              🔗 {fill(v.knowsN, { n: num(turn.planes.length - 1) })}
            </p>
          )}
          {level > 1 && <p className="mt-1 text-[10px] leading-tight font-semibold text-bottle dark:text-jade">🔗 {v.knowsTower}</p>}
          {bubbles(id)}
        </Node>
      </motion.div>
    )
  }

  const airspace = (
    <div>
      <p className="mb-1.5 label-caps text-ink-soft">🌤️ {v.airspace}</p>
      <motion.div layout className="grid grid-cols-2 gap-2">
        <AnimatePresence initial={false}>{snap.present.map((id) => planeNode(id))}</AnimatePresence>
      </motion.div>
    </div>
  )

  /* Level 1: the mesh of direct radio links. */
  const meshPos = MESH_POS[turn.planes.length] ?? MESH_POS[4]
  const posOf = (id: AcId) => meshPos[turn.planes.indexOf(id)]
  const arrived = snap.links === pairs(turn.planes.length)
  const meshLinks: [AcId, AcId][] = []
  turn.planes.forEach((a, i) =>
    turn.planes.slice(i + 1).forEach((b) => {
      if (arrived || (a !== turn.arriving && b !== turn.arriving)) meshLinks.push([a, b])
    }),
  )
  const live = step?.link
  const isLive = (a: AcId, b: AcId) => Boolean(live && ((live[0] === a && live[1] === b) || (live[0] === b && live[1] === a)))
  const meshNode = (
    <Node role={v.noPatternRole} title={v.meshTitle} active={active('mesh')} accent={FAIL_COLOR} className="mb-3">
      <svg viewBox="0 0 300 120" className="mx-auto block h-auto w-full max-w-xs" role="img" aria-label={v.meshTitle}>
        {meshLinks.map(([a, b]) => {
          const [x1, y1] = posOf(a)
          const [x2, y2] = posOf(b)
          const hot = isLive(a, b)
          const fresh = a === turn.arriving || b === turn.arriving
          return (
            <motion.line
              key={`${a}-${b}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              initial={fresh ? { pathLength: 0 } : false}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8 }}
              strokeWidth={hot ? 4 : 2}
              strokeDasharray={fresh && !hot ? '5 4' : undefined}
              className={hot ? 'stroke-chili' : fresh ? 'stroke-chili/60' : 'stroke-edge/40'}
            />
          )
        })}
        {live && (
          <motion.circle
            key={`pkt-${player.index}`}
            r={7}
            className="fill-mustard stroke-edge"
            strokeWidth={2}
            initial={{ cx: posOf(live[0])[0], cy: posOf(live[0])[1] }}
            animate={{ cx: posOf(live[1])[0], cy: posOf(live[1])[1] }}
            transition={{ duration: 0.9, ease: 'easeInOut' }}
          />
        )}
        {turn.planes.map((id) => {
          const [x, y] = posOf(id)
          const hot = live?.includes(id)
          const show = id !== turn.arriving || arrived || busy
          return (
            <g key={id} opacity={show ? 1 : 0.35}>
              <circle cx={x} cy={y} r={14} strokeWidth={2} className={`${hot ? 'fill-mustard' : 'fill-card'} stroke-edge`} />
              <text x={x} y={y + 4} textAnchor="middle" fontSize="12">
                {AC[id].icon}
              </text>
              <text x={x} y={y < 60 ? y - 19 : y + 27} textAnchor="middle" fontSize="11" fontWeight="700" className="fill-ink font-mono">
                {AC[id].call}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
        <motion.span
          key={snap.links}
          initial={{ scale: 1.4 }}
          animate={{ scale: 1 }}
          className="rounded-md border-2 border-edge bg-chili px-2 py-0.5 font-bold text-cream tabular-nums"
        >
          🔗 {fill(v.linksCount, { n: num(snap.links) })}
        </motion.span>
        <span lang="en" className="font-mono text-[11px] text-ink-soft">
          n·(n−1)/2
        </span>
        <span className="text-[11px] text-ink-soft">{v.linksNote}</span>
      </div>
    </Node>
  )

  /* Levels 2-3: the tower. */
  const towerSays = sayAt('tower')
  const towerNode = (
    <Node role={v.mediatorRole} title="SylhetTower" active={active('tower')} accent={TOWER_COLOR} mono>
      <p className="-mt-1 mb-2 text-[11px] text-ink-soft">🗼 {v.towerWho}</p>
      <div className="flex flex-wrap gap-1.5">
        {chip(`runwayFree = ${snap.runwayFree}`, snap.runwayFree ? 'ok' : 'warn')}
        {chip(`queue = [${snap.queue.map(call).join(', ')}]`)}
      </div>
      <p className="mt-1.5 text-[11px] font-semibold text-bottle dark:text-jade">
        🔗 {fill(v.towerLinks, { n: num(snap.present.length) })}
      </p>
      {towerSays.length > 0 && bubbles('tower')}
    </Node>
  )

  /* The runway. */
  const conflictNow = snap.fail === 'conflict' && (kind === 'conflict' || kind === 'goAround' || finished)
  const runwayNode = (
    <Node role={v.runwayRole} title={v.runwayTitle} active={active('runway')} accent={conflictNow ? FAIL_COLOR : OK_COLOR}>
      <motion.div
        animate={kind === 'conflict' ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.5 }}
        className={`relative flex min-h-12 items-center gap-2 overflow-hidden rounded-lg border-2 px-2 py-2 ${
          conflictNow ? 'border-chili bg-chili/15' : 'border-edge bg-[#3a3f3c]'
        }`}
      >
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-2 top-1/2 h-0.5 -translate-y-1/2 border-t-2 border-dashed border-cream/70" />
        <AnimatePresence initial={false}>
          {snap.runway.map((id, i) => (
            <motion.span
              key={id}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0, rotate: kind === 'conflict' ? (i % 2 ? 14 : -14) : 0 }}
              exit={{ opacity: 0, x: 60, y: -20 }}
              transition={{ duration: 0.5 }}
              className="relative z-10"
            >
              <Packet color={AC[id].color}>
                {AC[id].icon} {AC[id].call}
              </Packet>
            </motion.span>
          ))}
        </AnimatePresence>
        {snap.runway.length === 0 && <span className="relative z-10 rounded bg-[#3a3f3c] px-1 text-xs font-bold text-cream">{v.runwayEmpty}</span>}
      </motion.div>
      <AnimatePresence>
        {conflictNow && (
          <motion.p
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: [1, 1.08, 1] }}
            exit={{ opacity: 0 }}
            className="mt-2 rounded-md border-2 border-edge bg-chili px-2 py-1 text-center font-display text-base font-extrabold tracking-wide text-cream"
          >
            🚨 {v.conflictBanner}
          </motion.p>
        )}
        {snap.fail === 'stuck' && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0 }}
            className="mt-2 text-xs font-bold text-chili"
          >
            ⏳ {v.stuckBanner}
          </motion.p>
        )}
      </AnimatePresence>
      <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-soft">
        <span>
          {v.feesLabel}: <b className="text-ink tabular-nums">{money(snap.landed * FEE)}</b>
        </span>
        <span aria-hidden="true">·</span>
        <span>{fill(v.feeEach, { fee: money(FEE) })}</span>
      </p>
    </Node>
  )

  /* Levels 2-3: the two roles behind the scenes. */
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
      <Node role={v.mediatorIfaceRole} title="ControlTower" active={false} accent={TOWER_COLOR} mono className="!bg-paper">
        <code lang="en" className="block font-mono text-[11px] leading-snug text-ink">
          requestLanding(plane)
          <br />
          notify(sender, event)
        </code>
        <p className="mt-1.5 text-[11px] text-ink-soft">{v.towerIfaceNote}</p>
      </Node>
      <Node role={v.colleagueBaseRole} title="Aircraft" active={false} accent={TOWER_COLOR} mono className="!bg-paper">
        <code lang="en" className="block font-mono text-[11px] leading-snug text-ink">
          tower: ControlTower
          <br />
          askToLand() · land() · hold()
        </code>
        <p className="mt-1.5 mb-2 text-[11px] text-ink-soft">{v.aircraftNote}</p>
        <div className="flex flex-wrap gap-1.5">
          {classChip('PassengerPlane', 'old')}
          {classChip('CargoPlane', 'old')}
          {level === 3 && classChip(`Helicopter · ${built ? v.newTag : v.notBuilt}`, built ? 'new' : 'missing')}
        </div>
      </Node>
    </div>
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
            {willSucceed ? '🛬' : lastSnap?.fail === 'conflict' ? '🚨' : '⛽'}
          </motion.span>
          {willSucceed
            ? fill(v.resultOk, { coins: money(pendingCoins) })
            : lastSnap?.fail === 'conflict'
              ? v.resultConflict
              : v.resultStuck}
        </motion.div>
      )}
    </AnimatePresence>
  )

  const conn = (n: 1 | 2) => step?.conns.find((c) => c.n === n && !c.up)
  const connUp = (n: 1 | 2) => step?.conns.find((c) => c.n === n && c.up)
  const pkt = (c: Conn | undefined): ReactNode => (c ? <Packet color={c.color}>{c.text}</Packet> : null)

  /* L3 builder. */
  const builder = (
    <div className="mb-3 flex flex-col gap-3 rounded-lg border-2 border-dashed p-3" style={{ borderColor: NEW_COLOR }}>
      <p className="font-display font-bold text-ink">🔨 {v.builderTitle}</p>
      <div>
        <p className="label-caps text-ink-soft">{v.builderStep1}</p>
        <p className="mb-2 text-sm text-ink">{v.q1}</p>
        <div role="radiogroup" aria-label={v.builderStep1} className="grid grid-cols-1 gap-2">
          {(
            [
              ['allPlanes', v.q1AllPlanes],
              ['tower', v.q1Tower],
              ['runway', v.q1Runway],
            ] as const
          ).map(([a, text]) => (
            <ChoiceButton
              key={a}
              selected={panel !== 'q1' && a === 'tower'}
              color={NEW_COLOR}
              text={text}
              onClick={() => answerQ1(a)}
              animate={shake.anim(`q1-${a}`)}
              className={`[&>span:last-child]:whitespace-normal [&>span:last-child]:break-words ${panel !== 'q1' && a !== 'tower' ? 'opacity-40' : ''}`}
            />
          ))}
        </div>
        {panel !== 'q1' && <NewCodeChip>{"+ class Helicopter extends Aircraft · new Helicopter('Rescue-1', tower)"}</NewCodeChip>}
      </div>

      {panel !== 'q1' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="label-caps text-ink-soft">{v.builderStep2}</p>
          <p className="mb-2 text-sm text-ink">{v.q2}</p>
          <div role="radiogroup" aria-label={v.builderStep2} className="grid grid-cols-1 gap-2">
            {(
              [
                ['radioPlanes', v.q2RadioPlanes],
                ['editPlanes', v.q2EditPlanes],
                ['priority', v.q2Priority],
              ] as const
            ).map(([a, text]) => (
              <ChoiceButton
                key={a}
                selected={panel === 'ready' && a === 'priority'}
                color={NEW_COLOR}
                text={text}
                onClick={() => answerQ2(a)}
                animate={shake.anim(`q2-${a}`)}
                className={`[&>span:last-child]:whitespace-normal [&>span:last-child]:break-words ${panel === 'ready' && a !== 'priority' ? 'opacity-40' : ''}`}
              />
            ))}
          </div>
          {panel === 'ready' && <NewCodeChip>+ override get priority() → true</NewCodeChip>}
        </motion.div>
      )}

      {panel === 'ready' && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full border-2 border-bottle bg-bottle/10 px-2 py-0.5 text-xs font-bold text-bottle dark:border-jade dark:text-jade">
            ✓ {v.zeroEdits}
          </span>
          <Button variant="primary" onClick={flyIn} data-game="open-branch">
            🚁 {v.flyIn}
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
                    {'+ rescue1.others = [???]'}
                  </code>
                </>
              )}
              {level === 2 && <p className="prose-text text-sm text-ink">{v.l2Summary}</p>}
              {level === 3 && (
                <Recap
                  title={v.recapTitle}
                  items={[
                    { icon: '📻', text: v.recap1 },
                    { icon: '🗼', text: v.recap2 },
                    { icon: '🚁', text: v.recap3 },
                  ]}
                />
              )}
            </LevelCompleteCard>
          ) : (
            <motion.div key={`play-${level}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {turnCard}
              {level === 3 && panel && builder}
              {level === 1 && meshNode}
              {airspace}

              {level > 1 && (
                <>
                  <Connector
                    label={snap.noLink ? 'kc33.isLanding() ✗' : 'requestLanding()'}
                    down={Boolean(conn(1))}
                    up={Boolean(connUp(1))}
                    downPacket={pkt(conn(1))}
                    upPacket={pkt(connUp(1))}
                    runKey={player.index}
                  />
                  {towerNode}
                </>
              )}

              <Connector
                label={level === 1 ? 'runway.land(this)' : 'land() · notify()'}
                down={Boolean(conn(2))}
                up={Boolean(connUp(2))}
                downPacket={pkt(conn(2))}
                upPacket={pkt(connUp(2))}
                runKey={player.index}
              />
              {runwayNode}
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
