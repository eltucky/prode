import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default async function GrupoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()

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
  if (!isMember) redirect('/dashboard')

  const isOwner = group.ownerId === session?.user?.id

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
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600">
            ← Mis grupos
          </Link>
          <h1 className="text-2xl font-bold mt-1">{group.name}</h1>
          <p className="text-sm text-gray-400">
            {group.members.length}{' '}
            {group.members.length === 1 ? 'participante' : 'participantes'}
          </p>
        </div>

        {isOwner && (
          <div className="bg-gray-50 border rounded-xl px-4 py-3">
            <p className="text-xs text-gray-400 mb-1">Código de invitación</p>
            <p className="font-mono text-sm font-medium text-gray-800 select-all">
              {group.inviteCode}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b">
          <h2 className="font-semibold text-sm text-gray-700">Tabla de posiciones</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-8">#</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Participante</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Pts</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Aciertos</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {standings.map((entry, idx) => (
              <tr key={entry.user.id} className={entry.isCurrentUser ? 'bg-blue-50' : ''}>
                <td className="px-4 py-2 text-gray-400 font-medium">{idx + 1}</td>
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
                      <div className="w-6 h-6 rounded-full bg-gray-200 shrink-0 flex items-center justify-center text-xs font-medium text-gray-500">
                        {entry.user.name?.[0] ?? '?'}
                      </div>
                    )}
                    <span className={`truncate ${entry.isCurrentUser ? 'font-semibold' : ''}`}>
                      {entry.user.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2 text-right font-bold tabular-nums">{entry.points}</td>
                <td className="px-4 py-2 text-right text-gray-500 tabular-nums hidden sm:table-cell">
                  {entry.correctCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border rounded-xl divide-y">
        {group.members.map(member => (
          <div key={member.id} className="flex items-center gap-3 px-4 py-3">
            {member.user.image ? (
              <Image
                src={member.user.image}
                alt={member.user.name ?? ''}
                width={36}
                height={36}
                className="rounded-full shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0 flex items-center justify-center text-sm font-medium text-gray-500">
                {member.user.name?.[0] ?? '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{member.user.name}</div>
              <div className="text-xs text-gray-400 truncate">{member.user.email}</div>
            </div>
            {group.ownerId === member.userId && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
                Admin
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
