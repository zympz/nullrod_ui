import { useCallback, useState } from 'react'
import type { OracleCard, SearchParams } from '../types/card'
import { searchCards } from '../api/client'
import { SearchFilters } from '../components/SearchFilters'
import { CardGrid } from '../components/CardGrid'
import { CardDetail } from '../components/CardDetail'
import styles from './CardsPage.module.css'

const DEFAULT_PARAMS: SearchParams = { page: 1, page_size: 20 }

export function CardsPage() {
  const [params, setParams] = useState<SearchParams>(DEFAULT_PARAMS)
  const [query, setQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [results, setResults] = useState<OracleCard[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCard, setSelectedCard] = useState<OracleCard | null>(null)
  const [searched, setSearched] = useState(false)

  const runSearch = useCallback(async (p: SearchParams) => {
    setLoading(true)
    setError(null)
    try {
      const res = await searchCards(p)
      setResults(res.results)
      setTotal(res.total)
      setSearched(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
      setResults([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const next = { ...params, name: query || undefined, page: 1 }
    setParams(next)
    runSearch(next)
  }

  function handleParamsChange(next: SearchParams) {
    const merged = { ...next, name: query || undefined }
    setParams(merged)
    runSearch(merged)
  }

  function handlePageChange(page: number) {
    const next = { ...params, page }
    setParams(next)
    runSearch(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const hasFilters = !!(
    params.color?.length ||
    params.color_identity?.length ||
    params.type ||
    params.cmc_min != null ||
    params.cmc_max != null ||
    params.keywords?.length ||
    params.oracle_text ||
    params.format
  )

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Cards</h1>
        <p className={styles.subtitle}>Browse the card database</p>
      </div>

      <form className={styles.searchRow} onSubmit={handleSearch}>
        <input
          className={styles.searchInput}
          type="search"
          placeholder="Search cards…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <button className={styles.searchBtn} type="submit">
          Search
        </button>
        <button
          className={`${styles.filterToggle} ${showFilters || hasFilters ? styles.filterToggleActive : ''}`}
          type="button"
          onClick={() => setShowFilters((v) => !v)}
        >
          Filters{hasFilters ? ' ·' : ''}
        </button>
      </form>

      {showFilters && (
        <SearchFilters params={params} onChange={handleParamsChange} />
      )}

      {loading && <div className={styles.loading}>Searching…</div>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && searched && (
        <CardGrid
          cards={results}
          total={total}
          page={params.page ?? 1}
          pageSize={params.page_size ?? 20}
          onCardClick={setSelectedCard}
          onPageChange={handlePageChange}
        />
      )}

      {!loading && !searched && !error && (
        <div className={styles.welcome}>
          <p>Search for any Magic: The Gathering card.</p>
          <p className={styles.hint}>Try "Lightning Bolt", or use filters to explore by color, type, CMC, and more.</p>
        </div>
      )}

      {selectedCard && (
        <CardDetail card={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </div>
  )
}
