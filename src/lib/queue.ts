import { dailyFor } from './store'
import type { AppData, Card } from './types'

export interface Counts {
  due: number
  newToday: number
  newLeft: number
  learned: number
  total: number
}

function active(data: AppData) {
  return (c: Card) => !data.flags[c.id]
}

/** Cards whose review is due today (flagged cards are suspended). */
export function dueCards(cards: Card[], data: AppData, day: string): Card[] {
  return cards
    .filter(active(data))
    .filter((c) => data.progress[c.id] && data.progress[c.id].due <= day)
    .sort((a, b) => (data.progress[a.id].due < data.progress[b.id].due ? -1 : 1))
}

/** Unseen cards available today, in deck order, within the daily limit. */
export function newCards(cards: Card[], data: AppData, day: string): Card[] {
  const left = Math.max(0, data.settings.newPerDay - dailyFor(data, day).newIds.length)
  return cards.filter(active(data)).filter((c) => !data.progress[c.id]).slice(0, left)
}

export function counts(cards: Card[], data: AppData, day: string): Counts {
  return {
    due: dueCards(cards, data, day).length,
    newToday: newCards(cards, data, day).length,
    newLeft: cards.filter((c) => !data.progress[c.id] && !data.flags[c.id]).length,
    learned: cards.filter((c) => (data.progress[c.id]?.interval ?? 0) > 0).length,
    total: cards.length,
  }
}
