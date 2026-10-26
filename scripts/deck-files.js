import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
export const DATA_DIR = join(ROOT, 'data')
export const COGNATES_FILE = 'hindi_cognates.json'

export const REQUIRED_FIELDS = {
  id: 'string',
  unit: 'number',
  gu: 'string',
  translit_hi: 'string',
  en: 'string',
  hi: 'string',
  new_item: 'string',
  new_item_translit: 'string',
  new_item_meaning: 'string',
  new_tokens: 'array',
  grammar_note: 'string',
  needs_review: 'boolean',
}
export const OPTIONAL_FIELDS = { new_item_form: 'string' }

/**
 * Deck files in study order: sentences.json first, then every other
 * data/*.json (except the cognates list) sorted by name. The app uses the
 * same order (see src/lib/deck.ts).
 */
export function deckFiles() {
  const names = readdirSync(DATA_DIR)
    .filter((f) => f.endsWith('.json') && f !== COGNATES_FILE)
    .sort((a, b) => (a === 'sentences.json' ? -1 : b === 'sentences.json' ? 1 : a.localeCompare(b)))
  return names.map((name) => ({ name, path: join(DATA_DIR, name) }))
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

/** Flatten every array in hindi_cognates.json into one Set. */
export function loadCognates() {
  const raw = readJson(join(DATA_DIR, COGNATES_FILE))
  const words = new Set()
  for (const value of Object.values(raw)) {
    if (Array.isArray(value)) value.forEach((w) => words.add(w))
  }
  return words
}
