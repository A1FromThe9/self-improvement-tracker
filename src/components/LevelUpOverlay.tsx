import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'

interface LevelUpOverlayProps {
  level: number | null
  rankTitle: string
  onDismiss: () => void
}

export function LevelUpOverlay({ level, rankTitle, onDismiss }: LevelUpOverlayProps) {
  useEffect(() => {
    if (level === null) return
    const timer = setTimeout(onDismiss, 3200)
    return () => clearTimeout(timer)
  }, [level, onDismiss])

  return (
    <AnimatePresence>
      {level !== null && (
        <motion.button
          type="button"
          onClick={onDismiss}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/95"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-live="assertive"
        >
          <motion.p
            className="text-sm font-bold uppercase tracking-[0.35em] text-accent"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            Level up
          </motion.p>
          <motion.p
            className="mt-3 text-8xl font-extrabold leading-none tracking-tighter text-zinc-50"
            initial={{ scale: 1.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 14, stiffness: 220, delay: 0.25 }}
          >
            {level}
          </motion.p>
          <motion.p
            className="mt-4 text-lg font-semibold text-zinc-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
          >
            Rank: {rankTitle}
          </motion.p>
          <motion.p
            className="mt-10 text-xs font-medium uppercase tracking-widest text-zinc-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            Tap to continue
          </motion.p>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
