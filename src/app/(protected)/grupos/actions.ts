'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { validateGroupName, validateInviteCode } from '@/lib/grupos'
import { assertNotBlocked } from '@/lib/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createGroup(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isBlocked: true } })
  assertNotBlocked(user?.isBlocked ?? false)

  const name = validateGroupName(formData.get('name'))

  const group = await prisma.group.create({
    data: {
      name,
      ownerId: session.user.id,
      members: {
        create: { userId: session.user.id },
      },
    },
  })

  revalidatePath('/grupos')
  redirect(`/grupos/${group.id}`)
}

export async function joinGroup(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isBlocked: true } })
  assertNotBlocked(user?.isBlocked ?? false)

  const code = validateInviteCode(formData.get('inviteCode'))

  const group = await prisma.group.findUnique({ where: { inviteCode: code } })
  if (!group) throw new Error('Código de invitación inválido')

  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: group.id, userId: session.user.id } },
  })

  if (!existing) {
    await prisma.groupMember.create({
      data: { groupId: group.id, userId: session.user.id },
    })
  }

  revalidatePath('/grupos')
  redirect(`/grupos/${group.id}`)
}
