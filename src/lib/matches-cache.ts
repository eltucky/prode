import 'server-only'
import { unstable_cache } from 'next/cache'
import { MatchStage } from '@prisma/client'
import { prisma } from '@/lib/db'

const stageOrder: MatchStage[] = [
  'GROUP', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL',
]

export const getCachedFilterableStages = unstable_cache(
  async () => {
    const rows = await prisma.match.findMany({
      where: { homeTeamId: { not: null }, awayTeamId: { not: null } },
      select: { stage: true },
      distinct: ['stage'],
    })
    const stagesWithMatches = new Set(rows.map(r => r.stage))
    return stageOrder.filter(s => stagesWithMatches.has(s))
  },
  ['filterable-stages'],
  { revalidate: 60, tags: ['matches'] }
)

export const getCachedMatches = unstable_cache(
  async (stageFilter: MatchStage | null) => {
    const matches = await prisma.match.findMany({
      where: {
        ...(stageFilter ? { stage: stageFilter } : {}),
        homeTeamId: { not: null },
        awayTeamId: { not: null },
      },
      include: { homeTeam: true, awayTeam: true },
      orderBy: [{ scheduledAt: 'asc' }, { matchNumber: 'asc' }],
    })
    return matches.map(m => ({
      ...m,
      scheduledAt: m.scheduledAt.toISOString(),
    }))
  },
  ['matches'],
  { revalidate: 60, tags: ['matches'] }
)

export type CachedMatch = Awaited<ReturnType<typeof getCachedMatches>>[number]
