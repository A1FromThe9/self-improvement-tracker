import { Crosshair, ChartNoAxesColumn, ListChecks, CircleUserRound } from 'lucide-react'

export type Tab = 'today' | 'stats' | 'missions' | 'profile'

const TABS: { id: Tab; label: string; icon: typeof Crosshair }[] = [
  { id: 'today', label: 'Today', icon: Crosshair },
  { id: 'stats', label: 'Stats', icon: ChartNoAxesColumn },
  { id: 'missions', label: 'Missions', icon: ListChecks },
  { id: 'profile', label: 'Profile', icon: CircleUserRound },
]

export function TabBar({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-md">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = id === active
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                isActive ? 'text-accent' : 'text-zinc-500'
              }`}
            >
              <Icon className="size-5" strokeWidth={isActive ? 2.4 : 2} />
              {label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
