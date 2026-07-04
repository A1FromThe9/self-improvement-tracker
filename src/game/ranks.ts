export interface Rank {
  minLevel: number
  title: string
}

export const RANKS: Rank[] = [
  { minLevel: 1, title: 'Rookie' },
  { minLevel: 3, title: 'Prospect' },
  { minLevel: 5, title: 'Hustler' },
  { minLevel: 8, title: 'Grinder' },
  { minLevel: 12, title: 'Operator' },
  { minLevel: 16, title: 'Enforcer' },
  { minLevel: 21, title: 'Specialist' },
  { minLevel: 27, title: 'Veteran' },
  { minLevel: 34, title: 'Shot Caller' },
  { minLevel: 42, title: 'Underboss' },
  { minLevel: 50, title: 'Boss' },
  { minLevel: 60, title: 'Kingpin' },
  { minLevel: 75, title: 'Icon' },
  { minLevel: 90, title: 'Legend' },
]

export function rankForLevel(level: number): Rank {
  let current = RANKS[0]
  for (const rank of RANKS) {
    if (level >= rank.minLevel) current = rank
    else break
  }
  return current
}

export function nextRank(level: number): Rank | null {
  for (const rank of RANKS) {
    if (rank.minLevel > level) return rank
  }
  return null
}
