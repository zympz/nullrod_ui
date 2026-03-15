import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { OracleCard, CardFace, PrintingResponse } from '../types/card'
import { getCardById, getCardPrintings } from '../api/client'
import { ManaSymbol, ManaCost, OracleText } from '../components/ManaSymbol'
import { FORMAT_ORDER } from '../constants'
import styles from './CardPage.module.css'

const RARITY_COLORS: Record<string, string> = {
  common: 'var(--text-dim)',
  uncommon: '#94a3b8',
  rare: '#eab308',
  mythic: '#f97316',
  special: '#a78bfa',
  bonus: '#a78bfa',
}

export function CardPage() {
  const { oracleId } = useParams<{ oracleId: string }>()
  const navigate = useNavigate()
  const [card, setCard] = useState<OracleCard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeFace, setActiveFace] = useState(0)
  const [printings, setPrintings] = useState<PrintingResponse[] | null>(null)
  const [selectedPrinting, setSelectedPrinting] = useState<PrintingResponse | null>(null)

  useEffect(() => {
    if (!oracleId) return
    let cancelled = false
    setCard(null)
    setError(null)
    setPrintings(null)
    setSelectedPrinting(null)

    Promise.all([
      getCardById(oracleId),
      getCardPrintings(oracleId, { page_size: 100 }),
    ])
      .then(([c, p]) => {
        if (!cancelled) {
          setCard(c)
          setPrintings(p.results)
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load card')
      })
    return () => { cancelled = true }
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

  const faces = card.card_faces
  const isDfc = faces != null && faces.length === 2
  const currentFace = isDfc ? faces[activeFace] : null
  const imgUrl =
    selectedPrinting?.image_urls.normal ??
    selectedPrinting?.image_urls.art_crop ??
    card.image_urls.normal ??
    card.image_urls.art_crop

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
            {isDfc && (
              <button type="button" className={styles.flipBtn} onClick={() => setActiveFace(activeFace === 0 ? 1 : 0)}>
                ↻ Flip to {faces[activeFace === 0 ? 1 : 0].name}
              </button>
            )}
          </div>

          {/* Info panel */}
          <div className={styles.infoPanel}>
            {isDfc && currentFace ? (
              <>
                <div className={styles.header}>
                  <h1 className={styles.name}>{currentFace.name}</h1>
                  {currentFace.mana_cost && <ManaCost cost={currentFace.mana_cost} size={22} />}
                </div>
                <div className={styles.typeLine}>{currentFace.type_line}</div>
              </>
            ) : (
              <>
                <div className={styles.header}>
                  <h1 className={styles.name}>{card.name}</h1>
                  {card.mana_cost && <ManaCost cost={card.mana_cost} size={22} />}
                </div>
                <div className={styles.typeLine}>{card.type_line}</div>
              </>
            )}

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

            {/* Card text */}
            {isDfc && currentFace ? (
              <>
                {currentFace.oracle_text && (
                  <div className={styles.oracleText}>
                    {currentFace.oracle_text.split('\n').map((line, i) => (
                      <p key={i}><OracleText text={line} /></p>
                    ))}
                  </div>
                )}
                {(currentFace.power != null || currentFace.loyalty != null) && (
                  <div className={styles.statsRow}>
                    {currentFace.power != null && currentFace.toughness != null && (
                      <>
                        <div className={styles.statChip}><span className={styles.statLabel}>Power</span><span className={styles.statValue}>{currentFace.power}</span></div>
                        <div className={styles.statChip}><span className={styles.statLabel}>Toughness</span><span className={styles.statValue}>{currentFace.toughness}</span></div>
                      </>
                    )}
                    {currentFace.loyalty != null && (
                      <div className={styles.statChip}><span className={styles.statLabel}>Loyalty</span><span className={styles.statValue}>{currentFace.loyalty}</span></div>
                    )}
                  </div>
                )}
              </>
            ) : faces ? (
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

      {/* Printings section */}
      {printings != null && printings.length > 0 && (
        <div className={styles.printingsSection}>
          <div className={styles.printingsHeader}>
            <div className={styles.sectionLabel}>Printings ({printings.length})</div>
            {printings.length >= 100 && (
              <span className={styles.printingsNote}>Showing first 100 printings</span>
            )}
          </div>
          <div className={styles.printingsGrid}>
            {printings.map((p) => {
              const isActive = selectedPrinting?.scryfall_id === p.scryfall_id
              const year = p.released_at.slice(0, 4)
              const rarityColor = RARITY_COLORS[p.rarity] ?? 'var(--text-dim)'
              return (
                <button
                  key={p.scryfall_id}
                  type="button"
                  className={`${styles.printing} ${isActive ? styles.printingActive : ''}`}
                  onClick={() => setSelectedPrinting(isActive ? null : p)}
                >
                  <div className={styles.printingSet}>{p.set_name}</div>
                  <div className={styles.printingMeta}>
                    <span>{p.set_code.toUpperCase()}</span>
                    <span className={styles.printingRarity} style={{ color: rarityColor }}>{p.rarity}</span>
                    <span>#{p.collector_number}</span>
                    <span>{year}</span>
                    {p.prices.usd != null && (
                      <span className={styles.printingPrice}>${p.prices.usd}</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
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
      {separator && <div className={styles.faceDivider}>//</div>}
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
