import { useSyncExternalStore } from 'react'

let offlineReady = false
const listeners = new Set<() => void>()

export function setOfflineReady(v: boolean) {
  offlineReady = v
  listeners.forEach((l) => l())
}

export function useOfflineReady() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => offlineReady,
  )
}
