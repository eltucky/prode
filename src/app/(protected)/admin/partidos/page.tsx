import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { triggerSyncAction } from './actions'
import { MatchStage, MatchStatus } from '@prisma/client'
import { ClientDate } from '@/components/client-date'
import { AdminMatchResultRow } from '@/components/admin-match-result-row'
import { SubmitButton } from '@/components/submit-button'

const STAGE_LABELS: Record<MatchStage, string> = {
  GROUP: 'Fase de Grupos',
  ROUND_OF_32: 'Ronda de 32',
  ROUND_OF_16: 'Octavos',
  QUARTER_FINAL: 'Cuartos',
  SEMI_FINAL: 'Semifinales',
  THIRD_PLACE: 'Tercer Puesto',
  FINAL: 'Final',
}

const STATUS_BADGE: Record<MatchStatus, { label: string; className: string }> = {
  SCHEDULED:   { label: 'Programado',  className: 'bg-zinc-800 text-zinc-400' },
  IN_PROGRESS: { label: 'En juego',    className: 'bg-yellow-900/40 text-yellow-400' },
  FINISHED:    { label: 'Finalizado',  className: 'bg-green-900/40 text-green-400' },
  POSTPONED:   { label: 'Postergado',  className: 'bg-red-900/40 text-red-400' },
  CANCELLED:   { label: 'Cancelado',   className: 'bg-red-900/40 text-red-400' },
}

export default async function AdminPartidosPage() {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) redirect('/grupos')

  const STATUS_ORDER = { IN_PROGRESS: 0, SCHEDULED: 1, POSTPONED: 2, CANCELLED: 2, FINISHED: 3 }

  const matches = (await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true },
    orderBy: { matchNumber: 'asc' },
  })).sort((a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99) || a.matchNumber - b.matchNumber)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold">Admin — Partidos</h1>
        <form action={triggerSyncAction}>
          <SubmitButton className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 whitespace-nowrap">
            🔄 Sincronizar
          </SubmitButton>
        </form>
      </div>

      <div className="space-y-2">
        {matches.map(match => {
          const badge = STATUS_BADGE[match.status]
          return (
            <div
              key={match.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3"
            >
              {/* Match header */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-zinc-500 mb-0.5">
                    #{match.matchNumber} · {STAGE_LABELS[match.stage]}
                    {match.groupName ? ` · Grupo ${match.groupName}` : ''}
                  </div>
                  <div className="font-medium text-sm leading-snug">
                    {match.homeTeam ? `${match.homeTeam.flag} ${match.homeTeam.name}` : 'TBD'}
                    {' vs '}
                    {match.awayTeam ? `${match.awayTeam.flag} ${match.awayTeam.name}` : 'TBD'}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    <ClientDate iso={match.scheduledAt.toISOString()} />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.className}`}>
                    {badge.label}
                  </span>
                  {match.homeScore !== null && (
                    <span className="text-sm font-mono font-semibold text-zinc-300">
                      {match.homeScore} – {match.awayScore}
                    </span>
                  )}
                </div>
              </div>

              {/* Result form */}
              <div className="border-t border-zinc-800 pt-3">
                <AdminMatchResultRow
                  key={`${match.id}-${match.homeScore ?? 'null'}-${match.awayScore ?? 'null'}-${match.winnerId ?? 'null'}`}
                  matchId={match.id}
                  homeScore={match.homeScore}
                  awayScore={match.awayScore}
                  winnerId={match.winnerId}
                  status={match.status}
                  isKnockout={match.stage !== 'GROUP'}
                  homeTeam={match.homeTeam}
                  awayTeam={match.awayTeam}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
