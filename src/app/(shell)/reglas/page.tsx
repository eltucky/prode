export const metadata = {
  title: 'Reglas de puntuación — Prode Mundial 2026',
}

export default function ReglasPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Reglas de puntuación
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Cómo se calculan los puntos por cada partido.
        </p>
      </div>

      <Section title="Fase de grupos">
        <ScoreRow points={5} label="Resultado exacto" description="Acertás los dos marcadores. Ej: pronosticás 2-1 y sale 2-1." highlight />
        <ScoreRow points={3} label="Resultado correcto + un marcador exacto" description="Acertás quién gana (o que empata) y uno de los dos goles. Ej: pronosticás 2-1, sale 2-0." />
        <ScoreRow points={2} label="Resultado correcto" description="Acertás quién gana o que empata, pero ningún marcador. Ej: pronosticás 2-1, sale 3-0." />
        <ScoreRow points={0} label="Resultado incorrecto" description="El equipo que dijiste que ganaba perdió, o dijiste empate y hubo ganador." />
      </Section>

      <Section title="Fases eliminatorias" subtitle="Misma puntuación que en grupos para el marcador, más un bonus por el clasificado.">
        <ScoreRow points={7} label="Resultado exacto + clasificado correcto" description="Ambos marcadores exactos y acertás quién avanza. Máximo posible." highlight />
        <ScoreRow points={5} label="Resultado exacto sin clasificado correcto" description="Pronosticás empate con marcador exacto (ej: 1-1) pero te equivocás en quién clasifica." />
        <ScoreRow points={4} label="Resultado correcto + clasificado correcto" description="Acertás el resultado (sin marcadores exactos) y quién avanza." />
        <ScoreRow points={2} label="Solo resultado correcto" description="Acertás el resultado pero te equivocaste en el clasificado." />
        <ScoreRow points={0} label="Resultado incorrecto" description="No acertás el resultado. El clasificado no suma." />
        <p className="text-xs pt-3 border-t mt-2" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
          El marcador se evalúa al final del tiempo reglamentario (90 min).
        </p>
      </Section>

      <Section title="Resumen rápido">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b" style={{ borderColor: 'var(--border)' }}>
              <th className="pb-2 text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Condición</th>
              <th className="pb-2 text-xs uppercase tracking-wide text-right" style={{ color: 'var(--text-muted)' }}>Pts</th>
            </tr>
          </thead>
          <tbody style={{ color: 'var(--text-primary)' }}>
            {[
              ['Resultado correcto (base)', '+2'],
              ['Gol del local exacto', '+1'],
              ['Gol del visitante exacto', '+1'],
              ['Ambos goles exactos (bonus)', '+1'],
              ['Clasificado correcto (eliminatorias)', '+2'],
            ].map(([label, pts]) => (
              <tr key={label} className="border-b" style={{ borderColor: 'var(--border)' }}>
                <td className="py-2 text-sm" style={{ color: 'var(--text-primary)' }}>{label}</td>
                <td className="py-2 text-right font-mono font-bold" style={{ color: 'var(--accent)' }}>{pts}</td>
              </tr>
            ))}
            <tr>
              <td className="py-2 font-semibold">Máximo grupos / eliminatorias</td>
              <td className="py-2 text-right font-mono font-bold" style={{ color: 'var(--accent)' }}>5 / 7</td>
            </tr>
          </tbody>
        </table>
      </Section>
    </div>
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-2xl p-5 space-y-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div>
        <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{title}</h2>
        {subtitle && <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

function ScoreRow({ points, label, description, highlight = false }: {
  points: number; label: string; description: string; highlight?: boolean
}) {
  return (
    <div
      className="flex gap-4 items-start rounded-lg p-3"
      style={{ background: highlight ? '#22c55e1a' : 'var(--surface-raised)' }}
    >
      <span
        className="text-xl font-extrabold tabular-nums shrink-0 w-8 text-center"
        style={{ color: highlight ? 'var(--accent)' : points === 0 ? 'var(--text-dimmed)' : 'var(--text-primary)' }}
      >
        {points}
      </span>
      <div>
        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</p>
      </div>
    </div>
  )
}
