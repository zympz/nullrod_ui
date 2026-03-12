import { useEffect, useState } from 'react'
import { loadSymbolMap } from '../api/symbology'

interface ManaSymbolProps {
  symbol: string
  size?: number
}

export function ManaSymbol({ symbol, size = 18 }: ManaSymbolProps) {
  const [svgUrl, setSvgUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    loadSymbolMap().then((map) => {
      if (!cancelled) setSvgUrl(map.get(`{${symbol}}`) ?? null)
    })
    return () => { cancelled = true }
  }, [symbol])

  if (svgUrl) {
    return (
      <img
        src={svgUrl}
        alt={symbol}
        width={size}
        height={size}
        style={{
          display: 'inline-block',
          verticalAlign: 'middle',
          flexShrink: 0,
          borderRadius: '50%',
        }}
      />
    )
  }

  // Fallback while loading.
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
  const halves = cost.split(' // ')
  if (halves.length > 1) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {halves.map((half, i) => {
          const symbols = half.match(/\{[^}]+\}/g) ?? []
          return (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap }}>
              {i > 0 && <span style={{ color: 'var(--text-dim)', fontSize: size * 0.75, lineHeight: 1 }}>//</span>}
              {symbols.map((s, j) => (
                <ManaSymbol key={j} symbol={s.slice(1, -1)} size={size} />
              ))}
            </span>
          )
        })}
      </span>
    )
  }
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

/** Renders inline mana symbols from text containing {X} tokens. */
function InlineMana({ text }: { text: string }) {
  const parts = text.split(/(\{[^}]+\})/)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('{') && part.endsWith('}')) {
          return <ManaSymbol key={i} symbol={part.slice(1, -1)} size={14} />
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

/** Renders oracle text with inline mana symbols and italic reminder text. */
export function OracleText({ text }: { text: string }) {
  // Split on parenthesized reminder text, keeping the delimiters
  const parts = text.split(/(\([^)]*\))/)
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('(') && part.endsWith(')')) {
          return <em key={i}><InlineMana text={part} /></em>
        }
        return <InlineMana key={i} text={part} />
      })}
    </span>
  )
}
