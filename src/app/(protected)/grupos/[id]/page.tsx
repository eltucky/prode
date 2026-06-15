import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { InviteCopyButton } from '@/components/invite-copy-button'
import { getLocale, getDictionary } from '@/lib/i18n'

export default async function GrupoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()

  const locale = await getLocale()
  const dict = await getDictionary(locale)

  const [group, allMemberships] = await Promise.all([
    prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          include: { user: true },
          orderBy: { joinedAt: 'asc' },
        },
      },
    }),
    prisma.groupMember.findMany({
      where: { userId: session!.user!.id },
      include: { group: true },
      orderBy: { joinedAt: 'desc' },
    }),
  ])

  if (!group) notFound()

  const isMember = group.members.some(m => m.userId === session?.user?.id)
  if (!isMember) redirect('/grupos')

  const groupIds = allMemberships.map(m => m.groupId)
  const currentIndex = groupIds.indexOf(id)
  const prevGroup = currentIndex > 0 ? allMemberships[currentIndex - 1].group : null
  const nextGroup = currentIndex < groupIds.length - 1 ? allMemberships[currentIndex + 1].group : null

  const memberIds = group.members.map(m => m.userId)

  const KNOCKOUT_STAGES = new Set([
    'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL',
  ])

  const [playedPredictions, pendingPredictions] = await Promise.all([
    prisma.prediction.findMany({
      where: { userId: { in: memberIds }, points: { not: null } },
      select: { userId: true, points: true },
    }),
    prisma.prediction.findMany({
      where: {
        userId: { in: memberIds },
        points: null,
        match: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
      },
      select: { userId: true, match: { select: { stage: true } } },
    }),
  ])

  const standings = group.members
    .map(m => {
      const played = playedPredictions.filter(p => p.userId === m.userId)
      const pending = pendingPredictions.filter(p => p.userId === m.userId)
      return {
        user: m.user,
        points: played.reduce((sum, p) => sum + (p.points ?? 0), 0),
        correctCount: played.filter(p => (p.points ?? 0) > 0).length,
        pendingPoints: pending.reduce(
          (sum, p) => sum + (KNOCKOUT_STAGES.has(p.match.stage) ? 7 : 5),
          0
        ),
        isCurrentUser: m.userId === session?.user?.id,
      }
    })
    .sort((a, b) => b.points - a.points || b.correctCount - a.correctCount)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <Link href="/grupos" className="text-sm transition-colors" style={{ color: 'var(--text-muted)' }}>
            {dict.grupoDetail.back}
          </Link>
          <div className="flex items-center gap-2 mt-1">
            {groupIds.length > 1 && (
              prevGroup ? (
                <Link
                  href={`/grupos/${prevGroup.id}`}
                  className="text-lg font-bold leading-none transition-opacity hover:opacity-60"
                  style={{ color: 'var(--text-primary)' }}
                  title={prevGroup.name}
                >
                  ‹
                </Link>
              ) : (
                <span className="text-lg font-bold leading-none opacity-20" style={{ color: 'var(--text-primary)' }}>‹</span>
              )
            )}
            <h1 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {group.name}
            </h1>
            {groupIds.length > 1 && (
              nextGroup ? (
                <Link
                  href={`/grupos/${nextGroup.id}`}
                  className="text-lg font-bold leading-none transition-opacity hover:opacity-60"
                  style={{ color: 'var(--text-primary)' }}
                  title={nextGroup.name}
                >
                  ›
                </Link>
              ) : (
                <span className="text-lg font-bold leading-none opacity-20" style={{ color: 'var(--text-primary)' }}>›</span>
              )
            )}
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {group.members.length}{' '}
            {group.members.length === 1 ? dict.grupoDetail.memberSingular : dict.grupoDetail.memberPlural}
          </p>
        </div>

        <div className="w-full sm:w-auto min-w-0">
          <InviteCopyButton inviteCode={group.inviteCode} />
        </div>
      </div>

      {/* Standings table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            {dict.grupoDetail.standingsTitle}
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
                </td>
                <td className="px-4 py-2 text-right tabular-nums hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>
                  {entry.pendingPoints}
                </td>
                <td className="px-4 py-2 text-right tabular-nums hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>
                  {entry.correctCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Members list */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {group.members.map((member, idx) => (
          <div
            key={member.id}
            className="flex items-center gap-3 px-4 py-3"
            style={{ borderTop: idx > 0 ? `1px solid var(--border)` : 'none' }}
          >
            {member.user.image ? (
              <Image
                src={member.user.image}
                alt={member.user.name ?? ''}
                width={36}
                height={36}
                className="rounded-full shrink-0"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-sm font-medium"
                style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)' }}
              >
                {member.user.name?.[0] ?? '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {member.user.name}
              </div>
              <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                {member.user.email}
              </div>
            </div>
            {group.ownerId === member.userId && (
              <span
                className="text-xs px-2 py-0.5 rounded-full shrink-0"
                style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)' }}
              >
                {dict.grupoDetail.adminBadge}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
