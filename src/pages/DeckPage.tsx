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
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const imageCache = useState(() => new Map<string, string>())[0]
  const cardCache = useState(() => new Map<string, OracleCard>())[0]

  const onCardHover = useCallback((card: DeckCard | null) => {
    if (!card) return
    const url = imageCache.get(card.name)
    if (url) setHoveredImageUrl(url)
  }, [imageCache])

  const onCardClick = useCallback((cardName: string) => {
    const cached = cardCache.get(cardName)
    if (cached) { setSelectedCard(cached); return }
    // Fallback fetch if not yet preloaded
    searchCardByName(frontFace(cardName))
      .then((res) => {
        const card = res.results.find((c) => c.name === cardName || c.name.startsWith(frontFace(cardName) + ' // '))
          ?? res.results.find((c) => c.name === frontFace(cardName))
          ?? res.results[0]
        if (card) { cardCache.set(cardName, card); setSelectedCard(card) }
      })
      .catch(() => {})
  }, [cardCache])

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

  // Fetch featured card (banner + preview) immediately
  useEffect(() => {
    if (!deck) return
    let cancelled = false
    const featuredCard = deck.commanders[0] ?? deck.mainboard[0]
    if (!featuredCard) return
    searchCardByName(frontFace(featuredCard.name))
      .then((res) => {
        if (cancelled) return
        const match = res.results.find((c) => c.name === featuredCard.name || c.name.startsWith(frontFace(featuredCard.name) + ' // '))
          ?? res.results.find((c) => c.name === frontFace(featuredCard.name))
          ?? res.results[0]
        if (!match) return
        cardCache.set(featuredCard.name, match)
        const artCrop = match.image_urls?.art_crop
        if (artCrop) setBannerUrl(artCrop)
        const url = match.image_urls?.normal ?? artCrop ?? null
        if (url) { imageCache.set(featuredCard.name, url); setHoveredImageUrl(url) }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [deck, imageCache, cardCache])

  // Background preload: cache remaining card data, images, and DFC mana costs
  useEffect(() => {
    if (!deck) return
    let cancelled = false

    const allCards = [...deck.commanders, ...deck.companions, ...deck.mainboard, ...deck.sideboard, ...deck.maybeboard]
    const seen = new Set<string>()
    const uniqueCards: DeckCard[] = []
    for (const c of allCards) {
      const key = frontFace(c.name)
      if (!seen.has(key)) { seen.add(key); uniqueCards.push(c) }
    }

    const dfcMana = new Map<string, string>()

    function cacheCard(card: DeckCard) {
      if (imageCache.has(card.name)) return Promise.resolve()
      return searchCardByName(frontFace(card.name))
        .then((res) => {
          if (cancelled) return
          const match = res.results.find((c) => c.name === card.name || c.name.startsWith(frontFace(card.name) + ' // '))
            ?? res.results.find((c) => c.name === frontFace(card.name))
            ?? res.results[0]
          if (!match) return
          cardCache.set(card.name, match)
          const url = match.image_urls?.normal ?? match.image_urls?.art_crop ?? null
          if (url) imageCache.set(card.name, url)
          if (card.name.includes(' // ') && !card.mana_cost && match.card_faces?.[0]?.mana_cost) {
            dfcMana.set(frontFace(card.name), match.card_faces[0].mana_cost)
          }
        })
        .catch(() => {})
    }

    // Fire all in parallel — browser naturally limits concurrent requests
    Promise.all(uniqueCards.map(cacheCard)).then(() => {
      if (!cancelled && dfcMana.size > 0) setDfcManaCosts(dfcMana)
    })

    return () => { cancelled = true }
  }, [deck, imageCache, cardCache])

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
      {/* Full-width banner */}
      <div className={styles.banner} style={bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : undefined}>
        <div className={styles.bannerOverlay}>
          <button className={styles.bannerBack} onClick={() => navigate('/decks')} type="button">&larr; Back to decks</button>
          <h1 className={styles.bannerName}>{deck.name}</h1>
          <div className={styles.bannerMeta}>
            <span className={styles.formatBadge}>{deck.format}</span>
            <span className={styles.cardCount}>{deck.card_count} cards</span>
            {deck.source_url && (
              <span className={styles.bannerSource}>
                Imported from <a href={deck.source_url} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>{deck.source ?? 'external source'}</a>
              </span>
            )}
          </div>
          {deck.description && <p className={styles.bannerDescription}>{deck.description}</p>}
        </div>
      </div>

      <div className={styles.deckLayout}>
        <div className={styles.previewPanel}>
          {hoveredImageUrl ? (
            <img src={hoveredImageUrl} alt="Card preview" className={styles.previewImage} />
          ) : (
            <div className={styles.previewEmpty}>Hover a card to preview</div>
          )}
        </div>

        <div className={styles.deckContent}>

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
