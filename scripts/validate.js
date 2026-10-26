// Checks every deck file in data/ (see deck-files.js for the order):
//  1. ids are unique and every required field is present with the right type
//  2. i+1: every token is in new_tokens, appeared in an earlier sentence, or is
//     a Hindi cognate. A token also counts as known when it is a known stem plus
//     a suffix introduced earlier (e.g. "-માં"): રૂમ + માં = રૂમમાં. Stems may be
//     in the oblique -ા form of a known -ું / -ો word (રસોડું → રસોડામાં).
//  3. translit_hi and new_item_translit match the computed Devanagari.
// Exits non-zero on any error. Warnings don't fail the run.
import { toDevanagari, tokenize, isSuffix, suffixForms } from '../src/lib/gujarati.js'
import { deckFiles, readJson, loadCognates, REQUIRED_FIELDS, OPTIONAL_FIELDS } from './deck-files.js'

const MAX_NEW_TOKENS = 2

const errors = []
const warnings = []
const cognates = loadCognates()
const seen = new Set()
const knownSuffixes = new Set()
const ids = new Map()
const perUnit = new Map()
let total = 0

function typeOf(v) {
  return Array.isArray(v) ? 'array' : typeof v
}

function isKnownStem(stem, extra) {
  const variants = [stem]
  if (stem.endsWith('ા')) variants.push(stem.slice(0, -1) + 'ું', stem.slice(0, -1) + 'ો')
  return variants.some((s) => seen.has(s) || cognates.has(s) || extra.has(s))
}

function hasSuffix(token, suffix) {
  return suffixForms(suffix).some((f) => token.length > f.length && token.endsWith(f))
}

function isKnownBySuffix(token, suffixes, extraStems) {
  for (const suf of suffixes) {
    for (const f of suffixForms(suf)) {
      if (token.length > f.length && token.endsWith(f) && isKnownStem(token.slice(0, -f.length), extraStems)) return true
    }
  }
  return false
}

for (const { name, path } of deckFiles()) {
  let cards
  try {
    cards = readJson(path)
  } catch (e) {
    errors.push(`${name}: not valid JSON (${e.message})`)
    continue
  }
  if (!Array.isArray(cards)) {
    errors.push(`${name}: top level must be an array of cards`)
    continue
  }

  cards.forEach((card, i) => {
    const where = `${name} #${i + 1} (${card?.id ?? 'no id'})`
    const err = (msg) => errors.push(`${where}: ${msg}`)
    const warn = (msg) => warnings.push(`${where}: ${msg}`)
    total++

    // 1. Fields and ids
    let fieldsOk = true
    for (const [field, type] of Object.entries(REQUIRED_FIELDS)) {
      if (!(field in card)) {
        err(`missing field "${field}"`)
        fieldsOk = false
      } else if (typeOf(card[field]) !== type) {
        err(`field "${field}" should be ${type}, got ${typeOf(card[field])}`)
        fieldsOk = false
      } else if (type === 'string' && card[field].trim() === '') {
        err(`field "${field}" is empty`)
      }
    }
    for (const [field, type] of Object.entries(OPTIONAL_FIELDS)) {
      if (field in card && typeOf(card[field]) !== type) err(`field "${field}" should be ${type}`)
    }
    if (!fieldsOk) return
    if (ids.has(card.id)) err(`duplicate id, first used in ${ids.get(card.id)}`)
    else ids.set(card.id, name)
    if (!Number.isInteger(card.unit) || card.unit < 1) err(`unit should be a positive integer`)
    perUnit.set(card.unit, (perUnit.get(card.unit) ?? 0) + 1)

    // 3. Transliteration
    const expectGu = toDevanagari(card.gu)
    if (card.translit_hi !== expectGu) err(`translit_hi is "${card.translit_hi}", expected "${expectGu}" (run npm run translit)`)
    const expectItem = toDevanagari(card.new_item)
    if (card.new_item_translit !== expectItem) err(`new_item_translit is "${card.new_item_translit}", expected "${expectItem}" (run npm run translit)`)

    // 2. i+1
    const tokens = tokenize(card.gu)
    const newWords = new Set(card.new_tokens.filter((t) => !isSuffix(t)))
    const newSuffixes = card.new_tokens.filter(isSuffix).map((t) => t.slice(1))
    if (card.new_tokens.length > MAX_NEW_TOKENS) err(`${card.new_tokens.length} new tokens; i+1 allows at most ${MAX_NEW_TOKENS} (one item)`)
    for (const w of newWords) {
      if (!tokens.includes(w)) err(`new token "${w}" does not appear in the sentence`)
      else if (seen.has(w)) warn(`new token "${w}" already appeared in an earlier sentence`)
    }
    for (const s of newSuffixes) {
      if (!tokens.some((t) => hasSuffix(t, s))) err(`new suffix "-${s}" is not attached to any word in the sentence`)
    }
    const suffixes = [...knownSuffixes, ...newSuffixes]
    for (const t of tokens) {
      const known = seen.has(t) || cognates.has(t) || newWords.has(t) || isKnownBySuffix(t, suffixes, newWords)
      if (!known) err(`token "${t}" is not new_tokens, not in an earlier sentence, and not a cognate`)
    }
    tokens.forEach((t) => seen.add(t))
    newSuffixes.forEach((s) => knownSuffixes.add(s))
  })
}

for (const w of warnings) console.warn(`warn  ${w}`)
for (const e of errors) console.error(`ERROR ${e}`)
const units = [...perUnit.entries()].sort((a, b) => a[0] - b[0]).map(([u, n]) => `u${u}:${n}`).join(' ')
console.log(`\n${total} cards checked (${units})`)
console.log(`${errors.length} error(s), ${warnings.length} warning(s)`)
process.exit(errors.length ? 1 : 0)
