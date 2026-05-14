import { prisma } from '@/lib/db'
import { MatchStage } from '@prisma/client'

type Outcome = 'home' | 'away' | 'draw'

function getOutcome(home: number, away: number): Outcome {
  if (home > away) return 'home'
  if (away > home) return 'away'
  return 'draw'
}

const KNOCKOUT_STAGES: MatchStage[] = [
  'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL',
]

export function calculatePoints(
  prediction: { homeScore: number; awayScore: number; predictedWinnerId: string | null },
  match: {
    homeScore: number | null
    awayScore: number | null
    winnerId: string | null
    stage: MatchStage
    homeTeamId: string | null
    awayTeamId: string | null
  }
): number | null {
  if (match.homeScore === null || match.awayScore === null) return null

  const actualOutcome = getOutcome(match.homeScore, match.awayScore)
  const predictedOutcome = getOutcome(prediction.homeScore, prediction.awayScore)

  if (actualOutcome !== predictedOutcome) return 0

  const isExact = prediction.homeScore === match.homeScore && prediction.awayScore === match.awayScore

  let points: number
  if (isExact) {
    points = 5
  } else {
    const homeBonus = prediction.homeScore === match.homeScore ? 1 : 0
    const awayBonus = prediction.awayScore === match.awayScore ? 1 : 0
    points = 2 + homeBonus + awayBonus
  }

  if (
    KNOCKOUT_STAGES.includes(match.stage) &&
    prediction.predictedWinnerId &&
    prediction.predictedWinnerId === match.winnerId
  ) {
    points += 2
  }

  return points
}

export async function scoreMatch(matchId: string): Promise<void> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      homeScore: true,
      awayScore: true,
      winnerId: true,
      stage: true,
      homeTeamId: true,
      awayTeamId: true,
      status: true,
    },
  })

  if (!match || match.status !== 'FINISHED') return

  const predictions = await prisma.prediction.findMany({ where: { matchId } })

  for (const prediction of predictions) {
    const points = calculatePoints(prediction, match)
    if (points !== null) {
      await prisma.prediction.update({
        where: { id: prediction.id },
        data: { points },
      })
    }
  }
}
