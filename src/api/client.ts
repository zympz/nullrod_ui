import type {
  OracleCard,
  SearchParams,
  SearchResponse,
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
  return request<SearchResponse>('/cards', {
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
    view: params.view,
    page: params.page,
    page_size: params.page_size,
  })
}

export function getCardById(oracleId: string): Promise<OracleCard> {
  return request<OracleCard>(`/cards/${oracleId}`)
}


export function getRulings(oracleId: string): Promise<RulingsResponse> {
  return request<RulingsResponse>(`/rulings/${oracleId}`)
}

export function getSymbology(): Promise<CardSymbol[]> {
  return request<CardSymbol[]>('/cards/symbols')
}

// ─── Decks (stubbed — endpoints not yet live) ──────────────────────────────

export function listDecks(): Promise<DeckSummary[]> {
  return request<DeckSummary[]>('/decks')
}

export function getDeck(id: string): Promise<Deck> {
  return request<Deck>(`/decks/${id}`)
}

export async function createDeck(input: CreateDeckInput): Promise<Deck> {
  const res = await fetch(`${BASE_URL}/decks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`)
  return res.json() as Promise<Deck>
}

export async function updateDeck(id: string, input: UpdateDeckInput): Promise<Deck> {
  const res = await fetch(`${BASE_URL}/decks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`)
  return res.json() as Promise<Deck>
}

export async function deleteDeck(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/decks/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`)
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

export async function createCombo(input: CreateComboInput): Promise<Combo> {
  const res = await fetch(`${BASE_URL}/combos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`)
  return res.json() as Promise<Combo>
}

export async function importSpellbookCombo(spellbookId: string): Promise<Combo> {
  const res = await fetch(`${BASE_URL}/combos/import/commanderspellbook/${spellbookId}`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`)
  return res.json() as Promise<Combo>
}

export async function linkComboToDeck(deckId: string, comboId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/decks/${deckId}/combos/${comboId}`, { method: 'PUT' })
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`)
}

export async function unlinkComboFromDeck(deckId: string, comboId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/decks/${deckId}/combos/${comboId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`)
}
