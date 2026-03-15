import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CardPage } from './CardPage'
import { mockBolt, mockGoyf } from '../test/fixtures'

const mockGetCardById = vi.fn()

vi.mock('../api/client', () => ({
  getCardById: (...args: unknown[]) => mockGetCardById(...args),
}))

vi.mock('../api/symbology', () => ({
  loadSymbolMap: vi.fn(() => Promise.resolve(new Map())),
}))

function renderPage(oracleId: string) {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={[`/cards/${oracleId}`]}>
      <Routes>
        <Route path="/cards/:oracleId" element={<CardPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CardPage', () => {
  beforeEach(() => {
    mockGetCardById.mockReset()
  })

  it('shows loading state initially', () => {
    mockGetCardById.mockReturnValue(new Promise(() => {})) // never resolves
    renderPage(mockBolt.oracle_id)
    expect(screen.getByText(/Loading card/)).toBeInTheDocument()
  })

  it('renders card after loading', async () => {
    mockGetCardById.mockResolvedValue(mockBolt)
    renderPage(mockBolt.oracle_id)
    expect(await screen.findByText('Lightning Bolt')).toBeInTheDocument()
    expect(screen.getByText('Instant')).toBeInTheDocument()
  })

  it('shows error on API failure', async () => {
    mockGetCardById.mockRejectedValue(new Error('Not found'))
    renderPage('bad-id')
    expect(await screen.findByText('Not found')).toBeInTheDocument()
  })

  it('renders legalities', async () => {
    mockGetCardById.mockResolvedValue(mockBolt)
    renderPage(mockBolt.oracle_id)
    await screen.findByText('Lightning Bolt')
    expect(screen.getByText('modern')).toBeInTheDocument()
  })

  it('renders rulings when available', async () => {
    const cardWithRuling = {
      ...mockBolt,
      rulings: [{ oracle_id: mockBolt.oracle_id, source: 'wotc', published_at: '2024-01-01', comment: 'Test ruling' }],
    }
    mockGetCardById.mockResolvedValue(cardWithRuling)
    renderPage(mockBolt.oracle_id)
    expect(await screen.findByText('Test ruling')).toBeInTheDocument()
  })

  it('renders P/T for creatures', async () => {
    mockGetCardById.mockResolvedValue(mockGoyf)
    renderPage(mockGoyf.oracle_id)
    await screen.findByText('Tarmogoyf')
    expect(screen.getByText('Power')).toBeInTheDocument()
    expect(screen.getByText('Toughness')).toBeInTheDocument()
  })

  it('has back button', async () => {
    mockGetCardById.mockResolvedValue(mockBolt)
    renderPage(mockBolt.oracle_id)
    await screen.findByText('Lightning Bolt')
    expect(screen.getByText(/Back to search/)).toBeInTheDocument()
  })
})
