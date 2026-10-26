import Sentence from './Sentence'
import type { Card } from '../lib/types'

/** The back of a card. */
export default function CardDetails({ card }: { card: Card }) {
  return (
    <div className="details">
      <Sentence card={card} script="hi" />
      <section className="new-item">
        <div className="new-item-head">
          <span className="gu new-item-gu" lang="gu">
            {card.new_item}
          </span>
          <span className="deva new-item-deva" lang="hi">
            {card.new_item_translit}
          </span>
        </div>
        <p className="meaning">{card.new_item_meaning}</p>
        {card.new_item_form && <p className="form">{card.new_item_form}</p>}
      </section>
      <dl className="translations">
        <dt>English</dt>
        <dd>{card.en}</dd>
        <dt>हिंदी</dt>
        <dd className="deva" lang="hi">
          {card.hi}
        </dd>
      </dl>
      <p className="note">
        <span aria-hidden>💡 </span>
        {card.grammar_note}
      </p>
    </div>
  )
}
