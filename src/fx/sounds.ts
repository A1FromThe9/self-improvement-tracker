let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(
  ac: AudioContext,
  freq: number,
  start: number,
  duration: number,
  type: OscillatorType = 'triangle',
  gainPeak = 0.18,
) {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(gainPeak, start + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
  osc.connect(gain).connect(ac.destination)
  osc.start(start)
  osc.stop(start + duration + 0.05)
}

/** Check-off blip: pitch climbs with the daily combo. */
export function playCheck(comboIndex: number) {
  const ac = audio()
  if (!ac) return
  const now = ac.currentTime
  const base = 520 * Math.pow(1.12, Math.min(comboIndex, 4))
  tone(ac, base, now, 0.12)
  tone(ac, base * 1.5, now + 0.06, 0.14)
}

/** Level-up: rising major arpeggio. */
export function playLevelUp() {
  const ac = audio()
  if (!ac) return
  const now = ac.currentTime
  const notes = [392, 494, 587, 784]
  notes.forEach((freq, i) => {
    tone(ac, freq, now + i * 0.09, 0.32, 'triangle', 0.16)
  })
  tone(ac, 1175, now + 0.36, 0.5, 'sine', 0.1)
}

/** Achievement chime. */
export function playAchievement() {
  const ac = audio()
  if (!ac) return
  const now = ac.currentTime
  tone(ac, 880, now, 0.18, 'sine', 0.14)
  tone(ac, 1320, now + 0.1, 0.3, 'sine', 0.12)
}
