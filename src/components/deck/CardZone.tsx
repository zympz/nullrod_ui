import { useState } from 'react'
import type { DeckCard } from '../../types/deck'
import type { SortMode } from '../../utils/deckUtils'
import { groupByType } from '../../utils/deckUtils'
import { TypeGroupBlock } from './TypeGroupBlock'
import styles from '../../pages/DeckPage.module.css'

interface CardZoneProps {
  title: string
  cards: DeckCard[]
  sortMode: SortMode
  showPrices: boolean
  onCardClick: (card: DeckCard) => void
  onCardHover: (card: DeckCard | null) => void
  onCardFlip: (card: DeckCard) => void
  defaultCollapsed?: boolean
}

export function CardZone({ title, cards, sortMode, showPrices, onCardClick, onCardHover, onCardFlip, defaultCollapsed = false }: CardZoneProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  if (cards.length === 0) return null

  const groups = groupByType(cards)
  const totalCards = cards.reduce((sum, c) => sum + c.quantity, 0)
  const cols = Math.min(4, Math.max(1, Math.ceil(cards.length / 8)))

  return (
    <div className={styles.zone}>
      <button type="button" className={`${styles.zoneHeaderBtn} ${styles.zoneHeaderBg}`} onClick={() => setCollapsed(!collapsed)}>
        <span className={styles.collapseIcon}>{collapsed ? '▸' : '▾'}</span>
        <span className={styles.sectionLabel}>{title}</span>
        <span className={styles.zoneCount}>({totalCards})</span>
      </button>
      {!collapsed && (
        <div className={styles.zoneFlow} style={{ columnCount: cols }}>
          {groups.map((group) => (
            <TypeGroupBlock key={group.label} group={group} sortMode={sortMode} showPrices={showPrices} onCardClick={onCardClick} onCardHover={onCardHover} onCardFlip={onCardFlip} />
          ))}
        </div>
      )}
    </div>
  )
}
