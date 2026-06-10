'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useLocale } from '@/components/locale-provider'
import { setLocaleAction } from '@/app/actions'

export function LocaleSwitcher() {
  const serverLocale = useLocale()
  const [displayLocale, setDisplayLocale] = useState(serverLocale)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handleClick(l: 'es' | 'en') {
    if (l === displayLocale || isPending) return
    setDisplayLocale(l)
    startTransition(async () => {
      await setLocaleAction(l)
      const qs = searchParams.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname)
    })
  }

  return (
    <div className="flex items-center gap-0.5" style={{ opacity: isPending ? 0.6 : 1, transition: 'opacity 150ms' }}>
      {(['es', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => handleClick(l)}
          disabled={isPending}
          className="text-xs font-semibold px-2 py-1 rounded transition-colors uppercase cursor-pointer disabled:cursor-wait"
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
