import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Deck, DeckCard } from '../types/deck'
import { getDeck } from '../api/client'
import { ManaCost } from '../components/ManaSymbol'
import styles from './DeckPage.module.css'

export function DeckPage() {
  const { deckId } = useParams<{ deckId: string }>()
  const navigate = useNavigate()
  const [deck, setDeck] = useState<Deck | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!deckId) return
    let cancelled = false
    setDeck(null)
    setError(null)

    getDeck(deckId)
      .then((d) => { if (!cancelled) setDeck(d) })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load deck')
      })
    return () => { cancelled = true }
  }, [deckId])

  if (error) {
    return (
      <div className={styles.page}>
        <button className={styles.back} onClick={() => navigate('/decks')} type="button">&larr; Back to decks</button>
        <div className={styles.error}>{error}</div>
      </div>
    )
  }

  if (!deck) {
    return (
      <div className={styles.page}>
        <button className={styles.back} onClick={() => navigate('/decks')} type="button">&larr; Back to decks</button>
        <div className={styles.loading}>Loading deck&hellip;</div>
      </div>
    )
  }

  const curveEntries = Object.entries(deck.cmc_curve)
    .map(([cmc, count]) => ({ cmc: Number(cmc), count }))
    .sort((a, b) => a.cmc - b.cmc)
  const maxCount = Math.max(...curveEntries.map((e) => e.count), 1)

  return (
    <div className={styles.page}>
      <button className={styles.back} onClick={() => navigate('/decks')} type="button">&larr; Back to decks</button>

      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.name}>{deck.name}</h1>
          <div className={styles.badges}>
            <span className={styles.formatBadge}>{deck.format}</span>
            <span className={styles.cardCount}>{deck.card_count} cards</span>
          </div>
        </div>
        {deck.description && <p className={styles.description}>{deck.description}</p>}
        {deck.source_url && (
          <p className={styles.source}>
            Imported from <a href={deck.source_url} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>{deck.source ?? 'external source'}</a>
          </p>
        )}
      </div>

      {/* CMC Curve */}
      {curveEntries.length > 0 && (
        <div className={styles.curveSection}>
          <div className={styles.sectionLabel}>Mana Curve</div>
          <div className={styles.curve}>
            {curveEntries.map(({ cmc, count }) => (
              <div key={cmc} className={styles.curveBar}>
                <span className={styles.curveCount}>{count}</span>
                <div
                  className={styles.curveBarFill}
                  style={{ height: `${(count / maxCount) * 60}px` }}
                />
                <span className={styles.curveCmc}>{cmc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Card zones */}
      <div className={styles.zones}>
        <CardZone title="Commanders" cards={deck.commanders} />
        {deck.companions.length > 0 && <CardZone title="Companion" cards={deck.companions} />}
        <CardZone title="Mainboard" cards={deck.mainboard} />
        {deck.sideboard.length > 0 && <CardZone title="Sideboard" cards={deck.sideboard} />}
        {deck.maybeboard.length > 0 && <CardZone title="Maybeboard" cards={deck.maybeboard} />}
      </div>
    </div>
  )
}

function CardZone({ title, cards }: { title: string; cards: DeckCard[] }) {
  if (cards.length === 0) return null

  const totalCards = cards.reduce((sum, c) => sum + c.quantity, 0)

  return (
    <div className={styles.zone}>
      <div className={styles.zoneHeader}>
        <span className={styles.sectionLabel}>{title}</span>
        <span className={styles.zoneCount}>({totalCards})</span>
      </div>
      <div className={styles.cardTable}>
        {cards.map((card) => (
          <div key={card.scryfall_id} className={styles.cardRow}>
            <span className={styles.cardQty}>{card.quantity}</span>
            <span className={styles.cardName}>{card.name}</span>
            <span className={styles.cardType}>{card.type_line}</span>
            <span className={styles.cardMana}>
              {card.mana_cost && <ManaCost cost={card.mana_cost} size={14} />}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
