import { useState } from 'react'
import type { Color, Format, SearchParams } from '../types/card'
import { ManaSymbol } from './ManaSymbol'
import styles from './SearchFilters.module.css'

const COLORS: Color[] = ['W', 'U', 'B', 'R', 'G']

type ColorMode = 'color' | 'color_identity' | 'color_exact'

const FORMATS: Format[] = [
  'standard', 'pioneer', 'modern', 'legacy', 'vintage',
  'commander', 'pauper', 'explorer', 'historic', 'timeless',
]

interface SearchFiltersProps {
  params: SearchParams
  onChange: (params: SearchParams) => void
}

export function SearchFilters({ params, onChange }: SearchFiltersProps) {
  const [colorMode, setColorMode] = useState<ColorMode>('color')
  const [draft, setDraft] = useState<SearchParams>(() => ({ ...params }))
  const [legalityFormat, setLegalityFormat] = useState<Format>('modern')
  const [legalityStatus, setLegalityStatus] = useState<'legal' | 'not_legal' | 'restricted' | 'banned'>('legal')

  function clearDraftColors(extra?: Partial<SearchParams>): SearchParams {
    return { ...draft, color: undefined, color_identity: undefined, color_exact: undefined, color_identity_exact: undefined, colorless: undefined, ...extra }
  }

  function toggleColor(c: Color) {
    if (colorMode === 'color_identity') {
      const current = draft.color_identity ?? []
      const next = current.includes(c) ? current.filter((x) => x !== c) : [...current, c]
      setDraft(clearDraftColors({ color_identity: next.length ? next : undefined, color_identity_exact: true }))
    } else if (colorMode === 'color_exact') {
      const current = draft.color ?? []
      const next = current.includes(c) ? current.filter((x) => x !== c) : [...current, c]
      setDraft(clearDraftColors({ color: next.length ? next : undefined, color_exact: true }))
    } else {
      const current = draft.color ?? []
      const next = current.includes(c) ? current.filter((x) => x !== c) : [...current, c]
      setDraft(clearDraftColors({ color: next.length ? next : undefined }))
    }
  }

  function toggleColorless() {
    const next = !draft.colorless
    setDraft(clearDraftColors({ colorless: next ? true : undefined, color_exact: true }))
  }

  function switchColorMode(mode: ColorMode) {
    setColorMode(mode)
    setDraft((d) => ({ ...d, color: undefined, color_identity: undefined, color_exact: undefined, color_identity_exact: undefined, colorless: undefined }))
  }

  function setLegality() {
    setDraft((d) => ({ ...d, legality: `${legalityFormat}:${legalityStatus}` }))
  }

  function clearLegality() {
    setDraft((d) => ({ ...d, legality: undefined }))
  }

  function apply() {
    onChange({ ...draft, page: 1 })
  }

  return (
    <div className={styles.filters}>
      <div className={styles.grid}>

        {/* Color */}
        <div className={styles.group}>
          <label className={styles.label}>Color</label>
          <div className={styles.colorRow}>
            {COLORS.map((value) => {
              const selected = (colorMode === 'color_identity' ? draft.color_identity : draft.color) ?? []
              const isActive = selected.includes(value) && !draft.colorless
              return (
                <button
                  key={value}
                  className={`${styles.colorBtn} ${isActive ? styles.active : ''}`}
                  onClick={() => toggleColor(value)}
                  type="button"
                  title={value}
                >
                  <ManaSymbol symbol={value} size={28} />
                </button>
              )
            })}
            {colorMode === 'color_exact' && (
              <button
                className={`${styles.colorBtn} ${draft.colorless ? styles.active : ''}`}
                onClick={toggleColorless}
                type="button"
                title="Colorless"
              >
                <ManaSymbol symbol="C" size={28} />
              </button>
            )}
          </div>
          <div className={styles.modeToggle}>
            <button className={`${styles.modeBtn} ${colorMode === 'color' ? styles.modeBtnActive : ''}`} onClick={() => switchColorMode('color')} type="button">Contains</button>
            <button className={`${styles.modeBtn} ${colorMode === 'color_identity' ? styles.modeBtnActive : ''}`} onClick={() => switchColorMode('color_identity')} type="button">Identity</button>
            <button className={`${styles.modeBtn} ${colorMode === 'color_exact' ? styles.modeBtnActive : ''}`} onClick={() => switchColorMode('color_exact')} type="button">Exact</button>
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
              value={draft.cmc_gte ?? ''}
              onChange={(e) => { const n = parseFloat(e.target.value); setDraft((d) => ({ ...d, cmc_gte: isNaN(n) ? undefined : n })) }}
            />
            <span className={styles.rangeSep}>–</span>
            <input
              className={styles.input}
              type="number"
              min={0}
              max={20}
              step={1}
              placeholder="Max"
              value={draft.cmc_lte ?? ''}
              onChange={(e) => { const n = parseFloat(e.target.value); setDraft((d) => ({ ...d, cmc_lte: isNaN(n) ? undefined : n })) }}
            />
          </div>
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

        {/* Legality */}
        <div className={`${styles.group} ${styles.groupWide}`}>
          <label className={styles.label}>Legality</label>
          <div className={styles.row}>
            <select
              className={styles.select}
              value={legalityFormat}
              onChange={(e) => setLegalityFormat(e.target.value as Format)}
            >
              {FORMATS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <select
              className={styles.select}
              value={legalityStatus}
              onChange={(e) => setLegalityStatus(e.target.value as typeof legalityStatus)}
            >
              <option value="legal">Legal</option>
              <option value="not_legal">Not Legal</option>
              <option value="restricted">Restricted</option>
              <option value="banned">Banned</option>
            </select>
            <button className={styles.setBtn} onClick={setLegality} type="button">Set</button>
            {draft.legality && (
              <button className={styles.clearBtn} onClick={clearLegality} type="button">✕</button>
            )}
          </div>
          {draft.legality && (
            <div className={styles.legalityBadge}>{draft.legality}</div>
          )}
        </div>

      </div>

      <div className={styles.applyRow}>
        <button className={styles.applyBtn} onClick={apply} type="button">Apply Filters</button>
      </div>
    </div>
  )
}
