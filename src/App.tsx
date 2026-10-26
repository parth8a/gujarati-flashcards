import { useEffect } from 'react'
import { useAppData } from './lib/store'
import { useRoute, go, type Route } from './lib/route'
import Home from './screens/Home'
import Review from './screens/Review'
import Browse from './screens/Browse'
import More from './screens/More'

const TABS: { route: Route; label: string; icon: string }[] = [
  { route: 'home', label: 'Study', icon: '◉' },
  { route: 'browse', label: 'Browse', icon: '☰' },
  { route: 'more', label: 'More', icon: '⚙' },
]

export default function App() {
  const route = useRoute()
  const { settings } = useAppData()

  useEffect(() => {
    const root = document.documentElement
    if (settings.theme === 'auto') delete root.dataset.theme
    else root.dataset.theme = settings.theme
  }, [settings.theme])

  if (route === 'review') return <Review />

  return (
    <div className="shell">
      <main className="page">
        {route === 'home' && <Home />}
        {route === 'browse' && <Browse />}
        {route === 'more' && <More />}
      </main>
      <nav className="tabbar" aria-label="Main">
        {TABS.map((t) => (
          <button key={t.route} className={route === t.route ? 'tab active' : 'tab'} onClick={() => go(t.route)}>
            <span className="tab-icon" aria-hidden>
              {t.icon}
            </span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
