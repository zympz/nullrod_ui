import type { OracleCard } from './card'

export type ComboSource = 'user' | 'commanderspellbook' | 'edhrec'

export interface ComboCard {
  card: OracleCard
  role?: string  // e.g. "Sac outlet", "Token generator"
}

export interface Combo {
  id: string
  name: string | null
  description: string
  result: string          // e.g. "Infinite mana", "Win the game"
  cards: ComboCard[]
  steps: string[]         // ordered steps to execute the combo
  prerequisites: string[] // board state requirements
  source: ComboSource
  source_id: string | null // e.g. Commander Spellbook combo ID
  tags: string[]
  created_at: string
  updated_at: string
}

export interface ComboSummary {
  id: string
  name: string | null
  result: string
  card_count: number
  source: ComboSource
  tags: string[]
  created_at: string
}

export interface CreateComboInput {
  name?: string
  description: string
  result: string
  card_oracle_ids: string[]
  steps: string[]
  prerequisites?: string[]
  tags?: string[]
}

/** Commander Spellbook combo format for import */
export interface SpellbookCombo {
  id: string
  uses: Array<{ card: { name: string; oracleId?: string }; zoneLocations: string[] }>
  produces: Array<{ feature: { name: string } }>
  description: string
  notes: string
}
