// src/app/(shell)/torneo/page.tsx
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { MatchStage } from '@prisma/client'
import { MatchCard } from '@/components/match-card'
import { TorneoFilters } from '@/components/torneo-filters'
import { computeGroupStatusMap, type GroupStatus, LOCK_THRESHOLD_MS } from '@/lib/group-status'
import { getLocale, getDictionary, type Dictionary } from '@/lib/i18n'

const KNOCKOUT_STAGES: MatchStage[] = [
  'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL',
]

function isLocked(scheduledAt: Date): boolean {
  return Date.now() >= scheduledAt.getTime() - LOCK_THRESHOLD_MS
}

const stageOrder: MatchStage[] = [
  'GROUP', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL',
]

function getStageLabels(dict: Dictionary): Record<MatchStage, string> {
  return {
    GROUP:         dict.torneo.stageGroup,
    ROUND_OF_32:   dict.torneo.stageRound32,
    ROUND_OF_16:   dict.torneo.stageRound16,
    QUARTER_FINAL: dict.torneo.stageQuarter,
    SEMI_FINAL:    dict.torneo.stageSemi,
    THIRD_PLACE:   dict.torneo.stageThird,
    FINAL:         dict.torneo.stageFinal,
  }
}

export default async function TorneoPage({
  searchParams,
}: {
  searchParams: Promise<{ etapa?: string; grupo?: string }>
}) {
  const locale = await getLocale()
  const dict = await getDictionary(locale)

  const { etapa, grupo } = await searchParams
  const session = await auth()

  const STAGE_LABELS = getStageLabels(dict)

  const VALID_STAGES = new Set<string>(stageOrder)
  const stageFilter = etapa && VALID_STAGES.has(etapa) ? (etapa as MatchStage) : undefined
  const showingGroupStage = !stageFilter || stageFilter === 'GROUP'

  // Lazy IN_PROGRESS transition: first visitor after match start triggers the update
  await prisma.match.updateMany({
    where: { status: 'SCHEDULED', scheduledAt: { lt: new Date() } },
    data: { status: 'IN_PROGRESS' },
  })

  // Lightweight query: which stages have at least one defined match
  const definedStageRows = await prisma.match.findMany({
    where: { homeTeamId: { not: null }, awayTeamId: { not: null } },
    select: { stage: true },
    distinct: ['stage'],
  })
  const stagesWithMatches = new Set(definedStageRows.map(r => r.stage))
  const filterableStages = stageOrder.filter(s => stagesWithMatches.has(s))
  const showStageFilter = filterableStages.length > 1

  const matches = await prisma.match.findMany({
    where: {
      ...(stageFilter ? { stage: stageFilter } : {}),
      homeTeamId: { not: null },
      awayTeamId: { not: null },
    },
    include: { homeTeam: true, awayTeam: true },
    orderBy: [{ scheduledAt: 'asc' }, { matchNumber: 'asc' }],
  })

  const predictions = session?.user?.id ? await prisma.prediction.findMany({
    where: {
      userId: session.user.id,
      matchId: { in: matches.map(m => m.id) },
    },
  }) : []
  const predMap = new Map(predictions.map(p => [p.matchId, p]))

  const groupMatches = matches.filter(m => m.stage === 'GROUP')
  const groupStatusMap = session?.user?.id
    ? computeGroupStatusMap(groupMatches, new Set(predMap.keys()))
    : new Map<string, GroupStatus>()

  const availableGroups = showingGroupStage
    ? [...new Set(matches.filter(m => m.stage === 'GROUP' && m.groupName).map(m => m.groupName!))].sort()
    : []

  const grupoFilter = showingGroupStage && grupo && availableGroups.includes(grupo) ? grupo : undefined

  const byStage = matches.reduce<Record<string, typeof matches>>((acc, match) => {
    const key = match.stage
    if (!acc[key]) acc[key] = []
    if (match.stage === 'GROUP' && grupoFilter && match.groupName !== grupoFilter) return acc
    acc[key].push(match)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <TorneoFilters
        showStageFilter={showStageFilter}
        filterableStages={filterableStages}
        stageFilter={stageFilter}
        showingGroupStage={showingGroupStage}
        availableGroups={availableGroups}
        grupoFilter={grupoFilter}
        groupStatusMap={Object.fromEntries(groupStatusMap)}
      >
        {stageOrder.filter(s => byStage[s]?.length).map(stage => (
          <section key={stage}>
            <h2 className="text-base font-bold mb-3 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              {STAGE_LABELS[stage]}
              {stage === 'GROUP' && grupoFilter && (
                <span className="ml-2 font-normal normal-case" style={{ color: 'var(--text-dimmed)' }}>
                  — Grupo {grupoFilter}
                </span>
              )}
            </h2>
            <div className="space-y-2">
              {byStage[stage].map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  prediction={predMap.get(match.id) ?? null}
                  hasSession={!!session}
                  showGroupLabel={!grupoFilter}
                  locked={isLocked(match.scheduledAt)}
                  isKnockout={KNOCKOUT_STAGES.includes(match.stage)}
                  dict={dict}
                />
              ))}
            </div>
          </section>
        ))}
      </TorneoFilters>
    </div>
  )
}
