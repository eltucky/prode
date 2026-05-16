'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

async function requireSuperAdmin() {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) throw new Error('Acceso denegado')
}

export async function deleteGroup(formData: FormData) {
  await requireSuperAdmin()
  const groupId = z.string().cuid().parse(formData.get('groupId'))
  await prisma.group.delete({ where: { id: groupId } })
  revalidatePath('/admin/grupos')
}

export async function removeUserFromGroup(formData: FormData) {
  await requireSuperAdmin()
  const groupId = z.string().cuid().parse(formData.get('groupId'))
  const userId = z.string().cuid().parse(formData.get('userId'))

  const group = await prisma.group.findUnique({ where: { id: groupId }, select: { ownerId: true } })
  if (!group) throw new Error('Grupo no encontrado')
  if (group.ownerId === userId) throw new Error('No podés sacar al owner del grupo. Transferí el ownership primero.')

  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId } },
  })
  revalidatePath('/admin/grupos')
}

export async function transferOwnership(formData: FormData) {
  await requireSuperAdmin()
  const groupId = z.string().cuid().parse(formData.get('groupId'))
  const newOwnerId = z.string().cuid().parse(formData.get('newOwnerId'))

  const isMember = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: newOwnerId } },
  })
  if (!isMember) throw new Error('El nuevo owner debe ser miembro del grupo')

  await prisma.group.update({ where: { id: groupId }, data: { ownerId: newOwnerId } })
  revalidatePath('/admin/grupos')
}
