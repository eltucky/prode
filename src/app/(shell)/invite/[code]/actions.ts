'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { validateInviteCode } from '@/lib/grupos'
import { assertNotBlocked } from '@/lib/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function joinViaInvite(code: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isBlocked: true },
  })
  assertNotBlocked(user?.isBlocked ?? false)

  const validCode = validateInviteCode(code)

  const group = await prisma.group.findUnique({ where: { inviteCode: validCode } })
  if (!group) throw new Error('Código de invitación inválido')

  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: group.id, userId: session.user.id } },
  })

  if (!existing) {
    try {
      await prisma.groupMember.create({
        data: { groupId: group.id, userId: session.user.id },
      })
    } catch (e: unknown) {
      // P2002 = unique constraint violation — another request joined concurrently
      if ((e as { code?: string })?.code !== 'P2002') throw e
    }
  }

  revalidatePath('/grupos')
  redirect(`/grupos/${group.id}`)
}
