import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { OracleCard, ArtworkResponse, RulingsResponse, CardFace } from '../types/card'
import { getArtwork, getAllPrintings, getRulings } from '../api/client'
import { ManaSymbol, ManaCost, OracleText } from './ManaSymbol'
import styles from './CardDetail.module.css'

const FORMAT_ORDER = [
  'standard', 'pioneer', 'modern', 'legacy', 'vintage',
  'commander', 'pauper', 'explorer', 'historic', 'timeless',
] as const

interface CardDetailProps {
  card: OracleCard
  onClose: () => void
}

export function CardDetail({ card, onClose }: CardDetailProps) {
  const [artwork, setArtwork] = useState<ArtworkResponse | null>(null)
  const [printings, setPrintings] = useState<ArtworkResponse[]>([])
  const [selectedPrinting, setSelectedPrinting] = useState<ArtworkResponse | null>(null)
  const [rulings, setRulings] = useState<RulingsResponse | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setArtwork(null)
    setPrintings([])
    setSelectedPrinting(null)
    setRulings(null)

    getArtwork(card.canonical_scryfall_id)
      .then((a) => { setArtwork(a); setSelectedPrinting(a) })
      .catch(() => {})

    getAllPrintings(card.canonical_scryfall_id)
      .then(setPrintings)
      .catch(() => {})

    getRulings(card.oracle_id)
      .then(setRulings)
      .catch(() => {})
  }, [card.oracle_id, card.canonical_scryfall_id])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose()
  }

  const currentArt = selectedPrinting ?? artwork
  const imgUrl = currentArt?.urls.normal ?? currentArt?.urls.large ?? currentArt?.urls.small

  const faces = card.card_faces

  return createPortal(
    <div className={styles.overlay} ref={overlayRef} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <button className={styles.close} onClick={onClose} type="button" aria-label="Close">✕</button>

        <div className={styles.layout}>
          {/* Art panel */}
          <div className={styles.artPanel}>
            <div className={styles.artFrame}>
              {imgUrl ? (
                <img src={imgUrl} alt={card.name} className={styles.art} />
              ) : (
                <div className={styles.artEmpty}>No image</div>
              )}
            </div>

            {/* Printing selector */}
            {printings.length > 1 && (
              <div className={styles.printings}>
                <div className={styles.sectionLabel}>Printings ({printings.length})</div>
                <div className={styles.printingThumbs}>
                  {printings.filter((p) => p.urls.small).slice(0, 12).map((p) => (
                    <button
                      key={p.scryfall_id}
                      className={`${styles.thumb} ${selectedPrinting?.scryfall_id === p.scryfall_id ? styles.thumbActive : ''}`}
                      onClick={() => setSelectedPrinting(p)}
                      type="button"
                    >
                      <img src={p.urls.small} alt="" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Info panel */}
          <div className={styles.infoPanel}>
            <div className={styles.header}>
              <h2 className={styles.name}>{card.name}</h2>
              {card.mana_cost && <ManaCost cost={card.mana_cost} size={20} />}
            </div>

            <div className={styles.typeLine}>{card.type_line}</div>

            {card.color_identity.length > 0 && (
              <div className={styles.colorIdentity}>
                <span className={styles.colorIdentityLabel}>Identity</span>
                <div className={styles.colorIdentityPips}>
                  {card.color_identity.map((c) => (
                    <ManaSymbol key={c} symbol={c} size={18} />
                  ))}
                </div>
              </div>
            )}

            {card.reserved && (
              <div className={styles.reserved}>Reserved List</div>
            )}

            {/* Card faces (DFC / modal) */}
            {faces ? (
              <div className={styles.faces}>
                {faces.map((face, i) => (
                  <CardFaceBlock key={i} face={face} separator={i > 0} />
                ))}
              </div>
            ) : (
              <>
                {card.oracle_text && (
                  <div className={styles.oracleText}>
                    {card.oracle_text.split('\n').map((line, i) => (
                      <p key={i}><OracleText text={line} /></p>
                    ))}
                  </div>
                )}
                <StatsRow card={card} />
              </>
            )}

            {card.keywords.length > 0 && (
              <div className={styles.keywords}>
                {card.keywords.map((kw) => (
                  <span key={kw} className={styles.keyword}>{kw}</span>
                ))}
              </div>
            )}

            {/* Legalities */}
            <div className={styles.section}>
              <div className={styles.sectionLabel}>Legality</div>
              <div className={styles.legalities}>
                {FORMAT_ORDER.map((fmt) => {
                  const status = card.legalities[fmt]
                  if (!status || status === 'not_legal') return null
                  return (
                    <div key={fmt} className={`${styles.legalityRow} ${styles[`leg_${status}`]}`}>
                      <span className={styles.format}>{fmt}</span>
                      <span className={styles.legalityStatus}>{status.replace('_', ' ')}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Rulings */}
            {rulings && rulings.rulings.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionLabel}>Rulings</div>
                <div className={styles.rulings}>
                  {rulings.rulings.map((r, i) => (
                    <div key={i} className={styles.ruling}>
                      <div className={styles.rulingDate}>{r.published_at}</div>
                      <div className={styles.rulingText}>{r.comment}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function StatsRow({ card }: { card: OracleCard }) {
  const parts: string[] = []
  if (card.power != null && card.toughness != null) parts.push(`${card.power}/${card.toughness}`)
  if (card.loyalty != null) parts.push(`Loyalty: ${card.loyalty}`)
  if (card.hand_modifier != null) parts.push(`Hand: ${card.hand_modifier}`)
  if (card.life_modifier != null) parts.push(`Life: ${card.life_modifier}`)
  if (parts.length === 0) return null
  return <div className={styles.stats}>{parts.join(' · ')}</div>
}

function CardFaceBlock({ face, separator }: { face: CardFace; separator: boolean }) {
  return (
    <>
      {separator && <div className={styles.faceDivider}>// Transform</div>}
      <div className={styles.face}>
        <div className={styles.faceHeader}>
          <span className={styles.faceName}>{face.name}</span>
          {face.mana_cost && <ManaCost cost={face.mana_cost} size={14} />}
        </div>
        <div className={styles.faceType}>{face.type_line}</div>
        {face.oracle_text && (
          <div className={styles.oracleText}>
            {face.oracle_text.split('\n').map((line, i) => (
              <p key={i}><OracleText text={line} /></p>
            ))}
          </div>
        )}
        {face.power != null && face.toughness != null && (
          <div className={styles.stats}>{face.power}/{face.toughness}</div>
        )}
        {face.loyalty != null && (
          <div className={styles.stats}>Loyalty: {face.loyalty}</div>
        )}
      </div>
    </>
  )
}
