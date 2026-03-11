import type { Color, Format, OracleCard } from './card'

export type DeckFormat =
  | 'commander' | 'standard' | 'pioneer' | 'modern' | 'legacy'
  | 'vintage' | 'pauper' | 'explorer' | 'historic' | 'timeless'
  | 'brawl' | 'oathbreaker' | 'gladiator' | 'premodern' | 'duel'

export interface DeckEntry {
  quantity: number
  card: OracleCard
  is_commander?: boolean
  is_companion?: boolean
}

export interface Deck {
  id: string
  name: string
  format: DeckFormat
  description: string | null
  color_identity: Color[]
  mainboard: DeckEntry[]
  sideboard: DeckEntry[]
  maybeboard: DeckEntry[]
  commanders: DeckEntry[]
  companion: DeckEntry | null
  linked_combo_ids: string[]
  created_at: string
  updated_at: string
  is_public: boolean
}

export interface DeckSummary {
  id: string
  name: string
  format: DeckFormat
  color_identity: Color[]
  card_count: number
  linked_combo_count: number
  created_at: string
  updated_at: string
  is_public: boolean
}

export interface CreateDeckInput {
  name: string
  format: DeckFormat
  description?: string
}

export interface UpdateDeckInput {
  name?: string
  format?: DeckFormat
  description?: string
  is_public?: boolean
}

/** Legality check result from /decks/:id/legality */
export interface DeckLegality {
  deck_id: string
  format: Format
  legal: boolean
  violations: string[]
}
