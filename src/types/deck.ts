import type { Color } from './card'

export type DeckFormat =
  | 'commander' | 'standard' | 'pioneer' | 'modern' | 'legacy'
  | 'vintage' | 'pauper' | 'explorer' | 'historic' | 'timeless'
  | 'brawl' | 'oathbreaker' | 'gladiator' | 'premodern' | 'duel'

export interface DeckCard {
  quantity: number
  name: string
  mana_cost: string | null
  type_line: string
  oracle_text: string | null
  power: string | null
  toughness: string | null
  loyalty: string | null
  cmc: number
  colors: Color[]
  color_identity: Color[]
  scryfall_id: string
  card_url: string
  image_url: string | null
}

export interface DeckSummary {
  id: string
  public_id: string
  name: string
  format: DeckFormat
  commanders: string[]
  card_count: number
  cmc_curve: Record<string, number>
}

export interface DeckListResponse {
  results: DeckSummary[]
  total: number
  page: number
  page_size: number
}

export interface Deck {
  id: string
  public_id: string
  name: string
  format: DeckFormat
  description: string | null
  source: string | null
  source_url: string | null
  commanders: DeckCard[]
  companions: DeckCard[]
  mainboard: DeckCard[]
  sideboard: DeckCard[]
  maybeboard: DeckCard[]
  card_count: number
  cmc_curve: Record<string, number>
}

export interface ImportDeckInput {
  url: string
}
