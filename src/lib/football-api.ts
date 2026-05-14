const BASE_URL = 'https://v3.football.api-sports.io'
const LEAGUE_ID = 1    // FIFA World Cup
const SEASON = 2026

export type ApiFixture = {
  fixture: {
    id: number
    date: string
    status: { short: string }
  }
  teams: {
    home: { id: number; name: string }
    away: { id: number; name: string }
  }
  goals: { home: number | null; away: number | null }
  score: { fulltime: { home: number | null; away: number | null } }
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

export async function fetchWorldCupFixtures(): Promise<ApiFixture[]> {
  const data = await apiFetch(`/fixtures?league=${LEAGUE_ID}&season=${SEASON}`) as { response: ApiFixture[] }
  return data.response
}
