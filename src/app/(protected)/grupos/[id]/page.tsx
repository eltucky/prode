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
