import { buildDeck } from '../lib/deck'
import { today } from '../lib/day'
import { counts } from '../lib/queue'
import { go } from '../lib/route'
import { useAppData } from '../lib/store'

export default function Home() {
  const data = useAppData()
  const cards = buildDeck(data)
  const c = counts(cards, data, today())
  const nothing = c.due + c.newToday === 0

  return (
    <div className="home">
      <header className="home-header">
        <h1>
          <span className="gu" lang="gu">
            ગુજરાતી
          </span>{' '}
          flashcards
        </h1>
        <p className="muted">One new thing per sentence.</p>
      </header>

      <div className="stats">
        <div className="stat">
          <span className="stat-num due">{c.due}</span>
          <span className="stat-label">due</span>
        </div>
        <div className="stat">
          <span className="stat-num new">{c.newToday}</span>
          <span className="stat-label">new today</span>
        </div>
      </div>

      <p className="muted center">
        {c.learned} of {c.total} sentences learned · {c.newLeft} not seen yet
      </p>

      <div className="home-actions">
        <button className="btn primary big" disabled={nothing} onClick={() => go('review')}>
          {nothing ? 'All done for today 🎉' : 'Start review'}
        </button>
        {nothing && c.newLeft > 0 && (
          <p className="muted center small">
            Want more? Raise "new cards per day" under <a href="#/more">More</a>.
          </p>
        )}
      </div>
    </div>
  )
}
