import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { CardDetail } from './CardDetail'
import { mockBolt, mockGoyf, mockJace } from '../test/fixtures'

vi.mock('../api/client', () => ({}))

vi.mock('../api/symbology', () => ({
  loadSymbolMap: vi.fn(() => Promise.resolve(new Map())),
}))

async function renderDetail(card = mockBolt, onClose = vi.fn()) {
  let result: ReturnType<typeof render>
  await act(async () => {
    result = render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <CardDetail card={card} onClose={onClose} />
      </MemoryRouter>,
    )
  })
  return result!
}

describe('CardDetail', () => {
  it('renders card name and type', async () => {
    await renderDetail()
    expect(screen.getByText('Lightning Bolt')).toBeInTheDocument()
    expect(screen.getByText('Instant')).toBeInTheDocument()
  })

  it('renders oracle text', async () => {
    await renderDetail()
    expect(screen.getByText(/deals 3 damage/)).toBeInTheDocument()
  })

  it('shows image when available', async () => {
    await renderDetail()
    const img = screen.getByAltText('Lightning Bolt') as HTMLImageElement
    expect(img.src).toContain('bolt-normal.jpg')
  })

  it('shows "No image" when no urls', async () => {
    const card = { ...mockBolt, image_urls: {} }
    await renderDetail(card)
    expect(screen.getByText('No image')).toBeInTheDocument()
  })

  it('renders legalities', async () => {
    await renderDetail()
    expect(screen.getByText('modern')).toBeInTheDocument()
    // Multiple formats are 'legal', so use getAllByText
    expect(screen.getAllByText('legal').length).toBeGreaterThanOrEqual(1)
  })

  it('renders power/toughness for creatures', async () => {
    await renderDetail(mockGoyf)
    expect(screen.getByText('Power')).toBeInTheDocument()
    expect(screen.getByText('Toughness')).toBeInTheDocument()
  })

  it('renders loyalty for planeswalkers', async () => {
    await renderDetail(mockJace)
    expect(screen.getByText('Loyalty')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders color identity pips', async () => {
    await renderDetail()
    expect(screen.getByText('Identity')).toBeInTheDocument()
  })

  it('renders games section', async () => {
    await renderDetail()
    expect(screen.getByText('Games')).toBeInTheDocument()
    expect(screen.getByText('paper')).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', async () => {
    const onClose = vi.fn()
    await renderDetail(mockBolt, onClose)
    screen.getByLabelText('Close').click()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose on Escape key', async () => {
    const onClose = vi.fn()
    await renderDetail(mockBolt, onClose)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('has link to card detail page', async () => {
    await renderDetail()
    const link = screen.getByText('Lightning Bolt').closest('a')
    expect(link).toHaveAttribute('href', `/cards/${mockBolt.oracle_id}`)
  })
})
