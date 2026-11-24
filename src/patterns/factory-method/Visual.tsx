import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { StepControls } from '@/components/ui/StepControls'
import { Caption, Connector, Node, Packet, Stage, StatusDot, type Status } from '@/components/visual'
import { type PlayerStep, useStepPlayer } from '@/hooks/useStepPlayer'
import { formatTaka } from '@/lib/format'
import { fill } from '@/lib/template'
import type { VisualProps } from '@/types/pattern'
import type { FactoryMethodContent } from './content.en'

/* ------------------------------------------------------------------ */
/* Scenario data                                                       */
/* ------------------------------------------------------------------ */

type BranchId = 'dhaka' | 'chattogram' | 'barishal'
type DestKey = 'mirpur' | 'agrabad' | 'bhola'
type EtaKey = 'etaDhaka' | 'etaChattogram' | 'etaBarishal'
type HowKey = 'howDhaka' | 'howChattogram' | 'howBarishal'

interface Branch {
  id: BranchId
  branchClass: string
  productClass: string
  vehicle: string
  fee: number
  color: string
  dest: DestKey
  destCode: string
  eta: EtaKey
  how: HowKey
  tracking: string
  /** Look of the route strip the vehicle travels along. */
  route: string
}

// Fees are illustrative only (the UI says so).
const BRANCHES: Branch[] = [
  {
    id: 'dhaka',
    branchClass: 'DhakaBranch',
    productClass: 'RickshawVan',
    vehicle: '🛺',
    fee: 60,
    color: '#C2410C',
    dest: 'mirpur',
    destCode: 'Mirpur',
    eta: 'etaDhaka',
    how: 'howDhaka',
    tracking: 'SC-1024',
    route: 'repeating-linear-gradient(90deg, #C2410C33 0 10px, transparent 10px 18px)',
  },
  {
    id: 'chattogram',
    branchClass: 'ChattogramBranch',
    productClass: 'Truck',
    vehicle: '🚚',
    fee: 150,
    color: '#4B5563',
    dest: 'agrabad',
    destCode: 'Agrabad',
    eta: 'etaChattogram',
    how: 'howChattogram',
    tracking: 'SC-2048',
    route: 'linear-gradient(#4B556340, #4B556340) center / 100% 100%, repeating-linear-gradient(90deg, #F5C518 0 14px, transparent 14px 26px) center / 100% 3px no-repeat',
  },
  {
    id: 'barishal',
    branchClass: 'BarishalBranch',
    productClass: 'Launch',
    vehicle: '⛴️',
    fee: 120,
    color: '#1D6FA5',
    dest: 'bhola',
    destCode: 'Bhola',
    eta: 'etaBarishal',
    how: 'howBarishal',
    tracking: 'SC-4096',
    route: 'repeating-linear-gradient(90deg, #1D6FA540 0 20px, #1D6FA526 20px 40px)',
  },
]

const BRANCH_ICON: Record<BranchId, string> = { dhaka: '🏙️', chattogram: '⚓', barishal: '🌊' }

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

type StepKind = 'client-send' | 'call-factory' | 'create' | 'book' | 'deliver' | 'drive' | 'done'

interface VisualStep extends PlayerStep {
  kind: StepKind
}

/** Step ids double as code-step ids — they match the `// @step:` markers in code/*.ts. */
function buildSteps(b: Branch): VisualStep[] {
  return [
    { id: 'client-send', kind: 'client-send' },
    { id: 'call-factory', kind: 'call-factory', duration: 1600 },
    { id: `${b.id}-create`, kind: 'create', duration: 1800 },
    { id: 'book', kind: 'book' },
    { id: 'deliver', kind: 'deliver' },
    { id: `${b.id}-deliver`, kind: 'drive', duration: 2400 },
    { id: 'done', kind: 'done', duration: 1000 },
  ]
}

const ORDER: StepKind[] = ['client-send', 'call-factory', 'create', 'book', 'deliver', 'drive', 'done']
const at = (kind: StepKind) => ORDER.indexOf(kind)

/* ------------------------------------------------------------------ */
/* Visual                                                              */
/* ------------------------------------------------------------------ */

export default function FactoryMethodVisual({ content, lang, onCodeStep }: VisualProps<FactoryMethodContent>) {
  const v = content.visual
  const captions: Record<string, string> = content.steps

  const [branchId, setBranchId] = useState<BranchId>('dhaka')
  const [justPicked, setJustPicked] = useState(false)

  const branch = BRANCHES.find((b) => b.id === branchId) ?? BRANCHES[0]
  const steps = useMemo(() => buildSteps(branch), [branch])
  const player = useStepPlayer(steps)
  const step = player.step
  const kind = step?.kind ?? null
  const i = player.index

  const created = i >= at('create')
  const arrived = i >= at('drive')

  // Which code line(s) are "running": the current step, or the client's branch pick while idle.
  const codeStep = step ? (step.codeStep ?? step.id) : justPicked ? 'pick-branch' : null
  useEffect(() => {
    onCodeStep(codeStep)
  }, [codeStep, onCodeStep])

  const selectBranch = (id: BranchId) => {
    if (id === branchId && i < 0) return
    player.reset()
    setBranchId(id)
    setJustPicked(true)
  }

  // Starting a run clears the "just picked" highlight.
  const controls = {
    ...player,
    play: () => {
      setJustPicked(false)
      player.play()
    },
    next: () => {
      setJustPicked(false)
      player.next()
    },
  }

  const values = {
    branchClass: branch.branchClass,
    productClass: branch.productClass,
    tracking: branch.tracking,
    to: `'${branch.destCode}'`,
    how: captions[branch.how] ?? '',
    fee: formatTaka(branch.fee, lang),
    eta: v[branch.eta],
  }
  const captionKey = step ? step.kind : justPicked ? 'pick-branch' : 'idle'
  const caption = fill(captions[captionKey] ?? '', values)

  // The three shared steps inside sendParcel(), and which timeline steps they span.
  const sharedSteps: { label: string; from: StepKind; to: StepKind }[] = [
    { label: v.stepCreate, from: 'call-factory', to: 'create' },
    { label: v.stepBook, from: 'book', to: 'book' },
    { label: v.stepDeliver, from: 'deliver', to: 'drive' },
  ]
  const sharedStatus = (from: StepKind, to: StepKind): Status => {
    if (i > at(to)) return 'done'
    if (i >= at(from)) return 'active'
    return 'pending'
  }

  const overrideActive = kind === 'call-factory' || kind === 'create'
  const lowerLabel =
    kind === 'deliver' || kind === 'drive' ? `deliver('${branch.destCode}')` : 'createTransport()'

  return (
    <div className="flex flex-col gap-4">
      <Stage>
        {/* ── Client ─────────────────────────────────────────── */}
        <Node role={v.clientRole} title={`📦 ${v.clientTitle}`} active={kind === 'client-send' || kind === 'done'} accent="#0b6b4f">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <dl className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between gap-2">
                <dt>🥻 {v.parcel}</dt>
              </div>
              <div className="flex justify-between gap-2 border-t-2 border-dashed border-edge/40 pt-1">
                <dt className="text-ink-soft">{v.to}</dt>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.dd
                    key={branch.dest}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                    className="font-bold"
                  >
                    📍 {v[branch.dest]}
                  </motion.dd>
                </AnimatePresence>
              </div>
            </dl>

            <div>
              <p id="fm-branch-label" className="mb-1.5 label-caps text-ink-soft">
                {v.chooseBranch}
              </p>
              <div role="radiogroup" aria-labelledby="fm-branch-label" className="grid grid-cols-3 gap-2">
                {BRANCHES.map((b) => {
                  const selected = b.id === branchId
                  return (
                    <button
                      key={b.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => selectBranch(b.id)}
                      className={`flex min-w-0 flex-col items-center gap-0.5 rounded-lg border-2 border-edge px-1 py-2 text-xs font-bold transition-[transform,box-shadow,background-color] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chili ${
                        selected
                          ? '-translate-y-0.5 text-white shadow-hard-sm'
                          : 'bg-card text-ink hover:-translate-y-0.5 hover:shadow-hard-sm'
                      }`}
                      style={selected ? { backgroundColor: b.color } : undefined}
                    >
                      <span className="text-lg" aria-hidden="true">
                        {BRANCH_ICON[b.id]}
                      </span>
                      <span className="max-w-full truncate">{v[b.id]}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {kind === 'done' && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                className="mt-3 rounded-lg border-2 border-dashed border-edge bg-paper p-3 text-sm"
              >
                <div className="mb-1 flex items-center justify-between font-display font-bold text-ink">
                  <span>🧾 {v.bookingTitle}</span>
                  <span className="rotate-[-6deg] rounded border-2 border-bottle px-2 py-0.5 label-caps text-bottle dark:border-jade dark:text-jade">
                    ✓ {v.booked}
                  </span>
                </div>
                <dl className="grid grid-cols-3 gap-2 tabular-nums">
                  <div className="min-w-0">
                    <dt className="label-caps text-ink-soft">{v.tracking}</dt>
                    <dd lang="en" className="truncate font-mono text-xs">
                      {branch.tracking}
                    </dd>
                  </div>
                  <div>
                    <dt className="label-caps text-ink-soft">{v.fee}</dt>
                    <dd className="font-bold">{formatTaka(branch.fee, lang)}</dd>
                  </div>
                  <div>
                    <dt className="label-caps text-ink-soft">{v.eta}</dt>
                    <dd>{v[branch.eta]}</dd>
                  </div>
                </dl>
              </motion.div>
            )}
          </AnimatePresence>
        </Node>

        <Connector
          label="sendParcel(parcel)"
          down={kind === 'client-send'}
          up={kind === 'done'}
          downPacket={<Packet color={branch.color}>🥻 {v.parcel}</Packet>}
          upPacket={<Packet color="#0b6b4f">🧾 {v.bookingTitle}</Packet>}
          runKey={i}
        />

        {/* ── ConcreteCreator (extends Creator) ──────────────── */}
        <Node
          role={v.creatorRole}
          title={branch.branchClass}
          active={kind === 'call-factory' || kind === 'create' || kind === 'book' || kind === 'deliver'}
          accent={branch.color}
          mono
        >
          <p className="-mt-1 mb-3 flex flex-wrap items-center gap-1.5 font-mono text-xs text-ink-soft" lang="en">
            {v.extendsLabel} <span className="font-bold text-ink">CourierBranch</span>
            <span className="rounded border border-edge/40 px-1 py-px font-sans text-[10px] tracking-wider uppercase">
              {v.creatorTag}
            </span>
          </p>

          <div className="grid gap-3">
            {/* Inherited workflow */}
            <div className="min-w-0 rounded-lg border-2 border-dashed border-edge/50 bg-paper p-2.5">
              <p className="mb-2 text-xs font-semibold text-ink-soft">{v.sharedLabel}</p>
              <ol className="flex flex-col gap-1.5">
                {sharedSteps.map((s) => {
                  const status = sharedStatus(s.from, s.to)
                  return (
                    <motion.li
                      key={s.label}
                      animate={{ x: status === 'active' ? 4 : 0 }}
                      className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors ${
                        status === 'active' ? 'border-2 border-edge bg-card font-bold shadow-hard-sm' : 'border-2 border-transparent'
                      } ${status === 'pending' ? 'text-ink-soft/70' : ''}`}
                    >
                      <StatusDot status={status} color={branch.color} />
                      <span className="min-w-0">{s.label}</span>
                      {s.from === 'book' && status !== 'pending' && (
                        <span lang="en" className="ml-auto font-mono text-[11px]">
                          {branch.tracking}
                        </span>
                      )}
                    </motion.li>
                  )
                })}
              </ol>
            </div>

            {/* Overridden factory method + the product it made */}
            <div className="flex min-w-0 flex-col gap-2">
              <motion.div
                animate={{ scale: overrideActive ? 1.02 : 1 }}
                className="rounded-lg border-2 p-2.5 transition-colors"
                style={{
                  borderColor: overrideActive ? branch.color : `${branch.color}66`,
                  backgroundColor: `${branch.color}${overrideActive ? '1f' : '0d'}`,
                }}
              >
                <p className="mb-1 text-xs font-semibold text-ink-soft">{v.overrideLabel}</p>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.code
                    key={branch.id}
                    lang="en"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.18 }}
                    className="block truncate font-mono text-xs font-bold"
                    style={{ color: branch.color }}
                  >
                    return new {branch.productClass}()
                  </motion.code>
                </AnimatePresence>
              </motion.div>

              <div className="flex items-center gap-2 rounded-lg border-2 border-dashed border-edge/50 bg-paper py-1.5 pr-1.5 pl-3">
                <code lang="en" className="font-mono text-xs font-bold text-ink-soft">
                  {v.transportSlot}:
                </code>
                <div className="relative h-8 min-w-0 flex-1 overflow-hidden">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {created ? (
                      <motion.span
                        key={`made-${branch.id}`}
                        lang="en"
                        initial={{ y: 36, opacity: 0, scale: 0.6 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                        className="absolute inset-0 flex items-center justify-center gap-1 truncate rounded-md border-2 border-[#2b1d16] px-2 font-mono text-xs font-bold text-white"
                        style={{ backgroundColor: branch.color }}
                      >
                        {branch.vehicle} {branch.productClass}
                      </motion.span>
                    ) : (
                      <motion.span
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center truncate text-xs text-ink-soft/70 italic"
                      >
                        {v.notCreated}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </Node>

        <Connector
          label={lowerLabel}
          down={kind === 'create' || kind === 'deliver'}
          downPacket={
            kind === 'create' ? (
              <Packet color={branch.color}>
                ✨ <span lang="en">new {branch.productClass}()</span>
              </Packet>
            ) : (
              <Packet color={branch.color}>🥻 {v.parcel}</Packet>
            )
          }
          runKey={i}
        />

        {/* ── ConcreteProduct (implements Product) ───────────── */}
        <Node
          role={v.productRole}
          title={created ? branch.productClass : 'Transport'}
          active={kind === 'create' || kind === 'drive'}
          accent={branch.color}
          mono
        >
          <p className="-mt-1 mb-3 flex flex-wrap items-center gap-1.5 font-mono text-xs text-ink-soft" lang="en">
            {v.implementsLabel} <span className="font-bold text-ink">Transport</span>
            <span className="rounded border border-edge/40 px-1 py-px font-sans text-[10px] tracking-wider uppercase">
              {v.productTag}
            </span>
          </p>

          <div className="mb-3 grid grid-cols-3 gap-2">
            {BRANCHES.map((b) => {
              const lit = created && b.id === branchId
              return (
                <motion.div
                  key={b.id}
                  lang="en"
                  animate={{ opacity: lit ? 1 : 0.4, scale: lit ? 1 : 0.95 }}
                  className="truncate rounded-md border-2 px-1.5 py-1 text-center font-mono text-[11px] font-semibold sm:text-xs"
                  style={{ borderColor: b.color, color: lit ? '#fff' : b.color, backgroundColor: lit ? b.color : 'transparent' }}
                >
                  {b.vehicle} {b.productClass}
                </motion.div>
              )
            })}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {created ? (
              <motion.div
                key={`route-${branch.id}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="rounded-lg border p-3"
                style={{ borderColor: `${branch.color}55`, backgroundColor: `${branch.color}0d` }}
              >
                <div className="mb-1 flex justify-between gap-2 text-xs font-bold text-ink-soft">
                  <span className="truncate">🏢 {v[branch.id]}</span>
                  <span className="truncate">📍 {v[branch.dest]}</span>
                </div>
                <div className="relative h-10 rounded-md border-2 border-edge/40" style={{ background: branch.route }}>
                  <motion.span
                    className="absolute top-1/2 text-2xl leading-none"
                    initial={false}
                    animate={{ left: arrived ? 'calc(100% - 2.25rem)' : '0.25rem' }}
                    transition={{ duration: kind === 'drive' ? 2 : 0, ease: 'easeInOut' }}
                    style={{ y: '-50%' }}
                    aria-hidden="true"
                  >
                    <span className="inline-block -scale-x-100">{branch.vehicle}</span>
                  </motion.span>
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="label-caps text-ink-soft">{v.fee}</dt>
                    <dd className="font-bold tabular-nums">{formatTaka(branch.fee, lang)}</dd>
                  </div>
                  <div>
                    <dt className="label-caps text-ink-soft">{v.eta}</dt>
                    <dd>{arrived ? v[branch.eta] : '—'}</dd>
                  </div>
                </dl>
              </motion.div>
            ) : (
              <motion.p
                key="waiting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-lg border-2 border-dashed border-edge/40 px-3 py-6 text-center text-sm text-ink-soft"
              >
                {v.waiting}
              </motion.p>
            )}
          </AnimatePresence>
        </Node>
      </Stage>

      {/* ── Caption ──────────────────────────────────────────── */}
      <Caption label={v.whatsHappening} text={caption} stepKey={`${captionKey}-${lang}`} />

      <StepControls player={controls} playLabel={v.sendButton} />
      <p className="text-xs text-ink-soft">* {v.feeNote}</p>
    </div>
  )
}
