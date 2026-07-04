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

export const UNITS = ['minutes', 'pages', 'reps', 'dollars', 'count'] as const
export type Unit = (typeof UNITS)[number]

export const UNIT_LABELS: Record<Unit, string> = {
  minutes: 'Minutes',
  pages: 'Pages',
  reps: 'Reps',
  dollars: 'Dollars',
  count: 'Times',
}

/** Short suffix used in compact row displays, e.g. "30 min" */
export const UNIT_SHORT: Record<Unit, string> = {
  minutes: 'min',
  pages: 'pg',
  reps: 'reps',
  dollars: '$',
  count: 'x',
}

/** Sensible starting quantity when a mission first picks this unit */
export const UNIT_DEFAULT_QUANTITY: Record<Unit, number> = {
  minutes: 20,
  pages: 10,
  reps: 20,
  dollars: 10,
  count: 1,
}

/** Increment used by +/- steppers when entering a quantity */
export const UNIT_STEP: Record<Unit, number> = {
  minutes: 5,
  pages: 1,
  reps: 5,
  dollars: 5,
  count: 1,
}

export interface Habit {
  id?: number
  name: string
  area: Area
  unit: Unit
  /** Quantity one completion is worth, e.g. 20 (minutes) */
  defaultQuantity: number
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
  /** Real-world amount logged for this completion, in the habit's unit */
  quantity: number
  /** Snapshot of the habit's unit at the time of logging */
  unit: Unit
  /** XP actually awarded (quantity x rate x combo multiplier) */
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
