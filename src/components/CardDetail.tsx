import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import type { OracleCard, CardFace } from '../types/card'
import { ManaSymbol, ManaCost, OracleText } from './ManaSymbol'
import { FORMAT_ORDER } from '../constants'
import styles from './CardDetail.module.css'

interface CardDetailProps {
  card: OracleCard
  onClose: () => void
}

export function CardDetail({ card, onClose }: CardDetailProps) {
  const [activeFace, setActiveFace] = useState(0)
  const overlayRef = useRef<HTMLDivElement>(null)

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

  const faces = card.card_faces
  const isDfc = faces != null && faces.length === 2
  const imgUrl = card.image_urls.normal ?? card.image_urls.art_crop

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
            {isDfc && (
              <button type="button" className={styles.flipBtn} onClick={() => setActiveFace(activeFace === 0 ? 1 : 0)}>
                ↻ Flip to {faces[activeFace === 0 ? 1 : 0].name}
              </button>
            )}
          </div>

          {/* Info panel */}
          <div className={styles.infoPanel}>
            <div className={styles.header}>
              <Link to={`/cards/${card.oracle_id}`} className={styles.name} onClick={onClose}>{card.name}</Link>
              {!isDfc && card.mana_cost && <ManaCost cost={card.mana_cost} size={20} />}
            </div>
            {!isDfc && <div className={styles.typeLine}>{card.type_line}</div>}

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

            {/* Card text */}
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
              <div className={styles.section}>
                <div className={styles.sectionLabel}>Keywords</div>
                <div className={styles.keywords}>
                  {card.keywords.map((kw) => (
                    <span key={kw} className={styles.keyword}>{kw}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Games */}
            {card.games.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionLabel}>Games</div>
                <div className={styles.keywords}>
                  {card.games.map((g) => (
                    <span key={g} className={styles.keyword}>{g}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Legalities */}
            <div className={styles.section}>
              <div className={styles.sectionLabel}>Legality</div>
              <div className={styles.legalities}>
                {FORMAT_ORDER.map((fmt) => {
                  const status = card.legalities[fmt] ?? 'not_legal'
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
            {card.rulings.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionLabel}>Rulings</div>
                <div className={styles.rulings}>
                  {card.rulings.map((r, i) => (
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
  const stats: { label: string; value: string }[] = []
  if (card.power != null && card.toughness != null) {
    stats.push({ label: 'Power', value: card.power })
    stats.push({ label: 'Toughness', value: card.toughness })
  }
  if (card.loyalty != null) stats.push({ label: 'Loyalty', value: String(card.loyalty) })
  if (card.hand_modifier != null) stats.push({ label: 'Hand', value: String(card.hand_modifier) })
  if (card.life_modifier != null) stats.push({ label: 'Life', value: String(card.life_modifier) })
  if (stats.length === 0) return null
  return (
    <div className={styles.statsRow}>
      {stats.map(({ label, value }) => (
        <div key={label} className={styles.statChip}>
          <span className={styles.statLabel}>{label}</span>
          <span className={styles.statValue}>{value}</span>
        </div>
      ))}
    </div>
  )
}

function CardFaceBlock({ face, separator }: { face: CardFace; separator: boolean }) {
  return (
    <>
      {separator && <div className={styles.faceDivider}>//</div>}
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
        {(face.power != null || face.loyalty != null) && (
          <div className={styles.statsRow}>
            {face.power != null && face.toughness != null && (
              <>
                <div className={styles.statChip}><span className={styles.statLabel}>Power</span><span className={styles.statValue}>{face.power}</span></div>
                <div className={styles.statChip}><span className={styles.statLabel}>Toughness</span><span className={styles.statValue}>{face.toughness}</span></div>
              </>
            )}
            {face.loyalty != null && (
              <div className={styles.statChip}><span className={styles.statLabel}>Loyalty</span><span className={styles.statValue}>{face.loyalty}</span></div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
