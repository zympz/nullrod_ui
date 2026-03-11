import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { OracleCard, ArtworkResponse, RulingsResponse, CardFace } from '../types/card'
import { getCardById, getArtwork, getRulings } from '../api/client'
import { ManaSymbol, ManaCost, OracleText } from '../components/ManaSymbol'
import styles from './CardPage.module.css'

const FORMAT_ORDER = [
  'standard', 'pioneer', 'modern', 'legacy', 'vintage',
  'commander', 'pauper', 'explorer', 'historic', 'timeless',
] as const

export function CardPage() {
  const { oracleId } = useParams<{ oracleId: string }>()
  const navigate = useNavigate()
  const [card, setCard] = useState<OracleCard | null>(null)
  const [artwork, setArtwork] = useState<ArtworkResponse | null>(null)
  const [rulings, setRulings] = useState<RulingsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!oracleId) return
    setCard(null)
    setArtwork(null)
    setRulings(null)
    setError(null)

    getCardById(oracleId)
      .then((c) => {
        setCard(c)
        getArtwork(c.canonical_scryfall_id).then(setArtwork).catch(() => {})
        getRulings(c.oracle_id).then(setRulings).catch(() => {})
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load card'))
  }, [oracleId])

  if (error) {
    return (
      <div className={styles.page}>
        <button className={styles.back} onClick={() => navigate(-1)} type="button">&larr; Back to search</button>
        <div className={styles.error}>{error}</div>
      </div>
    )
  }

  if (!card) {
    return (
      <div className={styles.page}>
        <button className={styles.back} onClick={() => navigate(-1)} type="button">&larr; Back to search</button>
        <div className={styles.loading}>Loading card&hellip;</div>
      </div>
    )
  }

  const imgUrl = artwork?.urls.normal ?? artwork?.urls.art_crop
  const faces = card.card_faces

  return (
    <div className={styles.page}>
      <button className={styles.back} onClick={() => navigate(-1)} type="button">&larr; Back to search</button>

      <div className={styles.card}>
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
          </div>

          {/* Info panel */}
          <div className={styles.infoPanel}>
            <div className={styles.header}>
              <h1 className={styles.name}>{card.name}</h1>
              {card.mana_cost && <ManaCost cost={card.mana_cost} size={22} />}
            </div>

            <div className={styles.typeLine}>{card.type_line}</div>

            {card.color_identity.length > 0 && (
              <div className={styles.colorIdentity}>
                <span className={styles.colorIdentityLabel}>Identity</span>
                <div className={styles.colorIdentityPips}>
                  {card.color_identity.map((c) => (
                    <ManaSymbol key={c} symbol={c} size={20} />
                  ))}
                </div>
              </div>
            )}

            {card.reserved && (
              <div className={styles.reserved}>Reserved List</div>
            )}

            {/* Card faces (DFC / modal / adventure) */}
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
                <div className={styles.pills}>
                  {card.keywords.map((kw) => (
                    <span key={kw} className={styles.pill}>{kw}</span>
                  ))}
                </div>
              </div>
            )}

            {card.games.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionLabel}>Games</div>
                <div className={styles.pills}>
                  {card.games.map((g) => (
                    <span key={g} className={styles.pill}>{g}</span>
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
    </div>
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
      {separator && <div className={styles.faceDivider}>// Transform</div>}
      <div className={styles.face}>
        <div className={styles.faceHeader}>
          <span className={styles.faceName}>{face.name}</span>
          {face.mana_cost && <ManaCost cost={face.mana_cost} size={16} />}
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
