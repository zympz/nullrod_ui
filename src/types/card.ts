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

export interface Ruling {
  oracle_id: string
  source: string
  published_at: string
  comment: string
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
  rulings: Ruling[]
  image_urls: ImageUrls
  printings?: PrintingResponse[] | null
}

export interface ImageUrls {
  normal?: string
  art_crop?: string
}

export interface SearchResponse {
  results: OracleCard[]
  total: number
  page: number
  page_size: number
}

// Slim card shape returned by view=list
export interface CardListItem {
  oracle_id: string
  name: string
  mana_cost: string | null
  cmc: number
  type_line: string
  colors: Color[]
  color_identity: Color[]
  keywords: string[]
  legal_formats: string[]
  layout: string
  art_crop: string
}

export interface SearchListResponse {
  results: CardListItem[]
  total: number
  page: number
  page_size: number
}

export interface PrintingResponse {
  scryfall_id: string
  oracle_id: string
  set_code: string
  set_name: string
  set_id: string
  set_type: string
  rarity: string
  collector_number: string
  layout: string
  frame: string
  border_color: string
  foil: boolean
  nonfoil: boolean
  full_art: boolean
  oversized: boolean
  textless: boolean
  booster: boolean
  digital: boolean
  released_at: string | null
  prices: { usd?: string | null; usd_foil?: string | null; usd_etched?: string | null; eur?: string | null; eur_foil?: string | null; tix?: string | null }
  image_urls: ImageUrls
}

export interface PrintingsResponse {
  oracle_id: string
  results: PrintingResponse[]
  total: number
  page: number
  page_size: number
}

// Kept for backward compatibility with existing tests
export interface RulingsResponse {
  oracle_id: string
  rulings: Ruling[]
}

export type ColorMode = 'at_least' | 'exactly' | 'at_most'

export type SortOrder = 'name' | 'cmc'
export type SortDir = 'auto' | 'asc' | 'desc'

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
  include_non_legal?: boolean
  include_extras?: boolean
  order?: SortOrder
  dir?: SortDir
  page?: number
  page_size?: number
}
