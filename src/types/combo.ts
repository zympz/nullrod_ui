export interface ComboProduces {
  name: string
  quantity: number
}

export interface ComboSummary {
  id: string
  spellbook_id: string
  card_names: string[]
  produces: ComboProduces[]
  identity: string
  popularity: number
  bracket_tag: string
}

export interface ComboListResponse {
  results: ComboSummary[]
  total: number
  page: number
  page_size: number
}

export interface ComboCardUse {
  card: {
    name: string
    oracle_id: string
    type_line: string
    image_url: string
  }
  quantity: number
  zone_locations: string[]
  battlefield_card_state: string
  exile_card_state: string
  library_card_state: string
  graveyard_card_state: string
  must_be_commander: boolean
}

export interface ComboRequirement {
  name: string
  scryfall_query: string
  quantity: number
  zone_locations: string[]
}

export interface Combo {
  id: string
  spellbook_id: string
  uses: ComboCardUse[]
  requires: ComboRequirement[]
  produces: ComboProduces[]
  card_names: string[]
  description: string
  notes: string
  mana_needed: string
  mana_value_needed: number
  easy_prerequisites: string
  notable_prerequisites: string
  identity: string
  legalities: Record<string, boolean>
  popularity: number
  bracket_tag: string
  prices: {
    tcgplayer: string
    cardmarket: string
    cardkingdom: string
  }
  spoiler: boolean
}
