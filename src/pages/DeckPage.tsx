import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { Deck, DeckCard, DeckFormat } from '../types/deck'
import type { OracleCard } from '../types/card'
import { getDeck, searchCardByName } from '../api/client'
import { ManaCost } from '../components/ManaSymbol'
import { CardDetail } from '../components/CardDetail'
import styles from './DeckPage.module.css'

type SortMode = 'cmc' | 'name' | 'price'

export function DeckPage() {
  const { deckId } = useParams<{ deckId: string }>()
  const [deck, setDeck] = useState<Deck | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedCard, setSelectedCard] = useState<OracleCard | null>(null)
  const [hoveredImageUrl, setHoveredImageUrl] = useState<string | null>(null)
  const [hoveredCard, setHoveredCard] = useState<DeckCard | null>(null)
  const [previewFace, setPreviewFace] = useState(0)
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>('cmc')
  const cardCache = useRef(new Map<string, OracleCard>()).current

  const onCardHover = useCallback((card: DeckCard | null) => {
    if (!card) return
    setHoveredCard(card)
    setPreviewFace(0)
    setHoveredImageUrl(card.image_url ?? null)
  }, [])

  const onCardClick = useCallback((cardName: string) => {
    const cached = cardCache.get(cardName)
    if (cached) { setSelectedCard(cached); return }
    searchCardByName(frontFace(cardName))
      .then((res) => {
        const card = pickOracleCard(cardName, res.results)
        if (card) { cardCache.set(cardName, card); setSelectedCard(card) }
      })
      .catch(() => {})
  }, [cardCache])

  const onCardFlip = useCallback((card: DeckCard) => {
    setHoveredCard(card)
    setPreviewFace(1)
    const cached = cardCache.get(card.name)
    if (cached) {
      setHoveredImageUrl(cached.image_urls.back_normal ?? cached.image_urls.back_art_crop ?? cached.image_urls.normal ?? card.image_url ?? null)
      return
    }
    setHoveredImageUrl(card.image_url ?? null)
    const targetName = card.name
    searchCardByName(frontFace(card.name))
      .then((res) => {
        const match = pickOracleCard(targetName, res.results)
        if (match) {
          cardCache.set(targetName, match)
          setHoveredImageUrl(match.image_urls.back_normal ?? match.image_urls.back_art_crop ?? match.image_urls.normal ?? card.image_url ?? null)
        }
      })
      .catch(() => {})
  }, [cardCache])

  useEffect(() => {
    cardCache.clear()
  }, [deckId, cardCache])

  useEffect(() => {
    if (!deckId) return
    let cancelled = false
    setDeck(null)
    setError(null)

    getDeck(deckId)
      .then((d) => {
        if (cancelled) return
        setDeck(d)
        // Set default preview from featured card
        const featured = d.commanders[0] ?? d.mainboard[0]
        if (featured?.image_url) setHoveredImageUrl(featured.image_url)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load deck')
      })
    return () => { cancelled = true }
  }, [deckId])

  // Fetch featured card art_crop for banner
  useEffect(() => {
    if (!deck) return
    let cancelled = false
    const featuredCard = deck.commanders[0] ?? deck.mainboard[0]
    if (!featuredCard) return
    searchCardByName(frontFace(featuredCard.name))
      .then((res) => {
        if (cancelled) return
        const match = pickOracleCard(featuredCard.name, res.results)
        if (!match) return
        cardCache.set(featuredCard.name, match)
        const artCrop = match.image_urls?.art_crop
        if (artCrop) setBannerUrl(artCrop)
        setHoveredImageUrl(match.image_urls.normal ?? artCrop ?? null)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [deck, cardCache])


  if (error) {
    return (
      <div className={styles.page}>

        <div className={styles.error}>{error}</div>
      </div>
    )
  }

  if (!deck) {
    return (
      <div className={styles.page}>

        <div className={styles.loading}>Loading deck&hellip;</div>
      </div>
    )
  }

  // Deck price total
  let deckTotal = 0
  let unpricedCount = 0
  for (const card of [...deck.commanders, ...deck.mainboard, ...deck.sideboard, ...deck.companions]) {
    const usd = card.prices?.usd
    if (usd != null) {
      deckTotal += parseFloat(usd) * card.quantity
    } else {
      unpricedCount += card.quantity
    }
  }
  const priceFormatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(deckTotal)

  // Color distribution from mainboard + commanders
  const allMainCards = [...deck.commanders, ...deck.mainboard]
  const colorDist = getColorDistribution(allMainCards)
  const manaProd = getManaProduction(allMainCards)
  const deckSize = allMainCards.reduce((s, c) => s + c.quantity, 0)
  const manaCurve = getManaCurve(allMainCards)
  const deckAnalysis = getDeckAnalysis(allMainCards)

  return (
    <div className={styles.page}>
      {/* Full-width banner */}
      <div className={styles.banner} style={bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : undefined}>
        <div className={styles.bannerOverlay}>

          <h1 className={styles.bannerName}>{deck.name}</h1>
          <div className={styles.bannerMeta}>
            <span className={styles.formatBadge}>{deck.format}</span>
            <span className={styles.cardCount}>{deck.card_count} cards</span>
            <span
              className={styles.priceBadge}
              title={unpricedCount > 0 ? `${unpricedCount} card${unpricedCount !== 1 ? 's' : ''} without price data` : undefined}
            >
              {priceFormatted}{unpricedCount > 0 && <span className={styles.priceAsterisk}>*</span>}
            </span>
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
        <PreviewPanel
          hoveredCard={hoveredCard}
          hoveredImageUrl={hoveredImageUrl}
          previewFace={previewFace}
          onFlip={() => setPreviewFace(previewFace === 0 ? 1 : 0)}
          cardCache={cardCache}
        />

        <div className={styles.deckContent}>

      <div className={styles.deckControls}>
        <label className={styles.sortLabel}>
          Sort
          <select className={styles.sortSelect} value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)}>
            <option value="cmc">Mana Value</option>
            <option value="name">Name</option>
            <option value="price">Price</option>
          </select>
        </label>
      </div>

      {/* Mainboard grouped by type */}
      {(deck.commanders.length > 0 || deck.mainboard.length > 0) && (
        <div className={styles.zone}>
          <div className={`${styles.zoneHeader} ${styles.zoneHeaderBg}`}>
            <span className={styles.sectionLabel}>Mainboard</span>
            <span className={styles.zoneCount}>
              ({deck.commanders.reduce((s, c) => s + c.quantity, 0) + deck.mainboard.reduce((s, c) => s + c.quantity, 0)})
            </span>
          </div>
          <MainboardGrid commanders={deck.commanders} cards={deck.mainboard} isCommander={COMMANDER_FORMATS.includes(deck.format)} sortMode={sortMode} onCardClick={onCardClick} onCardHover={onCardHover} onCardFlip={onCardFlip} />
        </div>
      )}

      {/* Other zones */}
      {deck.companions.length > 0 && <CardZone title="Companion" cards={deck.companions} sortMode={sortMode} onCardClick={onCardClick} onCardHover={onCardHover} onCardFlip={onCardFlip} defaultCollapsed />}
      {deck.sideboard.length > 0 && <CardZone title="Sideboard" cards={deck.sideboard} sortMode={sortMode} onCardClick={onCardClick} onCardHover={onCardHover} onCardFlip={onCardFlip} defaultCollapsed />}
      {deck.maybeboard.length > 0 && <CardZone title="Maybeboard" cards={deck.maybeboard} sortMode={sortMode} onCardClick={onCardClick} onCardHover={onCardHover} onCardFlip={onCardFlip} defaultCollapsed />}

      {/* Deck Stats */}
      {colorDist.length > 0 && <DeckStats colorDist={colorDist} manaProd={manaProd} deckSize={deckSize} manaCurve={manaCurve} analysis={deckAnalysis} />}

      {/* Sample Hand */}
      {allMainCards.length >= 7 && <SampleHand cards={allMainCards} onCardClick={onCardClick} />}

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

/** Find the best matching oracle card for a deck card name from search results. */
function pickOracleCard(name: string, results: OracleCard[]): OracleCard | undefined {
  return results.find((c) => c.name === name || c.name.startsWith(frontFace(name) + ' // '))
    ?? results.find((c) => c.name === frontFace(name))
    ?? results[0]
}

function backFace(value: string) {
  const idx = value.indexOf(' // ')
  return idx === -1 ? null : value.slice(idx + 4)
}

function PreviewPanel({ hoveredCard, hoveredImageUrl, previewFace, onFlip, cardCache }: {
  hoveredCard: DeckCard | null
  hoveredImageUrl: string | null
  previewFace: number
  onFlip: () => void
  cardCache: Map<string, OracleCard>
}) {
  const isDfc = hoveredCard != null && hoveredCard.name.includes(' // ')
  const otherFaceName = hoveredCard ? (previewFace === 0 ? backFace(hoveredCard.name) : frontFace(hoveredCard.name)) : null

  let imgUrl: string | null | undefined = hoveredImageUrl
  if (isDfc && previewFace === 1 && hoveredCard) {
    const cached = cardCache.get(hoveredCard.name)
    imgUrl = cached?.image_urls.back_normal ?? cached?.image_urls.back_art_crop ?? hoveredImageUrl
  }

  const usd = hoveredCard?.prices?.usd
  const priceDisplay = usd != null
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(usd))
    : null

  return (
    <div className={styles.previewPanel}>
      {imgUrl ? (
        <img src={imgUrl} alt="Card preview" className={styles.previewImage} />
      ) : (
        <div className={styles.previewEmpty}>Hover a card to preview</div>
      )}
      {hoveredCard && (
        <div className={styles.previewMeta}>
          <span className={styles.previewPrice}>{priceDisplay ?? '—'}</span>
        </div>
      )}
      {isDfc && otherFaceName && (
        <button type="button" className={styles.flipBtn} onClick={onFlip}>
          ↻ {otherFaceName}
        </button>
      )}
    </div>
  )
}

const COMMANDER_FORMATS: DeckFormat[] = ['commander', 'brawl', 'oathbreaker', 'duel']

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

function sortCards(cards: DeckCard[], mode: SortMode): DeckCard[] {
  return [...cards].sort((a, b) => {
    if (mode === 'name') return frontFace(a.name).localeCompare(frontFace(b.name))
    if (mode === 'price') {
      const pa = parseFloat(a.prices?.usd ?? '-1')
      const pb = parseFloat(b.prices?.usd ?? '-1')
      return pb - pa
    }
    return a.cmc - b.cmc
  })
}

function TypeGroupBlock({ group, sortMode, onCardClick, onCardHover, onCardFlip }: { group: { label: string; cards: DeckCard[] }; sortMode: SortMode; onCardClick: (name: string) => void; onCardHover: (card: DeckCard | null) => void; onCardFlip: (card: DeckCard) => void }) {
  const total = group.cards.reduce((s, c) => s + c.quantity, 0)
  const sorted = sortCards(group.cards, sortMode)
  return (
    <div className={styles.typeGroup}>
      <div className={styles.typeGroupHeader}>
        <span className={styles.typeGroupLabel}>{group.label}</span>
        <span className={styles.typeGroupCount}>({total})</span>
      </div>
      {sorted.map((card) => {
        const mana = card.mana_cost ? frontFace(card.mana_cost) : null
        const isDfc = card.name.includes(' // ')
        return (
          <div key={card.scryfall_id} className={styles.mainboardCard} onMouseEnter={() => onCardHover(card)} onMouseLeave={() => onCardHover(null)}>
            <span className={styles.cardQty}>{card.quantity}</span>
            <div className={styles.cardNameCell}>
              <button type="button" className={styles.cardNameLink} onClick={() => onCardClick(card.name)}>{frontFace(card.name)}</button>
              {isDfc && <button type="button" className={styles.dfcBadge} title={`Flip to ${backFace(card.name)}`} onClick={() => onCardFlip(card)}>↻</button>}
            </div>
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

function MainboardGrid({ commanders, cards, isCommander, sortMode, onCardClick, onCardHover, onCardFlip }: { commanders: DeckCard[]; cards: DeckCard[]; isCommander: boolean; sortMode: SortMode; onCardClick: (name: string) => void; onCardHover: (card: DeckCard | null) => void; onCardFlip: (card: DeckCard) => void }) {
  const groups = groupMainboard(commanders, cards)
  const lands = groups.find((g) => g.label === 'Lands')
  const nonLands = groups.filter((g) => g.label !== 'Lands')

  // Commander decks: 3 flowing columns for spells + dedicated 4th column for lands
  if (isCommander && lands) {
    return (
      <div className={styles.mainboardSplit}>
        <div className={styles.mainboardFlow}>
          {nonLands.map((group) => (
            <TypeGroupBlock key={group.label} group={group} sortMode={sortMode} onCardClick={onCardClick} onCardHover={onCardHover} onCardFlip={onCardFlip} />
          ))}
        </div>
        <div className={styles.mainboardLands}>
          <TypeGroupBlock group={lands} sortMode={sortMode} onCardClick={onCardClick} onCardHover={onCardHover} onCardFlip={onCardFlip} />
        </div>
      </div>
    )
  }

  // Non-commander: all groups flow naturally in 4 columns
  return (
    <div className={styles.mainboardFlowFull}>
      {groups.map((group) => (
        <TypeGroupBlock key={group.label} group={group} sortMode={sortMode} onCardClick={onCardClick} onCardHover={onCardHover} onCardFlip={onCardFlip} />
      ))}
    </div>
  )
}

function CardZone({ title, cards, sortMode, onCardClick, onCardHover, onCardFlip, defaultCollapsed = false }: { title: string; cards: DeckCard[]; sortMode: SortMode; onCardClick: (name: string) => void; onCardHover: (card: DeckCard | null) => void; onCardFlip: (card: DeckCard) => void; defaultCollapsed?: boolean }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  if (cards.length === 0) return null

  const groups = groupByType(cards)
  const totalCards = cards.reduce((sum, c) => sum + c.quantity, 0)
  // ~8 cards per column, min 1, max 4
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
            <TypeGroupBlock key={group.label} group={group} sortMode={sortMode} onCardClick={onCardClick} onCardHover={onCardHover} onCardFlip={onCardFlip} />
          ))}
        </div>
      )}
    </div>
  )
}

function groupByType(cards: DeckCard[]) {
  return groupMainboard([], cards)
}

const COLOR_META: Record<string, { label: string; symbol: string; bg: string }> = {
  W: { label: 'White', symbol: '{W}', bg: '#F9FAF4' },
  U: { label: 'Blue', symbol: '{U}', bg: '#0E68AB' },
  B: { label: 'Black', symbol: '{B}', bg: '#150B00' },
  R: { label: 'Red', symbol: '{R}', bg: '#D3202A' },
  G: { label: 'Green', symbol: '{G}', bg: '#00733E' },
  C: { label: 'Colorless', symbol: '{C}', bg: '#8888aa' },
}

const COLOR_ORDER = ['W', 'U', 'B', 'R', 'G', 'C']

function getColorDistribution(cards: DeckCard[]) {
  const counts: Record<string, number> = {}
  const cmcTotals: Record<string, number> = {}
  const spells = cards.filter((c) => !c.type_line.includes('Land'))
  for (const card of spells) {
    if (card.colors.length === 0) {
      counts.C = (counts.C ?? 0) + card.quantity
      cmcTotals.C = (cmcTotals.C ?? 0) + card.cmc * card.quantity
    } else {
      for (const c of card.colors) {
        counts[c] = (counts[c] ?? 0) + card.quantity
        cmcTotals[c] = (cmcTotals[c] ?? 0) + card.cmc * card.quantity
      }
    }
  }
  const total = Object.values(counts).reduce((s, n) => s + n, 0)
  if (total === 0) return []
  return COLOR_ORDER
    .filter((c) => (counts[c] ?? 0) > 0)
    .map((c) => ({
      key: c, count: counts[c],
      pct: Math.round((counts[c] / total) * 100),
      avgCmc: counts[c] > 0 ? cmcTotals[c] / counts[c] : 0,
      ...COLOR_META[c],
    }))
}

function getManaProduction(cards: DeckCard[]) {
  const lands = cards.filter((c) => c.type_line.includes('Land'))
  const counts: Record<string, number> = {}
  for (const land of lands) {
    if (land.color_identity.length === 0) {
      counts.C = (counts.C ?? 0) + land.quantity
    } else {
      for (const c of land.color_identity) {
        counts[c] = (counts[c] ?? 0) + land.quantity
      }
    }
  }
  const total = Object.values(counts).reduce((s, n) => s + n, 0)
  if (total === 0) return []
  return COLOR_ORDER
    .filter((c) => (counts[c] ?? 0) > 0)
    .map((c) => ({
      key: c, count: counts[c],
      pct: Math.round((counts[c] / total) * 100),
      ...COLOR_META[c],
    }))
}

function getManaCurve(cards: DeckCard[]) {
  const buckets: Record<string, number> = {}
  for (const card of cards) {
    if (card.type_line.includes('Land')) continue
    const key = card.cmc >= 6 ? '6+' : String(Math.floor(card.cmc))
    buckets[key] = (buckets[key] ?? 0) + card.quantity
  }
  const labels = ['0', '1', '2', '3', '4', '5', '6+']
  return labels.map((l) => ({ label: l, count: buckets[l] ?? 0 }))
}

function getDeckAnalysis(cards: DeckCard[]) {
  const totalCards = cards.reduce((s, c) => s + c.quantity, 0)
  const lands = cards.filter((c) => c.type_line.includes('Land'))
  const landCount = lands.reduce((s, c) => s + c.quantity, 0)
  const spellCount = totalCards - landCount

  // Spell subcategories (mutually exclusive, same priority as TYPE_GROUPS)
  const spellTypes = [
    { label: 'Creatures', match: (c: DeckCard) => c.type_line.includes('Creature') },
    { label: 'Planeswalkers', match: (c: DeckCard) => c.type_line.includes('Planeswalker') && !c.type_line.includes('Creature') },
    { label: 'Instants', match: (c: DeckCard) => c.type_line.includes('Instant') },
    { label: 'Sorceries', match: (c: DeckCard) => c.type_line.includes('Sorcery') },
    { label: 'Artifacts', match: (c: DeckCard) => c.type_line.includes('Artifact') && !c.type_line.includes('Creature') },
    { label: 'Enchantments', match: (c: DeckCard) => c.type_line.includes('Enchantment') && !c.type_line.includes('Creature') },
  ]
  const used = new Set<number>()
  const spellBreakdown: { label: string; count: number }[] = []
  const nonLands = cards.filter((c) => !c.type_line.includes('Land'))
  for (const type of spellTypes) {
    let count = 0
    nonLands.forEach((card, idx) => {
      if (!used.has(idx) && type.match(card)) {
        count += card.quantity
        used.add(idx)
      }
    })
    if (count > 0) spellBreakdown.push({ label: type.label, count })
  }
  const otherSpells = nonLands.filter((_, idx) => !used.has(idx)).reduce((s, c) => s + c.quantity, 0)
  if (otherSpells > 0) spellBreakdown.push({ label: 'Other', count: otherSpells })

  const creatures = cards.filter((c) => c.type_line.includes('Creature'))
  let totalPower = 0, totalToughness = 0, creatureCount = 0
  for (const c of creatures) {
    const p = parseFloat(c.power ?? '')
    const t = parseFloat(c.toughness ?? '')
    if (!isNaN(p) && !isNaN(t)) {
      totalPower += p * c.quantity
      totalToughness += t * c.quantity
      creatureCount += c.quantity
    }
  }

  const drawPatterns = /\bdraw|draws\b/i
  const interactionPatterns = /\bdestroy|destroys|exile|exiles|counter target\b/i

  let drawCount = 0, interactionCount = 0
  for (const card of cards) {
    if (card.type_line.includes('Land')) continue
    const text = card.oracle_text ?? ''
    if (drawPatterns.test(text)) drawCount += card.quantity
    if (interactionPatterns.test(text)) interactionCount += card.quantity
  }

  const uniqueCards = cards.length
  const totalSlots = totalCards

  return {
    landCount, spellCount, totalCards, spellBreakdown,
    avgPower: creatureCount > 0 ? totalPower / creatureCount : 0,
    avgToughness: creatureCount > 0 ? totalToughness / creatureCount : 0,
    creatureCount,
    drawCount, interactionCount,
    uniqueCards, totalSlots,
  }
}

function drawSampleHand(cards: DeckCard[], count = 7): DeckCard[] {
  // Build pool expanding by quantity
  const pool: DeckCard[] = []
  for (const card of cards) {
    for (let i = 0; i < card.quantity; i++) pool.push(card)
  }
  // Fisher-Yates shuffle on a copy, take first `count`
  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, count)
}

function SampleHand({ cards, onCardClick }: { cards: DeckCard[]; onCardClick: (name: string) => void }) {
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
                onClick={() => onCardClick(card.name)}
                title={card.name}
              >
                {card.image_url ? (
                  <img src={card.image_url} alt={card.name} className={styles.sampleCardImg} />
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

/** P(at least 1 success in `drawn` cards) via hypergeometric distribution */
function pAtLeastOne(deckSize: number, successes: number, drawn: number): number {
  if (successes <= 0 || drawn <= 0 || deckSize <= 0) return 0
  // P(0 successes) = C(N-K, n) / C(N, n) — compute via product to avoid large factorials
  let p0 = 1
  for (let i = 0; i < drawn; i++) {
    p0 *= (deckSize - successes - i) / (deckSize - i)
    if (p0 <= 0) return 1
  }
  return 1 - p0
}

const TURNS = [1, 2, 3, 4, 5]

function DeckStats({ colorDist, manaProd, deckSize, manaCurve, analysis }: {
  colorDist: ReturnType<typeof getColorDistribution>
  manaProd: ReturnType<typeof getManaProduction>
  deckSize: number
  manaCurve: ReturnType<typeof getManaCurve>
  analysis: ReturnType<typeof getDeckAnalysis>
}) {
  const [collapsed, setCollapsed] = useState(true)
  const maxCurveCount = Math.max(...manaCurve.map((b) => b.count), 1)

  return (
    <div className={styles.zone}>
      <button type="button" className={`${styles.zoneHeaderBtn} ${styles.zoneHeaderBg}`} onClick={() => setCollapsed(!collapsed)}>
        <span className={styles.collapseIcon}>{collapsed ? '▸' : '▾'}</span>
        <span className={styles.sectionLabel}>Deck Stats</span>
      </button>
      {!collapsed && (
        <div className={styles.statsGrid}>
          {/* Mana Curve */}
          <div className={styles.statBlock}>
            <div className={styles.statLabel}>Mana Curve <span className={styles.infoIcon} title="Distribution of spells by mana value, excluding lands.">i</span></div>
            <div className={styles.curveBar}>
              {manaCurve.map(({ label, count }) => (
                <div key={label} className={styles.curveColumn}>
                  <span className={styles.curveCount}>{count || ''}</span>
                  <div className={styles.curveTrack}>
                    <div
                      className={styles.curveFill}
                      style={{ height: `${maxCurveCount > 0 ? (count / maxCurveCount) * 100 : 0}%` }}
                    />
                  </div>
                  <span className={styles.curveLabel}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Color Availability by Turn */}
          {manaProd.length > 0 && (
            <div className={styles.statBlock}>
              <div className={styles.statLabel}>Color Availability by Turn <span className={styles.infoIcon} title="Probability of having at least one source of each color by a given turn.">i</span></div>
              <div className={styles.turnTable}>
                <div className={styles.turnRow}>
                  <span className={styles.turnHeader}>Turn</span>
                  {manaProd.map(({ key, symbol }) => (
                    <span key={key} className={styles.turnHeader}><ManaCost cost={symbol} size={16} /></span>
                  ))}
                </div>
                {TURNS.map((turn) => {
                  const drawn = 6 + turn
                  return (
                    <div key={turn} className={styles.turnRow}>
                      <span className={styles.turnLabel}>T{turn}</span>
                      {manaProd.map(({ key, count }) => {
                        const pct = Math.round(pAtLeastOne(deckSize, count, drawn) * 100)
                        return (
                          <span key={key} className={styles.turnCell} style={{ opacity: 0.4 + 0.6 * (pct / 100) }}>
                            {pct}%
                          </span>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Deck Composition */}
          <div className={styles.statBlock}>
            <div className={styles.statLabel}>Deck Composition <span className={styles.infoIcon} title="Land/spell ratio, card draw and removal density, and creature combat stats.">i</span></div>
            <div className={styles.compositionList}>
              <div className={styles.compositionRow}>
                <span className={styles.compositionLabel}>Lands</span>
                <span className={styles.compositionValue}>{analysis.landCount}</span>
                <span className={styles.compositionPct}>{Math.round((analysis.landCount / analysis.totalCards) * 100)}%</span>
              </div>
              <div className={styles.compositionRow}>
                <span className={styles.compositionLabel}>Spells</span>
                <span className={styles.compositionValue}>{analysis.spellCount}</span>
                <span className={styles.compositionPct}>{Math.round((analysis.spellCount / analysis.totalCards) * 100)}%</span>
              </div>
              {analysis.spellBreakdown.map(({ label, count }) => (
                <div key={label} className={`${styles.compositionRow} ${styles.compositionIndent}`}>
                  <span className={styles.compositionLabel}>{label}</span>
                  <span className={styles.compositionValue}>{count}</span>
                  <span className={styles.compositionPct}>{analysis.totalCards > 0 ? Math.round((count / analysis.totalCards) * 100) : 0}%</span>
                </div>
              ))}
              <div className={styles.compositionDivider} />
              <div className={styles.compositionRow}>
                <span className={styles.compositionLabel}>Card Draw</span>
                <span className={styles.compositionValue}>{analysis.drawCount}</span>
                <span className={styles.compositionPct}>{analysis.spellCount > 0 ? Math.round((analysis.drawCount / analysis.spellCount) * 100) : 0}% of spells</span>
              </div>
              <div className={styles.compositionRow}>
                <span className={styles.compositionLabel}>Interaction</span>
                <span className={styles.compositionValue}>{analysis.interactionCount}</span>
                <span className={styles.compositionPct}>{analysis.spellCount > 0 ? Math.round((analysis.interactionCount / analysis.spellCount) * 100) : 0}% of spells</span>
              </div>
              {analysis.creatureCount > 0 && (
                <>
                  <div className={styles.compositionDivider} />
                  <div className={styles.compositionRow}>
                    <span className={styles.compositionLabel}>Avg Power</span>
                    <span className={styles.compositionValue}>{analysis.avgPower.toFixed(1)}</span>
                    <span className={styles.compositionPct}>{analysis.creatureCount} creatures</span>
                  </div>
                  <div className={styles.compositionRow}>
                    <span className={styles.compositionLabel}>Avg Toughness</span>
                    <span className={styles.compositionValue}>{analysis.avgToughness.toFixed(1)}</span>
                    <span className={styles.compositionPct} />
                  </div>
                </>
              )}
              {analysis.uniqueCards !== analysis.totalSlots && (
                <>
                  <div className={styles.compositionDivider} />
                  <div className={styles.compositionRow}>
                    <span className={styles.compositionLabel}>Unique Cards</span>
                    <span className={styles.compositionValue}>{analysis.uniqueCards}</span>
                    <span className={styles.compositionPct}>of {analysis.totalSlots} slots</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Color Summary — combined table */}
          <div className={styles.statBlock}>
            <div className={styles.statLabel}>Color Summary <span className={styles.infoIcon} title="Spell distribution, average mana value, and land mana sources per color.">i</span></div>
            <div className={styles.colorSummary}>
              <div className={styles.colorSummaryHeader}>
                <span className={styles.colorSummaryIcon} />
                <span className={styles.colorSummaryName}>Color</span>
                <span className={styles.colorSummaryHeaderCell}>Spells</span>
                <span className={styles.colorSummaryHeaderCell}>Avg CMC</span>
                {manaProd.length > 0 && <span className={styles.colorSummaryHeaderCell}>Sources</span>}
              </div>
              {colorDist.map(({ key, count, pct, label, symbol, avgCmc }) => {
                const prod = manaProd.find((p) => p.key === key)
                return (
                  <div key={key} className={styles.colorSummaryRow}>
                    <div className={styles.colorSummaryIcon}><ManaCost cost={symbol} size={16} /></div>
                    <span className={styles.colorSummaryName}>{label}</span>
                    <span className={styles.colorSummaryVal}>{count} <span className={styles.colorSummaryPct}>({pct}%)</span></span>
                    <span className={styles.colorSummaryVal}>{avgCmc.toFixed(2)}</span>
                    {manaProd.length > 0 && (
                      <span className={styles.colorSummaryVal}>
                        {prod ? <>{prod.count} <span className={styles.colorSummaryPct}>({prod.pct}%)</span></> : '—'}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
