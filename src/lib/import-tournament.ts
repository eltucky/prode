import { prisma } from '@/lib/db'
import { fetchFixtures, mapApiRoundToStage, type Tournament } from '@/lib/football-api'
import { getFlagEmoji } from '@/lib/flag-emoji'

export type ImportResult = {
  tournamentId: string
  teamsUpserted: number
  matchesUpserted: number
}

export async function importTournament(config: Tournament): Promise<ImportResult> {
  console.log('[import-tournament] start', { leagueId: config.leagueId, season: config.season, name: config.name })

  const fixtures = await fetchFixtures(config)
  console.log('[import-tournament] fixtures fetched:', fixtures.length)

  const tournament = await prisma.tournament.upsert({
    where: { externalId_season: { externalId: config.leagueId, season: config.season } },
    update: { name: config.name },
    create: { externalId: config.leagueId, season: config.season, name: config.name },
  })
  console.log('[import-tournament] tournament upserted:', tournament.id)

  // Collect unique teams (skip TBD placeholders without a code)
  const teamDataMap = new Map<string, { apiId: number; name: string; code: string }>()
  for (const fixture of fixtures) {
    const { home, away } = fixture.teams
    if (home.code) teamDataMap.set(home.code, { apiId: home.id, name: home.name, code: home.code })
    if (away.code) teamDataMap.set(away.code, { apiId: away.id, name: away.name, code: away.code })
  }
  console.log('[import-tournament] unique teams with code:', teamDataMap.size, [...teamDataMap.keys()])

  for (const team of teamDataMap.values()) {
    const flag = getFlagEmoji(team.code)
    await prisma.team.upsert({
      where: { code: team.code },
      update: { name: team.name, apiId: team.apiId, flag },
      create: { code: team.code, name: team.name, apiId: team.apiId, flag },
    })
  }

  // Build code → DB id map to avoid per-match queries
  const dbTeams = await prisma.team.findMany({
    where: { code: { in: [...teamDataMap.keys()] } },
    select: { id: true, code: true },
  })
  const codeToId = new Map(dbTeams.map(t => [t.code, t.id]))

  // Get next matchNumber for this tournament (stable across re-imports)
  const { _max } = await prisma.match.aggregate({
    where: { tournamentId: tournament.id },
    _max: { matchNumber: true },
  })
  let nextMatchNumber = (_max.matchNumber ?? 0) + 1

  // Sort by date so matchNumbers reflect chronological order on first import
  const sorted = [...fixtures].sort(
    (a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
  )

  let matchesUpserted = 0
  for (const fixture of sorted) {
    const round = fixture.league?.round ?? ''
    const stage = mapApiRoundToStage(round)
    const groupName = round.startsWith('Group Stage')
      ? (round.split(' - ')[1] ?? null)
      : null

    const homeTeamId = fixture.teams.home.code ? (codeToId.get(fixture.teams.home.code) ?? null) : null
    const awayTeamId = fixture.teams.away.code ? (codeToId.get(fixture.teams.away.code) ?? null) : null
    const venue = fixture.fixture.venue?.name ?? null
    const scheduledAt = new Date(fixture.fixture.date)
    const externalId = String(fixture.fixture.id)

    const existing = await prisma.match.findUnique({ where: { externalId } })

    if (existing) {
      await prisma.match.update({
        where: { id: existing.id },
        data: { scheduledAt, stage, groupName, venue, homeTeamId, awayTeamId },
      })
    } else {
      await prisma.match.create({
        data: {
          externalId,
          tournamentId: tournament.id,
          matchNumber: nextMatchNumber++,
          scheduledAt,
          stage,
          groupName,
          venue,
          homeTeamId,
          awayTeamId,
          status: 'SCHEDULED',
        },
      })
    }
    matchesUpserted++
  }

  console.log('[import-tournament] done', { teamsUpserted: teamDataMap.size, matchesUpserted })
  return { tournamentId: tournament.id, teamsUpserted: teamDataMap.size, matchesUpserted }
}
