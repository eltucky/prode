'use client'

import { createContext, useContext } from 'react'
import type { Dictionary } from '@/lib/i18n'

type LocaleContextValue = {
  locale: string
  dict: Dictionary
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({
  locale,
  dict,
  children,
}: {
  locale: string
  dict: Dictionary
  children: React.ReactNode
}) {
  return (
    <LocaleContext.Provider value={{ locale, dict }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useDict(): Dictionary {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useDict must be used within LocaleProvider')
  return ctx.dict
}

export function useLocale(): string {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx.locale
}
