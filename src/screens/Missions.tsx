import { useMemo, useState } from 'react'
import { Archive, Flame, Minus, Plus } from 'lucide-react'
import type { Area, Habit, Unit } from '../game/types'
import {
  AREAS,
  AREA_LABELS,
  UNITS,
  UNIT_LABELS,
  UNIT_DEFAULT_QUANTITY,
  UNIT_STEP,
} from '../game/types'
import { addHabit, archiveHabit, updateHabit } from '../db/repo'
import { useActiveHabits, useAllCompletions } from '../lib/hooks'
import { xpForQuantity } from '../game/xp'
import { habitStreak } from '../game/streaks'
import { formatQuantity } from '../lib/format'
import { AreaIcon } from '../components/AreaIcon'
import { Sheet } from '../components/Sheet'

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6]

interface FormState {
  id?: number
  name: string
  area: Area
  unit: Unit
  defaultQuantity: number
  scheduleDays: number[]
}

const EMPTY_FORM: FormState = {
  name: '',
  area: 'body',
  unit: 'minutes',
  defaultQuantity: UNIT_DEFAULT_QUANTITY.minutes,
  scheduleDays: EVERY_DAY,
}

export function Missions() {
  const habits = useActiveHabits()
  const completions = useAllCompletions()
  const [form, setForm] = useState<FormState | null>(null)

  const totalsByHabit = useMemo(() => {
    const map = new Map<number, number>()
    for (const c of completions ?? []) {
      map.set(c.habitId, (map.get(c.habitId) ?? 0) + c.quantity)
    }
    return map
  }, [completions])

  const completionsByHabit = useMemo(() => {
    const map = new Map<number, Set<string>>()
    for (const c of completions ?? []) {
      if (!map.has(c.habitId)) map.set(c.habitId, new Set())
      map.get(c.habitId)!.add(c.dateKey)
    }
    return map
  }, [completions])

  const openEdit = (habit: Habit) =>
    setForm({
      id: habit.id,
      name: habit.name,
      area: habit.area,
      unit: habit.unit,
      defaultQuantity: habit.defaultQuantity,
      scheduleDays: habit.scheduleDays,
    })

  const save = async () => {
    if (!form || form.name.trim() === '' || form.scheduleDays.length === 0) return
    const payload = {
      name: form.name.trim(),
      area: form.area,
      unit: form.unit,
      defaultQuantity: Math.max(1, form.defaultQuantity),
      scheduleDays: [...form.scheduleDays].sort(),
    }
    if (form.id !== undefined) {
      await updateHabit(form.id, payload)
    } else {
      await addHabit(payload)
    }
    setForm(null)
  }

  const archive = async () => {
    if (form?.id === undefined) return
    await archiveHabit(form.id)
    setForm(null)
  }

  return (
    <div className="px-5 pb-6">
      <header className="pt-3">
        <h1 className="text-3xl font-extrabold leading-none tracking-tighter text-zinc-50">
          Missions
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Build the routine. Real quantities set the XP.
        </p>
      </header>

      {habits && habits.length === 0 && (
        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="font-semibold text-zinc-200">Nothing here yet</p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-400">
            Create your first mission with the button below.
          </p>
        </div>
      )}

      <ul className="mt-5 space-y-2.5">
        {(habits ?? []).map((habit) => {
          const streak = habitStreak(
            habit.scheduleDays,
            completionsByHabit.get(habit.id!) ?? new Set(),
          )
          const lifetime = totalsByHabit.get(habit.id!) ?? 0
          return (
            <li key={habit.id}>
              <button
                type="button"
                onClick={() => openEdit(habit)}
                className="flex min-h-16 w-full items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-left active:bg-zinc-800/70"
              >
                <AreaIcon area={habit.area} className="size-5 shrink-0 text-zinc-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-zinc-100">{habit.name}</p>
                  <p className="mt-0.5 text-xs font-medium text-zinc-500">
                    {AREA_LABELS[habit.area]} · {formatQuantity(habit.unit, habit.defaultQuantity)}
                    {' · '}
                    {habit.scheduleDays.length === 7
                      ? 'Every day'
                      : habit.scheduleDays.map((d) => DAY_LETTERS[d]).join(' ')}
                  </p>
                  {lifetime > 0 && (
                    <p className="mt-1 text-xs font-bold text-accent">
                      Lifetime: {formatQuantity(habit.unit, lifetime)}
                    </p>
                  )}
                </div>
                {streak > 0 && (
                  <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-zinc-300">
                    <Flame className="size-4 text-accent" />
                    {streak}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      <button
        type="button"
        onClick={() => setForm(EMPTY_FORM)}
        aria-label="New mission"
        className="fixed right-5 z-30 flex size-14 items-center justify-center rounded-full bg-accent text-zinc-950 shadow-lg shadow-zinc-950/50 active:scale-95"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 76px)' }}
      >
        <Plus className="size-6" strokeWidth={2.6} />
      </button>

      <Sheet
        open={form !== null}
        title={form?.id !== undefined ? 'Edit mission' : 'New mission'}
        onClose={() => setForm(null)}
      >
        {form && (
          <div className="space-y-5 pb-2">
            <div>
              <label
                htmlFor="mission-name"
                className="text-xs font-bold uppercase tracking-widest text-zinc-500"
              >
                Name
              </label>
              <input
                id="mission-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Morning run"
                maxLength={60}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-3 text-base font-medium text-zinc-100 placeholder:text-zinc-500 focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                Area
              </span>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {AREAS.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => setForm({ ...form, area })}
                    aria-pressed={form.area === area}
                    className={`flex min-h-11 items-center justify-center gap-1.5 rounded-lg border px-2 py-2.5 text-sm font-semibold ${
                      form.area === area
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-zinc-700 bg-zinc-800/60 text-zinc-400'
                    }`}
                  >
                    <AreaIcon area={area} className="size-4" />
                    {AREA_LABELS[area]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                Unit
              </span>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {UNITS.map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() =>
                      setForm({ ...form, unit, defaultQuantity: UNIT_DEFAULT_QUANTITY[unit] })
                    }
                    aria-pressed={form.unit === unit}
                    className={`min-h-11 rounded-lg border px-2 py-2.5 text-sm font-semibold ${
                      form.unit === unit
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-zinc-700 bg-zinc-800/60 text-zinc-400'
                    }`}
                  >
                    {UNIT_LABELS[unit]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                One completion equals
              </span>
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      defaultQuantity: Math.max(1, form.defaultQuantity - UNIT_STEP[form.unit]),
                    })
                  }
                  aria-label="Decrease quantity"
                  className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/60 text-zinc-300"
                >
                  <Minus className="size-4" />
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={form.defaultQuantity}
                  onChange={(e) =>
                    setForm({ ...form, defaultQuantity: Math.max(1, Number(e.target.value) || 1) })
                  }
                  className="min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-center text-base font-bold tabular-nums text-zinc-100 focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    setForm({ ...form, defaultQuantity: form.defaultQuantity + UNIT_STEP[form.unit] })
                  }
                  aria-label="Increase quantity"
                  className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/60 text-zinc-300"
                >
                  <Plus className="size-4" />
                </button>
              </div>
              <p className="mt-2 text-xs font-medium text-zinc-500">
                {formatQuantity(form.unit, form.defaultQuantity)} per completion · ≈
                {' '}
                {xpForQuantity(form.unit, form.defaultQuantity)} XP
              </p>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                Days
              </span>
              <div className="mt-2 flex gap-1.5">
                {DAY_LETTERS.map((letter, day) => {
                  const on = form.scheduleDays.includes(day)
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          scheduleDays: on
                            ? form.scheduleDays.filter((d) => d !== day)
                            : [...form.scheduleDays, day],
                        })
                      }
                      aria-pressed={on}
                      aria-label={
                        ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day]
                      }
                      className={`flex size-11 flex-1 items-center justify-center rounded-lg border text-sm font-bold ${
                        on
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-zinc-700 bg-zinc-800/60 text-zinc-500'
                      }`}
                    >
                      {letter}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              {form.id !== undefined && (
                <button
                  type="button"
                  onClick={archive}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 font-semibold text-zinc-400 active:bg-zinc-800"
                >
                  <Archive className="size-4" />
                  Retire
                </button>
              )}
              <button
                type="button"
                onClick={save}
                disabled={form.name.trim() === '' || form.scheduleDays.length === 0}
                className="min-h-12 flex-1 rounded-lg bg-accent font-bold text-zinc-950 disabled:opacity-40"
              >
                {form.id !== undefined ? 'Save changes' : 'Add mission'}
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  )
}
