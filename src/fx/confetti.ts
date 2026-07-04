import confetti from 'canvas-confetti'

const reducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

const ACCENT_SHADES = ['#b6e34a', '#8fbc2e', '#e7f5c0', '#f4f4f5']

export function burstLevelUp() {
  if (reducedMotion()) return
  const defaults = { colors: ACCENT_SHADES, disableForReducedMotion: true, zIndex: 60 }
  confetti({ ...defaults, particleCount: 90, spread: 75, origin: { y: 0.6 } })
  setTimeout(() => {
    confetti({ ...defaults, particleCount: 45, angle: 60, spread: 55, origin: { x: 0 } })
    confetti({ ...defaults, particleCount: 45, angle: 120, spread: 55, origin: { x: 1 } })
  }, 200)
}

export function burstSmall() {
  if (reducedMotion()) return
  confetti({
    colors: ACCENT_SHADES,
    disableForReducedMotion: true,
    particleCount: 30,
    spread: 50,
    startVelocity: 25,
    origin: { y: 0.75 },
    zIndex: 60,
  })
}
