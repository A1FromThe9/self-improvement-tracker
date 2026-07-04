import { lastNDays } from '../lib/dates'

interface HeatmapProps {
  /** dateKey -> completion count */
  counts: Map<string, number>
  weeks?: number
}

function cellClass(count: number): string {
  if (count === 0) return 'bg-zinc-800/70'
  if (count === 1) return 'bg-accent/30'
  if (count === 2) return 'bg-accent/55'
  if (count === 3) return 'bg-accent/80'
  return 'bg-accent'
}

export function Heatmap({ counts, weeks = 12 }: HeatmapProps) {
  // Pad so columns are whole weeks ending today
  const today = new Date()
  const daysIntoWeek = today.getDay() + 1
  const total = (weeks - 1) * 7 + daysIntoWeek
  const days = lastNDays(total)
  const columns: string[][] = []
  for (let i = 0; i < days.length; i += 7) {
    columns.push(days.slice(i, i + 7))
  }

  return (
    <div className="flex gap-1" aria-label={`Activity for the last ${weeks} weeks`}>
      {columns.map((week, wi) => (
        <div key={wi} className="flex flex-1 flex-col gap-1">
          {week.map((day) => (
            <span
              key={day}
              title={`${day}: ${counts.get(day) ?? 0} missions`}
              className={`aspect-square w-full rounded-[3px] ${cellClass(counts.get(day) ?? 0)}`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
