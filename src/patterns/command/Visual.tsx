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
import type { CodeView, Lang, VisualProps } from '@/types/pattern'
import type { CommandContent } from './content.en'

/*
 * "Karim's order slips at a kacchi house in Old Dhaka": a 3-level game.
 *   Level 1  no pattern: waiter Karim shouts every order straight at cook Rahim mama; the learner picks what
 *            to shout. Shouting twice cooks twice, two shouts at a busy cook lose one, and "cancel the last
 *            one!" cancels the wrong dish, because nothing was written down (`without`)
 *   Level 2  Command: orders become slips (CookDishCommand) pinned on the OrderRail (invoker), which runs them
 *            in order, keeps a history, adds up the bill and undoes the last slip; the learner picks how
 *            Karim hands each situation over (`main`)
 *   Level 3  the learner builds MakeSpicyCommand (2 questions) and the same rail runs and undoes it (`with`)
 * Every turn is a step timeline whose steps carry a snapshot of the restaurant, so the code panel and
 * every node stay in sync.
 */

type Labels = CommandContent['visual']
type LabelKey = keyof Labels
type Dish = 'kacchi' | 'borhani' | 'firni' | 'roast'
type Who = 'nusrat' | 'sumon' | 'tania' | 'mitu' | 'rafiq'
type Opt =
  | 'now'
  | 'twice'
  | 'silent'
  | 'both'
  | 'loud'
  | 'hold'
  | 'last'
  | 'manual'
  | 'vague'
  | 'pin'
  | 'shout'
  | 'pinShout'
  | 'tear'
  | 'undo'
  | 'shoutCancel'
  | 'direct'
  | 'undoTwice'

/* ------------------------------------------------------------------ */
/* Scenario data (made-up names and prices)                            */
/* ------------------------------------------------------------------ */

const OK_COLOR = '#0b6b4f'
const FAIL_COLOR = '#B91C1C'
const SLIP_COLOR = '#92400E'
const CMD_COLOR = '#7C3AED'
const SPICY_COLOR = '#C2410C'
const MUTE_COLOR = '#57534E'

const PRICE: Record<Dish, number> = { kacchi: 350, borhani: 80, firni: 90, roast: 220 }
const SPICY_PRICE = 20
const DISH_ICON: Record<Dish, string> = { kacchi: '🍛', borhani: '🥛', firni: '🍮', roast: '🍗' }
const DISH_LABEL: Record<Dish, LabelKey> = { kacchi: 'dishKacchi', borhani: 'dishBorhani', firni: 'dishFirni', roast: 'dishRoast' }
const WHO_EMOJI: Record<Who, string> = { nusrat: '👩', sumon: '🧑', tania: '👩‍🎓', mitu: '👧', rafiq: '🧔' }
/** Level 1: the waiter calls a different kitchen method for every dish. */
const L1_METHOD: Record<Dish, string> = { kacchi: 'cookKacchi', roast: 'cookRoast', borhani: 'serveCold', firni: 'serveCold' }
/** Level 1: the `without` branch that runs for a dish. */
const l1Code = (d: Dish) => (d === 'kacchi' ? 'l1-kacchi' : d === 'roast' ? 'l1-roast' : 'l1-cold')

interface Order {
  who: Who
  table: number
  dish: Dish
  spicy?: boolean
}
interface Turn {
  /** Served before this turn starts (plates out, slips in the history from level 2). */
  done?: Order[]
  /** New orders in this turn. */
  orders: Order[]
  /** The order (or, in level 3, just its chili) a customer takes back. */
  cancel?: Order
  options?: Opt[]
}

const TURNS: Record<Level, Turn[]> = {
  1: [
    { orders: [{ who: 'nusrat', table: 2, dish: 'kacchi' }], options: ['now', 'twice', 'silent'] },
    {
      orders: [
        { who: 'sumon', table: 4, dish: 'roast' },
        { who: 'tania', table: 5, dish: 'borhani' },
      ],
      options: ['both', 'loud', 'hold'],
    },
    {
      done: [
        { who: 'tania', table: 5, dish: 'borhani' },
        { who: 'mitu', table: 6, dish: 'firni' },
      ],
      orders: [],
      cancel: { who: 'tania', table: 5, dish: 'borhani' },
      options: ['last', 'manual', 'vague'],
    },
  ],
  2: [
    {
      orders: [
        { who: 'sumon', table: 4, dish: 'kacchi' },
        { who: 'tania', table: 5, dish: 'borhani' },
      ],
      options: ['shout', 'pin', 'pinShout'],
    },
    {
      done: [
        { who: 'rafiq', table: 3, dish: 'roast' },
        { who: 'tania', table: 5, dish: 'borhani' },
      ],
      orders: [],
      cancel: { who: 'tania', table: 5, dish: 'borhani' },
      options: ['tear', 'undo', 'shoutCancel'],
    },
    {
      done: [{ who: 'mitu', table: 6, dish: 'firni' }],
      orders: [{ who: 'rafiq', table: 9, dish: 'roast' }],
      cancel: { who: 'rafiq', table: 9, dish: 'roast' },
      options: ['direct', 'undo', 'undoTwice'],
    },
  ],
  3: [
    { orders: [{ who: 'sumon', table: 4, dish: 'kacchi', spicy: true }] },
    {
      done: [{ who: 'tania', table: 5, dish: 'roast', spicy: true }],
      orders: [],
      cancel: { who: 'tania', table: 5, dish: 'roast', spicy: true },
    },
    { orders: [{ who: 'mitu', table: 6, dish: 'borhani', spicy: true }] },
  ],
}
const CORRECT: Opt[] = ['now', 'hold', 'manual', 'pin', 'undo']
/** Level 1, turn 1 is a guided tutorial: the right choice is pre-selected. */
const TUTORIAL_PICK: Opt = 'now'
const OPT: Record<Opt, { icon: string; label: LabelKey }> = {
  now: { icon: '🗣️', label: 'optNow' },
  twice: { icon: '📢', label: 'optTwice' },
  silent: { icon: '🤫', label: 'optSilent' },
  both: { icon: '🗣️', label: 'optBoth' },
  loud: { icon: '📢', label: 'optLoud' },
  hold: { icon: '🧠', label: 'optHold' },
  last: { icon: '↩️', label: 'optLast' },
  manual: { icon: '🏃', label: 'optManual' },
  vague: { icon: '❓', label: 'optVague' },
  pin: { icon: '📌', label: 'optPin' },
  shout: { icon: '🗣️', label: 'optShout' },
  pinShout: { icon: '📢', label: 'optPinShout' },
  tear: { icon: '✂️', label: 'optTear' },
  undo: { icon: '↩️', label: 'optUndo' },
  shoutCancel: { icon: '🗣️', label: 'optShoutCancel' },
  direct: { icon: '🔧', label: 'optDirect' },
  undoTwice: { icon: '⏪', label: 'optUndoTwice' },
}
const MONO_OPTS: Opt[] = ['undo', 'direct', 'undoTwice']
const LEVEL_ICON: Record<Level, string> = { 1: '🗣️', 2: '🧾', 3: '🌶️' }

/* ------------------------------------------------------------------ */
/* Restaurant snapshot                                                 */
/* ------------------------------------------------------------------ */

type SlipKind = 'cook' | 'spicy'
interface Slip {
  id: string
  kind: SlipKind
  order: Order
  price: number
}
type PlateStatus = 'ok' | 'back' | 'wrongBack' | 'wasted' | 'lost' | 'extra'
interface Plate {
  id: string
  order: Order
  status: PlateStatus
  chili: boolean
}
interface Snap {
  /** Slips in Karim's hand. */
  pad: Slip[]
  queue: Slip[]
  history: Slip[]
  /** The slip being executed or undone right now (shown in the ConcreteCommand node). */
  running: Slip | null
  /** A slip torn off the rail without undo(). */
  torn: Slip | null
  plates: Plate[]
  bill: number
  stove: Order | null
  /** Level 1: an order Karim is keeping in his head. */
  head: Order | null
}

const sameOrder = (a: Order, b: Order) => a.who === b.who && a.dish === b.dish && a.table === b.table
const slipOf = (o: Order, kind: SlipKind, id: string): Slip => ({ id, kind, order: o, price: kind === 'cook' ? PRICE[o.dish] : SPICY_PRICE })

function initSnap(level: Level, turnIdx: number): Snap {
  const turn = TURNS[level][turnIdx]
  const snap: Snap = { pad: [], queue: [], history: [], running: null, torn: null, plates: [], bill: 0, stove: null, head: null }
  ;(turn.done ?? []).forEach((o, i) => {
    snap.plates.push({ id: `${level}-${turnIdx}-d${i}`, order: o, status: 'ok', chili: Boolean(o.spicy) })
    snap.bill += PRICE[o.dish] + (o.spicy ? SPICY_PRICE : 0)
    if (level > 1) {
      snap.history.push(slipOf(o, 'cook', `${level}-${turnIdx}-d${i}`))
      if (o.spicy) snap.history.push(slipOf(o, 'spicy', `${level}-${turnIdx}-d${i}s`))
    }
  })
  return snap
}

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

type Kind =
  | 'order'
  | 'orders'
  | 'shout'
  | 'shout2'
  | 'silent'
  | 'wait'
  | 'serve'
  | 'cancel'
  | 'cshout'
  | 'dash'
  | 'direct'
  | 'write'
  | 'pin'
  | 'next'
  | 'exec'
  | 'undo'
  | 'uexec'
  | 'tear'
  | 'bill'
  | 'cook'
  | 'cookShout'
  | 'extra'
  | 'dup'
  | 'lost'
  | 'idle'
  | 'confused'
  | 'uncook'
  | 'wrongBack'
  | 'chili'
  | 'unchili'
  | 'result'
type NodeId = 'client' | 'rail' | 'command' | 'kitchen'

interface GameStep extends PlayerStep {
  kind: Kind
  caption: string
  node: NodeId
  /** The order this step is about (drives the caption values). */
  ref: Order
  /** The slip moving or running in this step, if any. */
  slip: Slip | null
  /** Which connector carries a packet, and which way. */
  conn: 1 | 2 | 3 | null
  up: boolean
  pkt: { text: string; color: string } | null
  /** Level 2+: Karim talks to the kitchen himself, past the rail. */
  bypass: boolean
  snap: Snap
}

const CLIENT_KINDS: Kind[] = ['order', 'orders', 'shout', 'shout2', 'silent', 'wait', 'serve', 'cancel', 'cshout', 'direct', 'write', 'result']
const RAIL_KINDS: Kind[] = ['pin', 'next', 'undo', 'tear']
const CMD_KINDS: Kind[] = ['exec', 'uexec']

function nodeOf(level: Level, kind: Kind): NodeId {
  if (kind === 'bill') return level === 1 ? 'client' : 'rail'
  if (CLIENT_KINDS.includes(kind)) return 'client'
  if (RAIL_KINDS.includes(kind)) return 'rail'
  if (CMD_KINDS.includes(kind)) return 'command'
  return 'kitchen'
}

/** Code step ids match the `// @step:` markers in code/*.ts. */
function codeOf(level: Level, kind: Kind, slip: Slip | null, ref: Order): string {
  if (level === 1) {
    if (kind === 'order' || kind === 'orders' || kind === 'silent' || kind === 'wait' || kind === 'idle') return 'l1-order'
    if (kind === 'serve' || kind === 'bill' || kind === 'result') return 'l1-bill'
    if (kind === 'cancel' || kind === 'cshout' || kind === 'dash') return 'l1-cancel'
    if (kind === 'uncook' || kind === 'wrongBack' || kind === 'confused') return 'l1-undo'
    return l1Code(ref.dish)
  }
  if (level === 3) {
    const spicy = slip?.kind === 'spicy'
    if (kind === 'order') return 'l3-order'
    if (kind === 'write' || kind === 'pin') return 'l3-spicy'
    if (kind === 'next' || kind === 'result') return 'l3-run'
    if (kind === 'cancel' || kind === 'undo') return 'l3-undo'
    if (kind === 'exec') return spicy ? 'spicy-exec' : 'cook-same'
    if (kind === 'chili') return 'spicy-exec'
    if (kind === 'uexec' || kind === 'unchili') return 'spicy-undo'
    if (kind === 'bill') return 'rail-same'
    return 'cook-same'
  }
  const map: Partial<Record<Kind, string>> = {
    order: 'write',
    orders: 'write',
    write: 'write',
    pin: 'pin',
    next: 'run',
    exec: 'exec',
    cancel: 'cancel',
    undo: 'undo',
    uexec: 'undo-exec',
    idle: 'undo-exec',
    uncook: 'uncook',
    wrongBack: 'uncook',
    cshout: 'uncook',
    direct: 'uncook',
    tear: 'tear',
    bill: 'bill',
    result: 'bill',
  }
  return map[kind] ?? 'cook'
}

const DURATION: Partial<Record<Kind, number>> = { cook: 2000, cookShout: 2000, extra: 1800, dup: 1800, chili: 1800, lost: 1800, result: 1700 }

/** Builds a turn's timeline. `add` applies a change to the snapshot, then records a step. */
function buildSteps(level: Level, turnIdx: number, pick: Opt | null, v: Labels, lang: Lang): GameStep[] {
  const turn = TURNS[level][turnIdx]
  if (level < 3 && !pick) return []
  const out: GameStep[] = []
  let s = initSnap(level, turnIdx)
  const id = (x: string) => `${level}-${turnIdx}-${x}`
  const dish = (o: Order) => v[DISH_LABEL[o.dish]]

  const add = (
    kind: Kind,
    ref: Order,
    opts: { caption?: string; change?: (s: Snap) => Snap; slip?: Slip | null; pkt?: GameStep['pkt']; bypass?: boolean } = {},
  ) => {
    if (opts.change) s = opts.change(s)
    const slip = opts.slip ?? null
    const conn: GameStep['conn'] = ['shout', 'shout2', 'silent', 'cshout', 'dash', 'pin', 'direct', 'serve'].includes(kind)
      ? 1
      : kind === 'next' || kind === 'undo'
        ? 2
        : kind === 'exec' || kind === 'uexec'
          ? 3
          : null
    out.push({
      id: `${kind}-${out.length}`,
      codeStep: codeOf(level, kind, slip, ref),
      duration: DURATION[kind] ?? 1500,
      kind,
      caption: opts.caption ?? (level === 1 ? `l1-${kind}` : kind),
      node: nodeOf(level, kind),
      ref,
      slip,
      conn,
      up: kind === 'serve',
      pkt: opts.pkt ?? null,
      bypass: Boolean(opts.bypass),
      snap: s,
    })
  }

  /* snapshot changes */
  const plate = (o: Order, status: PlateStatus, key: string) => (x: Snap): Snap => ({
    ...x,
    stove: status === 'lost' ? x.stove : o,
    plates: [...x.plates, { id: id(key), order: o, status, chili: false }],
  })
  const setPlate = (o: Order, patch: Partial<Plate>) => (x: Snap): Snap => {
    let done = false
    // The most recent matching plate.
    const plates = [...x.plates].reverse().map((p) => {
      if (done || !sameOrder(p.order, o) || p.status !== 'ok') return p
      done = true
      return { ...p, ...patch }
    })
    return { ...x, stove: null, plates: plates.reverse() }
  }
  const billAdd = (n: number) => (x: Snap): Snap => ({ ...x, bill: x.bill + n, stove: null, head: null })
  const shoutPkt = (text: string) => ({ text: `🗣️ ${text}`, color: FAIL_COLOR })
  const slipPkt = (sl: Slip) => ({
    text: `🧾 ${fill(v.tableShort, { n: formatNumber(sl.order.table, lang) })} ${sl.kind === 'spicy' ? '🌶️' : DISH_ICON[sl.order.dish]}`,
    color: SLIP_COLOR,
  })

  /* level 2+: the rail runs the next slip: next → exec → cook/chili */
  const runSlip = (sl: Slip) => {
    add('next', sl.order, {
      slip: sl,
      caption: sl.kind === 'spicy' ? 'spicy-next' : 'next',
      pkt: slipPkt(sl),
      change: (x) => ({ ...x, queue: x.queue.slice(1), running: sl }),
    })
    add('exec', sl.order, {
      slip: sl,
      caption: sl.kind === 'spicy' ? 'spicy-exec' : 'exec',
      pkt: { text: sl.kind === 'spicy' ? `🌶️ addChili` : `🔥 cook`, color: sl.kind === 'spicy' ? SPICY_COLOR : OK_COLOR },
    })
    if (sl.kind === 'spicy') {
      add('chili', sl.order, {
        slip: sl,
        change: (x) => ({
          ...setPlate(sl.order, { chili: true })(x),
          history: [...x.history, sl],
          running: null,
          bill: x.bill + sl.price,
        }),
      })
    } else {
      add('cook', sl.order, {
        slip: sl,
        change: (x) => ({
          ...plate(sl.order, 'ok', `p-${sl.id}`)(x),
          history: [...x.history, sl],
          running: null,
          bill: x.bill + sl.price,
        }),
      })
    }
  }
  /* level 2+: rail.undoLast(): undo → uexec → uncook/unchili */
  const undoLast = (caption?: string) => {
    const sl = s.history[s.history.length - 1]
    if (!sl) return
    add('undo', sl.order, {
      slip: sl,
      caption,
      pkt: { text: '↩ undo()', color: CMD_COLOR },
      change: (x) => ({ ...x, history: x.history.slice(0, -1), running: sl }),
    })
    add('uexec', sl.order, {
      slip: sl,
      caption: sl.kind === 'spicy' ? 'spicy-uexec' : 'uexec',
      pkt: { text: sl.kind === 'spicy' ? '↩ removeChili' : '↩ takeBack', color: CMD_COLOR },
    })
    if (sl.kind === 'spicy') {
      add('unchili', sl.order, { slip: sl, change: (x) => ({ ...setPlate(sl.order, { chili: false })(x), running: null, bill: x.bill - sl.price }) })
    } else {
      const wrong = turn.cancel ? !sameOrder(sl.order, turn.cancel) : false
      add(wrong ? 'wrongBack' : 'uncook', sl.order, {
        slip: sl,
        change: (x) => ({ ...setPlate(sl.order, { status: wrong ? 'wrongBack' : 'back' })(x), running: null, bill: x.bill - sl.price }),
      })
    }
  }
  const writeAndPin = (orders: Order[]) => {
    const slips: Slip[] = []
    orders.forEach((o, i) => {
      slips.push(slipOf(o, 'cook', id(`s${i}`)))
      if (o.spicy) slips.push(slipOf(o, 'spicy', id(`s${i}s`)))
    })
    add('write', orders[0], { caption: level === 3 ? 'l3-write' : 'write', change: (x) => ({ ...x, pad: slips }) })
    add('pin', orders[0], {
      pkt: { text: `🧾 ×${slips.length}`, color: SLIP_COLOR },
      change: (x) => ({ ...x, pad: [], queue: [...x.queue, ...slips] }),
    })
    return slips
  }

  const [o0, o1] = turn.orders
  const c = turn.cancel

  /* ---------------- level 1: shouting ---------------- */
  if (level === 1) {
    switch (pick) {
      case 'now':
        add('order', o0)
        add('shout', o0, { pkt: shoutPkt(`${dish(o0)}!`) })
        add('cook', o0, { change: plate(o0, 'ok', 'p0') })
        add('serve', o0, { pkt: { text: `🍽️ ${DISH_ICON[o0.dish]}`, color: OK_COLOR }, change: (x) => ({ ...x, stove: null }) })
        add('bill', o0, { change: billAdd(PRICE[o0.dish]) })
        add('result', o0, { caption: 'l1-ok' })
        break
      case 'twice':
        add('order', o0)
        add('shout', o0, { pkt: shoutPkt(`${dish(o0)}!`) })
        add('shout2', o0, { pkt: shoutPkt(`${dish(o0)}!!`) })
        add('cook', o0, { change: plate(o0, 'ok', 'p0') })
        add('extra', o0, { change: plate(o0, 'extra', 'p1') })
        add('bill', o0, { change: billAdd(PRICE[o0.dish]) })
        add('result', o0, { caption: 'l1-fail-extra' })
        break
      case 'silent':
        add('order', o0)
        add('silent', o0, { pkt: { text: '🤫 …', color: MUTE_COLOR } })
        add('idle', o0, { caption: 'l1-idle' })
        add('wait', o0)
        add('bill', o0, { caption: 'l1-bill-none' })
        add('result', o0, { caption: 'l1-fail-none' })
        break
      case 'hold':
        add('orders', o0)
        add('shout', o0, { caption: 'l1-shout-hold', pkt: shoutPkt(`${dish(o0)}!`), change: (x) => ({ ...x, head: o1 }) })
        add('cook', o0, { caption: 'l1-cook-hold', change: plate(o0, 'ok', 'p0') })
        add('shout', o1, { caption: 'l1-shout-held', pkt: shoutPkt(`${dish(o1)}!`), change: (x) => ({ ...x, head: null }) })
        add('cook', o1, { change: plate(o1, 'ok', 'p1') })
        add('serve', o1, { pkt: { text: `🍽️ ${DISH_ICON[o0.dish]} ${DISH_ICON[o1.dish]}`, color: OK_COLOR }, change: (x) => ({ ...x, stove: null }) })
        add('bill', o1, { change: billAdd(PRICE[o0.dish] + PRICE[o1.dish]) })
        add('result', o1, { caption: 'l1-ok' })
        break
      case 'both':
      case 'loud': {
        const [heard, lost] = pick === 'both' ? [o0, o1] : [o1, o0]
        add('orders', o0)
        add('shout', heard, {
          caption: pick === 'both' ? 'l1-shout-both' : 'l1-shout-loud',
          pkt: shoutPkt(pick === 'both' ? `${dish(o0)}! ${dish(o1)}!` : `${dish(o0)}! ${dish(o1).toUpperCase()}!!`),
        })
        add('cook', heard, { change: plate(heard, 'ok', 'p0') })
        add('lost', lost, { change: plate(lost, 'lost', 'p1') })
        add('serve', heard, { pkt: { text: `🍽️ ${DISH_ICON[heard.dish]}`, color: OK_COLOR }, change: (x) => ({ ...x, stove: null }) })
        add('bill', heard, { change: billAdd(PRICE[heard.dish]) })
        add('result', lost, { caption: 'l1-fail-lost' })
        break
      }
      case 'manual':
        add('cancel', c!)
        add('dash', c!, { pkt: { text: `🏃 ${v.karim}`, color: FAIL_COLOR } })
        add('uncook', c!, { change: setPlate(c!, { status: 'back' }) })
        add('bill', c!, { caption: 'l1-bill-fix', change: billAdd(-PRICE[c!.dish]) })
        add('result', c!, { caption: 'l1-ok-manual' })
        break
      case 'last': {
        const last = turn.done![turn.done!.length - 1]
        add('cancel', c!)
        add('cshout', c!, { caption: 'l1-cshout-last', pkt: shoutPkt(v.shoutLast) })
        add('wrongBack', last, { change: setPlate(last, { status: 'wrongBack' }) })
        add('bill', c!, { caption: 'l1-bill-fix', change: billAdd(-PRICE[c!.dish]) })
        add('result', c!, { caption: 'l1-fail-wrong' })
        break
      }
      case 'vague':
        add('cancel', c!)
        add('cshout', c!, { caption: 'l1-cshout-vague', pkt: shoutPkt(v.shoutVague) })
        add('confused', c!)
        add('bill', c!, { caption: 'l1-bill-same' })
        add('result', c!, { caption: 'l1-fail-vague' })
        break
    }
    return out
  }

  /* ---------------- level 3: the new command ---------------- */
  if (level === 3) {
    if (c) {
      add('cancel', c, { caption: 'l3-cancel' })
      undoLast('spicy-undo')
      add('bill', c)
      add('result', c, { caption: 'done-new-undo' })
      return out
    }
    add('order', o0, { caption: 'l3-order' })
    const slips = writeAndPin([o0])
    slips.forEach((sl) => runSlip(sl))
    add('result', o0, { caption: 'done-new' })
    return out
  }

  /* ---------------- level 2: slips on the rail ---------------- */
  const bypassPkt = (o: Order[]) => shoutPkt(o.map((x) => `${dish(x)}!`).join(' '))
  switch (pick) {
    case 'pin': {
      add('orders', o0)
      const slips = writeAndPin([o0, o1])
      slips.forEach((sl) => runSlip(sl))
      add('result', o1, { caption: 'done-ok' })
      break
    }
    case 'shout':
      add('orders', o0)
      add('shout', o0, { pkt: bypassPkt([o0, o1]), bypass: true })
      add('cook', o0, { caption: 'cook-bypass', change: plate(o0, 'ok', 'p0') })
      add('lost', o1, { change: plate(o1, 'lost', 'p1') })
      add('bill', o0, { caption: 'bill-empty', change: (x) => ({ ...x, stove: null }) })
      add('result', o1, { caption: 'done-shout' })
      break
    case 'pinShout': {
      add('orders', o0)
      const slips = writeAndPin([o0, o1])
      add('shout', o0, { caption: 'shout-too', pkt: bypassPkt([o0, o1]), bypass: true })
      add('cookShout', o0, { change: (x) => plate(o1, 'ok', 'q1')(plate(o0, 'ok', 'q0')(x)) })
      const sl = slips[0]
      add('next', sl.order, { slip: sl, pkt: slipPkt(sl), change: (x) => ({ ...x, stove: null, queue: x.queue.slice(1), running: sl }) })
      add('exec', sl.order, { slip: sl, pkt: { text: '🔥 cook', color: OK_COLOR } })
      add('dup', sl.order, {
        slip: sl,
        change: (x) => ({ ...plate(sl.order, 'extra', 'x0')(x), history: [...x.history, sl], running: null, bill: x.bill + sl.price }),
      })
      add('result', o0, { caption: 'done-dup' })
      break
    }
    case 'undo':
      if (o0) {
        add('order', o0)
        writeAndPin([o0]).forEach((sl) => runSlip(sl))
      }
      add('cancel', c!)
      undoLast()
      add('bill', c!)
      add('result', c!, { caption: 'done-undo' })
      break
    case 'undoTwice':
      add('order', o0)
      writeAndPin([o0]).forEach((sl) => runSlip(sl))
      add('cancel', c!)
      undoLast()
      undoLast('undo-again')
      add('bill', c!)
      add('result', c!, { caption: 'done-twice' })
      break
    case 'shoutCancel':
    case 'direct':
      if (o0) {
        add('order', o0)
        writeAndPin([o0]).forEach((sl) => runSlip(sl))
      }
      add('cancel', c!)
      add(pick === 'direct' ? 'direct' : 'cshout', c!, {
        pkt: pick === 'direct' ? { text: '🔧 takeBack', color: FAIL_COLOR } : shoutPkt(fill(v.shoutNo, { dish: dish(c!) })),
        bypass: true,
      })
      add('uncook', c!, { caption: 'uncook-bypass', change: setPlate(c!, { status: 'back' }) })
      add('bill', c!, { caption: 'bill-stale' })
      add('result', c!, { caption: 'done-stale' })
      break
    case 'tear':
      add('cancel', c!)
      add('tear', c!, {
        change: (x) => {
          const sl = x.history[x.history.length - 1]
          return { ...x, history: x.history.slice(0, -1), torn: sl, bill: x.bill - sl.price }
        },
      })
      add('idle', c!, { caption: 'idle-torn', change: setPlate(c!, { status: 'wasted' }) })
      add('bill', c!)
      add('result', c!, { caption: 'done-tear' })
      break
  }
  return out
}

/* ------------------------------------------------------------------ */
/* Visual                                                              */
/* ------------------------------------------------------------------ */

export default function CommandVisual({ content, lang, onCodeStep, onCodeView }: VisualProps<CommandContent>) {
  const v = content.visual
  const captions: Record<string, string> = content.steps
  const label = (key: LabelKey) => v[key]

  const { progress, addCoins, completeLevel, reset: resetProgress } = useGameProgress('dpp-command-game')
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

  const willSucceed = level === 3 || (pick !== null && CORRECT.includes(pick))
  const outcome: 'ok' | 'fail' | null = player.done ? (willSucceed ? 'ok' : 'fail') : null
  const turnCoins = willSucceed && steps.length ? steps[steps.length - 1].snap.bill : 0
  const pendingCoins = outcome === 'ok' ? turnCoins : 0
  const accent = level === 1 ? FAIL_COLOR : level === 3 ? SPICY_COLOR : CMD_COLOR

  /* ---------------- code panel sync ---------------- */

  const view: CodeView = level === 1 ? 'without' : level === 2 ? 'main' : 'with'
  useEffect(() => {
    onCodeView?.(view)
  }, [view, onCodeView])
  useEffect(() => () => onCodeView?.('main'), [onCodeView])

  let idleCode: string | null
  if (levelDone) idleCode = level === 1 ? 'l1-copy' : null
  else if (level === 1) idleCode = !pick ? 'l1-order' : turn.cancel ? 'l1-cancel' : l1Code(turn.orders[0].dish)
  else if (level === 2) {
    const idleMap: Record<string, string> = { pin: 'pin', pinShout: 'pin', shout: 'cook', tear: 'tear', undo: 'undo', undoTwice: 'undo', shoutCancel: 'uncook', direct: 'uncook' }
    idleCode = pick ? (idleMap[pick] ?? 'write') : 'write'
  } else idleCode = panel === 'q1' ? 'build-class' : panel === 'q2' ? 'build-receiver' : panel === 'ready' ? 'rail-same' : 'l3-spicy'
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

  const answerQ1 = (a: 'implements' | 'rail' | 'noUndo') => {
    if (panel !== 'q1') return
    if (a === 'implements') {
      setHint(null)
      setPanel('q2')
      return
    }
    shake.bump(`q1-${a}`)
    setMistakes((m) => m + 1)
    setHint({ key: a === 'rail' ? 'wrong-q1-rail' : 'wrong-q1-noundo' })
  }

  const answerQ2 = (a: 'kitchen' | 'self' | 'rail') => {
    if (panel !== 'q2') return
    if (a === 'kitchen') {
      setHint(null)
      setPanel('ready')
      return
    }
    shake.bump(`q2-${a}`)
    setMistakes((m) => m + 1)
    setHint({ key: a === 'self' ? 'wrong-q2-self' : 'wrong-q2-rail' })
  }

  const plugSpicy = () => {
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

  const dishName = (d: Dish) => label(DISH_LABEL[d])
  const tableText = (n: number) => fill(v.tableShort, { n: formatNumber(n, lang) })
  const ref = step?.ref ?? turn.cancel ?? turn.orders[0] ?? turn.done![0]
  const lastDone = turn.done?.[turn.done.length - 1]
  const orderText = (o: Order) => `${label(o.who)} (${tableText(o.table)}): ${dishName(o.dish)}`
  const values: Record<string, string> = {
    name: label(ref.who),
    table: formatNumber(ref.table, lang),
    dish: dishName(ref.dish),
    price: formatTaka(PRICE[ref.dish], lang),
    chili: formatTaka(SPICY_PRICE, lang),
    bill: formatTaka(snap.bill, lang),
    coins: formatTaka(turnCoins, lang),
    orders: turn.orders.map(orderText).join(', '),
    earlier: (turn.done ?? []).map(orderText).join(', '),
    held: turn.orders[1] ? dishName(turn.orders[1].dish) : '',
    cname: turn.cancel ? label(turn.cancel.who) : '',
    cdish: turn.cancel ? dishName(turn.cancel.dish) : '',
    ctable: turn.cancel ? formatNumber(turn.cancel.table, lang) : '',
    lastName: lastDone ? label(lastDone.who) : '',
    lastDish: lastDone ? dishName(lastDone.dish) : '',
    lastTable: lastDone ? formatNumber(lastDone.table, lang) : '',
    choice: pick ? label(OPT[pick].label) : '',
  }

  let captionKey: string
  if (step) captionKey = step.caption
  else if (hint) captionKey = hint.key
  else if (levelDone) captionKey = `level${level}-done`
  else if (panel === 'q1') captionKey = 'build-q1'
  else if (panel === 'q2') captionKey = 'build-q2'
  else if (panel === 'ready') captionKey = 'build-ready'
  else if (level === 3) captionKey = turn.cancel ? 'idle3-cancel' : 'idle3'
  else if (level === 1 && turnIdx === 0 && results.length === 0 && pick === TUTORIAL_PICK) captionKey = 'tutorial'
  else captionKey = pick ? `picked${level}` : `idle${level}-${turnIdx + 1}`
  const caption = fill(captions[captionKey] ?? '', values)

  /* ---------------- pieces ---------------- */

  const turnOf = fill(v.turnOf, { n: formatNumber(turnIdx + 1, lang), total: formatNumber(TURNS[level].length, lang) })
  const finished = stepIs('result')
  const active = (n: NodeId) => step?.node === n
  const refIs = (o: Order) => Boolean(step && sameOrder(step.ref, o))

  const slipCard = (sl: Slip, tone: 'idle' | 'live' | 'done' | 'torn' = 'idle') => (
    <motion.li
      key={sl.id}
      layoutId={`slip-${sl.id}`}
      layout
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1, rotate: tone === 'torn' ? -8 : 0 }}
      exit={{ opacity: 0, scale: 0.6 }}
      transition={{ duration: 0.45 }}
      className={`flex shrink-0 items-center gap-1 rounded-md border-2 px-1.5 py-0.5 text-[11px] font-bold shadow-hard-sm ${
        tone === 'torn'
          ? 'border-chili bg-chili/10 text-chili line-through'
          : tone === 'live'
            ? 'border-edge bg-mustard text-on-accent'
            : tone === 'done'
              ? 'border-edge/60 bg-card text-ink'
              : 'border-edge bg-cream text-[#2b1d16]'
      }`}
    >
      <span aria-hidden="true">{sl.kind === 'spicy' ? '🌶️' : DISH_ICON[sl.order.dish]}</span>
      <span className="tabular-nums">{tableText(sl.order.table)}</span>
      <span className="font-semibold tabular-nums opacity-80">{formatTaka(sl.price, lang)}</span>
    </motion.li>
  )

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

  /* Client: this turn's orders / cancel. */
  const eventRow = (o: Order, i: number, isCancel = false) => {
    const lit = (refIs(o) && stepIs('order', 'cancel')) || (!isCancel && stepIs('orders'))
    const lostNow = snap.plates.some((p) => sameOrder(p.order, o) && p.status === 'lost')
    const price = isCancel && level === 3 ? SPICY_PRICE : PRICE[o.dish]
    return (
      <li
        key={`${isCancel ? 'c' : 'o'}-${i}`}
        className={`flex items-center gap-2 rounded-lg border-2 border-dashed bg-paper p-2 transition-colors ${
          lit ? 'border-edge bg-card' : 'border-edge/50'
        }`}
      >
        <span className="text-2xl" aria-hidden="true">
          {WHO_EMOJI[o.who]}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline justify-between gap-x-2 text-sm font-bold text-ink">
            <span>
              {label(o.who)} <span className="text-xs font-semibold text-ink-soft">· {tableText(o.table)}</span>
            </span>
            <span className="tabular-nums">{isCancel ? `−${formatTaka(price, lang)}` : formatTaka(price + (o.spicy ? SPICY_PRICE : 0), lang)}</span>
          </p>
          <p className={`text-xs ${isCancel ? 'font-bold text-chili' : 'text-ink'}`}>
            {isCancel ? (
              <>
                ✋ {level === 3 ? v.tooHot : fill(v.cancelSays, { dish: dishName(o.dish) })}
              </>
            ) : (
              <>
                <span aria-hidden="true">{DISH_ICON[o.dish]} </span>
                {dishName(o.dish)}
                {o.spicy && <span className="ml-1 rounded bg-chili px-1 text-[10px] font-bold text-cream">🌶️ {v.spicyTag}</span>}
                {lostNow && <span className="ml-1 font-bold text-chili">· {v.neverCame}</span>}
              </>
            )}
          </p>
        </div>
      </li>
    )
  }

  /* Choices for levels 1 and 2. */
  const choices =
    turn.options &&
    (busy && pick ? (
      <p className="mt-3 rounded-md border-2 border-dashed border-edge/50 px-2 py-1 text-xs font-bold text-ink">
        <span className="label-caps text-ink-soft">{v.yourChoice}:</span> <span aria-hidden="true">{OPT[pick].icon}</span> {label(OPT[pick].label)}
      </p>
    ) : (
      <>
        <p id="cmd-pick-label" className="mt-3 mb-1.5 label-caps text-ink-soft">
          {level === 1 ? v.pickLabel1 : v.pickLabel2}
        </p>
        <div role="radiogroup" aria-labelledby="cmd-pick-label" className="grid grid-cols-1 gap-1.5">
          {turn.options.map((o) => (
            <ChoiceButton
              key={o}
              selected={pick === o}
              color={accent}
              text={`${OPT[o].icon}  ${label(OPT[o].label)}`}
              onClick={() => choose(o)}
              animate={shake.anim(`o-${o}`)}
              mono={level === 2 && MONO_OPTS.includes(o)}
              className="px-2 py-1.5 [&>span:last-child]:whitespace-normal"
            />
          ))}
        </div>
      </>
    ))

  const billChip = (text: string, bad = false) => (
    <motion.span
      key={text}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`rounded-md border-2 px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${bad ? 'border-chili bg-chili text-cream' : 'border-edge/50 text-ink'}`}
    >
      🧾 {text}
    </motion.span>
  )

  /* Rail (Invoker). */
  const staleBill = stepIs('bill', 'result') && step?.caption === 'bill-stale'
  const staleNow = level === 2 && (pick === 'shoutCancel' || pick === 'direct') && busy && player.index >= steps.findIndex((x) => x.kind === 'bill')
  const railSkipped = Boolean(step?.bypass) || (level === 2 && pick === 'shout' && busy)
  const railNode = (
    <Node role={v.invokerRole} title="📌 OrderRail" active={active('rail')} accent={accent} mono>
      <div className="flex flex-col gap-2">
        <div className="flex min-h-8 flex-wrap items-center gap-1.5">
          <span className="label-caps w-full text-ink-soft sm:w-auto">{v.queueLabel}:</span>
          <ul className="flex flex-wrap gap-1.5">
            <AnimatePresence initial={false}>{snap.queue.map((sl) => slipCard(sl))}</AnimatePresence>
          </ul>
          {snap.queue.length === 0 && <span className="text-[11px] text-ink-soft">{v.emptyQueue}</span>}
        </div>
        <div className="flex min-h-8 flex-wrap items-center gap-1.5 border-t-2 border-dashed border-edge/30 pt-2">
          <span className="label-caps w-full text-ink-soft sm:w-auto">{v.historyLabel}:</span>
          <ul className="flex flex-wrap gap-1.5">
            <AnimatePresence initial={false}>
              {snap.history.map((sl, i) => slipCard(sl, i === snap.history.length - 1 && stepIs('undo', 'tear') ? 'live' : 'done'))}
              {snap.torn && stepIs('tear') && slipCard({ ...snap.torn, id: `${snap.torn.id}-torn` }, 'torn')}
            </AnimatePresence>
          </ul>
          {snap.history.length === 0 && <span className="text-[11px] text-ink-soft">{v.emptyHistory}</span>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {billChip(fill(v.railBill, { bill: formatTaka(snap.bill, lang) }), staleNow || staleBill)}
          {railSkipped && <span className="text-[11px] font-bold text-chili">⚠️ {v.railSkipped}</span>}
          {snap.torn && !railSkipped && <span className="text-[11px] font-bold text-chili">✂️ {v.tornTag}</span>}
        </div>
      </div>
    </Node>
  )

  /* Command + ConcreteCommand. */
  const running = snap.running
  const shownKind: SlipKind = running?.kind ?? (level === 3 && built ? 'spicy' : 'cook')
  const cmdClass = shownKind === 'spicy' ? 'MakeSpicyCommand' : 'CookDishCommand'
  const methodRow = (name: string, call: string, on: boolean, done: boolean) => (
    <li
      className={`flex min-w-0 items-center gap-2 rounded-md border-2 px-2 py-1 text-[11px] ${on ? 'border-edge bg-card shadow-hard-sm' : 'border-transparent'}`}
    >
      <StatusDot status={on ? 'active' : done ? 'done' : 'pending'} color={accent} />
      <code lang="en" className="shrink-0 font-mono font-bold text-ink">
        {name}
      </code>
      <code lang="en" className="min-w-0 truncate font-mono text-ink-soft">
        → {call}
      </code>
    </li>
  )
  const execDone = busy && steps.slice(0, player.index + 1).some((x) => x.kind === 'exec' && x.slip?.id === running?.id)
  const commandNode = (
    <Node role={v.commandRole} title="OrderCommand" active={false} accent={CMD_COLOR} mono className="!bg-paper">
      <p className="-mt-1 mb-3 text-[11px] text-ink-soft">{v.commandNote}</p>
      {level === 3 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          <code lang="en" className="rounded border-2 border-edge/40 px-1.5 font-mono text-[10px] text-ink">
            CookDishCommand
          </code>
          <code
            lang="en"
            className={`rounded border-2 px-1.5 font-mono text-[10px] ${built ? 'border-edge bg-mustard text-on-accent' : 'border-dashed border-edge/40 text-ink-soft'}`}
          >
            MakeSpicyCommand {built ? `· ${v.newTag}` : `· ${v.notBuilt}`}
          </code>
        </div>
      )}
      <Node role={v.concreteRole} title={cmdClass} active={active('command')} accent={shownKind === 'spicy' ? SPICY_COLOR : CMD_COLOR} mono>
        <div className="mb-2 flex min-h-7 items-center gap-2">
          <span className="label-caps text-ink-soft">{v.slipLabel}:</span>
          <ul className="flex">
            <AnimatePresence initial={false}>{running && slipCard(running, 'live')}</AnimatePresence>
          </ul>
          {!running && <span className="text-[11px] text-ink-soft">{v.noSlip}</span>}
        </div>
        <ol className="flex flex-col gap-1">
          {methodRow('execute()', shownKind === 'spicy' ? 'kitchen.addChili(…)' : 'kitchen.cook(…)', stepIs('exec'), execDone && !stepIs('undo', 'uexec'))}
          {methodRow('undo()', shownKind === 'spicy' ? 'kitchen.removeChili(…)' : 'kitchen.takeBack(…)', stepIs('uexec'), false)}
        </ol>
      </Node>
    </Node>
  )

  /* Kitchen (Receiver). */
  const cooking = stepIs('cook', 'cookShout', 'extra', 'dup', 'chili')
  const kitchenNote: { text: string; tone: 'ok' | 'bad' | 'idle' | 'info'; icon: string } = stepIs('lost')
    ? { text: fill(v.didntHear, { dish: dishName(step!.ref.dish) }), tone: 'bad', icon: '👂' }
    : stepIs('confused')
      ? { text: v.cancelWhat, tone: 'bad', icon: '🤷' }
      : stepIs('idle')
        ? { text: level === 1 ? v.heardNothing : v.neverTold, tone: 'bad', icon: '😶' }
        : stepIs('extra', 'dup')
          ? { text: fill(v.cookingAgain, { dish: dishName(step!.ref.dish) }), tone: 'bad', icon: '🔥' }
          : stepIs('chili')
            ? { text: fill(v.addingChili, { dish: dishName(step!.ref.dish) }), tone: 'info', icon: '🌶️' }
            : stepIs('unchili')
              ? { text: fill(v.removingChili, { dish: dishName(step!.ref.dish) }), tone: 'info', icon: '↩️' }
              : stepIs('uncook', 'wrongBack')
                ? { text: fill(v.takingBack, { dish: dishName(step!.ref.dish), table: tableText(step!.ref.table) }), tone: stepIs('wrongBack') ? 'bad' : 'info', icon: '↩️' }
                : cooking
                  ? { text: fill(v.cooking, { dish: dishName(step!.ref.dish), table: tableText(step!.ref.table) }), tone: 'info', icon: '🔥' }
                  : { text: v.stoveIdle, tone: 'idle', icon: '🍳' }
  const plateTone: Record<PlateStatus, string> = {
    ok: 'border-edge/60 bg-card text-ink',
    back: 'border-edge/30 bg-paper text-ink-soft line-through opacity-60',
    wrongBack: 'border-chili bg-chili text-cream line-through',
    wasted: 'border-chili bg-chili text-cream',
    lost: 'border-dashed border-chili text-chili',
    extra: 'border-chili bg-chili text-cream',
  }
  const plateTag: Partial<Record<PlateStatus, LabelKey>> = { wasted: 'wastedTag', lost: 'lostTag', extra: 'extraTag', wrongBack: 'wrongTag' }
  const kitchenNode = (
    <Node role={v.receiverRole} title={`🍳 ${v.kitchenTitle}`} active={active('kitchen')} accent={stepIs('lost', 'extra', 'dup', 'wrongBack', 'idle', 'confused') ? FAIL_COLOR : OK_COLOR}>
      <div className="flex flex-col gap-2">
        {statusLine(kitchenNote.text, kitchenNote.tone, kitchenNote.icon)}
        <div className="h-2.5 overflow-hidden rounded-full border-2 border-edge/50 bg-paper" aria-hidden="true">
          {cooking && (
            <motion.div
              key={`bar-${player.index}`}
              className="h-full bg-chili"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: (step?.duration ?? 2000) / 1000 / player.speed, ease: 'linear' }}
            />
          )}
        </div>
        <div className="flex min-h-8 flex-wrap items-center gap-1.5">
          <span className="label-caps text-ink-soft">{v.platesLabel}:</span>
          <AnimatePresence initial={false}>
            {snap.plates.map((p) => {
              const tag = plateTag[p.status]
              return (
                <motion.span
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: -10, scale: 0.7 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`inline-flex items-center gap-1 rounded-md border-2 px-1.5 py-0.5 text-[11px] font-bold ${plateTone[p.status]}`}
                >
                  <span aria-hidden="true">{DISH_ICON[p.order.dish]}</span>
                  {p.chili && (
                    <motion.span aria-hidden="true" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      🌶️
                    </motion.span>
                  )}
                  <span className="tabular-nums">{tableText(p.order.table)}</span>
                  {tag && <span className="text-[10px] uppercase">· {label(tag)}</span>}
                </motion.span>
              )
            })}
          </AnimatePresence>
          {snap.plates.length === 0 && <span className="text-[11px] text-ink-soft">{v.noPlates}</span>}
        </div>
      </div>
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
            {willSucceed ? '✅' : '😵'}
          </motion.span>
          {willSucceed ? fill(v.resultOk, { coins: formatTaka(turnCoins, lang) }) : v.resultBad}
        </motion.div>
      )}
    </AnimatePresence>
  )

  const pkt = (n: 1 | 2 | 3): ReactNode => (step?.conn === n && step.pkt ? <Packet color={step.pkt.color}>{step.pkt.text}</Packet> : null)
  const connDown = (n: 1 | 2 | 3) => step?.conn === n && !step.up
  const conn1Label =
    level === 1
      ? turn.cancel
        ? 'kitchen.throwAway(…)'
        : `kitchen.${L1_METHOD[ref.dish]}(${ref.table})`
      : step?.bypass
        ? stepIs('shout')
          ? 'kitchen.cook(…) ⚠'
          : 'kitchen.takeBack(…) ⚠'
        : 'rail.pin(slip)'
  const conn3Label = (() => {
    const spicy = (step?.slip?.kind ?? shownKind) === 'spicy'
    if (stepIs('uexec')) return spicy ? 'kitchen.removeChili(…)' : 'kitchen.takeBack(…)'
    return spicy ? 'kitchen.addChili(…)' : 'kitchen.cook(…)'
  })()

  /* L3 builder. */
  const builder = (
    <div className="mt-3 flex flex-col gap-3 rounded-lg border-2 border-dashed p-3" style={{ borderColor: SPICY_COLOR }}>
      <p className="font-display font-bold text-ink">🔨 {v.builderTitle}</p>
      <div>
        <p className="label-caps text-ink-soft">{v.builderStep1}</p>
        <p className="mb-2 text-sm text-ink">{v.q1}</p>
        <div role="radiogroup" aria-label={v.builderStep1} className="grid grid-cols-1 gap-2">
          {(
            [
              ['rail', v.q1Rail, true],
              ['implements', v.q1Implements, true],
              ['noUndo', v.q1NoUndo, false],
            ] as const
          ).map(([a, text, mono]) => (
            <ChoiceButton
              key={a}
              selected={panel !== 'q1' && a === 'implements'}
              color={SPICY_COLOR}
              text={text}
              onClick={() => answerQ1(a)}
              animate={shake.anim(`q1-${a}`)}
              mono={mono}
              className={`[&>span:last-child]:whitespace-normal ${panel !== 'q1' && a !== 'implements' ? 'opacity-40' : ''}`}
            />
          ))}
        </div>
        {panel !== 'q1' && <NewCodeChip>+ class MakeSpicyCommand implements OrderCommand</NewCodeChip>}
      </div>

      {panel !== 'q1' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="label-caps text-ink-soft">{v.builderStep2}</p>
          <p className="mb-2 text-sm text-ink">{v.q2}</p>
          <div role="radiogroup" aria-label={v.builderStep2} className="grid grid-cols-1 gap-2">
            {(
              [
                ['self', v.q2Self],
                ['rail', v.q2Rail],
                ['kitchen', v.q2Kitchen],
              ] as const
            ).map(([a, text]) => (
              <ChoiceButton
                key={a}
                selected={panel === 'ready' && a === 'kitchen'}
                color={SPICY_COLOR}
                text={text}
                onClick={() => answerQ2(a)}
                animate={shake.anim(`q2-${a}`)}
                className={`[&>span:last-child]:whitespace-normal ${panel === 'ready' && a !== 'kitchen' ? 'opacity-40' : ''}`}
              />
            ))}
          </div>
          {panel === 'ready' && <NewCodeChip>+ execute() {'{'} kitchen.addChili(…) {'}'}</NewCodeChip>}
        </motion.div>
      )}

      {panel === 'ready' && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full border-2 border-bottle bg-bottle/10 px-2 py-0.5 text-xs font-bold text-bottle dark:border-jade dark:text-jade">
            ✓ {v.zeroEdits}
          </span>
          <Button variant="primary" onClick={plugSpicy} data-game="open-branch">
            🌶️ {v.useSpicy}
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
                    {'+ kitchen.makeSpicy() ???'}
                  </code>
                </>
              )}
              {level === 2 && <p className="prose-text text-sm text-ink">{v.l2Summary}</p>}
              {level === 3 && (
                <Recap
                  title={v.recapTitle}
                  items={[
                    { icon: '🗣️', text: v.recap1 },
                    { icon: '🧾', text: v.recap2 },
                    { icon: '🌶️', text: v.recap3 },
                  ]}
                />
              )}
            </LevelCompleteCard>
          ) : (
            <motion.div key={`play-${level}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* ── Client: Karim, this turn's orders and the learner's choice ── */}
              <Node role={v.clientRole} title={`🧍 ${v.waiterTitle}`} active={active('client')} accent={accent}>
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
                    className="flex flex-col gap-2"
                  >
                    {turn.orders.map((o, i) => eventRow(o, i))}
                    {turn.cancel && eventRow(turn.cancel, 0, true)}
                  </motion.ul>
                </AnimatePresence>
                {turn.done && (
                  <p className="mt-1.5 text-[11px] text-ink-soft">
                    {fill(v.earlier, { earlier: values.earlier })}
                  </p>
                )}

                {level === 1 ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {billChip(fill(v.headBill, { bill: formatTaka(snap.bill, lang) }))}
                    {snap.head && (
                      <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="rounded-md border-2 border-dashed border-chili px-1.5 py-0.5 text-[11px] font-bold text-chili">
                        🧠 {fill(v.inHead, { dish: dishName(snap.head.dish), table: tableText(snap.head.table) })}
                      </motion.span>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 flex min-h-8 flex-wrap items-center gap-1.5">
                    <span className="label-caps text-ink-soft">{v.padLabel}:</span>
                    <ul className="flex flex-wrap gap-1.5">
                      <AnimatePresence initial={false}>{snap.pad.map((sl) => slipCard(sl))}</AnimatePresence>
                    </ul>
                    {snap.pad.length === 0 && <span className="text-[11px] text-ink-soft">{v.padEmpty}</span>}
                  </div>
                )}

                {level < 3 ? (
                  <>
                    {choices}
                    <p
                      className={`mt-2 border-t-2 border-dashed border-edge/40 pt-2 text-xs font-semibold ${level === 1 ? 'text-chili' : 'text-ink'}`}
                    >
                      {level === 1 ? `⚠️ ${v.knowsL1}` : `✓ ${v.knowsL2}`}
                    </p>
                  </>
                ) : panel ? null : (
                  <>
                    <p className="mt-2 text-xs font-semibold text-ink">✓ {v.knowsL2}</p>
                    <p className="mt-1 text-xs font-semibold text-bottle dark:text-jade">{v.othersSame}</p>
                  </>
                )}
              </Node>

              {level === 3 && panel && builder}

              <Connector
                label={conn1Label}
                down={connDown(1)}
                up={step?.conn === 1 && step.up}
                downPacket={pkt(1)}
                upPacket={pkt(1)}
                runKey={player.index}
              />

              {level === 1 ? (
                <>
                  <div className="mb-0 flex min-w-0 items-center gap-2 rounded-xl border-2 border-dashed border-edge/50 p-2 text-xs text-ink-soft">
                    <span aria-hidden="true">🗣️</span>
                    <span className="min-w-0">{v.noSlips}</span>
                  </div>
                  <Connector label="" down={false} runKey={player.index} />
                  {kitchenNode}
                </>
              ) : (
                <>
                  {railNode}
                  <Connector
                    label={stepIs('undo') ? 'slip.undo()' : 'slip.execute()'}
                    down={connDown(2)}
                    downPacket={pkt(2)}
                    runKey={player.index}
                  />
                  {commandNode}
                  <Connector label={conn3Label} down={connDown(3)} downPacket={pkt(3)} runKey={player.index} />
                  {kitchenNode}
                </>
              )}
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

