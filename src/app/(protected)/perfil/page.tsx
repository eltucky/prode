import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { updateEmailNotifications } from './actions'
import { SubmitButton } from '@/components/submit-button'

export default async function PerfilPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, emailNotifications: true },
  })
  if (!user) redirect('/login')

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Perfil</h1>

      <div className="bg-white border rounded-xl p-6 space-y-1">
        <div className="font-medium">{user.name}</div>
        <div className="text-sm text-gray-500">{user.email}</div>
      </div>

      <div className="bg-white border rounded-xl p-6">
        <h2 className="font-semibold mb-4">Notificaciones</h2>
        <form action={updateEmailNotifications} className="space-y-4">
          <label className="flex items-start justify-between gap-4 cursor-pointer">
            <div>
              <div className="font-medium text-sm">Recordatorios y resumen diario</div>
              <div className="text-xs text-gray-500 mt-0.5">
                Te avisamos 2 horas antes de cada partido si todavía no cargaste pronóstico, y te mandamos un resumen de puntos al final del día.
              </div>
            </div>
            <input
              type="checkbox"
              name="emailNotifications"
              defaultChecked={user.emailNotifications}
              className="mt-1 w-5 h-5 accent-gray-900 shrink-0"
            />
          </label>
          <SubmitButton className="w-full bg-gray-900 text-white rounded-lg py-2 text-sm hover:bg-gray-700">
            Guardar
          </SubmitButton>
        </form>
      </div>
    </div>
  )
}
