import { PrismaClient, MatchStage } from '@prisma/client'

const prisma = new PrismaClient()

type Outcome = 'home' | 'away' | 'draw'

function getOutcome(home: number, away: number): Outcome {
  if (home > away) return 'home'
  if (away > home) return 'away'
  return 'draw'
}

const KNOCKOUT_STAGES: MatchStage[] = [
  'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL',
]

function recalcPoints(
  prediction: { homeScore: number; awayScore: number; predictedWinnerId: string | null },
  match: { homeScore: number | null; awayScore: number | null; winnerId: string | null; stage: MatchStage }
): number | null {
  if (match.homeScore === null || match.awayScore === null) return null
  const actualOutcome = getOutcome(match.homeScore, match.awayScore)
  const predictedOutcome = getOutcome(prediction.homeScore, prediction.awayScore)
  if (actualOutcome !== predictedOutcome) return 0
  const homeBonus = prediction.homeScore === match.homeScore ? 1 : 0
  const awayBonus = prediction.awayScore === match.awayScore ? 1 : 0
  const isExact = homeBonus === 1 && awayBonus === 1
  const base = isExact ? 3 : 2
  let points = base + homeBonus + awayBonus
  if (
    KNOCKOUT_STAGES.includes(match.stage) &&
    prediction.predictedWinnerId &&
    prediction.predictedWinnerId === match.winnerId
  ) {
    points += 2
  }
  return points
}

async function main() {
  const fix = process.argv.includes('--fix')

  const predictions = await prisma.prediction.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      match: {
        select: {
          id: true,
          matchNumber: true,
          homeScore: true,
          awayScore: true,
          winnerId: true,
          stage: true,
          status: true,
          homeTeam: { select: { code: true } },
          awayTeam: { select: { code: true } },
        },
      },
    },
  })

  type UserSummary = {
    name: string
    email: string
    storedTotal: number
    recalcTotal: number
    discrepancies: {
      matchNumber: number
      match: string
      stored: number | null
      expected: number | null
    }[]
  }

  const byUser = new Map<string, UserSummary>()

  for (const p of predictions) {
    if (!byUser.has(p.userId)) {
      byUser.set(p.userId, {
        name: p.user.name ?? '(sin nombre)',
        email: p.user.email,
        storedTotal: 0,
        recalcTotal: 0,
        discrepancies: [],
      })
    }
    const summary = byUser.get(p.userId)!
    const expected = p.match.status === 'FINISHED' ? recalcPoints(p, p.match) : null

    if (p.points !== null) summary.storedTotal += p.points
    if (expected !== null) summary.recalcTotal += expected

    const mismatch = p.points !== expected && !(p.points === null && expected === null)
    if (mismatch) {
      const home = p.match.homeTeam?.code ?? '?'
      const away = p.match.awayTeam?.code ?? '?'
      summary.discrepancies.push({
        matchNumber: p.match.matchNumber,
        match: `${home} vs ${away}`,
        stored: p.points,
        expected,
      })
    }
  }

  let totalDiscrepancies = 0
  console.log('\n=== Auditoría de puntos ===\n')

  for (const [userId, s] of byUser) {
    const hasIssues = s.discrepancies.length > 0
    const icon = hasIssues ? '⚠ ' : '✓ '
    console.log(`${icon}${s.name} <${s.email}>`)
    console.log(`   Almacenado: ${s.storedTotal} pts | Recalculado: ${s.recalcTotal} pts`)
    if (hasIssues) {
      for (const d of s.discrepancies) {
        console.log(`   ✗ Partido #${d.matchNumber} (${d.match}): almacenado=${d.stored ?? 'null'} esperado=${d.expected ?? 'null'}`)
      }
      totalDiscrepancies += s.discrepancies.length
    }
    console.log()
  }

  console.log(`Total de discrepancias: ${totalDiscrepancies}`)

  if (fix && totalDiscrepancies > 0) {
    console.log('\nAplicando correcciones...')
    let fixed = 0
    for (const p of predictions) {
      const expected = p.match.status === 'FINISHED' ? recalcPoints(p, p.match) : null
      if (p.points !== expected) {
        await prisma.prediction.update({
          where: { id: p.id },
          data: { points: expected },
        })
        fixed++
      }
    }
    console.log(`✓ ${fixed} predicciones corregidas.`)
  } else if (totalDiscrepancies > 0) {
    console.log('\nPara aplicar las correcciones, corré el script con --fix')
  }
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
