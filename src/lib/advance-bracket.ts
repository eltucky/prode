import { prisma } from '@/lib/db'
import { knockoutAdvancement, groupToR32 } from '@/lib/bracket-config'

async function setMatchTeam(matchNumber: number, slot: 'home' | 'away', teamId: string): Promise<void> {
  await prisma.match.update({
    where: { matchNumber },
    data: slot === 'home' ? { homeTeamId: teamId } : { awayTeamId: teamId },
  })
}

type Standing = { teamId: string; points: number; goalDiff: number; goalsFor: number }

async function computeGroupStandings(groupName: string): Promise<Standing[] | null> {
  const allMatches = await prisma.match.findMany({
    where: { stage: 'GROUP', groupName },
    select: { status: true, homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true },
  })

  if (allMatches.some(m => m.status !== 'FINISHED')) return null

  const map = new Map<string, Standing>()
  const ensure = (id: string) => {
    if (!map.has(id)) map.set(id, { teamId: id, points: 0, goalDiff: 0, goalsFor: 0 })
  }

  for (const m of allMatches) {
    if (!m.homeTeamId || !m.awayTeamId || m.homeScore === null || m.awayScore === null) continue
    ensure(m.homeTeamId)
    ensure(m.awayTeamId)
    const home = map.get(m.homeTeamId)!
    const away = map.get(m.awayTeamId)!
    home.goalsFor += m.homeScore
    home.goalDiff += m.homeScore - m.awayScore
    away.goalsFor += m.awayScore
    away.goalDiff += m.awayScore - m.homeScore
    if (m.homeScore > m.awayScore) {
      home.points += 3
    } else if (m.awayScore > m.homeScore) {
      away.points += 3
    } else {
      home.points += 1
      away.points += 1
    }
  }

  return [...map.values()].sort((a, b) =>
    b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor
  )
}

async function advanceGroup(groupName: string): Promise<void> {
  const standings = await computeGroupStandings(groupName)
  if (!standings) return

  const [first, second] = standings
  if (!first || !second) return

  const slots = groupToR32.filter(s => s.group === groupName)
  await Promise.all(
    slots.map(slot =>
      setMatchTeam(slot.matchNumber, slot.slot, slot.position === 1 ? first.teamId : second.teamId)
    )
  )
}

async function advanceKnockout(
  matchNumber: number,
  winnerId: string | null,
  homeTeamId: string | null,
  awayTeamId: string | null
): Promise<void> {
  const config = knockoutAdvancement[matchNumber]
  if (!config) return

  const ops: Promise<void>[] = []

  if (config.winner && winnerId) {
    ops.push(setMatchTeam(config.winner.matchNumber, config.winner.slot, winnerId))
  }

  if (config.loser) {
    const loserId = winnerId === homeTeamId ? awayTeamId : homeTeamId
    if (loserId) ops.push(setMatchTeam(config.loser.matchNumber, config.loser.slot, loserId))
  }

  await Promise.all(ops)
}

export async function advanceBracket(matchId: string): Promise<void> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      matchNumber: true,
      stage: true,
      groupName: true,
      status: true,
      winnerId: true,
      homeTeamId: true,
      awayTeamId: true,
    },
  })

  if (!match || match.status !== 'FINISHED') return

  if (match.stage === 'GROUP') {
    if (match.groupName) await advanceGroup(match.groupName)
  } else {
    await advanceKnockout(match.matchNumber, match.winnerId, match.homeTeamId, match.awayTeamId)
  }
}
