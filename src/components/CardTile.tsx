import type { OracleCard } from '../types/card'
import styles from './CardTile.module.css'

interface CardTileProps {
  card: OracleCard
  onClick: (card: OracleCard) => void
}

export function CardTile({ card, onClick }: CardTileProps) {
  const imgUrl = card.image_urls.normal ?? card.image_urls.art_crop ?? null

  return (
    <button className={styles.tile} onClick={() => onClick(card)} type="button">
      {imgUrl ? (
        <img src={imgUrl} alt={card.name} className={styles.img} loading="lazy" />
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
    </button>
  )
}
