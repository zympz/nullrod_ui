import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CombosPage } from './CombosPage'

const mockListCombos = vi.fn()

vi.mock('../api/client', () => ({
  listCombos: (...args: unknown[]) => mockListCombos(...args),
}))

const mockCombo = {
  id: 'combo-1',
  spellbook_id: '123-456',
  card_names: ['Sol Ring', 'Hullbreaker Horror'],
  produces: [{ name: 'Infinite colorless mana', quantity: 1 }],
  identity: 'U',
  popularity: 289457,
  bracket_tag: 'E',
}

function renderPage() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <CombosPage />
    </MemoryRouter>,
  )
}

describe('CombosPage', () => {
  beforeEach(() => {
    mockListCombos.mockReset()
    mockListCombos.mockResolvedValue({ results: [mockCombo], total: 1, page: 1, page_size: 20 })
  })

  it('renders the title', async () => {
    renderPage()
    expect(screen.getByText('Combos')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    mockListCombos.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText(/Loading combos/)).toBeInTheDocument()
  })

  it('renders combo results', async () => {
    renderPage()
    expect(await screen.findByText('Sol Ring + Hullbreaker Horror')).toBeInTheDocument()
    expect(screen.getByText('Infinite colorless mana')).toBeInTheDocument()
  })

  it('shows bracket badge', async () => {
    renderPage()
    expect(await screen.findByText('Extra Spicy')).toBeInTheDocument()
  })

  it('shows popularity', async () => {
    renderPage()
    expect(await screen.findByText('289,457 decks')).toBeInTheDocument()
  })

  it('shows error on failure', async () => {
    mockListCombos.mockRejectedValue(new Error('API 500'))
    renderPage()
    expect(await screen.findByText('API 500')).toBeInTheDocument()
  })

  it('has color identity filter', () => {
    renderPage()
    expect(screen.getByText('Color Identity')).toBeInTheDocument()
  })
})
