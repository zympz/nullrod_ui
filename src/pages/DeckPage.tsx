import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Deck, DeckCard } from '../types/deck'
import type { OracleCard } from '../types/card'
import { getDeck, searchCardByName } from '../api/client'
import { ManaCost } from '../components/ManaSymbol'
import { CardDetail } from '../components/CardDetail'
import styles from './DeckPage.module.css'

export function DeckPage() {
  const { deckId } = useParams<{ deckId: string }>()
  const navigate = useNavigate()
  const [deck, setDeck] = useState<Deck | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dfcManaCosts, setDfcManaCosts] = useState<Map<string, string>>(new Map())
  const [selectedCard, setSelectedCard] = useState<OracleCard | null>(null)
  const [hoveredImageUrl, setHoveredImageUrl] = useState<string | null>(null)
  const imageCache = useState(() => new Map<string, string>())[0]

  const fetchCardImage = useCallback((card: DeckCard) => {
    const cached = imageCache.get(card.name)
    if (cached) { setHoveredImageUrl(cached); return }
    searchCardByName(frontFace(card.name))
      .then((res) => {
        const match = res.results.find((c) => c.name === card.name || c.name.startsWith(frontFace(card.name) + ' // '))
          ?? res.results.find((c) => c.name === frontFace(card.name))
          ?? res.results[0]
        const url = match?.image_urls?.normal ?? match?.image_urls?.art_crop ?? null
        if (url) {
          imageCache.set(card.name, url)
          setHoveredImageUrl(url)
        }
      })
      .catch(() => {})
  }, [imageCache])

  const onCardHover = useCallback((card: DeckCard | null) => {
    if (!card) {
      // Revert to commander image if available
      if (deck?.commanders[0]) {
        const cached = imageCache.get(deck.commanders[0].name)
        setHoveredImageUrl(cached ?? null)
      } else {
        setHoveredImageUrl(null)
      }
      return
    }
    fetchCardImage(card)
  }, [deck, imageCache, fetchCardImage])

  const onCardClick = useCallback((cardName: string) => {
    searchCardByName(frontFace(cardName))
      .then((res) => {
        // Prefer exact match (DFC or single-faced)
        const card = res.results.find((c) => c.name === cardName || c.name.startsWith(frontFace(cardName) + ' // '))
          ?? res.results.find((c) => c.name === frontFace(cardName))
          ?? res.results[0]
        if (card) setSelectedCard(card)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!deckId) return
    let cancelled = false
    setDeck(null)
    setError(null)
    setDfcManaCosts(new Map())

    getDeck(deckId)
      .then((d) => { if (!cancelled) setDeck(d) })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load deck')
      })
    return () => { cancelled = true }
  }, [deckId])

  // Show commander image by default
  useEffect(() => {
    if (!deck || deck.commanders.length === 0) return
    fetchCardImage(deck.commanders[0])
  }, [deck, fetchCardImage])

  // Fetch mana costs for DFC cards (decks API returns null for these)
  useEffect(() => {
    if (!deck) return
    let cancelled = false

    const allCards = [...deck.commanders, ...deck.companions, ...deck.mainboard, ...deck.sideboard, ...deck.maybeboard]
    const dfcCards = allCards.filter((c) => c.name.includes(' // ') && !c.mana_cost)
    if (dfcCards.length === 0) return

    // Deduplicate by front face name
    const uniqueNames = [...new Set(dfcCards.map((c) => frontFace(c.name)))]

    Promise.all(
      uniqueNames.map((name) =>
        searchCardByName(name)
          .then((res) => {
            // Find the DFC card whose front face matches
            const card = res.results.find((c) => c.name.startsWith(name + ' // '))
            if (!card?.card_faces?.[0]?.mana_cost) return null
            return [name, card.card_faces[0].mana_cost] as const
          })
          .catch(() => null)
      )
    ).then((results) => {
      if (cancelled) return
      const map = new Map<string, string>()
      for (const r of results) {
        if (r) map.set(r[0], r[1])
      }
      setDfcManaCosts(map)
    })

    return () => { cancelled = true }
  }, [deck])

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

      <div className={styles.deckLayout}>
        <div className={styles.previewPanel}>
          {hoveredImageUrl ? (
            <img src={hoveredImageUrl} alt="Card preview" className={styles.previewImage} />
          ) : (
            <div className={styles.previewEmpty}>Hover a card to preview</div>
          )}
        </div>

        <div className={styles.deckContent}>
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

      {/* Mainboard grouped by type */}
      {(deck.commanders.length > 0 || deck.mainboard.length > 0) && (
        <div className={styles.zone}>
          <div className={styles.zoneHeader}>
            <span className={styles.sectionLabel}>Mainboard</span>
            <span className={styles.zoneCount}>
              ({deck.commanders.reduce((s, c) => s + c.quantity, 0) + deck.mainboard.reduce((s, c) => s + c.quantity, 0)})
            </span>
          </div>
          <MainboardGrid commanders={deck.commanders} cards={deck.mainboard} isCommander={deck.format === 'commander' || deck.format === 'brawl' || deck.format === 'oathbreaker' || deck.format === 'duel'} dfcManaCosts={dfcManaCosts} onCardClick={onCardClick} onCardHover={onCardHover} />
        </div>
      )}

      {/* Other zones */}
      <div className={styles.zones}>
        {deck.companions.length > 0 && <CardZone title="Companion" cards={deck.companions} dfcManaCosts={dfcManaCosts} onCardClick={onCardClick} onCardHover={onCardHover} />}
        {deck.sideboard.length > 0 && <CardZone title="Sideboard" cards={deck.sideboard} dfcManaCosts={dfcManaCosts} onCardClick={onCardClick} onCardHover={onCardHover} />}
        {deck.maybeboard.length > 0 && <CardZone title="Maybeboard" cards={deck.maybeboard} dfcManaCosts={dfcManaCosts} onCardClick={onCardClick} onCardHover={onCardHover} />}
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
                  style={{ height: `${(count / maxCount) * 30}px` }}
                />
                <span className={styles.curveCmc}>{cmc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

        </div>
      </div>

      {selectedCard && <CardDetail card={selectedCard} onClose={() => setSelectedCard(null)} />}
    </div>
  )
}

function frontFace(value: string) {
  const idx = value.indexOf(' // ')
  return idx === -1 ? value : value.slice(0, idx)
}

const TYPE_GROUPS = [
  { label: 'Commander', match: (_: DeckCard) => false as boolean }, // placeholder, filled by commanders prop
  { label: 'Planeswalkers', match: (c: DeckCard) => c.type_line.includes('Planeswalker') },
  { label: 'Creatures', match: (c: DeckCard) => c.type_line.includes('Creature') },
  { label: 'Sorceries', match: (c: DeckCard) => c.type_line.includes('Sorcery') },
  { label: 'Instants', match: (c: DeckCard) => c.type_line.includes('Instant') },
  { label: 'Artifacts', match: (c: DeckCard) => c.type_line.includes('Artifact') && !c.type_line.includes('Creature') },
  { label: 'Enchantments', match: (c: DeckCard) => c.type_line.includes('Enchantment') && !c.type_line.includes('Creature') },
  { label: 'Lands', match: (c: DeckCard) => c.type_line.includes('Land') },
] as const

function groupMainboard(commanders: DeckCard[], cards: DeckCard[]) {
  const groups: { label: string; cards: DeckCard[] }[] = []
  const used = new Set<number>()

  // Commanders first
  if (commanders.length > 0) {
    groups.push({ label: 'Commander', cards: commanders })
  }

  // Categorize mainboard cards
  for (const group of TYPE_GROUPS) {
    if (group.label === 'Commander') continue
    const matched: DeckCard[] = []
    cards.forEach((card, idx) => {
      if (!used.has(idx) && group.match(card)) {
        matched.push(card)
        used.add(idx)
      }
    })
    if (matched.length > 0) {
      groups.push({ label: group.label, cards: matched })
    }
  }

  // Anything uncategorized
  const other = cards.filter((_, idx) => !used.has(idx))
  if (other.length > 0) {
    groups.push({ label: 'Other', cards: other })
  }

  return groups
}

function resolveMana(card: DeckCard, dfcManaCosts: Map<string, string>): string | null {
  if (card.mana_cost) return frontFace(card.mana_cost)
  const dfcCost = dfcManaCosts.get(frontFace(card.name))
  if (dfcCost) return dfcCost
  return null
}

function TypeGroupBlock({ group, dfcManaCosts, onCardClick, onCardHover }: { group: { label: string; cards: DeckCard[] }; dfcManaCosts: Map<string, string>; onCardClick: (name: string) => void; onCardHover: (card: DeckCard | null) => void }) {
  const total = group.cards.reduce((s, c) => s + c.quantity, 0)
  return (
    <div className={styles.typeGroup}>
      <div className={styles.typeGroupHeader}>
        <span className={styles.typeGroupLabel}>{group.label}</span>
        <span className={styles.typeGroupCount}>({total})</span>
      </div>
      {group.cards.map((card) => {
        const mana = resolveMana(card, dfcManaCosts)
        return (
          <div key={card.scryfall_id} className={styles.mainboardCard} onMouseEnter={() => onCardHover(card)} onMouseLeave={() => onCardHover(null)}>
            <span className={styles.cardQty}>{card.quantity}</span>
            <button type="button" className={styles.cardNameLink} onClick={() => onCardClick(card.name)}>{frontFace(card.name)}</button>
            <span className={styles.cardMana}>
              {mana ? (
                <ManaCost cost={mana} size={13} />
              ) : card.cmc > 0 ? (
                <span className={styles.cmcFallback}>{card.cmc}</span>
              ) : null}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function MainboardGrid({ commanders, cards, isCommander, dfcManaCosts, onCardClick, onCardHover }: { commanders: DeckCard[]; cards: DeckCard[]; isCommander: boolean; dfcManaCosts: Map<string, string>; onCardClick: (name: string) => void; onCardHover: (card: DeckCard | null) => void }) {
  const groups = groupMainboard(commanders, cards)
  const lands = groups.find((g) => g.label === 'Lands')
  const nonLands = groups.filter((g) => g.label !== 'Lands')

  // Commander decks: 3 flowing columns for spells + dedicated 4th column for lands
  if (isCommander && lands) {
    return (
      <div className={styles.mainboardSplit}>
        <div className={styles.mainboardFlow}>
          {nonLands.map((group) => (
            <TypeGroupBlock key={group.label} group={group} dfcManaCosts={dfcManaCosts} onCardClick={onCardClick} onCardHover={onCardHover} />
          ))}
        </div>
        <div className={styles.mainboardLands}>
          <TypeGroupBlock group={lands} dfcManaCosts={dfcManaCosts} onCardClick={onCardClick} onCardHover={onCardHover} />
        </div>
      </div>
    )
  }

  // Non-commander: all groups flow naturally in 4 columns
  return (
    <div className={styles.mainboardFlowFull}>
      {groups.map((group) => (
        <TypeGroupBlock key={group.label} group={group} dfcManaCosts={dfcManaCosts} onCardClick={onCardClick} onCardHover={onCardHover} />
      ))}
    </div>
  )
}

function CardZone({ title, cards, dfcManaCosts, onCardClick, onCardHover }: { title: string; cards: DeckCard[]; dfcManaCosts: Map<string, string>; onCardClick: (name: string) => void; onCardHover: (card: DeckCard | null) => void }) {
  if (cards.length === 0) return null

  const totalCards = cards.reduce((sum, c) => sum + c.quantity, 0)

  return (
    <div className={styles.zone}>
      <div className={styles.zoneHeader}>
        <span className={styles.sectionLabel}>{title}</span>
        <span className={styles.zoneCount}>({totalCards})</span>
      </div>
      <div className={styles.cardTable}>
        {cards.map((card) => {
          const mana = resolveMana(card, dfcManaCosts)
          return (
            <div key={card.scryfall_id} className={styles.cardRow} onMouseEnter={() => onCardHover(card)} onMouseLeave={() => onCardHover(null)}>
              <span className={styles.cardQty}>{card.quantity}</span>
              <button type="button" className={styles.cardNameLink} onClick={() => onCardClick(card.name)}>{frontFace(card.name)}</button>
              <span className={styles.cardType}>{card.type_line}</span>
              <span className={styles.cardMana}>
                {mana ? (
                  <ManaCost cost={mana} size={14} />
                ) : card.cmc > 0 ? (
                  <span className={styles.cmcFallback}>{card.cmc}</span>
                ) : null}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
