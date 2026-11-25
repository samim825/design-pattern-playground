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
import type { InterpreterContent } from './content.en'

/*
 * "Mitu's Eid discount rules at a saree shop in New Market": a 3-level game.
 *   Level 1  no pattern: every offer on the board becomes an if inside checkout(). The learner picks how
 *            to edit the if/else chain; each turn costs an edit + a redeploy, and a misplaced branch gives a
 *            double discount or too little (`without`)
 *   Level 2  Interpreter: a rule is a tree of TotalAbove / CategoryIs / And objects; the learner picks the
 *            blocks for the board's wording and the counter calls rule.interpret(cart) (`main`)
 *   Level 3  the learner builds an Or class (2 questions) and uses it nested with the old blocks (`with`)
 * Every turn is a step timeline whose steps carry a snapshot, so the code panel and every node stay in sync.
 */

type Labels = InterpreterContent['visual']
type LabelKey = keyof Labels

/* ------------------------------------------------------------------ */
/* The rule language                                                   */
/* ------------------------------------------------------------------ */

type Cat = 'saree' | 'panjabi' | 'lungi'
type Who = 'nusrat' | 'rahim' | 'tania' | 'karim'
interface Cart {
  who: Who
  cat: Cat
  total: number
}
type Expr = { t: 'total'; n: number } | { t: 'cat'; name: Cat } | { t: 'and' | 'or'; l: Expr; r: Expr }

const above = (n: number): Expr => ({ t: 'total', n })
const isCat = (name: Cat): Expr => ({ t: 'cat', name })
const and = (l: Expr, r: Expr): Expr => ({ t: 'and', l, r })
const or = (l: Expr, r: Expr): Expr => ({ t: 'or', l, r })

function evalExpr(e: Expr, c: Cart): boolean {
  if (e.t === 'total') return c.total > e.n
  if (e.t === 'cat') return c.cat === e.name
  return e.t === 'and' ? evalExpr(e.l, c) && evalExpr(e.r, c) : evalExpr(e.l, c) || evalExpr(e.r, c)
}

/** The block's class name, as in the code: TotalAbove(3000), CategoryIs("saree"), And, Or. */
const blockName = (e: Expr) => (e.t === 'total' ? `TotalAbove(${e.n})` : e.t === 'cat' ? `CategoryIs("${e.name}")` : e.t === 'and' ? 'And' : 'Or')
/** The whole tree as constructor calls: And(CategoryIs("saree"), TotalAbove(3000)). */
const treeCode = (e: Expr): string => (e.t === 'and' || e.t === 'or' ? `${blockName(e)}(${treeCode(e.l)}, ${treeCode(e.r)})` : blockName(e))
/** An if-condition in checkout(): category == "saree" && total > 3000. */
function condCode(e: Expr, parent?: 'and' | 'or'): string {
  if (e.t === 'total') return `total > ${e.n}`
  if (e.t === 'cat') return `category == "${e.name}"`
  const s = `${condCode(e.l, e.t)} ${e.t === 'and' ? '&&' : '||'} ${condCode(e.r, e.t)}`
  return parent && parent !== e.t ? `(${s})` : s
}

/* ------------------------------------------------------------------ */
/* Scenario data (made-up names and amounts)                           */
/* ------------------------------------------------------------------ */

const OK_COLOR = '#0b6b4f'
const FAIL_COLOR = '#B91C1C'
const CART_COLOR = '#92400E'
const TREE_COLOR = '#7C3AED'
const OR_COLOR = '#C2410C'

const WHO_EMOJI: Record<Who, string> = { nusrat: '👩', rahim: '🧔', tania: '👩‍🎓', karim: '🧑' }
const ITEM: Record<Cat, { icon: string; label: LabelKey }> = {
  saree: { icon: '🥻', label: 'itemSaree' },
  panjabi: { icon: '👘', label: 'itemPanjabi' },
  lungi: { icon: '🧣', label: 'itemLungi' },
}
const cart = (who: Who, cat: Cat, total: number): Cart => ({ who, cat, total })

type RuleId = 'saree' | 'big' | 'panjabi'
/** The offers Mitu apa writes on the board, and the checkout() line (code step) each one becomes. */
const RULES: Record<RuleId, { expr: Expr; pct: number; label: LabelKey; code: string }> = {
  saree: { expr: and(isCat('saree'), above(3000)), pct: 10, label: 'ruleSaree', code: 'l1-saree' },
  big: { expr: above(5000), pct: 15, label: 'ruleBig', code: 'l1-big' },
  panjabi: { expr: and(isCat('panjabi'), above(2000)), pct: 5, label: 'rulePanjabi', code: 'l1-panjabi' },
}

/** Level 1: one line of checkout()'s if/else chain. `add` is a separate `if (…) percent += n`. */
type Kw = 'if' | 'elif' | 'add'
interface Branch {
  rule: RuleId
  kw: Kw
  expr: Expr
  pct: number
}
const br = (rule: RuleId, kw: Kw, expr: Expr = RULES[rule].expr): Branch => ({ rule, kw, expr, pct: RULES[rule].pct })

type Opt =
  | 'and'
  | 'or'
  | 'noCat'
  | 'top'
  | 'extra'
  | 'bottom'
  | 'last'
  | 'first'
  | 'reuse'
  | 'ok1'
  | 'catOnly'
  | 'amount'
  | 'ok2'
  | 'wrongCat'
  | 'noCat2'
  | 'ok3'
  | 'andSaree'
  | 'zero'
interface Choice {
  id: Opt
  /** Level 1: checkout()'s branches after the edit, and which lines were touched. */
  branches?: Branch[]
  changed?: number[]
  /** Level 2: the tree of blocks. */
  expr?: Expr
}
interface Turn {
  /** Levels 1-2: the offers on the board (level 1 keeps the earlier ones; the last one is new). */
  rules?: RuleId[]
  /** Level 3: today's offer, built with Or. */
  label?: LabelKey
  expr?: Expr
  carts: Cart[]
  start?: Branch[]
  choices?: Choice[]
}

const L3_PCT = 10
const TURNS: Record<Level, Turn[]> = {
  1: [
    {
      rules: ['saree'],
      carts: [cart('nusrat', 'saree', 3450), cart('rahim', 'panjabi', 3200)],
      start: [],
      choices: [
        { id: 'and', branches: [br('saree', 'if')], changed: [0] },
        { id: 'or', branches: [br('saree', 'if', or(isCat('saree'), above(3000)))], changed: [0] },
        { id: 'noCat', branches: [br('saree', 'if', above(3000))], changed: [0] },
      ],
    },
    {
      rules: ['saree', 'big'],
      carts: [cart('nusrat', 'saree', 6000), cart('rahim', 'panjabi', 5500)],
      start: [br('saree', 'if')],
      choices: [
        { id: 'extra', branches: [br('saree', 'if'), br('big', 'add')], changed: [1] },
        { id: 'top', branches: [br('big', 'if'), br('saree', 'elif')], changed: [0, 1] },
        { id: 'bottom', branches: [br('saree', 'if'), br('big', 'elif')], changed: [1] },
      ],
    },
    {
      rules: ['saree', 'big', 'panjabi'],
      carts: [cart('karim', 'panjabi', 2400), cart('rahim', 'panjabi', 5500), cart('tania', 'saree', 2500)],
      start: [br('big', 'if'), br('saree', 'elif')],
      choices: [
        { id: 'first', branches: [br('panjabi', 'if'), br('big', 'elif'), br('saree', 'elif')], changed: [0, 1] },
        { id: 'reuse', branches: [br('big', 'if'), br('saree', 'elif', and(or(isCat('saree'), isCat('panjabi')), above(2000)))], changed: [1] },
        { id: 'last', branches: [br('big', 'if'), br('saree', 'elif'), br('panjabi', 'elif')], changed: [2] },
      ],
    },
  ],
  2: [
    {
      rules: ['saree'],
      carts: [cart('nusrat', 'saree', 3450), cart('tania', 'saree', 1200)],
      choices: [
        { id: 'catOnly', expr: isCat('saree') },
        { id: 'ok1', expr: and(isCat('saree'), above(3000)) },
        { id: 'amount', expr: and(isCat('saree'), above(300)) },
      ],
    },
    {
      rules: ['panjabi'],
      carts: [cart('karim', 'panjabi', 2400), cart('tania', 'saree', 2500)],
      choices: [
        { id: 'wrongCat', expr: and(isCat('saree'), above(2000)) },
        { id: 'noCat2', expr: above(2000) },
        { id: 'ok2', expr: and(isCat('panjabi'), above(2000)) },
      ],
    },
    {
      rules: ['big'],
      carts: [cart('rahim', 'panjabi', 5500), cart('nusrat', 'saree', 3450)],
      choices: [
        { id: 'ok3', expr: above(5000) },
        { id: 'andSaree', expr: and(isCat('saree'), above(5000)) },
        { id: 'zero', expr: above(500) },
      ],
    },
  ],
  3: [
    { label: 'ruleEid1', expr: or(isCat('saree'), above(5000)), carts: [cart('tania', 'saree', 1200), cart('rahim', 'panjabi', 5500)] },
    {
      label: 'ruleEid2',
      expr: or(and(isCat('saree'), above(3000)), above(5000)),
      carts: [cart('nusrat', 'saree', 3450), cart('karim', 'panjabi', 2400)],
    },
    {
      label: 'ruleEid3',
      expr: and(or(isCat('panjabi'), isCat('lungi')), above(2000)),
      carts: [cart('rahim', 'lungi', 2200), cart('tania', 'saree', 2500)],
    },
  ],
}
/** Level 1, turn 1 is a guided tutorial: the right choice is pre-selected. */
const TUTORIAL_PICK: Opt = 'and'
const OPT_LABEL: Partial<Record<Opt, LabelKey>> = {
  and: 'optAnd',
  or: 'optOr',
  noCat: 'optNoCat',
  top: 'optTop',
  extra: 'optExtra',
  bottom: 'optBottom',
  last: 'optLast',
  first: 'optFirst',
  reuse: 'optReuse',
}
const LEVEL_ICON: Record<Level, string> = { 1: '✏️', 2: '🧩', 3: '🌙' }

/** What the board promises: the best matching offer (level 1), or today's single offer. */
function expectedPct(level: Level, turn: Turn, c: Cart): number {
  if (level === 3) return evalExpr(turn.expr!, c) ? L3_PCT : 0
  return Math.max(0, ...turn.rules!.map((r) => (evalExpr(RULES[r].expr, c) ? RULES[r].pct : 0)))
}

/** Level 1: run checkout()'s if/else chain like the real code does. */
function runChain(branches: Branch[], c: Cart): { pct: number; hits: number[] } {
  let pct = 0
  let chainHit = false
  const hits: number[] = []
  branches.forEach((b, i) => {
    if (b.kw !== 'elif') chainHit = false
    if (chainHit || !evalExpr(b.expr, c)) return
    hits.push(i)
    chainHit = true
    pct = b.kw === 'add' ? pct + b.pct : b.pct
  })
  return { pct, hits }
}

const paidFor = (c: Cart, pct: number) => (c.total * (100 - pct)) / 100

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

type Kind = 'rule' | 'edit' | 'deploy' | 'build' | 'cart' | 'check' | 'enter' | 'leaf' | 'combine' | 'result' | 'end'
type NodeVal = 'ask' | 'yes' | 'no' | 'skip'
interface Paid {
  pct: number
  expected: number
}
interface Snap {
  /** The cart at the counter (-1: none yet). */
  cartIdx: number
  /** Expression node (by path: r, rl, rr, rll…) → its state for the current cart. */
  vals: Record<string, NodeVal>
  /** Nonterminal path → [left answer, right answer or null when skipped]. */
  sides: Record<string, [boolean, boolean | null]>
  paid: (Paid | null)[]
  /** Level 1: checkout()'s branches, lines just edited, lines that matched. */
  branches: Branch[]
  changed: number[]
  hits: number[]
  edits: number
  deploys: number
  deploying: boolean
  /** Levels 2-3: the tree has been built for this turn. */
  built: boolean
}
interface GameStep extends PlayerStep {
  kind: Kind
  caption: string
  /** Caption placeholder values. */
  cv: Record<string, string>
  /** 'client' | 'checkout' | an expression path. */
  node: string
  conn: { n: 1 | 2; up: boolean; text: string; color: string } | null
  read: 'total' | 'category' | 'both' | null
  snap: Snap
}

function initSnap(level: Level, turnIdx: number): Snap {
  const turn = TURNS[level][turnIdx]
  return {
    cartIdx: -1,
    vals: {},
    sides: {},
    paid: turn.carts.map(() => null),
    branches: turn.start ?? [],
    changed: [],
    hits: [],
    edits: level === 1 ? turnIdx : 0,
    deploys: level === 1 ? turnIdx : 0,
    deploying: false,
    built: false,
  }
}

/** Every path in a subtree (for marking a skipped child). */
function pathsOf(e: Expr, path: string): string[] {
  return e.t === 'and' || e.t === 'or' ? [path, ...pathsOf(e.l, `${path}l`), ...pathsOf(e.r, `${path}r`)] : [path]
}

const DURATION: Partial<Record<Kind, number>> = {
  rule: 1500,
  edit: 1800,
  deploy: 1800,
  build: 1600,
  cart: 1200,
  check: 1800,
  enter: 1200,
  leaf: 1500,
  combine: 1500,
  result: 1700,
  end: 1800,
}

const pctText = (n: number, lang: Lang) => `${formatNumber(n, lang)}%`

/** Builds a turn's timeline. `add` applies a change to the snapshot, then records a step. */
function buildSteps(level: Level, turnIdx: number, pick: Opt | null, v: Labels, lang: Lang): GameStep[] {
  const turn = TURNS[level][turnIdx]
  const choice = turn.choices?.find((c) => c.id === pick)
  if (level < 3 && !choice) return []
  const out: GameStep[] = []
  let s = initSnap(level, turnIdx)
  const money = (n: number) => formatTaka(n, lang)

  const add = (
    kind: Kind,
    node: string,
    codeStep: string,
    opts: { caption?: string; cv?: Record<string, string>; change?: (x: Snap) => Snap; conn?: GameStep['conn']; read?: GameStep['read'] } = {},
  ) => {
    if (opts.change) s = opts.change(s)
    out.push({
      id: `${kind}-${out.length}`,
      codeStep,
      duration: DURATION[kind] ?? 1400,
      kind,
      caption: opts.caption ?? kind,
      cv: opts.cv ?? {},
      node,
      conn: opts.conn ?? null,
      read: opts.read ?? null,
      snap: s,
    })
  }

  const cartVals = (c: Cart) => ({ name: v[c.who], item: v[ITEM[c.cat].label], total: money(c.total) })
  const down = (text: string, color = CART_COLOR) => ({ n: 1 as const, up: false, text, color })

  /* The customer pays: compare what the code gave with what the board promises. */
  const pay = (c: Cart, i: number, pct: number, prefix: 'l1-pay' | 'result', upText: string) => {
    const expected = expectedPct(level, turn, c)
    const key = pct === expected ? (pct > 0 ? 'yes' : 'no') : pct > expected ? 'loss' : 'short'
    add('result', 'client', level === 1 ? 'l1-pay' : 'result', {
      caption: `${prefix}-${key}`,
      cv: {
        ...cartVals(c),
        pct: pctText(pct, lang),
        expected: pctText(expected, lang),
        paid: money(paidFor(c, pct)),
        diff: money(Math.abs(paidFor(c, pct) - paidFor(c, expected))),
      },
      conn: { n: 1, up: true, text: upText, color: pct === expected ? OK_COLOR : FAIL_COLOR },
      change: (x) => ({ ...x, paid: x.paid.map((p, j) => (j === i ? { pct, expected } : p)) }),
    })
  }

  const finish = () => {
    const last = s
    const ok = last.paid.every((p) => p && p.pct === p.expected)
    const coins = turn.carts.reduce((sum, c, i) => sum + paidFor(c, last.paid[i]?.pct ?? 0), 0)
    const caption = level === 1 ? (ok ? 'l1-ok' : `l1-fail-${pick}`) : level === 2 ? (ok ? 'done-ok' : `done-${pick}`) : `done-new-${turnIdx + 1}`
    add('end', 'client', level === 1 ? 'l1-pay' : 'result', { caption, cv: { coins: money(coins), edits: formatNumber(last.edits, lang) } })
  }

  /* ---------------- level 1: hard-coded ifs ---------------- */
  if (level === 1) {
    const ruleId = turn.rules![turn.rules!.length - 1]
    add('rule', 'client', 'l1-rule', { caption: 'l1-rule', cv: { rule: v[RULES[ruleId].label] } })
    add('edit', 'checkout', RULES[ruleId].code, {
      caption: 'l1-edit',
      cv: { edits: formatNumber(s.edits + 1, lang) },
      conn: down('✏️ checkout()', FAIL_COLOR),
      change: (x) => ({ ...x, branches: choice!.branches!, changed: choice!.changed!, edits: x.edits + 1 }),
    })
    add('deploy', 'checkout', 'l1-deploy', {
      caption: 'l1-deploy',
      change: (x) => ({ ...x, changed: [], deploying: true, deploys: x.deploys + 1 }),
    })
    turn.carts.forEach((c, i) => {
      add('cart', 'client', 'l1-cart', {
        caption: 'l1-cart',
        cv: cartVals(c),
        conn: down(`🛒 ${v[c.who]}`),
        change: (x) => ({ ...x, deploying: false, cartIdx: i, hits: [] }),
      })
      const { pct, hits } = runChain(s.branches, c)
      add('check', 'checkout', hits.length ? RULES[s.branches[hits[0]].rule].code : 'l1-none', {
        caption: hits.length > 1 ? 'l1-check-double' : hits.length ? 'l1-check-hit' : 'l1-check-none',
        cv: { pct: pctText(pct, lang) },
        conn: { n: 2, up: true, text: `"${c.cat}" · ${money(c.total)}`, color: CART_COLOR },
        read: 'both',
        change: (x) => ({ ...x, hits }),
      })
      pay(c, i, pct, 'l1-pay', `−${pctText(pct, lang)}`)
    })
    finish()
    return out
  }

  /* ---------------- levels 2-3: interpret the tree ---------------- */
  const expr = level === 3 ? turn.expr! : choice!.expr!
  add('build', 'r', level === 3 ? 'l3-build' : 'build', {
    caption: level === 3 ? 'l3-build' : 'build',
    cv: { choice: treeCode(expr) },
    conn: down(`🧩 new ${blockName(expr)}${expr.t === 'and' || expr.t === 'or' ? '(…)' : ''}`, TREE_COLOR),
    change: (x) => ({ ...x, built: true }),
  })

  turn.carts.forEach((c, i) => {
    add('cart', 'client', 'interpret', {
      cv: cartVals(c),
      conn: down(`🛒 ${v[c.who]}`),
      change: (x) => ({ ...x, cartIdx: i, vals: {}, sides: {} }),
    })
    /* Recursive descent, exactly like interpret(): a leaf reads the cart, a nonterminal asks its children. */
    const walk = (e: Expr, path: string): boolean => {
      if (e.t === 'total' || e.t === 'cat') {
        const ans = evalExpr(e, c)
        add('leaf', path, e.t === 'total' ? 'total' : 'category', {
          caption: e.t === 'total' ? 'leaf-total' : 'leaf-cat',
          cv:
            e.t === 'total'
              ? { total: money(c.total), amount: money(e.n), answer: String(ans) }
              : { actual: c.cat, want: e.name, answer: String(ans) },
          conn: { n: 2, up: true, text: e.t === 'total' ? money(c.total) : `"${c.cat}"`, color: CART_COLOR },
          read: e.t === 'total' ? 'total' : 'category',
          change: (x) => ({ ...x, vals: { ...x.vals, [path]: ans ? 'yes' : 'no' } }),
        })
        return ans
      }
      add('enter', path, `${e.t}-left`, { caption: `enter-${e.t}`, change: (x) => ({ ...x, vals: { ...x.vals, [path]: 'ask' } }) })
      const l = walk(e.l, `${path}l`)
      const short = e.t === 'and' ? !l : l
      const r = short ? null : walk(e.r, `${path}r`)
      const ans = r === null ? l : e.t === 'and' ? l && r : l || r
      add('combine', path, `${e.t}-combine`, {
        caption: short ? `skip-${e.t}` : `combine-${e.t}`,
        cv: { left: String(l), right: String(r), answer: String(ans) },
        change: (x) => {
          const vals: Record<string, NodeVal> = { ...x.vals, [path]: ans ? 'yes' : 'no' }
          if (short) pathsOf(e.r, `${path}r`).forEach((p) => (vals[p] = 'skip'))
          return { ...x, vals, sides: { ...x.sides, [path]: [l, r] } }
        },
      })
      return ans
    }
    const ok = walk(expr, 'r')
    const pct = ok ? (level === 3 ? L3_PCT : RULES[turn.rules![0]].pct) : 0
    pay(c, i, pct, 'result', ok ? '✓ true' : '✗ false')
  })
  finish()
  return out
}

/* ------------------------------------------------------------------ */
/* Visual                                                              */
/* ------------------------------------------------------------------ */

export default function InterpreterVisual({ content, lang, onCodeStep, onCodeView }: VisualProps<InterpreterContent>) {
  const v = content.visual
  const captions: Record<string, string> = content.steps
  const label = (key: LabelKey) => v[key]
  const money = (n: number) => formatTaka(n, lang)

  const { progress, addCoins, completeLevel, reset: resetProgress } = useGameProgress('dpp-interpreter-game')
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
  const choice = turn.choices?.find((c) => c.id === pick) ?? null
  const ready = level === 3 ? built : pick !== null
  const steps = useMemo(() => (ready ? buildSteps(level, turnIdx, pick, v, lang) : []), [ready, level, turnIdx, pick, v, lang])
  const player = useStepPlayer(steps)
  const step = player.step
  const kind = step?.kind ?? null
  const busy = player.index >= 0
  const stepIs = (...kinds: Kind[]) => kind !== null && kinds.includes(kind)
  const snap = step?.snap ?? initSnap(level, turnIdx)

  const lastSnap = steps.length ? steps[steps.length - 1].snap : null
  const willSucceed = Boolean(lastSnap && lastSnap.paid.every((p) => p && p.pct === p.expected))
  const outcome: 'ok' | 'fail' | null = player.done ? (willSucceed ? 'ok' : 'fail') : null
  const turnCoins = willSucceed && lastSnap ? turn.carts.reduce((sum, c, i) => sum + paidFor(c, lastSnap.paid[i]?.pct ?? 0), 0) : 0
  const pendingCoins = outcome === 'ok' ? turnCoins : 0
  const accent = level === 1 ? FAIL_COLOR : level === 3 ? OR_COLOR : TREE_COLOR

  /* ---------------- code panel sync ---------------- */

  const view: CodeView = level === 1 ? 'without' : level === 2 ? 'main' : 'with'
  useEffect(() => {
    onCodeView?.(view)
  }, [view, onCodeView])
  useEffect(() => () => onCodeView?.('main'), [onCodeView])

  const newRule: RuleId | null = turn.rules ? turn.rules[turn.rules.length - 1] : null
  let idleCode: string | null
  if (levelDone) idleCode = null
  else if (level === 1) idleCode = pick && newRule ? RULES[newRule].code : 'l1-rule'
  else if (level === 2) idleCode = 'build'
  else idleCode = panel === 'q1' ? 'build-class' : panel === 'q2' ? 'build-recursive' : 'l3-build'
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

  const answerQ1 = (a: 'flag' | 'implements' | 'counter') => {
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

  const answerQ2 = (a: 'hard' | 'children' | 'and') => {
    if (panel !== 'q2') return
    if (a === 'children') {
      setHint(null)
      setPanel('ready')
      return
    }
    shake.bump(`q2-${a}`)
    setMistakes((m) => m + 1)
    setHint({ key: `wrong-q2-${a}` })
  }

  const plugOr = () => {
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

  const ruleText = level === 3 ? label(turn.label!) : label(RULES[newRule!].label)
  const choiceText = !pick ? '' : level === 1 ? label(OPT_LABEL[pick]!) : choice?.expr ? treeCode(choice.expr) : ''
  const values: Record<string, string> = {
    rule: ruleText,
    choice: choiceText,
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

  const turnOf = fill(v.turnOf, { n: formatNumber(turnIdx + 1, lang), total: formatNumber(TURNS[level].length, lang) })
  const finished = stepIs('end')
  const active = (n: string) => step?.node === n
  const current = snap.cartIdx >= 0 ? turn.carts[snap.cartIdx] : null

  /* Mitu apa's board. */
  const boardLines: { key: LabelKey; isNew: boolean }[] =
    level === 3
      ? [{ key: turn.label!, isNew: false }]
      : turn.rules!.map((r, i) => ({ key: RULES[r].label, isNew: level === 1 && turnIdx > 0 && i === turn.rules!.length - 1 }))
  const board = (
    <div className={`mb-3 rounded-lg border-2 border-edge bg-bottle px-3 py-2 text-cream shadow-hard-sm transition-transform ${stepIs('rule') ? 'scale-[1.02]' : ''}`}>
      <p className="label-caps text-cream/80">📋 {v.boardTitle}</p>
      <ul className="mt-1 flex flex-col gap-1">
        {boardLines.map((b) => (
          <li key={b.key} className="text-sm leading-snug font-semibold">
            ✦ {label(b.key)}
            {b.isNew && <span className="ml-1.5 rounded bg-mustard px-1 py-px text-[10px] font-bold text-on-accent uppercase">{v.newTag}</span>}
          </li>
        ))}
      </ul>
      {level === 1 && turnIdx > 0 && <p className="mt-1 text-[11px] text-cream/80">{v.bestOnly}</p>}
    </div>
  )

  /* Customers at the counter, and what each one paid. */
  const paidChip = (c: Cart, p: Paid) => {
    const ok = p.pct === p.expected
    const paid = money(paidFor(c, p.pct))
    let text: string
    if (ok) text = `✓ ${p.pct > 0 ? `−${pctText(p.pct, lang)}` : v.noDiscount} · ${fill(v.pays, { paid })}`
    else if (p.pct > p.expected) text = `✗ −${pctText(p.pct, lang)} · ${fill(v.loss, { diff: money(paidFor(c, p.expected) - paidFor(c, p.pct)) })}`
    else text = `✗ ${p.pct > 0 ? `−${pctText(p.pct, lang)}` : v.noDiscount} · ${fill(v.boardSays, { pct: pctText(p.expected, lang) })}`
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-md border-2 px-1.5 py-px text-[11px] font-bold ${ok ? 'border-bottle text-bottle dark:border-jade dark:text-jade' : 'border-chili bg-chili text-cream'}`}
      >
        {text}
      </motion.span>
    )
  }
  const customers = (
    <AnimatePresence mode="wait" initial={false}>
      <motion.ul
        key={`${level}-${turnIdx}`}
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -40, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col gap-1.5"
      >
        {turn.carts.map((c, i) => {
          const p = snap.paid[i]
          const lit = busy && snap.cartIdx === i && !finished
          return (
            <li
              key={i}
              className={`flex items-center gap-2 rounded-lg border-2 border-dashed px-2 py-1 transition-colors ${lit ? 'border-edge bg-card' : 'border-edge/50 bg-paper'}`}
            >
              <span className="text-xl" aria-hidden="true">
                {WHO_EMOJI[c.who]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-baseline justify-between gap-x-2 text-sm font-bold text-ink">
                  <span>
                    {label(c.who)}{' '}
                    <span className="text-xs font-semibold text-ink-soft">
                      · <span aria-hidden="true">{ITEM[c.cat].icon}</span> {label(ITEM[c.cat].label)}
                    </span>
                  </span>
                  <span className="tabular-nums">{money(c.total)}</span>
                </p>
                {p && <p className="mt-0.5">{paidChip(c, p)}</p>}
              </div>
            </li>
          )
        })}
      </motion.ul>
    </AnimatePresence>
  )

  const stats = (
    <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-bold">
      <span className={`rounded-md border-2 px-1.5 py-0.5 tabular-nums ${level === 1 ? 'border-chili text-chili' : 'border-bottle text-bottle dark:border-jade dark:text-jade'}`}>
        ✏️ {fill(v.statEdits, { n: formatNumber(snap.edits, lang) })}
      </span>
      <span className={`rounded-md border-2 px-1.5 py-0.5 tabular-nums ${level === 1 ? 'border-chili text-chili' : 'border-bottle text-bottle dark:border-jade dark:text-jade'}`}>
        🔄 {fill(v.statDeploys, { n: formatNumber(snap.deploys, lang) })}
      </span>
    </div>
  )

  /* Choices for levels 1 and 2. */
  const choiceText2 = (c: Choice) => (level === 1 ? label(OPT_LABEL[c.id]!) : treeCode(c.expr!))
  const choices =
    turn.choices &&
    (busy && choice ? (
      <p className="mt-3 rounded-md border-2 border-dashed border-edge/50 px-2 py-1 text-xs font-bold text-ink">
        <span className="label-caps text-ink-soft">{v.yourChoice}:</span>{' '}
        <span className="font-mono break-words" lang="en">
          {choiceText2(choice)}
        </span>
      </p>
    ) : (
      <>
        <p id="int-pick-label" className="mt-3 mb-1.5 label-caps text-ink-soft">
          {level === 1 ? v.pickLabel1 : v.pickLabel2}
        </p>
        <div role="radiogroup" aria-labelledby="int-pick-label" className="grid grid-cols-1 gap-1.5">
          {turn.choices.map((c) => (
            <ChoiceButton
              key={c.id}
              selected={pick === c.id}
              color={accent}
              text={choiceText2(c)}
              onClick={() => choose(c.id)}
              animate={shake.anim(`o-${c.id}`)}
              mono={level === 2}
              className="px-2 py-1.5 text-left [&>span:last-child]:whitespace-normal [&>span:last-child]:break-words"
            />
          ))}
        </div>
      </>
    ))

  /* Level 1: checkout() with its growing if/else chain. */
  const kwText = (b: Branch) => (b.kw === 'elif' ? 'else if' : 'if')
  const checkoutNode = (
    <Node role={v.hardcodedRole} title="checkout(cart)" active={active('checkout')} accent={FAIL_COLOR} mono>
      <AnimatePresence initial={false}>
        {snap.deploying && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 flex items-center gap-2 text-xs font-bold text-chili"
          >
            <StatusDot status="active" color={FAIL_COLOR} /> {v.redeploying}
          </motion.p>
        )}
      </AnimatePresence>
      <ol lang="en" className="flex flex-col gap-1 rounded-lg bg-code p-2 font-mono text-[11px] leading-snug text-[#e8dcc8]">
        <li className={`rounded px-1 ${stepIs('check') && snap.hits.length === 0 ? 'bg-[#fbbf24]/25' : ''}`}>let percent = 0</li>
        <AnimatePresence initial={false}>
          {snap.branches.map((b, i) => {
            const edited = stepIs('edit') && snap.changed.includes(i)
            const hit = stepIs('check', 'result') && snap.hits.includes(i)
            const bad = hit && snap.hits.length > 1 && i === snap.hits[snap.hits.length - 1]
            return (
              <motion.li
                key={`${b.rule}-${b.kw}-${condCode(b.expr)}`}
                layout
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className={`rounded px-1 break-words ${edited ? 'bg-[#fbbf24] text-[#2b1d16]' : bad ? 'bg-[#dc2626] text-white' : hit ? 'bg-[#0b6b4f] text-white' : ''}`}
              >
                <span className="text-[#c4a7e7]">{kwText(b)}</span> ({condCode(b.expr)}) → {b.kw === 'add' ? '+' : ''}
                {b.pct}%{edited && ' ✏️'}
              </motion.li>
            )
          })}
        </AnimatePresence>
        <li className="px-1">return total × (100 − percent) / 100</li>
      </ol>
    </Node>
  )

  /* Levels 2-3: the expression tree, one <Node> per object. */
  const previewExpr = level === 3 ? turn.expr! : (choice?.expr ?? null)
  const leafText = (e: Expr, c: Cart) =>
    e.t === 'total' ? `${money(c.total)} > ${money(e.n)}` : e.t === 'cat' ? `"${c.cat}" == "${e.name}"` : ''
  const verdict = (yes: boolean) => (
    <motion.span
      key={yes ? 'y' : 'n'}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      lang="en"
      className={`rounded-md border-2 border-edge px-1.5 font-mono text-[11px] font-bold text-white`}
      style={{ backgroundColor: yes ? OK_COLOR : FAIL_COLOR }}
    >
      {yes ? 'true' : 'false'}
    </motion.span>
  )
  const exprNode = (e: Expr, path: string, depth: number): ReactNode => {
    const val = snap.vals[path]
    const leaf = e.t === 'total' || e.t === 'cat'
    const isOr = e.t === 'or'
    const sides = snap.sides[path]
    const op = e.t === 'and' ? 'AND' : 'OR'
    let status: ReactNode
    if (val === 'skip') status = <span className="text-[11px] text-ink-soft italic">⏭ {v.skipped}</span>
    else if (leaf && (val === 'yes' || val === 'no') && current)
      status = (
        <>
          <code lang="en" className="font-mono text-[11px] text-ink">
            {leafText(e, current)} →
          </code>
          {verdict(val === 'yes')}
        </>
      )
    else if (!leaf && val === 'ask')
      status = (
        <>
          <motion.span key={`ask-${player.index}`} initial={{ y: -14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <Packet color={CART_COLOR}>🛒 {current ? label(current.who) : ''}</Packet>
          </motion.span>
          <span className="text-[11px] font-semibold text-ink">{v.asking}</span>
        </>
      )
    else if (!leaf && sides && (val === 'yes' || val === 'no'))
      status = (
        <>
          <code lang="en" className="font-mono text-[11px] text-ink">
            {String(sides[0])} {op} {sides[1] === null ? '…' : String(sides[1])} →
          </code>
          {verdict(val === 'yes')}
        </>
      )
    else
      status = (
        <span className="text-[11px] text-ink-soft">
          {e.t === 'total' ? v.readsTotal : e.t === 'cat' ? v.readsCategory : e.t === 'and' ? v.andIdle : v.orIdle}
        </span>
      )
    const glow = val === 'no' ? FAIL_COLOR : val === 'yes' ? OK_COLOR : isOr ? OR_COLOR : TREE_COLOR
    return (
      <Node
        key={path}
        role={leaf ? v.terminalRole : v.nonterminalRole}
        title={blockName(e)}
        active={active(path)}
        accent={glow}
        mono
        className={`${depth > 0 ? '!p-2 sm:!p-3' : ''} ${val === 'skip' ? 'opacity-50' : ''} ${isOr ? '!border-[#C2410C]' : ''}`}
      >
        <div className="flex min-h-6 flex-wrap items-center gap-1.5">{status}</div>
        {!leaf && (
          <div className="mt-2 grid grid-cols-1 gap-2 border-l-2 border-dashed border-edge/40 pl-2 sm:grid-cols-2">
            {exprNode(e.l, `${path}l`, depth + 1)}
            {exprNode(e.r, `${path}r`, depth + 1)}
          </div>
        )}
      </Node>
    )
  }
  const treeArea = previewExpr ? (
    <motion.div
      key={`tree-${level}-${turnIdx}-${pick ?? ''}`}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: snap.built || busy ? 1 : 0.6, scale: 1 }}
      transition={{ duration: 0.35 }}
    >
      {exprNode(previewExpr, 'r', 0)}
    </motion.div>
  ) : (
    <div className="rounded-xl border-2 border-dashed border-edge/50 p-3 text-center text-xs text-ink-soft">🧩 {v.treeEmpty}</div>
  )

  /* Context: the cart being checked. */
  const fieldRow = (name: string, value: string, lit: boolean) => (
    <li
      className={`flex items-center justify-between gap-2 rounded-md border-2 px-2 py-0.5 font-mono text-xs transition-colors ${
        lit ? 'border-edge bg-mustard text-on-accent' : 'border-transparent text-ink'
      }`}
    >
      <span lang="en">{name}</span>
      <span className="font-bold tabular-nums">{value}</span>
    </li>
  )
  const cartNode = (
    <Node role={v.contextRole} title="🛒 Cart" active={false} accent={CART_COLOR} mono>
      {current ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-bold text-ink">
            <span aria-hidden="true">{WHO_EMOJI[current.who]}</span> {label(current.who)}{' '}
            <span className="text-xs font-semibold text-ink-soft">
              · {ITEM[current.cat].icon} {label(ITEM[current.cat].label)}
            </span>
          </p>
          <ul className="flex flex-col gap-1">
            {fieldRow('total', money(current.total), step?.read === 'total' || step?.read === 'both')}
            {fieldRow('category', `"${current.cat}"`, step?.read === 'category' || step?.read === 'both')}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-ink-soft">{v.cartWaiting}</p>
      )}
    </Node>
  )

  /* AbstractExpression: the one interface every block shares. */
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
  const legendNode = (
    <Node role={v.abstractRole} title="Rule" active={false} accent={TREE_COLOR} mono className="!bg-paper">
      <code lang="en" className="mb-1 block font-mono text-xs font-bold text-ink">
        interpret(cart): boolean
      </code>
      <p className="mb-2 text-[11px] text-ink-soft">{v.ruleNote}</p>
      <div className="flex flex-wrap gap-1.5">
        {classChip('TotalAbove', 'old')}
        {classChip('CategoryIs', 'old')}
        {classChip('And', 'old')}
        {level === 3 && classChip(`Or · ${built ? v.newTag : v.notBuilt}`, built ? 'new' : 'missing')}
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
          {willSucceed ? fill(v.resultOk, { coins: money(turnCoins) }) : v.resultBad}
        </motion.div>
      )}
    </AnimatePresence>
  )

  const pkt = (n: 1 | 2): ReactNode => (step?.conn?.n === n ? <Packet color={step.conn.color}>{step.conn.text}</Packet> : null)
  const connDown = (n: 1 | 2) => step?.conn?.n === n && !step.conn.up
  const connUp = (n: 1 | 2) => step?.conn?.n === n && step.conn.up
  const conn2Label = step?.read === 'total' ? 'cart.total' : step?.read === 'category' ? 'cart.category' : 'cart'

  /* L3 builder. */
  const builder = (
    <div className="mt-3 flex flex-col gap-3 rounded-lg border-2 border-dashed p-3" style={{ borderColor: OR_COLOR }}>
      <p className="font-display font-bold text-ink">🔨 {v.builderTitle}</p>
      <div>
        <p className="label-caps text-ink-soft">{v.builderStep1}</p>
        <p className="mb-2 text-sm text-ink">{v.q1}</p>
        <div role="radiogroup" aria-label={v.builderStep1} className="grid grid-cols-1 gap-2">
          {(
            [
              ['flag', v.q1Flag, false],
              ['implements', v.q1Implements, true],
              ['counter', v.q1Counter, false],
            ] as const
          ).map(([a, text, mono]) => (
            <ChoiceButton
              key={a}
              selected={panel !== 'q1' && a === 'implements'}
              color={OR_COLOR}
              text={text}
              onClick={() => answerQ1(a)}
              animate={shake.anim(`q1-${a}`)}
              mono={mono}
              className={`[&>span:last-child]:whitespace-normal [&>span:last-child]:break-words ${panel !== 'q1' && a !== 'implements' ? 'opacity-40' : ''}`}
            />
          ))}
        </div>
        {panel !== 'q1' && <NewCodeChip>+ class Or implements Rule</NewCodeChip>}
      </div>

      {panel !== 'q1' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="label-caps text-ink-soft">{v.builderStep2}</p>
          <p className="mb-2 text-sm text-ink">{v.q2}</p>
          <div role="radiogroup" aria-label={v.builderStep2} className="grid grid-cols-1 gap-2">
            {(
              [
                ['hard', v.q2Hard],
                ['and', v.q2And],
                ['children', v.q2Children],
              ] as const
            ).map(([a, text]) => (
              <ChoiceButton
                key={a}
                selected={panel === 'ready' && a === 'children'}
                color={OR_COLOR}
                text={text}
                onClick={() => answerQ2(a)}
                animate={shake.anim(`q2-${a}`)}
                mono
                className={`[&>span:last-child]:whitespace-normal [&>span:last-child]:break-words ${panel === 'ready' && a !== 'children' ? 'opacity-40' : ''}`}
              />
            ))}
          </div>
          {panel === 'ready' && <NewCodeChip>+ return left.interpret(cart) || right.interpret(cart)</NewCodeChip>}
        </motion.div>
      )}

      {panel === 'ready' && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full border-2 border-bottle bg-bottle/10 px-2 py-0.5 text-xs font-bold text-bottle dark:border-jade dark:text-jade">
            ✓ {v.zeroEdits}
          </span>
          <Button variant="primary" onClick={plugOr} data-game="open-branch">
            🧩 {v.useOr}
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
                    {'+ else if (???) → 10%'}
                  </code>
                </>
              )}
              {level === 2 && <p className="prose-text text-sm text-ink">{v.l2Summary}</p>}
              {level === 3 && (
                <Recap
                  title={v.recapTitle}
                  items={[
                    { icon: '✏️', text: v.recap1 },
                    { icon: '🧩', text: v.recap2 },
                    { icon: '🌙', text: v.recap3 },
                  ]}
                />
              )}
            </LevelCompleteCard>
          ) : (
            <motion.div key={`play-${level}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* ── Client: the billing counter, the board, the customers and the learner's choice ── */}
              <Node role={v.clientRole} title={`🧾 ${v.counterTitle}`} active={active('client')} accent={accent}>
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

                {board}
                {customers}
                {stats}

                {level < 3 ? (
                  <>
                    {choices}
                    <p className={`mt-2 border-t-2 border-dashed border-edge/40 pt-2 text-xs font-semibold ${level === 1 ? 'text-chili' : 'text-ink'}`}>
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
                label={level === 1 ? 'checkout(cart)' : 'rule.interpret(cart)'}
                down={connDown(1)}
                up={connUp(1)}
                downPacket={pkt(1)}
                upPacket={pkt(1)}
                runKey={player.index}
              />

              {level === 1 ? checkoutNode : treeArea}

              <Connector label={conn2Label} up={connUp(2)} upPacket={pkt(2)} runKey={player.index} />
              {cartNode}
              {level > 1 && <div className="mt-3">{legendNode}</div>}
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
