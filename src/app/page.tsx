import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function RootPage() {
  const session = await auth()
  if (session) redirect('/torneo')

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="border-b bg-white px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-lg flex items-center gap-2">
          <span>⚽</span>
          <span>Prode 2026</span>
        </span>
        <div className="flex items-center gap-4">
          <Link href="/torneo" className="text-sm text-gray-600 hover:text-gray-900">
            Torneo
          </Link>
          <Link href="/reglas" className="text-sm text-gray-600 hover:text-gray-900">
            Reglas
          </Link>
          <Link
            href="/login"
            className="text-sm bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Iniciar sesión
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="text-6xl mb-6">⚽</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Prode Mundial 2026</h1>
        <p className="text-lg text-gray-500 max-w-md mb-10">
          Hacé tus pronósticos partido a partido, armá un grupo con tus amigos y competí para ver quién la ve más.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-16">
          <Link
            href="/login"
            className="bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Empezar a jugar
          </Link>
          <Link
            href="/torneo"
            className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Ver partidos
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-3 max-w-2xl w-full text-left">
          <div className="bg-white border rounded-xl p-5">
            <div className="text-2xl mb-2">🎯</div>
            <h2 className="font-semibold mb-1">Pronosticá</h2>
            <p className="text-sm text-gray-500">
              Predecí el marcador de cada partido antes de que empiece. Puntos por resultado exacto, correcto o un gol.
            </p>
          </div>
          <div className="bg-white border rounded-xl p-5">
            <div className="text-2xl mb-2">👥</div>
            <h2 className="font-semibold mb-1">Competí en grupo</h2>
            <p className="text-sm text-gray-500">
              Armá un grupo con amigos o colegas y seguí la tabla de posiciones en tiempo real.
            </p>
          </div>
          <div className="bg-white border rounded-xl p-5">
            <div className="text-2xl mb-2">🏆</div>
            <h2 className="font-semibold mb-1">Seguí el torneo</h2>
            <p className="text-sm text-gray-500">
              Mirá todos los partidos, resultados y tus pronósticos en un solo lugar.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
