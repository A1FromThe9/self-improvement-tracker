import type { Settings } from '../game/types'
import { playAchievement, playCheck, playLevelUp } from './sounds'
import { haptic } from './haptics'

/** Central place that respects the user's sound and haptics settings. */
export const feedback = {
  check(settings: Settings, comboIndex: number) {
    if (settings.sound) playCheck(comboIndex)
    if (settings.haptics) haptic.check()
  },
  levelUp(settings: Settings) {
    if (settings.sound) playLevelUp()
    if (settings.haptics) haptic.levelUp()
  },
  achievement(settings: Settings) {
    if (settings.sound) playAchievement()
    if (settings.haptics) haptic.achievement()
  },
  tap(settings: Settings) {
    if (settings.haptics) haptic.tap()
  },
}
