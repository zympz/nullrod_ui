import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetSymbology = vi.fn()

vi.mock('./client', () => ({
  getSymbology: () => mockGetSymbology(),
}))

// Must re-import after mock to get fresh module state
let loadSymbolMap: () => Promise<Map<string, string>>

beforeEach(async () => {
  vi.clearAllMocks()
  // Reset module to clear cached promise
  vi.resetModules()
  const mod = await import('./symbology')
  loadSymbolMap = mod.loadSymbolMap
})

describe('loadSymbolMap', () => {
  it('returns a map of symbol to svg_uri', async () => {
    mockGetSymbology.mockResolvedValue([
      { symbol: '{W}', svg_uri: 'https://example.com/W.svg' },
      { symbol: '{U}', svg_uri: 'https://example.com/U.svg' },
    ])
    const map = await loadSymbolMap()
    expect(map.get('{W}')).toBe('https://example.com/W.svg')
    expect(map.get('{U}')).toBe('https://example.com/U.svg')
  })

  it('caches the result on subsequent calls', async () => {
    mockGetSymbology.mockResolvedValue([
      { symbol: '{B}', svg_uri: 'https://example.com/B.svg' },
    ])
    const map1 = await loadSymbolMap()
    const map2 = await loadSymbolMap()
    expect(map1).toBe(map2)
    expect(mockGetSymbology).toHaveBeenCalledTimes(1)
  })

  it('retries after a failed fetch', async () => {
    mockGetSymbology.mockRejectedValueOnce(new Error('Network error'))
    await expect(loadSymbolMap()).rejects.toThrow('Network error')

    // Reset modules to clear the null promise from failed attempt
    vi.resetModules()
    const mod = await import('./symbology')
    loadSymbolMap = mod.loadSymbolMap

    mockGetSymbology.mockResolvedValue([
      { symbol: '{R}', svg_uri: 'https://example.com/R.svg' },
    ])
    const map = await loadSymbolMap()
    expect(map.get('{R}')).toBe('https://example.com/R.svg')
  })
})
