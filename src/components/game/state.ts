/** State helpers for pattern games: levels, stars, saved progress, shaking a wrong choice. */
import { useCallback, useEffect, useState } from 'react'

export type Level = 1 | 2 | 3
export const LEVELS: Level[] = [1, 2, 3]

export const starText = (n: number) => '★'.repeat(n) + '☆'.repeat(3 - n)
/** 0 mistakes → 3 stars, 1 → 2, more → 1. */
export const starsFor = (mistakes: number) => (mistakes === 0 ? 3 : mistakes === 1 ? 2 : 1)

/* ------------------------------------------------------------------ */
/* Progress, saved per viewer (the game works without storage)        */
/* ------------------------------------------------------------------ */

export interface GameProgress {
  unlocked: Level
  stars: Partial<Record<Level, number>>
  coins: number
}
const FRESH: GameProgress = { unlocked: 1, stars: {}, coins: 0 }

function load(key: string): GameProgress {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? 'null') as Partial<GameProgress> | null
    if (!saved) return FRESH
    const unlocked = saved.unlocked === 2 || saved.unlocked === 3 ? saved.unlocked : 1
    return { unlocked, stars: saved.stars ?? {}, coins: Number(saved.coins) || 0 }
  } catch {
    return FRESH
  }
}

export function useGameProgress(storageKey: string) {
  const [progress, setProgress] = useState<GameProgress>(() => load(storageKey))

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(progress))
    } catch {
      // storage unavailable: progress lasts for this visit only
    }
  }, [storageKey, progress])

  const addCoins = useCallback((n: number) => setProgress((p) => ({ ...p, coins: p.coins + n })), [])
  const completeLevel = useCallback(
    (level: Level, stars: number) =>
      setProgress((p) => ({
        ...p,
        unlocked: Math.max(p.unlocked, Math.min(level + 1, 3)) as Level,
        stars: { ...p.stars, [level]: Math.max(p.stars[level] ?? 0, stars) },
      })),
    [],
  )
  const reset = useCallback(() => setProgress(FRESH), [])

  return { progress, addCoins, completeLevel, reset }
}

/* ------------------------------------------------------------------ */
/* Shake a wrong choice                                                */
/* ------------------------------------------------------------------ */

const SHAKE_A = [0, -7, 7, -4, 4, 0]
const SHAKE_B = [0, 7, -7, 4, -4, 0]

export function useShake() {
  const [shake, setShake] = useState<{ id: string; n: number }>({ id: '', n: 0 })
  const bump = useCallback((id: string) => setShake((s) => ({ id, n: s.n + 1 })), [])
  // Alternating keyframes make Framer replay the shake on every wrong tap.
  const anim = (id: string) => (shake.id === id ? { x: shake.n % 2 ? SHAKE_A : SHAKE_B } : { x: 0 })
  return { bump, anim }
}
