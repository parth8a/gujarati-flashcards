// The deck is every data/*.json file bundled at build time, plus any batches
// imported in the app, plus the user's edits on top. Cards merge by id: a later
// source with the same id replaces the card's text, never its progress.
import { toDevanagari } from './gujarati.js'
import type { AppData, Card } from './types'

const files = import.meta.glob<{ default: Card[] }>(['../../data/*.json', '!../../data/hindi_cognates.json'], {
  eager: true,
})

function fileName(path: string) {
  return path.split('/').pop() ?? path
}

/** Same order as scripts/deck-files.js: sentences.json first, then by name. */
const orderedFiles = Object.entries(files).sort(([a], [b]) => {
  const fa = fileName(a)
  const fb = fileName(b)
  if (fa === 'sentences.json') return -1
  if (fb === 'sentences.json') return 1
  return fa.localeCompare(fb)
})

export const bundledCards: Card[] = orderedFiles.flatMap(([, mod]) => mod.default)
export const bundledIds = new Set(bundledCards.map((c) => c.id))

let cache: { imported: AppData['imported']; edits: AppData['edits']; cards: Card[] } | null = null

/** All cards in study order with imports and edits applied. Memoised on the inputs. */
export function buildDeck(data: AppData): Card[] {
  if (cache && cache.imported === data.imported && cache.edits === data.edits) return cache.cards
  const byId = new Map<string, Card>()
  for (const c of bundledCards) byId.set(c.id, c)
  for (const c of data.imported) byId.set(c.id, c)
  const cards = [...byId.values()].map((c) => {
    const merged = { ...c, ...data.edits[c.id] }
    // Transliteration is always derived from the Gujarati, never stored by hand.
    merged.translit_hi = toDevanagari(merged.gu)
    merged.new_item_translit = toDevanagari(merged.new_item)
    return merged
  })
  cache = { imported: data.imported, edits: data.edits, cards }
  return cards
}

export const UNIT_NAMES: Record<number, string> = {
  1: 'Pronouns + "to be"',
  2: 'Negation & questions',
  3: 'Simple present',
  4: 'Present progressive',
  5: 'Possessives & postpositions',
  6: 'Imperatives',
  7: 'Future',
  8: 'Past (intransitive)',
  9: 'Past (transitive, ergative)',
  10: 'Modals & patterns',
}

export function unitName(unit: number) {
  return UNIT_NAMES[unit] ?? `Unit ${unit}`
}

/** A card as it was before the user's edits (for diffing and "revert"). */
export function originalCard(id: string, data: AppData): Card | undefined {
  const c = data.imported.find((x) => x.id === id) ?? bundledCards.find((x) => x.id === id)
  return c && { ...c, translit_hi: toDevanagari(c.gu), new_item_translit: toDevanagari(c.new_item) }
}

/** Toggle the "wrong" flag; flagging asks for an optional note. Returns the new state. */
export function toggleFlag(id: string, data: AppData, update: (fn: (s: AppData) => Partial<AppData>) => void): boolean {
  if (data.flags[id]) {
    update((s) => {
      const flags = { ...s.flags }
      delete flags[id]
      return { flags }
    })
    return false
  }
  const note = window.prompt('What looks wrong? (optional)\nFlagged cards are skipped in reviews until you unflag them.', '')
  if (note === null) return false
  update((s) => ({ flags: { ...s.flags, [id]: { note: note.trim(), at: Date.now() } } }))
  return true
}
