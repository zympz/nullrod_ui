import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Combo } from '../types/combo'
import type { Color } from '../types/card'
import { getCombo } from '../api/client'
import { ColorPips } from '../components/ColorPips'
import styles from './ComboPage.module.css'

const BRACKET_LABELS: Record<string, string> = {
  E: 'Extra Spicy',
  S: 'Spicy',
  R: 'Regular',
  P: 'Precon',
}

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
                  {use.zone_locations.join(', ')}
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
        {(combo.requires.length > 0 || combo.notable_prerequisites || combo.easy_prerequisites || combo.mana_needed) && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Prerequisites</div>
            {combo.requires.length > 0 && (
              <ul className={styles.prereqList}>
                {combo.requires.map((req, i) => (
                  <li key={i} className={styles.prereq}>
                    {req.name}
                    <span className={styles.prereqZone}>
                      ({req.zone_locations.join(', ')})
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {combo.notable_prerequisites && (
              <ul className={styles.prereqList}>
                {combo.notable_prerequisites.split('\n').filter(Boolean).map((p, i) => (
                  <li key={i} className={styles.prereq}>{p}</li>
                ))}
              </ul>
            )}
            {combo.easy_prerequisites && (
              <ul className={styles.prereqList}>
                {combo.easy_prerequisites.split('\n').filter(Boolean).map((p, i) => (
                  <li key={i} className={styles.prereq}>{p}</li>
                ))}
              </ul>
            )}
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
