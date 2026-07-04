import { useLiveQuery } from 'dexie-react-hooks'
import { db, PROFILE_ID } from '../db/schema'
import { todayKey } from './dates'

export function useProfile() {
  return useLiveQuery(() => db.profile.get(PROFILE_ID))
}

export function useActiveHabits() {
  return useLiveQuery(async () => {
    const all = await db.habits.toArray()
    return all.filter((h) => !h.archivedAt)
  })
}

export function useTodayCompletions() {
  return useLiveQuery(() => db.completions.where('dateKey').equals(todayKey()).toArray(), [])
}

export function useAllCompletions() {
  return useLiveQuery(() => db.completions.toArray())
}
