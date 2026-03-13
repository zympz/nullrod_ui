import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CombosPage } from './CombosPage'

describe('CombosPage', () => {
  it('renders the title', () => {
    render(<CombosPage />)
    expect(screen.getByText('Combos')).toBeInTheDocument()
  })

  it('shows coming soon badge', () => {
    render(<CombosPage />)
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
  })

  it('lists planned features', () => {
    render(<CombosPage />)
    expect(screen.getByText('Import from Commander Spellbook')).toBeInTheDocument()
    expect(screen.getByText('Link combos to decks')).toBeInTheDocument()
  })
})
