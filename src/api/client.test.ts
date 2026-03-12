import { describe, it, expect, vi, beforeEach } from 'vitest'
import { searchCards, getCardById, getRulings, getSymbology } from './client'
import { mockBolt } from '../test/fixtures'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function jsonResponse(data: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  })
}

describe('client', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('searchCards', () => {
    it('calls /cards with query params', async () => {
      mockFetch.mockReturnValue(jsonResponse({ results: [], total: 0, page: 1, page_size: 20 }))
      await searchCards({ name: 'bolt', page: 1 })
      const url = new URL(mockFetch.mock.calls[0][0])
      expect(url.pathname).toBe('/cards')
      expect(url.searchParams.get('q')).toBe('bolt')
    })

    it('passes color array as multiple params', async () => {
      mockFetch.mockReturnValue(jsonResponse({ results: [], total: 0, page: 1, page_size: 20 }))
      await searchCards({ color: ['R', 'G'], page: 1 })
      const url = new URL(mockFetch.mock.calls[0][0])
      expect(url.searchParams.getAll('color')).toEqual(['R', 'G'])
    })

    it('omits undefined params', async () => {
      mockFetch.mockReturnValue(jsonResponse({ results: [], total: 0, page: 1, page_size: 20 }))
      await searchCards({ page: 1 })
      const url = new URL(mockFetch.mock.calls[0][0])
      expect(url.searchParams.has('q')).toBe(false)
      expect(url.searchParams.has('type')).toBe(false)
    })

    it('passes view param', async () => {
      mockFetch.mockReturnValue(jsonResponse({ results: [], total: 0, page: 1, page_size: 20 }))
      await searchCards({ page: 1, view: 'list' })
      const url = new URL(mockFetch.mock.calls[0][0])
      expect(url.searchParams.get('view')).toBe('list')
    })
  })

  describe('getCardById', () => {
    it('calls /cards/{oracleId}', async () => {
      mockFetch.mockReturnValue(jsonResponse(mockBolt))
      const result = await getCardById('abc-123')
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/cards/abc-123'))
      expect(result.name).toBe('Lightning Bolt')
    })
  })

  describe('getRulings', () => {
    it('calls /rulings/{oracleId}', async () => {
      mockFetch.mockReturnValue(jsonResponse({ rulings: [] }))
      await getRulings('abc-123')
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/rulings/abc-123'))
    })
  })

  describe('getSymbology', () => {
    it('calls /cards/symbols', async () => {
      mockFetch.mockReturnValue(jsonResponse([]))
      await getSymbology()
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/cards/symbols'))
    })
  })

  describe('error handling', () => {
    it('throws on non-ok response', async () => {
      mockFetch.mockReturnValue(jsonResponse('Not found', 404))
      await expect(getCardById('bad')).rejects.toThrow('API 404')
    })
  })
})
