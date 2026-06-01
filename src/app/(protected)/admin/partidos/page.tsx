import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { triggerSyncAction } from './actions'
import { MatchStage } from '@prisma/client'
import { ClientDate } from '@/components/client-date'
import { AdminMatchResultRow } from '@/components/admin-match-result-row'
import { SubmitButton } from '@/components/submit-button'

const STAGE_LABELS: Record<MatchStage, string> = {
  FRIENDLY: 'Amistoso',
  GROUP: 'Fase de Grupos',
  ROUND_OF_32: 'Ronda de 32',
  ROUND_OF_16: 'Octavos',
  QUARTER_FINAL: 'Cuartos',
  SEMI_FINAL: 'Semifinales',
  THIRD_PLACE: 'Tercer Puesto',
  FINAL: 'Final',
}

export default async function AdminPartidosPage() {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) redirect('/grupos')

  const matches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true },
    orderBy: { matchNumber: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin — Partidos</h1>
        <form action={triggerSyncAction}>
          <SubmitButton className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            🔄 Sincronizar resultados
          </SubmitButton>
        </form>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partido</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resultado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {matches.map(match => (
              <tr key={match.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-500">{match.matchNumber}</td>
                <td className="px-4 py-2 font-medium">
                  <div className="text-xs text-gray-400">{STAGE_LABELS[match.stage]}{match.groupName ? ` · Grupo ${match.groupName}` : ''}</div>
                  <div>
                    {match.homeTeam ? `${match.homeTeam.flag} ${match.homeTeam.name}` : 'TBD'} vs {match.awayTeam ? `${match.awayTeam.flag} ${match.awayTeam.name}` : 'TBD'}
                  </div>
                </td>
                <td className="px-4 py-2 text-gray-500 text-xs">
                  <ClientDate iso={match.scheduledAt.toISOString()} />
                </td>
                <td className="px-4 py-2">
                  {match.homeScore !== null ? `${match.homeScore} - ${match.awayScore}` : '—'}
                </td>
                <td className="px-4 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    match.status === 'FINISHED' ? 'bg-green-100 text-green-700' :
                    match.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-700' :
                    match.status === 'POSTPONED' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{match.status}</span>
                </td>
                <td className="px-4 py-2">
                  <AdminMatchResultRow
                    key={`${match.id}-${match.homeScore ?? 'null'}-${match.awayScore ?? 'null'}`}
                    matchId={match.id}
                    homeScore={match.homeScore}
                    awayScore={match.awayScore}
                    status={match.status}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
