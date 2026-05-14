import { auth } from '@/auth'

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mis grupos</h1>
        <p className="text-gray-500 text-sm mt-1">
          Bienvenido, {session?.user?.name}
        </p>
      </div>

      <div className="bg-white border rounded-xl p-10 text-center">
        <div className="text-4xl mb-3">🏆</div>
        <p className="text-gray-600 font-medium">Todavía no pertenecés a ningún grupo</p>
        <p className="text-gray-400 text-sm mt-1">
          Creá uno o pedile a alguien el código de invitación
        </p>
      </div>
    </div>
  )
}
