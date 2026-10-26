import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import { setOfflineReady } from './lib/pwa'
import './styles.css'

// New deploys: the service worker checks for an update whenever the app is
// opened or brought back to the foreground, installs it in the background and
// reloads once it is ready. Progress lives in localStorage, so it survives.
registerSW({
  immediate: true,
  onOfflineReady: () => setOfflineReady(true),
  onRegisteredSW(_url, registration) {
    if (!registration) return
    setOfflineReady(!!registration.active)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && navigator.onLine) registration.update().catch(() => {})
    })
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
