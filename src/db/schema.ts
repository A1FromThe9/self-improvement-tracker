import Dexie, { type EntityTable } from 'dexie'
import type { Completion, Habit, Profile } from '../game/types'

export const db = new Dexie('grind') as Dexie & {
  habits: EntityTable<Habit, 'id'>
  completions: EntityTable<Completion, 'id'>
  profile: EntityTable<Profile, 'id'>
}

db.version(1).stores({
  habits: '++id, area, archivedAt',
  completions: '++id, habitId, dateKey, [habitId+dateKey]',
  profile: 'id',
})

// v2: habits/completions moved from an abstract difficulty tier to a real
// unit + quantity (e.g. "20 minutes" instead of "Solid"). Existing rows are
// tagged as unit 'count', quantity 1 so nothing crashes; historical XP totals
// are left untouched. Edit existing missions afterward to assign a real unit.
db.version(2).stores({
  habits: '++id, area, archivedAt',
  completions: '++id, habitId, dateKey, [habitId+dateKey]',
  profile: 'id',
}).upgrade(async (tx) => {
  await tx
    .table('habits')
    .toCollection()
    .modify((habit) => {
      if (habit.unit === undefined) {
        habit.unit = 'count'
        habit.defaultQuantity = 1
        delete habit.difficulty
      }
    })
  await tx
    .table('completions')
    .toCollection()
    .modify((completion) => {
      if (completion.quantity === undefined) {
        completion.quantity = 1
        completion.unit = 'count'
      }
    })
})

export const PROFILE_ID = 1

export async function ensureProfile(): Promise<Profile> {
  const existing = await db.profile.get(PROFILE_ID)
  if (existing) return existing
  const fresh: Profile = {
    id: PROFILE_ID,
    totalXp: 0,
    unlocked: [],
    settings: { sound: true, haptics: true },
    createdAt: Date.now(),
  }
  await db.profile.put(fresh)
  return fresh
}
