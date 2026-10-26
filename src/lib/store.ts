// App state lives in localStorage, one key per section. Progress is a map keyed
// by card id, so adding or changing cards never touches anyone else's progress.
import { useSyncExternalStore } from 'react'
import { today } from './day'
import type { AppData, Settings } from './types'

const PREFIX = 'gujarati-flashcards:'
const KEYS = ['progress', 'edits', 'flags', 'imported', 'settings', 'daily'] as const
type Key = (typeof KEYS)[number]

export const DEFAULT_SETTINGS: Settings = { newPerDay: 10, theme: 'auto' }

function defaults(): AppData {
  return {
    progress: {},
    edits: {},
    flags: {},
    imported: [],
    settings: { ...DEFAULT_SETTINGS },
    daily: { day: today(), newIds: [] },
  }
}

function load(): AppData {
  const data = defaults()
  for (const key of KEYS) {
    try {
      const raw = localStorage.getItem(PREFIX + key)
      if (raw) (data as unknown as Record<Key, unknown>)[key] = JSON.parse(raw)
    } catch {
      // Unreadable or blocked storage: keep the default for this section.
    }
  }
  data.settings = { ...DEFAULT_SETTINGS, ...data.settings }
  return data
}

let state: AppData = load()
const listeners = new Set<() => void>()

function persist(changed: AppData) {
  for (const key of KEYS) {
    if (changed[key] !== state[key]) {
      try {
        localStorage.setItem(PREFIX + key, JSON.stringify(changed[key]))
      } catch (e) {
        console.error('Could not save', key, e)
      }
    }
  }
}

export function getState(): AppData {
  return state
}

/** Replace parts of the state immutably and save the sections that changed. */
export function update(fn: (s: AppData) => Partial<AppData>) {
  const next = { ...state, ...fn(state) }
  persist(next)
  state = next
  listeners.forEach((l) => l())
}

/** Replace everything (used by Restore). */
export function replaceAll(data: AppData) {
  const next = { ...defaults(), ...data, settings: { ...DEFAULT_SETTINGS, ...data.settings } }
  for (const key of KEYS) localStorage.setItem(PREFIX + key, JSON.stringify(next[key]))
  state = next
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useAppData(): AppData {
  return useSyncExternalStore(subscribe, getState)
}

/** The day's new-card counter, reset when the study day changes. */
export function dailyFor(s: AppData, day = today()): AppData['daily'] {
  return s.daily.day === day ? s.daily : { day, newIds: [] }
}

/** How many new cards the "+ more" button adds. */
export const EXTRA_NEW_BATCH = 5

/** Allow `n` more new cards today only; the daily setting is unchanged. */
export function addExtraNew(n = EXTRA_NEW_BATCH) {
  update((s) => {
    const daily = dailyFor(s)
    return { daily: { ...daily, extra: (daily.extra ?? 0) + n } }
  })
}

// Another tab (or the installed app and a browser tab) changed storage.
window.addEventListener('storage', (e) => {
  if (e.key?.startsWith(PREFIX)) {
    state = load()
    listeners.forEach((l) => l())
  }
})
