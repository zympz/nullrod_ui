import { useCallback, useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Color, ColorMode, OracleCard, SearchParams } from '../types/card'
import { searchCards } from '../api/client'
import { SearchFilters } from '../components/SearchFilters'
import { CardGrid } from '../components/CardGrid'
import { CardList } from '../components/CardList'
import { CardDetail } from '../components/CardDetail'
import styles from './CardsPage.module.css'

const PAGE_SIZE = 30

type ViewMode = 'grid' | 'list'

function paramsToUrl(p: SearchParams, view: ViewMode): Record<string, string> {
  const out: Record<string, string> = {}
  if (p.name) out.q = p.name
  if (p.oracle_text) out.oracle = p.oracle_text
  if (p.color?.length) out.color = p.color.join('')
  if (p.color_mode) out.cm = p.color_mode
  if (p.color_identity?.length) out.ci = p.color_identity.join('')
  if (p.color_identity_mode) out.cim = p.color_identity_mode
  if (p.type) out.type = p.type
  if (p.cmc_min != null) out.cmin = String(p.cmc_min)
  if (p.cmc_max != null) out.cmax = String(p.cmc_max)
  if (p.keywords?.length) out.kw = p.keywords.join(',')
  if (p.format) out.fmt = p.format
  if (p.page && p.page > 1) out.page = String(p.page)
  if (view === 'list') out.view = 'list'
  return out
}

function urlToParams(sp: URLSearchParams): SearchParams {
  const p: SearchParams = { page: 1, page_size: PAGE_SIZE }
  const q = sp.get('q'); if (q) p.name = q
  const oracle = sp.get('oracle'); if (oracle) p.oracle_text = oracle
  const color = sp.get('color'); if (color) p.color = color.split('') as Color[]
  const cm = sp.get('cm'); if (cm) p.color_mode = cm as ColorMode
  const ci = sp.get('ci'); if (ci) p.color_identity = ci.split('') as Color[]
  const cim = sp.get('cim'); if (cim) p.color_identity_mode = cim as ColorMode
  const type = sp.get('type'); if (type) p.type = type
  const cmin = sp.get('cmin'); if (cmin) p.cmc_min = parseFloat(cmin)
  const cmax = sp.get('cmax'); if (cmax) p.cmc_max = parseFloat(cmax)
  const kw = sp.get('kw'); if (kw) p.keywords = kw.split(',').map(s => s.trim()).filter(Boolean)
  const fmt = sp.get('fmt'); if (fmt) p.format = fmt
  const page = sp.get('page'); if (page) p.page = parseInt(page, 10)
  return p
}

function urlToView(sp: URLSearchParams): ViewMode {
  return sp.get('view') === 'list' ? 'list' : 'grid'
}

function hasSearchCriteria(p: SearchParams): boolean {
  return !!(
    p.name || p.oracle_text || p.color?.length || p.color_identity?.length ||
    p.type || p.cmc_min != null || p.cmc_max != null || p.keywords?.length || p.format
  )
}

export function CardsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialParams = urlToParams(searchParams)
  const [params, setParams] = useState<SearchParams>(initialParams)
  const [query, setQuery] = useState(initialParams.name ?? '')
  const [viewMode, setViewMode] = useState<ViewMode>(urlToView(searchParams))
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

  // Sync state from URL params (handles initial load, back/forward, manual URL edits)
  const prevSearch = useRef(searchParams.toString())
  useEffect(() => {
    const current = searchParams.toString()
    const isInitial = prevSearch.current === current && !searched
    const isExternal = prevSearch.current !== current
    prevSearch.current = current

    if (isInitial || isExternal) {
      const p = urlToParams(searchParams)
      setParams(p)
      setQuery(p.name ?? '')
      setViewMode(urlToView(searchParams))
      if (hasSearchCriteria(p)) {
        const view = urlToView(searchParams)
        runSearch(view === 'list' ? { ...p, view: 'list' } : p)
        if (!p.name && (p.color?.length || p.color_identity?.length || p.type || p.cmc_min != null || p.cmc_max != null || p.keywords?.length || p.oracle_text || p.format)) {
          setShowFilters(true)
        }
      }
    }
  }, [searchParams, searched, runSearch])

  function updateUrl(p: SearchParams, view: ViewMode) {
    setSearchParams(paramsToUrl(p, view), { replace: true })
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const next = { ...params, name: query || undefined, page: 1, view: viewMode === 'list' ? 'list' as const : undefined }
    setParams(next)
    updateUrl(next, viewMode)
    runSearch(next)
  }

  function handleParamsChange(next: SearchParams) {
    const merged = { ...next, name: query || undefined, view: viewMode === 'list' ? 'list' as const : undefined }
    setParams(merged)
    updateUrl(merged, viewMode)
    runSearch(merged)
  }

  function handlePageChange(page: number) {
    const next = { ...params, page, view: viewMode === 'list' ? 'list' as const : undefined }
    setParams(next)
    updateUrl(next, viewMode)
    runSearch(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleViewChange(view: ViewMode) {
    setViewMode(view)
    if (searched) {
      const next = { ...params, view: view === 'list' ? 'list' as const : undefined }
      updateUrl(next, view)
      runSearch(next)
    }
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
        <div className={styles.viewToggle}>
          <button
            className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`}
            type="button"
            onClick={() => handleViewChange('grid')}
            title="Grid view"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="1" width="6" height="6" rx="1" />
              <rect x="9" y="1" width="6" height="6" rx="1" />
              <rect x="1" y="9" width="6" height="6" rx="1" />
              <rect x="9" y="9" width="6" height="6" rx="1" />
            </svg>
          </button>
          <button
            className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : ''}`}
            type="button"
            onClick={() => handleViewChange('list')}
            title="List view"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="1.5" width="14" height="3" rx="1" />
              <rect x="1" y="6.5" width="14" height="3" rx="1" />
              <rect x="1" y="11.5" width="14" height="3" rx="1" />
            </svg>
          </button>
        </div>
      </form>

      {showFilters && (
        <SearchFilters params={params} onChange={handleParamsChange} />
      )}

      {loading && <div className={styles.loading}>Searching…</div>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && searched && viewMode === 'grid' && (
        <CardGrid
          cards={results}
          total={total}
          page={params.page ?? 1}
          pageSize={params.page_size ?? PAGE_SIZE}
          onCardClick={setSelectedCard}
          onPageChange={handlePageChange}
        />
      )}

      {!loading && searched && viewMode === 'list' && (
        <CardList
          cards={results}
          total={total}
          page={params.page ?? 1}
          pageSize={params.page_size ?? PAGE_SIZE}
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
