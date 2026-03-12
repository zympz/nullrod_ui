import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { CardList } from './CardList'
import { mockBolt, mockGoyf } from '../test/fixtures'

function renderList(cards = [mockBolt, mockGoyf], opts?: { page?: number; total?: number }) {
  return render(
    <MemoryRouter>
      <CardList
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

describe('CardList', () => {
  it('renders card names as links', () => {
    renderList()
    const bolt = screen.getByText('Lightning Bolt')
    expect(bolt.closest('a')).toHaveAttribute('href', `/cards/${mockBolt.oracle_id}`)
    expect(screen.getByText('Tarmogoyf')).toBeInTheDocument()
  })

  it('renders type lines', () => {
    renderList()
    expect(screen.getByText('Instant')).toBeInTheDocument()
    expect(screen.getByText('Creature — Lhurgoyf')).toBeInTheDocument()
  })

  it('renders CMC values', () => {
    renderList()
    // CMC values appear in the list rows — use getAllByText since '1' may appear elsewhere
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1)
  })

  it('shows empty state when no cards', () => {
    renderList([])
    expect(screen.getByText('No cards found')).toBeInTheDocument()
  })

  it('shows pagination when multiple pages', () => {
    renderList([mockBolt], { total: 40, page: 1 })
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
    expect(screen.getByText('← Prev')).toBeDisabled()
    expect(screen.getByText('Next →')).not.toBeDisabled()
  })

  it('hides pagination when single page', () => {
    renderList([mockBolt], { total: 1 })
    expect(screen.queryByText('← Prev')).not.toBeInTheDocument()
  })

  it('calls onPageChange when next clicked', () => {
    const onPageChange = vi.fn()
    render(
      <MemoryRouter>
        <CardList
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

  it('shows result count', () => {
    renderList([mockBolt, mockGoyf], { total: 2 })
    expect(screen.getByText('2 cards — page 1 of 1')).toBeInTheDocument()
  })
})
