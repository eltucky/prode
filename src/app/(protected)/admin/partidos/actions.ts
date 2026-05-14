'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { MatchStatus } from '@prisma/client'
import { z } from 'zod'

async function requireSuperAdmin() {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    throw new Error('Acceso denegado')
  }
}

const updateResultSchema = z.object({
  matchId: z.string().cuid(),
  homeScore: z.coerce.number().int().min(0),
  awayScore: z.coerce.number().int().min(0),
  status: z.enum(['FINISHED', 'SCHEDULED', 'POSTPONED', 'CANCELLED', 'IN_PROGRESS']),
  winnerId: z.string().cuid().optional().nullable(),
})

export async function updateMatchResult(formData: FormData) {
  await requireSuperAdmin()

  const parsed = updateResultSchema.safeParse({
    matchId: formData.get('matchId'),
    homeScore: formData.get('homeScore'),
    awayScore: formData.get('awayScore'),
    status: formData.get('status'),
    winnerId: formData.get('winnerId') || null,
  })

  if (!parsed.success) {
    throw new Error('Datos inválidos: ' + parsed.error.message)
  }

  const { matchId, homeScore, awayScore, status, winnerId } = parsed.data

  await prisma.match.update({
    where: { id: matchId },
    data: { homeScore, awayScore, status: status as MatchStatus, winnerId },
  })

  revalidatePath('/admin/partidos')
  revalidatePath('/torneo')
}

export async function triggerSync(): Promise<{ updated: number; linked: number }> {
  await requireSuperAdmin()
  const { syncResults } = await import('@/lib/sync-results')
  const result = await syncResults()
  revalidatePath('/admin/partidos')
  revalidatePath('/torneo')
  return result
}
