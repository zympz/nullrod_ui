import { render, screen, act } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ComboPage } from './ComboPage'

const mockGetCombo = vi.fn()

vi.mock('../api/client', () => ({
  getCombo: (...args: unknown[]) => mockGetCombo(...args),
}))

vi.mock('../api/symbology', () => ({
  loadSymbolMap: vi.fn(() => Promise.resolve(new Map())),
}))

const mockCombo = {
  id: 'combo-1',
  spellbook_id: '513-5034--46',
  uses: [
    {
      card: { name: 'Hullbreaker Horror', oracle_id: 'abc', type_line: 'Creature', image_url: 'https://example.com/hull.jpg' },
      quantity: 1,
      zone_locations: ['battlefield'],
      battlefield_card_state: '',
      exile_card_state: '',
      library_card_state: '',
      graveyard_card_state: '',
      must_be_commander: false,
    },
    {
      card: { name: 'Sol Ring', oracle_id: 'def', type_line: 'Artifact', image_url: 'https://example.com/sol.jpg' },
      quantity: 1,
      zone_locations: ['battlefield'],
      battlefield_card_state: '',
      exile_card_state: '',
      library_card_state: '',
      graveyard_card_state: '',
      must_be_commander: false,
    },
  ],
  requires: [{ name: 'A permanent that costs 0 or 1', scryfall_query: '', quantity: 1, zone_locations: ['hand'] }],
  produces: [{ name: 'Infinite colorless mana', quantity: 1 }, { name: 'Infinite storm count', quantity: 1 }],
  card_names: ['Hullbreaker Horror', 'Sol Ring'],
  description: 'Tap Sol Ring for mana.\nCast a cheap permanent.\nBounce Sol Ring with Hullbreaker Horror.',
  notes: '',
  mana_needed: '',
  mana_value_needed: 0,
  easy_prerequisites: '',
  notable_prerequisites: '',
  identity: 'U',
  bracket_tag: 'E',
  spoiler: false,
}

function renderComboPage(comboId = 'combo-1') {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={[`/combos/${comboId}`]}>
      <Routes>
        <Route path="/combos/:comboId" element={<ComboPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ComboPage', () => {
  beforeEach(() => {
    mockGetCombo.mockReset()
  })

  it('shows loading state', () => {
    mockGetCombo.mockReturnValue(new Promise(() => {}))
    renderComboPage()
    expect(screen.getByText(/Loading combo/)).toBeInTheDocument()
  })

  it('renders combo details', async () => {
    mockGetCombo.mockResolvedValue(mockCombo)
    await act(async () => { renderComboPage() })
    expect(screen.getByText('Hullbreaker Horror + Sol Ring')).toBeInTheDocument()
    expect(screen.getByText('Extra Spicy')).toBeInTheDocument()
  })

  it('renders card images', async () => {
    mockGetCombo.mockResolvedValue(mockCombo)
    await act(async () => { renderComboPage() })
    expect(screen.getByAltText('Hullbreaker Horror')).toBeInTheDocument()
    expect(screen.getByAltText('Sol Ring')).toBeInTheDocument()
  })

  it('renders combo steps', async () => {
    mockGetCombo.mockResolvedValue(mockCombo)
    await act(async () => { renderComboPage() })
    expect(screen.getByText('Tap Sol Ring for mana.')).toBeInTheDocument()
    expect(screen.getByText('Bounce Sol Ring with Hullbreaker Horror.')).toBeInTheDocument()
  })

  it('renders prerequisites', async () => {
    mockGetCombo.mockResolvedValue(mockCombo)
    await act(async () => { renderComboPage() })
    expect(screen.getByText('A permanent that costs 0 or 1')).toBeInTheDocument()
  })

  it('renders produces', async () => {
    mockGetCombo.mockResolvedValue(mockCombo)
    await act(async () => { renderComboPage() })
    expect(screen.getByText('Infinite colorless mana')).toBeInTheDocument()
    expect(screen.getByText('Infinite storm count')).toBeInTheDocument()
  })

  it('shows error on failure', async () => {
    mockGetCombo.mockRejectedValue(new Error('Not found'))
    await act(async () => { renderComboPage() })
    expect(screen.getByText('Not found')).toBeInTheDocument()
  })
})
