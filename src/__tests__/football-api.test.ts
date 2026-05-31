import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  fetchWorldCupFixtures,
  fetchFixtures,
  TOURNAMENTS,
  WORLD_CUP_CHAMPIONS,
  type ApiFixture,
} from '@/lib/football-api'

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

const championFixture: ApiFixture = {
  fixture: {
    id: 99999,
    date: '2026-03-20T20:00:00+00:00',
    status: { short: 'NS' },
  },
  teams: {
    home: { name: 'Argentina', id: 26 },
    away: { name: 'Germany', id: 25 },
  },
  goals: { home: null, away: null },
  score: { fulltime: { home: null, away: null } },
}

const nonChampionFixture: ApiFixture = {
  fixture: {
    id: 88888,
    date: '2026-03-20T22:00:00+00:00',
    status: { short: 'NS' },
  },
  teams: {
    home: { name: 'Bolivia', id: 200 },
    away: { name: 'Chile', id: 201 },
  },
  goals: { home: null, away: null },
  score: { fulltime: { home: null, away: null } },
}

describe('WORLD_CUP_CHAMPIONS', () => {
  it('incluye a los 8 campeones históricos', () => {
    expect(WORLD_CUP_CHAMPIONS.size).toBe(8)
    for (const team of ['Brazil', 'Germany', 'Italy', 'Argentina', 'France', 'England', 'Spain', 'Uruguay']) {
      expect(WORLD_CUP_CHAMPIONS.has(team)).toBe(true)
    }
  })
})

describe('fetchFixtures', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    process.env.FOOTBALL_API_KEY = 'test-api-key'
  })

  it('llama a la URL correcta con leagueId y season del torneo', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: [mockFixture] }),
    } as Response)

    await fetchFixtures(TOURNAMENTS.WORLD_CUP_2026)

    expect(fetch).toHaveBeenCalledWith(
      'https://v3.football.api-sports.io/fixtures?league=1&season=2026',
      expect.any(Object)
    )
  })

  it('devuelve todos los fixtures cuando no hay teamFilter', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: [mockFixture, championFixture] }),
    } as Response)

    const result = await fetchFixtures(TOURNAMENTS.WORLD_CUP_2026)
    expect(result).toHaveLength(2)
  })

  it('filtra amistosos para incluir solo partidos con campeones del mundo', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: [championFixture, nonChampionFixture] }),
    } as Response)

    const result = await fetchFixtures(TOURNAMENTS.FRIENDLIES_CHAMPIONS_2026)
    expect(result).toHaveLength(1)
    expect(result[0].fixture.id).toBe(99999)
  })

  it('incluye un amistoso donde solo el equipo visitante es campeón', async () => {
    const mixedFixture: ApiFixture = {
      ...nonChampionFixture,
      fixture: { ...nonChampionFixture.fixture, id: 77777 },
      teams: {
        home: { name: 'Bolivia', id: 200 },
        away: { name: 'Brazil', id: 6 },
      },
    }

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: [mixedFixture, nonChampionFixture] }),
    } as Response)

    const result = await fetchFixtures(TOURNAMENTS.FRIENDLIES_CHAMPIONS_2026)
    expect(result).toHaveLength(1)
    expect(result[0].fixture.id).toBe(77777)
  })

  it('lanza error si la API falla', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 429,
    } as Response)

    await expect(fetchFixtures(TOURNAMENTS.WORLD_CUP_2026)).rejects.toThrow('API-Football error: 429')
  })
})

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
