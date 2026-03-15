import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('renders printings section when printings available', async () => {
    mockGetCardById.mockResolvedValue({
      ...mockBolt,
      printings: [
        {
          scryfall_id: 'abc-123',
          oracle_id: mockBolt.oracle_id,
          set_code: 'tmp',
          set_name: 'Tempest',
          set_id: 'tmp-id',
          set_type: 'expansion',
          rarity: 'common',
          collector_number: '164',
          layout: 'normal',
          frame: '1997',
          border_color: 'black',
          foil: false,
          nonfoil: true,
          full_art: false,
          oversized: false,
          textless: false,
          booster: true,
          digital: false,
          released_at: '1997-10-14',
          prices: { usd: '0.25', usd_foil: null, eur: null, tix: null },
          image_urls: {},
        },
        {
          scryfall_id: 'def-456',
          oracle_id: mockBolt.oracle_id,
          set_code: 'lea',
          set_name: 'Limited Edition Alpha',
          set_id: 'lea-id',
          set_type: 'core',
          rarity: 'common',
          collector_number: '161',
          layout: 'normal',
          frame: '1993',
          border_color: 'black',
          foil: false,
          nonfoil: true,
          full_art: false,
          oversized: false,
          textless: false,
          booster: true,
          digital: false,
          released_at: '1993-08-05',
          prices: { usd: '150.00', usd_foil: null, eur: null, tix: null },
          image_urls: {},
        },
      ],
    })
    renderPage(mockBolt.oracle_id)
    await screen.findByText('Lightning Bolt')
    expect(screen.getByText('Tempest')).toBeInTheDocument()
    expect(screen.getByText('Limited Edition Alpha')).toBeInTheDocument()
  })

  it('clicking a printing updates the card image', async () => {
    mockGetCardById.mockResolvedValue({
      ...mockBolt,
      image_urls: { normal: 'https://example.com/bolt-default.jpg' },
      printings: [
        {
          scryfall_id: 'abc-123',
          oracle_id: mockBolt.oracle_id,
          set_code: 'tmp',
          set_name: 'Tempest',
          set_id: 'tmp-id',
          set_type: 'expansion',
          rarity: 'common',
          collector_number: '164',
          layout: 'normal',
          frame: '1997',
          border_color: 'black',
          foil: false,
          nonfoil: true,
          full_art: false,
          oversized: false,
          textless: false,
          booster: true,
          digital: false,
          released_at: '1997-10-14',
          prices: { usd: null, usd_foil: null, eur: null, tix: null },
          image_urls: { normal: 'https://example.com/tempest.jpg' },
        },
      ],
    })

    renderPage(mockBolt.oracle_id)
    await screen.findByText('Lightning Bolt')

    const img = screen.getByRole('img', { name: 'Lightning Bolt' })
    expect(img).toHaveAttribute('src', 'https://example.com/bolt-default.jpg')

    const printingBtn = screen.getByText('Tempest').closest('button')!
    await userEvent.click(printingBtn)

    expect(img).toHaveAttribute('src', 'https://example.com/tempest.jpg')
  })
})
