import 'server-only'
import { cache } from 'react'
import { headers } from 'next/headers'

export type Locale = 'es' | 'en'
export const LOCALES: Locale[] = ['es', 'en']
export const DEFAULT_LOCALE: Locale = 'es'

const dictionaries = {
  es: () => import('@/messages/es.json').then((m) => m.default),
  en: () => import('@/messages/en.json').then((m) => m.default),
}

export type Dictionary = Awaited<ReturnType<(typeof dictionaries)['es']>>

export const getDictionary = cache(async (locale: Locale): Promise<Dictionary> => {
  return dictionaries[locale]() as Promise<Dictionary>
})

export async function getLocale(): Promise<Locale> {
  const headersList = await headers()
  const locale = headersList.get('x-locale')
  if (locale === 'es' || locale === 'en') return locale
  return DEFAULT_LOCALE
}

export function t(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str
  return str.replace(/\{(\w+)\}/g, (_, key) => {
    const val = vars[key]
    return val !== undefined ? String(val) : `{${key}}`
  })
}
