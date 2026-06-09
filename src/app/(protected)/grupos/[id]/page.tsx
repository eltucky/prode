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

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: true },
        orderBy: { joinedAt: 'asc' },
      },
    },
  })

  if (!group) notFound()

  const isMember = group.members.some(m => m.userId === session?.user?.id)
  if (!isMember) redirect('/grupos')

  const memberIds = group.members.map(m => m.userId)
  const predictions = await prisma.prediction.findMany({
    where: { userId: { in: memberIds }, points: { not: null } },
    select: { userId: true, points: true },
  })

  const standings = group.members
    .map(m => {
      const memberPreds = predictions.filter(p => p.userId === m.userId)
      return {
        user: m.user,
        points: memberPreds.reduce((sum, p) => sum + (p.points ?? 0), 0),
        correctCount: memberPreds.filter(p => (p.points ?? 0) > 0).length,
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
          <h1 className="text-xl font-extrabold tracking-tight mt-1" style={{ color: 'var(--text-primary)' }}>
            {group.name}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {group.members.length}{' '}
            {group.members.length === 1 ? dict.grupoDetail.memberSingular : dict.grupoDetail.memberPlural}
          </p>
        </div>

        <InviteCopyButton inviteCode={group.inviteCode} />
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
              {[dict.grupoDetail.tableRank, dict.grupoDetail.tableParticipant, dict.grupoDetail.tablePoints, dict.grupoDetail.tableCorrect].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-2 text-xs font-semibold uppercase ${i === 0 ? 'text-left w-8' : i === 1 ? 'text-left' : i === 3 ? 'text-right hidden sm:table-cell' : 'text-right'}`}
                  style={{ color: 'var(--text-muted)' }}
                >
                  {h}
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
                Admin
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
