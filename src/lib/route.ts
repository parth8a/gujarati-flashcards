import { useSyncExternalStore } from 'react'

// Hash routes (#/review, #/browse, …) so a refresh on GitHub Pages never 404s.
export type Route = 'home' | 'review' | 'browse' | 'more'
const ROUTES: Route[] = ['home', 'review', 'browse', 'more']

function current(): Route {
  const r = location.hash.replace(/^#\/?/, '') as Route
  return ROUTES.includes(r) ? r : 'home'
}

export function useRoute(): Route {
  return useSyncExternalStore((l) => {
    window.addEventListener('hashchange', l)
    return () => window.removeEventListener('hashchange', l)
  }, current)
}

export function go(route: Route) {
  location.hash = route === 'home' ? '/' : `/${route}`
}
