import type {
  OracleCard,
  SearchParams,
  SearchResponse,
  SearchListResponse,
  PrintingResponse,
  PrintingsResponse,
  CardSymbol,
} from '../types/card'
import type { DeckListResponse, Deck, ImportDeckInput } from '../types/deck'
import type { ComboListResponse, Combo } from '../types/combo'

const BASE_URL = 'https://api.nullrod.com'

async function request<T>(
  path: string,
  params?: Record<string, string | string[] | number | boolean | undefined>,
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`)

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue
      if (Array.isArray(value)) {
        value.forEach((v) => url.searchParams.append(key, v))
      } else {
        url.searchParams.set(key, String(value))
      }
    }
  }

  const res = await fetch(url.toString())
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export function searchCards(params: SearchParams): Promise<SearchResponse> {
  return request<SearchResponse>('/cards/search', {
    q: params.name,
    oracle_text: params.oracle_text,
    color: params.color,
    color_mode: params.color_mode,
    color_identity: params.color_identity,
    color_identity_mode: params.color_identity_mode,
    type: params.type,
    cmc_min: params.cmc_min,
    cmc_max: params.cmc_max,
    keywords: params.keywords,
    format: params.format,
    include_non_legal: params.include_non_legal,
    include_extras: params.include_extras,
    order: params.order,
    dir: params.dir,
    page: params.page,
    page_size: params.page_size,
  })
}

export function searchCardsList(params: SearchParams): Promise<SearchListResponse> {
  return request<SearchListResponse>('/cards/search', {
    q: params.name,
    oracle_text: params.oracle_text,
    color: params.color,
    color_mode: params.color_mode,
    color_identity: params.color_identity,
    color_identity_mode: params.color_identity_mode,
    type: params.type,
    cmc_min: params.cmc_min,
    cmc_max: params.cmc_max,
    keywords: params.keywords,
    format: params.format,
    include_non_legal: params.include_non_legal,
    include_extras: params.include_extras,
    order: params.order,
    dir: params.dir,
    page: params.page,
    page_size: params.page_size,
    view: 'list',
  })
}

export function getCardById(oracleId: string): Promise<OracleCard> {
  return request<OracleCard>(`/cards/${oracleId}`)
}

// Exact name match — uses `name` param for precise lookup
export function searchCardByName(name: string): Promise<SearchResponse> {
  return request<SearchResponse>('/cards/search', { name })
}

export function getCardPrintings(
  oracleId: string,
  params?: { page?: number; page_size?: number },
): Promise<PrintingsResponse> {
  return request<PrintingsResponse>(`/cards/${oracleId}/printings`, params as Record<string, number | undefined>)
}

export function getCardByScryfall(scryfallId: string): Promise<PrintingResponse> {
  return request<PrintingResponse>(`/cards/scryfall/${scryfallId}`)
}

export function getSymbology(): Promise<CardSymbol[]> {
  return request<CardSymbol[]>('/cards/symbols')
}

// ─── Decks ──────────────────────────────────────────────────────────────────

export function listDecks(params?: { page?: number; page_size?: number; format?: string }): Promise<DeckListResponse> {
  return request<DeckListResponse>('/decks', params as Record<string, string | number | undefined>)
}

export function getDeck(id: string): Promise<Deck> {
  return request<Deck>(`/decks/${id}`)
}

export async function importDeck(input: ImportDeckInput): Promise<Deck> {
  const res = await fetch(`${BASE_URL}/decks/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`)
  return res.json() as Promise<Deck>
}

// ─── Combos ─────────────────────────────────────────────────────────────────

export function listCombos(params?: { identity?: string; page?: number; page_size?: number }): Promise<ComboListResponse> {
  return request<ComboListResponse>('/combos', params as Record<string, string | number | undefined>)
}

export function getCombo(id: string): Promise<Combo> {
  return request<Combo>(`/combos/${id}`)
}
