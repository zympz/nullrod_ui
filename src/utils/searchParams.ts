import type { Color, ColorMode, SearchParams } from '../types/card'

export const PAGE_SIZE = 30

export type ViewMode = 'grid' | 'list'

export function paramsToUrl(p: SearchParams, view: ViewMode): Record<string, string> {
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

export function urlToParams(sp: URLSearchParams): SearchParams {
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
  const fmt = sp.get('fmt'); p.format = fmt ?? 'commander'
  const page = sp.get('page'); if (page) p.page = parseInt(page, 10)
  return p
}

export function urlToView(sp: URLSearchParams): ViewMode {
  return sp.get('view') === 'list' ? 'list' : 'grid'
}

export function hasFilters(p: SearchParams): boolean {
  return !!(
    p.color?.length || p.color_identity?.length || p.type ||
    p.cmc_min != null || p.cmc_max != null || p.keywords?.length ||
    p.oracle_text || p.format
  )
}

export function hasSearchCriteria(p: SearchParams): boolean {
  return !!(
    p.name || p.oracle_text || p.color?.length || p.color_identity?.length ||
    p.type || p.cmc_min != null || p.cmc_max != null || p.keywords?.length
  )
}
