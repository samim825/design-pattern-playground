import { AnimatePresence, motion } from 'framer-motion'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { ChoiceButton, GameHud, LevelCompleteCard, MissionBanner, NewCodeChip, Recap } from '@/components/game'
import { type Level, starsFor, useGameProgress, useShake } from '@/components/game/state'
import { Button } from '@/components/ui/Button'
import { StepControls } from '@/components/ui/StepControls'
import { Caption, Connector, Node, Packet, Stage, StatusDot, type Status } from '@/components/visual'
import { type PlayerStep, useStepPlayer } from '@/hooks/useStepPlayer'
import { formatNumber, formatTaka } from '@/lib/format'
import { fill } from '@/lib/template'
import type { CodeView, Lang, VisualProps } from '@/types/pattern'
import type { PrototypeContent } from './content.en'

/*
 * "Exam Office": a 3-level game.
 *   Level 1  no pattern: the learner retypes each set field by field (code panel: `without`)
 *   Level 2  Prototype: the learner picks the master; it clones itself, then the copy is shuffled (`main`)
 *   Level 3  the learner makes DiagramPaper cloneable without editing makeSet() (`with`)
 * Every turn is a step timeline, so the code panel lights up in sync.
 */

type Labels = PrototypeContent['visual']
type LabelKey = keyof Labels
type PaperId = 'math' | 'english' | 'science'
type Field = 'subject' | 'minutes' | 'marks' | 'questions'
type SetLabel = 'B' | 'C'

/* ------------------------------------------------------------------ */
/* Scenario data                                                       */
/* ------------------------------------------------------------------ */

const FIELDS: Field[] = ['subject', 'minutes', 'marks', 'questions']
const FIELD_LABEL: Record<Field, LabelKey> = {
  subject: 'fieldSubject',
  minutes: 'fieldTime',
  marks: 'fieldMarks',
  questions: 'fieldQuestions',
}

interface Paper {
  cls: 'ExamPaper' | 'DiagramPaper'
  icon: string
  color: string
  subject: LabelKey
  typo: LabelKey
  minutes: number
  marks: number
  questions: LabelKey[]
  diagrams?: LabelKey[]
  fee: number
}

// Fees are illustrative only (the UI says so).
const PAPERS: Record<PaperId, Paper> = {
  math: {
    cls: 'ExamPaper',
    icon: '📐',
    color: '#1D4ED8',
    subject: 'math',
    typo: 'mathTypo',
    minutes: 90,
    marks: 50,
    questions: ['mq1', 'mq2', 'mq3', 'mq4'],
    fee: 200,
  },
  english: {
    cls: 'ExamPaper',
    icon: '📖',
    color: '#B45309',
    subject: 'english',
    typo: 'englishTypo',
    minutes: 60,
    marks: 40,
    questions: ['eq1', 'eq2', 'eq3', 'eq4'],
    fee: 200,
  },
  science: {
    cls: 'DiagramPaper',
    icon: '🔬',
    color: '#15803D',
    subject: 'science',
    typo: 'science',
    minutes: 120,
    marks: 60,
    questions: ['sq1', 'sq2', 'sq3', 'sq4'],
    diagrams: ['dCell', 'dWater'],
    fee: 300,
  },
}

/** The order each set's questions end up in after shuffling (indexes into the master's list). */
const SHUFFLE: Record<SetLabel, number[]> = { B: [2, 0, 3, 1], C: [1, 3, 0, 2] }

interface Turn {
  teacher: LabelKey
  emoji: string
  paper: PaperId
  set: SetLabel
  /** Level 1: which fields show the wrong option first. */
  flip?: Partial<Record<Field, boolean>>
}

const TURNS: Record<Level, Turn[]> = {
  1: [
    { teacher: 'nusrat', emoji: '👩‍🏫', paper: 'math', set: 'B', flip: { marks: true } },
    { teacher: 'nusrat', emoji: '👩‍🏫', paper: 'math', set: 'C', flip: { subject: true, minutes: true, questions: true } },
    { teacher: 'mitu', emoji: '👩‍💼', paper: 'english', set: 'B', flip: { minutes: true } },
  ],
  2: [
    { teacher: 'nusrat', emoji: '👩‍🏫', paper: 'math', set: 'B' },
    { teacher: 'mitu', emoji: '👩‍💼', paper: 'english', set: 'B' },
    { teacher: 'nusrat', emoji: '👩‍🏫', paper: 'math', set: 'C' },
  ],
  3: [
    { teacher: 'karim', emoji: '👨‍🏫', paper: 'science', set: 'B' },
    { teacher: 'mitu', emoji: '👩‍💼', paper: 'english', set: 'C' },
    { teacher: 'karim', emoji: '👨‍🏫', paper: 'science', set: 'C' },
  ],
}

const LEVEL_ICON: Record<Level, string> = { 1: '⌨️', 2: '🧬', 3: '🔬' }

/** Level 1: the two options shown for a field, and which one is right. */
function fieldOptions(turn: Turn, field: Field): { value: string | number; correct: boolean }[] {
  const p = PAPERS[turn.paper]
  const right = field === 'subject' ? p.subject : field === 'minutes' ? p.minutes : field === 'marks' ? p.marks : p.questions.length
  const wrong =
    field === 'subject'
      ? p.typo
      : field === 'minutes'
        ? p.minutes === 90
          ? 60
          : 90
        : field === 'marks'
          ? p.marks === 50
            ? 40
            : 50
          : p.questions.length - 1
  const options = [
    { value: right, correct: true },
    { value: wrong, correct: false },
  ]
  return turn.flip?.[field] ? options.reverse() : options
}

const correctIndex = (turn: Turn, field: Field) => (turn.flip?.[field] ? 1 : 0)
const tutorialAnswers = (turn: Turn): Record<Field, number | null> => ({
  subject: correctIndex(turn, 'subject'),
  minutes: correctIndex(turn, 'minutes'),
  marks: correctIndex(turn, 'marks'),
  questions: correctIndex(turn, 'questions'),
})
const EMPTY_ANSWERS: Record<Field, number | null> = { subject: null, minutes: null, marks: null, questions: null }

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

type Kind = 'new' | 'field' | 'make' | 'clone' | 'header' | 'questions' | 'diagrams' | 'cloned' | 'label' | 'shuffle' | 'result'

interface GameStep extends PlayerStep {
  kind: Kind
  caption: string
  field?: Field
}

/** Step ids double as code-step ids: they match the `// @step:` markers in code/*.ts. */
function buildSteps(level: Level, turn: Turn, answers: Record<Field, number | null>, master: PaperId | null): GameStep[] {
  if (level === 1) {
    if (FIELDS.some((f) => answers[f] === null)) return []
    const ok = FIELDS.every((f) => answers[f] === correctIndex(turn, f))
    return [
      { id: 'l1-new', kind: 'new', caption: 'l1-new' },
      ...FIELDS.map<GameStep>((f) => ({
        id: `l1-${f}`,
        kind: 'field',
        field: f,
        caption: answers[f] === correctIndex(turn, f) ? 'l1-field-ok' : 'l1-field-bad',
        duration: 1300,
      })),
      { id: 'l1-check', kind: 'result', caption: ok ? 'l1-ok' : 'l1-fail', duration: 1100 },
    ]
  }
  if (!master) return []
  if (master === 'science') {
    return [
      { id: 'd-make-set', kind: 'make', caption: 'd-make-set' },
      { id: 'd-clone', kind: 'clone', caption: 'd-clone' },
      { id: 'd-copy-header', kind: 'header', caption: 'copy-header', duration: 1400 },
      { id: 'd-copy-questions', kind: 'questions', caption: 'copy-questions', duration: 1400 },
      { id: 'd-copy-diagrams', kind: 'diagrams', caption: 'd-copy-diagrams', duration: 1400 },
      { id: 'd-cloned', kind: 'cloned', caption: 'cloned' },
      { id: 'd-label', codeStep: 'd-make-set', kind: 'label', caption: 'label' },
      { id: 'd-shuffle', codeStep: 'd-make-set', kind: 'shuffle', caption: 'shuffle', duration: 1600 },
      { id: 'd-done', kind: 'result', caption: 'd-done', duration: 1000 },
    ]
  }
  return [
    { id: 'make-set', kind: 'make', caption: 'make-set' },
    { id: 'clone', kind: 'clone', caption: 'clone' },
    { id: 'copy-header', kind: 'header', caption: 'copy-header', duration: 1400 },
    { id: 'copy-questions', kind: 'questions', caption: 'copy-questions', duration: 1400 },
    { id: 'cloned', kind: 'cloned', caption: 'cloned' },
    { id: 'label', kind: 'label', caption: 'label' },
    { id: 'shuffle', kind: 'shuffle', caption: 'shuffle', duration: 1600 },
    { id: 'done', kind: 'result', caption: 'done', duration: 1000 },
  ]
}

/* ------------------------------------------------------------------ */
/* A printed exam paper                                                */
/* ------------------------------------------------------------------ */

function PaperCard({
  color,
  subject,
  meta,
  setLabel,
  questions,
  diagrams,
  diagramsLabel,
  bad = [],
  compact = false,
  lang,
}: {
  color: string
  subject?: string
  meta?: string
  setLabel?: string
  questions?: string[]
  diagrams?: string[]
  diagramsLabel: string
  bad?: ('subject' | 'meta' | 'questions')[]
  compact?: boolean
  lang: Lang
}) {
  return (
    <div
      className="relative rounded-md border-2 border-edge/40 bg-card p-2.5 text-ink shadow-hard-sm"
      style={{ borderTopColor: color, borderTopWidth: 4 }}
    >
      {setLabel && (
        <motion.span
          key={setLabel}
          initial={{ scale: 1.6, rotate: -14, opacity: 0 }}
          animate={{ scale: 1, rotate: -6, opacity: 1 }}
          className="absolute -top-2 right-2 rounded border-2 px-1.5 text-xs font-extrabold"
          style={{ borderColor: color, color, backgroundColor: 'var(--c-card)' }}
          lang="en"
        >
          {setLabel}
        </motion.span>
      )}
      <p className={`truncate pr-8 font-display text-sm font-bold ${bad.includes('subject') ? 'text-chili line-through' : ''}`}>
        {subject ?? '…'}
      </p>
      <p className={`text-xs tabular-nums ${bad.includes('meta') ? 'font-bold text-chili' : 'text-ink-soft'}`}>{meta ?? '…'}</p>
      {questions && (
        <ol className={`mt-1.5 flex flex-col gap-0.5 ${compact ? 'text-[11px]' : 'text-xs'}`}>
          {questions.map((q, i) => (
            <motion.li
              key={q}
              layout
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className={`flex min-w-0 gap-1.5 rounded px-1 ${bad.includes('questions') && i === questions.length - 1 ? 'text-chili' : ''}`}
            >
              <span className="shrink-0 font-bold tabular-nums">{formatNumber(i + 1, lang)}.</span>
              <span className="truncate">{q}</span>
            </motion.li>
          ))}
        </ol>
      )}
      {diagrams && diagrams.length > 0 && (
        <p className="mt-1.5 flex flex-wrap items-center gap-1 text-[11px]">
          <span className="text-ink-soft">{diagramsLabel}:</span>
          {diagrams.map((d) => (
            <motion.span
              key={d}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="rounded bg-jade/15 px-1.5 font-semibold text-ink"
            >
              🖼️ {d}
            </motion.span>
          ))}
        </p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Visual                                                              */
/* ------------------------------------------------------------------ */

export default function PrototypeVisual({ content, lang, onCodeStep, onCodeView }: VisualProps<PrototypeContent>) {
  const v = content.visual
  const captions: Record<string, string> = content.steps
  const label = (key: LabelKey) => v[key]

  const { progress, addCoins, completeLevel, reset: resetProgress } = useGameProgress('dpp-prototype-game')
  const shake = useShake()
  const [level, setLevel] = useState<Level>(1)
  const [turnIdx, setTurnIdx] = useState(0)
  const [results, setResults] = useState<('ok' | 'fail')[]>([])
  const [mistakes, setMistakes] = useState(0)
  const [answers, setAnswers] = useState<Record<Field, number | null>>(tutorialAnswers(TURNS[1][0])) // guided tutorial
  const [master, setMaster] = useState<PaperId | null>(null)
  const [scienceBuilt, setScienceBuilt] = useState(false)
  const [panel, setPanel] = useState<'q1' | 'q2' | 'ready' | null>(null)
  const [hint, setHint] = useState<{ key: string; values?: Record<string, string> } | null>(null)
  const [levelDone, setLevelDone] = useState(false)
  const [lastStars, setLastStars] = useState(0)

  const turn = TURNS[level][turnIdx]
  const paper = PAPERS[turn.paper]
  const steps = useMemo(() => buildSteps(level, turn, answers, master), [level, turn, answers, master])
  const player = useStepPlayer(steps)
  const step = player.step
  const kind = step?.kind ?? null
  const busy = player.index >= 0
  const at = (id: string) => steps.findIndex((s) => s.id === id)
  const reachedKind = (k: Kind) => {
    const i = steps.findIndex((s) => s.kind === k)
    return i >= 0 && player.index >= i
  }

  const l1Ok = FIELDS.every((f) => answers[f] === correctIndex(turn, f))
  const willSucceed = level === 1 ? l1Ok : true
  const outcome: 'ok' | 'fail' | null = player.done ? (willSucceed ? 'ok' : 'fail') : null
  const pendingCoins = outcome === 'ok' ? paper.fee : 0
  const accent = paper.color

  /* ---------------- code panel sync ---------------- */

  const view: CodeView =
    level === 1
      ? 'without'
      : level === 3 && (panel || master === 'science' || (turn.paper === 'science' && !levelDone))
        ? 'with'
        : 'main'
  useEffect(() => {
    onCodeView?.(view)
  }, [view, onCodeView])
  useEffect(() => () => onCodeView?.('main'), [onCodeView])

  const firstEmpty = FIELDS.find((f) => answers[f] === null)
  let idleCode: string | null = null
  if (level === 1) idleCode = levelDone ? 'l1-todo' : firstEmpty ? `l1-${firstEmpty}` : 'l1-new'
  else if (panel === 'q1') idleCode = 'build-diagram'
  else if (panel) idleCode = 'd-make-set'
  else if (master === 'science') idleCode = 'd-make-set'
  else if (master && !levelDone) idleCode = 'pick-master'
  const codeStep = step ? (step.codeStep ?? step.id) : idleCode
  useEffect(() => {
    onCodeStep(codeStep)
  }, [codeStep, onCodeStep])

  /* ---------------- actions ---------------- */

  const resetTurn = () => {
    player.reset()
    setAnswers(EMPTY_ANSWERS)
    setMaster(null)
    setHint(null)
  }

  const startLevel = (n: Level) => {
    resetTurn()
    setLevel(n)
    setTurnIdx(0)
    setResults([])
    setMistakes(0)
    if (n === 1) setAnswers(tutorialAnswers(TURNS[1][0]))
    setScienceBuilt(false)
    setPanel(null)
    setLevelDone(false)
  }

  const restartGame = () => {
    resetProgress()
    startLevel(1)
  }

  const answer = (f: Field, i: number) => {
    if (busy) return
    player.reset()
    setHint(null)
    setAnswers((a) => ({ ...a, [f]: i }))
  }

  const pickMaster = (p: PaperId) => {
    if (busy || panel) return
    if (p === 'science' && !scienceBuilt) {
      if (turn.paper === 'science') {
        setHint(null)
        setMaster(null)
        setPanel('q1')
      } else {
        shake.bump(p)
        setHint({ key: 'wrong-master', values: { picked: label('science') } })
      }
      return
    }
    if (turn.paper === 'science' && !scienceBuilt) {
      shake.bump(p)
      setHint({ key: 'need-build' })
      return
    }
    if (p !== turn.paper) {
      shake.bump(p)
      setMistakes((m) => m + 1)
      setHint({ key: 'wrong-master', values: { picked: label(PAPERS[p].subject) } })
      return
    }
    player.reset()
    setHint(null)
    setMaster(p)
  }

  const answerQ1 = (id: 'ownClone' | 'instanceof' | 'reuse') => {
    if (panel !== 'q1') return
    if (id === 'ownClone') {
      setHint(null)
      setPanel('q2')
      return
    }
    shake.bump(`q1-${id}`)
    setMistakes((m) => m + 1)
    setHint({ key: id === 'instanceof' ? 'wrong-instanceof' : 'wrong-reuse' })
  }

  const answerQ2 = (id: 'nothing' | 'check' | 'copyDiagrams') => {
    if (panel !== 'q2') return
    if (id === 'nothing') {
      setHint(null)
      setPanel('ready')
      return
    }
    shake.bump(`q2-${id}`)
    setMistakes((m) => m + 1)
    setHint({ key: id === 'check' ? 'wrong-check' : 'wrong-copy-diagrams' })
  }

  const plugDiagramPaper = () => {
    player.reset()
    setScienceBuilt(true)
    setPanel(null)
    setMaster('science')
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
      return // try the same request again
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

  /* ---------------- text helpers ---------------- */

  const fmtMinutes = (n: number) => fill(v.minutesFmt, { n: formatNumber(n, lang) })
  const fmtMarks = (n: number) => fill(v.marksFmt, { n: formatNumber(n, lang) })
  const fmtQuestions = (n: number) => fill(v.questionsFmt, { n: formatNumber(n, lang) })
  const showValue = (f: Field, value: string | number) =>
    f === 'subject'
      ? label(value as LabelKey)
      : f === 'minutes'
        ? fmtMinutes(value as number)
        : f === 'marks'
          ? fmtMarks(value as number)
          : fmtQuestions(value as number)
  const chosen = (f: Field) => {
    const i = answers[f]
    return i === null ? null : fieldOptions(turn, f)[i]
  }
  const expectedValue = (f: Field) => fieldOptions(turn, f)[correctIndex(turn, f)].value

  /* ---------------- caption ---------------- */

  const firstBad = FIELDS.find((f) => answers[f] !== null && answers[f] !== correctIndex(turn, f))
  const capField: Field = step?.field ?? firstBad ?? 'subject'
  const capChosen = chosen(capField)
  const values: Record<string, string> = {
    name: label(turn.teacher),
    set: turn.set,
    subject: label(paper.subject),
    minutes: fmtMinutes(paper.minutes),
    marks: fmtMarks(paper.marks),
    fee: formatTaka(paper.fee, lang),
    field: label(FIELD_LABEL[capField]),
    value: capChosen ? showValue(capField, capChosen.value) : '',
    expected: showValue(capField, expectedValue(capField)),
    diagrams: (paper.diagrams ?? []).map((d) => label(d)).join(', '),
    ...(!step ? hint?.values : undefined),
  }

  let captionKey: string
  if (step) captionKey = step.caption
  else if (hint) captionKey = hint.key
  else if (levelDone) captionKey = `level${level}-done`
  else if (panel === 'q1') captionKey = 'build-q1'
  else if (panel === 'q2') captionKey = 'build-q2'
  else if (panel === 'ready') captionKey = 'build-ready'
  else if (level === 1) captionKey = firstEmpty ? 'idle1' : turnIdx === 0 && results.length === 0 ? 'tutorial' : 'filled1'
  else if (master === turn.paper) captionKey = 'ready'
  else captionKey = turn.paper === 'science' && !scienceBuilt ? 'need-build' : 'idle2'
  const caption = fill(captions[captionKey] ?? '', values)

  /* ---------------- pieces ---------------- */

  const status = (id: string): Status => {
    const i = at(id)
    if (i < 0 || player.index < i) return 'pending'
    return player.index === i ? 'active' : 'done'
  }

  const turnOf = fill(v.turnOf, { n: formatNumber(turnIdx + 1, lang), total: formatNumber(TURNS[level].length, lang) })
  const ready = level === 1 ? !firstEmpty : master === turn.paper
  const prefix = master === 'science' ? 'd-' : ''

  // The master (Set A) and the new set as it gets printed.
  const masterCard = (p: Paper, compact = false) => (
    <PaperCard
      color={p.color}
      subject={label(p.subject)}
      meta={`${fmtMinutes(p.minutes)} · ${fmtMarks(p.marks)}`}
      setLabel="A"
      questions={p.questions.map((q) => label(q))}
      diagrams={p.diagrams?.map((d) => label(d))}
      diagramsLabel={v.diagramsLabel}
      compact={compact}
      lang={lang}
    />
  )

  let newSet: ReactNode
  if (level === 1) {
    const checked = (f: Field) => player.index >= at(`l1-${f}`) && at(`l1-${f}`) >= 0
    const bad: ('subject' | 'meta' | 'questions')[] = []
    if (checked('subject') && answers.subject !== correctIndex(turn, 'subject')) bad.push('subject')
    if (
      (checked('minutes') && answers.minutes !== correctIndex(turn, 'minutes')) ||
      (checked('marks') && answers.marks !== correctIndex(turn, 'marks'))
    )
      bad.push('meta')
    if (checked('questions') && answers.questions !== correctIndex(turn, 'questions')) bad.push('questions')
    const sub = chosen('subject')
    const min = chosen('minutes')
    const mk = chosen('marks')
    const qs = chosen('questions')
    newSet = busy ? (
      <PaperCard
        color={paper.color}
        subject={checked('subject') && sub ? showValue('subject', sub.value) : undefined}
        meta={
          checked('marks') && min && mk
            ? `${showValue('minutes', min.value)} · ${showValue('marks', mk.value)}`
            : checked('minutes') && min
              ? showValue('minutes', min.value)
              : undefined
        }
        setLabel={turn.set}
        questions={checked('questions') && qs ? paper.questions.slice(0, qs.value as number).map((q) => label(q)) : undefined}
        diagramsLabel={v.diagramsLabel}
        bad={bad}
        lang={lang}
      />
    ) : null
  } else if (master) {
    const p = PAPERS[master]
    const order = reachedKind('shuffle') ? SHUFFLE[turn.set].map((i) => p.questions[i]) : p.questions
    newSet = reachedKind('header') ? (
      <PaperCard
        color={p.color}
        subject={label(p.subject)}
        meta={`${fmtMinutes(p.minutes)} · ${fmtMarks(p.marks)}`}
        setLabel={reachedKind('label') ? turn.set : 'A'}
        questions={reachedKind('questions') ? order.map((q) => label(q)) : undefined}
        diagrams={reachedKind('diagrams') ? p.diagrams?.map((d) => label(d)) : undefined}
        diagramsLabel={v.diagramsLabel}
        lang={lang}
      />
    ) : null
  }

  const resultStamp = (
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
              {willSucceed ? '✅' : '❌'}
            </motion.span>
            {willSucceed ? v.approved : v.rejected}
          </span>
          {willSucceed && <span className="tabular-nums">{formatTaka(paper.fee, lang)}</span>}
        </motion.div>
      )}
    </AnimatePresence>
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
                    {"new ExamPaper('Class 8 Math', ???)"}
                  </code>
                </>
              )}
              {level === 2 && <p className="prose-text text-sm text-ink">{v.l2Summary}</p>}
              {level === 3 && (
                <Recap
                  title={v.recapTitle}
                  items={[
                    { icon: '⌨️', text: v.recap1 },
                    { icon: '🧬', text: v.recap2 },
                    { icon: '🔬', text: v.recap3 },
                  ]}
                />
              )}
            </LevelCompleteCard>
          ) : (
            <motion.div key={`play-${level}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* ── Client: the request + choices ──────────────── */}
              <Node
                role={v.clientRole}
                title={`🏫 ${v.deskTitle}`}
                active={kind === 'new' || kind === 'make' || kind === 'result'}
                accent={accent}
              >
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
                      <p className="truncate font-bold text-ink">{label(turn.teacher)}</p>
                      <span
                        className="mt-1 inline-flex max-w-full items-center gap-1 truncate rounded-full border-2 border-[#2b1d16] px-2 py-0.5 text-xs font-bold text-white"
                        style={{ backgroundColor: paper.color }}
                      >
                        <span aria-hidden="true">{paper.icon}</span> {label(paper.subject)} · {fill(v.needsSet, { set: turn.set })}
                      </span>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {level === 1 ? (
                  <>
                    <p className="mb-1.5 label-caps text-ink-soft">{v.masterLabel}</p>
                    <div className="mb-3">{masterCard(paper, true)}</div>
                    <p className="mb-1.5 label-caps text-ink-soft">{fill(v.retypeLabel, { set: turn.set })}</p>
                    <div className="flex flex-col gap-2.5">
                      {FIELDS.map((f) => (
                        <div key={f} className="flex flex-col gap-1">
                          <span className="text-xs font-semibold text-ink-soft">{label(FIELD_LABEL[f])}</span>
                          <div role="radiogroup" aria-label={label(FIELD_LABEL[f])} className="grid grid-cols-2 gap-1.5">
                            {fieldOptions(turn, f).map((o, i) => (
                              <ChoiceButton
                                key={i}
                                selected={answers[f] === i}
                                color="#0b6b4f"
                                text={showValue(f, o.value)}
                                onClick={() => answer(f, i)}
                                animate={shake.anim(`${f}-${i}`)}
                                className="py-1.5"
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mb-2">
                      <span className="inline-flex items-center gap-1 rounded-full border-2 border-bottle/60 bg-bottle/10 px-2 py-0.5 text-xs font-bold text-bottle dark:text-jade">
                        ✓ {v.noRetyping}
                      </span>
                    </p>
                    <p id="pt-master-label" className="mb-1.5 label-caps text-ink-soft">
                      {v.pickMaster}
                    </p>
                    <div
                      role="radiogroup"
                      aria-labelledby="pt-master-label"
                      className={`grid gap-2 ${level === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}
                    >
                      {(['math', 'english'] as PaperId[]).map((p) => (
                        <ChoiceButton
                          key={p}
                          selected={master === p}
                          color={PAPERS[p].color}
                          icon={PAPERS[p].icon}
                          text={label(PAPERS[p].subject)}
                          onClick={() => pickMaster(p)}
                          animate={shake.anim(p)}
                        />
                      ))}
                      {level === 3 && (
                        <ChoiceButton
                          selected={scienceBuilt ? master === 'science' : panel !== null}
                          color={PAPERS.science.color}
                          icon={scienceBuilt ? PAPERS.science.icon : '🔨'}
                          text={scienceBuilt ? label('science') : `${v.buildSlot}: ${label('science')}`}
                          onClick={() => pickMaster('science')}
                          animate={shake.anim('science')}
                          className={!scienceBuilt && panel === null ? 'border-dashed' : ''}
                        />
                      )}
                    </div>
                  </>
                )}
              </Node>

              <Connector
                label={level === 1 ? 'new ExamPaper(…)' : `makeSet(m, '${turn.set}')`}
                down={kind === 'new' || kind === 'make' || kind === 'clone'}
                up={kind === 'result' && willSucceed}
                downPacket={<Packet color={accent}>📝 {fill(v.needsSet, { set: turn.set })}</Packet>}
                upPacket={<Packet color="#0b6b4f">📄 {turn.set}</Packet>}
                runKey={player.index}
              />

              {/* ── Middle: retyping (L1) or the ConcretePrototype (L2/3) ── */}
              {level === 1 ? (
                <Node role={v.noPatternRole} title="new ExamPaper(…)" active={kind === 'new' || kind === 'field'} accent="#B91C1C" mono>
                  <ol className="flex flex-col gap-1">
                    {FIELDS.map((f) => {
                      const st = status(`l1-${f}`)
                      const c = chosen(f)
                      const right = answers[f] === correctIndex(turn, f)
                      const checked = st !== 'pending'
                      return (
                        <motion.li
                          key={f}
                          animate={{ x: st === 'active' ? 4 : 0 }}
                          className={`flex min-w-0 items-center gap-2 rounded-md border-2 px-2 py-1 ${
                            st === 'active' ? 'border-edge bg-card shadow-hard-sm' : 'border-transparent'
                          }`}
                        >
                          <span className="w-20 shrink-0 truncate text-xs text-ink-soft sm:w-24">{label(FIELD_LABEL[f])}</span>
                          <span
                            className={`min-w-0 flex-1 truncate rounded-md border-2 px-2 py-0.5 text-xs font-bold ${
                              !c
                                ? 'border-dashed border-edge/40 text-ink-soft/50'
                                : checked && !right
                                  ? 'border-chili bg-chili/10 text-chili'
                                  : checked
                                    ? 'border-bottle/60 bg-bottle/10 text-ink'
                                    : 'border-edge/60 bg-card text-ink'
                            }`}
                          >
                            {c ? showValue(f, c.value) : '?'}
                          </span>
                          <span className="w-5 shrink-0 text-center text-sm font-bold" aria-hidden="true">
                            {checked ? (right ? '✓' : '✗') : ''}
                          </span>
                        </motion.li>
                      )
                    })}
                  </ol>
                  <p className="mt-2 flex items-center justify-between gap-2 border-t-2 border-dashed border-edge/40 pt-2 text-xs text-ink-soft">
                    <span>{v.fieldsLabel}</span>
                    <span className="font-mono font-bold text-chili tabular-nums">{formatNumber(FIELDS.length, lang)}</span>
                  </p>
                </Node>
              ) : (
                <Node
                  role={v.concretePrototypeRole}
                  title={panel ? 'DiagramPaper' : master ? PAPERS[master].cls : 'ExamPaper'}
                  active={panel !== null || kind === 'clone' || kind === 'header' || kind === 'questions' || kind === 'diagrams' || kind === 'cloned'}
                  accent={panel ? PAPERS.science.color : accent}
                  mono
                >
                  <p className="-mt-1 mb-3 flex flex-wrap items-center gap-1.5 font-mono text-xs text-ink-soft" lang="en">
                    {v.implementsLabel} <span className="font-bold text-ink">Prototype</span>
                    <span className="rounded border border-edge/40 px-1 py-px font-sans text-[10px] tracking-wider uppercase">
                      {v.prototypeTag}
                    </span>
                    {(panel || master === 'science') && (
                      <span className="rounded bg-bottle px-1.5 py-px font-sans text-[10px] font-bold text-cream uppercase">
                        {v.newTag}
                      </span>
                    )}
                  </p>

                  {panel ? (
                    /* ── Level 3 builder ─────────────────────── */
                    <div className="flex flex-col gap-3 rounded-lg border-2 border-dashed p-3" style={{ borderColor: PAPERS.science.color }}>
                      <p className="font-display font-bold text-ink">🔨 {v.builderTitle}</p>
                      <div>
                        <p className="label-caps text-ink-soft">{v.builderStep1}</p>
                        <p className="mb-2 text-sm text-ink">{v.q1}</p>
                        <div role="radiogroup" aria-label={v.q1} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          {(
                            [
                              ['ownClone', v.q1OwnClone],
                              ['instanceof', v.q1Instanceof],
                              ['reuse', v.q1Reuse],
                            ] as const
                          ).map(([id, text]) => (
                            <ChoiceButton
                              key={id}
                              selected={panel !== 'q1' && id === 'ownClone'}
                              color={PAPERS.science.color}
                              text={text}
                              onClick={() => answerQ1(id)}
                              animate={shake.anim(`q1-${id}`)}
                              className={panel !== 'q1' && id !== 'ownClone' ? 'opacity-40' : ''}
                            />
                          ))}
                        </div>
                        {panel !== 'q1' && <NewCodeChip>+ class DiagramPaper extends ExamPaper {'{'} clone() … {'}'}</NewCodeChip>}
                      </div>

                      {panel !== 'q1' && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                          <p className="label-caps text-ink-soft">{v.builderStep2}</p>
                          <p className="mb-2 text-sm text-ink">{v.q2}</p>
                          <div role="radiogroup" aria-label={v.q2} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            {(
                              [
                                ['nothing', v.q2Nothing],
                                ['check', v.q2Check],
                                ['copyDiagrams', v.q2CopyDiagrams],
                              ] as const
                            ).map(([id, text]) => (
                              <ChoiceButton
                                key={id}
                                selected={panel === 'ready' && id === 'nothing'}
                                color={PAPERS.science.color}
                                text={text}
                                onClick={() => answerQ2(id)}
                                animate={shake.anim(`q2-${id}`)}
                                className={panel === 'ready' && id !== 'nothing' ? 'opacity-40' : ''}
                              />
                            ))}
                          </div>
                          {panel === 'ready' && <NewCodeChip>+ makeSet(scienceMaster, 'B')</NewCodeChip>}
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
                          <Button variant="primary" onClick={plugDiagramPaper} data-game="open-branch">
                            🔬 {v.useBuilder}
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  ) : master ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {masterCard(PAPERS[master], true)}
                      <div>
                        <p className="mb-1.5 label-caps text-ink-soft">{v.cloneSteps}</p>
                        <ol className="flex flex-col gap-1">
                          {(
                            [
                              [v.stepHeader, `${prefix}copy-header`],
                              [v.stepQuestions, `${prefix}copy-questions`],
                              ...(master === 'science' ? [[v.stepDiagrams, 'd-copy-diagrams']] : []),
                              [v.stepReturn, `${prefix}cloned`],
                            ] as [string, string][]
                          ).map(([text, id]) => {
                            const st = status(id)
                            return (
                              <motion.li
                                key={id}
                                animate={{ x: st === 'active' ? 4 : 0 }}
                                className={`flex min-w-0 items-center gap-2 rounded-md border-2 px-2 py-0.5 text-xs ${
                                  st === 'active' ? 'border-edge bg-card font-bold shadow-hard-sm' : 'border-transparent'
                                } ${st === 'pending' ? 'text-ink-soft/70' : 'text-ink'}`}
                              >
                                <StatusDot status={st} color={accent} />
                                <span className="min-w-0 truncate">{text}</span>
                              </motion.li>
                            )
                          })}
                        </ol>
                      </div>
                    </div>
                  ) : (
                    <p className="rounded-lg border-2 border-dashed border-edge/40 px-3 py-4 text-center text-sm text-ink-soft">
                      {v.noMaster}
                    </p>
                  )}
                </Node>
              )}

              <Connector
                label={level === 1 ? 'print(set)' : 'clone()'}
                down={kind === 'field' || kind === 'header' || kind === 'questions' || kind === 'diagrams'}
                up={kind === 'cloned'}
                downPacket={<Packet color={accent}>📄 {level === 1 ? '⌨️' : '🧬'}</Packet>}
                upPacket={<Packet color="#0b6b4f">📄 {v.cloneRole}</Packet>}
                runKey={player.index}
              />

              {/* ── Bottom: the new set ──────────────────────────── */}
              <Node
                role={level === 1 ? v.productRole : v.cloneRole}
                title={fill(v.setTitle, { set: turn.set })}
                active={kind === 'field' || kind === 'label' || kind === 'shuffle' || kind === 'result'}
                accent={accent}
                mono
              >
                {newSet ?? <p className="rounded-lg border-2 border-dashed border-edge/40 px-3 py-5 text-center text-sm text-ink-soft">{v.emptyPaper}</p>}
                {resultStamp}
              </Node>
            </motion.div>
          )}
        </AnimatePresence>
      </Stage>

      <Caption label={v.whatsHappening} text={caption} stepKey={`${captionKey}-${lang}-${turnIdx}`} />

      {outcome && !levelDone && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
          <Button variant="primary" onClick={afterOutcome} data-game="after-outcome">
            {outcome === 'fail' ? `↻ ${v.tryAgain}` : isLastTurn ? `🏁 ${v.finishLevel}` : `${v.nextRequest} →`}
          </Button>
        </motion.div>
      )}

      {!levelDone && (
        <StepControls player={controls} playLabel={`🖨️ ${v.printButton}`} disabled={!ready || outcome !== null || panel !== null} />
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
