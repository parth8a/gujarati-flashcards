// Recompute translit_hi and new_item_translit for every deck file in data/.
// Run after adding or editing sentences: npm run translit
import { writeFileSync } from 'node:fs'
import { toDevanagari } from '../src/lib/gujarati.js'
import { deckFiles, readJson } from './deck-files.js'

const KEY_ORDER = [
  'id', 'unit', 'gu', 'translit_hi', 'en', 'hi',
  'new_item', 'new_item_translit', 'new_item_meaning', 'new_item_form',
  'new_tokens', 'grammar_note', 'needs_review',
]

for (const { name, path } of deckFiles()) {
  const cards = readJson(path)
  let changed = 0
  const out = cards.map((card) => {
    const next = { ...card, translit_hi: toDevanagari(card.gu ?? ''), new_item_translit: toDevanagari(card.new_item ?? '') }
    if (next.translit_hi !== card.translit_hi || next.new_item_translit !== card.new_item_translit) changed++
    const ordered = {}
    for (const k of KEY_ORDER) if (k in next) ordered[k] = next[k]
    for (const k of Object.keys(next)) if (!(k in ordered)) ordered[k] = next[k]
    return ordered
  })
  writeFileSync(path, JSON.stringify(out, null, 2) + '\n')
  console.log(`${name}: ${cards.length} cards, ${changed} transliterations updated`)
}
