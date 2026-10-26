// Shared by the app (src/) and the Node scripts (scripts/), so it is plain JS.

const GU_START = 0x0a80
const GU_END = 0x0aff
// The Gujarati block (U+0A80–U+0AFF) mirrors Devanagari (U+0900–U+097F).
const GU_TO_DEVANAGARI = 0x180

/** Convert Gujarati script to Devanagari, character by character. */
export function toDevanagari(text) {
  let out = ''
  for (const ch of text) {
    const cp = ch.codePointAt(0)
    out += cp >= GU_START && cp <= GU_END ? String.fromCodePoint(cp - GU_TO_DEVANAGARI) : ch
  }
  return out
}

const EDGE_PUNCT = /^[\s.,?!;:"'()[\]“”‘’।॥…—–-]+|[\s.,?!;:"'()[\]“”‘’।॥…—–-]+$/gu

/** Split a sentence into word tokens with surrounding punctuation removed. */
export function tokenize(text) {
  return text
    .split(/\s+/u)
    .map((w) => w.replace(EDGE_PUNCT, ''))
    .filter(Boolean)
}

/** A new_tokens entry like "-માં" marks a suffix rather than a whole word. */
export function isSuffix(token) {
  return token.startsWith('-') && token.length > 1
}

// Independent vowel → vowel sign (matra). A suffix that starts with a vowel is
// written with the vowel sign after a consonant: ઓફિસ + એ = ઓફિસે.
const VOWEL_SIGNS = { 'આ': 'ા', 'ઇ': 'િ', 'ઈ': 'ી', 'ઉ': 'ુ', 'ઊ': 'ૂ', 'એ': 'ે', 'ઐ': 'ૈ', 'ઓ': 'ો', 'ઔ': 'ૌ' }

/** The spellings a suffix (without its leading "-") can take at the end of a word. */
export function suffixForms(suffix) {
  const sign = VOWEL_SIGNS[suffix[0]]
  return sign ? [suffix, sign + suffix.slice(1)] : [suffix]
}
