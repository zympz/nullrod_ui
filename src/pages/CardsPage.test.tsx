import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CardsPage } from './CardsPage'
import { mockBolt, mockGoyf } from '../test/fixtures'

const mockSearchCards = vi.fn()
const mockSearchCardsList = vi.fn()
const mockGetCardPrintings = vi.fn()

vi.mock('../api/client', () => ({
  searchCards: (...args: unknown[]) => mockSearchCards(...args),
  searchCardsList: (...args: unknown[]) => mockSearchCardsList(...args),
  getCardPrintings: (...args: unknown[]) => mockGetCardPrintings(...args),
}))

vi.mock('../api/symbology', () => ({
  loadSymbolMap: vi.fn(() => Promise.resolve(new Map())),
}))

function renderPage(initialPath = '/cards') {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={[initialPath]}>
      <CardsPage />
    </MemoryRouter>,
  )
}

describe('CardsPage', () => {
  beforeEach(() => {
    mockSearchCards.mockReset()
    mockSearchCardsList.mockReset()
    mockGetCardPrintings.mockReset()
    mockSearchCards.mockResolvedValue({ results: [mockBolt, mockGoyf], total: 2, page: 1, page_size: 20 })
    mockSearchCardsList.mockResolvedValue({ results: [], total: 0, page: 1, page_size: 20 })
    mockGetCardPrintings.mockResolvedValue({ results: [], total: 0, page: 1, page_size: 1 })
  })

  it('auto-searches with commander format on load', async () => {
    renderPage()
    await waitFor(() => {
      expect(mockSearchCards).toHaveBeenCalledWith(
        expect.objectContaining({ format: 'commander' }),
      )
    })
  })

  it('has search input and button', () => {
    renderPage()
    expect(screen.getByPlaceholderText('Search cards…')).toBeInTheDocument()
    expect(screen.getByText('Search')).toBeInTheDocument()
  })

  it('searches on form submit', async () => {
    renderPage()
    const input = screen.getByPlaceholderText('Search cards…')
    fireEvent.change(input, { target: { value: 'bolt' } })
    fireEvent.submit(input.closest('form')!)
    await waitFor(() => {
      expect(mockSearchCards).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'bolt' }),
      )
    })
  })

  it('shows results after search', async () => {
    renderPage()
    const input = screen.getByPlaceholderText('Search cards…')
    fireEvent.change(input, { target: { value: 'bolt' } })
    fireEvent.submit(input.closest('form')!)
    expect(await screen.findByAltText('Lightning Bolt')).toBeInTheDocument()
  })

  it('shows error on search failure', async () => {
    mockSearchCards.mockRejectedValue(new Error('API 500: Internal'))
    renderPage()
    const input = screen.getByPlaceholderText('Search cards…')
    fireEvent.change(input, { target: { value: 'fail' } })
    fireEvent.submit(input.closest('form')!)
    expect(await screen.findByText('API 500: Internal')).toBeInTheDocument()
  })

  it('has filter toggle button', () => {
    renderPage()
    expect(screen.getByText(/^Filters/)).toBeInTheDocument()
  })

  it('shows filters panel by default (format filter active)', async () => {
    renderPage()
    expect(await screen.findByText('Apply Filters')).toBeInTheDocument()
  })

  it('has grid and list view buttons', () => {
    renderPage()
    expect(screen.getByTitle('Grid view')).toBeInTheDocument()
    expect(screen.getByTitle('List view')).toBeInTheDocument()
  })

  it('runs search from URL params on load', async () => {
    renderPage('/cards?q=goyf')
    await waitFor(() => {
      expect(mockSearchCards).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'goyf' }),
      )
    })
  })
})
