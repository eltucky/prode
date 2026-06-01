import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seed vacío — los torneos se importan desde la API.')
  console.log('   POST /api/admin/import-tournament con { leagueId, season, name }')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
