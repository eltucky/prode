import { prisma } from '@/lib/db'
import { MatchStage, MatchStatus } from '@prisma/client'

const STAGE_LABELS: Record<MatchStage, string> = {
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

export default async function TorneoPage({
  searchParams,
}: {
  searchParams: Promise<{ etapa?: string }>
}) {
  const { etapa } = await searchParams
  const stageFilter = etapa as MatchStage | undefined

  const matches = await prisma.match.findMany({
    where: stageFilter ? { stage: stageFilter } : undefined,
    include: { homeTeam: true, awayTeam: true },
    orderBy: [{ scheduledAt: 'asc' }, { matchNumber: 'asc' }],
  })

  // Group by stage
  const byStage = matches.reduce<Record<string, typeof matches>>((acc, match) => {
    const key = match.stage
    if (!acc[key]) acc[key] = []
    acc[key].push(match)
    return acc
  }, {})

  const stageOrder: MatchStage[] = ['GROUP', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL']

  return (
    <div className="space-y-8">
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
              className={`text-sm px-3 py-1 rounded-full border ${stageFilter === stage ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 hover:bg-gray-50'}`}
            >
              {STAGE_LABELS[stage]}
            </a>
          ))}
        </div>
      </div>

      {stageOrder.filter(s => byStage[s]?.length).map(stage => (
        <section key={stage}>
          <h2 className="text-lg font-semibold mb-3 text-gray-700">{STAGE_LABELS[stage]}</h2>
          <div className="space-y-2">
            {byStage[stage].map(match => {
              const badge = STATUS_BADGE[match.status]
              return (
                <div key={match.id} className="bg-white border rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                  <div className="flex flex-col min-w-0">
                    {match.groupName && (
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
                      {match.scheduledAt.toLocaleDateString('es-AR', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
