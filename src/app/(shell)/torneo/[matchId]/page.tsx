import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { MatchStage } from '@prisma/client'
import { ClientDate } from '@/components/client-date'
import { getLocale, getDictionary, t } from '@/lib/i18n'

const KNOCKOUT_STAGES: MatchStage[] = [
  'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL',
]

export default async function MatchDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ matchId: string }>
  searchParams: Promise<{ grupo?: string }>
}) {
  const { matchId } = await params
  const { grupo } = await searchParams

  const locale = await getLocale()
  const dict = await getDictionary(locale)

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { homeTeam: true, awayTeam: true },
  })

  if (!match) notFound()

  const session = await auth()
  const showParticipants = match.status !== 'CANCELLED'
  const isKnockout = KNOCKOUT_STAGES.includes(match.stage)

  const badge = {
    SCHEDULED:   { label: dict.match.statusScheduled,  bg: 'var(--surface-raised)', color: 'var(--text-muted)' },
    IN_PROGRESS: { label: dict.match.statusInProgress, bg: '#fbbf2422',             color: '#fbbf24' },
    FINISHED:    { label: dict.match.statusFinished,   bg: '#22c55e1a',             color: 'var(--accent)' },
    POSTPONED:   { label: dict.match.statusPostponed,  bg: '#ef44441a',             color: '#ef4444' },
    CANCELLED:   { label: dict.match.statusCancelled,  bg: '#ef44441a',             color: '#ef4444' },
  }[match.status]

  // Fetch user's groups only when the section will be shown
  type GroupWithMembers = {
    id: string
    name: string
    members: Array<{ userId: string; user: { id: string; name: string | null; image: string | null } }>
  }

  let userGroups: GroupWithMembers[] = []

  if (showParticipants && session?.user?.id) {
    const memberships = await prisma.groupMember.findMany({
      where: { userId: session.user.id },
      include: {
        group: {
          include: {
            members: { include: { user: true } },
          },
        },
      },
      orderBy: { group: { name: 'asc' } },
    })
    userGroups = memberships.map(m => m.group)
  }

  // Validate selected group — default to first alphabetically
  const validGroupId = userGroups.find(g => g.id === grupo)?.id ?? userGroups[0]?.id
  const selectedGroup = userGroups.find(g => g.id === validGroupId)

  // Fetch predictions for the selected group's members
  type PredictionRow = {
    homeScore: number
    awayScore: number
    predictedWinnerId: string | null
    points: number | null
  }
  let predMap = new Map<string, PredictionRow>()
  let standingsMap = new Map<string, { points: number; correctCount: number }>()

  if (selectedGroup) {
    const memberIds = selectedGroup.members.map(m => m.userId)
    const [preds, playedPredictions] = await Promise.all([
      prisma.prediction.findMany({
        where: { matchId: match.id, userId: { in: memberIds } },
      }),
      prisma.prediction.findMany({
        where: { userId: { in: memberIds }, points: { not: null } },
        select: { userId: true, points: true },
      }),
    ])
    predMap = new Map(preds.map(p => [p.userId, p]))
    for (const member of selectedGroup.members) {
      const played = playedPredictions.filter(p => p.userId === member.userId)
      standingsMap.set(member.userId, {
        points: played.reduce((sum, p) => sum + (p.points ?? 0), 0),
        correctCount: played.filter(p => (p.points ?? 0) > 0).length,
      })
    }
  }

  const sortedMembers = selectedGroup
    ? [...selectedGroup.members].sort((a, b) => {
        const sa = standingsMap.get(a.userId) ?? { points: 0, correctCount: 0 }
        const sb = standingsMap.get(b.userId) ?? { points: 0, correctCount: 0 }
        return sb.points - sa.points || sb.correctCount - sa.correctCount
      })
    : []

  const showPredictionScore = match.status === 'IN_PROGRESS' || match.status === 'FINISHED'
  const showPoints = match.status === 'FINISHED'

  return (
    <div className="space-y-6">
      <Link href="/torneo" className="text-sm transition-colors" style={{ color: 'var(--text-muted)' }}>
        {dict.matchDetail.back}
      </Link>

      {/* Match header */}
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
              {(match.status === 'FINISHED' || match.status === 'IN_PROGRESS') && match.homeScore !== null && match.awayScore !== null
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

      {/* Participants section */}
      {showParticipants && (
        !session ? (
          <Link href="/login" className="text-sm" style={{ color: '#3b82f6' }}>
            {dict.matchDetail.loginToSeePrompt}
          </Link>
        ) : userGroups.length > 0 ? (
          <div className="space-y-3">
            {/* Group selector — only when user belongs to 2+ groups */}
            {userGroups.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {userGroups.map(g => {
                  const isActive = g.id === validGroupId
                  return (
                    <Link
                      key={g.id}
                      href={`/torneo/${match.id}?grupo=${g.id}`}
                      className="text-xs px-3 py-1.5 rounded-full font-medium"
                      style={{
                        background: isActive ? 'var(--accent)' : 'var(--surface-raised)',
                        color: isActive ? '#000' : 'var(--text-muted)',
                      }}
                    >
                      {g.name}
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Participant list */}
            {selectedGroup && (
              <div
                className="rounded-xl overflow-hidden"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                {sortedMembers.map((member, idx) => {
                  const isCurrentUser = member.userId === session.user!.id
                  const prediction = predMap.get(member.userId) ?? null

                  return (
                    <div
                      key={member.userId}
                      className="flex items-center gap-3 px-4 py-3"
                      style={{
                        borderTop: idx > 0 ? '1px solid var(--border)' : 'none',
                        background: isCurrentUser ? '#22c55e0d' : 'transparent',
                      }}
                    >
                      {member.user.image ? (
                        <Image
                          src={member.user.image}
                          alt={member.user.name ?? ''}
                          width={32}
                          height={32}
                          className="rounded-full shrink-0"
                        />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-medium"
                          style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)' }}
                        >
                          {member.user.name?.[0] ?? '?'}
                        </div>
                      )}

                      <span
                        className={`flex-1 text-sm truncate ${isCurrentUser ? 'font-semibold' : ''}`}
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {member.user.name}
                      </span>

                      <div className="flex items-center gap-2 shrink-0">
                        {!showPredictionScore ? (
                          prediction ? (
                            <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                              {dict.matchDetail.loadedPrediction}
                            </span>
                          ) : (
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {dict.matchDetail.didNotLoad}
                            </span>
                          )
                        ) : prediction ? (
                          <>
                            <span className="text-sm font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                              {prediction.homeScore} - {prediction.awayScore}
                            </span>
                            {isKnockout && prediction.predictedWinnerId && (
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {'('}
                                {t(dict.match.winner, {
                                  name: prediction.predictedWinnerId === match.homeTeamId
                                    ? (match.homeTeam?.name ?? '')
                                    : (match.awayTeam?.name ?? ''),
                                })}
                                {')'}
                              </span>
                            )}
                            {showPoints && prediction.points !== null && (
                              <span
                                className="text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{
                                  background: prediction.points > 0 ? '#22c55e1a' : 'var(--surface-raised)',
                                  color: prediction.points > 0 ? 'var(--accent)' : 'var(--text-muted)',
                                }}
                              >
                                {prediction.points > 0 ? '+' : ''}{prediction.points} pts
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {dict.matchDetail.noPrediction}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : null
      )}
    </div>
  )
}
