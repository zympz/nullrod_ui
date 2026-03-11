import { useState } from 'react'
import type { Color, ColorMode, Format, SearchParams } from '../types/card'
import { ManaSymbol } from './ManaSymbol'
import styles from './SearchFilters.module.css'

const COLORS: Color[] = ['W', 'U', 'B', 'R', 'G']

type FilterColorMode = 'contains' | 'identity' | 'exact'

const FORMATS: Format[] = [
  'standard', 'pioneer', 'modern', 'legacy', 'vintage',
  'commander', 'pauper', 'explorer', 'historic', 'timeless',
]

interface SearchFiltersProps {
  params: SearchParams
  onChange: (params: SearchParams) => void
}

// UI mode → API params
function colorModeToApi(mode: FilterColorMode): { field: 'color' | 'color_identity'; apiMode: ColorMode } {
  if (mode === 'identity') return { field: 'color_identity', apiMode: 'at_most' }
  if (mode === 'exact')    return { field: 'color',          apiMode: 'exactly' }
  return                          { field: 'color',          apiMode: 'at_least' }
}

export function SearchFilters({ params, onChange }: SearchFiltersProps) {
  const [colorMode, setColorMode] = useState<FilterColorMode>('contains')
  const [draft, setDraft] = useState<SearchParams>(() => ({ ...params }))
  const [legalityFormat, setLegalityFormat] = useState<Format | ''>('')

  const activeColors = colorMode === 'identity' ? draft.color_identity : draft.color

  function clearDraftColors(extra?: Partial<SearchParams>): SearchParams {
    return { ...draft, color: undefined, color_mode: undefined, color_identity: undefined, color_identity_mode: undefined, ...extra }
  }

  function toggleColor(c: Color) {
    const { field, apiMode } = colorModeToApi(colorMode)
    const current = (draft[field] as Color[] | undefined) ?? []
    const next = current.includes(c) ? current.filter((x) => x !== c) : [...current, c]
    if (field === 'color_identity') {
      setDraft(clearDraftColors({ color_identity: next.length ? next : undefined, color_identity_mode: next.length ? apiMode : undefined }))
    } else {
      setDraft(clearDraftColors({ color: next.length ? next : undefined, color_mode: next.length ? apiMode : undefined }))
    }
  }

  function switchColorMode(mode: FilterColorMode) {
    const selected = activeColors ?? []
    const { field, apiMode } = colorModeToApi(mode)
    setColorMode(mode)
    setDraft((d) => ({
      ...d,
      color: field === 'color' ? (selected.length ? selected : undefined) : undefined,
      color_mode: field === 'color' && selected.length ? apiMode : undefined,
      color_identity: field === 'color_identity' ? (selected.length ? selected : undefined) : undefined,
      color_identity_mode: field === 'color_identity' && selected.length ? apiMode : undefined,
    }))
  }

  function clearLegality() {
    setDraft((d) => ({ ...d, format: undefined }))
    setLegalityFormat('')
  }

  function apply() {
    onChange({ ...draft, page: 1 })
  }

  function clearAll() {
    const empty: SearchParams = { page: 1 }
    setDraft(empty)
    setColorMode('contains')
    setLegalityFormat('')
    onChange(empty)
  }

  return (
    <div className={styles.filters}>
      <div className={styles.grid}>

        {/* Color */}
        <div className={styles.group}>
          <label className={styles.label}>Color</label>
          <div className={styles.colorRow}>
            {COLORS.map((value) => (
              <button
                key={value}
                className={`${styles.colorBtn} ${(activeColors ?? []).includes(value) ? styles.active : ''}`}
                onClick={() => toggleColor(value)}
                type="button"
                title={value}
              >
                <ManaSymbol symbol={value} size={28} />
              </button>
            ))}
            <select
              className={`${styles.select} ${styles.colorModeSelect}`}
              value={colorMode}
              onChange={(e) => switchColorMode(e.target.value as FilterColorMode)}
            >
              <option value="contains">Contains</option>
              <option value="identity">Identity</option>
              <option value="exact">Exact</option>
            </select>
          </div>
        </div>

        {/* Type */}
        <div className={styles.group}>
          <label className={styles.label}>Type</label>
          <input
            className={styles.input}
            type="text"
            placeholder="Creature, Instant…"
            value={draft.type ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value || undefined }))}
          />
        </div>

        {/* CMC */}
        <div className={styles.group}>
          <label className={styles.label}>CMC</label>
          <div className={styles.row}>
            <input
              className={styles.input}
              type="number"
              min={0}
              step={1}
              placeholder="Min"
              value={draft.cmc_min ?? ''}
              onChange={(e) => { const n = parseFloat(e.target.value); setDraft((d) => ({ ...d, cmc_min: isNaN(n) ? undefined : n })) }}
            />
            <span className={styles.rangeSep}>–</span>
            <input
              className={styles.input}
              type="number"
              min={0}
              max={20}
              step={1}
              placeholder="Max"
              value={draft.cmc_max ?? ''}
              onChange={(e) => { const n = parseFloat(e.target.value); setDraft((d) => ({ ...d, cmc_max: isNaN(n) ? undefined : n })) }}
            />
          </div>
        </div>

        {/* Oracle Text */}
        <div className={styles.group}>
          <label className={styles.label}>Oracle Text</label>
          <input
            className={styles.input}
            type="text"
            placeholder="flying, draw a card…"
            value={draft.oracle_text ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, oracle_text: e.target.value || undefined }))}
          />
        </div>

        {/* Keywords */}
        <div className={styles.group}>
          <label className={styles.label}>Keywords</label>
          <input
            className={styles.input}
            type="text"
            placeholder="Flying, Trample…"
            defaultValue={draft.keywords?.join(', ') ?? ''}
            onBlur={(e) => {
              const kws = e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
              setDraft((d) => ({ ...d, keywords: kws.length ? kws : undefined }))
            }}
          />
        </div>

        {/* Legality / Format */}
        <div className={styles.group}>
          <label className={styles.label}>Format</label>
          <div className={styles.row}>
            <select
              className={`${styles.select} ${styles.selectFull}`}
              value={legalityFormat}
              onChange={(e) => {
                const f = e.target.value as Format | ''
                setLegalityFormat(f)
                setDraft((d) => ({ ...d, format: f || undefined }))
              }}
            >
              <option value="">— none —</option>
              {FORMATS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            {draft.format && (
              <button className={styles.clearBtn} onClick={clearLegality} type="button">✕</button>
            )}
          </div>
        </div>

      </div>

      <div className={styles.applyRow}>
        <button className={styles.clearAllBtn} onClick={clearAll} type="button">Clear</button>
        <button className={styles.applyBtn} onClick={apply} type="button">Apply Filters</button>
      </div>
    </div>
  )
}
