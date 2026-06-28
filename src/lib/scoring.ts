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
    homeTeamId: string | null
    awayTeamId: string | null
    stage: MatchStage
  }
): number | null {
  if (match.homeScore === null || match.awayScore === null) return null

  const actualOutcome = getOutcome(match.homeScore, match.awayScore)
  const predictedOutcome = getOutcome(prediction.homeScore, prediction.awayScore)

  if (actualOutcome !== predictedOutcome) return 0

  const homeBonus = prediction.homeScore === match.homeScore ? 1 : 0
  const awayBonus = prediction.awayScore === match.awayScore ? 1 : 0
  const isExact = homeBonus === 1 && awayBonus === 1
  const base = isExact ? 3 : 2
  let points = base + homeBonus + awayBonus

  if (KNOCKOUT_STAGES.includes(match.stage)) {
    // For non-draw predictions the winner is implicit from the score.
    // For draw predictions the user must have selected it explicitly.
    const impliedWinnerId = prediction.predictedWinnerId
      ?? (prediction.homeScore > prediction.awayScore ? match.homeTeamId
        : prediction.awayScore > prediction.homeScore ? match.awayTeamId
        : null)

    if (impliedWinnerId && impliedWinnerId === match.winnerId) {
      points += 2
    }
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
      homeTeamId: true,
      awayTeamId: true,
      stage: true,
      status: true,
    },
  })

  if (!match || match.status !== 'FINISHED') return

  const predictions = await prisma.prediction.findMany({ where: { matchId } })

  await prisma.$transaction(
    predictions
      .map(prediction => {
        const points = calculatePoints(prediction, match)
        if (points === null) return null
        return prisma.prediction.update({
          where: { id: prediction.id },
          data: { points },
        })
      })
      .filter((op): op is NonNullable<typeof op> => op !== null)
  )
}
