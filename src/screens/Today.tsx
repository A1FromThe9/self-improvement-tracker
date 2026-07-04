import { useCallback, useMemo, useState } from 'react'
import { Check, Flame, Zap } from 'lucide-react'
import type { Habit } from '../game/types'
import { addHabit, completeHabit, uncompleteHabit } from '../db/repo'
import { useActiveHabits, useAllCompletions, useProfile, useTodayCompletions } from '../lib/hooks'
import { levelFromXp, DIFFICULTY_XP } from '../game/xp'
import { rankForLevel } from '../game/ranks'
import { comboMultiplier, COMBO_STEPS } from '../game/combo'
import { currentStreak } from '../game/streaks'
import { todayKey } from '../lib/dates'
import { AreaIcon } from '../components/AreaIcon'
import { LevelUpOverlay } from '../components/LevelUpOverlay'
import { Toast, type ToastData } from '../components/Toast'
import { feedback } from '../fx/feedback'
import { burstLevelUp, burstSmall } from '../fx/confetti'

const STARTERS: { name: string; area: Habit['area']; difficulty: Habit['difficulty'] }[] = [
  { name: 'Train 30 minutes', area: 'body', difficulty: 2 },
  { name: 'Read 10 pages', area: 'mind', difficulty: 1 },
  { name: 'One deep work block', area: 'craft', difficulty: 3 },
  { name: 'Lights out by 11', area: 'discipline', difficulty: 2 },
]

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6]

export function Today() {
  const profile = useProfile()
  const habits = useActiveHabits()
  const todayDone = useTodayCompletions()
  const allCompletions = useAllCompletions()

  const [levelUp, setLevelUp] = useState<{ level: number; rank: string } | null>(null)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [xpFloats, setXpFloats] = useState<{ id: number; habitId: number; xp: number }[]>([])
  const [startersHidden, setStartersHidden] = useState(
    () => localStorage.getItem('grind.startersHidden') === '1',
  )

  const doneIds = useMemo(() => new Set((todayDone ?? []).map((c) => c.habitId)), [todayDone])
  const dayKeys = useMemo(
    () => new Set((allCompletions ?? []).map((c) => c.dateKey)),
    [allCompletions],
  )

  const weekday = new Date().getDay()
  const scheduled = (habits ?? []).filter((h) => h.scheduleDays.includes(weekday))
  const extras = (habits ?? []).filter((h) => !h.scheduleDays.includes(weekday))
  const doneCount = todayDone?.length ?? 0
  const scheduledDone = scheduled.filter((h) => doneIds.has(h.id!)).length
  const streak = currentStreak(dayKeys)
  const streakLost =
    streak === 0 && (allCompletions?.length ?? 0) > 0 && doneCount === 0

  const level = levelFromXp(profile?.totalXp ?? 0)
  const nextMultiplier = comboMultiplier(doneCount)

  const onCheck = useCallback(
    async (habit: Habit) => {
      if (!profile) return
      if (doneIds.has(habit.id!)) {
        await uncompleteHabit(habit.id!, todayKey())
        return
      }
      const comboIndex = todayDone?.length ?? 0
      const result = await completeHabit(habit)
      feedback.check(profile.settings, comboIndex)
      const floatId = Date.now()
      setXpFloats((f) => [...f, { id: floatId, habitId: habit.id!, xp: result.xpGained }])
      setTimeout(() => setXpFloats((f) => f.filter((x) => x.id !== floatId)), 950)

      if (result.leveledUp) {
        feedback.levelUp(profile.settings)
        burstLevelUp()
        setLevelUp({ level: result.newLevel, rank: result.newRankTitle })
      } else if (result.multiplier >= 2) {
        burstSmall()
      }
      if (result.unlocked.length > 0) {
        feedback.achievement(profile.settings)
        const first = result.unlocked[0]
        setToast({ title: `Trophy: ${first.name}`, detail: first.description })
      }
    },
    [profile, doneIds, todayDone],
  )

  const addStarter = async (starter: (typeof STARTERS)[number]) => {
    await addHabit({ ...starter, scheduleDays: EVERY_DAY })
  }

  const dismissStarters = () => {
    localStorage.setItem('grind.startersHidden', '1')
    setStartersHidden(true)
  }

  const remainingStarters = STARTERS.filter(
    (s) => !(habits ?? []).some((h) => h.name === s.name),
  )
  const showStarters =
    habits !== undefined &&
    !startersHidden &&
    remainingStarters.length > 0 &&
    habits.length < 4

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="px-5 pb-6">
      <header className="pt-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              {dateLabel}
            </p>
            <h1 className="mt-1 text-3xl font-extrabold leading-none tracking-tighter text-zinc-50">
              Today
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {streak > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-zinc-900 px-3 py-1.5 text-sm font-bold text-zinc-200">
                <Flame className="size-4 text-accent" />
                {streak}
              </span>
            )}
            <span className="rounded-full bg-zinc-900 px-3 py-1.5 text-sm font-bold text-zinc-200">
              LV {level.level}
            </span>
          </div>
        </div>

        <p className="mt-2 text-sm text-zinc-400">
          {rankForLevel(level.level).title} · {level.intoLevel}/{level.toNext || '–'} XP to next
          level
        </p>
      </header>

      {streakLost && (
        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 grayscale">
          <p className="text-sm font-bold uppercase tracking-widest text-zinc-300">
            Streak lost
          </p>
          <p className="mt-0.5 text-sm text-zinc-500">Run it back. One mission restarts it.</p>
        </div>
      )}

      {doneCount > 0 && (
        <section className="mt-5 rounded-xl bg-zinc-900 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-zinc-300">
              <Zap className="size-4 text-accent" />
              Combo heat
            </span>
            <span className="text-sm font-extrabold tabular-nums text-accent">
              x{nextMultiplier} next
            </span>
          </div>
          <div className="mt-2.5 flex gap-1">
            {COMBO_STEPS.map((step, i) => (
              <span
                key={step}
                className={`h-2 flex-1 rounded-full ${
                  i < Math.min(doneCount, COMBO_STEPS.length) ? 'bg-accent' : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>
        </section>
      )}

      <section className="mt-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Missions</h2>
          {scheduled.length > 0 && (
            <span className="text-sm font-bold tabular-nums text-zinc-400">
              {scheduledDone}/{scheduled.length}
            </span>
          )}
        </div>

        {showStarters && (
          <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-zinc-200">
                  {habits.length === 0 ? 'No missions yet' : 'Starter picks'}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                  Pick a starter or build your own in the Missions tab. Every completed mission
                  pays XP and raises your rank.
                </p>
              </div>
              <button
                type="button"
                onClick={dismissStarters}
                className="shrink-0 text-xs font-semibold text-zinc-500 underline underline-offset-4"
              >
                Hide
              </button>
            </div>
            <ul className="mt-4 space-y-2">
              {remainingStarters.map((s) => (
                <li key={s.name}>
                  <button
                    type="button"
                    onClick={() => addStarter(s)}
                    className="flex min-h-11 w-full items-center gap-3 rounded-lg bg-zinc-800/80 px-3 py-2.5 text-left active:bg-zinc-800"
                  >
                    <AreaIcon area={s.area} className="size-4 shrink-0 text-accent" />
                    <span className="flex-1 text-sm font-medium text-zinc-200">{s.name}</span>
                    <span className="text-xs font-bold text-zinc-500">
                      +{DIFFICULTY_XP[s.difficulty]} XP
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <ul className="mt-3 space-y-2.5">
          {scheduled.map((habit) => (
            <MissionRow
              key={habit.id}
              habit={habit}
              done={doneIds.has(habit.id!)}
              xpFloat={xpFloats.find((x) => x.habitId === habit.id)?.xp}
              onCheck={() => onCheck(habit)}
            />
          ))}
        </ul>
      </section>

      {extras.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">
            Off schedule today
          </h2>
          <ul className="mt-3 space-y-2.5">
            {extras.map((habit) => (
              <MissionRow
                key={habit.id}
                habit={habit}
                done={doneIds.has(habit.id!)}
                xpFloat={xpFloats.find((x) => x.habitId === habit.id)?.xp}
                onCheck={() => onCheck(habit)}
              />
            ))}
          </ul>
        </section>
      )}

      <LevelUpOverlay
        level={levelUp?.level ?? null}
        rankTitle={levelUp?.rank ?? ''}
        onDismiss={() => setLevelUp(null)}
      />
      <Toast toast={toast} onDone={() => setToast(null)} />
    </div>
  )
}

function MissionRow({
  habit,
  done,
  xpFloat,
  onCheck,
}: {
  habit: Habit
  done: boolean
  xpFloat?: number
  onCheck: () => void
}) {
  return (
    <li
      className={`relative flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
        done ? 'border-zinc-800/60 bg-zinc-900/40' : 'border-zinc-800 bg-zinc-900'
      }`}
    >
      <AreaIcon
        area={habit.area}
        className={`size-5 shrink-0 ${done ? 'text-zinc-600' : 'text-zinc-400'}`}
      />
      <div className="min-w-0 flex-1">
        <p
          className={`truncate font-semibold ${
            done ? 'text-zinc-500 line-through decoration-zinc-600' : 'text-zinc-100'
          }`}
        >
          {habit.name}
        </p>
        <p className="text-xs font-medium text-zinc-500">
          +{DIFFICULTY_XP[habit.difficulty]} XP base
        </p>
      </div>
      {xpFloat !== undefined && (
        <span className="animate-rise pointer-events-none absolute right-16 top-2 text-sm font-extrabold text-accent">
          +{xpFloat} XP
        </span>
      )}
      <button
        type="button"
        onClick={onCheck}
        aria-label={done ? `Undo ${habit.name}` : `Complete ${habit.name}`}
        aria-pressed={done}
        className={`flex size-11 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          done
            ? 'animate-pulse-ring border-accent bg-accent text-zinc-950'
            : 'border-zinc-700 bg-transparent text-transparent active:border-zinc-500'
        }`}
      >
        <Check className={`size-5 ${done ? 'animate-stamp' : ''}`} strokeWidth={3} />
      </button>
    </li>
  )
}
