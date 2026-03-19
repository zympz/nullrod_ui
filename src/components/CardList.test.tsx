import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { CardList } from './CardList'
import { mockBoltListItem, mockGoyfListItem } from '../test/fixtures'

function renderList(cards = [mockBoltListItem, mockGoyfListItem], opts?: { page?: number; total?: number }) {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <CardList
        cards={cards}
        total={opts?.total ?? cards.length}
        page={opts?.page ?? 1}
        pageSize={20}

        onPageChange={vi.fn()}
      />
    </MemoryRouter>,
  )
}

describe('CardList', () => {
  it('renders card names as links', () => {
    renderList()
    const bolt = screen.getByText('Lightning Bolt')
    expect(bolt.closest('a')).toHaveAttribute('href', `/cards/${mockBoltListItem.oracle_id}`)
    expect(screen.getByText('Tarmogoyf')).toBeInTheDocument()
  })

  it('renders type lines', () => {
    renderList()
    expect(screen.getByText('Instant')).toBeInTheDocument()
    expect(screen.getByText('Creature — Lhurgoyf')).toBeInTheDocument()
  })

  it('renders column headers', () => {
    renderList()
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    expect(screen.getByText('Mana')).toBeInTheDocument()
  })

  it('shows empty state when no cards', () => {
    renderList([])
    expect(screen.getByText('No cards found')).toBeInTheDocument()
  })

  it('shows pagination when multiple pages', () => {
    renderList([mockBoltListItem], { total: 40, page: 1 })
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
    expect(screen.getByText('← Prev')).toBeDisabled()
    expect(screen.getByText('Next →')).not.toBeDisabled()
  })

  it('hides pagination when single page', () => {
    renderList([mockBoltListItem], { total: 1 })
    expect(screen.queryByText('← Prev')).not.toBeInTheDocument()
  })

  it('calls onPageChange when next clicked', () => {
    const onPageChange = vi.fn()
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <CardList
          cards={[mockBoltListItem]}
          total={40}
          page={1}
          pageSize={20}
  
          onPageChange={onPageChange}
        />
      </MemoryRouter>,
    )
    screen.getByText('Next →').click()
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('shows result count', () => {
    renderList([mockBoltListItem, mockGoyfListItem], { total: 2 })
    expect(screen.getByText('2 cards — page 1 of 1')).toBeInTheDocument()
  })
})
