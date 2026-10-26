import { useState } from 'react'
import { toDevanagari } from '../lib/gujarati.js'
import { update } from '../lib/store'
import type { Card, CardEdit } from '../lib/types'

const FIELDS: { key: Exclude<keyof CardEdit, 'needs_review'>; label: string; gu?: boolean; multiline?: boolean }[] = [
  { key: 'gu', label: 'Gujarati sentence', gu: true },
  { key: 'en', label: 'English' },
  { key: 'hi', label: 'Hindi parallel' },
  { key: 'new_item', label: 'New item', gu: true },
  { key: 'new_tokens', label: 'New tokens (space separated; -માં for a suffix)', gu: true },
  { key: 'new_item_meaning', label: 'Meaning' },
  { key: 'new_item_form', label: 'Form' },
  { key: 'grammar_note', label: 'Grammar note', multiline: true },
]

function toText(card: Card, key: (typeof FIELDS)[number]['key']): string {
  const v = card[key]
  return Array.isArray(v) ? v.join(' ') : (v ?? '')
}

/**
 * Edit a card's text. Only fields that differ from the original are stored, as
 * an overlay keyed by id, so a later deck update can still change the rest.
 */
export default function CardEditor({ card, original, onClose }: { card: Card; original: Card; onClose: () => void }) {
  const [values, setValues] = useState(() => Object.fromEntries(FIELDS.map((f) => [f.key, toText(card, f.key)])))
  const [needsReview, setNeedsReview] = useState(card.needs_review)

  function save() {
    const edit: CardEdit = {}
    for (const f of FIELDS) {
      const text = values[f.key].trim()
      if (f.key === 'new_tokens') {
        const tokens = text.split(/\s+/u).filter(Boolean)
        if (tokens.join(' ') !== original.new_tokens.join(' ')) edit.new_tokens = tokens
      } else if (text !== (original[f.key] ?? '')) {
        edit[f.key] = text
      }
    }
    if (needsReview !== original.needs_review) edit.needs_review = needsReview
    update((s) => {
      const edits = { ...s.edits }
      if (Object.keys(edit).length) edits[card.id] = edit
      else delete edits[card.id]
      return { edits }
    })
    onClose()
  }

  function revert() {
    update((s) => {
      const edits = { ...s.edits }
      delete edits[card.id]
      return { edits }
    })
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <h2>Edit {card.id}</h2>
        {FIELDS.map((f) => (
          <label key={f.key} className="field">
            <span>{f.label}</span>
            {f.multiline ? (
              <textarea rows={3} value={values[f.key]} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
            ) : (
              <input
                className={f.gu ? 'gu' : undefined}
                value={values[f.key]}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              />
            )}
            {(f.key === 'gu' || f.key === 'new_item') && (
              <small className="deva" lang="hi">
                {toDevanagari(values[f.key])}
              </small>
            )}
          </label>
        ))}
        <label className="check">
          <input type="checkbox" checked={needsReview} onChange={(e) => setNeedsReview(e.target.checked)} />
          Needs review by a native speaker
        </label>
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={revert}>
            Revert to original
          </button>
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn primary">
            Save
          </button>
        </div>
      </form>
    </div>
  )
}
