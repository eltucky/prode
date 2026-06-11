import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { ClientDate } from '@/components/client-date'
import { getLocale, getDictionary, t } from '@/lib/i18n'

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ matchId: string }>
  searchParams: Promise<{ grupo?: string }>
}) {
  const { matchId } = await params

  const locale = await getLocale()
  const dict = await getDictionary(locale)

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { homeTeam: true, awayTeam: true },
  })

  if (!match) notFound()

  const badge = {
    SCHEDULED:   { label: dict.match.statusScheduled,  bg: 'var(--surface-raised)', color: 'var(--text-muted)' },
    IN_PROGRESS: { label: dict.match.statusInProgress, bg: '#fbbf2422',             color: '#fbbf24' },
    FINISHED:    { label: dict.match.statusFinished,   bg: '#22c55e1a',             color: 'var(--accent)' },
    POSTPONED:   { label: dict.match.statusPostponed,  bg: '#ef44441a',             color: '#ef4444' },
    CANCELLED:   { label: dict.match.statusCancelled,  bg: '#ef44441a',             color: '#ef4444' },
  }[match.status]

  return (
    <div className="space-y-6">
      <Link href="/torneo" className="text-sm transition-colors" style={{ color: 'var(--text-muted)' }}>
        {dict.matchDetail.back}
      </Link>

      <div
        className="rounded-xl px-4 py-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {match.groupName && (
          <p className="text-[10px] uppercase tracking-wide mb-3 text-center" style={{ color: 'var(--text-muted)' }}>
            {t(dict.torneo.groupLabel, { name: match.groupName })}
          </p>
        )}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-3xl">{match.homeTeam?.flag ?? '🏴'}</span>
            <span className="text-sm font-semibold text-center" style={{ color: 'var(--text-primary)' }}>
              {match.homeTeam?.name ?? 'TBD'}
            </span>
          </div>
          <div className="flex flex-col items-center shrink-0 gap-1">
            <span className="text-xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
              {match.status === 'FINISHED' || match.status === 'IN_PROGRESS'
                ? `${match.homeScore} - ${match.awayScore}`
                : 'vs'}
            </span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background: badge.bg, color: badge.color }}
            >
              {badge.label}
            </span>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              <ClientDate iso={match.scheduledAt.toISOString()} />
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-3xl">{match.awayTeam?.flag ?? '🏴'}</span>
            <span className="text-sm font-semibold text-center" style={{ color: 'var(--text-primary)' }}>
              {match.awayTeam?.name ?? 'TBD'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
