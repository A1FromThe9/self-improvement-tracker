/**
 * Daily combo: each mission completed today raises the multiplier
 * for the next one. Resets at midnight because completions are
 * counted per local calendar day.
 */
export const COMBO_STEPS = [1, 1.25, 1.5, 1.75, 2] as const

export function comboMultiplier(completionsToday: number): number {
  const index = Math.min(completionsToday, COMBO_STEPS.length - 1)
  return COMBO_STEPS[index]
}

export function comboXp(baseXp: number, completionsToday: number): number {
  return Math.round(baseXp * comboMultiplier(completionsToday))
}
