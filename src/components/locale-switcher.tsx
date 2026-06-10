'use client'

import { useOptimistic, useTransition } from 'react'
import { useLocale } from '@/components/locale-provider'
import { setLocaleAction } from '@/app/actions'

export function LocaleSwitcher() {
  const locale = useLocale()
  const [optimisticLocale, setOptimisticLocale] = useOptimistic(locale)
  const [, startTransition] = useTransition()

  function handleClick(l: 'es' | 'en') {
    startTransition(async () => {
      setOptimisticLocale(l)
      await setLocaleAction(l)
    })
  }

  return (
    <div className="flex items-center gap-0.5">
      {(['es', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => handleClick(l)}
          className="text-xs font-semibold px-2 py-1 rounded transition-colors uppercase cursor-pointer"
          style={{
            color: optimisticLocale === l ? 'var(--text-primary)' : 'var(--text-muted)',
            background: optimisticLocale === l ? 'var(--surface-raised)' : 'transparent',
            border: optimisticLocale === l ? '1px solid var(--border)' : '1px solid transparent',
          }}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
