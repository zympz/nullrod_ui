import { useCallback, useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { OracleCard, CardListItem, SearchParams } from '../types/card'
import { searchCards, searchCardsList, getCardPrintings } from '../api/client'
import { SearchFilters } from '../components/SearchFilters'
import { CardGrid } from '../components/CardGrid'
import { CardList } from '../components/CardList'
import { CardDetail } from '../components/CardDetail'
import { paramsToUrl, urlToParams, urlToView, hasFilters, hasSearchCriteria, PAGE_SIZE } from '../utils/searchParams'
import type { ViewMode } from '../utils/searchParams'
import styles from './CardsPage.module.css'

export function CardsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialParams = urlToParams(searchParams)
  const [params, setParams] = useState<SearchParams>(initialParams)
  const [query, setQuery] = useState(initialParams.name ?? '')
  const [viewMode, setViewMode] = useState<ViewMode>(urlToView(searchParams))
  const [showFilters, setShowFilters] = useState(false)
  const [results, setResults] = useState<OracleCard[]>([])
  const [listItems, setListItems] = useState<CardListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCard, setSelectedCard] = useState<OracleCard | null>(null)
  const [searched, setSearched] = useState(false)

  const runSearch = useCallback(async (p: SearchParams, view: ViewMode) => {
    setLoading(true)
    setError(null)
    try {
      if (view === 'list') {
        const res = await searchCardsList(p)
        setListItems(res.results)
        setResults([])
        setTotal(res.total)
      } else {
        const res = await searchCards(p)
        setTotal(res.total)
        setListItems([])
        // Enrich cards with image URLs from printings (search endpoint returns empty image_urls)
        const enriched = await Promise.all(
          res.results.map(async (card) => {
            if (card.image_urls.normal ?? card.image_urls.art_crop) return card
            try {
              const printings = await getCardPrintings(card.oracle_id, { page_size: 1 })
              const p = printings.results[0]
              if (!p) return card
              return { ...card, image_urls: { ...card.image_urls, normal: p.image_urls.normal, art_crop: p.image_urls.art_crop } }
            } catch {
              return card
            }
          })
        )
        setResults(enriched)
      }
      setSearched(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
      setResults([])
      setListItems([])
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
      const view = urlToView(searchParams)
      setViewMode(view)
      if (hasSearchCriteria(p)) {
        runSearch(p, view)
        if (!p.name && hasFilters(p)) setShowFilters(true)
      }
    }
  }, [searchParams, searched, runSearch])

  function updateUrl(p: SearchParams, view: ViewMode) {
    setSearchParams(paramsToUrl(p, view), { replace: true })
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const next = { ...params, name: query || undefined, page: 1 }
    setParams(next)
    updateUrl(next, viewMode)
    runSearch(next, viewMode)
  }

  function handleParamsChange(next: SearchParams) {
    const merged = { ...next, name: query || undefined }
    setParams(merged)
    updateUrl(merged, viewMode)
    runSearch(merged, viewMode)
  }

  function handlePageChange(page: number) {
    const next = { ...params, page }
    setParams(next)
    updateUrl(next, viewMode)
    runSearch(next, viewMode)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleViewChange(view: ViewMode) {
    setViewMode(view)
    if (searched) {
      updateUrl(params, view)
      runSearch(params, view)
    }
  }

  const activeFilters = hasFilters(params)

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
          className={`${styles.filterToggle} ${showFilters || activeFilters ? styles.filterToggleActive : ''}`}
          type="button"
          onClick={() => setShowFilters((v) => !v)}
        >
          Filters{activeFilters ? ' ·' : ''}
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
          cards={listItems}
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
