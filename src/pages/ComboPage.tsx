import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Combo } from '../types/combo'
import type { Color } from '../types/card'
import { getCombo } from '../api/client'
import { ColorPips } from '../components/ColorPips'
import styles from './ComboPage.module.css'

const ZONE_LABELS: Record<string, string> = {
  B: 'Battlefield',
  H: 'Hand',
  G: 'Graveyard',
  L: 'Library',
  E: 'Exile',
  C: 'Command Zone',
}

const BRACKET_LABELS: Record<string, string> = {
  E: 'Extra Spicy',
  S: 'Spicy',
  R: 'Regular',
  P: 'Precon',
}

const LEGALITY_ORDER = [
  'commander', 'legacy', 'vintage', 'modern', 'pioneer',
  'standard', 'pauper', 'oathbreaker', 'brawl',
] as const

export function ComboPage() {
  const { comboId } = useParams<{ comboId: string }>()
  const navigate = useNavigate()
  const [combo, setCombo] = useState<Combo | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!comboId) return
    let cancelled = false
    setCombo(null)
    setError(null)
    getCombo(comboId)
      .then((c) => { if (!cancelled) setCombo(c) })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load combo')
      })
    return () => { cancelled = true }
  }, [comboId])

  if (error) {
    return (
      <div className={styles.page}>
        <button className={styles.back} onClick={() => navigate(-1)} type="button">&larr; Back to combos</button>
        <div className={styles.error}>{error}</div>
      </div>
    )
  }

  if (!combo) {
    return (
      <div className={styles.page}>
        <button className={styles.back} onClick={() => navigate(-1)} type="button">&larr; Back to combos</button>
        <div className={styles.loading}>Loading combo&hellip;</div>
      </div>
    )
  }

  const steps = combo.description.split('\n').filter(Boolean)

  return (
    <div className={styles.page}>
      <button className={styles.back} onClick={() => navigate(-1)} type="button">&larr; Back to combos</button>

      <div className={styles.header}>
        <h1 className={styles.title}>{combo.card_names.join(' + ')}</h1>
        <div className={styles.headerMeta}>
          <ColorPips colors={combo.identity.split('') as Color[]} size={18} />
          <span className={`${styles.bracketBadge} ${styles[`bracket_${combo.bracket_tag}`]}`}>
            {BRACKET_LABELS[combo.bracket_tag] ?? combo.bracket_tag}
          </span>
          <span className={styles.popularity}>{combo.popularity.toLocaleString()} decks</span>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Cards */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Cards</div>
          <div className={styles.cardGrid}>
            {combo.uses.map((use) => (
              <div key={use.card.oracle_id} className={styles.comboCardTile}>
                {use.card.image_url ? (
                  <img src={use.card.image_url} alt={use.card.name} className={styles.cardImg} />
                ) : (
                  <div className={styles.cardImgEmpty}>{use.card.name}</div>
                )}
                <div className={styles.cardZone}>
                  {use.zone_locations.map((z) => ZONE_LABELS[z] ?? z).join(', ')}
                  {use.must_be_commander && ' (Commander)'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Steps</div>
          <ol className={styles.steps}>
            {steps.map((step, i) => (
              <li key={i} className={styles.step}>{step}</li>
            ))}
          </ol>
        </div>

        {/* Prerequisites */}
        {combo.requires.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Prerequisites</div>
            <ul className={styles.prereqList}>
              {combo.requires.map((req, i) => (
                <li key={i} className={styles.prereq}>
                  {req.name}
                  <span className={styles.prereqZone}>
                    ({req.zone_locations.map((z) => ZONE_LABELS[z] ?? z).join(', ')})
                  </span>
                </li>
              ))}
            </ul>
            {combo.mana_needed && (
              <div className={styles.manaCost}>Mana needed: {combo.mana_needed}</div>
            )}
          </div>
        )}

        {/* Results */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Produces</div>
          <div className={styles.producesList}>
            {combo.produces.map((p) => (
              <span key={p.name} className={styles.producesTag}>{p.name}</span>
            ))}
          </div>
        </div>

        {/* Legalities */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Legality</div>
          <div className={styles.legalities}>
            {LEGALITY_ORDER.map((fmt) => {
              const legal = combo.legalities[fmt] ?? false
              return (
                <div key={fmt} className={`${styles.legalityRow} ${legal ? styles.legalYes : styles.legalNo}`}>
                  <span className={styles.format}>{fmt}</span>
                  <span className={styles.legalityStatus}>{legal ? 'legal' : 'not legal'}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Prices */}
        {combo.prices && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Prices</div>
            <div className={styles.prices}>
              {combo.prices.tcgplayer && <span className={styles.price}>TCGplayer: ${combo.prices.tcgplayer}</span>}
              {combo.prices.cardkingdom && <span className={styles.price}>Card Kingdom: ${combo.prices.cardkingdom}</span>}
              {combo.prices.cardmarket && <span className={styles.price}>Cardmarket: €{combo.prices.cardmarket}</span>}
            </div>
          </div>
        )}

        {combo.notes && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Notes</div>
            <p className={styles.notes}>{combo.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
