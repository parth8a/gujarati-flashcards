// SM-2 scheduling reduced to two buttons (Refold style):
//  - Pass keeps the ease and grows the interval: 1 day, 6 days, then interval × ease.
//  - Fail drops the ease by 0.2 (min 1.3), resets the card to learning and makes it
//    due today, so the session shows it again before you finish.
import { addDays } from './day'
import type { Progress } from './types'

export const START_EASE = 2.5
const MIN_EASE = 1.3
const EASE_PENALTY = 0.2
const MAX_INTERVAL = 365

export function pass(p: Progress | undefined, day: string, failedThisSession: boolean): Progress {
  const base = p ?? newProgress(day)
  let interval: number
  let reps = base.reps + 1
  if (failedThisSession || base.interval === 0) {
    // Graduating from (re)learning.
    interval = 1
    reps = 1
  } else if (reps === 2) {
    interval = 6
  } else {
    interval = Math.round(base.interval * base.ease)
  }
  interval = Math.min(Math.max(interval, 1), MAX_INTERVAL)
  return { ...base, interval, reps, due: addDays(day, interval), last: Date.now() }
}

export function fail(p: Progress | undefined, day: string): Progress {
  const base = p ?? newProgress(day)
  const wasLearned = base.interval > 0
  return {
    ...base,
    interval: 0,
    reps: 0,
    ease: wasLearned ? Math.max(MIN_EASE, +(base.ease - EASE_PENALTY).toFixed(2)) : base.ease,
    lapses: base.lapses + (wasLearned ? 1 : 0),
    due: day,
    last: Date.now(),
  }
}

function newProgress(day: string): Progress {
  return { due: day, interval: 0, ease: START_EASE, reps: 0, lapses: 0, last: 0 }
}

/** What the Pass button would schedule, for showing "1d", "6d", … on the button. */
export function previewPassDays(p: Progress | undefined, failedThisSession: boolean): number {
  return pass(p, '2000-01-01', failedThisSession).interval
}
