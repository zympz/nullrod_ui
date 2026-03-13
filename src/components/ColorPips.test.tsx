import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ColorPips } from './ColorPips'

describe('ColorPips', () => {
  it('renders colorless pip when no colors', () => {
    const { container } = render(<ColorPips colors={[]} />)
    const pip = container.querySelector('[title="Colorless"]')
    expect(pip).toBeInTheDocument()
  })

  it('renders a pip for each color', () => {
    render(<ColorPips colors={['W', 'U', 'B']} />)
    expect(screen.getByTitle('White')).toBeInTheDocument()
    expect(screen.getByTitle('Blue')).toBeInTheDocument()
    expect(screen.getByTitle('Black')).toBeInTheDocument()
  })

  it('renders all five colors', () => {
    render(<ColorPips colors={['W', 'U', 'B', 'R', 'G']} />)
    expect(screen.getByTitle('White')).toBeInTheDocument()
    expect(screen.getByTitle('Blue')).toBeInTheDocument()
    expect(screen.getByTitle('Black')).toBeInTheDocument()
    expect(screen.getByTitle('Red')).toBeInTheDocument()
    expect(screen.getByTitle('Green')).toBeInTheDocument()
  })

  it('applies custom size', () => {
    render(<ColorPips colors={['R']} size={20} />)
    const pip = screen.getByTitle('Red')
    expect(pip.style.width).toBe('20px')
    expect(pip.style.height).toBe('20px')
  })

  it('falls back to raw color code for unknown colors', () => {
    render(<ColorPips colors={['X']} />)
    expect(screen.getByTitle('X')).toBeInTheDocument()
  })
})
