import { db, ensureProfile, PROFILE_ID } from './schema'
import type { Area, Difficulty, Habit } from '../game/types'
import { comboMultiplier, comboXp } from '../game/combo'
import { DIFFICULTY_XP, levelFromXp } from '../game/xp'
import { rankForLevel } from '../game/ranks'
import { bestStreak, currentStreak } from '../game/streaks'
import { newlyUnlocked, type Achievement, type AchievementStats } from '../game/achievements'
import { todayKey } from '../lib/dates'

export interface NewHabit {
  name: string
  area: Area
  difficulty: Difficulty
  scheduleDays: number[]
}

export function addHabit(input: NewHabit): Promise<number> {
  return db.habits.add({ ...input, createdAt: Date.now() }) as Promise<number>
}

export function updateHabit(id: number, changes: Partial<NewHabit>): Promise<number> {
  return db.habits.update(id, changes)
}

export function archiveHabit(id: number): Promise<number> {
  return db.habits.update(id, { archivedAt: Date.now() })
}

export async function deleteHabit(id: number): Promise<void> {
  await db.transaction('rw', db.habits, db.completions, async () => {
    await db.completions.where('habitId').equals(id).delete()
    await db.habits.delete(id)
  })
}

export interface CompleteResult {
  xpGained: number
  multiplier: number
  leveledUp: boolean
  newLevel: number
  newRankTitle: string
  unlocked: Achievement[]
}

async function collectAchievementStats(totalXp: number): Promise<AchievementStats> {
  const [completions, habits] = await Promise.all([
    db.completions.toArray(),
    db.habits.toArray(),
  ])
  const dayKeys = new Set(completions.map((c) => c.dateKey))
  const perDay = new Map<string, number>()
  let hasEarlyBird = false
  let hasNightOwl = false
  for (const c of completions) {
    perDay.set(c.dateKey, (perDay.get(c.dateKey) ?? 0) + 1)
    const hour = new Date(c.completedAt).getHours()
    if (hour < 8) hasEarlyBird = true
    if (hour >= 22) hasNightOwl = true
  }
  const habitArea = new Map(habits.map((h) => [h.id, h.area]))
  const areasTouched = new Set(
    completions.map((c) => habitArea.get(c.habitId)).filter(Boolean),
  ).size
  const today = todayKey()
  return {
    totalCompletions: completions.length,
    totalXp,
    level: levelFromXp(totalXp).level,
    currentStreak: currentStreak(dayKeys),
    bestStreak: bestStreak(dayKeys),
    completionsToday: perDay.get(today) ?? 0,
    habitCount: habits.filter((h) => !h.archivedAt).length,
    areasTouched,
    hasEarlyBird,
    hasNightOwl,
    maxCompletionsInDay: Math.max(0, ...perDay.values()),
  }
}

export async function completeHabit(habit: Habit): Promise<CompleteResult> {
  return db.transaction('rw', db.habits, db.completions, db.profile, async () => {
    const profile = await ensureProfile()
    const dateKey = todayKey()

    const already = await db.completions
      .where('[habitId+dateKey]')
      .equals([habit.id!, dateKey])
      .count()
    if (already > 0) {
      const info = levelFromXp(profile.totalXp)
      return {
        xpGained: 0,
        multiplier: 1,
        leveledUp: false,
        newLevel: info.level,
        newRankTitle: rankForLevel(info.level).title,
        unlocked: [],
      }
    }

    const doneToday = await db.completions.where('dateKey').equals(dateKey).count()
    const baseXp = DIFFICULTY_XP[habit.difficulty]
    const xp = comboXp(baseXp, doneToday)
    const multiplier = comboMultiplier(doneToday)

    await db.completions.add({
      habitId: habit.id!,
      dateKey,
      xp,
      completedAt: Date.now(),
    })

    const before = levelFromXp(profile.totalXp)
    const totalXp = profile.totalXp + xp
    const after = levelFromXp(totalXp)

    const stats = await collectAchievementStats(totalXp)
    const unlocked = newlyUnlocked(stats, profile.unlocked)

    await db.profile.update(PROFILE_ID, {
      totalXp,
      unlocked: [...profile.unlocked, ...unlocked.map((a) => a.id)],
    })

    return {
      xpGained: xp,
      multiplier,
      leveledUp: after.level > before.level,
      newLevel: after.level,
      newRankTitle: rankForLevel(after.level).title,
      unlocked,
    }
  })
}

export async function uncompleteHabit(habitId: number, dateKey: string): Promise<void> {
  await db.transaction('rw', db.completions, db.profile, async () => {
    const completion = await db.completions
      .where('[habitId+dateKey]')
      .equals([habitId, dateKey])
      .first()
    if (!completion) return
    const profile = await ensureProfile()
    await db.completions.delete(completion.id!)
    await db.profile.update(PROFILE_ID, {
      totalXp: Math.max(0, profile.totalXp - completion.xp),
    })
  })
}

export async function updateSettings(changes: Partial<{ sound: boolean; haptics: boolean }>) {
  const profile = await ensureProfile()
  await db.profile.update(PROFILE_ID, {
    settings: { ...profile.settings, ...changes },
  })
}
