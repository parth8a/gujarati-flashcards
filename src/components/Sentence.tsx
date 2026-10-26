import { toDevanagari } from '../lib/gujarati.js'
import { highlightParts } from '../lib/highlight'
import type { Card } from '../lib/types'

/** The sentence with its new item highlighted, in Gujarati or Devanagari. */
export default function Sentence({ card, script = 'gu', className }: { card: Card; script?: 'gu' | 'hi'; className?: string }) {
  const parts = highlightParts(card)
  return (
    <p className={className ?? (script === 'gu' ? 'gu sentence' : 'deva translit')} lang={script === 'gu' ? 'gu' : 'hi'}>
      {parts.map((p, i) => {
        const text = script === 'gu' ? p.text : toDevanagari(p.text)
        return p.hit ? <mark key={i}>{text}</mark> : <span key={i}>{text}</span>
      })}
    </p>
  )
}
