import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchWorldCupFixtures, type ApiFixture } from '@/lib/football-api'

const mockFixture: ApiFixture = {
  fixture: {
    id: 12345,
    date: '2026-06-11T21:00:00+00:00',
    status: { short: 'FT' },
  },
  teams: {
    home: { name: 'Estados Unidos', id: 1 },
    away: { name: 'Paraguay', id: 2 },
  },
  goals: { home: 2, away: 0 },
  score: { fulltime: { home: 2, away: 0 } },
}

describe('fetchWorldCupFixtures', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    process.env.FOOTBALL_API_KEY = 'test-api-key'
  })

  it('devuelve fixtures cuando la API responde ok', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: [mockFixture] }),
    } as Response)

    const result = await fetchWorldCupFixtures()

    expect(result).toHaveLength(1)
    expect(result[0].fixture.id).toBe(12345)
    expect(result[0].goals.home).toBe(2)
  })

  it('lanza error si la API falla', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 429,
    } as Response)

    await expect(fetchWorldCupFixtures()).rejects.toThrow('API-Football error: 429')
  })
})
