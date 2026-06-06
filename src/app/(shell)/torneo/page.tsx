// src/app/(shell)/torneo/page.tsx
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { MatchStage } from '@prisma/client'
import { MatchCard } from '@/components/match-card'

const STAGE_LABELS: Record<MatchStage, string> = {
  GROUP:         'Fase de Grupos',
  ROUND_OF_32:   'Ronda de 32',
  ROUND_OF_16:   'Octavos',
  QUARTER_FINAL: 'Cuartos',
  SEMI_FINAL:    'Semifinales',
  THIRD_PLACE:   'Tercer Puesto',
  FINAL:         'Final',
}

const KNOCKOUT_STAGES: MatchStage[] = [
  'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL',
]

function isLocked(scheduledAt: Date): boolean {
  return Date.now() >= scheduledAt.getTime() - 60 * 1000
}

function groupFilterHref(stageFilter: MatchStage | undefined, grupo: string | undefined, target: string | undefined): string {
  const params = new URLSearchParams()
  if (stageFilter) params.set('etapa', stageFilter)
  else params.set('etapa', 'GROUP')
  if (target) params.set('grupo', target)
  return `/torneo?${params.toString()}`
}

const stageOrder: MatchStage[] = [
  'GROUP', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL',
]

export default async function TorneoPage({
  searchParams,
}: {
  searchParams: Promise<{ etapa?: string; grupo?: string }>
}) {
  const { etapa, grupo } = await searchParams
  const session = await auth()

  const VALID_STAGES = new Set<string>(stageOrder)
  const stageFilter = etapa && VALID_STAGES.has(etapa) ? (etapa as MatchStage) : undefined
  const showingGroupStage = !stageFilter || stageFilter === 'GROUP'

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

  const pillClass = (active: boolean) =>
    `text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${active ? 'font-bold' : ''}`

  return (
    <div className="space-y-6">
      {/* Stage filter — only when more than one stage has defined matches */}
      {showStageFilter && (
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="/torneo"
            className={pillClass(!stageFilter)}
            style={{
              background: !stageFilter ? 'var(--accent)' : 'var(--surface-raised)',
              color: !stageFilter ? '#000' : 'var(--text-muted)',
            }}
          >
            Todos
          </a>
          {filterableStages.map(stage => (
            <a
              key={stage}
              href={`/torneo?etapa=${stage}`}
              className={pillClass(stageFilter === stage && !grupoFilter)}
              style={{
                background: stageFilter === stage && !grupoFilter ? 'var(--accent)' : 'var(--surface-raised)',
                color: stageFilter === stage && !grupoFilter ? '#000' : 'var(--text-muted)',
              }}
            >
              {STAGE_LABELS[stage]}
            </a>
          ))}
        </div>
      )}

      {/* Group filter */}
      {showingGroupStage && availableGroups.length > 0 && (
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs mr-1" style={{ color: 'var(--text-muted)' }}>Grupo:</span>
          <a
            href={stageFilter === 'GROUP' ? '/torneo?etapa=GROUP' : '/torneo'}
            className={pillClass(!grupoFilter)}
            style={{
              background: !grupoFilter ? 'var(--accent)' : 'var(--surface-raised)',
              color: !grupoFilter ? '#000' : 'var(--text-muted)',
            }}
          >
            Todos
          </a>
          {availableGroups.map(g => (
            <a
              key={g}
              href={groupFilterHref(stageFilter, grupo, g)}
              className={pillClass(grupoFilter === g)}
              style={{
                background: grupoFilter === g ? 'var(--accent)' : 'var(--surface-raised)',
                color: grupoFilter === g ? '#000' : 'var(--text-muted)',
              }}
            >
              {g}
            </a>
          ))}
        </div>
      )}

      {/* Match list */}
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
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
