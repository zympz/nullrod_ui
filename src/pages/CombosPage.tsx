import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ComboSummary } from '../types/combo'
import { listCombos } from '../api/client'
import { ColorPips } from '../components/ColorPips'
import { BRACKET_LABELS, identityColors } from '../constants'
import styles from './CombosPage.module.css'

const PAGE_SIZE = 20

const IDENTITY_OPTIONS = ['', 'W', 'U', 'B', 'R', 'G', 'WU', 'UB', 'BR', 'RG', 'GW', 'WB', 'UR', 'BG', 'RW', 'GU'] as const

export function CombosPage() {
  const [combos, setCombos] = useState<ComboSummary[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [identity, setIdentity] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    const params: { page: number; page_size: number; identity?: string } = { page, page_size: PAGE_SIZE }
    if (identity) params.identity = identity
    listCombos(params)
      .then((res) => {
        if (cancelled) return
        setCombos(res.results)
        setTotal(res.total)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load combos')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [page, identity])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Combos</h1>
        <p className={styles.subtitle}>
          {loading ? 'Loading…' : `${total.toLocaleString()} combos in the database`}
        </p>
      </div>

      <div className={styles.filters}>
        <label className={styles.filterLabel}>
          Color Identity
          <select
            className={styles.filterSelect}
            value={identity}
            onChange={(e) => { setIdentity(e.target.value); setPage(1) }}
          >
            <option value="">All</option>
            {IDENTITY_OPTIONS.filter(Boolean).map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        </label>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Loading combos&hellip;</div>
      ) : combos.length === 0 ? (
        <div className={styles.empty}>No combos found</div>
      ) : (
        <>
          <div className={styles.list}>
            {combos.map((combo) => (
              <Link key={combo.id} to={`/combos/${combo.id}`} className={styles.comboCard}>
                <div className={styles.comboHeader}>
                  <span className={styles.comboNames}>{combo.card_names.join(' + ')}</span>
                  <span className={`${styles.bracketBadge} ${styles[`bracket_${combo.bracket_tag}`]}`}>
                    {BRACKET_LABELS[combo.bracket_tag] ?? combo.bracket_tag}
                  </span>
                </div>
                <div className={styles.comboProduces}>
                  {combo.produces.map((p) => (
                    <span key={p.name} className={styles.producesTag}>{p.name}</span>
                  ))}
                </div>
                <div className={styles.comboMeta}>
                  <ColorPips colors={identityColors(combo.identity)} size={14} />
                  <span className={styles.cardCount}>{combo.card_names.length} cards</span>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                type="button"
              >
                ← Prev
              </button>
              <span className={styles.pageInfo}>{page} / {totalPages}</span>
              <button
                className={styles.pageBtn}
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                type="button"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
