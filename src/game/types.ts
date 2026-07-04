export const AREAS = ['body', 'mind', 'money', 'craft', 'discipline', 'social'] as const
export type Area = (typeof AREAS)[number]

export const AREA_LABELS: Record<Area, string> = {
  body: 'Body',
  mind: 'Mind',
  money: 'Money',
  craft: 'Craft',
  discipline: 'Discipline',
  social: 'Social',
}

export type Difficulty = 1 | 2 | 3

export interface Habit {
  id?: number
  name: string
  area: Area
  difficulty: Difficulty
  /** Days of week the mission is scheduled, 0 = Sunday */
  scheduleDays: number[]
  createdAt: number
  archivedAt?: number
}

export interface Completion {
  id?: number
  habitId: number
  /** Local calendar day, YYYY-MM-DD */
  dateKey: string
  /** XP actually awarded (base x combo multiplier) */
  xp: number
  completedAt: number
}

export interface Settings {
  sound: boolean
  haptics: boolean
}

export interface Profile {
  id: number
  totalXp: number
  unlocked: string[]
  settings: Settings
  createdAt: number
}
