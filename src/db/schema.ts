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
