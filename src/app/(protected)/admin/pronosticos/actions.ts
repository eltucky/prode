'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { scoreMatch } from '@/lib/scoring'

async function requireSuperAdmin() {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) throw new Error('Acceso denegado')
}

const editSchema = z.object({
  predictionId: z.string().cuid(),
  homeScore: z.coerce.number().int().min(0).max(99),
  awayScore: z.coerce.number().int().min(0).max(99),
  predictedWinnerId: z.string().cuid().optional().nullable(),
})

export async function editPrediction(formData: FormData) {
  await requireSuperAdmin()

  const parsed = editSchema.safeParse({
    predictionId: formData.get('predictionId'),
    homeScore: formData.get('homeScore'),
    awayScore: formData.get('awayScore'),
    predictedWinnerId: formData.get('predictedWinnerId') || null,
  })
  if (!parsed.success) throw new Error('Datos inválidos')

  const { predictionId, homeScore, awayScore, predictedWinnerId } = parsed.data

  const prediction = await prisma.prediction.update({
    where: { id: predictionId },
    data: { homeScore, awayScore, predictedWinnerId: predictedWinnerId ?? null, points: null },
    select: { matchId: true },
  })

  const match = await prisma.match.findUnique({
    where: { id: prediction.matchId },
    select: { status: true },
  })
  if (match?.status === 'FINISHED') {
    await scoreMatch(prediction.matchId)
  }

  revalidatePath('/admin/pronosticos')
}

export async function deletePrediction(formData: FormData) {
  await requireSuperAdmin()
  const predictionId = z.string().cuid().parse(formData.get('predictionId'))
  await prisma.prediction.delete({ where: { id: predictionId } })
  revalidatePath('/admin/pronosticos')
}
