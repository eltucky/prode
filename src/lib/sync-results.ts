import { prisma } from '@/lib/db'
import { fetchWorldCupFixtures, type ApiFixture } from '@/lib/football-api'
import { MatchStatus } from '@prisma/client'

export function mapApiStatusToMatchStatus(apiStatus: string): MatchStatus {
  if (['FT', 'AET', 'PEN'].includes(apiStatus)) return 'FINISHED'
  if (apiStatus === 'PST') return 'POSTPONED'
  if (apiStatus === 'CANC') return 'CANCELLED'
  if (['1H', 'HT', '2H', 'ET', 'BT', 'P'].includes(apiStatus)) return 'IN_PROGRESS'
  return 'SCHEDULED'
}

export function determineWinnerId(
  homeScore: number | null,
  awayScore: number | null,
  homeTeamId: string | null,
  awayTeamId: string | null
): string | null {
  if (homeScore === null || awayScore === null) return null
  if (homeScore > awayScore) return homeTeamId
  if (awayScore > homeScore) return awayTeamId
  return null
}

export async function syncResults(): Promise<{ updated: number; linked: number }> {
  const fixtures = await fetchWorldCupFixtures()
  let updated = 0
  let linked = 0

  const localMatches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true },
  })

  for (const fixture of fixtures) {
    const apiStatus = fixture.fixture.status.short
    const matchStatus = mapApiStatusToMatchStatus(apiStatus)
    const fixtureDate = new Date(fixture.fixture.date)

    let localMatch = localMatches.find(m => m.externalId === String(fixture.fixture.id))

    if (!localMatch) {
      const homeName = fixture.teams.home.name
      const awayName = fixture.teams.away.name
      const dayStart = new Date(fixtureDate)
      dayStart.setUTCHours(0, 0, 0, 0)
      const dayEnd = new Date(fixtureDate)
      dayEnd.setUTCHours(23, 59, 59, 999)

      localMatch = localMatches.find(m =>
        m.scheduledAt >= dayStart &&
        m.scheduledAt <= dayEnd &&
        (m.homeTeam?.name === homeName || m.homeTeam?.name.includes(homeName.split(' ')[0])) &&
        (m.awayTeam?.name === awayName || m.awayTeam?.name.includes(awayName.split(' ')[0]))
      )

      if (localMatch) {
        await prisma.match.update({
          where: { id: localMatch.id },
          data: { externalId: String(fixture.fixture.id) },
        })
        linked++
      }
    }

    if (!localMatch) continue

    if (matchStatus === 'POSTPONED') {
      await prisma.match.update({
        where: { id: localMatch.id },
        data: { status: 'POSTPONED', scheduledAt: fixtureDate },
      })
      updated++
      continue
    }

    if (matchStatus === 'FINISHED') {
      const homeScore = fixture.score.fulltime.home
      const awayScore = fixture.score.fulltime.away
      const winnerId = determineWinnerId(
        homeScore,
        awayScore,
        localMatch.homeTeamId,
        localMatch.awayTeamId
      )

      await prisma.match.update({
        where: { id: localMatch.id },
        data: {
          status: 'FINISHED',
          homeScore: homeScore ?? undefined,
          awayScore: awayScore ?? undefined,
          winnerId: winnerId ?? undefined,
          scheduledAt: fixtureDate,
        },
      })
      updated++
    }
  }

  return { updated, linked }
}
