# Dark Mode Redesign + PredictionInput — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar la app completa a dark mode e introducir `PredictionInput`, un componente de carga de pronósticos con steppers +/− y auto-save sin botón "Guardar".

**Architecture:** Enfoque híbrido: dark mode global vía CSS tokens en `globals.css` + nuevo componente `MatchCard` extraído del torneo page + nuevo componente `PredictionInput` que reemplaza `prediction-form.tsx`. Sin cambios en routing, actions, ni lógica de negocio.

**Tech Stack:** Next.js (App Router), Tailwind CSS v4, Vitest + @testing-library/react, Prisma, TypeScript.

---

## File Map

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `src/app/globals.css` | Modificar | CSS tokens dark mode + helper `.score-input` |
| `src/app/(protected)/layout.tsx` | Modificar | Fondo `--bg` |
| `src/app/(shell)/layout.tsx` | Modificar | Fondo `--bg` |
| `src/components/navbar.tsx` | Modificar | Dark mode |
| `src/components/nav-links.tsx` | Modificar | Dark mode colores activo/inactivo |
| `src/components/bottom-nav.tsx` | Modificar | Dark mode + punto activo |
| `src/components/prediction-input.tsx` | **Crear** | Reemplaza prediction-form — steppers, auto-save |
| `src/components/match-card.tsx` | **Crear** | Extraído de torneo page — card de partido completa |
| `src/__tests__/prediction-input.test.tsx` | **Crear** | Tests de PredictionInput |
| `src/app/(shell)/torneo/page.tsx` | Modificar | Usa MatchCard, elimina JSX inline de cards |
| `src/app/login/page.tsx` | Modificar | Dark mode |
| `src/app/(protected)/perfil/page.tsx` | Modificar | Dark mode + grid de stats |
| `src/app/(protected)/grupos/page.tsx` | Modificar | Dark mode |
| `src/app/(protected)/grupos/[id]/page.tsx` | Modificar | Dark mode — tabla de posiciones y lista de miembros |
| `src/app/(shell)/reglas/page.tsx` | Modificar | Dark mode |

---

## Task 1: CSS tokens + dark mode foundation

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/(protected)/layout.tsx`
- Modify: `src/app/(shell)/layout.tsx`

- [ ] **Step 1: Reemplazar globals.css**

```css
/* src/app/globals.css */
@import "tailwindcss";

:root {
  --bg:             #0d0d0d;
  --surface:        #1a1a1a;
  --surface-raised: #242424;
  --border:         #2a2a2a;
  --accent:         #22c55e;
  --text-primary:   #f0f0f0;
  --text-muted:     #666666;
  --text-dimmed:    #3a3a3a;
}

body {
  background: var(--bg);
  color: var(--text-primary);
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}

/* Oculta spinner nativo de inputs numéricos de score */
.score-input::-webkit-outer-spin-button,
.score-input::-webkit-inner-spin-button { -webkit-appearance: none; }
.score-input { appearance: textfield; -moz-appearance: textfield; }
```

- [ ] **Step 2: Actualizar layout protegido**

```tsx
// src/app/(protected)/layout.tsx
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Navbar from '@/components/navbar'
import BottomNav from '@/components/bottom-nav'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 pb-20 md:pb-8">{children}</main>
      <BottomNav isSuperAdmin={session.user.isSuperAdmin ?? false} />
    </div>
  )
}
```

- [ ] **Step 3: Actualizar shell layout**

```tsx
// src/app/(shell)/layout.tsx
import { auth } from '@/auth'
import Navbar from '@/components/navbar'
import BottomNav from '@/components/bottom-nav'

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 pb-20 md:pb-8">{children}</main>
      {session?.user && (
        <BottomNav isSuperAdmin={session.user.isSuperAdmin ?? false} />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/app/(protected)/layout.tsx src/app/(shell)/layout.tsx
git commit -m "feat: dark mode CSS tokens and layout backgrounds"
```

---

## Task 2: Navbar dark mode

**Files:**
- Modify: `src/components/navbar.tsx`

- [ ] **Step 1: Reemplazar navbar.tsx**

```tsx
// src/components/navbar.tsx
import Link from 'next/link'
import Image from 'next/image'
import { auth, signOut } from '@/auth'
import { SubmitButton } from '@/components/submit-button'
import { NavLinks } from '@/components/nav-links'

export default async function Navbar() {
  const session = await auth()

  return (
    <nav
      className="px-4 py-3 flex items-center justify-between border-b"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <Link
        href={session ? '/torneo' : '/'}
        className="font-extrabold text-base flex items-center gap-2 tracking-tight"
        style={{ color: 'var(--text-primary)' }}
      >
        <span>⚽</span>
        <span>Prode 2026</span>
        <span
          className="text-[9px] font-black px-1.5 py-0.5 rounded-full tracking-wide"
          style={{ background: 'var(--accent)', color: '#000' }}
        >
          FIFA
        </span>
      </Link>

      {session?.user ? (
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden md:flex items-center gap-4">
            <NavLinks isSuperAdmin={session.user.isSuperAdmin ?? false} />
          </div>
          {session.user.image && (
            <Image
              src={session.user.image}
              alt={session.user.name ?? ''}
              width={30}
              height={30}
              className="rounded-full border"
              style={{ borderColor: 'var(--border)' }}
            />
          )}
          <Link
            href="/perfil"
            className="hidden md:block text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            {session.user.name}
          </Link>
          <form
            action={async () => {
              'use server'
              await signOut({ redirectTo: '/login' })
            }}
          >
            <SubmitButton
              className="hidden md:block text-sm transition-colors"
              style={{ color: 'var(--text-muted)' } as React.CSSProperties}
            >
              Salir
            </SubmitButton>
          </form>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          {(['Torneo', 'Reglas'] as const).map(label => (
            <Link
              key={label}
              href={`/${label.toLowerCase()}`}
              className="text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/login"
            className="text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            Iniciar sesión
          </Link>
        </div>
      )}
    </nav>
  )
}
```

- [ ] **Step 2: Actualizar nav-links.tsx**

```tsx
// src/components/nav-links.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/torneo', label: 'Torneo' },
  { href: '/grupos', label: 'Grupos' },
  { href: '/reglas', label: 'Reglas' },
]

export function NavLinks({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-4">
      {LINKS.map(({ href, label }) => {
        const isActive = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className="text-sm font-medium transition-colors"
            style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}
          >
            {label}
          </Link>
        )
      })}
      {isSuperAdmin && (
        <Link
          href="/admin/partidos"
          className="text-sm font-medium transition-colors"
          style={{ color: pathname.startsWith('/admin') ? '#ef4444' : '#f87171' }}
        >
          Admin
        </Link>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/navbar.tsx src/components/nav-links.tsx
git commit -m "feat: navbar and nav-links dark mode"
```

---

## Task 3: BottomNav dark mode

**Files:**
- Modify: `src/components/bottom-nav.tsx`

- [ ] **Step 1: Reemplazar bottom-nav.tsx**

```tsx
// src/components/bottom-nav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { signOutAction } from '@/app/actions'
import { SubmitButton } from '@/components/submit-button'

const TABS = [
  { href: '/torneo', label: 'Torneo', icon: '🏟️' },
  { href: '/grupos', label: 'Grupos', icon: '👥' },
  { href: '/reglas', label: 'Reglas', icon: '📋' },
  { href: '/perfil', label: 'Perfil', icon: '👤' },
]

export default function BottomNav({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <>
      {moreOpen && (
        <div
          data-testid="more-overlay"
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {moreOpen && (
        <div
          className="fixed bottom-16 right-0 z-50 border rounded-tl-xl shadow-lg min-w-40 md:hidden"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          {isSuperAdmin && (
            <Link
              href="/admin/partidos"
              className="flex items-center gap-2 px-4 py-3 text-sm border-b"
              style={{ color: '#ef4444', borderColor: 'var(--border)' }}
              onClick={() => setMoreOpen(false)}
            >
              Admin
            </Link>
          )}
          <form action={signOutAction}>
            <SubmitButton
              className="flex items-center gap-2 px-4 py-3 text-sm w-full text-left"
              style={{ color: 'var(--text-muted)' } as React.CSSProperties}
            >
              Salir
            </SubmitButton>
          </form>
        </div>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t md:hidden"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex justify-around items-center py-1 pb-2">
          {TABS.map((tab) => {
            const isActive = pathname.startsWith(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center gap-0.5 px-3 py-2 min-w-14 text-xs"
                style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}
              >
                <span className="text-xl leading-none">{tab.icon}</span>
                <span className={isActive ? 'font-semibold' : ''}>{tab.label}</span>
                {isActive && (
                  <span
                    className="w-1 h-1 rounded-full mt-0.5"
                    style={{ background: 'var(--accent)' }}
                  />
                )}
              </Link>
            )
          })}

          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className="flex flex-col items-center gap-0.5 px-3 py-2 min-w-14 text-xs"
            style={{ color: moreOpen ? 'var(--accent)' : 'var(--text-muted)' }}
          >
            <span className="text-xl leading-none">···</span>
            <span>Más</span>
          </button>
        </div>
      </nav>
    </>
  )
}
```

- [ ] **Step 2: Verificar tests existentes de bottom-nav**

```bash
npx vitest run src/__tests__/bottom-nav.test.tsx
```

Los tests no testean clases CSS, solo comportamiento (clicks, texto). Deben seguir pasando sin cambios.

- [ ] **Step 3: Commit**

```bash
git add src/components/bottom-nav.tsx
git commit -m "feat: bottom-nav dark mode with active dot indicator"
```

---

## Task 4: PredictionInput — Tests primero (TDD)

**Files:**
- Create: `src/__tests__/prediction-input.test.tsx`

- [ ] **Step 1: Crear tests**

```tsx
// src/__tests__/prediction-input.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PredictionInput } from '@/components/prediction-input'

vi.mock('@/app/(protected)/torneo/actions', () => ({
  savePrediction: vi.fn().mockResolvedValue(undefined),
  deletePrediction: vi.fn().mockResolvedValue(undefined),
}))

const homeTeam = { flag: '🇦🇷', name: 'Argentina' }
const awayTeam = { flag: '🇧🇷', name: 'Brasil' }

const baseProps = {
  matchId: 'match-1',
  prediction: null,
  homeTeam,
  awayTeam,
  homeTeamId: 'home-1',
  awayTeamId: 'away-1',
  isKnockout: false,
}

describe('PredictionInput', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('muestra — cuando no hay pronóstico', () => {
    render(<PredictionInput {...baseProps} />)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(2)
  })

  it('muestra hint cuando no hay pronóstico ni scores', () => {
    render(<PredictionInput {...baseProps} />)
    expect(screen.getByText('Tocá ▲ para empezar')).toBeDefined()
  })

  it('incrementa el score local al hacer click en ▲ del equipo local', () => {
    render(<PredictionInput {...baseProps} />)
    const upButtons = screen.getAllByLabelText('Aumentar')
    fireEvent.click(upButtons[0])
    expect(screen.getByText('0')).toBeDefined()
  })

  it('segundo click en ▲ va a 1', () => {
    render(<PredictionInput {...baseProps} />)
    const upButtons = screen.getAllByLabelText('Aumentar')
    fireEvent.click(upButtons[0])
    fireEvent.click(upButtons[0])
    expect(screen.getByText('1')).toBeDefined()
  })

  it('▼ no hace nada cuando el score es null', () => {
    render(<PredictionInput {...baseProps} />)
    const downButtons = screen.getAllByLabelText('Disminuir')
    fireEvent.click(downButtons[0])
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(2)
  })

  it('▼ no baja de 0', () => {
    render(<PredictionInput {...baseProps} />)
    const upButtons = screen.getAllByLabelText('Aumentar')
    const downButtons = screen.getAllByLabelText('Disminuir')
    fireEvent.click(upButtons[0]) // → 0
    fireEvent.click(downButtons[0]) // intenta bajar de 0
    expect(screen.getByText('0')).toBeDefined()
  })

  it('muestra "Completá el otro score" cuando solo un equipo tiene score', () => {
    render(<PredictionInput {...baseProps} />)
    const upButtons = screen.getAllByLabelText('Aumentar')
    fireEvent.click(upButtons[0]) // home = 0, away = null
    expect(screen.getByText('Completá el otro score')).toBeDefined()
  })

  it('no muestra el ícono de borrar cuando no hay predicción guardada', () => {
    render(<PredictionInput {...baseProps} />)
    expect(screen.queryByLabelText('Borrar pronóstico')).toBeNull()
  })

  it('muestra el ícono de borrar cuando hay predicción guardada', () => {
    render(<PredictionInput
      {...baseProps}
      prediction={{ homeScore: 2, awayScore: 1, predictedWinnerId: null }}
    />)
    expect(screen.getByLabelText('Borrar pronóstico')).toBeDefined()
  })

  it('al clickear el ícono de borrar, muestra confirmación', () => {
    render(<PredictionInput
      {...baseProps}
      prediction={{ homeScore: 2, awayScore: 1, predictedWinnerId: null }}
    />)
    fireEvent.click(screen.getByLabelText('Borrar pronóstico'))
    expect(screen.getByText('¿Borrar pronóstico?')).toBeDefined()
    expect(screen.getByText('Sí')).toBeDefined()
    expect(screen.getByText('No')).toBeDefined()
  })

  it('al confirmar borrar con "No", cierra la confirmación', () => {
    render(<PredictionInput
      {...baseProps}
      prediction={{ homeScore: 2, awayScore: 1, predictedWinnerId: null }}
    />)
    fireEvent.click(screen.getByLabelText('Borrar pronóstico'))
    fireEvent.click(screen.getByText('No'))
    expect(screen.queryByText('¿Borrar pronóstico?')).toBeNull()
  })

  it('inicializa con los scores del pronóstico existente', () => {
    render(<PredictionInput
      {...baseProps}
      prediction={{ homeScore: 3, awayScore: 0, predictedWinnerId: null }}
    />)
    expect(screen.getByText('3')).toBeDefined()
    expect(screen.getByText('0')).toBeDefined()
  })
})
```

- [ ] **Step 2: Correr tests — deben fallar**

```bash
npx vitest run src/__tests__/prediction-input.test.tsx
```

Expected: FAIL — "Cannot find module '@/components/prediction-input'"

---

## Task 5: PredictionInput — Implementación

**Files:**
- Create: `src/components/prediction-input.tsx`

- [ ] **Step 1: Crear prediction-input.tsx**

```tsx
// src/components/prediction-input.tsx
'use client'

import { useTransition, useState, useRef, useEffect } from 'react'
import { savePrediction, deletePrediction } from '@/app/(protected)/torneo/actions'

type Team = { flag: string; name: string }

type Props = {
  matchId: string
  prediction: { homeScore: number; awayScore: number; predictedWinnerId: string | null } | null
  homeTeam: Team | null
  awayTeam: Team | null
  homeTeamId: string | null
  awayTeamId: string | null
  isKnockout: boolean
}

type SaveStatus = 'idle' | 'partial' | 'saving' | 'saved'

export function PredictionInput({
  matchId,
  prediction,
  homeTeam,
  awayTeam,
  homeTeamId,
  awayTeamId,
  isKnockout,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [homeScore, setHomeScore] = useState<number | null>(prediction?.homeScore ?? null)
  const [awayScore, setAwayScore] = useState<number | null>(prediction?.awayScore ?? null)
  const [winnerId, setWinnerId] = useState(prediction?.predictedWinnerId ?? '')
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [confirming, setConfirming] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)
  const wasPending = useRef(false)

  useEffect(() => {
    if (wasPending.current && !isPending) {
      setStatus('saved')
      const t = setTimeout(() => setStatus('idle'), 2000)
      return () => clearTimeout(t)
    }
    wasPending.current = isPending
  }, [isPending])

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (homeScore === null || awayScore === null) {
      setStatus(homeScore === null && awayScore === null ? 'idle' : 'partial')
      return
    }

    setStatus('saving')
    debounceRef.current = setTimeout(() => {
      const fd = new FormData()
      fd.set('matchId', matchId)
      fd.set('homeScore', String(homeScore))
      fd.set('awayScore', String(awayScore))
      if (winnerId) fd.set('predictedWinnerId', winnerId)
      startTransition(() => savePrediction(fd))
    }, 500)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [homeScore, awayScore, winnerId, matchId])

  function changeScore(score: number | null, setter: (v: number | null) => void, delta: 1 | -1) {
    if (delta === 1) {
      setter(score === null ? 0 : Math.min(score + 1, 99))
    } else {
      if (score === null || score === 0) return
      setter(score - 1)
    }
  }

  function handleInputChange(value: string, setter: (v: number | null) => void) {
    if (value === '') { setter(null); return }
    const n = parseInt(value, 10)
    if (!isNaN(n) && n >= 0 && n <= 99) setter(n)
  }

  function handleDelete() {
    setConfirming(false)
    setHomeScore(null)
    setAwayScore(null)
    setStatus('idle')
    startTransition(() => deletePrediction(matchId))
  }

  const hasPrediction = prediction !== null
  const showKnockoutSelector =
    isKnockout &&
    homeTeam &&
    awayTeam &&
    homeScore !== null &&
    awayScore !== null &&
    homeScore === awayScore

  const statusText: string | null = {
    idle: hasPrediction ? null : 'Tocá ▲ para empezar',
    partial: 'Completá el otro score',
    saving: 'Guardando...',
    saved: '✓ Guardado',
  }[status]

  return (
    <div className="space-y-3">
      <div className="relative">
        {hasPrediction && !confirming && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label="Borrar pronóstico"
            className="absolute top-0 right-0 text-sm leading-none transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            🗑
          </button>
        )}

        {/* Mobile */}
        <div className="flex w-full items-center justify-between md:hidden">
          <div className="flex flex-col items-center gap-1">
            <ArrowBtn label="Aumentar" onClick={() => changeScore(homeScore, setHomeScore, 1)} />
            <span className="text-3xl leading-none">{homeTeam?.flag ?? '?'}</span>
            <ArrowBtn label="Disminuir" down onClick={() => changeScore(homeScore, setHomeScore, -1)} disabled={homeScore === null || homeScore === 0} />
          </div>
          <div className="flex items-center gap-3">
            <span
              className="text-3xl font-extrabold tabular-nums w-8 text-center"
              style={{ color: homeScore === null ? 'var(--text-dimmed)' : 'var(--text-primary)' }}
            >
              {homeScore ?? '—'}
            </span>
            <span className="text-xl font-light" style={{ color: 'var(--text-dimmed)' }}>—</span>
            <span
              className="text-3xl font-extrabold tabular-nums w-8 text-center"
              style={{ color: awayScore === null ? 'var(--text-dimmed)' : 'var(--text-primary)' }}
            >
              {awayScore ?? '—'}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ArrowBtn label="Aumentar" onClick={() => changeScore(awayScore, setAwayScore, 1)} />
            <span className="text-3xl leading-none">{awayTeam?.flag ?? '?'}</span>
            <ArrowBtn label="Disminuir" down onClick={() => changeScore(awayScore, setAwayScore, -1)} disabled={awayScore === null || awayScore === 0} />
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden md:flex w-full items-center justify-between">
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl leading-none">{homeTeam?.flag ?? '?'}</span>
            <span className="text-xs max-w-[72px] text-center truncate" style={{ color: 'var(--text-muted)' }}>
              {homeTeam?.name}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ScoreInputWithArrows
              value={homeScore}
              onIncrement={() => changeScore(homeScore, setHomeScore, 1)}
              onDecrement={() => changeScore(homeScore, setHomeScore, -1)}
              onChange={v => handleInputChange(v, setHomeScore)}
            />
            <span className="text-xl font-light" style={{ color: 'var(--text-dimmed)' }}>—</span>
            <ScoreInputWithArrows
              value={awayScore}
              onIncrement={() => changeScore(awayScore, setAwayScore, 1)}
              onDecrement={() => changeScore(awayScore, setAwayScore, -1)}
              onChange={v => handleInputChange(v, setAwayScore)}
            />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl leading-none">{awayTeam?.flag ?? '?'}</span>
            <span className="text-xs max-w-[72px] text-center truncate" style={{ color: 'var(--text-muted)' }}>
              {awayTeam?.name}
            </span>
          </div>
        </div>
      </div>

      {showKnockoutSelector && (
        <select
          value={winnerId}
          onChange={e => setWinnerId(e.target.value)}
          className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
          style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="">Ganador en penales...</option>
          <option value={homeTeamId!}>{homeTeam!.flag} {homeTeam!.name}</option>
          <option value={awayTeamId!}>{awayTeam!.flag} {awayTeam!.name}</option>
        </select>
      )}

      {confirming ? (
        <div className="flex items-center justify-center gap-3 text-xs">
          <span style={{ color: 'var(--text-muted)' }}>¿Borrar pronóstico?</span>
          <button
            onClick={handleDelete}
            className="font-semibold"
            style={{ color: '#ef4444' }}
          >
            Sí
          </button>
          <button
            onClick={() => setConfirming(false)}
            style={{ color: 'var(--text-muted)' }}
          >
            No
          </button>
        </div>
      ) : statusText ? (
        <p
          className="text-center text-xs"
          style={{ color: status === 'saved' ? 'var(--accent)' : 'var(--text-muted)' }}
        >
          {statusText}
        </p>
      ) : null}
    </div>
  )
}

function ArrowBtn({
  onClick,
  down = false,
  disabled = false,
  label,
}: {
  onClick: () => void
  down?: boolean
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="w-7 h-5 flex items-center justify-center rounded text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      style={{
        background: 'var(--surface-raised)',
        border: '1px solid var(--border)',
        color: 'var(--text-muted)',
      }}
    >
      {down ? '▼' : '▲'}
    </button>
  )
}

function ScoreInputWithArrows({
  value,
  onIncrement,
  onDecrement,
  onChange,
}: {
  value: number | null
  onIncrement: () => void
  onDecrement: () => void
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <ArrowBtn label="Aumentar" onClick={onIncrement} />
      <input
        type="number"
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        min={0}
        max={99}
        placeholder="—"
        className="score-input w-14 h-12 text-center text-3xl font-extrabold tabular-nums rounded-lg focus:outline-none"
        style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
        }}
      />
      <ArrowBtn label="Disminuir" down onClick={onDecrement} disabled={value === null || value === 0} />
    </div>
  )
}
```

- [ ] **Step 2: Correr tests — deben pasar**

```bash
npx vitest run src/__tests__/prediction-input.test.tsx
```

Expected: 13/13 PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/prediction-input.tsx src/__tests__/prediction-input.test.tsx
git commit -m "feat: PredictionInput component with steppers and auto-save"
```

---

## Task 6: MatchCard component

**Files:**
- Create: `src/components/match-card.tsx`

- [ ] **Step 1: Crear match-card.tsx**

Extrae el JSX de cada card que actualmente vive inline en `torneo/page.tsx`.

```tsx
// src/components/match-card.tsx
import { MatchStage, MatchStatus } from '@prisma/client'
import { ClientDate } from '@/components/client-date'
import { PredictionInput } from '@/components/prediction-input'
import Link from 'next/link'

type Team = { flag: string; name: string } | null

type Match = {
  id: string
  stage: MatchStage
  status: MatchStatus
  scheduledAt: Date
  homeScore: number | null
  awayScore: number | null
  homeTeamId: string | null
  awayTeamId: string | null
  groupName: string | null
  homeTeam: Team
  awayTeam: Team
}

type Prediction = {
  homeScore: number
  awayScore: number
  predictedWinnerId: string | null
  points: number | null
} | null

type Props = {
  match: Match
  prediction: Prediction
  hasSession: boolean
  showGroupLabel: boolean
  locked: boolean
  isKnockout: boolean
}

const STATUS_BADGE: Record<MatchStatus, { label: string; bg: string; color: string }> = {
  SCHEDULED:   { label: 'Programado', bg: 'var(--surface-raised)', color: 'var(--text-muted)' },
  IN_PROGRESS: { label: 'En juego',   bg: '#fbbf2422',             color: '#fbbf24' },
  FINISHED:    { label: 'Finalizado', bg: '#22c55e1a',             color: 'var(--accent)' },
  POSTPONED:   { label: 'Postergado', bg: '#ef44441a',             color: '#ef4444' },
  CANCELLED:   { label: 'Cancelado',  bg: '#ef44441a',             color: '#ef4444' },
}

export function MatchCard({ match, prediction, hasSession, showGroupLabel, locked, isKnockout }: Props) {
  const badge = STATUS_BADGE[match.status]
  const hasPrediction = prediction !== null

  return (
    <div
      className="rounded-xl px-4 py-3 space-y-3"
      style={{
        background: 'var(--surface)',
        border: `1px solid ${hasPrediction && !locked ? '#22c55e40' : 'var(--border)'}`,
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col min-w-0">
          {showGroupLabel && match.groupName && (
            <span className="text-[10px] mb-0.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Grupo {match.groupName}
            </span>
          )}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {match.homeTeam ? `${match.homeTeam.flag} ${match.homeTeam.name}` : 'TBD'}
            </span>
            <span className="text-sm font-bold tabular-nums shrink-0" style={{ color: 'var(--text-muted)' }}>
              {match.status === 'FINISHED'
                ? `${match.homeScore} - ${match.awayScore}`
                : 'vs'}
            </span>
            <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {match.awayTeam ? `${match.awayTeam.flag} ${match.awayTeam.name}` : 'TBD'}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end shrink-0 gap-1">
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
            style={{ background: badge.bg, color: badge.color }}
          >
            {badge.label}
          </span>
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            <ClientDate iso={match.scheduledAt.toISOString()} />
          </span>
        </div>
      </div>

      {/* Bottom row: prediction area */}
      {match.status !== 'CANCELLED' && (
        <div className="border-t pt-3" style={{ borderColor: 'var(--border)' }}>
          {locked ? (
            prediction ? (
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Tu pronóstico:</span>
                <span className="font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {prediction.homeScore} - {prediction.awayScore}
                </span>
                {isKnockout && prediction.predictedWinnerId && (
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {'(ganador: '}
                    {prediction.predictedWinnerId === match.homeTeamId
                      ? match.homeTeam?.name
                      : match.awayTeam?.name}
                    {')'}
                  </span>
                )}
                {prediction.points !== null && (
                  <span
                    className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: prediction.points > 0 ? '#22c55e1a' : 'var(--surface-raised)',
                      color: prediction.points > 0 ? 'var(--accent)' : 'var(--text-muted)',
                    }}
                  >
                    {prediction.points > 0 ? '+' : ''}{prediction.points} pts
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Sin pronóstico</span>
            )
          ) : hasSession ? (
            <PredictionInput
              key={prediction ? 'has-pred' : `new-${match.id}`}
              matchId={match.id}
              prediction={prediction}
              homeTeam={match.homeTeam}
              awayTeam={match.awayTeam}
              homeTeamId={match.homeTeamId}
              awayTeamId={match.awayTeamId}
              isKnockout={isKnockout}
            />
          ) : (
            <Link href="/login" className="text-xs" style={{ color: '#3b82f6' }}>
              Iniciá sesión para hacer tu pronóstico →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Correr todos los tests para verificar nada se rompió**

```bash
npx vitest run
```

Expected: todos en PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/match-card.tsx
git commit -m "feat: MatchCard component extracted from torneo page"
```

---

## Task 7: Torneo page usa MatchCard

**Files:**
- Modify: `src/app/(shell)/torneo/page.tsx`

- [ ] **Step 1: Reemplazar torneo/page.tsx**

```tsx
// src/app/(shell)/torneo/page.tsx
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { MatchStage, MatchStatus } from '@prisma/client'
import { MatchCard } from '@/components/match-card'
import Link from 'next/link'

const STAGE_LABELS: Record<MatchStage, string> = {
  GROUP:         'Fase de Grupos',
  ROUND_OF_32:   'Ronda de 32',
  ROUND_OF_16:   'Octavos',
  QUARTER_FINAL: 'Cuartos',
  SEMI_FINAL:    'Semifinales',
  THIRD_PLACE:   'Tercer Puesto',
  FINAL:         'Final',
}

const KNOCKOUT_STAGES: MatchStage[] = [
  'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL',
]

function isLocked(scheduledAt: Date): boolean {
  return Date.now() >= scheduledAt.getTime() - 60 * 1000
}

function groupFilterHref(stageFilter: MatchStage | undefined, grupo: string | undefined, target: string | undefined): string {
  const params = new URLSearchParams()
  if (stageFilter) params.set('etapa', stageFilter)
  else params.set('etapa', 'GROUP')
  if (target) params.set('grupo', target)
  return `/torneo?${params.toString()}`
}

const stageOrder: MatchStage[] = [
  'GROUP', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL',
]

export default async function TorneoPage({
  searchParams,
}: {
  searchParams: Promise<{ etapa?: string; grupo?: string }>
}) {
  const { etapa, grupo } = await searchParams
  const session = await auth()

  const VALID_STAGES = new Set<string>(stageOrder)
  const stageFilter = etapa && VALID_STAGES.has(etapa) ? (etapa as MatchStage) : undefined
  const showingGroupStage = !stageFilter || stageFilter === 'GROUP'

  const matches = await prisma.match.findMany({
    where: stageFilter ? { stage: stageFilter } : undefined,
    include: { homeTeam: true, awayTeam: true },
    orderBy: [{ scheduledAt: 'asc' }, { matchNumber: 'asc' }],
  })

  const predictions = session?.user?.id ? await prisma.prediction.findMany({
    where: {
      userId: session.user.id,
      matchId: { in: matches.map(m => m.id) },
    },
  }) : []
  const predMap = new Map(predictions.map(p => [p.matchId, p]))

  const availableGroups = showingGroupStage
    ? [...new Set(matches.filter(m => m.stage === 'GROUP' && m.groupName).map(m => m.groupName!))].sort()
    : []

  const grupoFilter = showingGroupStage && grupo && availableGroups.includes(grupo) ? grupo : undefined

  const byStage = matches.reduce<Record<string, typeof matches>>((acc, match) => {
    const key = match.stage
    if (!acc[key]) acc[key] = []
    if (match.stage === 'GROUP' && grupoFilter && match.groupName !== grupoFilter) return acc
    acc[key].push(match)
    return acc
  }, {})

  const pillClass = (active: boolean) =>
    `text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${active ? 'font-bold' : ''}`

  return (
    <div className="space-y-6">
      {/* Stage filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <a
          href="/torneo"
          className={pillClass(!stageFilter)}
          style={{
            background: !stageFilter ? 'var(--accent)' : 'var(--surface-raised)',
            color: !stageFilter ? '#000' : 'var(--text-muted)',
          }}
        >
          Todos
        </a>
        {stageOrder.map(stage => (
          <a
            key={stage}
            href={`/torneo?etapa=${stage}`}
            className={pillClass(stageFilter === stage && !grupoFilter)}
            style={{
              background: stageFilter === stage && !grupoFilter ? 'var(--accent)' : 'var(--surface-raised)',
              color: stageFilter === stage && !grupoFilter ? '#000' : 'var(--text-muted)',
            }}
          >
            {STAGE_LABELS[stage]}
          </a>
        ))}
      </div>

      {/* Group filter */}
      {showingGroupStage && availableGroups.length > 0 && (
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs mr-1" style={{ color: 'var(--text-muted)' }}>Grupo:</span>
          <a
            href={stageFilter === 'GROUP' ? '/torneo?etapa=GROUP' : '/torneo'}
            className={pillClass(!grupoFilter)}
            style={{
              background: !grupoFilter ? 'var(--accent)' : 'var(--surface-raised)',
              color: !grupoFilter ? '#000' : 'var(--text-muted)',
            }}
          >
            Todos
          </a>
          {availableGroups.map(g => (
            <a
              key={g}
              href={groupFilterHref(stageFilter, grupo, g)}
              className={pillClass(grupoFilter === g)}
              style={{
                background: grupoFilter === g ? 'var(--accent)' : 'var(--surface-raised)',
                color: grupoFilter === g ? '#000' : 'var(--text-muted)',
              }}
            >
              {g}
            </a>
          ))}
        </div>
      )}

      {/* Match list */}
      {stageOrder.filter(s => byStage[s]?.length).map(stage => (
        <section key={stage}>
          <h2 className="text-base font-bold mb-3 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            {STAGE_LABELS[stage]}
            {stage === 'GROUP' && grupoFilter && (
              <span className="ml-2 font-normal normal-case" style={{ color: 'var(--text-dimmed)' }}>
                — Grupo {grupoFilter}
              </span>
            )}
          </h2>
          <div className="space-y-2">
            {byStage[stage].map(match => (
              <MatchCard
                key={match.id}
                match={match}
                prediction={predMap.get(match.id) ?? null}
                hasSession={!!session}
                showGroupLabel={!grupoFilter}
                locked={isLocked(match.scheduledAt)}
                isKnockout={KNOCKOUT_STAGES.includes(match.stage)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Correr todos los tests**

```bash
npx vitest run
```

Expected: todos en PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/(shell)/torneo/page.tsx
git commit -m "feat: torneo page uses MatchCard component"
```

---

## Task 8: Login page dark mode

**Files:**
- Modify: `src/app/login/page.tsx`

- [ ] **Step 1: Reemplazar login/page.tsx**

```tsx
// src/app/login/page.tsx
import { auth, signIn } from '@/auth'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect('/grupos')

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg)' }}
    >
      <div className="w-full max-w-sm space-y-6 text-center">
        <div>
          <div className="text-5xl mb-3">⚽</div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Prode Mundial 2026
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Jugá con tus amigos
          </p>
        </div>

        <div
          className="rounded-2xl p-5 space-y-3"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <form
            action={async () => {
              'use server'
              await signIn('google', { redirectTo: '/grupos' })
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors"
              style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar con Google
            </button>
          </form>

          {process.env.VERCEL_ENV === 'preview' && (
            <a
              href="/api/auth/preview-signin"
              className="block w-full text-center rounded-xl px-4 py-3 text-sm font-semibold transition-colors"
              style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              Preview login
            </a>
          )}
        </div>

        <p className="text-xs" style={{ color: 'var(--text-dimmed)' }}>
          Al ingresar aceptás las reglas del torneo
        </p>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/login/page.tsx
git commit -m "feat: login page dark mode"
```

---

## Task 9: Perfil page dark mode + stats grid

**Files:**
- Modify: `src/app/(protected)/perfil/page.tsx`

El perfil actual no tiene stats de puntos (eso no existe en el schema de `User`). La sección de stats se omite de acuerdo a YAGNI — solo se agregan las que tienen datos reales disponibles hoy: nombre y email. Se mantiene la sección de notificaciones.

- [ ] **Step 1: Reemplazar perfil/page.tsx**

```tsx
// src/app/(protected)/perfil/page.tsx
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { updateEmailNotifications } from './actions'
import { SubmitButton } from '@/components/submit-button'

export default async function PerfilPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, emailNotifications: true },
  })
  if (!user) redirect('/login')

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
        Perfil
      </h1>

      {/* Hero */}
      <div
        className="rounded-2xl p-5 flex items-center gap-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt={user.name ?? ''}
            width={48}
            height={48}
            className="rounded-full shrink-0"
            style={{ border: '2px solid var(--accent)' }}
          />
        ) : (
          <div
            className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-xl"
            style={{ background: 'var(--surface-raised)', border: '2px solid var(--accent)' }}
          >
            👤
          </div>
        )}
        <div>
          <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{user.name}</div>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{user.email}</div>
        </div>
      </div>

      {/* Notificaciones */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Notificaciones
        </h2>
        <form action={updateEmailNotifications} className="space-y-4">
          <label className="flex items-start justify-between gap-4 cursor-pointer">
            <div>
              <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                Recordatorios y resumen diario
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Te avisamos 2 horas antes de cada partido si todavía no cargaste pronóstico, y te mandamos un resumen de puntos al final del día.
              </div>
            </div>
            <input
              type="checkbox"
              name="emailNotifications"
              defaultChecked={user.emailNotifications}
              className="mt-1 w-5 h-5 shrink-0"
              style={{ accentColor: 'var(--accent)' }}
            />
          </label>
          <SubmitButton
            className="w-full rounded-xl py-2.5 text-sm font-bold transition-colors"
            style={{ background: 'var(--accent)', color: '#000' } as React.CSSProperties}
          >
            Guardar
          </SubmitButton>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(protected)/perfil/page.tsx
git commit -m "feat: perfil page dark mode"
```

---

## Task 10: Grupos + Reglas dark mode

**Files:**
- Modify: `src/app/(protected)/grupos/page.tsx`
- Modify: `src/app/(shell)/reglas/page.tsx`

- [ ] **Step 1: Reemplazar grupos/page.tsx**

```tsx
// src/app/(protected)/grupos/page.tsx
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { SubmitButton } from '@/components/submit-button'
import { createGroup, joinGroup } from './actions'

export default async function GruposPage() {
  const session = await auth()

  const memberships = await prisma.groupMember.findMany({
    where: { userId: session!.user!.id },
    include: {
      group: {
        include: { _count: { select: { members: true } } },
      },
    },
    orderBy: { joinedAt: 'desc' },
  })

  const inputClass = "flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none"
  const inputStyle = {
    background: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Mis grupos
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Bienvenido, {session?.user?.name}
        </p>
      </div>

      {memberships.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {memberships.map(({ group }) => (
            <Link
              key={group.id}
              href={`/grupos/${group.id}`}
              className="rounded-xl px-5 py-4 block transition-colors hover:brightness-110"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {group.name}
              </div>
              <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {group._count.members}{' '}
                {group._count.members === 1 ? 'participante' : 'participantes'}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div
          className="rounded-xl p-10 text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="text-4xl mb-3">🏆</div>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
            Todavía no pertenecés a ningún grupo
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Creá uno o pedile a alguien el código de invitación
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div
          className="rounded-xl p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <h2 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Crear grupo
          </h2>
          <form action={createGroup} className="flex gap-2">
            <input
              name="name"
              type="text"
              placeholder="Nombre del grupo"
              required
              maxLength={50}
              className={inputClass}
              style={inputStyle}
            />
            <SubmitButton
              className="rounded-lg px-4 py-2 text-sm font-bold shrink-0 transition-colors"
              style={{ background: 'var(--accent)', color: '#000' } as React.CSSProperties}
            >
              Crear
            </SubmitButton>
          </form>
        </div>

        <div
          className="rounded-xl p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <h2 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Unirse con código
          </h2>
          <form action={joinGroup} className="flex gap-2">
            <input
              name="inviteCode"
              type="text"
              placeholder="Código de invitación"
              required
              className={inputClass}
              style={inputStyle}
            />
            <SubmitButton
              className="rounded-lg px-4 py-2 text-sm font-bold shrink-0 transition-colors"
              style={{ background: 'var(--accent)', color: '#000' } as React.CSSProperties}
            >
              Unirse
            </SubmitButton>
          </form>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Reemplazar reglas/page.tsx**

```tsx
// src/app/(shell)/reglas/page.tsx
export const metadata = {
  title: 'Reglas de puntuación — Prode Mundial 2026',
}

export default function ReglasPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Reglas de puntuación
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Cómo se calculan los puntos por cada partido.
        </p>
      </div>

      <Section title="Fase de grupos">
        <ScoreRow points={5} label="Resultado exacto" description="Acertás los dos marcadores. Ej: pronosticás 2-1 y sale 2-1." highlight />
        <ScoreRow points={3} label="Resultado correcto + un marcador exacto" description="Acertás quién gana (o que empata) y uno de los dos goles. Ej: pronosticás 2-1, sale 2-0." />
        <ScoreRow points={2} label="Resultado correcto" description="Acertás quién gana o que empata, pero ningún marcador. Ej: pronosticás 2-1, sale 3-0." />
        <ScoreRow points={0} label="Resultado incorrecto" description="El equipo que dijiste que ganaba perdió, o dijiste empate y hubo ganador." />
      </Section>

      <Section title="Fases eliminatorias" subtitle="Misma puntuación que en grupos para el marcador, más un bonus por el clasificado.">
        <ScoreRow points={7} label="Resultado exacto + clasificado correcto" description="Ambos marcadores exactos y acertás quién avanza. Máximo posible." highlight />
        <ScoreRow points={5} label="Resultado exacto sin clasificado correcto" description="Pronosticás empate con marcador exacto (ej: 1-1) pero te equivocás en quién clasifica." />
        <ScoreRow points={4} label="Resultado correcto + clasificado correcto" description="Acertás el resultado (sin marcadores exactos) y quién avanza." />
        <ScoreRow points={2} label="Solo resultado correcto" description="Acertás el resultado pero te equivocaste en el clasificado." />
        <ScoreRow points={0} label="Resultado incorrecto" description="No acertás el resultado. El clasificado no suma." />
        <p className="text-xs pt-3 border-t mt-2" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
          El marcador se evalúa al final del tiempo reglamentario (90 min).
        </p>
      </Section>

      <Section title="Resumen rápido">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b" style={{ borderColor: 'var(--border)' }}>
              <th className="pb-2 text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Condición</th>
              <th className="pb-2 text-xs uppercase tracking-wide text-right" style={{ color: 'var(--text-muted)' }}>Pts</th>
            </tr>
          </thead>
          <tbody style={{ color: 'var(--text-primary)' }}>
            {[
              ['Resultado correcto (base)', '+2'],
              ['Gol del local exacto', '+1'],
              ['Gol del visitante exacto', '+1'],
              ['Ambos goles exactos (bonus)', '+1'],
              ['Clasificado correcto (eliminatorias)', '+2'],
            ].map(([label, pts]) => (
              <tr key={label} className="border-b" style={{ borderColor: 'var(--border)' }}>
                <td className="py-2 text-sm" style={{ color: 'var(--text-primary)' }}>{label}</td>
                <td className="py-2 text-right font-mono font-bold" style={{ color: 'var(--accent)' }}>{pts}</td>
              </tr>
            ))}
            <tr>
              <td className="py-2 font-semibold">Máximo grupos / eliminatorias</td>
              <td className="py-2 text-right font-mono font-bold" style={{ color: 'var(--accent)' }}>5 / 7</td>
            </tr>
          </tbody>
        </table>
      </Section>
    </div>
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-2xl p-5 space-y-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div>
        <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{title}</h2>
        {subtitle && <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

function ScoreRow({ points, label, description, highlight = false }: {
  points: number; label: string; description: string; highlight?: boolean
}) {
  return (
    <div
      className="flex gap-4 items-start rounded-lg p-3"
      style={{ background: highlight ? '#22c55e1a' : 'var(--surface-raised)' }}
    >
      <span
        className="text-xl font-extrabold tabular-nums shrink-0 w-8 text-center"
        style={{ color: highlight ? 'var(--accent)' : points === 0 ? 'var(--text-dimmed)' : 'var(--text-primary)' }}
      >
        {points}
      </span>
      <div>
        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Reemplazar grupos/[id]/page.tsx**

```tsx
// src/app/(protected)/grupos/[id]/page.tsx
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default async function GrupoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: true },
        orderBy: { joinedAt: 'asc' },
      },
    },
  })

  if (!group) notFound()

  const isMember = group.members.some(m => m.userId === session?.user?.id)
  if (!isMember) redirect('/grupos')

  const isOwner = group.ownerId === session?.user?.id

  const memberIds = group.members.map(m => m.userId)
  const predictions = await prisma.prediction.findMany({
    where: { userId: { in: memberIds }, points: { not: null } },
    select: { userId: true, points: true },
  })

  const standings = group.members
    .map(m => {
      const memberPreds = predictions.filter(p => p.userId === m.userId)
      return {
        user: m.user,
        points: memberPreds.reduce((sum, p) => sum + (p.points ?? 0), 0),
        correctCount: memberPreds.filter(p => (p.points ?? 0) > 0).length,
        isCurrentUser: m.userId === session?.user?.id,
      }
    })
    .sort((a, b) => b.points - a.points || b.correctCount - a.correctCount)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <Link href="/grupos" className="text-sm transition-colors" style={{ color: 'var(--text-muted)' }}>
            ← Mis grupos
          </Link>
          <h1 className="text-xl font-extrabold tracking-tight mt-1" style={{ color: 'var(--text-primary)' }}>
            {group.name}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {group.members.length}{' '}
            {group.members.length === 1 ? 'participante' : 'participantes'}
          </p>
        </div>

        {isOwner && (
          <div
            className="rounded-xl px-4 py-3"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Código de invitación</p>
            <p className="font-mono text-sm font-semibold select-all" style={{ color: 'var(--text-primary)' }}>
              {group.inviteCode}
            </p>
          </div>
        )}
      </div>

      {/* Standings table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Tabla de posiciones
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--surface-raised)' }}>
            <tr>
              {['#', 'Participante', 'Pts', 'Aciertos'].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-2 text-xs font-semibold uppercase ${i === 0 ? 'text-left w-8' : i === 1 ? 'text-left' : i === 3 ? 'text-right hidden sm:table-cell' : 'text-right'}`}
                  style={{ color: 'var(--text-muted)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {standings.map((entry, idx) => (
              <tr
                key={entry.user.id}
                className="border-t"
                style={{
                  borderColor: 'var(--border)',
                  background: entry.isCurrentUser ? '#22c55e0d' : 'transparent',
                }}
              >
                <td className="px-4 py-2 font-medium" style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    {entry.user.image ? (
                      <Image
                        src={entry.user.image}
                        alt={entry.user.name ?? ''}
                        width={24}
                        height={24}
                        className="rounded-full shrink-0"
                      />
                    ) : (
                      <div
                        className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-medium"
                        style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)' }}
                      >
                        {entry.user.name?.[0] ?? '?'}
                      </div>
                    )}
                    <span
                      className={`truncate text-sm ${entry.isCurrentUser ? 'font-semibold' : ''}`}
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {entry.user.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2 text-right font-bold tabular-nums" style={{ color: 'var(--accent)' }}>
                  {entry.points}
                </td>
                <td className="px-4 py-2 text-right tabular-nums hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>
                  {entry.correctCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Members list */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {group.members.map((member, idx) => (
          <div
            key={member.id}
            className="flex items-center gap-3 px-4 py-3"
            style={{ borderTop: idx > 0 ? `1px solid var(--border)` : 'none' }}
          >
            {member.user.image ? (
              <Image
                src={member.user.image}
                alt={member.user.name ?? ''}
                width={36}
                height={36}
                className="rounded-full shrink-0"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-sm font-medium"
                style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)' }}
              >
                {member.user.name?.[0] ?? '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {member.user.name}
              </div>
              <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                {member.user.email}
              </div>
            </div>
            {group.ownerId === member.userId && (
              <span
                className="text-xs px-2 py-0.5 rounded-full shrink-0"
                style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)' }}
              >
                Admin
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Correr todos los tests**

```bash
npx vitest run
```

Expected: todos en PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/(protected)/grupos/page.tsx src/app/(shell)/reglas/page.tsx src/app/(protected)/grupos/[id]/page.tsx
git commit -m "feat: grupos, grupo detail, and reglas pages dark mode"
```

---

## Verificación final

- [ ] **Correr suite completa de tests**

```bash
npx vitest run
```

Expected: todos en PASS, sin regresiones.

- [ ] **Push de la rama**

```bash
git push -u origin <branch-name>
```
