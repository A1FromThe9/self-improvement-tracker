import type { Difficulty } from './types'

export const DIFFICULTY_XP: Record<Difficulty, number> = {
  1: 10,
  2: 25,
  3: 50,
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  1: 'Easy',
  2: 'Solid',
  3: 'Hard',
}

export const MAX_LEVEL = 99

/** XP required to go from `level` to `level + 1`. Grows ~15% per level. */
export function xpToNext(level: number): number {
  return Math.round((50 * Math.pow(1.15, level - 1)) / 5) * 5
}

export interface LevelInfo {
  level: number
  /** XP accumulated inside the current level */
  intoLevel: number
  /** XP needed to finish the current level */
  toNext: number
}

export function levelFromXp(totalXp: number): LevelInfo {
  let level = 1
  let remaining = Math.max(0, totalXp)
  while (level < MAX_LEVEL) {
    const cost = xpToNext(level)
    if (remaining < cost) break
    remaining -= cost
    level++
  }
  return {
    level,
    intoLevel: remaining,
    toNext: level >= MAX_LEVEL ? 0 : xpToNext(level),
  }
}

/**
 * Area stats use a shorter curve so individual life areas
 * level up noticeably faster than the overall rank.
 */
export const AREA_MAX_LEVEL = 50

export function areaLevelFromXp(areaXp: number): LevelInfo {
  let level = 1
  let remaining = Math.max(0, areaXp)
  while (level < AREA_MAX_LEVEL) {
    const cost = Math.round((40 * Math.pow(1.2, level - 1)) / 5) * 5
    if (remaining < cost) break
    remaining -= cost
    level++
  }
  const toNext =
    level >= AREA_MAX_LEVEL ? 0 : Math.round((40 * Math.pow(1.2, level - 1)) / 5) * 5
  return { level, intoLevel: remaining, toNext }
}
