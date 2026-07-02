'use client'

import { useState, useTransition } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { setThemeAction } from '@/app/actions'
import type { Theme } from '@/lib/theme'

const THEMES: Theme[] = ['dark', 'light', 'pokemon']

export function ThemeSwitcher({
  currentTheme,
  labels,
}: {
  currentTheme: Theme
  labels: Record<Theme, string>
}) {
  const [displayTheme, setDisplayTheme] = useState(currentTheme)
  const [isPending, startTransition] = useTransition()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handleClick(theme: Theme) {
    if (theme === displayTheme || isPending) return
    setDisplayTheme(theme)
    startTransition(async () => {
      const qs = searchParams.toString()
      await setThemeAction(theme, qs ? `${pathname}?${qs}` : pathname)
    })
  }

  return (
    <div
      className="grid grid-cols-3 gap-2"
      style={{ opacity: isPending ? 0.6 : 1, transition: 'opacity 150ms' }}
    >
      {THEMES.map((theme) => (
        <button
          key={theme}
          type="button"
          onClick={() => handleClick(theme)}
          disabled={isPending}
          className="text-sm font-semibold px-3 py-2 rounded-xl transition-colors cursor-pointer disabled:cursor-wait"
          style={{
            color: displayTheme === theme ? 'var(--text-primary)' : 'var(--text-muted)',
            background: displayTheme === theme ? 'var(--surface-raised)' : 'transparent',
            border: displayTheme === theme ? '1px solid var(--accent)' : '1px solid var(--border)',
          }}
        >
          {labels[theme]}
        </button>
      ))}
    </div>
  )
}
