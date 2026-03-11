export type Color = 'W' | 'U' | 'B' | 'R' | 'G'

export interface CardSymbol {
  symbol: string
  loose_variant: string | null
  english: string
  transposable: boolean
  represents_mana: boolean
  appears_in_mana_costs: boolean
  cmc: number | null
  funny: boolean
  colors: Color[]
  gatherer_alternates: string[] | null
  svg_uri: string
}

export type Legality = 'legal' | 'not_legal' | 'restricted' | 'banned'

export type Format =
  | 'standard' | 'pioneer' | 'modern' | 'legacy' | 'vintage'
  | 'commander' | 'pauper' | 'explorer' | 'historic' | 'timeless'
  | 'alchemy' | 'brawl' | 'oathbreaker' | 'penny' | 'oldschool'
  | 'premodern' | 'duel' | 'future' | 'gladiator'

export interface CardFace {
  name: string
  mana_cost: string | null
  type_line: string
  oracle_text: string | null
  colors: Color[]
  power: string | null
  toughness: string | null
  loyalty: string | null
}

export interface OracleCard {
  oracle_id: string
  name: string
  mana_cost: string | null
  cmc: number
  type_line: string
  oracle_text: string | null
  power: string | null
  toughness: string | null
  loyalty: string | null
  hand_modifier: string | null
  life_modifier: string | null
  colors: Color[]
  color_identity: Color[]
  produced_mana: Color[]
  keywords: string[]
  legalities: Record<Format, Legality>
  layout: string
  reserved: boolean
  games: string[]
  card_faces: CardFace[] | null
  canonical_scryfall_id: string
}

export interface SearchResponse {
  results: OracleCard[]
  total: number
  page: number
  page_size: number
}

export interface ArtworkUrls {
  small?: string
  normal?: string
  large?: string
  png?: string
  art_crop?: string
  border_crop?: string
}

export interface ArtworkResponse {
  scryfall_id: string
  oracle_id: string
  urls: ArtworkUrls
}

export interface Ruling {
  oracle_id: string
  source: string
  published_at: string
  comment: string
}

export interface RulingsResponse {
  oracle_id: string
  rulings: Ruling[]
}

export type ColorMode = 'at_least' | 'exactly' | 'at_most'

export interface SearchParams {
  name?: string
  oracle_text?: string
  color?: Color[]
  color_mode?: ColorMode
  color_identity?: Color[]
  color_identity_mode?: ColorMode
  type?: string
  cmc_min?: number
  cmc_max?: number
  keywords?: string[]
  format?: string
  page?: number
  page_size?: number
}
