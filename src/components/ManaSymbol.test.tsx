import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ManaSymbol, ManaCost, OracleText } from './ManaSymbol'

vi.mock('../api/symbology', () => ({
  loadSymbolMap: vi.fn(() =>
    Promise.resolve(
      new Map([
        ['{R}', 'https://example.com/R.svg'],
        ['{G}', 'https://example.com/G.svg'],
        ['{1}', 'https://example.com/1.svg'],
        ['{U}', 'https://example.com/U.svg'],
        ['{T}', 'https://example.com/T.svg'],
      ]),
    ),
  ),
}))

describe('ManaSymbol', () => {
  it('renders fallback span before symbol map loads', () => {
    const { container } = render(<ManaSymbol symbol="R" />)
    const span = container.querySelector('span')
    expect(span).toHaveTextContent('R')
  })

  it('renders img after symbol map loads', async () => {
    render(<ManaSymbol symbol="R" />)
    const img = await screen.findByAltText('R')
    expect(img).toHaveAttribute('src', 'https://example.com/R.svg')
  })

  it('uses custom size', async () => {
    render(<ManaSymbol symbol="R" size={24} />)
    const img = await screen.findByAltText('R')
    expect(img).toHaveAttribute('width', '24')
    expect(img).toHaveAttribute('height', '24')
  })
})

describe('ManaCost', () => {
  it('renders multiple mana symbols', async () => {
    render(<ManaCost cost="{1}{G}" />)
    expect(await screen.findByAltText('1')).toBeInTheDocument()
    expect(await screen.findByAltText('G')).toBeInTheDocument()
  })

  it('renders split cost with separator', async () => {
    render(<ManaCost cost="{R} // {1}{G}" />)
    expect(await screen.findByAltText('R')).toBeInTheDocument()
    expect(await screen.findByAltText('1')).toBeInTheDocument()
    expect(await screen.findByAltText('G')).toBeInTheDocument()
    expect(screen.getByText('//')).toBeInTheDocument()
  })

  it('returns null for empty cost', () => {
    const { container } = render(<ManaCost cost="" />)
    expect(container.firstChild).toBeNull()
  })
})

describe('OracleText', () => {
  it('renders text with inline mana symbols', async () => {
    render(<OracleText text="Add {R} to your mana pool." />)
    expect(screen.getByText('Add')).toBeInTheDocument()
    expect(screen.getByText('to your mana pool.')).toBeInTheDocument()
    expect(await screen.findByAltText('R')).toBeInTheDocument()
  })

  it('renders plain text without symbols', () => {
    render(<OracleText text="Draw a card." />)
    expect(screen.getByText('Draw a card.')).toBeInTheDocument()
  })
})
