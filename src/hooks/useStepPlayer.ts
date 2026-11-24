import { useCallback, useEffect, useState } from 'react'

export interface PlayerStep {
  id: string
  /** Code step id (matches `// @step:<id>` in code/*.ts). Defaults to `id`. */
  codeStep?: string
  /** How long this step stays on screen at 1× speed, in ms. */
  duration?: number
}

export const SPEEDS = [0.5, 1, 2] as const
export type Speed = (typeof SPEEDS)[number]

/**
 * A tiny timeline for visualizations: play / pause / step / reset over a list
 * of steps. index -1 means "not started".
 */
export function useStepPlayer<S extends PlayerStep>(steps: readonly S[], baseDuration = 1300) {
  const [index, setIndex] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<Speed>(1)
  const last = steps.length - 1

  useEffect(() => {
    if (!playing || index >= last) return
    const delay = index < 0 ? 200 : (steps[index]?.duration ?? baseDuration) / speed
    const timer = setTimeout(() => {
      setIndex(index + 1)
      if (index + 1 >= last) setPlaying(false)
    }, delay)
    return () => clearTimeout(timer)
  }, [playing, index, last, steps, speed, baseDuration])

  const play = useCallback(() => {
    setIndex((i) => (i >= last ? -1 : i))
    setPlaying(true)
  }, [last])
  const pause = useCallback(() => setPlaying(false), [])
  const next = useCallback(() => {
    setPlaying(false)
    setIndex((i) => Math.min(i + 1, last))
  }, [last])
  const reset = useCallback(() => {
    setPlaying(false)
    setIndex(-1)
  }, [])

  return {
    index,
    step: index >= 0 ? (steps[index] ?? null) : null,
    total: steps.length,
    playing,
    done: steps.length > 0 && index === last,
    speed,
    setSpeed,
    play,
    pause,
    next,
    reset,
  }
}

export type StepPlayer<S extends PlayerStep = PlayerStep> = ReturnType<typeof useStepPlayer<S>>
