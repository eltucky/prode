import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import Image from 'next/image'
import Link from 'next/link'
import { getLocale, getDictionary } from '@/lib/i18n'

export default async function GruposTodosPage() {
  const session = await auth()

  const locale = await getLocale()
  const dict = await getDictionary(locale)

  const KNOCKOUT_STAGES = new Set([
    'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL',
  ])

  const allUsers = await prisma.user.findMany({
    where: { isBlocked: false },
  })

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
        isCurrentUser: user.id === session?.user?.id,
      }
    })
    .sort((a, b) => b.points - a.points || b.correctCount - a.correctCount)

  return (
    <div className="space-y-6">
      <div>
        <Link href="/grupos" className="text-sm transition-colors" style={{ color: 'var(--text-muted)' }}>
          {dict.grupoTodos.back}
        </Link>
        <h1 className="text-xl font-extrabold tracking-tight mt-1" style={{ color: 'var(--text-primary)' }}>
          {dict.grupos.everyoneGroupName}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {allUsers.length}{' '}
          {allUsers.length === 1 ? dict.grupoDetail.memberSingular : dict.grupoDetail.memberPlural}
          {' · '}{dict.grupoTodos.subtitle}
        </p>
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            {dict.grupoTodos.standingsTitle}
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--surface-raised)' }}>
            <tr>
              {[
                { label: dict.grupoDetail.tableRank, cls: 'text-left w-8' },
                { label: dict.grupoDetail.tableParticipant, cls: 'text-left' },
                { label: dict.grupoDetail.tablePoints, cls: 'text-right' },
                { label: dict.grupoDetail.tablePending, cls: 'text-right hidden sm:table-cell' },
                { label: dict.grupoDetail.tableCorrect, cls: 'text-right hidden sm:table-cell' },
              ].map(({ label, cls }) => (
                <th
                  key={label}
                  className={`px-4 py-2 text-xs font-semibold uppercase ${cls}`}
                  style={{ color: 'var(--text-muted)' }}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {standings.map((entry, idx) => (
              <tr
                key={entry.user.id}
                className="border-t"
                style={{
                  borderColor: 'var(--border)',
                  background: entry.isCurrentUser ? '#22c55e0d' : 'transparent',
                }}
              >
                <td className="px-4 py-2 font-medium" style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    {entry.user.image ? (
                      <Image
                        src={entry.user.image}
                        alt={entry.user.name ?? ''}
                        width={24}
                        height={24}
                        className="rounded-full shrink-0"
                      />
                    ) : (
                      <div
                        className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-medium"
                        style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)' }}
                      >
                        {entry.user.name?.[0] ?? '?'}
                      </div>
                    )}
                    <span
                      className={`truncate text-sm ${entry.isCurrentUser ? 'font-semibold' : ''}`}
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {entry.user.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2 text-right font-bold tabular-nums" style={{ color: 'var(--accent)' }}>
                  {entry.points}
                  <span className="hidden sm:inline font-normal text-xs" style={{ color: 'var(--text-muted)' }}>
                    {' '}{dict.grupoDetail.tableOf} {entry.maxPlayedPoints}
                  </span>
                </td>
                <td className="px-4 py-2 text-right tabular-nums hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>
                  {entry.pendingCount}
                  <span className="text-xs opacity-60"> {dict.grupoDetail.tableOf} {totalPendingMatchCount}</span>
                </td>
                <td className="px-4 py-2 text-right tabular-nums hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>
                  {entry.correctCount}
                  <span className="text-xs opacity-60"> {dict.grupoDetail.tableOf} {entry.totalPlayed}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
