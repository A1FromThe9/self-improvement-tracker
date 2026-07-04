import { db, ensureProfile, PROFILE_ID } from './schema'
import type { Area, Habit, Unit } from '../game/types'
import { comboMultiplier, comboXp } from '../game/combo'
import { xpForQuantity, levelFromXp } from '../game/xp'
import { rankForLevel } from '../game/ranks'
import { bestStreak, currentStreak } from '../game/streaks'
import { newlyUnlocked, type Achievement, type AchievementStats } from '../game/achievements'
import { todayKey } from '../lib/dates'

export interface NewHabit {
  name: string
  area: Area
  unit: Unit
  defaultQuantity: number
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

export interface XpMutationResult {
  leveledUp: boolean
  newLevel: number
  newRankTitle: string
  unlocked: Achievement[]
}

export interface CompleteResult extends XpMutationResult {
  xpGained: number
  multiplier: number
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

/** Applies an XP delta to the profile and reports any level-up / new trophies. Caller must run inside a transaction that includes db.profile. */
async function applyXpDelta(deltaXp: number): Promise<XpMutationResult> {
  const profile = await ensureProfile()
  const before = levelFromXp(profile.totalXp)
  const totalXp = Math.max(0, profile.totalXp + deltaXp)
  const after = levelFromXp(totalXp)

  const stats = await collectAchievementStats(totalXp)
  const unlocked = newlyUnlocked(stats, profile.unlocked)

  await db.profile.update(PROFILE_ID, {
    totalXp,
    unlocked: [...profile.unlocked, ...unlocked.map((a) => a.id)],
  })

  return {
    leveledUp: after.level > before.level,
    newLevel: after.level,
    newRankTitle: rankForLevel(after.level).title,
    unlocked,
  }
}

export async function completeHabit(habit: Habit, quantity?: number): Promise<CompleteResult> {
  return db.transaction('rw', db.habits, db.completions, db.profile, async () => {
    const dateKey = todayKey()

    const already = await db.completions
      .where('[habitId+dateKey]')
      .equals([habit.id!, dateKey])
      .count()
    if (already > 0) {
      const profile = await ensureProfile()
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
    const amount = quantity ?? habit.defaultQuantity
    const baseXp = xpForQuantity(habit.unit, amount)
    const xp = comboXp(baseXp, doneToday)
    const multiplier = comboMultiplier(doneToday)

    await db.completions.add({
      habitId: habit.id!,
      dateKey,
      quantity: amount,
      unit: habit.unit,
      xp,
      completedAt: Date.now(),
    })

    const mutation = await applyXpDelta(xp)

    return { xpGained: xp, multiplier, ...mutation }
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

/**
 * Adjusts the quantity logged for today's completion of a habit (e.g. you
 * actually meditated 35 minutes, not the default 20). Preserves whatever
 * combo multiplier applied at the original completion time.
 */
export async function adjustCompletionQuantity(
  habitId: number,
  dateKey: string,
  quantity: number,
): Promise<XpMutationResult | null> {
  return db.transaction('rw', db.completions, db.habits, db.profile, async () => {
    const completion = await db.completions
      .where('[habitId+dateKey]')
      .equals([habitId, dateKey])
      .first()
    if (!completion) return null

    const originalBaseXp = xpForQuantity(completion.unit, completion.quantity)
    const multiplier = completion.xp / originalBaseXp
    const newXp = Math.max(1, Math.round(xpForQuantity(completion.unit, quantity) * multiplier))
    const deltaXp = newXp - completion.xp

    await db.completions.update(completion.id!, { quantity, xp: newXp })

    return applyXpDelta(deltaXp)
  })
}

export async function updateSettings(changes: Partial<{ sound: boolean; haptics: boolean }>) {
  const profile = await ensureProfile()
  await db.profile.update(PROFILE_ID, {
    settings: { ...profile.settings, ...changes },
  })
}
