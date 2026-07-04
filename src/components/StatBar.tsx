import type { Area } from '../game/types'
import { AREA_LABELS } from '../game/types'
import { AreaIcon } from './AreaIcon'

interface StatBarProps {
  area: Area
  level: number
  /** 0..1 progress through the current area level */
  progress: number
}

const SEGMENTS = 20

export function StatBar({ area, level, progress }: StatBarProps) {
  const filled = Math.round(Math.min(1, Math.max(0, progress)) * SEGMENTS)
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
          <AreaIcon area={area} className="size-4 text-zinc-500" />
          {AREA_LABELS[area]}
        </span>
        <span className="text-xs font-bold tabular-nums text-zinc-400">LV {level}</span>
      </div>
      <div
        className="flex gap-[3px]"
        role="progressbar"
        aria-valuenow={filled}
        aria-valuemin={0}
        aria-valuemax={SEGMENTS}
        aria-label={`${AREA_LABELS[area]} level ${level}`}
      >
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <span
            key={i}
            className={`h-2.5 flex-1 rounded-[2px] ${i < filled ? 'bg-accent' : 'bg-zinc-800'}`}
          />
        ))}
      </div>
    </div>
  )
}
