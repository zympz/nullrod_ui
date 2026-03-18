import type { DeckCard, DeckCardPrices } from '../../types/deck'
import type { SortMode } from '../../utils/deckUtils'
import { cardPrice, sortCards } from '../../utils/deckUtils'
import { frontFace, backFace } from '../../utils/cardName'
import { ManaCost } from '../ManaSymbol'
import styles from '../../pages/DeckPage.module.css'

interface TypeGroupBlockProps {
  group: { label: string; cards: DeckCard[] }
  sortMode: SortMode
  showPrices: boolean
  pricesMap: Map<string, DeckCardPrices>
  onCardClick: (card: DeckCard) => void
  onCardHover: (card: DeckCard | null) => void
  onCardFlip: (card: DeckCard) => void
}

export function TypeGroupBlock({ group, sortMode, showPrices, pricesMap, onCardClick, onCardHover, onCardFlip }: TypeGroupBlockProps) {
  const total = group.cards.reduce((s, c) => s + c.quantity, 0)
  const sorted = sortCards(group.cards, sortMode, pricesMap)
  return (
    <div className={styles.typeGroup}>
      <div className={styles.typeGroupHeader}>
        <span className={styles.typeGroupLabel}>{group.label}</span>
        <span className={styles.typeGroupCount}>({total})</span>
      </div>
      {sorted.map((card) => {
        const mana = card.mana_cost ? frontFace(card.mana_cost) : null
        const isDfc = card.name.includes(' // ')
        const usd = cardPrice(card, pricesMap)
        return (
          <div key={card.scryfall_id} className={styles.mainboardCard} onMouseEnter={() => onCardHover(card)} onMouseLeave={() => onCardHover(null)}>
            <span className={styles.cardQty}>{card.quantity}</span>
            <div className={styles.cardNameCell}>
              <button type="button" className={styles.cardNameLink} onClick={() => onCardClick(card)}>{frontFace(card.name)}</button>
              {isDfc && <button type="button" className={styles.dfcBadge} title={`Flip to ${backFace(card.name)}`} onClick={() => onCardFlip(card)}>↻</button>}
            </div>
            <span className={styles.cardMana}>
              {mana ? (
                <ManaCost cost={mana} size={13} />
              ) : card.cmc > 0 ? (
                <span className={styles.cmcFallback}>{card.cmc}</span>
              ) : null}
            </span>
            {showPrices && (
              <span className={styles.cardPrice}>{usd != null ? `$${parseFloat(usd).toFixed(2)}` : '—'}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
