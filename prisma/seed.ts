import { PrismaClient } from '@prisma/client'
import { teams } from './seed-data/teams'
import { matches } from './seed-data/matches'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding teams...')

  // Upsert teams (safe to re-run)
  for (const team of teams) {
    await prisma.team.upsert({
      where: { code: team.code },
      update: { name: team.name, flag: team.flag, group: team.group },
      create: team,
    })
  }
  console.log(`✓ ${teams.length} teams upserted`)

  // Build code → id map for matches
  const teamMap = await prisma.team.findMany({ select: { id: true, code: true } })
  const codeToId = Object.fromEntries(teamMap.map(t => [t.code, t.id]))

  console.log('🌱 Seeding matches...')
  for (const match of matches) {
    const homeTeamId = match.homeTeamCode ? codeToId[match.homeTeamCode] : undefined
    const awayTeamId = match.awayTeamCode ? codeToId[match.awayTeamCode] : undefined

    if (match.homeTeamCode && !homeTeamId) {
      throw new Error(`Team not found: ${match.homeTeamCode}`)
    }
    if (match.awayTeamCode && !awayTeamId) {
      throw new Error(`Team not found: ${match.awayTeamCode}`)
    }

    await prisma.match.upsert({
      where: { matchNumber: match.matchNumber },
      update: {
        scheduledAt: match.scheduledAt,
        venue: match.venue,
        ...(homeTeamId && { homeTeamId }),
        ...(awayTeamId && { awayTeamId }),
      },
      create: {
        matchNumber: match.matchNumber,
        stage: match.stage,
        groupName: match.groupName ?? null,
        scheduledAt: match.scheduledAt,
        venue: match.venue,
        homeTeamId: homeTeamId ?? null,
        awayTeamId: awayTeamId ?? null,
        status: 'SCHEDULED',
      },
    })
  }
  console.log(`✓ ${matches.length} matches upserted`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
