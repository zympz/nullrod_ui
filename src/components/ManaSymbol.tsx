import type { CSSProperties } from 'react'

const MANA_STYLES: Record<string, { color: string; bg: string }> = {
  W: { color: '#c8b87a', bg: '#2a2a1a' },
  U: { color: '#6aabf7', bg: '#0d1f35' },
  B: { color: '#b085f0', bg: '#1a0f30' },
  R: { color: '#f07060', bg: '#2a0f0f' },
  G: { color: '#5abf6a', bg: '#0f2015' },
  C: { color: '#aaaacc', bg: '#1a1a28' },
  X: { color: '#cccccc', bg: '#222233' },
  T: { color: '#cccccc', bg: '#222233' },
}

function getStyle(symbol: string): { color: string; bg: string } {
  if (MANA_STYLES[symbol]) return MANA_STYLES[symbol]
  // Generic number or hybrid
  return { color: '#cccccc', bg: '#222233' }
}

interface ManaSymbolProps {
  symbol: string
  size?: number
}

export function ManaSymbol({ symbol, size = 18 }: ManaSymbolProps) {
  const { color, bg } = getStyle(symbol)
  const style: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: size,
    height: size,
    borderRadius: '50%',
    background: bg,
    color,
    border: `1px solid ${color}40`,
    fontSize: size * 0.6,
    fontWeight: 700,
    lineHeight: 1,
    flexShrink: 0,
    fontFamily: 'monospace',
  }
  return <span style={style}>{symbol}</span>
}

interface ManaCostProps {
  cost: string
  size?: number
  gap?: number
}

export function ManaCost({ cost, size = 18, gap = 2 }: ManaCostProps) {
  const symbols = cost.match(/\{[^}]+\}/g) ?? []
  if (symbols.length === 0) return null
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap, flexWrap: 'wrap' }}>
      {symbols.map((s, i) => (
        <ManaSymbol key={i} symbol={s.slice(1, -1)} size={size} />
      ))}
    </span>
  )
}

/** Renders oracle text with inline mana symbols */
export function OracleText({ text }: { text: string }) {
  const parts = text.split(/(\{[^}]+\})/)
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('{') && part.endsWith('}')) {
          return <ManaSymbol key={i} symbol={part.slice(1, -1)} size={14} />
        }
        return <span key={i}>{part}</span>
      })}
    </span>
  )
}
