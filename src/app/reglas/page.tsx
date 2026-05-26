import Link from 'next/link'
import { auth } from '@/auth'

export const metadata = {
  title: 'Reglas de puntuación — Prode Mundial 2026',
}

export default async function ReglasPage() {
  const session = await auth()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="font-bold text-lg flex items-center gap-2">
          <span>⚽</span>
          <span>Prode 2026</span>
        </Link>
        <Link
          href={session ? '/dashboard' : '/login'}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          {session ? 'Volver al dashboard' : 'Iniciar sesión'}
        </Link>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Reglas de puntuación</h1>
          <p className="text-gray-500 text-sm">Cómo se calculan los puntos por cada partido.</p>
        </div>

        {/* Fase de grupos */}
        <section className="bg-white border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">Fase de grupos</h2>
          <div className="space-y-3">
            <ScoreRow
              points={5}
              label="Resultado exacto"
              description="Acertás los dos marcadores. Ej: pronosticás 2-1 y sale 2-1."
              highlight
            />
            <ScoreRow
              points={3}
              label="Resultado correcto + un marcador exacto"
              description="Acertás quién gana (o que empata) y uno de los dos goles. Ej: pronosticás 2-1, sale 2-0."
            />
            <ScoreRow
              points={2}
              label="Resultado correcto"
              description="Acertás quién gana o que empata, pero ningún marcador. Ej: pronosticás 2-1, sale 3-0."
            />
            <ScoreRow
              points={0}
              label="Resultado incorrecto"
              description="El equipo que dijiste que ganaba perdió, o dijiste empate y hubo ganador."
            />
          </div>
        </section>

        {/* Fases eliminatorias */}
        <section className="bg-white border rounded-xl p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-lg">Fases eliminatorias</h2>
            <p className="text-sm text-gray-500 mt-1">
              Misma puntuación que en grupos para el marcador, más un bonus por el clasificado.
            </p>
          </div>
          <div className="space-y-3">
            <ScoreRow
              points={7}
              label="Resultado exacto + clasificado correcto"
              description="Ambos marcadores exactos y acertás quién avanza. Máximo posible."
              highlight
            />
            <ScoreRow
              points={5}
              label="Resultado exacto sin clasificado correcto"
              description="Pronosticás empate con marcador exacto (ej: 1-1) pero te equivocás en quién clasifica."
            />
            <ScoreRow
              points={4}
              label="Resultado correcto + clasificado correcto"
              description="Acertás el resultado (sin marcadores exactos) y quién avanza."
            />
            <ScoreRow
              points={2}
              label="Solo resultado correcto"
              description="Acertás el resultado pero te equivocaste en el clasificado."
            />
            <ScoreRow
              points={0}
              label="Resultado incorrecto"
              description="No acertás el resultado. El clasificado no suma."
            />
          </div>
          <p className="text-xs text-gray-400 border-t pt-3">
            El marcador se evalúa al final del tiempo reglamentario (90 min). El clasificado puede diferir si el partido se define en prórroga o penales.
          </p>
        </section>

        {/* Resumen rápido */}
        <section className="bg-white border rounded-xl p-6">
          <h2 className="font-semibold text-lg mb-4">Resumen rápido</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase border-b">
                <th className="pb-2">Condición</th>
                <th className="pb-2 text-right">Puntos</th>
              </tr>
            </thead>
            <tbody className="divide-y text-gray-700">
              <tr><td className="py-2">Resultado correcto (base)</td><td className="py-2 text-right font-mono">+2</td></tr>
              <tr><td className="py-2 text-gray-500 text-xs pl-3" colSpan={2}>Los siguientes bonuses solo aplican si primero acertás el resultado</td></tr>
              <tr><td className="py-2 pl-3">Gol del local exacto</td><td className="py-2 text-right font-mono">+1</td></tr>
              <tr><td className="py-2 pl-3">Gol del visitante exacto</td><td className="py-2 text-right font-mono">+1</td></tr>
              <tr><td className="py-2 pl-3">Ambos goles exactos (bonus adicional)</td><td className="py-2 text-right font-mono">+1</td></tr>
              <tr><td className="py-2 pl-3">Clasificado correcto (solo eliminatorias)</td><td className="py-2 text-right font-mono">+2</td></tr>
              <tr className="font-semibold border-t"><td className="py-2">Máximo por partido (grupos)</td><td className="py-2 text-right font-mono">5</td></tr>
              <tr className="font-semibold"><td className="py-2">Máximo por partido (eliminatorias)</td><td className="py-2 text-right font-mono">7</td></tr>
            </tbody>
          </table>
        </section>
      </main>
    </div>
  )
}

function ScoreRow({
  points,
  label,
  description,
  highlight = false,
}: {
  points: number
  label: string
  description: string
  highlight?: boolean
}) {
  return (
    <div className={`flex gap-4 items-start rounded-lg p-3 ${highlight ? 'bg-green-50' : 'bg-gray-50'}`}>
      <span className={`text-xl font-bold tabular-nums shrink-0 w-8 text-center ${highlight ? 'text-green-600' : points === 0 ? 'text-gray-400' : 'text-gray-700'}`}>
        {points}
      </span>
      <div>
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
    </div>
  )
}
