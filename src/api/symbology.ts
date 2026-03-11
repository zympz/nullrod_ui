import { getSymbology } from './client'

// Fetched once, shared across all consumers.
let mapPromise: Promise<Map<string, string>> | null = null

export function loadSymbolMap(): Promise<Map<string, string>> {
  if (!mapPromise) {
    mapPromise = getSymbology().then(
      (symbols) => new Map(symbols.map((s) => [s.symbol, s.svg_uri])),
    )
  }
  return mapPromise
}

