import { describe, expect, it } from 'vitest'
import { levelFromXp, xpToNext, areaLevelFromXp, MAX_LEVEL, DIFFICULTY_XP } from './xp'
import { rankForLevel, nextRank, RANKS } from './ranks'
import { comboMultiplier, comboXp } from './combo'
import { currentStreak, bestStreak, habitStreak } from './streaks'
import { newlyUnlocked, ACHIEVEMENTS, type AchievementStats } from './achievements'
import { keyFor, lastNDays } from '../lib/dates'

describe('xp curve', () => {
  it('starts at level 1 with zero xp', () => {
    expect(levelFromXp(0)).toEqual({ level: 1, intoLevel: 0, toNext: 50 })
  })

  it('levels up exactly at the boundary', () => {
    const cost = xpToNext(1)
    expect(levelFromXp(cost - 1).level).toBe(1)
    expect(levelFromXp(cost).level).toBe(2)
    expect(levelFromXp(cost).intoLevel).toBe(0)
  })

  it('grows monotonically per level', () => {
    for (let lvl = 1; lvl < 98; lvl++) {
      expect(xpToNext(lvl + 1)).toBeGreaterThanOrEqual(xpToNext(lvl))
    }
  })

  it('caps at MAX_LEVEL', () => {
    const info = levelFromXp(1e9)
    expect(info.level).toBe(MAX_LEVEL)
    expect(info.toNext).toBe(0)
  })

  it('never returns negative values for negative xp', () => {
    expect(levelFromXp(-100)).toEqual({ level: 1, intoLevel: 0, toNext: 50 })
  })

  it('area curve levels faster at the start', () => {
    const xp = 200
    expect(areaLevelFromXp(xp).level).toBeGreaterThanOrEqual(levelFromXp(xp).level)
  })

  it('difficulty xp values are ordered', () => {
    expect(DIFFICULTY_XP[1]).toBeLessThan(DIFFICULTY_XP[2])
    expect(DIFFICULTY_XP[2]).toBeLessThan(DIFFICULTY_XP[3])
  })
})

describe('ranks', () => {
  it('level 1 is Rookie', () => {
    expect(rankForLevel(1).title).toBe('Rookie')
  })

  it('level 99 is Legend', () => {
    expect(rankForLevel(99).title).toBe('Legend')
  })

  it('rank boundaries are inclusive', () => {
    for (const rank of RANKS) {
      expect(rankForLevel(rank.minLevel).title).toBe(rank.title)
    }
  })

  it('nextRank returns null at the top', () => {
    expect(nextRank(99)).toBeNull()
    expect(nextRank(1)?.title).toBe('Prospect')
  })
})

describe('combo', () => {
  it('first completion of the day is x1', () => {
    expect(comboMultiplier(0)).toBe(1)
  })

  it('ramps to x2 and stays there', () => {
    expect(comboMultiplier(1)).toBe(1.25)
    expect(comboMultiplier(4)).toBe(2)
    expect(comboMultiplier(20)).toBe(2)
  })

  it('rounds combo xp', () => {
    expect(comboXp(25, 1)).toBe(31) // 25 * 1.25 = 31.25
    expect(comboXp(10, 0)).toBe(10)
    expect(comboXp(50, 4)).toBe(100)
  })
})

function daysAgoSet(offsets: number[], from: Date): Set<string> {
  const set = new Set<string>()
  for (const offset of offsets) {
    const d = new Date(from)
    d.setDate(d.getDate() - offset)
    set.add(keyFor(d))
  }
  return set
}

describe('streaks', () => {
  const today = new Date(2026, 6, 4) // July 4 2026, a Saturday

  it('is zero with no completions', () => {
    expect(currentStreak(new Set(), today)).toBe(0)
  })

  it('counts consecutive days including today', () => {
    expect(currentStreak(daysAgoSet([0, 1, 2], today), today)).toBe(3)
  })

  it('does not break when today is not done yet', () => {
    expect(currentStreak(daysAgoSet([1, 2, 3], today), today)).toBe(3)
  })

  it('breaks on a gap', () => {
    expect(currentStreak(daysAgoSet([0, 1, 3, 4], today), today)).toBe(2)
  })

  it('is zero when the last completion was two days ago', () => {
    expect(currentStreak(daysAgoSet([2, 3], today), today)).toBe(0)
  })

  it('finds the best historical streak', () => {
    expect(bestStreak(daysAgoSet([0, 1, 5, 6, 7, 8, 20], today))).toBe(4)
    expect(bestStreak(new Set())).toBe(0)
  })

  it('habit streak skips unscheduled days', () => {
    // Scheduled Mon(1) Wed(3) Fri(5); today Sat Jul 4.
    // Completed: Fri Jul 3 (1 back), Wed Jul 1 (3 back), Mon Jun 29 (5 back)
    const completed = daysAgoSet([1, 3, 5], today)
    expect(habitStreak([1, 3, 5], completed, today)).toBe(3)
  })

  it('habit streak breaks on a missed scheduled day', () => {
    // Missed Wed Jul 1, completed Fri Jul 3
    const completed = daysAgoSet([1, 5], today)
    expect(habitStreak([1, 3, 5], completed, today)).toBe(1)
  })

  it('today incomplete does not break a habit streak', () => {
    // Daily habit, done every day up to yesterday
    const completed = daysAgoSet([1, 2, 3], today)
    expect(habitStreak([0, 1, 2, 3, 4, 5, 6], completed, today)).toBe(3)
  })
})

describe('achievements', () => {
  const base: AchievementStats = {
    totalCompletions: 0,
    totalXp: 0,
    level: 1,
    currentStreak: 0,
    bestStreak: 0,
    completionsToday: 0,
    habitCount: 0,
    areasTouched: 0,
    hasEarlyBird: false,
    hasNightOwl: false,
    maxCompletionsInDay: 0,
  }

  it('unlocks first mission', () => {
    const unlocked = newlyUnlocked({ ...base, totalCompletions: 1, maxCompletionsInDay: 1 }, [])
    expect(unlocked.map((a) => a.id)).toContain('first-blood')
  })

  it('does not re-unlock owned achievements', () => {
    const unlocked = newlyUnlocked(
      { ...base, totalCompletions: 1, maxCompletionsInDay: 1 },
      ['first-blood'],
    )
    expect(unlocked.map((a) => a.id)).not.toContain('first-blood')
  })

  it('all achievement ids are unique', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('unlocks everything with maxed stats', () => {
    const maxed: AchievementStats = {
      totalCompletions: 1000,
      totalXp: 1e6,
      level: 99,
      currentStreak: 100,
      bestStreak: 100,
      completionsToday: 10,
      habitCount: 10,
      areasTouched: 6,
      hasEarlyBird: true,
      hasNightOwl: true,
      maxCompletionsInDay: 10,
    }
    expect(newlyUnlocked(maxed, []).length).toBe(ACHIEVEMENTS.length)
  })
})

describe('dates', () => {
  it('lastNDays returns oldest first and ends today', () => {
    const from = new Date(2026, 6, 4)
    const days = lastNDays(3, from)
    expect(days).toEqual(['2026-07-02', '2026-07-03', '2026-07-04'])
  })
})
