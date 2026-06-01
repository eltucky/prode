import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { MatchStage, MatchStatus } from '@prisma/client'
import { ClientDate } from '@/components/client-date'
import { PredictionForm } from '@/components/prediction-form'
import Link from 'next/link'

const STAGE_LABELS: Record<MatchStage, string> = {
  FRIENDLY: 'Amistosos',
  GROUP: 'Fase de Grupos',
  ROUND_OF_32: 'Ronda de 32',
  ROUND_OF_16: 'Octavos',
  QUARTER_FINAL: 'Cuartos',
  SEMI_FINAL: 'Semifinales',
  THIRD_PLACE: 'Tercer Puesto',
  FINAL: 'Final',
}

const STATUS_BADGE: Record<MatchStatus, { label: string; class: string }> = {
  SCHEDULED:   { label: 'Programado', class: 'bg-gray-100 text-gray-600' },
  IN_PROGRESS: { label: 'En juego',   class: 'bg-yellow-100 text-yellow-700' },
  FINISHED:    { label: 'Finalizado', class: 'bg-green-100 text-green-700' },
  POSTPONED:   { label: 'Postergado', class: 'bg-red-100 text-red-700' },
  CANCELLED:   { label: 'Cancelado',  class: 'bg-red-200 text-red-800' },
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

export default async function TorneoPage({
  searchParams,
}: {
  searchParams: Promise<{ etapa?: string; grupo?: string }>
}) {
  const { etapa, grupo } = await searchParams
  const session = await auth()

  const stageOrder: MatchStage[] = [
    'FRIENDLY', 'GROUP', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL',
  ]
  const VALID_STAGES = new Set<string>(stageOrder)
  const stageFilter = etapa && VALID_STAGES.has(etapa) ? (etapa as MatchStage) : undefined

  const showingGroupStage = !stageFilter || stageFilter === 'GROUP'

  const matches = await prisma.match.findMany({
    where: stageFilter ? { stage: stageFilter } : undefined,
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

  // Available group letters from the GROUP stage matches
  const availableGroups = showingGroupStage
    ? [...new Set(matches.filter(m => m.stage === 'GROUP' && m.groupName).map(m => m.groupName!))].sort()
    : []

  const grupoFilter = showingGroupStage && grupo && availableGroups.includes(grupo) ? grupo : undefined

  const byStage = matches.reduce<Record<string, typeof matches>>((acc, match) => {
    const key = match.stage
    if (!acc[key]) acc[key] = []
    // Apply group filter only within GROUP stage
    if (match.stage === 'GROUP' && grupoFilter && match.groupName !== grupoFilter) return acc
    acc[key].push(match)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Torneo</h1>
        <div className="flex gap-2 flex-wrap">
          <a href="/torneo" className={`text-sm px-3 py-1 rounded-full border ${!stageFilter ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 hover:bg-gray-50'}`}>
            Todos
          </a>
          {stageOrder.map(stage => (
            <a
              key={stage}
              href={`/torneo?etapa=${stage}`}
              className={`text-sm px-3 py-1 rounded-full border ${stageFilter === stage && !grupoFilter ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 hover:bg-gray-50'}`}
            >
              {STAGE_LABELS[stage]}
            </a>
          ))}
        </div>
      </div>

      {showingGroupStage && availableGroups.length > 0 && (
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-gray-400 mr-1">Grupo:</span>
          <a
            href={stageFilter === 'GROUP' ? '/torneo?etapa=GROUP' : '/torneo'}
            className={`text-sm px-3 py-1 rounded-full border ${!grupoFilter ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 hover:bg-gray-50'}`}
          >
            Todos
          </a>
          {availableGroups.map(g => (
            <a
              key={g}
              href={groupFilterHref(stageFilter, grupo, g)}
              className={`text-sm px-3 py-1 rounded-full border ${grupoFilter === g ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 hover:bg-gray-50'}`}
            >
              {g}
            </a>
          ))}
        </div>
      )}

      {stageOrder.filter(s => byStage[s]?.length).map(stage => (
        <section key={stage}>
          <h2 className="text-lg font-semibold mb-3 text-gray-700">
            {STAGE_LABELS[stage]}
            {stage === 'GROUP' && grupoFilter && (
              <span className="ml-2 text-base font-normal text-gray-400">— Grupo {grupoFilter}</span>
            )}
          </h2>
          <div className="space-y-2">
            {byStage[stage].map(match => {
              const badge = STATUS_BADGE[match.status]
              const locked = isLocked(match.scheduledAt)
              const prediction = predMap.get(match.id)
              const isKnockout = KNOCKOUT_STAGES.includes(match.stage)

              return (
                <div key={match.id} className="bg-white border rounded-xl px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col min-w-0">
                      {match.groupName && !grupoFilter && (
                        <span className="text-xs text-gray-400 mb-0.5">Grupo {match.groupName}</span>
                      )}
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium truncate">
                          {match.homeTeam ? `${match.homeTeam.flag} ${match.homeTeam.name}` : 'TBD'}
                        </span>
                        <span className="text-sm font-bold tabular-nums text-gray-700 shrink-0">
                          {match.status === 'FINISHED'
                            ? `${match.homeScore} - ${match.awayScore}`
                            : 'vs'}
                        </span>
                        <span className="text-sm font-medium truncate">
                          {match.awayTeam ? `${match.awayTeam.flag} ${match.awayTeam.name}` : 'TBD'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0 gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${badge.class}`}>
                        {badge.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        <ClientDate iso={match.scheduledAt.toISOString()} />
                      </span>
                    </div>
                  </div>

                  {match.status === 'CANCELLED' ? null : locked ? (
                    prediction ? (
                      <div className="flex items-center gap-2 text-sm border-t pt-2 flex-wrap">
                        <span className="text-gray-400 text-xs">Tu pronóstico:</span>
                        <span className="font-mono font-medium">
                          {prediction.homeScore} - {prediction.awayScore}
                        </span>
                        {isKnockout && prediction.predictedWinnerId && (
                          <span className="text-xs text-gray-500">
                            {'(ganador: '}
                            {prediction.predictedWinnerId === match.homeTeamId
                              ? match.homeTeam?.name
                              : match.awayTeam?.name}
                            {')'}
                          </span>
                        )}
                        {prediction.points !== null && (
                          <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${prediction.points > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {prediction.points} pts
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 border-t pt-2">Sin pronóstico</div>
                    )
                  ) : session ? (
                    <PredictionForm
                      key={prediction?.id ?? `new-${match.id}`}
                      matchId={match.id}
                      prediction={prediction ?? null}
                      homeTeam={match.homeTeam}
                      awayTeam={match.awayTeam}
                      homeTeamId={match.homeTeamId}
                      awayTeamId={match.awayTeamId}
                      isKnockout={isKnockout}
                    />
                  ) : (
                    <div className="border-t pt-2">
                      <Link href="/login" className="text-xs text-blue-600 hover:text-blue-800">
                        Iniciá sesión para hacer tu pronóstico →
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
