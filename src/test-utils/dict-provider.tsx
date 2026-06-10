import { LocaleProvider } from '@/components/locale-provider'
import esDict from '@/messages/es.json'
import type { Dictionary } from '@/lib/i18n'

export function MockDictProvider({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider locale="es" dict={esDict as unknown as Dictionary}>
      {children}
    </LocaleProvider>
  )
}
