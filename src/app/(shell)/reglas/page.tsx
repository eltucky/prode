import { getLocale, getDictionary } from '@/lib/i18n'

export const metadata = {
  title: 'Prode Mundial 2026',
}

export default async function ReglasPage() {
  const locale = await getLocale()
  const dict = await getDictionary(locale)
  const r = dict.reglas

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {r.title}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {r.subtitle}
        </p>
      </div>

      <Section title={r.sectionGroups}>
        <ScoreRow points={5} label={r.exactResult} description={r.exactResultDesc} highlight />
        <ScoreRow points={3} label={r.correctPlusOne} description={r.correctPlusOneDesc} />
        <ScoreRow points={2} label={r.correctResult} description={r.correctResultDesc} />
        <ScoreRow points={0} label={r.wrongResult} description={r.wrongResultDesc} />
      </Section>

      <Section title={r.sectionKnockout} subtitle={r.sectionKnockoutSubtitle}>
        <ScoreRow points={7} label={r.exactPlusWinner} description={r.exactPlusWinnerDesc} highlight />
        <ScoreRow points={5} label={r.exactNoWinner} description={r.exactNoWinnerDesc} />
        <ScoreRow points={4} label={r.correctPlusWinner} description={r.correctPlusWinnerDesc} />
        <ScoreRow points={2} label={r.onlyCorrect} description={r.onlyCorrectDesc} />
        <ScoreRow points={0} label={r.wrongResult} description={r.wrongResultDesc} />
        <p className="text-xs pt-3 border-t mt-2" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
          {r.bonusNote}
        </p>
      </Section>

      <Section title={r.sectionSummary}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b" style={{ borderColor: 'var(--border)' }}>
              <th className="pb-2 text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{r.colCondition}</th>
              <th className="pb-2 text-xs uppercase tracking-wide text-right" style={{ color: 'var(--text-muted)' }}>{r.colPts}</th>
            </tr>
          </thead>
          <tbody style={{ color: 'var(--text-primary)' }}>
            <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
              <td className="py-2 text-sm" style={{ color: 'var(--text-primary)' }}>{r.baseResult}</td>
              <td className="py-2 text-right font-mono font-bold" style={{ color: 'var(--accent)' }}>+2</td>
            </tr>
            <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
              <td className="py-2 text-xs pl-3" colSpan={2} style={{ color: 'var(--text-muted)' }}>
                {r.bonusesNote}
              </td>
            </tr>
            {[
              [r.homeGoalExact, '+1'],
              [r.awayGoalExact, '+1'],
              [r.bothGoalsBonus, '+1'],
              [r.winnerBonus, '+2'],
            ].map(([label, pts]) => (
              <tr key={label} className="border-b" style={{ borderColor: 'var(--border)' }}>
                <td className="py-2 text-sm pl-3" style={{ color: 'var(--text-primary)' }}>{label}</td>
                <td className="py-2 text-right font-mono font-bold" style={{ color: 'var(--accent)' }}>{pts}</td>
              </tr>
            ))}
            <tr>
              <td className="py-2 font-semibold">{r.maxPoints}</td>
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
