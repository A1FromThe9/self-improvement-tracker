import { addDays, keyFor } from '../lib/dates'

/**
 * Consecutive days (ending today or yesterday) with at least one
 * completion. Today not being done yet does not break the streak.
 */
export function currentStreak(completedDays: Set<string>, today: Date = new Date()): number {
  let streak = 0
  let cursor = today
  if (!completedDays.has(keyFor(cursor))) {
    cursor = addDays(cursor, -1)
  }
  while (completedDays.has(keyFor(cursor))) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}

/** Longest run of consecutive calendar days in the set. */
export function bestStreak(completedDays: Set<string>): number {
  let best = 0
  for (const key of completedDays) {
    const [y, m, d] = key.split('-').map(Number)
    const prev = keyFor(addDays(new Date(y, m - 1, d), -1))
    if (completedDays.has(prev)) continue
    let length = 0
    let cursor = new Date(y, m - 1, d)
    while (completedDays.has(keyFor(cursor))) {
      length++
      cursor = addDays(cursor, 1)
    }
    if (length > best) best = length
  }
  return best
}

/**
 * Streak for a single habit, aware of its schedule: unscheduled days
 * are skipped, a missed scheduled day breaks the streak, and today
 * being incomplete does not break it.
 */
export function habitStreak(
  scheduleDays: number[],
  completedDays: Set<string>,
  today: Date = new Date(),
): number {
  if (scheduleDays.length === 0) return 0
  const scheduled = new Set(scheduleDays)
  let streak = 0
  let cursor = today
  for (let i = 0; i < 3650; i++) {
    const isScheduled = scheduled.has(cursor.getDay())
    const done = completedDays.has(keyFor(cursor))
    if (isScheduled) {
      if (done) {
        streak++
      } else if (i > 0) {
        break
      }
    } else if (done) {
      // Bonus day outside the schedule still counts toward the streak
      streak++
    }
    cursor = addDays(cursor, -1)
  }
  return streak
}
