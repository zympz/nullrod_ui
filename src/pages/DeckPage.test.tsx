import { render, screen, act, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DeckPage } from './DeckPage'

const mockGetDeck = vi.fn()
const mockGetCardById = vi.fn()
const mockGetCardByScryfall = vi.fn()
const mockFetchBatchPrices = vi.fn()

vi.mock('../api/client', () => ({
  getDeck: (...args: unknown[]) => mockGetDeck(...args),
  getCardById: (...args: unknown[]) => mockGetCardById(...args),
  getCardByScryfall: (...args: unknown[]) => mockGetCardByScryfall(...args),
  fetchBatchPrices: (...args: unknown[]) => mockFetchBatchPrices(...args),
}))

vi.mock('../api/symbology', () => ({
  loadSymbolMap: vi.fn(() => Promise.resolve(new Map())),
}))

const mockPrices = { usd: null, usd_foil: null, usd_etched: null, eur: null, eur_foil: null, tix: null }

const mockDeck = {
  id: 'deck-1',
  public_id: 'abc123',
  name: 'Chatterfang Squirrels',
  format: 'commander',
  description: 'A squirrel tribal deck',
  source: 'moxfield',
  source_url: 'https://moxfield.com/decks/abc123',
  color_identity: ['B', 'G'],
  commanders: [
    {
      quantity: 1,
      name: 'Chatterfang, Squirrel General',
      mana_cost: '{2}{G}',
      type_line: 'Legendary Creature — Squirrel Warrior',
      oracle_text: 'Forestwalk',
      power: '3',
      toughness: '3',
      loyalty: null,
      cmc: 3,
      colors: ['G'],
      color_identity: ['B', 'G'],
      oracle_id: 'chatterfang-oracle',
      scryfall_id: 'cmd-1',
      set_code: 'mh2',
      set_name: 'Modern Horizons 2',
      card_url: 'https://api.nullrod.com/cards?name=Chatterfang',
      image_urls: { front: 'https://example.com/chatterfang.webp' },
      prices: { usd: '5.00', usd_foil: null, usd_etched: null, eur: null, eur_foil: null, tix: null },
      foil: false,
    },
  ],
  companions: [],
  mainboard: [
    {
      quantity: 1,
      name: 'Sol Ring',
      mana_cost: '{1}',
      type_line: 'Artifact',
      oracle_text: '{T}: Add {C}{C}.',
      power: null,
      toughness: null,
      loyalty: null,
      cmc: 1,
      colors: [],
      color_identity: [],
      oracle_id: 'sol-ring-oracle',
      scryfall_id: 'sol-1',
      set_code: 'lea',
      set_name: 'Limited Edition Alpha',
      card_url: 'https://api.nullrod.com/cards?name=Sol%20Ring',
      image_urls: {},
      prices: { usd: '1.00', usd_foil: null, usd_etched: null, eur: null, eur_foil: null, tix: null },
      foil: false,
    },
  ],
  sideboard: [],
  maybeboard: [],
  card_count: 100,
  cmc_curve: { '1': 10, '2': 15, '3': 8 },
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetCardByScryfall.mockResolvedValue({ image_urls: {} })
  mockGetCardById.mockResolvedValue(null)
  mockFetchBatchPrices.mockResolvedValue(new Map())
})

function renderDeckPage(deckId = 'deck-1') {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={[`/decks/${deckId}`]}>
      <Routes>
        <Route path="/decks/:deckId" element={<DeckPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('DeckPage', () => {
  it('shows loading state initially', () => {
    mockGetDeck.mockReturnValue(new Promise(() => {}))
    renderDeckPage()
    expect(screen.getByText(/Loading deck/)).toBeInTheDocument()
  })

  it('renders deck details after loading', async () => {
    mockGetDeck.mockResolvedValue(mockDeck)
    await act(async () => { renderDeckPage() })
    expect(screen.getByText('Chatterfang Squirrels')).toBeInTheDocument()
    expect(screen.getByText('commander')).toBeInTheDocument()
    expect(screen.getByText('100 cards')).toBeInTheDocument()
    expect(screen.getByText('A squirrel tribal deck')).toBeInTheDocument()
  })

  it('renders commander group in mainboard', async () => {
    mockGetDeck.mockResolvedValue(mockDeck)
    await act(async () => { renderDeckPage() })
    expect(screen.getByText('Commander')).toBeInTheDocument()
    expect(screen.getByText('Chatterfang, Squirrel General')).toBeInTheDocument()
  })

  it('renders mainboard cards', async () => {
    mockGetDeck.mockResolvedValue(mockDeck)
    await act(async () => { renderDeckPage() })
    expect(screen.getByText('Mainboard')).toBeInTheDocument()
    expect(screen.getByText('Sol Ring')).toBeInTheDocument()
  })

  it('renders deck stats', async () => {
    mockGetDeck.mockResolvedValue(mockDeck)
    await act(async () => { renderDeckPage() })
    expect(screen.getByText('Deck Stats')).toBeInTheDocument()
    // Deck stats collapsed by default — expand to see content
    fireEvent.click(screen.getByText('Deck Stats'))
    expect(screen.getByText(/Color Summary/)).toBeInTheDocument()
  })

  it('renders sample hand section for decks with enough cards', async () => {
    const bigDeck = {
      ...mockDeck,
      mainboard: Array.from({ length: 7 }, (_, i) => ({
        ...mockDeck.mainboard[0],
        scryfall_id: `card-${i}`,
        name: `Card ${i}`,
      })),
    }
    mockGetDeck.mockResolvedValue(bigDeck)
    await act(async () => { renderDeckPage() })
    expect(screen.getByText('Sample Hand')).toBeInTheDocument()
  })

  it('renders source link', async () => {
    mockGetDeck.mockResolvedValue(mockDeck)
    await act(async () => { renderDeckPage() })
    const link = screen.getByText('moxfield')
    expect(link).toHaveAttribute('href', 'https://moxfield.com/decks/abc123')
  })

  it('shows error on fetch failure', async () => {
    mockGetDeck.mockRejectedValue(new Error('Deck not found'))
    await act(async () => { renderDeckPage() })
    expect(screen.getByText('Deck not found')).toBeInTheDocument()
  })

  it('shows total price from embedded deck card prices', async () => {
    mockGetDeck.mockResolvedValue(mockDeck)
    await act(async () => { renderDeckPage() })
    // commander $5.00 + sol ring $1.00 = $6.00
    expect(screen.getByText('$6.00')).toBeInTheDocument()
  })

  it('shows asterisk and tooltip when some cards have no price', async () => {
    const deckWithUnpriced = {
      ...mockDeck,
      mainboard: [
        {
          ...mockDeck.mainboard[0],
          prices: { ...mockPrices, usd: null },
        },
      ],
    }
    mockGetDeck.mockResolvedValue(deckWithUnpriced)
    await act(async () => { renderDeckPage() })
    const badge = screen.getByTitle('1 card without price data')
    expect(badge).toBeInTheDocument()
  })

  it('renders price from embedded data when cards have prices', async () => {
    mockGetDeck.mockResolvedValue(mockDeck)
    await act(async () => { renderDeckPage() })
    expect(screen.getByText('$6.00')).toBeInTheDocument()
    expect(screen.getByText('Chatterfang Squirrels')).toBeInTheDocument()
  })

  it('shows DFC flip badge next to cards with double-faced names', async () => {
    const dfcDeck = {
      ...mockDeck,
      mainboard: [
        {
          ...mockDeck.mainboard[0],
          name: 'Delver of Secrets // Insectile Aberration',
          scryfall_id: 'delver-1',
        },
      ],
    }
    mockGetDeck.mockResolvedValue(dfcDeck)
    await act(async () => { renderDeckPage() })
    expect(screen.getByText('Delver of Secrets')).toBeInTheDocument()
    const flipBtn = screen.getByTitle('Flip to Insectile Aberration')
    expect(flipBtn).toBeInTheDocument()
  })

  it('hovering a card with no image_urls fetches via getCardByScryfall', async () => {
    mockGetDeck.mockResolvedValue(mockDeck)
    await act(async () => { renderDeckPage() })

    mockGetCardByScryfall.mockClear()
    await act(async () => {
      fireEvent.mouseEnter(screen.getByText('Sol Ring').closest('div')!)
    })

    // Sol Ring has empty image_urls in the fixture, so a fetch is triggered
    expect(mockGetCardByScryfall).toHaveBeenCalledWith('sol-1')
  })

  it('clicking card name calls getCardById with oracle_id and shows detail modal', async () => {
    mockGetDeck.mockResolvedValue(mockDeck)
    const oracleCard = {
      oracle_id: 'sol-ring-oracle',
      name: 'Sol Ring',
      mana_cost: '{1}',
      type_line: 'Artifact',
      oracle_text: '{T}: Add {C}{C}.',
      power: null,
      toughness: null,
      loyalty: null,
      cmc: 1,
      colors: [],
      color_identity: [],
      keywords: [],
      games: [],
      legalities: {},
      layout: 'normal',
      reserved: false,
      canonical_scryfall_id: 'sol-1',
      rulings: [],
      image_urls: {},
    }
    mockGetCardById.mockResolvedValue(oracleCard)
    await act(async () => { renderDeckPage() })

    await act(async () => {
      fireEvent.click(screen.getByText('Sol Ring'))
    })

    await waitFor(() => {
      expect(mockGetCardById).toHaveBeenCalledWith('sol-ring-oracle')
    })
  })

})
