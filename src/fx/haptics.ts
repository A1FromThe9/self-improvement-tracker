function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}

export const haptic = {
  tap: () => vibrate(10),
  check: () => vibrate([15, 40, 25]),
  levelUp: () => vibrate([30, 60, 30, 60, 80]),
  achievement: () => vibrate([20, 50, 40]),
}
