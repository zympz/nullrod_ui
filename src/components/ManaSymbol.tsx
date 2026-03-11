import { useEffect, useState } from 'react'
import { loadSymbolMap } from '../api/symbology'

interface ManaSymbolProps {
  symbol: string
  size?: number
}

export function ManaSymbol({ symbol, size = 18 }: ManaSymbolProps) {
  const [svgUrl, setSvgUrl] = useState<string | null>(null)

  useEffect(() => {
    loadSymbolMap().then((map) => setSvgUrl(map.get(`{${symbol}}`) ?? null))
  }, [symbol])

  if (svgUrl) {
    return (
      <img
        src={svgUrl}
        alt={symbol}
        width={size}
        height={size}
        style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      />
    )
  }

  // Fallback while loading or for unknown symbols.
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        background: '#222233',
        color: '#cccccc',
        border: '1px solid #cccccc40',
        fontSize: size * 0.6,
        fontWeight: 700,
        lineHeight: 1,
        flexShrink: 0,
        fontFamily: 'monospace',
      }}
    >
      {symbol}
    </span>
  )
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

/** Renders oracle text with inline mana symbols. */
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
