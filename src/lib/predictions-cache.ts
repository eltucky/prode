import 'server-only'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/db'

export function getCachedUserPredictions(userId: string, matchIds: string[]) {
  return unstable_cache(
    async (uid: string, mids: string[]) =>
      prisma.prediction.findMany({
        where: { userId: uid, matchId: { in: mids } },
      }),
    ['user-predictions', userId],
    { revalidate: 60, tags: [`predictions-${userId}`] }
  )(userId, matchIds)
}

const KNOCKOUT_STAGES = new Set([
  'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL',
])

export const getCachedTodosStandings = unstable_cache(
  async () => {
    const allUsers = await prisma.user.findMany({ where: { isBlocked: false } })
    const userIds = allUsers.map(u => u.id)

    const [playedPredictions, pendingPredictions, totalPendingMatchCount] = await Promise.all([
      prisma.prediction.findMany({
        where: { userId: { in: userIds }, points: { not: null } },
        select: { userId: true, points: true, match: { select: { stage: true } } },
      }),
      prisma.prediction.findMany({
        where: {
          userId: { in: userIds },
          points: null,
          match: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
        },
        select: { userId: true },
      }),
      prisma.match.count({
        where: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
      }),
    ])

    const standings = allUsers
      .map(user => {
        const played = playedPredictions.filter(p => p.userId === user.id)
        const pending = pendingPredictions.filter(p => p.userId === user.id)
        return {
          user,
          points: played.reduce((sum, p) => sum + (p.points ?? 0), 0),
          maxPlayedPoints: played.reduce(
            (sum, p) => sum + (KNOCKOUT_STAGES.has(p.match.stage) ? 7 : 5),
            0
          ),
          correctCount: played.filter(p => (p.points ?? 0) > 0).length,
          totalPlayed: played.length,
          pendingCount: pending.length,
        }
      })
      .sort((a, b) => b.points - a.points || b.correctCount - a.correctCount)

    return { standings, totalPendingMatchCount }
  },
  ['standings-todos'],
  { revalidate: 60, tags: ['standings-todos'] }
)
