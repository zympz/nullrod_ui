import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CardDetail } from './CardDetail'
import { mockBolt, mockGoyf, mockJace } from '../test/fixtures'

vi.mock('../api/client', () => ({
  getRulings: vi.fn(() => Promise.resolve({ rulings: [] })),
}))

vi.mock('../api/symbology', () => ({
  loadSymbolMap: vi.fn(() => Promise.resolve(new Map())),
}))

function renderDetail(card = mockBolt, onClose = vi.fn()) {
  return render(
    <MemoryRouter>
      <CardDetail card={card} onClose={onClose} />
    </MemoryRouter>,
  )
}

describe('CardDetail', () => {
  it('renders card name and type', () => {
    renderDetail()
    expect(screen.getByText('Lightning Bolt')).toBeInTheDocument()
    expect(screen.getByText('Instant')).toBeInTheDocument()
  })

  it('renders oracle text', () => {
    renderDetail()
    expect(screen.getByText(/deals 3 damage/)).toBeInTheDocument()
  })

  it('shows image when available', () => {
    renderDetail()
    const img = screen.getByAltText('Lightning Bolt') as HTMLImageElement
    expect(img.src).toContain('bolt-normal.jpg')
  })

  it('shows "No image" when no urls', () => {
    const card = { ...mockBolt, image_urls: {} }
    renderDetail(card)
    expect(screen.getByText('No image')).toBeInTheDocument()
  })

  it('renders legalities', () => {
    renderDetail()
    expect(screen.getByText('modern')).toBeInTheDocument()
    // Multiple formats are 'legal', so use getAllByText
    expect(screen.getAllByText('legal').length).toBeGreaterThanOrEqual(1)
  })

  it('renders power/toughness for creatures', () => {
    renderDetail(mockGoyf)
    expect(screen.getByText('Power')).toBeInTheDocument()
    expect(screen.getByText('Toughness')).toBeInTheDocument()
  })

  it('renders loyalty for planeswalkers', () => {
    renderDetail(mockJace)
    expect(screen.getByText('Loyalty')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders color identity pips', () => {
    renderDetail()
    expect(screen.getByText('Identity')).toBeInTheDocument()
  })

  it('renders games section', () => {
    renderDetail()
    expect(screen.getByText('Games')).toBeInTheDocument()
    expect(screen.getByText('paper')).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    renderDetail(mockBolt, onClose)
    screen.getByLabelText('Close').click()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn()
    renderDetail(mockBolt, onClose)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('has link to card detail page', () => {
    renderDetail()
    const link = screen.getByText('Lightning Bolt').closest('a')
    expect(link).toHaveAttribute('href', `/cards/${mockBolt.oracle_id}`)
  })
})
