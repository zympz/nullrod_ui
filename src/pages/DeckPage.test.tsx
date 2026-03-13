import { render, screen, act } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DeckPage } from './DeckPage'

const mockGetDeck = vi.fn()

const mockSearchCardByName = vi.fn()

vi.mock('../api/client', () => ({
  getDeck: (...args: unknown[]) => mockGetDeck(...args),
  searchCardByName: (...args: unknown[]) => mockSearchCardByName(...args),
}))

vi.mock('../api/symbology', () => ({
  loadSymbolMap: vi.fn(() => Promise.resolve(new Map())),
}))

const mockDeck = {
  id: 'deck-1',
  public_id: 'abc123',
  name: 'Chatterfang Squirrels',
  format: 'commander',
  description: 'A squirrel tribal deck',
  source: 'moxfield',
  source_url: 'https://moxfield.com/decks/abc123',
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
      scryfall_id: 'cmd-1',
      card_url: 'https://api.nullrod.com/cards?name=Chatterfang',
      image_url: 'https://example.com/chatterfang.webp',
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
      scryfall_id: 'sol-1',
      card_url: 'https://api.nullrod.com/cards?name=Sol%20Ring',
      image_url: null,
    },
  ],
  sideboard: [],
  maybeboard: [],
  card_count: 100,
  cmc_curve: { '1': 10, '2': 15, '3': 8 },
}

beforeEach(() => {
  vi.clearAllMocks()
  mockSearchCardByName.mockResolvedValue({ results: [], total: 0, page: 1, page_size: 20 })
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
    expect(screen.getByText('Color Distribution')).toBeInTheDocument()
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

})
