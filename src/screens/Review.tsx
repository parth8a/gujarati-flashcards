import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AudioButton from '../components/AudioButton'
import CardDetails from '../components/CardDetails'
import Sentence from '../components/Sentence'
import { buildDeck, toggleFlag, unitName } from '../lib/deck'
import { today } from '../lib/day'
import { dueCards, newCards } from '../lib/queue'
import { go } from '../lib/route'
import { fail, pass, previewPassDays } from '../lib/srs'
import { dailyFor, getState, update, useAppData } from '../lib/store'

/** How many cards later a failed card comes back in the same session. */
const RELEARN_GAP = 3

function intervalLabel(days: number) {
  if (days < 30) return `${days}d`
  if (days < 365) return `${Math.round(days / 30)}mo`
  return `${(days / 365).toFixed(1)}y`
}

export default function Review() {
  const data = useAppData()
  const cards = buildDeck(data)
  const byId = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards])

  // The session queue is fixed when the screen opens; failed cards are re-inserted.
  const [queue, setQueue] = useState<string[]>(() => {
    const s = getState()
    const all = buildDeck(s)
    const day = today()
    return [...dueCards(all, s, day), ...newCards(all, s, day)].map((c) => c.id)
  })
  const [revealed, setRevealed] = useState(false)
  const [showTranslit, setShowTranslit] = useState(false)
  const [done, setDone] = useState({ pass: 0, fail: 0 })
  const failed = useRef(new Set<string>())
  const scroller = useRef<HTMLDivElement>(null)

  const card = queue.length ? byId.get(queue[0]) : undefined
  const progress = card ? data.progress[card.id] : undefined
  const isNew = !!card && !progress

  const next = useCallback((q: string[]) => {
    setQueue(q)
    setRevealed(false)
    setShowTranslit(false)
    scroller.current?.scrollTo(0, 0)
  }, [])

  const grade = useCallback(
    (ok: boolean) => {
      if (!card || !revealed) return
      const day = today()
      const id = card.id
      update((s) => {
        const prev = s.progress[id]
        const daily = dailyFor(s, day)
        return {
          progress: { ...s.progress, [id]: ok ? pass(prev, day, failed.current.has(id)) : fail(prev, day) },
          daily: prev || daily.newIds.includes(id) ? daily : { day, newIds: [...daily.newIds, id] },
        }
      })
      setDone((d) => (ok ? { ...d, pass: d.pass + 1 } : { ...d, fail: d.fail + 1 }))
      const rest = queue.slice(1)
      if (ok) {
        failed.current.delete(id)
        next(rest)
      } else {
        failed.current.add(id)
        const at = Math.min(RELEARN_GAP, rest.length)
        next([...rest.slice(0, at), id, ...rest.slice(at)])
      }
    },
    [card, revealed, queue, next],
  )

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (!revealed && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault()
        setRevealed(true)
      } else if (revealed && (e.key === '1' || e.key === 'f')) grade(false)
      else if (revealed && (e.key === '2' || e.key === 'p' || e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault()
        grade(true)
      } else if (e.key === 't') setShowTranslit((v) => !v)
      else if (e.key === 'Escape') go('home')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [revealed, grade])

  if (!card) {
    return (
      <div className="review">
        <header className="review-bar">
          <button className="icon-btn" aria-label="Close" onClick={() => go('home')}>
            ✕
          </button>
        </header>
        <div className="finished">
          <p className="big-emoji" aria-hidden>
            🎉
          </p>
          <h2>Session complete</h2>
          <p className="muted">
            {done.pass} passed · {done.fail} failed
          </p>
          <button className="btn primary big" onClick={() => go('home')}>
            Back home
          </button>
        </div>
      </div>
    )
  }

  const passDays = previewPassDays(progress, failed.current.has(card.id))

  return (
    <div className="review">
      <header className="review-bar">
        <button className="icon-btn" aria-label="Close" onClick={() => go('home')}>
          ✕
        </button>
        <span className="muted small">
          {queue.length} left · {unitName(card.unit)}
        </span>
        <button
          className="icon-btn"
          aria-label="Flag this card as wrong"
          title="Flag as wrong"
          onClick={() => {
            if (toggleFlag(card.id, data, update)) next(queue.filter((id) => id !== card.id))
          }}
        >
          ⚑
        </button>
      </header>

      <div className="review-body" ref={scroller} onClick={() => !revealed && setRevealed(true)}>
        <div className="card-front">
          <div className="badges">
            {isNew && <span className="badge new">new</span>}
            {failed.current.has(card.id) && <span className="badge again">again</span>}
          </div>
          <Sentence card={card} />
          <div className="front-tools">
            <AudioButton text={card.gu} />
            {!revealed && (
              <button
                className={showTranslit ? 'translit-toggle open' : 'translit-toggle'}
                onClick={(e) => {
                  e.stopPropagation()
                  setShowTranslit((v) => !v)
                }}
              >
                {showTranslit ? <Sentence card={card} script="hi" className="deva translit inline" /> : 'Tap to show देवनागरी'}
              </button>
            )}
          </div>
        </div>
        {revealed && <CardDetails card={card} />}
      </div>

      <footer className="review-actions">
        {revealed ? (
          <>
            <button className="btn fail big" onClick={() => grade(false)}>
              Fail
              <small>again</small>
            </button>
            <button className="btn pass big" onClick={() => grade(true)}>
              Pass
              <small>{intervalLabel(passDays)}</small>
            </button>
          </>
        ) : (
          <button className="btn primary big wide" onClick={() => setRevealed(true)}>
            Show answer
          </button>
        )}
      </footer>
    </div>
  )
}
