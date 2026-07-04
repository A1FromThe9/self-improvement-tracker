import { db, PROFILE_ID } from './schema'
import type { Completion, Habit, Profile } from '../game/types'

interface BackupFile {
  app: 'grind'
  version: 1
  exportedAt: string
  habits: Habit[]
  completions: Completion[]
  profile: Profile | undefined
}

export async function exportData(): Promise<void> {
  const [habits, completions, profile] = await Promise.all([
    db.habits.toArray(),
    db.completions.toArray(),
    db.profile.get(PROFILE_ID),
  ])
  const payload: BackupFile = {
    app: 'grind',
    version: 1,
    exportedAt: new Date().toISOString(),
    habits,
    completions,
    profile,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `grind-backup-${payload.exportedAt.slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function importData(file: File): Promise<{ habits: number; completions: number }> {
  const text = await file.text()
  const data = JSON.parse(text) as BackupFile
  if (data.app !== 'grind' || !Array.isArray(data.habits) || !Array.isArray(data.completions)) {
    throw new Error('Not a valid Grind backup file')
  }
  await db.transaction('rw', db.habits, db.completions, db.profile, async () => {
    await db.habits.clear()
    await db.completions.clear()
    await db.profile.clear()
    await db.habits.bulkAdd(data.habits)
    await db.completions.bulkAdd(data.completions)
    if (data.profile) await db.profile.put(data.profile)
  })
  return { habits: data.habits.length, completions: data.completions.length }
}
