import type { Unit } from '../game/types'

function formatNumber(n: number): string {
  return Math.round(n).toLocaleString()
}

/** Human, tangible display of a real quantity, e.g. "2,000 pages", "142h 30m" */
export function formatQuantity(unit: Unit, quantity: number): string {
  switch (unit) {
    case 'minutes': {
      const totalMinutes = Math.round(quantity)
      if (totalMinutes < 60) return `${totalMinutes} min`
      const hours = Math.floor(totalMinutes / 60)
      const mins = totalMinutes % 60
      return mins > 0 ? `${formatNumber(hours)}h ${mins}m` : `${formatNumber(hours)}h`
    }
    case 'pages':
      return `${formatNumber(quantity)} pages`
    case 'reps':
      return `${formatNumber(quantity)} reps`
    case 'dollars':
      return `$${formatNumber(quantity)}`
    case 'count':
      return quantity === 1 ? '1 time' : `${formatNumber(quantity)} times`
  }
}
