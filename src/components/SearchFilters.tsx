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
  const [legalityFormat, setLegalityFormat] = useState<Format>('modern')
  const [legalityStatus, setLegalityStatus] = useState<'legal' | 'not_legal' | 'restricted' | 'banned'>('legal')
  const [colorMode, setColorMode] = useState<ColorMode>('color')

  function toggleColor(c: Color) {
    const current = (colorMode === 'color_identity' ? params.color_identity : params.color) ?? []
    const next = current.includes(c) ? current.filter((x) => x !== c) : [...current, c]
    if (colorMode === 'color_identity') {
      onChange({ ...params, color_identity: next.length ? next : undefined, color: undefined, color_exact: undefined, page: 1 })
    } else if (colorMode === 'color_exact') {
      onChange({ ...params, color: next.length ? next : undefined, color_exact: next.length ? true : undefined, color_identity: undefined, page: 1 })
    } else {
      onChange({ ...params, color: next.length ? next : undefined, color_exact: undefined, color_identity: undefined, page: 1 })
    }
  }

  function switchColorMode(mode: ColorMode) {
    setColorMode(mode)
    onChange({ ...params, color: undefined, color_identity: undefined, color_exact: undefined, page: 1 })
  }

  function setType(v: string) {
    onChange({ ...params, type: v || undefined, page: 1 })
  }

  function setCmcGte(v: string) {
    const n = parseFloat(v)
    onChange({ ...params, cmc_gte: isNaN(n) ? undefined : n, page: 1 })
  }

  function setCmcLte(v: string) {
    const n = parseFloat(v)
    onChange({ ...params, cmc_lte: isNaN(n) ? undefined : n, page: 1 })
  }

  function setKeywords(v: string) {
    const kws = v.split(',').map((s) => s.trim()).filter(Boolean)
    onChange({ ...params, keywords: kws.length ? kws : undefined, page: 1 })
  }

  function applyLegality() {
    onChange({ ...params, legality: `${legalityFormat}:${legalityStatus}`, page: 1 })
  }

  function clearLegality() {
    onChange({ ...params, legality: undefined, page: 1 })
  }

  return (
    <div className={styles.filters}>
      <div className={styles.group}>
        <label className={styles.label}>Color</label>
        <div className={styles.colorRow}>
          {COLORS.map((value) => (
            <button
              key={value}
              className={`${styles.colorBtn} ${((colorMode === 'color' ? params.color : params.color_identity) ?? []).includes(value) ? styles.active : ''}`}
              onClick={() => toggleColor(value)}
              type="button"
              title={value}
            >
              <ManaSymbol symbol={value} size={28} />
            </button>
          ))}
        </div>
        <div className={styles.modeToggle}>
          <button
            className={`${styles.modeBtn} ${colorMode === 'color' ? styles.modeBtnActive : ''}`}
            onClick={() => switchColorMode('color')}
            type="button"
          >Contains</button>
          <button
            className={`${styles.modeBtn} ${colorMode === 'color_identity' ? styles.modeBtnActive : ''}`}
            onClick={() => switchColorMode('color_identity')}
            type="button"
          >Identity</button>
          <button
            className={`${styles.modeBtn} ${colorMode === 'color_exact' ? styles.modeBtnActive : ''}`}
            onClick={() => switchColorMode('color_exact')}
            type="button"
          >Exact</button>
        </div>
      </div>

      <div className={styles.group}>
        <label className={styles.label}>Type</label>
        <input
          className={styles.input}
          type="text"
          placeholder="Creature, Instant…"
          value={params.type ?? ''}
          onChange={(e) => setType(e.target.value)}
        />
      </div>

      <div className={styles.group}>
        <label className={styles.label}>CMC</label>
        <div className={styles.row}>
          <input
            className={styles.input}
            type="number"
            min={0}
            step={1}
            placeholder="Min"
            value={params.cmc_gte ?? ''}
            onChange={(e) => setCmcGte(e.target.value)}
          />
          <span className={styles.rangeSep}>–</span>
          <input
            className={styles.input}
            type="number"
            min={0}
            max={20}
            step={1}
            placeholder="Max"
            value={params.cmc_lte ?? ''}
            onChange={(e) => setCmcLte(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.group}>
        <label className={styles.label}>Keywords</label>
        <input
          className={styles.input}
          type="text"
          placeholder="Flying, Trample…"
          defaultValue={params.keywords?.join(', ') ?? ''}
          onBlur={(e) => setKeywords(e.target.value)}
        />
      </div>

      <div className={styles.group}>
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
          <button className={styles.applyBtn} onClick={applyLegality} type="button">Apply</button>
          {params.legality && (
            <button className={styles.clearBtn} onClick={clearLegality} type="button">✕</button>
          )}
        </div>
        {params.legality && (
          <div className={styles.legalityBadge}>{params.legality}</div>
        )}
      </div>
    </div>
  )
}
