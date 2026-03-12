import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SearchFilters } from './SearchFilters'
import type { SearchParams } from '../types/card'

vi.mock('../api/symbology', () => ({
  loadSymbolMap: vi.fn(() => Promise.resolve(new Map())),
}))

function renderFilters(params: SearchParams = { page: 1 }, onChange = vi.fn()) {
  return { ...render(<SearchFilters params={params} onChange={onChange} />), onChange }
}

describe('SearchFilters', () => {
  it('renders color buttons', () => {
    renderFilters()
    expect(screen.getByTitle('W')).toBeInTheDocument()
    expect(screen.getByTitle('U')).toBeInTheDocument()
    expect(screen.getByTitle('B')).toBeInTheDocument()
    expect(screen.getByTitle('R')).toBeInTheDocument()
    expect(screen.getByTitle('G')).toBeInTheDocument()
  })

  it('renders type input', () => {
    renderFilters()
    expect(screen.getByPlaceholderText('Creature, Instant…')).toBeInTheDocument()
  })

  it('renders CMC inputs', () => {
    renderFilters()
    expect(screen.getByPlaceholderText('Min')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Max')).toBeInTheDocument()
  })

  it('renders format selector', () => {
    renderFilters()
    expect(screen.getByText('— none —')).toBeInTheDocument()
  })

  it('calls onChange with page 1 when Apply clicked', () => {
    const onChange = vi.fn()
    renderFilters({ page: 3 }, onChange)
    screen.getByText('Apply Filters').click()
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }))
  })

  it('calls onChange on form submit (Enter key)', () => {
    const onChange = vi.fn()
    renderFilters({ page: 1 }, onChange)
    fireEvent.submit(screen.getByText('Apply Filters').closest('form')!)
    expect(onChange).toHaveBeenCalled()
  })

  it('clears all filters when Clear clicked', () => {
    const onChange = vi.fn()
    renderFilters({ page: 1, type: 'Creature' }, onChange)
    screen.getByText('Clear').click()
    expect(onChange).toHaveBeenCalledWith({ page: 1 })
  })

  it('renders oracle text input', () => {
    renderFilters()
    expect(screen.getByPlaceholderText('flying, draw a card…')).toBeInTheDocument()
  })

  it('renders keywords input', () => {
    renderFilters()
    expect(screen.getByPlaceholderText('Flying, Trample…')).toBeInTheDocument()
  })
})
