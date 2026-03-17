import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { Deck, DeckCard, DeckCardPrices } from '../types/deck'
import type { OracleCard } from '../types/card'
import { getDeck, getCardById, searchCardByName, fetchBatchPrices } from '../api/client'
import { CardDetail } from '../components/CardDetail'
import { PreviewPanel } from '../components/deck/PreviewPanel'
import { MainboardGrid } from '../components/deck/MainboardGrid'
import { CardZone } from '../components/deck/CardZone'
import { DeckStats } from '../components/deck/DeckStats'
import { SampleHand } from '../components/deck/SampleHand'
import { frontFace } from '../utils/cardName'
import {
  COMMANDER_FORMATS, cardPrice,
  getColorDistribution, getManaProduction, getManaCurve, getDeckAnalysis,
  pickOracleCard,
} from '../utils/deckUtils'
import type { SortMode } from '../utils/deckUtils'
import styles from './DeckPage.module.css'

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
  const [showPrices, setShowPrices] = useState(false)
  const [pricesMap, setPricesMap] = useState<Map<string, DeckCardPrices>>(new Map())
  const cardCache = useRef(new Map<string, OracleCard>()).current

  const onCardHover = useCallback((card: DeckCard | null) => {
    if (!card) return
    setHoveredCard(card)
    setPreviewFace(0)
    setHoveredImageUrl(card.image_urls.front ?? null)
  }, [])

  const onCardClick = useCallback((deckCard: DeckCard) => {
    const withDeckArt = (oracle: OracleCard): OracleCard =>
      deckCard.image_urls.front || deckCard.image_urls.back
        ? { ...oracle, image_urls: { normal: deckCard.image_urls.front, back_normal: deckCard.image_urls.back, art_crop: deckCard.image_urls.front, back_art_crop: deckCard.image_urls.back } }
        : oracle

    const cached = cardCache.get(deckCard.oracle_id)
    if (cached) { setSelectedCard(withDeckArt(cached)); return }
    getCardById(deckCard.oracle_id)
      .then((oracle) => { cardCache.set(deckCard.oracle_id, oracle); setSelectedCard(withDeckArt(oracle)) })
      .catch(() => {})
  }, [cardCache])

  const onCardFlip = useCallback((card: DeckCard) => {
    setHoveredCard(card)
    setPreviewFace(1)
    setHoveredImageUrl(card.image_urls.back ?? card.image_urls.front ?? null)
  }, [])

  useEffect(() => { cardCache.clear() }, [deckId, cardCache])

  useEffect(() => {
    if (!deckId) return
    let cancelled = false
    setDeck(null)
    setError(null)
    getDeck(deckId)
      .then((d) => {
        if (cancelled) return
        setDeck(d)
        const featured = d.commanders[0] ?? d.mainboard[0]
        if (featured?.image_urls.front) setHoveredImageUrl(featured.image_urls.front)
      })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load deck') })
    return () => { cancelled = true }
  }, [deckId])

  // Fetch live prices for all deck cards via batch API
  useEffect(() => {
    if (!deck) return
    let cancelled = false
    const allCards = [...deck.commanders, ...deck.mainboard, ...deck.sideboard, ...deck.companions, ...deck.maybeboard]
    const ids = [...new Set(allCards.map((c) => c.scryfall_id))]
    fetchBatchPrices(ids)
      .then((map) => { if (!cancelled) setPricesMap(map) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [deck])

  // Fetch banner art_crop for featured card
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

  // Memoize derived data — only recomputes when deck changes, not on hover
  const allMainCards = useMemo(
    () => (deck ? [...deck.commanders, ...deck.mainboard] : []),
    [deck],
  )
  const { deckTotal, unpricedCount } = useMemo(() => {
    let total = 0, unpriced = 0
    for (const card of deck ? [...deck.commanders, ...deck.mainboard, ...deck.sideboard, ...deck.companions] : []) {
      const usd = cardPrice(card, pricesMap)
      if (usd != null) total += parseFloat(usd) * card.quantity
      else unpriced += card.quantity
    }
    return { deckTotal: total, unpricedCount: unpriced }
  }, [deck, pricesMap])
  const colorDist = useMemo(() => getColorDistribution(allMainCards), [allMainCards])
  const manaProd = useMemo(() => getManaProduction(allMainCards), [allMainCards])
  const deckSize = useMemo(() => allMainCards.reduce((s, c) => s + c.quantity, 0), [allMainCards])
  const manaCurve = useMemo(() => getManaCurve(allMainCards), [allMainCards])
  const deckAnalysis = useMemo(() => getDeckAnalysis(allMainCards), [allMainCards])

  if (error) return <div className={styles.page}><div className={styles.error}>{error}</div></div>
  if (!deck) return <div className={styles.page}><div className={styles.loading}>Loading deck&hellip;</div></div>

  const priceFormatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(deckTotal)
  const isCommander = COMMANDER_FORMATS.includes(deck.format)

  return (
    <div className={styles.page}>
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
          pricesMap={pricesMap}
          onFlip={() => setPreviewFace(previewFace === 0 ? 1 : 0)}
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
            <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={showPrices} onChange={(e) => setShowPrices(e.target.checked)} className={styles.checkbox} />
              Prices
            </label>
          </div>

          {(deck.commanders.length > 0 || deck.mainboard.length > 0) && (
            <div className={styles.zone}>
              <div className={`${styles.zoneHeader} ${styles.zoneHeaderBg}`}>
                <span className={styles.sectionLabel}>Mainboard</span>
                <span className={styles.zoneCount}>
                  ({deck.commanders.reduce((s, c) => s + c.quantity, 0) + deck.mainboard.reduce((s, c) => s + c.quantity, 0)})
                </span>
              </div>
              <MainboardGrid
                commanders={deck.commanders}
                cards={deck.mainboard}
                isCommander={isCommander}
                sortMode={sortMode}
                showPrices={showPrices}
                pricesMap={pricesMap}
                onCardClick={onCardClick}
                onCardHover={onCardHover}
                onCardFlip={onCardFlip}
              />
            </div>
          )}

          {deck.companions.length > 0 && <CardZone title="Companion" cards={deck.companions} sortMode={sortMode} showPrices={showPrices} pricesMap={pricesMap} onCardClick={onCardClick} onCardHover={onCardHover} onCardFlip={onCardFlip} defaultCollapsed />}
          {deck.sideboard.length > 0 && <CardZone title="Sideboard" cards={deck.sideboard} sortMode={sortMode} showPrices={showPrices} pricesMap={pricesMap} onCardClick={onCardClick} onCardHover={onCardHover} onCardFlip={onCardFlip} defaultCollapsed />}
          {deck.maybeboard.length > 0 && <CardZone title="Maybeboard" cards={deck.maybeboard} sortMode={sortMode} showPrices={showPrices} pricesMap={pricesMap} onCardClick={onCardClick} onCardHover={onCardHover} onCardFlip={onCardFlip} defaultCollapsed />}

          {colorDist.length > 0 && <DeckStats colorDist={colorDist} manaProd={manaProd} deckSize={deckSize} manaCurve={manaCurve} analysis={deckAnalysis} />}
          {allMainCards.length >= 7 && <SampleHand cards={allMainCards} onCardClick={onCardClick} />}
        </div>
      </div>

      {selectedCard && <CardDetail card={selectedCard} onClose={() => setSelectedCard(null)} />}
    </div>
  )
}
