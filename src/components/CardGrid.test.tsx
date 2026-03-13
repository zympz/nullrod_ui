import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { CardGrid } from './CardGrid'
import { mockBolt, mockGoyf } from '../test/fixtures'

function renderGrid(cards = [mockBolt, mockGoyf], opts?: { page?: number; total?: number }) {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <CardGrid
        cards={cards}
        total={opts?.total ?? cards.length}
        page={opts?.page ?? 1}
        pageSize={20}
        onCardClick={vi.fn()}
        onPageChange={vi.fn()}
      />
    </MemoryRouter>,
  )
}

describe('CardGrid', () => {
  it('renders card tiles', () => {
    renderGrid()
    expect(screen.getByText('Lightning Bolt')).toBeInTheDocument()
    expect(screen.getByText('Tarmogoyf')).toBeInTheDocument()
  })

  it('shows empty state when no cards', () => {
    renderGrid([])
    expect(screen.getByText('No cards found')).toBeInTheDocument()
  })

  it('shows result count', () => {
    renderGrid([mockBolt, mockGoyf], { total: 2 })
    expect(screen.getByText('2 cards — page 1 of 1')).toBeInTheDocument()
  })

  it('shows pagination when multiple pages', () => {
    renderGrid([mockBolt], { total: 40, page: 1 })
    expect(screen.getByText('← Prev')).toBeDisabled()
    expect(screen.getByText('Next →')).not.toBeDisabled()
  })

  it('calls onPageChange', () => {
    const onPageChange = vi.fn()
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <CardGrid
          cards={[mockBolt]}
          total={40}
          page={1}
          pageSize={20}
          onCardClick={vi.fn()}
          onPageChange={onPageChange}
        />
      </MemoryRouter>,
    )
    screen.getByText('Next →').click()
    expect(onPageChange).toHaveBeenCalledWith(2)
  })
})
