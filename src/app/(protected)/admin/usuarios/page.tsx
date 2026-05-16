import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import Image from 'next/image'
import { blockUser, unblockUser, toggleSuperAdmin } from './actions'

export default async function AdminUsuariosPage() {
  const session = await auth()

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      _count: { select: { memberships: true } },
    },
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Usuarios</h1>
      <p className="text-sm text-gray-500">{users.length} usuarios registrados</p>

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Grupos</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map(user => {
              const isSelf = user.id === session?.user?.id
              return (
                <tr key={user.id} className={user.isBlocked ? 'bg-red-50' : ''}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {user.image ? (
                        <Image src={user.image} alt={user.name ?? ''} width={28} height={28} className="rounded-full shrink-0" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gray-200 shrink-0 flex items-center justify-center text-xs text-gray-500">
                          {user.name?.[0] ?? '?'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium truncate">{user.name}</div>
                        <div className="text-xs text-gray-400 truncate">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{user._count.memberships}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {user.isBlocked && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Bloqueado</span>
                      )}
                      {user.isSuperAdmin && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Super Admin</span>
                      )}
                      {!user.isBlocked && !user.isSuperAdmin && (
                        <span className="text-xs text-gray-400">Activo</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {!isSelf && (
                        <>
                          {user.isBlocked ? (
                            <form action={unblockUser}>
                              <input type="hidden" name="userId" value={user.id} />
                              <button type="submit" className="text-xs text-green-600 hover:text-green-800">
                                Desbloquear
                              </button>
                            </form>
                          ) : (
                            <form action={blockUser}>
                              <input type="hidden" name="userId" value={user.id} />
                              <button type="submit" className="text-xs text-red-500 hover:text-red-700">
                                Bloquear
                              </button>
                            </form>
                          )}
                          <form action={toggleSuperAdmin}>
                            <input type="hidden" name="userId" value={user.id} />
                            <input type="hidden" name="currentValue" value={String(user.isSuperAdmin)} />
                            <button type="submit" className="text-xs text-blue-500 hover:text-blue-700">
                              {user.isSuperAdmin ? 'Quitar admin' : 'Hacer admin'}
                            </button>
                          </form>
                        </>
                      )}
                      {isSelf && <span className="text-xs text-gray-300">Vos</span>}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
