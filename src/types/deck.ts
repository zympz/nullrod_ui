import type { Color } from './card'

export interface DeckCardImageUrls {
  front?: string
  back?: string
}

export type DeckFormat =
  | 'commander' | 'standard' | 'pioneer' | 'modern' | 'legacy'
  | 'vintage' | 'pauper' | 'explorer' | 'historic' | 'timeless'
  | 'brawl' | 'oathbreaker' | 'gladiator' | 'premodern' | 'duel'

export interface DeckCardPrices {
  usd: string | null
  usd_foil: string | null
  usd_etched: string | null
  eur: string | null
  eur_foil: string | null
  tix: string | null
}

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
  oracle_id: string
  scryfall_id: string
  set_code: string
  set_name: string
  card_url: string
  image_urls: DeckCardImageUrls
  prices: DeckCardPrices
  foil: boolean
}

export interface DeckSummary {
  id: string
  public_id: string
  name: string
  format: DeckFormat
  commanders: string[]
  color_identity: Color[]
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
  color_identity: Color[]
}

export interface ImportDeckInput {
  url: string
}
