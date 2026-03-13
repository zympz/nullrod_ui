import { render, screen, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DecksPage } from './DecksPage'

const mockListDecks = vi.fn()
const mockImportDeck = vi.fn()
const mockNavigate = vi.fn()

vi.mock('../api/client', () => ({
  listDecks: (...args: unknown[]) => mockListDecks(...args),
  importDeck: (...args: unknown[]) => mockImportDeck(...args),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../api/symbology', () => ({
  loadSymbolMap: vi.fn(() => Promise.resolve(new Map())),
}))

const mockDeckSummary = {
  id: 'deck-1',
  public_id: 'abc123',
  name: 'Chatterfang Squirrels',
  format: 'commander',
  commanders: ['Chatterfang, Squirrel General'],
  card_count: 100,
  cmc_curve: { '1': 10, '2': 15, '3': 8 },
}

beforeEach(() => {
  vi.clearAllMocks()
})

async function renderDecks() {
  await act(async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <DecksPage />
      </MemoryRouter>,
    )
  })
}

describe('DecksPage', () => {
  it('shows loading state initially', async () => {
    mockListDecks.mockReturnValue(new Promise(() => {})) // never resolves
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <DecksPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('Loading decks...')).toBeInTheDocument()
  })

  it('renders deck list after loading', async () => {
    mockListDecks.mockResolvedValue({
      results: [mockDeckSummary],
      total: 1,
      page: 1,
      page_size: 20,
    })
    await renderDecks()
    expect(screen.getByText('Chatterfang Squirrels')).toBeInTheDocument()
    expect(screen.getByText('commander')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  it('shows empty state when no decks', async () => {
    mockListDecks.mockResolvedValue({
      results: [],
      total: 0,
      page: 1,
      page_size: 20,
    })
    await renderDecks()
    expect(screen.getByText(/No decks yet/)).toBeInTheDocument()
  })

  it('shows error on fetch failure', async () => {
    mockListDecks.mockRejectedValue(new Error('Network error'))
    await renderDecks()
    expect(screen.getByText('Network error')).toBeInTheDocument()
  })

  it('shows import form when button clicked', async () => {
    mockListDecks.mockResolvedValue({ results: [], total: 0, page: 1, page_size: 20 })
    await renderDecks()
    await act(async () => {
      screen.getByText('Import from Moxfield').click()
    })
    expect(screen.getByPlaceholderText(/Moxfield URL/)).toBeInTheDocument()
  })

  it('deck name links to detail page', async () => {
    mockListDecks.mockResolvedValue({
      results: [mockDeckSummary],
      total: 1,
      page: 1,
      page_size: 20,
    })
    await renderDecks()
    const link = screen.getByText('Chatterfang Squirrels').closest('a')
    expect(link).toHaveAttribute('href', '/decks/deck-1')
  })
})
