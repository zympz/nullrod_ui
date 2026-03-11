import { useEffect, useState } from 'react'
import type { OracleCard } from '../types/card'
import { getArtwork } from '../api/client'
import { ManaCost } from './ManaSymbol'
import { ColorPips } from './ColorPips'
import styles from './CardTile.module.css'

interface CardTileProps {
  card: OracleCard
  onClick: (card: OracleCard) => void
}

export function CardTile({ card, onClick }: CardTileProps) {
  const [artUrl, setArtUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getArtwork(card.canonical_scryfall_id)
      .then((res) => {
        if (!cancelled) setArtUrl(res.urls.art_crop ?? res.urls.small ?? null)
      })
      .catch(() => {/* no art available */})
    return () => { cancelled = true }
  }, [card.canonical_scryfall_id])

  return (
    <button className={styles.tile} onClick={() => onClick(card)} type="button">
      <div className={styles.art}>
        {artUrl ? (
          <img src={artUrl} alt={card.name} className={styles.img} loading="lazy" />
        ) : (
          <div className={styles.artPlaceholder}>
            <ColorPips colors={card.colors} size={16} />
          </div>
        )}
      </div>
      <div className={styles.info}>
        <div className={styles.nameRow}>
          <span className={styles.name}>{card.name}</span>
          {card.mana_cost && <ManaCost cost={card.mana_cost} size={14} />}
        </div>
        <div className={styles.type}>{card.type_line}</div>
      </div>
    </button>
  )
}
