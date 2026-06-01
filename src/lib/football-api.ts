import { MatchStage } from '@prisma/client'

const BASE_URL = 'https://v3.football.api-sports.io'

export type ApiFixture = {
  fixture: {
    id: number
    date: string
    status: { short: string }
    venue?: { name?: string | null }
  }
  league?: {
    round?: string
  }
  teams: {
    home: { id: number; name: string; code?: string }
    away: { id: number; name: string; code?: string }
  }
  goals: { home: number | null; away: number | null }
  score: { fulltime: { home: number | null; away: number | null } }
}

export type Tournament = {
  leagueId: number
  season: number
  name: string
  /** Optional filter applied after fetching. Return true to include the fixture. */
  teamFilter?: (fixture: ApiFixture) => boolean
}

// All FIFA World Cup champion nations (team names as used by API-Football)
export const WORLD_CUP_CHAMPIONS = new Set([
  'Uruguay',
  'Italy',
  'Germany',
  'Brazil',
  'England',
  'Argentina',
  'France',
  'Spain',
])

export const TOURNAMENTS = {
  WORLD_CUP_2026: {
    leagueId: 1,
    season: 2026,
    name: 'FIFA World Cup 2026',
  },
  FRIENDLIES_CHAMPIONS_2026: {
    leagueId: 10,
    season: 2026,
    name: 'International Friendlies 2026 (Champions)',
    teamFilter: (fixture: ApiFixture) =>
      WORLD_CUP_CHAMPIONS.has(fixture.teams.home.name) ||
      WORLD_CUP_CHAMPIONS.has(fixture.teams.away.name),
  },
} as const satisfies Record<string, Tournament>

export function mapApiRoundToStage(round: string): MatchStage {
  if (round.startsWith('Group Stage')) return 'GROUP'
  if (round === 'Round of 32') return 'ROUND_OF_32'
  if (round === 'Round of 16') return 'ROUND_OF_16'
  if (round === 'Quarter-finals') return 'QUARTER_FINAL'
  if (round === 'Semi-finals') return 'SEMI_FINAL'
  if (round === '3rd Place Final') return 'THIRD_PLACE'
  if (round === 'Final') return 'FINAL'
  return 'FRIENDLY'
}

async function apiFetch(path: string): Promise<unknown> {
  const apiKey = process.env.FOOTBALL_API_KEY
  if (!apiKey) throw new Error('FOOTBALL_API_KEY is not set')

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'x-apisports-key': apiKey },
  })

  if (!res.ok) throw new Error(`API-Football error: ${res.status}`)
  return res.json()
}

export async function fetchFixtures(tournament: Tournament): Promise<ApiFixture[]> {
  const data = await apiFetch(
    `/fixtures?league=${tournament.leagueId}&season=${tournament.season}`
  ) as { response: ApiFixture[] }
  const fixtures = data.response
  return tournament.teamFilter ? fixtures.filter(tournament.teamFilter) : fixtures
}

/** @deprecated Use fetchFixtures(TOURNAMENTS.WORLD_CUP_2026) instead */
export async function fetchWorldCupFixtures(): Promise<ApiFixture[]> {
  return fetchFixtures(TOURNAMENTS.WORLD_CUP_2026)
}
