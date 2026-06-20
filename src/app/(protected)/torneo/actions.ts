'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { assertNotBlocked } from '@/lib/admin'
import { updateTag } from 'next/cache'
import { z } from 'zod'

const predictionSchema = z.object({
  matchId: z.string().cuid(),
  homeScore: z.coerce.number().int().min(0).max(99),
  awayScore: z.coerce.number().int().min(0).max(99),
  predictedWinnerId: z.string().cuid().optional().nullable(),
})

export async function savePrediction(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isBlocked: true } })
  assertNotBlocked(user?.isBlocked ?? false)

  const parsed = predictionSchema.safeParse({
    matchId: formData.get('matchId'),
    homeScore: formData.get('homeScore'),
    awayScore: formData.get('awayScore'),
    predictedWinnerId: formData.get('predictedWinnerId') || null,
  })
  if (!parsed.success) throw new Error('Datos inválidos')

  const { matchId, homeScore, awayScore, predictedWinnerId } = parsed.data

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { scheduledAt: true, status: true },
  })
  if (!match) throw new Error('Partido no encontrado')

  const lockTime = new Date(match.scheduledAt.getTime() - 60 * 1000)
  if (match.status !== 'SCHEDULED' || new Date() >= lockTime) return { error: 'locked' as const }

  await prisma.prediction.upsert({
    where: { userId_matchId: { userId: session.user.id, matchId } },
    update: { homeScore, awayScore, predictedWinnerId: predictedWinnerId ?? null, points: null },
    create: { userId: session.user.id, matchId, homeScore, awayScore, predictedWinnerId: predictedWinnerId ?? null },
  })

  updateTag(`predictions-${session.user.id}`)
  updateTag('standings-todos')
}

export async function deletePrediction(matchId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isBlocked: true } })
  assertNotBlocked(user?.isBlocked ?? false)

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { scheduledAt: true, status: true },
  })
  if (!match) throw new Error('Partido no encontrado')

  const lockTime = new Date(match.scheduledAt.getTime() - 60 * 1000)
  if (match.status !== 'SCHEDULED' || new Date() >= lockTime) return { error: 'locked' as const }

  await prisma.prediction.deleteMany({
    where: { userId: session.user.id, matchId },
  })

  updateTag(`predictions-${session.user.id}`)
  updateTag('standings-todos')
}
