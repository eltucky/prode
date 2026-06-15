import { prisma } from '@/lib/db'
import Image from 'next/image'
import { MatchStage } from '@prisma/client'
import { AdminPredictionRow } from '@/components/admin-prediction-row'

const STAGE_LABELS: Record<MatchStage, string> = {
  GROUP: 'Grupos',
  ROUND_OF_32: 'R32',
  ROUND_OF_16: 'Octavos',
  QUARTER_FINAL: 'Cuartos',
  SEMI_FINAL: 'Semi',
  THIRD_PLACE: '3er Puesto',
  FINAL: 'Final',
}

export default async function AdminPronosticosPage({
  searchParams,
}: {
  searchParams: Promise<{ partido?: string }>
}) {
  const { partido } = await searchParams

  const matches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true },
    orderBy: { matchNumber: 'asc' },
  })

  const selectedMatch = partido ? matches.find(m => m.id === partido) ?? null : null

  const predictions = selectedMatch
    ? await prisma.prediction.findMany({
        where: { matchId: selectedMatch.id },
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: 'asc' },
      })
    : []

  // Global ranking
  const scoredPredictions = await prisma.prediction.findMany({
    where: { points: { not: null } },
    select: {
      userId: true,
      points: true,
      user: { select: { id: true, name: true, image: true } },
    },
  })

  const rankMap = new Map<string, { user: { id: string; name: string | null; image: string | null }; points: number; correctCount: number }>()
  for (const p of scoredPredictions) {
    const entry = rankMap.get(p.userId) ?? { user: p.user, points: 0, correctCount: 0 }
    entry.points += p.points ?? 0
    entry.correctCount += (p.points ?? 0) > 0 ? 1 : 0
    rankMap.set(p.userId, entry)
  }
  const ranking = Array.from(rankMap.values()).sort((a, b) => b.points - a.points || b.correctCount - a.correctCount)

  const isKnockout = selectedMatch && !['GROUP'].includes(selectedMatch.stage)

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Pronósticos</h1>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <label className="block text-sm font-medium text-zinc-300 mb-2">Seleccioná un partido</label>
        <form method="GET">
          <select
            name="partido"
            defaultValue={partido ?? ''}
            className="bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-3 py-2 text-sm w-full max-w-lg"
          >
            <option value="">— Elegí un partido —</option>
            {matches.map(m => (
              <option key={m.id} value={m.id}>
                #{m.matchNumber} [{STAGE_LABELS[m.stage]}] {m.homeTeam?.name ?? 'TBD'} vs {m.awayTeam?.name ?? 'TBD'} ({m.status})
              </option>
            ))}
          </select>
          <button type="submit" className="ml-2 text-sm bg-zinc-700 text-zinc-100 px-3 py-2 rounded-lg hover:bg-zinc-600">
            Ver
          </button>
        </form>
      </div>

      {selectedMatch && (
        <div className="space-y-3">
          <h2 className="font-semibold text-zinc-300">
            #{selectedMatch.matchNumber} — {selectedMatch.homeTeam?.name ?? 'TBD'} vs {selectedMatch.awayTeam?.name ?? 'TBD'}
            {selectedMatch.homeScore !== null && ` (${selectedMatch.homeScore}-${selectedMatch.awayScore})`}
          </h2>
          {predictions.length === 0 ? (
            <p className="text-sm text-zinc-500">Sin pronósticos para este partido.</p>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-800/50 border-b border-zinc-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Usuario</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Pronóstico</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Pts</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Editar / Eliminar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {predictions.map(p => (
                    <tr key={p.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {p.user.image ? (
                            <Image src={p.user.image} alt={p.user.name ?? ''} width={24} height={24} className="rounded-full shrink-0" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-zinc-700 shrink-0 flex items-center justify-center text-xs text-zinc-400">
                              {p.user.name?.[0] ?? '?'}
                            </div>
                          )}
                          <span className="truncate">{p.user.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono">{p.homeScore} - {p.awayScore}</td>
                      <td className="px-4 py-3">
                        {p.points !== null ? (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.points > 0 ? 'bg-green-900/40 text-green-400' : 'bg-zinc-800 text-zinc-400'}`}>
                            {p.points} pts
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <AdminPredictionRow
                          key={p.id}
                          prediction={{ id: p.id, homeScore: p.homeScore, awayScore: p.awayScore, predictedWinnerId: p.predictedWinnerId }}
                          homeTeam={selectedMatch.homeTeam}
                          awayTeam={selectedMatch.awayTeam}
                          isKnockout={!!isKnockout}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="font-semibold text-zinc-300">Ranking global</h2>
        {ranking.length === 0 ? (
          <p className="text-sm text-zinc-500">Aún no hay puntos asignados.</p>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-800/50 border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase w-8">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Participante</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase">Pts</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase hidden sm:table-cell">Aciertos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {ranking.map((entry, idx) => (
                  <tr key={entry.user.id}>
                    <td className="px-4 py-2 text-zinc-500 font-medium">{idx + 1}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        {entry.user.image ? (
                          <Image src={entry.user.image} alt={entry.user.name ?? ''} width={24} height={24} className="rounded-full shrink-0" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-zinc-700 shrink-0 flex items-center justify-center text-xs text-zinc-400">
                            {entry.user.name?.[0] ?? '?'}
                          </div>
                        )}
                        <span className="truncate">{entry.user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right font-bold tabular-nums">{entry.points}</td>
                    <td className="px-4 py-2 text-right text-zinc-500 tabular-nums hidden sm:table-cell">{entry.correctCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
