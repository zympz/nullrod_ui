import { useState } from 'react'
import type { ColorDistEntry, ManaProdEntry, ManaCurveEntry, DeckAnalysis } from '../../utils/deckUtils'
import { pAtLeastOne } from '../../utils/deckUtils'
import { ManaCost } from '../ManaSymbol'
import styles from '../../pages/DeckPage.module.css'

const TURNS = [1, 2, 3, 4, 5]

interface DeckStatsProps {
  colorDist: ColorDistEntry[]
  manaProd: ManaProdEntry[]
  deckSize: number
  manaCurve: ManaCurveEntry[]
  analysis: DeckAnalysis
}

export function DeckStats({ colorDist, manaProd, deckSize, manaCurve, analysis }: DeckStatsProps) {
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
          <div className={styles.statBlock}>
            <div className={styles.statLabel}>Mana Curve <span className={styles.infoIcon} title="Distribution of spells by mana value, excluding lands.">i</span></div>
            <div className={styles.curveBar}>
              {manaCurve.map(({ label, count }) => (
                <div key={label} className={styles.curveColumn}>
                  <span className={styles.curveCount}>{count || ''}</span>
                  <div className={styles.curveTrack}>
                    <div className={styles.curveFill} style={{ height: `${maxCurveCount > 0 ? (count / maxCurveCount) * 100 : 0}%` }} />
                  </div>
                  <span className={styles.curveLabel}>{label}</span>
                </div>
              ))}
            </div>
          </div>

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
