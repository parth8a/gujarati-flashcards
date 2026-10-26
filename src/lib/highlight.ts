import { isSuffix, suffixForms } from './gujarati.js'
import type { Card } from './types'

export interface Part {
  text: string
  hit: boolean
}

// Characters that sit at the edge of a word but aren't part of it.
const PUNCT = /[.,?!;:"'()[\]“”‘’।॥…—–-]/u

/**
 * Split the Gujarati sentence into parts, marking the card's new item.
 * Whole-word new_tokens mark the word; suffix tokens ("-માં") mark the ending.
 * Cards without new_tokens fall back to the words of new_item.
 */
export function highlightParts(card: Pick<Card, 'gu' | 'new_tokens' | 'new_item'>): Part[] {
  const terms = card.new_tokens.length
    ? card.new_tokens
    : card.new_item.split(/[\s…]+/u).filter((t) => t && !t.startsWith('('))
  const words = new Set(terms.filter((t) => !isSuffix(t)))
  const suffixes = terms.filter(isSuffix).flatMap((t) => suffixForms(t.slice(1)))

  const parts: Part[] = []
  const push = (text: string, hit: boolean) => {
    if (!text) return
    const last = parts[parts.length - 1]
    if (last && last.hit === hit) last.text += text
    else parts.push({ text, hit })
  }

  for (const chunk of card.gu.split(/(\s+)/u)) {
    if (!chunk || /^\s+$/u.test(chunk)) {
      push(chunk, false)
      continue
    }
    // Peel punctuation off both ends.
    let start = 0
    let end = chunk.length
    while (start < end && PUNCT.test(chunk[start])) start++
    while (end > start && PUNCT.test(chunk[end - 1])) end--
    const word = chunk.slice(start, end)
    push(chunk.slice(0, start), false)
    if (words.has(word)) {
      push(word, true)
    } else {
      const suf = suffixes.find((s) => word.length > s.length && word.endsWith(s))
      if (suf && !/^\p{M}/u.test(suf)) {
        push(word.slice(0, -suf.length), false)
        push(suf, true)
      } else if (suf) {
        // A vowel-sign suffix can't be styled on its own without breaking the glyph.
        push(word, true)
      } else {
        push(word, false)
      }
    }
    push(chunk.slice(end), false)
  }
  return parts
}
