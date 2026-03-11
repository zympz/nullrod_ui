import type { OracleCard } from '../types/card'
import { ManaCost } from './ManaSymbol'
import styles from './CardTile.module.css'

interface CardTileProps {
  card: OracleCard
  onClick: (card: OracleCard) => void
}

export function CardTile({ card, onClick }: CardTileProps) {
  const artUrl = card.image_urls.art_crop ?? card.image_urls.normal ?? null

  return (
    <button className={styles.tile} onClick={() => onClick(card)} type="button">
      <div className={styles.art}>
        {artUrl ? (
          <img src={artUrl} alt={card.name} className={styles.img} loading="lazy" />
        ) : (
          <div className={styles.artMissing}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={styles.artMissingIcon}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <span>No image</span>
          </div>
        )}
      </div>
      <div className={styles.info}>
        {card.mana_cost && <ManaCost cost={card.mana_cost} size={14} />}
        <div className={styles.name}>{card.name}</div>
        <div className={styles.type}>{card.type_line}</div>
      </div>
    </button>
  )
}
