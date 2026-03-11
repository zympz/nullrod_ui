import { useEffect, useState } from 'react'
import type { OracleCard } from '../types/card'
import { getArtwork } from '../api/client'
import { ManaCost } from './ManaSymbol'
import styles from './CardTile.module.css'

interface CardTileProps {
  card: OracleCard
  onClick: (card: OracleCard) => void
}

export function CardTile({ card, onClick }: CardTileProps) {
  const [artUrl, setArtUrl] = useState<string | null>(null)
  const [artLoaded, setArtLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    getArtwork(card.canonical_scryfall_id)
      .then((res) => {
        if (!cancelled) {
          setArtUrl(res.urls.art_crop ?? res.urls.small ?? null)
          setArtLoaded(true)
        }
      })
      .catch(() => { if (!cancelled) setArtLoaded(true) })
    return () => { cancelled = true }
  }, [card.canonical_scryfall_id])

  return (
    <button className={styles.tile} onClick={() => onClick(card)} type="button">
      <div className={styles.art}>
        {artUrl ? (
          <img src={artUrl} alt={card.name} className={styles.img} loading="lazy" />
        ) : artLoaded ? (
          <div className={styles.artMissing}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={styles.artMissingIcon}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <span>No image</span>
          </div>
        ) : (
          <div className={styles.artSkeleton} />
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
