import { useMemo } from 'react'
import { Flame, Target, Trophy } from 'lucide-react'
import { AREAS } from '../game/types'
import { useAllCompletions, useProfile } from '../lib/hooks'
import { db } from '../db/schema'
import { useLiveQuery } from 'dexie-react-hooks'
import { areaLevelFromXp, levelFromXp } from '../game/xp'
import { rankForLevel, nextRank } from '../game/ranks'
import { bestStreak, currentStreak } from '../game/streaks'
import { keyFor, lastNDays } from '../lib/dates'
import { formatQuantity } from '../lib/format'
import { AreaIcon } from '../components/AreaIcon'
import { XpRing } from '../components/XpRing'
import { StatBar } from '../components/StatBar'
import { Heatmap } from '../components/Heatmap'

export function Stats() {
  const profile = useProfile()
  const completions = useAllCompletions()
  const allHabits = useLiveQuery(() => db.habits.toArray())

  const level = levelFromXp(profile?.totalXp ?? 0)
  const rank = rankForLevel(level.level)
  const next = nextRank(level.level)

  const { areaXp, dayCounts, dayKeys, thisWeek, lastWeek, habitTotals } = useMemo(() => {
    const habitArea = new Map((allHabits ?? []).map((h) => [h.id, h.area]))
    const areaXp = new Map<string, number>()
    const dayCounts = new Map<string, number>()
    const dayKeys = new Set<string>()
    const habitTotals = new Map<number, number>()
    for (const c of completions ?? []) {
      dayKeys.add(c.dateKey)
      dayCounts.set(c.dateKey, (dayCounts.get(c.dateKey) ?? 0) + 1)
      const area = habitArea.get(c.habitId)
      if (area) areaXp.set(area, (areaXp.get(area) ?? 0) + c.xp)
      habitTotals.set(c.habitId, (habitTotals.get(c.habitId) ?? 0) + c.quantity)
    }
    const last7 = new Set(lastNDays(7))
    const prev7 = new Set(lastNDays(14).slice(0, 7))
    let thisWeek = 0
    let lastWeek = 0
    for (const [day, count] of dayCounts) {
      if (last7.has(day)) thisWeek += count
      else if (prev7.has(day)) lastWeek += count
    }
    return { areaXp, dayCounts, dayKeys, thisWeek, lastWeek, habitTotals }
  }, [completions, allHabits])

  const lifetimeStats = useMemo(() => {
    const byId = new Map((allHabits ?? []).map((h) => [h.id!, h]))
    return [...habitTotals.entries()]
      .map(([habitId, total]) => ({ habit: byId.get(habitId), total }))
      .filter((entry): entry is { habit: NonNullable<typeof entry.habit>; total: number } =>
        entry.habit !== undefined,
      )
      .sort((a, b) => b.total - a.total)
  }, [habitTotals, allHabits])

  const streak = currentStreak(dayKeys)
  const best = bestStreak(dayKeys)
  const totalMissions = completions?.length ?? 0
  const todayCount = dayCounts.get(keyFor(new Date())) ?? 0

  return (
    <div className="px-5 pb-6">
      <header className="pt-3">
        <h1 className="text-3xl font-extrabold leading-none tracking-tighter text-zinc-50">
          Stats
        </h1>
      </header>

      <section className="mt-5 flex items-center gap-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <XpRing
          level={level.level}
          progress={level.toNext === 0 ? 1 : level.intoLevel / level.toNext}
          size={132}
        />
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Rank</p>
          <p className="mt-0.5 text-2xl font-extrabold tracking-tight text-zinc-50">
            {rank.title}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            {level.toNext > 0
              ? `${level.toNext - level.intoLevel} XP to level ${level.level + 1}`
              : 'Max level reached'}
          </p>
          {next && (
            <p className="mt-1 text-xs text-zinc-500">
              Next rank: {next.title} at level {next.minLevel}
            </p>
          )}
        </div>
      </section>

      <section className="mt-4 grid grid-cols-3 gap-2.5">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3.5 text-center">
          <Flame className="mx-auto size-4 text-accent" />
          <p className="mt-1.5 text-2xl font-extrabold leading-none tracking-tighter tabular-nums text-zinc-50">
            {streak}
          </p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Streak
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3.5 text-center">
          <Trophy className="mx-auto size-4 text-accent" />
          <p className="mt-1.5 text-2xl font-extrabold leading-none tracking-tighter tabular-nums text-zinc-50">
            {best}
          </p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Best
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3.5 text-center">
          <Target className="mx-auto size-4 text-accent" />
          <p className="mt-1.5 text-2xl font-extrabold leading-none tracking-tighter tabular-nums text-zinc-50">
            {totalMissions}
          </p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Missions
          </p>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">
          Character stats
        </h2>
        <div className="mt-3 space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          {AREAS.map((area) => {
            const info = areaLevelFromXp(areaXp.get(area) ?? 0)
            return (
              <StatBar
                key={area}
                area={area}
                level={info.level}
                progress={info.toNext === 0 ? 1 : info.intoLevel / info.toNext}
              />
            )
          })}
        </div>
      </section>

      {lifetimeStats.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">
            Lifetime totals
          </h2>
          <ul className="mt-3 space-y-2">
            {lifetimeStats.map(({ habit, total }) => (
              <li
                key={habit.id}
                className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3"
              >
                <AreaIcon area={habit.area} className="size-4 shrink-0 text-zinc-500" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-300">
                  {habit.name}
                </span>
                <span className="shrink-0 text-base font-extrabold tracking-tight text-accent">
                  {formatQuantity(habit.unit, total)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">
            Last 12 weeks
          </h2>
          <p className="text-xs font-medium text-zinc-500">
            {thisWeek} this week{lastWeek > 0 ? ` · ${lastWeek} last week` : ''}
          </p>
        </div>
        <div className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <Heatmap counts={dayCounts} />
          {totalMissions === 0 && (
            <p className="mt-3 text-center text-xs text-zinc-500">
              Complete missions to light this up.
            </p>
          )}
          {todayCount > 0 && (
            <p className="mt-3 text-center text-xs font-medium text-zinc-400">
              {todayCount} today. Keep the heat on.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
