import { getSymbology } from './client'

// Fetched once, shared across all consumers.
let promise: Promise<Map<string, string>> | null = null

export function loadSymbolMap(): Promise<Map<string, string>> {
  if (!promise) {
    promise = getSymbology().then(
      (symbols) => new Map(symbols.map((s) => [s.symbol, s.svg_uri])),
    )
  }
  return promise
}
