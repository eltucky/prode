import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { createGroup, joinGroup } from './actions'

export default async function GruposPage() {
  const session = await auth()

  const memberships = await prisma.groupMember.findMany({
    where: { userId: session!.user!.id },
    include: {
      group: {
        include: {
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Mis grupos</h1>
        <p className="text-gray-500 text-sm mt-1">Bienvenido, {session?.user?.name}</p>
      </div>

      {memberships.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {memberships.map(({ group }) => (
            <Link
              key={group.id}
              href={`/grupos/${group.id}`}
              className="bg-white border rounded-xl px-5 py-4 hover:shadow-sm transition-shadow"
            >
              <div className="font-semibold text-gray-900 truncate">{group.name}</div>
              <div className="text-sm text-gray-400 mt-1">
                {group._count.members}{' '}
                {group._count.members === 1 ? 'participante' : 'participantes'}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white border rounded-xl p-10 text-center">
          <div className="text-4xl mb-3">🏆</div>
          <p className="text-gray-600 font-medium">Todavía no pertenecés a ningún grupo</p>
          <p className="text-gray-400 text-sm mt-1">
            Creá uno o pedile a alguien el código de invitación
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold mb-3">Crear grupo</h2>
          <form action={createGroup} className="flex gap-2">
            <input
              name="name"
              type="text"
              placeholder="Nombre del grupo"
              required
              maxLength={50}
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
            <button
              type="submit"
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 shrink-0"
            >
              Crear
            </button>
          </form>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold mb-3">Unirse con código</h2>
          <form action={joinGroup} className="flex gap-2">
            <input
              name="inviteCode"
              type="text"
              placeholder="Código de invitación"
              required
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
            <button
              type="submit"
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 shrink-0"
            >
              Unirse
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
