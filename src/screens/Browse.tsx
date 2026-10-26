import { useMemo, useState } from 'react'
import AudioButton from '../components/AudioButton'
import CardDetails from '../components/CardDetails'
import CardEditor from '../components/CardEditor'
import Sentence from '../components/Sentence'
import { buildDeck, originalCard, toggleFlag, unitName } from '../lib/deck'
import { daysBetween, today } from '../lib/day'
import { update, useAppData } from '../lib/store'
import type { AppData, Card } from '../lib/types'

type Filter = 'all' | 'flagged' | 'edited' | 'learning' | 'new'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'Unseen' },
  { key: 'learning', label: 'Studied' },
  { key: 'flagged', label: 'Flagged' },
  { key: 'edited', label: 'Edited' },
]

function status(card: Card, data: AppData, day: string): { text: string; cls: string } {
  if (data.flags[card.id]) return { text: 'flagged', cls: 'flagged' }
  const p = data.progress[card.id]
  if (!p) return { text: 'new', cls: 'new' }
  const d = daysBetween(day, p.due)
  if (d <= 0) return { text: 'due', cls: 'due' }
  return { text: `in ${d}d`, cls: 'later' }
}

function matches(card: Card, q: string) {
  if (!q) return true
  const hay = [card.id, card.gu, card.translit_hi, card.en, card.hi, card.new_item, card.new_item_meaning, card.grammar_note]
    .join(' ')
    .toLowerCase()
  return hay.includes(q)
}

export default function Browse() {
  const data = useAppData()
  const cards = buildDeck(data)
  const day = today()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [unit, setUnit] = useState<number | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [editing, setEditing] = useState<Card | null>(null)

  const units = useMemo(() => {
    const m = new Map<number, { total: number; learned: number; seen: number }>()
    for (const c of cards) {
      const u = m.get(c.unit) ?? { total: 0, learned: 0, seen: 0 }
      u.total++
      const p = data.progress[c.id]
      if (p) u.seen++
      if (p && p.interval > 0) u.learned++
      m.set(c.unit, u)
    }
    return [...m.entries()].sort((a, b) => a[0] - b[0])
  }, [cards, data.progress])

  const q = query.trim().toLowerCase()
  const list = cards.filter((c) => {
    if (unit !== null && c.unit !== unit) return false
    if (filter === 'flagged' && !data.flags[c.id]) return false
    if (filter === 'edited' && !data.edits[c.id]) return false
    if (filter === 'learning' && !data.progress[c.id]) return false
    if (filter === 'new' && data.progress[c.id]) return false
    return matches(c, q)
  })

  return (
    <div className="browse">
      <div className="search-bar">
        <input
          type="search"
          placeholder="Search Gujarati, देवनागरी, English…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search cards"
        />
        <div className="chips" role="tablist">
          {FILTERS.map((f) => (
            <button key={f.key} className={filter === f.key ? 'chip active' : 'chip'} onClick={() => setFilter(f.key)}>
              {f.label}
              {f.key === 'flagged' && Object.keys(data.flags).length > 0 && ` (${Object.keys(data.flags).length})`}
            </button>
          ))}
        </div>
      </div>

      <details className="units" open={unit === null && !q}>
        <summary>Progress by unit</summary>
        <ul>
          {units.map(([u, s]) => (
            <li key={u}>
              <button className={unit === u ? 'unit-row active' : 'unit-row'} onClick={() => setUnit(unit === u ? null : u)}>
                <span className="unit-name">
                  {u}. {unitName(u)}
                </span>
                <span className="unit-count">
                  {s.learned}/{s.total}
                </span>
                <span className="bar" aria-hidden>
                  <span className="bar-seen" style={{ width: `${(100 * s.seen) / s.total}%` }} />
                  <span className="bar-fill" style={{ width: `${(100 * s.learned) / s.total}%` }} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </details>

      <p className="muted small list-meta">
        {list.length} card{list.length === 1 ? '' : 's'}
        {unit !== null && (
          <>
            {' '}
            in unit {unit} ·{' '}
            <button className="link" onClick={() => setUnit(null)}>
              show all units
            </button>
          </>
        )}
      </p>

      <ul className="card-list">
        {list.map((c) => {
          const st = status(c, data, day)
          const isOpen = open === c.id
          const flag = data.flags[c.id]
          return (
            <li key={c.id} className={isOpen ? 'card-row open' : 'card-row'}>
              <button className="card-row-head" onClick={() => setOpen(isOpen ? null : c.id)} aria-expanded={isOpen}>
                <span className="gu row-gu" lang="gu">
                  {c.gu}
                </span>
                <span className="row-en">{c.en}</span>
                <span className="row-meta">
                  <span className="muted small">{c.id}</span>
                  {data.edits[c.id] && <span className="pill edited">edited</span>}
                  <span className={`pill ${st.cls}`}>{st.text}</span>
                </span>
              </button>
              {isOpen && (
                <div className="card-row-body">
                  <Sentence card={c} />
                  <CardDetails card={c} />
                  {flag && (
                    <p className="flag-note">
                      ⚑ Flagged{flag.note ? `: ${flag.note}` : ''}
                    </p>
                  )}
                  <div className="row-actions">
                    <AudioButton text={c.gu} />
                    <button className="btn ghost" onClick={() => toggleFlag(c.id, data, update)}>
                      {flag ? 'Unflag' : '⚑ Flag as wrong'}
                    </button>
                    <button className="btn ghost" onClick={() => setEditing(c)}>
                      ✎ Edit
                    </button>
                    {data.progress[c.id] && (
                      <button
                        className="btn ghost"
                        onClick={() => {
                          if (!confirm('Forget your progress on this card? It will come back as a new card.')) return
                          update((s) => {
                            const progress = { ...s.progress }
                            delete progress[c.id]
                            return { progress }
                          })
                        }}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {editing && (
        <CardEditor card={editing} original={originalCard(editing.id, data) ?? editing} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}
