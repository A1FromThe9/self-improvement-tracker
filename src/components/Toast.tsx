import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Trophy } from 'lucide-react'

export interface ToastData {
  title: string
  detail: string
}

export function Toast({ toast, onDone }: { toast: ToastData | null; onDone: () => void }) {
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(onDone, 2800)
    return () => clearTimeout(timer)
  }, [toast, onDone])

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          className="fixed inset-x-4 z-40 mx-auto flex max-w-sm items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 shadow-lg shadow-zinc-950/60"
          style={{ top: 'calc(env(safe-area-inset-top) + 12px)' }}
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 340 }}
          role="status"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/15">
            <Trophy className="size-4 text-accent" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-zinc-50">{toast.title}</p>
            <p className="truncate text-xs text-zinc-400">{toast.detail}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
