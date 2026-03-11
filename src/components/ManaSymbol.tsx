import { useEffect, useState } from 'react'
import { fetchSymbolSvg, loadSymbolMap } from '../api/symbology'

interface ManaSymbolProps {
  symbol: string
  size?: number
}

export function ManaSymbol({ symbol, size = 18 }: ManaSymbolProps) {
  const [svgText, setSvgText] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    loadSymbolMap().then((map) => {
      const uri = map.get(`{${symbol}}`)
      if (uri) return fetchSymbolSvg(uri)
    }).then((svg) => {
      if (!cancelled && svg) setSvgText(svg)
    })
    return () => { cancelled = true }
  }, [symbol])

  const style: React.CSSProperties = {
    display: 'inline-block',
    width: size,
    height: size,
    verticalAlign: 'middle',
    flexShrink: 0,
    lineHeight: 0,
  }

  if (svgText) {
    // Force the SVG to exactly fill our container by overriding its dimensions.
    const normalized = svgText
      .replace(/\bwidth="[^"]*"/, `width="${size}"`)
      .replace(/\bheight="[^"]*"/, `height="${size}"`)
    return (
      <span
        style={style}
        // SVGs are from the known Scryfall source via api.nullrod.com/symbology.
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: normalized }}
      />
    )
  }

  // Fallback while loading.
  return (
    <span
      style={{
        ...style,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        background: '#222233',
        color: '#cccccc',
        border: '1px solid #cccccc40',
        fontSize: size * 0.6,
        fontWeight: 700,
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
