export interface AchievementStats {
  totalCompletions: number
  totalXp: number
  level: number
  currentStreak: number
  bestStreak: number
  completionsToday: number
  habitCount: number
  /** Areas with at least one completion */
  areasTouched: number
  /** Any completion before 08:00 local */
  hasEarlyBird: boolean
  /** Any completion at or after 22:00 local */
  hasNightOwl: boolean
  /** Highest combo multiplier ever hit in a day (approx: max completions in a day) */
  maxCompletionsInDay: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  check: (s: AchievementStats) => boolean
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-blood',
    name: 'First Move',
    description: 'Complete your first mission',
    check: (s) => s.totalCompletions >= 1,
  },
  {
    id: 'loadout',
    name: 'Loadout Ready',
    description: 'Create 3 missions',
    check: (s) => s.habitCount >= 3,
  },
  {
    id: 'triple',
    name: 'Hat Trick',
    description: 'Complete 3 missions in one day',
    check: (s) => s.maxCompletionsInDay >= 3,
  },
  {
    id: 'full-heat',
    name: 'Full Heat',
    description: 'Hit the x2 combo in a single day',
    check: (s) => s.maxCompletionsInDay >= 5,
  },
  {
    id: 'week-streak',
    name: 'Seven Straight',
    description: 'Keep a 7 day streak',
    check: (s) => s.bestStreak >= 7,
  },
  {
    id: 'month-streak',
    name: 'Iron Month',
    description: 'Keep a 30 day streak',
    check: (s) => s.bestStreak >= 30,
  },
  {
    id: 'fifty',
    name: 'Half Century',
    description: 'Complete 50 missions total',
    check: (s) => s.totalCompletions >= 50,
  },
  {
    id: 'hundred',
    name: 'Century Club',
    description: 'Complete 100 missions total',
    check: (s) => s.totalCompletions >= 100,
  },
  {
    id: 'five-hundred',
    name: 'Made It Count',
    description: 'Complete 500 missions total',
    check: (s) => s.totalCompletions >= 500,
  },
  {
    id: 'level-5',
    name: 'Moving Up',
    description: 'Reach level 5',
    check: (s) => s.level >= 5,
  },
  {
    id: 'level-10',
    name: 'Double Digits',
    description: 'Reach level 10',
    check: (s) => s.level >= 10,
  },
  {
    id: 'level-25',
    name: 'Quarter Legend',
    description: 'Reach level 25',
    check: (s) => s.level >= 25,
  },
  {
    id: 'level-50',
    name: 'Boss Status',
    description: 'Reach level 50',
    check: (s) => s.level >= 50,
  },
  {
    id: 'early-bird',
    name: 'Dawn Patrol',
    description: 'Complete a mission before 8am',
    check: (s) => s.hasEarlyBird,
  },
  {
    id: 'night-owl',
    name: 'Night Shift',
    description: 'Complete a mission after 10pm',
    check: (s) => s.hasNightOwl,
  },
  {
    id: 'all-areas',
    name: 'Well Rounded',
    description: 'Complete missions in all 6 areas',
    check: (s) => s.areasTouched >= 6,
  },
]

export function newlyUnlocked(stats: AchievementStats, alreadyUnlocked: string[]): Achievement[] {
  const owned = new Set(alreadyUnlocked)
  return ACHIEVEMENTS.filter((a) => !owned.has(a.id) && a.check(stats))
}
