'use client'

import { useLocale } from '@/components/locale-provider'
import { setLocaleAction } from '@/app/actions'

export function LocaleSwitcher() {
  const locale = useLocale()

  return (
    <div className="flex items-center gap-0.5">
      {(['es', 'en'] as const).map((l) => (
        <form key={l} action={setLocaleAction.bind(null, l)}>
          <button
            type="submit"
            className="text-xs font-semibold px-2 py-1 rounded transition-colors uppercase"
            style={{
              color: locale === l ? 'var(--text-primary)' : 'var(--text-muted)',
              background: locale === l ? 'var(--surface-raised)' : 'transparent',
              border: locale === l ? '1px solid var(--border)' : '1px solid transparent',
            }}
          >
            {l}
          </button>
        </form>
      ))}
    </div>
  )
}
