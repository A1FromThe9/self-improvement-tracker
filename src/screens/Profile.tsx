import { useMemo, useRef, useState } from 'react'
import { Download, Lock, Trophy, Upload } from 'lucide-react'
import { useAllCompletions, useProfile } from '../lib/hooks'
import { updateSettings } from '../db/repo'
import { exportData, importData } from '../db/backup'
import { db } from '../db/schema'
import { levelFromXp } from '../game/xp'
import { rankForLevel, nextRank } from '../game/ranks'
import { ACHIEVEMENTS } from '../game/achievements'

export function Profile() {
  const profile = useProfile()
  const completions = useAllCompletions()
  const fileRef = useRef<HTMLInputElement>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const level = levelFromXp(profile?.totalXp ?? 0)
  const rank = rankForLevel(level.level)
  const next = nextRank(level.level)
  const unlocked = useMemo(() => new Set(profile?.unlocked ?? []), [profile])

  const daysActive = useMemo(
    () => new Set((completions ?? []).map((c) => c.dateKey)).size,
    [completions],
  )

  const onImport = async (file: File | undefined) => {
    if (!file) return
    try {
      const result = await importData(file)
      setNotice(`Restored ${result.habits} missions and ${result.completions} completions`)
    } catch {
      setNotice('That file is not a valid Grind backup')
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const resetAll = async () => {
    await Promise.all([db.habits.clear(), db.completions.clear(), db.profile.clear()])
    setConfirmReset(false)
    setNotice('Fresh start. Everything cleared.')
  }

  return (
    <div className="px-5 pb-6">
      <header className="pt-3">
        <h1 className="text-3xl font-extrabold leading-none tracking-tighter text-zinc-50">
          Profile
        </h1>
      </header>

      <section className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Current rank</p>
        <p className="mt-1 text-4xl font-extrabold leading-none tracking-tighter text-accent">
          {rank.title}
        </p>
        <p className="mt-3 text-sm text-zinc-400">
          Level {level.level} · {(profile?.totalXp ?? 0).toLocaleString()} XP lifetime ·{' '}
          {daysActive} active {daysActive === 1 ? 'day' : 'days'}
        </p>
        {next && (
          <p className="mt-1 text-xs text-zinc-500">
            {next.title} unlocks at level {next.minLevel}
          </p>
        )}
      </section>

      <section className="mt-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Trophies</h2>
          <span className="text-xs font-bold tabular-nums text-zinc-400">
            {unlocked.size}/{ACHIEVEMENTS.length}
          </span>
        </div>
        <ul className="mt-3 grid grid-cols-2 gap-2.5">
          {ACHIEVEMENTS.map((a) => {
            const owned = unlocked.has(a.id)
            return (
              <li
                key={a.id}
                className={`rounded-xl border p-3.5 ${
                  owned ? 'border-zinc-700 bg-zinc-900' : 'border-zinc-800/60 bg-zinc-900/40'
                }`}
              >
                {owned ? (
                  <Trophy className="size-4 text-accent" />
                ) : (
                  <Lock className="size-4 text-zinc-600" />
                )}
                <p
                  className={`mt-2 text-sm font-bold ${owned ? 'text-zinc-100' : 'text-zinc-500'}`}
                >
                  {a.name}
                </p>
                <p className={`mt-0.5 text-xs ${owned ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {a.description}
                </p>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Feedback</h2>
        <div className="mt-3 divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900">
          <SettingToggle
            label="Sound effects"
            checked={profile?.settings.sound ?? true}
            onChange={(sound) => updateSettings({ sound })}
          />
          <SettingToggle
            label="Haptics"
            checked={profile?.settings.haptics ?? true}
            onChange={(haptics) => updateSettings({ haptics })}
          />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Your data</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Everything lives on this device. No account, no server. Export a backup before
          switching phones.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => exportData()}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-700 font-semibold text-zinc-200 active:bg-zinc-800"
          >
            <Download className="size-4" />
            Export
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-700 font-semibold text-zinc-200 active:bg-zinc-800"
          >
            <Upload className="size-4" />
            Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => onImport(e.target.files?.[0])}
          />
        </div>

        {notice && <p className="mt-3 text-sm font-medium text-accent">{notice}</p>}

        <div className="mt-6">
          {confirmReset ? (
            <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4">
              <p className="text-sm font-semibold text-zinc-200">
                Wipe all missions, XP and trophies?
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="min-h-11 flex-1 rounded-lg border border-zinc-700 font-semibold text-zinc-300"
                >
                  Keep it
                </button>
                <button
                  type="button"
                  onClick={resetAll}
                  className="min-h-11 flex-1 rounded-lg bg-zinc-200 font-bold text-zinc-950"
                >
                  Wipe it
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="text-sm font-medium text-zinc-500 underline underline-offset-4"
            >
              Reset all data
            </button>
          )}
        </div>
      </section>
    </div>
  )
}

function SettingToggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex min-h-13 cursor-pointer items-center justify-between px-4 py-3">
      <span className="font-medium text-zinc-200">{label}</span>
      <span className="relative inline-flex">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span className="h-7 w-12 rounded-full bg-zinc-700 transition-colors peer-checked:bg-accent" />
        <span className="absolute left-1 top-1 size-5 rounded-full bg-zinc-100 transition-transform peer-checked:translate-x-5 peer-checked:bg-zinc-950" />
      </span>
    </label>
  )
}
