'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { MatchStatus } from '@prisma/client'
import { z } from 'zod'
import { scoreMatch } from '@/lib/scoring'

async function requireSuperAdmin() {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    throw new Error('Acceso denegado')
  }
}

const updateResultSchema = z.object({
  matchId: z.string().cuid(),
  homeScore: z.preprocess(v => (v === '' || v === null ? null : Number(v)), z.number().int().min(0).nullable()),
  awayScore: z.preprocess(v => (v === '' || v === null ? null : Number(v)), z.number().int().min(0).nullable()),
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

  if (status === 'FINISHED') {
    await scoreMatch(matchId)
  }

  revalidatePath('/admin/partidos')
  revalidatePath('/torneo')
}

export async function clearMatchResult(matchId: string) {
  await requireSuperAdmin()
  const id = z.string().cuid().parse(matchId)
  await prisma.match.update({
    where: { id },
    data: { homeScore: null, awayScore: null, winnerId: null, status: 'SCHEDULED' },
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

export async function triggerSyncAction(_formData: FormData): Promise<void> {
  await triggerSync()
}
