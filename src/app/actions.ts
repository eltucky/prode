'use server'

import { signOut } from '@/auth'
import { cookies } from 'next/headers'
import { redirect, RedirectType } from 'next/navigation'

export async function signOutAction() {
  await signOut({ redirectTo: '/login' })
}

export async function setLocaleAction(locale: string, returnTo: string) {
  const cookieStore = await cookies()
  cookieStore.set('prode_locale', locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    sameSite: 'lax',
  })
  redirect(returnTo, RedirectType.replace)
}

const VALID_THEMES = ['dark', 'light', 'pokemon']

export async function setThemeAction(theme: string, returnTo: string) {
  if (!VALID_THEMES.includes(theme)) throw new Error('Tema inválido')
  const cookieStore = await cookies()
  cookieStore.set('prode_theme', theme, {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    sameSite: 'lax',
  })
  redirect(returnTo, RedirectType.replace)
}
