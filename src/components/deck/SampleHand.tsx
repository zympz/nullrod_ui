import { useState } from 'react'
import type { DeckCard } from '../../types/deck'
import { drawSampleHand } from '../../utils/deckUtils'
import { frontFace } from '../../utils/cardName'
import styles from '../../pages/DeckPage.module.css'

interface SampleHandProps {
  cards: DeckCard[]
  onCardClick: (card: DeckCard) => void
}

export function SampleHand({ cards, onCardClick }: SampleHandProps) {
  const [collapsed, setCollapsed] = useState(true)
  const [hand, setHand] = useState(() => drawSampleHand(cards))

  return (
    <div className={styles.zone}>
      <button type="button" className={`${styles.zoneHeaderBtn} ${styles.zoneHeaderBg}`} onClick={() => setCollapsed(!collapsed)}>
        <span className={styles.collapseIcon}>{collapsed ? '▸' : '▾'}</span>
        <span className={styles.sectionLabel}>Sample Hand</span>
      </button>
      {!collapsed && (
        <div className={styles.sampleHandSection}>
          <button type="button" className={styles.redrawBtn} onClick={() => setHand(drawSampleHand(cards))}>
            ↻ New Hand
          </button>
          <div className={styles.sampleHand}>
            {hand.map((card, i) => (
              <button
                key={`${card.scryfall_id}-${i}`}
                type="button"
                className={styles.sampleCard}
                onClick={() => onCardClick(card)}
                title={card.name}
              >
                {card.image_urls.front ? (
                  <img src={card.image_urls.front} alt={card.name} className={styles.sampleCardImg} />
                ) : (
                  <div className={styles.sampleCardPlaceholder}>{frontFace(card.name)}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
