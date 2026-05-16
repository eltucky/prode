'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { assertNotSelf } from '@/lib/admin'

async function requireSuperAdmin() {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) throw new Error('Acceso denegado')
  return session.user.id
}

export async function blockUser(formData: FormData) {
  const actingId = await requireSuperAdmin()
  const userId = z.string().cuid().parse(formData.get('userId'))
  assertNotSelf(actingId, userId, 'bloquearte')
  await prisma.user.update({ where: { id: userId }, data: { isBlocked: true } })
  revalidatePath('/admin/usuarios')
}

export async function unblockUser(formData: FormData) {
  await requireSuperAdmin()
  const userId = z.string().cuid().parse(formData.get('userId'))
  await prisma.user.update({ where: { id: userId }, data: { isBlocked: false } })
  revalidatePath('/admin/usuarios')
}

export async function toggleSuperAdmin(formData: FormData) {
  const actingId = await requireSuperAdmin()
  const userId = z.string().cuid().parse(formData.get('userId'))
  const currentValue = formData.get('currentValue') === 'true'
  assertNotSelf(actingId, userId, 'quitarte el super admin')
  await prisma.user.update({ where: { id: userId }, data: { isSuperAdmin: !currentValue } })
  revalidatePath('/admin/usuarios')
}
