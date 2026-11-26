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
import type { MementoContent } from './content.en'

/*
 * "Tania's pitha post before Poush mela": a 3-level game.
 *   Level 1  no pattern: PostScreen copies PostEditor's public fields by hand before each edit. The learner picks
 *            how; a shared reference, a missed field or a single variable brings back the wrong post (`without`)
 *   Level 2  Memento: PostEditor saves itself into a sealed PostSnapshot, History stacks the snapshots.
 *            The learner picks when to save, who makes the snapshot, or how to undo (`main`)
 *   Level 3  the learner adds a photo field (2 questions): only PostEditor + PostSnapshot change (`with`)
 * Every turn is a step timeline whose steps carry a snapshot of the scene, so the code panel and every node stay in sync.
 */

type Labels = MementoContent['visual']
type LabelKey = keyof Labels

/* ------------------------------------------------------------------ */
/* The post (made-up shop, prices and orders)                          */
/* ------------------------------------------------------------------ */

type Aud = 'Public' | 'Friends'
type TextKey = 'txtBhapa' | 'txtPatishapta' | 'txtChitoi' | 'txtScribble'
type PhotoKey = 'bhapa' | 'patishapta' | 'blurry' | 'chitoi'
interface Post {
  text: TextKey
  price: number
  aud: Aud
  photo: PhotoKey | null
}
type Field = keyof Post

const PHOTO: Record<PhotoKey, { icon: string; label: LabelKey; bg: string }> = {
  bhapa: { icon: '🍘', label: 'photoBhapa', bg: '#F5E6C8' },
  patishapta: { icon: '🌯', label: 'photoPatishapta', bg: '#F3DDB3' },
  blurry: { icon: '🌫️', label: 'photoBlurry', bg: '#6B7280' },
  chitoi: { icon: '🥞', label: 'photoChitoi', bg: '#EAD9B8' },
}
const AUD: Record<Aud, { icon: string; label: LabelKey }> = {
  Public: { icon: '🌍', label: 'audPublic' },
  Friends: { icon: '👥', label: 'audFriends' },
}

type L1Opt = 'copyAll' | 'ref' | 'textPrice' | 'oneVar' | 'list'
type L2Opt = 'before' | 'after' | 'never' | 'editorSaves' | 'uiBuilds' | 'pushEditor' | 'undoOnce' | 'undoTwice' | 'peek'
type Opt = L1Opt | L2Opt
const OPT_LABEL: Record<Opt, LabelKey> = {
  copyAll: 'optCopyAll',
  ref: 'optRef',
  textPrice: 'optTextPrice',
  oneVar: 'optOneVar',
  list: 'optList',
  before: 'optBefore',
  after: 'optAfter',
  never: 'optNever',
  editorSaves: 'optEditorSaves',
  uiBuilds: 'optUiBuilds',
  pushEditor: 'optPushEditor',
  undoOnce: 'optUndoOnce',
  undoTwice: 'optUndoTwice',
  peek: 'optPeek',
}

interface Turn {
  situation: LabelKey
  ask?: LabelKey
  choices?: Opt[]
  start: Post
  /** The post Tania wants to go out. */
  goal: Post
  /** Snapshots already in History when the turn starts (oldest first). */
  prefill?: Post[]
  /** Orders the right post brings in. */
  orders: number
}

const bhapa: Post = { text: 'txtBhapa', price: 30, aud: 'Friends', photo: null }
const patishapta: Post = { text: 'txtPatishapta', price: 40, aud: 'Friends', photo: null }
const chitoi: Post = { text: 'txtChitoi', price: 20, aud: 'Friends', photo: null }

const TURNS: Record<Level, Turn[]> = {
  1: [
    { situation: 'sit1-1', ask: 'ask1-1', choices: ['copyAll', 'ref'], start: bhapa, goal: bhapa, orders: 20 },
    { situation: 'sit1-2', ask: 'ask1-2', choices: ['textPrice', 'copyAll', 'ref'], start: patishapta, goal: patishapta, orders: 15 },
    { situation: 'sit1-3', ask: 'ask1-3', choices: ['oneVar', 'list'], start: chitoi, goal: chitoi, orders: 25 },
  ],
  2: [
    { situation: 'sit2-1', ask: 'ask2-1', choices: ['after', 'before', 'never'], start: bhapa, goal: bhapa, orders: 20 },
    { situation: 'sit2-2', ask: 'ask2-2', choices: ['uiBuilds', 'pushEditor', 'editorSaves'], start: patishapta, goal: patishapta, orders: 15 },
    {
      situation: 'sit2-3',
      ask: 'ask2-3',
      choices: ['undoOnce', 'peek', 'undoTwice'],
      start: { ...chitoi, price: 200, aud: 'Public' },
      goal: chitoi,
      prefill: [chitoi, { ...chitoi, price: 200 }],
      orders: 25,
    },
  ],
  3: [
    { situation: 'sit3-1', start: { ...bhapa, photo: 'bhapa' }, goal: { ...bhapa, photo: 'bhapa' }, orders: 25 },
    {
      situation: 'sit3-2',
      start: { ...patishapta, photo: 'patishapta' },
      goal: { ...patishapta, photo: 'patishapta' },
      orders: 18,
    },
    {
      situation: 'sit3-3',
      start: { ...chitoi, price: 200 },
      goal: { ...chitoi, photo: 'chitoi' },
      prefill: [
        { ...chitoi, photo: 'chitoi' },
        { ...chitoi, photo: null },
      ],
      orders: 30,
    },
  ],
}
/** Level 1, turn 1 is a guided tutorial: the right choice is pre-selected. */
const TUTORIAL_PICK: Opt = 'copyAll'
const LEVEL_ICON: Record<Level, string> = { 1: '✍️', 2: '💾', 3: '📷' }

const FAIL_COLOR = '#B91C1C'
const SAVE_COLOR = '#0E7490'
const NEW_COLOR = '#C2410C'
const OK_COLOR = '#0b6b4f'
const EDIT_COLOR = '#7C3AED'
const GOLPO_COLOR = '#1D4ED8'

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

type Kind =
  | 'clickSave'
  | 'copy'
  | 'save'
  | 'push'
  | 'edit'
  | 'clickUndo'
  | 'pop'
  | 'restore'
  | 'empty'
  | 'error'
  | 'publish'
  | 'react'
  | 'end'
type NodeId = 'client' | 'editor' | 'store'
type Fail = 'price' | 'leak' | 'text' | null

/** One entry in the store: a hand-made copy (level 1) or a snapshot in History (levels 2-3). */
interface Card {
  n: number
  /** copy: hand-made copy · ref: the editor itself (level 1) · sealed: a memento · live: the editor in History. */
  kind: 'copy' | 'ref' | 'sealed' | 'live'
  post: Post
  /** Level 1: a copy without the audience. */
  noAud?: boolean
}
interface Conn {
  n: 1 | 2
  up: boolean
  text: string
  color: string
}
interface Say {
  text: string
  tone: 'out' | 'in' | 'bad'
}
interface Snap {
  post: Post
  cards: Card[]
  /** Level 1, "one variable": the store is a single slot. */
  slot: boolean
  posted: boolean
  error: 'private' | 'sealed' | null
  /** The editor is packing a snapshot (save step). */
  packing: boolean
  fail: Fail
}
interface GameStep extends PlayerStep {
  kind: Kind
  caption: string
  cv: Record<string, string>
  node: NodeId
  conns: Conn[]
  say: Say[]
  btn?: 'save' | 'undo' | 'post'
  /** Fields of the post that change in this step (they flash). */
  changed: Field[]
  snap: Snap
}

function initSnap(level: Level, turnIdx: number, pick: Opt | null): Snap {
  const turn = TURNS[level][turnIdx]
  return {
    post: turn.start,
    cards: (turn.prefill ?? []).map((p, i) => ({ n: i + 1, kind: 'sealed', post: p })),
    slot: level === 1 && pick === 'oneVar',
    posted: false,
    error: null,
    packing: false,
    fail: null,
  }
}

const DURATION: Partial<Record<Kind, number>> = {
  copy: 1900,
  save: 1600,
  push: 1500,
  edit: 1600,
  restore: 1700,
  error: 2100,
  react: 2100,
  end: 1800,
}

const failOf = (p: Post, goal: Post): Fail =>
  p.price !== goal.price ? 'price' : p.aud !== goal.aud ? 'leak' : p.text !== goal.text ? 'text' : p.photo !== goal.photo ? 'text' : null

/** Builds a turn's timeline. `add` applies a change to the scene, then records a step. */
function buildSteps(level: Level, turnIdx: number, pick: Opt | null, v: Labels, lang: Lang): GameStep[] {
  const turn = TURNS[level][turnIdx]
  if (level < 3 && !pick) return []
  const out: GameStep[] = []
  let s = initSnap(level, turnIdx, pick)
  const money = (n: number) => formatTaka(n, lang)
  const postCv = (p: Post) => ({
    price: money(p.price),
    aud: v[AUD[p.aud].label],
    photo: p.photo ? v[PHOTO[p.photo].label] : v.noPhoto,
  })

  const add = (
    kind: Kind,
    node: NodeId,
    codeStep: string,
    opts: {
      caption?: string
      cv?: Record<string, string>
      conns?: Conn[]
      say?: Say[]
      btn?: GameStep['btn']
      change?: (x: Snap) => Snap
    } = {},
  ) => {
    const before = s.post
    if (opts.change) s = opts.change(s)
    const changed = (Object.keys(before) as Field[]).filter((f) => before[f] !== s.post[f])
    out.push({
      id: `${kind}-${out.length}`,
      codeStep,
      duration: DURATION[kind] ?? 1300,
      kind,
      caption: opts.caption ?? kind,
      cv: { ...postCv(s.post), ...(opts.cv ?? {}) },
      node,
      conns: opts.conns ?? [],
      say: opts.say ?? [],
      btn: opts.btn,
      changed,
      snap: s,
    })
  }
  const setPost = (x: Snap, p: Partial<Post>): Snap => ({ ...x, post: { ...x.post, ...p } })
  const nextN = () => (s.cards.length ? Math.max(...s.cards.map((c) => c.n)) + 1 : 1)
  const l3 = level === 3
  const code = (l2: string) => (l3 ? `w-${l2}` : l2)

  /* ---------------- shared endings ---------------- */
  const publish = (codeStep: string) =>
    add('publish', 'editor', codeStep, {
      caption: 'publish',
      btn: 'post',
      conns: [{ n: 1, up: false, text: '📤 publish()', color: GOLPO_COLOR }],
      change: (x) => ({ ...x, posted: true, error: null, fail: failOf(x.post, turn.goal) }),
    })
  const react = (codeStep: string) => {
    if (!s.fail) return
    const p = s.post
    add('react', 'editor', codeStep, {
      caption: `react-${s.fail}`,
      say:
        s.fail === 'price'
          ? [
              { text: fill(v.reactPrice, { price: money(p.price) }), tone: 'bad' },
              { text: v.reactPrice2, tone: 'in' },
            ]
          : s.fail === 'leak'
            ? [
                { text: v.reactLeak, tone: 'bad' },
                { text: v.reactLeak2, tone: 'in' },
              ]
            : [{ text: v.reactText, tone: 'bad' }],
    })
  }
  const end = (codeStep: string, okCaption: string, failCaption: string) => {
    const ok = !s.fail
    add('end', 'editor', codeStep, {
      caption: ok ? okCaption : failCaption,
      cv: { n: formatNumber(turn.orders, lang), coins: money(turn.orders * turn.goal.price) },
      say: ok ? [{ text: v.reactOk, tone: 'in' }] : [],
    })
  }

  /* ---------------- level 1: copy the fields by hand ---------------- */
  if (level === 1) {
    const o = pick as L1Opt
    const clickSave = () =>
      add('clickSave', 'client', 'l1-save', {
        caption: 'l1-click-save',
        btn: 'save',
        conns: [{ n: 1, up: true, text: 'e.text, e.price…', color: SAVE_COLOR }],
      })
    const copy = (mode: 'all' | 'some' | 'ref' | 'slot' | 'push2' | 'over') => {
      const n = mode === 'over' ? 1 : nextN()
      const packet =
        mode === 'ref' ? '🔗 backup = editor' : mode === 'some' ? '{text,price}' : '{text,price,audience}'
      add('copy', 'store', 'l1-copy', {
        caption: `l1-copy-${mode}`,
        conns: [{ n: 2, up: false, text: packet, color: mode === 'ref' ? FAIL_COLOR : SAVE_COLOR }],
        change: (x) => {
          const card: Card = { n, kind: mode === 'ref' ? 'ref' : 'copy', post: x.post, noAud: mode === 'some' }
          return { ...x, cards: mode === 'over' ? [card] : [...x.cards, card] }
        },
      })
    }
    const edit = (p: Partial<Post>, caption: string, packet: string) =>
      add('edit', 'editor', 'l1-edit', {
        caption,
        conns: [{ n: 1, up: false, text: packet, color: EDIT_COLOR }],
        change: (x) => setPost(x, p),
      })
    const undo = () => {
      add('clickUndo', 'client', 'l1-undo-call', { caption: 'l1-click-undo', btn: 'undo' })
      const top = s.cards[s.cards.length - 1]
      add('pop', 'store', 'l1-pop', {
        caption: s.slot ? 'l1-pop-slot' : 'l1-pop',
        cv: postCv(top.kind === 'ref' ? s.post : top.post),
        conns: [{ n: 2, up: true, text: top.kind === 'ref' ? '🔗 editor' : `#${top.n} { … }`, color: SAVE_COLOR }],
        change: (x) => (x.slot ? x : { ...x, cards: x.cards.slice(0, -1) }),
      })
      add('restore', 'editor', 'l1-undo', {
        caption: top.kind === 'ref' ? 'l1-undo-ref' : top.noAud ? 'l1-undo-some' : 'l1-undo-all',
        change: (x) =>
          top.kind === 'ref' ? x : setPost(x, top.noAud ? { text: top.post.text, price: top.post.price } : top.post),
      })
    }

    if (turnIdx < 2) {
      clickSave()
      copy(o === 'ref' ? 'ref' : o === 'textPrice' ? 'some' : 'all')
      if (turnIdx === 0) edit({ price: 300 }, o === 'ref' ? 'l1-edit-ref' : 'l1-edit-price', 'price = 300')
      else edit({ text: 'txtScribble', aud: 'Public' }, o === 'ref' ? 'l1-edit-mitu-ref' : 'l1-edit-mitu', 'text, audience')
      undo()
    } else {
      clickSave()
      copy(o === 'oneVar' ? 'slot' : 'all')
      edit({ price: 200 }, 'l1-edit-price3', 'price = 200')
      clickSave()
      copy(o === 'oneVar' ? 'over' : 'push2')
      edit({ aud: 'Public' }, 'l1-edit-aud', "audience = 'Public'")
      undo()
      undo()
    }
    publish('l1-post')
    react('l1-post')
    end('l1-post', `l1-ok-${turnIdx + 1}`, `l1-fail-${o}`)
    return out
  }

  /* ---------------- levels 2-3: Memento ---------------- */
  const clickSave = () =>
    add('clickSave', 'client', code('click-save'), {
      caption: 'click-save',
      btn: 'save',
      conns: [{ n: 1, up: false, text: 'editor.save()', color: SAVE_COLOR }],
    })
  const save = (caption = l3 ? 'save-photo' : 'save') =>
    add('save', 'editor', code('save'), { caption, change: (x) => ({ ...x, packing: true }) })
  const push = () => {
    const n = nextN()
    add('push', 'store', code('push'), {
      caption: 'push',
      conns: [{ n: 2, up: false, text: `📦🔒 #${n}`, color: SAVE_COLOR }],
      change: (x) => ({ ...x, packing: false, cards: [...x.cards, { n, kind: 'sealed', post: x.post }] }),
    })
  }
  const saveAll = () => {
    clickSave()
    save()
    push()
  }
  const edit = (p: Partial<Post>, caption: string, packet: string) =>
    add('edit', 'editor', code('edit'), {
      caption,
      conns: [{ n: 1, up: false, text: packet, color: EDIT_COLOR }],
      change: (x) => setPost(x, p),
    })
  const undo = (restoreCaption = l3 ? 'restore-photo' : 'restore') => {
    add('clickUndo', 'client', code('undo'), {
      caption: 'click-undo',
      btn: 'undo',
      conns: [{ n: 1, up: false, text: 'history.pop()', color: SAVE_COLOR }],
    })
    const top = s.cards[s.cards.length - 1]
    if (!top) {
      add('empty', 'store', 'empty', { caption: 'empty', say: [{ text: '∅', tone: 'bad' }] })
      return
    }
    add('pop', 'store', code('pop'), {
      caption: 'pop',
      conns: [{ n: 2, up: true, text: top.kind === 'live' ? '🔗 editor' : `📦🔒 #${top.n}`, color: top.kind === 'live' ? FAIL_COLOR : SAVE_COLOR }],
      change: (x) => ({ ...x, cards: x.cards.slice(0, -1) }),
    })
    add('restore', 'editor', code('restore'), {
      caption: top.kind === 'live' ? 'restore-live' : restoreCaption,
      conns: [{ n: 1, up: false, text: 'editor.restore(s)', color: OK_COLOR }],
      change: (x) => (top.kind === 'live' ? x : setPost(x, top.post)),
    })
  }

  if (level === 2) {
    const o = pick as L2Opt
    const typo = () => edit({ price: 300 }, 'edit-price', 'setPrice(300)')
    const mitu = (caption = 'edit-mitu') => edit({ text: 'txtScribble', aud: 'Public' }, caption, 'setText·setAudience')
    if (turnIdx === 0) {
      if (o === 'before') {
        saveAll()
        typo()
        undo()
      } else if (o === 'after') {
        typo()
        clickSave()
        save('save-after')
        push()
        undo('restore-typo')
      } else {
        typo()
        undo()
      }
    } else if (turnIdx === 1) {
      if (o === 'editorSaves') {
        saveAll()
        mitu()
        undo()
      } else if (o === 'uiBuilds') {
        add('clickSave', 'client', 'click-save', { caption: 'ui-builds', btn: 'save' })
        add('error', 'editor', 'private', {
          caption: 'err-private',
          conns: [{ n: 1, up: true, text: 'editor.audience ✗', color: FAIL_COLOR }],
          change: (x) => ({ ...x, error: 'private' }),
        })
        mitu()
        undo()
      } else {
        add('clickSave', 'client', 'click-save', { caption: 'push-editor', btn: 'save' })
        add('push', 'store', 'push', {
          caption: 'push-live',
          conns: [{ n: 2, up: false, text: '🔗 editor', color: FAIL_COLOR }],
          change: (x) => ({ ...x, cards: [...x.cards, { n: nextN(), kind: 'live', post: x.post }] }),
        })
        mitu('edit-live')
        undo()
      }
    } else if (o === 'undoTwice') {
      undo()
      undo()
    } else if (o === 'undoOnce') {
      undo()
    } else {
      add('clickUndo', 'client', 'undo', { caption: 'peek', btn: 'undo' })
      add('error', 'store', 'sealed', {
        caption: 'err-sealed',
        conns: [{ n: 2, up: true, text: '📦🔒 .price ✗', color: FAIL_COLOR }],
        change: (x) => ({ ...x, error: 'sealed' }),
      })
    }
    publish('publish')
    react('publish')
    end('publish', `l2-ok-${turnIdx + 1}`, `l2-fail-${o}`)
    return out
  }

  /* ---------------- level 3: the photo field ---------------- */
  if (turnIdx === 0) {
    saveAll()
    edit({ photo: null }, 'w-edit-photo', 'setPhoto(null)')
    undo()
  } else if (turnIdx === 1) {
    saveAll()
    edit({ photo: 'blurry', price: 400 }, 'w-edit-photo-price', 'setPhoto·setPrice')
    undo()
  } else {
    undo()
    undo()
  }
  publish('w-publish')
  end('w-publish', `l3-done-${turnIdx + 1}`, `l3-done-${turnIdx + 1}`)
  return out
}

/* ------------------------------------------------------------------ */
/* Visual                                                              */
/* ------------------------------------------------------------------ */

export default function MementoVisual({ content, lang, onCodeStep, onCodeView }: VisualProps<MementoContent>) {
  const v = content.visual
  const captions: Record<string, string> = content.steps
  const label = (key: LabelKey) => v[key]
  const money = (n: number) => formatTaka(n, lang)
  const num = (n: number) => formatNumber(n, lang)

  const { progress, addCoins, completeLevel, reset: resetProgress } = useGameProgress('dpp-memento-game')
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
  const snap = step?.snap ?? initSnap(level, turnIdx, pick)

  const lastSnap = steps.length ? steps[steps.length - 1].snap : null
  const willSucceed = Boolean(lastSnap && !lastSnap.fail)
  const outcome: 'ok' | 'fail' | null = player.done ? (willSucceed ? 'ok' : 'fail') : null
  const pendingCoins = outcome === 'ok' ? turn.orders * turn.goal.price : 0
  const accent = level === 1 ? FAIL_COLOR : level === 3 ? NEW_COLOR : SAVE_COLOR

  /* ---------------- code panel sync ---------------- */

  const view: CodeView = level === 1 ? 'without' : level === 2 ? 'main' : 'with'
  useEffect(() => {
    onCodeView?.(view)
  }, [view, onCodeView])
  useEffect(() => () => onCodeView?.('main'), [onCodeView])

  let idleCode: string | null
  if (levelDone) idleCode = null
  else if (level === 1) idleCode = pick ? 'l1-copy' : 'l1-save'
  else if (level === 2)
    idleCode =
      turnIdx === 0
        ? 'click-save'
        : turnIdx === 1
          ? pick === 'uiBuilds'
            ? 'private'
            : pick === 'pushEditor'
              ? 'push'
              : 'save'
          : pick === 'peek'
            ? 'sealed'
            : 'undo'
  else idleCode = panel === 'q1' ? 'build-field' : panel === 'q2' ? 'build-same' : 'w-click-save'
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

  const answerQ1 = (a: 'editor' | 'ui' | 'all') => {
    if (panel !== 'q1') return
    if (a === 'editor') {
      setHint(null)
      setPanel('q2')
      return
    }
    shake.bump(`q1-${a}`)
    setMistakes((m) => m + 1)
    setHint({ key: `wrong-q1-${a}` })
  }

  const answerQ2 = (a: 'list' | 'no' | 'check') => {
    if (panel !== 'q2') return
    if (a === 'no') {
      setHint(null)
      setPanel('ready')
      return
    }
    shake.bump(`q2-${a}`)
    setMistakes((m) => m + 1)
    setHint({ key: `wrong-q2-${a}` })
  }

  const tryIt = () => {
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
  const finished = kind === 'end'
  const active = (n: NodeId) => step?.node === n
  const sayAt = (n: NodeId) => (step && step.node === n ? step.say : [])
  const showPhoto = level === 3

  /** Speech bubbles / comments popping up inside a node. */
  const bubbles = (n: NodeId) => (
    <AnimatePresence mode="popLayout" initial={false}>
      {sayAt(n).map((m, i) => (
        <motion.p
          key={`${player.index}-${i}`}
          initial={{ opacity: 0, y: 8, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, delay: i * 0.25 }}
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
        <span className="label-caps text-ink-soft">{v.yourChoice}:</span> <span className="break-words">{optText(pick)}</span>
      </p>
    ) : (
      <>
        <p id="mm-pick-label" className="mt-3 mb-1.5 label-caps text-ink-soft">
          {turn.ask ? label(turn.ask) : ''}
        </p>
        <div role="radiogroup" aria-labelledby="mm-pick-label" className="grid grid-cols-1 gap-1.5">
          {turn.choices.map((o) => (
            <ChoiceButton
              key={o}
              selected={pick === o}
              color={accent}
              text={optText(o)}
              onClick={() => choose(o)}
              animate={shake.anim(`o-${o}`)}
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
        <p className="label-caps text-cream/80">🪔 {v.situationLabel}</p>
        <p className="mt-0.5 text-sm leading-snug font-semibold">{label(turn.situation)}</p>
      </div>
      {level < 3 ? choices : null}
    </div>
  )

  /* The client: Tania's Save / Undo / Post buttons. */
  const btn = (id: 'save' | 'undo' | 'post', icon: string, text: string) => {
    const on = step?.btn === id
    return (
      <motion.span
        key={id}
        animate={on ? { scale: [1, 0.9, 1.05, 1] } : { scale: 1 }}
        transition={{ duration: 0.45 }}
        className={`flex min-w-0 items-center justify-center gap-1 rounded-lg border-2 border-edge px-1.5 py-1 text-xs font-bold ${
          on ? 'bg-mustard text-on-accent shadow-hard-sm' : 'bg-paper text-ink'
        }`}
      >
        <span aria-hidden="true">{icon}</span>
        <span className="truncate">{text}</span>
      </motion.span>
    )
  }
  const clientNode = (
    <Node role={v.clientRole} title="PostScreen" active={active('client')} accent={accent} mono>
      <p className="-mt-1 mb-2 truncate text-[11px] text-ink-soft">📱 {v.clientWho}</p>
      <div className="grid grid-cols-3 gap-1.5">
        {btn('save', '💾', v.btnSave)}
        {btn('undo', '↶', v.btnUndo)}
        {btn('post', '📤', v.btnPost)}
      </div>
      {bubbles('client')}
    </Node>
  )

  /* The originator: the post being written. */
  const p = snap.post
  const flash = (f: Field) => Boolean(step?.changed.includes(f))
  const leak = snap.posted && p.aud === 'Public'
  const wrongPrice = snap.posted && p.price !== turn.goal.price
  const fieldBox = (f: Field, children: ReactNode, bad = false) => (
    <motion.div
      key={`${f}-${String(p[f])}`}
      initial={flash(f) ? { backgroundColor: 'rgba(234,179,8,0.55)' } : false}
      animate={{ backgroundColor: 'rgba(234,179,8,0)' }}
      transition={{ duration: 1.2 }}
      className={`min-w-0 rounded-md px-1 ${bad ? 'text-chili' : ''}`}
    >
      {children}
    </motion.div>
  )
  const photoTile = (ph: PhotoKey | null, small = false) =>
    ph ? (
      <span
        className={`grid shrink-0 place-items-center rounded-md border-2 border-edge ${small ? 'size-7 text-sm' : 'size-12 text-2xl'}`}
        style={{ backgroundColor: PHOTO[ph].bg }}
        aria-hidden="true"
      >
        {PHOTO[ph].icon}
      </span>
    ) : (
      <span
        className={`grid shrink-0 place-items-center rounded-md border-2 border-dashed border-edge/40 text-ink-soft ${small ? 'size-7 text-xs' : 'size-12 text-lg'}`}
        aria-hidden="true"
      >
        ∅
      </span>
    )
  const editorNode = (
    <Node
      role={level === 1 ? v.l1EditorRole : v.originatorRole}
      title="PostEditor"
      active={active('editor')}
      accent={snap.error === 'private' || (finished && !willSucceed) ? FAIL_COLOR : accent}
      mono
    >
      <p className={`-mt-1 mb-2 text-[11px] font-semibold ${level === 1 ? 'text-chili' : 'text-bottle dark:text-jade'}`}>
        {level === 1 ? `🔓 ${v.publicFields}` : `🔒 ${v.privateFields}`}
      </p>
      {/* the post preview */}
      <motion.div
        animate={kind === 'react' ? { x: [0, -5, 5, -3, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.5 }}
        className={`rounded-lg border-2 bg-paper p-2 ${leak || wrongPrice ? 'border-chili' : 'border-edge'}`}
      >
        <div className="mb-1 flex items-center gap-1.5 text-[11px]">
          <span className="grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: GOLPO_COLOR }} aria-hidden="true">
            g
          </span>
          <span className="min-w-0 flex-1 truncate font-bold text-ink">{v.shopName}</span>
          {fieldBox(
            'aud',
            <span className={`rounded border-2 px-1 font-bold whitespace-nowrap ${p.aud === 'Public' ? 'border-chili text-chili' : 'border-edge/40 text-ink'}`}>
              {AUD[p.aud].icon} {label(AUD[p.aud].label)}
            </span>,
          )}
        </div>
        <div className="flex gap-2">
          {showPhoto && fieldBox('photo', photoTile(p.photo))}
          <div className="min-w-0 flex-1">
            {fieldBox(
              'text',
              <p className={`text-xs leading-snug break-words ${p.text === 'txtScribble' ? 'font-extrabold text-chili' : 'text-ink'}`}>{label(p.text)}</p>,
            )}
            {fieldBox(
              'price',
              <p className="mt-0.5 text-sm font-extrabold tabular-nums">{fill(v.perPiece, { price: money(p.price) })}</p>,
              p.price !== turn.goal.price,
            )}
          </div>
        </div>
        <p className={`mt-1 truncate text-[10px] ${leak ? 'font-bold text-chili' : 'text-ink-soft'}`}>📍 {v.pickup}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
          {snap.posted ? (
            <motion.span
              initial={{ scale: 1.6, rotate: -12, opacity: 0 }}
              animate={{ scale: 1, rotate: -4, opacity: 1 }}
              className="rounded border-2 px-1.5 py-px text-white"
              style={{ backgroundColor: GOLPO_COLOR, borderColor: GOLPO_COLOR }}
            >
              📤 {v.posted}
            </motion.span>
          ) : (
            <span className="rounded border-2 border-dashed border-edge/40 px-1.5 py-px text-ink-soft">✏️ {v.draft}</span>
          )}
          {finished && willSucceed && (
            <motion.span initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="rounded border-2 border-bottle px-1.5 py-px text-bottle dark:border-jade dark:text-jade">
              🛒 {fill(v.ordersLine, { n: num(turn.orders), coins: money(turn.orders * turn.goal.price) })}
            </motion.span>
          )}
        </div>
      </motion.div>
      <AnimatePresence>
        {snap.packing && (
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: 16 }}
            className="mt-2 inline-flex items-center gap-1 rounded-md border-2 border-edge bg-mustard px-2 py-0.5 text-xs font-bold text-on-accent"
          >
            📦 {v.packing}
          </motion.p>
        )}
        {snap.error === 'private' && (
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            lang="en"
            className="mt-2 rounded-md border-2 border-chili bg-chili/10 px-2 py-0.5 font-mono text-[11px] font-bold text-chili"
          >
            🔒 {v.errPrivate}
          </motion.p>
        )}
      </AnimatePresence>
      {bubbles('editor')}
    </Node>
  )

  /* The store: PostScreen's hand-made copies (level 1) or History's sealed snapshots (levels 2-3). */
  const copyCard = (c: Card) => {
    const shown = c.kind === 'ref' ? p : c.post
    const row = (k: string, val: ReactNode, bad = false) => (
      <span className={`flex min-w-0 gap-1 ${bad ? 'text-chili' : ''}`}>
        <span lang="en" className="shrink-0 font-mono text-ink-soft">
          {k}:
        </span>
        <span className="min-w-0 truncate font-semibold">{val}</span>
      </span>
    )
    return (
      <div className={`rounded-md border-2 px-2 py-1 text-[11px] ${c.kind === 'ref' ? 'border-chili bg-chili/10' : 'border-edge/50 bg-paper'}`}>
        <p className="mb-0.5 flex items-center gap-1 font-bold text-ink">
          <span lang="en" className="font-mono">
            {snap.slot ? 'backup' : `#${c.n}`}
          </span>
          {snap.slot && <span className="text-[10px] font-normal text-ink-soft">({v.oneVar})</span>}
          {c.kind === 'ref' && <span className="text-[10px] text-chili">🔗 {v.sameObject}</span>}
        </p>
        <div className="grid grid-cols-1 gap-px">
          {row('text', label(shown.text))}
          {row('price', money(shown.price), shown.price !== turn.goal.price)}
          {c.noAud ? row('audience', `✗ ${v.notCopied}`, true) : row('audience', label(AUD[shown.aud].label), shown.aud !== turn.goal.aud)}
        </div>
      </div>
    )
  }
  const sealedCard = (c: Card) => (
    <div
      className={`flex items-center gap-1.5 rounded-md border-2 px-2 py-1 text-xs font-bold ${
        c.kind === 'live' ? 'border-chili bg-chili/10 text-chili' : 'border-edge bg-mustard text-on-accent'
      }`}
    >
      <span aria-hidden="true">{c.kind === 'live' ? '🔗' : '📦'}</span>
      {c.kind === 'live' ? (
        <span className="min-w-0 truncate">
          <span lang="en" className="font-mono">
            PostEditor
          </span>{' '}
          · {v.liveCard}
        </span>
      ) : (
        <>
          <span lang="en" className="font-mono">
            {`${v.snapshotLabel} #${c.n}`}
          </span>
          <span className="ml-auto flex shrink-0 items-center gap-0.5 text-[10px]">
            🔒 {v.sealed}
          </span>
        </>
      )}
    </div>
  )
  const cardsTopFirst = [...snap.cards].reverse()
  const storeNode = (
    <Node
      role={level === 1 ? v.noPatternRole : v.caretakerRole}
      title={level === 1 ? (snap.slot ? 'backup' : 'backups') : 'History'}
      active={active('store')}
      accent={snap.error === 'sealed' ? FAIL_COLOR : accent}
      mono
    >
      <p className="-mt-1 mb-2 text-[11px] text-ink-soft">{level === 1 ? v.backupsNote : v.historyNote}</p>
      <motion.div
        animate={kind === 'error' && snap.error === 'sealed' ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex min-h-10 flex-col gap-1.5 rounded-lg border-2 border-dashed border-edge/40 p-1.5"
      >
        <AnimatePresence initial={false} mode="popLayout">
          {cardsTopFirst.map((c) => (
            <motion.div
              key={`${c.n}-${c.kind}-${snap.slot ? c.post.price : ''}`}
              layout
              initial={{ opacity: 0, y: -24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -24, scale: 0.9 }}
              transition={{ duration: 0.45 }}
            >
              {level === 1 ? copyCard(c) : sealedCard(c)}
            </motion.div>
          ))}
        </AnimatePresence>
        {snap.cards.length === 0 && (
          <p className={`px-1 text-xs font-bold ${kind === 'empty' ? 'text-chili' : 'text-ink-soft'}`}>
            {level === 1 ? v.storeEmpty : v.historyEmpty}
          </p>
        )}
      </motion.div>
      <AnimatePresence>
        {snap.error === 'sealed' && (
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            lang="en"
            className="mt-2 rounded-md border-2 border-chili bg-chili/10 px-2 py-0.5 font-mono text-[11px] font-bold text-chili"
          >
            🔒 {v.errSealed}
          </motion.p>
        )}
      </AnimatePresence>
      {bubbles('store')}
    </Node>
  )

  /* Levels 2-3: the Memento role. */
  const fieldChip = (name: string, tone: 'old' | 'new' | 'missing' = 'old') => (
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
  const mementoNode = (
    <div className="mt-3">
      <Node role={v.mementoRole} title="PostSnapshot" active={false} accent={SAVE_COLOR} mono className="!bg-paper">
        <div className="flex flex-wrap gap-1.5">
          {fieldChip('🔒 text')}
          {fieldChip('🔒 price')}
          {fieldChip('🔒 audience')}
          {level === 3 && fieldChip(`🔒 photo · ${built ? v.newTag : v.notBuilt}`, built ? 'new' : 'missing')}
        </div>
        <p className="mt-1.5 text-[11px] text-ink-soft">{v.mementoNote}</p>
      </Node>
    </div>
  )

  const fail = lastSnap?.fail
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
            {willSucceed ? '🛒' : fail === 'leak' ? '📍' : fail === 'price' ? '😂' : '🤨'}
          </motion.span>
          {willSucceed
            ? fill(v.resultOk, { n: num(turn.orders), coins: money(pendingCoins) })
            : fail === 'leak'
              ? v.resultLeak
              : fail === 'price'
                ? v.resultPrice
                : v.resultText}
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
      <p className="font-display font-bold text-ink">📷 {v.builderTitle}</p>
      <div>
        <p className="label-caps text-ink-soft">{v.builderStep1}</p>
        <p className="mb-2 text-sm text-ink">{v.q1}</p>
        <div role="radiogroup" aria-label={v.builderStep1} className="grid grid-cols-1 gap-2">
          {(
            [
              ['ui', v.q1Ui],
              ['all', v.q1All],
              ['editor', v.q1Editor],
            ] as const
          ).map(([a, text]) => (
            <ChoiceButton
              key={a}
              selected={panel !== 'q1' && a === 'editor'}
              color={NEW_COLOR}
              text={text}
              onClick={() => answerQ1(a)}
              animate={shake.anim(`q1-${a}`)}
              className={`[&>span:last-child]:whitespace-normal [&>span:last-child]:break-words ${panel !== 'q1' && a !== 'editor' ? 'opacity-40' : ''}`}
            />
          ))}
        </div>
        {panel !== 'q1' && <NewCodeChip>+ private photo · PostSnapshot(…, photo)</NewCodeChip>}
      </div>

      {panel !== 'q1' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="label-caps text-ink-soft">{v.builderStep2}</p>
          <p className="mb-2 text-sm text-ink">{v.q2}</p>
          <div role="radiogroup" aria-label={v.builderStep2} className="grid grid-cols-1 gap-2">
            {(
              [
                ['list', v.q2List],
                ['no', v.q2No],
                ['check', v.q2Check],
              ] as const
            ).map(([a, text]) => (
              <ChoiceButton
                key={a}
                selected={panel === 'ready' && a === 'no'}
                color={NEW_COLOR}
                text={text}
                onClick={() => answerQ2(a)}
                animate={shake.anim(`q2-${a}`)}
                className={`[&>span:last-child]:whitespace-normal [&>span:last-child]:break-words ${panel === 'ready' && a !== 'no' ? 'opacity-40' : ''}`}
              />
            ))}
          </div>
          {panel === 'ready' && <NewCodeChip>class History {'{ /* unchanged */ }'}</NewCodeChip>}
        </motion.div>
      )}

      {panel === 'ready' && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full border-2 border-edge bg-mustard px-2 py-0.5 text-xs font-bold text-on-accent">+ {v.editsLine}</span>
            <span className="rounded-full border-2 border-bottle bg-bottle/10 px-2 py-0.5 text-xs font-bold text-bottle dark:border-jade dark:text-jade">
              ✓ {v.zeroEdits}
            </span>
          </div>
          <div className="flex justify-end">
            <Button variant="primary" onClick={tryIt} data-game="open-branch">
              📷 {v.flyIn}
            </Button>
          </div>
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
                    {'+ backups.push({ …, photo: ??? })'}
                  </code>
                </>
              )}
              {level === 2 && <p className="prose-text text-sm text-ink">{v.l2Summary}</p>}
              {level === 3 && (
                <Recap
                  title={v.recapTitle}
                  items={[
                    { icon: '✍️', text: v.recap1 },
                    { icon: '💾', text: v.recap2 },
                    { icon: '📷', text: v.recap3 },
                  ]}
                />
              )}
            </LevelCompleteCard>
          ) : (
            <motion.div key={`play-${level}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {turnCard}
              {level === 3 && panel && builder}
              {clientNode}
              <Connector
                label={level === 1 ? 'onSave() · onUndo()' : 'save() · restore(s)'}
                down={Boolean(conn(1))}
                up={Boolean(connUp(1))}
                downPacket={pkt(conn(1))}
                upPacket={pkt(connUp(1))}
                runKey={player.index}
              />
              {editorNode}
              <Connector
                label={level === 1 ? 'backups.push({…})' : 'push(s) · pop()'}
                down={Boolean(conn(2))}
                up={Boolean(connUp(2))}
                downPacket={pkt(conn(2))}
                upPacket={pkt(connUp(2))}
                runKey={player.index}
              />
              {storeNode}
              {level > 1 && mementoNode}
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
