'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function updateEmailNotifications(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  const enabled = formData.get('emailNotifications') === 'on'
  await prisma.user.update({
    where: { id: session.user.id },
    data: { emailNotifications: enabled },
  })
  revalidatePath('/perfil')
}
