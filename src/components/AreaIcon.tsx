import { BicepsFlexed, Brain, Banknote, Hammer, AlarmClockCheck, Users } from 'lucide-react'
import type { Area } from '../game/types'

const ICONS = {
  body: BicepsFlexed,
  mind: Brain,
  money: Banknote,
  craft: Hammer,
  discipline: AlarmClockCheck,
  social: Users,
} as const

export function AreaIcon({ area, className }: { area: Area; className?: string }) {
  const Icon = ICONS[area]
  return <Icon className={className} aria-hidden="true" />
}
