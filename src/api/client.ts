import type {
  OracleCard,
  SearchParams,
  SearchResponse,
  ArtworkResponse,
  RulingsResponse,
  CardSymbol,
} from '../types/card'
import type { DeckSummary, Deck, CreateDeckInput, UpdateDeckInput, DeckLegality } from '../types/deck'
import type { ComboSummary, Combo, CreateComboInput } from '../types/combo'

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
    q: params.q,
    color: params.color,
    color_identity: params.color_identity,
    color_exact: params.color_exact,
    type: params.type,
    cmc: params.cmc,
    cmc_gte: params.cmc_gte,
    cmc_lte: params.cmc_lte,
    keywords: params.keywords,
    legality: params.legality,
    page: params.page,
    page_size: params.page_size,
  })
}

export function getCardByName(name: string): Promise<OracleCard[]> {
  return request<OracleCard[]>('/cards', { name })
}

export function getCardById(oracleId: string): Promise<OracleCard> {
  return request<OracleCard>(`/cards/${oracleId}`)
}

export function getArtwork(scryfallId: string): Promise<ArtworkResponse> {
  return request<ArtworkResponse>(`/artwork/${scryfallId}`)
}

export function getAllPrintings(scryfallId: string): Promise<ArtworkResponse[]> {
  return request<ArtworkResponse[]>(`/artwork/${scryfallId}/printings`)
}

export function getRulings(oracleId: string): Promise<RulingsResponse> {
  return request<RulingsResponse>(`/rulings/${oracleId}`)
}

export function getSymbology(): Promise<CardSymbol[]> {
  return request<CardSymbol[]>('/symbology')
}

// ─── Decks (stubbed — endpoints not yet live) ──────────────────────────────

export function listDecks(): Promise<DeckSummary[]> {
  return request<DeckSummary[]>('/decks')
}

export function getDeck(id: string): Promise<Deck> {
  return request<Deck>(`/decks/${id}`)
}

export function createDeck(input: CreateDeckInput): Promise<Deck> {
  return fetch(`${BASE_URL}/decks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then((r) => r.json() as Promise<Deck>)
}

export function updateDeck(id: string, input: UpdateDeckInput): Promise<Deck> {
  return fetch(`${BASE_URL}/decks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then((r) => r.json() as Promise<Deck>)
}

export function deleteDeck(id: string): Promise<void> {
  return fetch(`${BASE_URL}/decks/${id}`, { method: 'DELETE' }).then(() => undefined)
}

export function getDeckLegality(id: string): Promise<DeckLegality> {
  return request<DeckLegality>(`/decks/${id}/legality`)
}

// ─── Combos (stubbed — endpoints not yet live) ─────────────────────────────

export function listCombos(params?: { q?: string; tags?: string[]; page?: number; page_size?: number }): Promise<{ results: ComboSummary[]; total: number; page: number; page_size: number }> {
  return request('/combos', params as Record<string, string | number | undefined>)
}

export function getCombo(id: string): Promise<Combo> {
  return request<Combo>(`/combos/${id}`)
}

export function createCombo(input: CreateComboInput): Promise<Combo> {
  return fetch(`${BASE_URL}/combos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then((r) => r.json() as Promise<Combo>)
}

export function importSpellbookCombo(spellbookId: string): Promise<Combo> {
  return fetch(`${BASE_URL}/combos/import/commanderspellbook/${spellbookId}`, {
    method: 'POST',
  }).then((r) => r.json() as Promise<Combo>)
}

export function linkComboToDeck(deckId: string, comboId: string): Promise<void> {
  return fetch(`${BASE_URL}/decks/${deckId}/combos/${comboId}`, { method: 'PUT' }).then(() => undefined)
}

export function unlinkComboFromDeck(deckId: string, comboId: string): Promise<void> {
  return fetch(`${BASE_URL}/decks/${deckId}/combos/${comboId}`, { method: 'DELETE' }).then(() => undefined)
}
