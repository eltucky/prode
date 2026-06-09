'use server'

import { signOut } from '@/auth'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function signOutAction() {
  await signOut({ redirectTo: '/login' })
}

export async function setLocaleAction(locale: string) {
  const cookieStore = await cookies()
  cookieStore.set('prode_locale', locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    sameSite: 'lax',
  })
  revalidatePath('/', 'layout')
}
