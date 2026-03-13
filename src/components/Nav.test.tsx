import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import { Nav } from './Nav'

function renderNav(path = '/') {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={[path]}>
      <Nav />
    </MemoryRouter>,
  )
}

describe('Nav', () => {
  it('renders brand name', () => {
    renderNav()
    expect(screen.getByText('Null Rod')).toBeInTheDocument()
  })

  it('renders all navigation links', () => {
    renderNav()
    expect(screen.getByText('Decks')).toBeInTheDocument()
    expect(screen.getByText('Combos')).toBeInTheDocument()
    expect(screen.getByText('Cards')).toBeInTheDocument()
  })

  it('links point to correct routes', () => {
    renderNav()
    expect(screen.getByText('Decks').closest('a')).toHaveAttribute('href', '/decks')
    expect(screen.getByText('Combos').closest('a')).toHaveAttribute('href', '/combos')
    expect(screen.getByText('Cards').closest('a')).toHaveAttribute('href', '/cards')
  })

  it('brand links to home', () => {
    renderNav()
    expect(screen.getByText('Null Rod').closest('a')).toHaveAttribute('href', '/')
  })
})
