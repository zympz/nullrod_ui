import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import App from './App'

vi.mock('./pages/CardsPage', () => ({ CardsPage: () => <div>CardsPage</div> }))
vi.mock('./pages/CardPage', () => ({ CardPage: () => <div>CardPage</div> }))
vi.mock('./pages/DecksPage', () => ({ DecksPage: () => <div>DecksPage</div> }))
vi.mock('./pages/DeckPage', () => ({ DeckPage: () => <div>DeckPage</div> }))
vi.mock('./pages/CombosPage', () => ({ CombosPage: () => <div>CombosPage</div> }))
vi.mock('./pages/ComboPage', () => ({ ComboPage: () => <div>ComboPage</div> }))
vi.mock('./api/symbology', () => ({
  loadSymbolMap: vi.fn(() => Promise.resolve(new Map())),
}))

describe('App', () => {
  it('renders navigation', () => {
    render(<App />)
    expect(screen.getByText('Null Rod')).toBeInTheDocument()
    expect(screen.getByText('Decks')).toBeInTheDocument()
    expect(screen.getByText('Cards')).toBeInTheDocument()
  })

  it('redirects / to /decks', async () => {
    render(<App />)
    await waitFor(() => expect(screen.getByText('DecksPage')).toBeInTheDocument())
  })
})
