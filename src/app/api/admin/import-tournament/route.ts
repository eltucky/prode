import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { importTournament } from '@/lib/import-tournament'
import type { Tournament } from '@/lib/football-api'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { leagueId, season, name } = body as Record<string, unknown>

  if (typeof leagueId !== 'number' || typeof season !== 'number' || typeof name !== 'string' || !name) {
    return NextResponse.json(
      { error: 'Body must include leagueId (number), season (number), name (string)' },
      { status: 400 }
    )
  }

  const config: Tournament = { leagueId, season, name }

  try {
    const result = await importTournament(config)
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
