import { auth } from '@/auth'
import Image from 'next/image'
import Link from 'next/link'
import { getLocale, getDictionary } from '@/lib/i18n'
import { getCachedTodosStandings } from '@/lib/predictions-cache'

export default async function GruposTodosPage() {
  const session = await auth()
  const locale = await getLocale()
  const dict = await getDictionary(locale)

  const { standings: rawStandings, totalPendingMatchCount } = await getCachedTodosStandings()

  const standings = rawStandings.map(entry => ({
    ...entry,
    isCurrentUser: entry.user.id === session?.user?.id,
  }))

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
          {standings.length}{' '}
          {standings.length === 1 ? dict.grupoDetail.memberSingular : dict.grupoDetail.memberPlural}
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
