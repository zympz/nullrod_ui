import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { CardTile } from './CardTile'
import { mockBolt, mockGoyf } from '../test/fixtures'

function renderTile(card = mockBolt, onClick = vi.fn()) {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <CardTile card={card} onClick={onClick} />
    </MemoryRouter>,
  )
}

describe('CardTile', () => {
  it('renders card image with normal url', () => {
    const card = { ...mockBolt, image_urls: { normal: 'https://example.com/normal.jpg', art_crop: 'https://example.com/art.jpg' } }
    renderTile(card)
    const img = screen.getByAltText('Lightning Bolt') as HTMLImageElement
    expect(img.src).toContain('normal.jpg')
  })

  it('falls back to art_crop when normal missing', () => {
    const card = { ...mockBolt, image_urls: { art_crop: 'https://example.com/art.jpg' } }
    renderTile(card)
    const img = screen.getByAltText('Lightning Bolt') as HTMLImageElement
    expect(img.src).toContain('art.jpg')
  })

  it('shows placeholder when no images', () => {
    const card = { ...mockBolt, image_urls: {} }
    renderTile(card)
    expect(screen.getByText('No image')).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    renderTile(mockGoyf, onClick)
    screen.getByAltText('Tarmogoyf').closest('button')!.click()
    expect(onClick).toHaveBeenCalledWith(mockGoyf)
  })
})
