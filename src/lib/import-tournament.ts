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

  // Collect unique teams by apiId — fixtures always have numeric id, code is often absent
  const teamByApiId = new Map<number, { apiId: number; name: string; code: string }>()
  for (const fixture of fixtures) {
    const { home, away } = fixture.teams
    if (!teamByApiId.has(home.id))
      teamByApiId.set(home.id, { apiId: home.id, name: home.name, code: home.code || `T${home.id}` })
    if (!teamByApiId.has(away.id))
      teamByApiId.set(away.id, { apiId: away.id, name: away.name, code: away.code || `T${away.id}` })
  }
  console.log('[import-tournament] unique teams:', teamByApiId.size, [...teamByApiId.values()].map(t => `${t.name}(${t.code})`))

  for (const team of teamByApiId.values()) {
    const flag = getFlagEmoji(team.code)
    await prisma.team.upsert({
      where: { apiId: team.apiId },
      update: { name: team.name, flag },
      create: { code: team.code, name: team.name, apiId: team.apiId, flag },
    })
  }

  // Build apiId → DB id map for match linking
  const dbTeams = await prisma.team.findMany({
    where: { apiId: { in: [...teamByApiId.keys()] } },
    select: { id: true, apiId: true },
  })
  const apiIdToDbId = new Map(dbTeams.map(t => [t.apiId!, t.id]))

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

    const homeTeamId = apiIdToDbId.get(fixture.teams.home.id) ?? null
    const awayTeamId = apiIdToDbId.get(fixture.teams.away.id) ?? null
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

  console.log('[import-tournament] done', { teamsUpserted: teamByApiId.size, matchesUpserted })
  return { tournamentId: tournament.id, teamsUpserted: teamByApiId.size, matchesUpserted }
}
