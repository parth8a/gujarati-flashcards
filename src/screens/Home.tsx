import { buildDeck } from '../lib/deck'
import { today } from '../lib/day'
import { counts } from '../lib/queue'
import { go } from '../lib/route'
import { addExtraNew, EXTRA_NEW_BATCH, useAppData } from '../lib/store'

export default function Home() {
  const data = useAppData()
  const cards = buildDeck(data)
  const c = counts(cards, data, today())
  const nothing = c.due + c.newToday === 0
  const more = Math.min(EXTRA_NEW_BATCH, c.newLeft)

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
        {nothing ? (
          <p className="center done-msg">All done for today 🎉</p>
        ) : (
          <button className="btn primary big" onClick={() => go('review')}>
            Start review
          </button>
        )}
        {c.newToday === 0 && more > 0 && (
          <button
            className={nothing ? 'btn primary big' : 'btn big'}
            onClick={() => {
              addExtraNew(more)
              go('review')
            }}
          >
            + {more} more new cards
          </button>
        )}
      </div>
    </div>
  )
}
