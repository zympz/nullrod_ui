import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { DeckSummary } from '../types/deck'
import { listDecks, importDeck } from '../api/client'
import { ColorPips } from '../components/ColorPips'
import { identityColors } from '../constants'
import styles from './DecksPage.module.css'

const PAGE_SIZE = 20

export function DecksPage() {
  const navigate = useNavigate()
  const [decks, setDecks] = useState<DeckSummary[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Import form state
  const [showImport, setShowImport] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const fetchDecks = useCallback(async (p: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await listDecks({ page: p, page_size: PAGE_SIZE })
      setDecks(res.results)
      setTotal(res.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load decks')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDecks(page)
  }, [page, fetchDecks])

  function handlePageChange(next: number) {
    setPage(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault()
    if (!importUrl.trim()) return
    setImporting(true)
    setImportError(null)
    try {
      const deck = await importDeck({ url: importUrl.trim() })
      setImportUrl('')
      setShowImport(false)
      navigate(`/decks/${deck.id}`)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Decks</h1>
        <p className={styles.subtitle}>Browse and import decks</p>
      </div>

      <div className={styles.toolbar}>
        <button
          className={styles.importBtn}
          type="button"
          onClick={() => setShowImport((v) => !v)}
        >
          Import from Moxfield
        </button>
      </div>

      {showImport && (
        <form className={styles.importForm} onSubmit={handleImport}>
          <input
            className={styles.importInput}
            type="text"
            placeholder="Moxfield URL or deck ID..."
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            autoFocus
          />
          <button
            className={styles.importSubmit}
            type="submit"
            disabled={importing || !importUrl.trim()}
          >
            {importing ? 'Importing...' : 'Import'}
          </button>
          <button
            className={styles.importCancel}
            type="button"
            onClick={() => { setShowImport(false); setImportError(null) }}
          >
            Cancel
          </button>
        </form>
      )}

      {importError && <div className={styles.error}>{importError}</div>}
      {error && <div className={styles.error}>{error}</div>}
      {loading && <div className={styles.loading}>Loading decks...</div>}

      {!loading && decks.length === 0 && !error && (
        <div className={styles.empty}>No decks yet. Import one from Moxfield to get started.</div>
      )}

      {!loading && decks.length > 0 && (
        <>
          <div className={styles.meta}>
            {total} deck{total !== 1 ? 's' : ''} — page {page} of {totalPages}
          </div>
          <div className={styles.list}>
            <div className={styles.listHeader}>
              <span>Name</span>
              <span>Format</span>
              <span>Commander</span>
              <span>Colors</span>
            </div>
            {decks.map((deck) => (
              <div key={deck.id} className={styles.listRow}>
                <span className={styles.colName}>
                  <Link to={`/decks/${deck.id}`} className={styles.nameLink}>
                    {deck.name}
                  </Link>
                </span>
                <span className={styles.colFormat}>{deck.format}</span>
                <span className={styles.colCommanders}>
                  {deck.commanders.join(', ') || '—'}
                </span>
                <span className={styles.colColors}><ColorPips colors={identityColors(deck.color_identity.join(''))} size={12} /></span>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
                type="button"
              >
                ← Prev
              </button>
              <span className={styles.pageInfo}>{page} / {totalPages}</span>
              <button
                className={styles.pageBtn}
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
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
