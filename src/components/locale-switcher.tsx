'use client'

import { useState, useEffect } from 'react'
import { useLocale } from '@/components/locale-provider'
import { setLocaleAction } from '@/app/actions'

export function LocaleSwitcher() {
  const serverLocale = useLocale()
  const [displayLocale, setDisplayLocale] = useState(serverLocale)

  useEffect(() => {
    setDisplayLocale(serverLocale)
  }, [serverLocale])

  function handleClick(l: 'es' | 'en') {
    setDisplayLocale(l)
    setLocaleAction(l)
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
            color: displayLocale === l ? 'var(--text-primary)' : 'var(--text-muted)',
            background: displayLocale === l ? 'var(--surface-raised)' : 'transparent',
            border: displayLocale === l ? '1px solid var(--border)' : '1px solid transparent',
          }}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
