import { prisma } from '@/lib/db'

export default async function AdminPage() {
  const [
    totalUsers,
    blockedUsers,
    totalGroups,
    finishedMatches,
    totalMatches,
    totalPredictions,
    pointsAgg,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isBlocked: true } }),
    prisma.group.count(),
    prisma.match.count({ where: { status: 'FINISHED' } }),
    prisma.match.count(),
    prisma.prediction.count(),
    prisma.prediction.aggregate({
      where: { points: { not: null } },
      _avg: { points: true },
    }),
  ])

  const metrics = [
    { label: 'Usuarios', value: `${totalUsers}`, sub: `${blockedUsers} bloqueados` },
    { label: 'Grupos', value: `${totalGroups}` },
    { label: 'Partidos', value: `${finishedMatches} / ${totalMatches}`, sub: 'finalizados' },
    { label: 'Pronósticos', value: `${totalPredictions}` },
    {
      label: 'Pts promedio',
      value: pointsAgg._avg.points != null
        ? pointsAgg._avg.points.toFixed(1)
        : '—',
      sub: 'por pronóstico',
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {metrics.map(m => (
          <div key={m.label} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4">
            <div className="text-xs text-zinc-500 mb-1">{m.label}</div>
            <div className="text-2xl font-bold text-zinc-100">{m.value}</div>
            {m.sub && <div className="text-xs text-zinc-500 mt-0.5">{m.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
