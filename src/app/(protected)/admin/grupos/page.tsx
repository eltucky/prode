import { prisma } from '@/lib/db'
import { deleteGroup, removeUserFromGroup, transferOwnership } from './actions'
import { SubmitButton } from '@/components/submit-button'

export default async function AdminGruposPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmar?: string }>
}) {
  const { confirmar } = await searchParams

  const groups = await prisma.group.findMany({
    include: {
      members: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { joinedAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Grupos</h1>
      <p className="text-sm text-gray-500">{groups.length} grupos en total</p>

      {groups.map(group => {
        const nonOwnerMembers = group.members.filter(m => m.userId !== group.ownerId)
        const owner = group.members.find(m => m.userId === group.ownerId)

        return (
          <div key={group.id} className="bg-white border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="font-semibold">{group.name}</div>
                <div className="text-xs text-gray-400">
                  {group.members.length} {group.members.length === 1 ? 'miembro' : 'miembros'} ·
                  owner: {owner?.user.name ?? '?'} ·
                  {group.createdAt.toLocaleDateString('es-AR')}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {nonOwnerMembers.length > 0 && (
                  <form action={transferOwnership} className="flex items-center gap-1">
                    <input type="hidden" name="groupId" value={group.id} />
                    <select name="newOwnerId" className="border rounded px-2 py-1 text-xs">
                      {nonOwnerMembers.map(m => (
                        <option key={m.userId} value={m.userId}>{m.user.name}</option>
                      ))}
                    </select>
                    <SubmitButton className="text-xs bg-gray-700 text-white px-2 py-1 rounded hover:bg-gray-900">
                      Transferir
                    </SubmitButton>
                  </form>
                )}
                {confirmar === group.id ? (
                  <form action={deleteGroup} className="flex items-center gap-1">
                    <input type="hidden" name="groupId" value={group.id} />
                    <span className="text-xs text-red-600 font-medium">¿Confirmar?</span>
                    <SubmitButton className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700">
                      Sí, eliminar
                    </SubmitButton>
                    <a href="/admin/grupos" className="text-xs text-gray-500 hover:text-gray-700 ml-1">No</a>
                  </form>
                ) : (
                  <a
                    href={`/admin/grupos?confirmar=${group.id}`}
                    className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-2 py-1 rounded"
                  >
                    Eliminar
                  </a>
                )}
              </div>
            </div>
            <div className="divide-y">
              {group.members.map(member => (
                <div key={member.id} className="flex items-center justify-between px-4 py-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span>{member.user.name}</span>
                    {member.userId === group.ownerId && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Admin</span>
                    )}
                  </div>
                  {member.userId !== group.ownerId && (
                    <form action={removeUserFromGroup}>
                      <input type="hidden" name="groupId" value={group.id} />
                      <input type="hidden" name="userId" value={member.userId} />
                      <SubmitButton className="text-xs text-red-500 hover:text-red-700">
                        Sacar
                      </SubmitButton>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
