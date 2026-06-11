# Invite Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shareable invite link so any user (registered or not) can join a group via `/invite/[code]`, and expose a copy-to-clipboard button in the group detail page visible to all members.

**Architecture:** The `inviteCode` field already exists on `Group` — no schema migration needed. Five small changes: a new client component (`InviteCopyButton`), a new server action (`joinViaInvite`), a new public page (`/invite/[code]`), a one-line change to the group detail page, and `callbackUrl` support on the login page so non-auth users return to the invite after signing in.

**Tech Stack:** Next.js 16 App Router (Server Components, Server Actions), Prisma, Vitest + Testing Library

---

## File Map

| File | Action |
|---|---|
| `src/components/invite-copy-button.tsx` | Create — client component |
| `src/app/(shell)/invite/[code]/actions.ts` | Create — server action |
| `src/app/(shell)/invite/[code]/page.tsx` | Create — public invite page |
| `src/app/(protected)/grupos/[id]/page.tsx` | Modify — show InviteCopyButton to all members |
| `src/app/login/page.tsx` | Modify — support `callbackUrl` searchParam |

---

## Task 1: InviteCopyButton component

**Files:**
- Create: `src/components/invite-copy-button.tsx`
- Test: `src/__tests__/invite-copy-button.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/invite-copy-button.test.tsx`:

```tsx
import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InviteCopyButton } from '@/components/invite-copy-button'

const mockWriteText = vi.fn().mockResolvedValue(undefined)

beforeEach(() => {
  vi.stubGlobal('navigator', { clipboard: { writeText: mockWriteText } })
  vi.stubGlobal('window', { location: { origin: 'https://prode.app' } })
  mockWriteText.mockClear()
})

describe('InviteCopyButton', () => {
  it('renders copy button', () => {
    render(<InviteCopyButton inviteCode="abc123" />)
    expect(screen.getByRole('button', { name: 'Copiar' })).toBeInTheDocument()
  })

  it('calls clipboard with full URL on click', async () => {
    render(<InviteCopyButton inviteCode="abc123" />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copiar' }))
    })
    expect(mockWriteText).toHaveBeenCalledWith('https://prode.app/invite/abc123')
  })

  it('shows ¡Copiado! after copy', async () => {
    vi.useFakeTimers()
    render(<InviteCopyButton inviteCode="abc123" />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copiar' }))
    })
    expect(screen.getByRole('button', { name: '¡Copiado!' })).toBeInTheDocument()
    vi.useRealTimers()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/invite-copy-button.test.tsx
```

Expected: FAIL — `InviteCopyButton` not found.

- [ ] **Step 3: Create the component**

Create `src/components/invite-copy-button.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'

export function InviteCopyButton({ inviteCode }: { inviteCode: string }) {
  const [copied, setCopied] = useState(false)
  const [url, setUrl] = useState('')

  useEffect(() => {
    setUrl(`${window.location.origin}/invite/${inviteCode}`)
  }, [inviteCode])

  async function handleCopy() {
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Invitar amigos</p>
      <div className="flex items-center gap-2">
        <span
          className="text-sm font-mono truncate flex-1 min-w-0"
          style={{ color: 'var(--text-primary)' }}
        >
          {url || `…/invite/${inviteCode}`}
        </span>
        <button
          onClick={handleCopy}
          className="text-xs px-3 py-1.5 rounded-lg shrink-0 font-medium cursor-pointer transition-colors"
          style={{ background: 'var(--accent)', color: '#000' }}
        >
          {copied ? '¡Copiado!' : 'Copiar'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/__tests__/invite-copy-button.test.tsx
```

Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/invite-copy-button.tsx src/__tests__/invite-copy-button.test.tsx
git commit -m "feat: add InviteCopyButton component"
```

---

## Task 2: Login page callbackUrl support

**Files:**
- Modify: `src/app/login/page.tsx`

The login page currently redirects to `/grupos` after sign-in. We need it to honor a `callbackUrl` query param so users coming from `/invite/[code]` return there after logging in.

- [ ] **Step 1: Read the current login page**

Read `src/app/login/page.tsx` to see the current shape before editing. Key things to find:
- The `action={async () => { 'use server'; await signIn('google', { redirectTo: '/grupos' }) }}` form
- The `if (session) redirect('/grupos')` guard at the top

- [ ] **Step 2: Apply the changes**

Replace the entire file content of `src/app/login/page.tsx` with:

```tsx
// src/app/login/page.tsx
import { auth, signIn } from '@/auth'
import { redirect } from 'next/navigation'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const session = await auth()
  if (session) redirect('/grupos')

  const { callbackUrl } = await searchParams
  // Only allow relative URLs to prevent open redirect
  const redirectTo = callbackUrl?.startsWith('/') ? callbackUrl : '/grupos'

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
              await signIn('google', { redirectTo })
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

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "login"
```

Expected: no output (no errors in login page).

- [ ] **Step 4: Commit**

```bash
git add src/app/login/page.tsx
git commit -m "feat: support callbackUrl on login page"
```

---

## Task 3: joinViaInvite server action

**Files:**
- Create: `src/app/(shell)/invite/[code]/actions.ts`

- [ ] **Step 1: Create the actions file**

Create `src/app/(shell)/invite/[code]/actions.ts`:

```ts
'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { assertNotBlocked } from '@/lib/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function joinViaInvite(code: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isBlocked: true },
  })
  assertNotBlocked(user?.isBlocked ?? false)

  const group = await prisma.group.findUnique({ where: { inviteCode: code } })
  if (!group) throw new Error('Código de invitación inválido')

  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: group.id, userId: session.user.id } },
  })

  if (!existing) {
    await prisma.groupMember.create({
      data: { groupId: group.id, userId: session.user.id },
    })
  }

  revalidatePath('/grupos')
  redirect(`/grupos/${group.id}`)
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "invite"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(shell)/invite/[code]/actions.ts"
git commit -m "feat: add joinViaInvite server action"
```

---

## Task 4: Invite landing page

**Files:**
- Create: `src/app/(shell)/invite/[code]/page.tsx`

This page has four states (see spec). It lives in `(shell)` so it's accessible without authentication.

- [ ] **Step 1: Create the page**

Create `src/app/(shell)/invite/[code]/page.tsx`:

```tsx
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SubmitButton } from '@/components/submit-button'
import { joinViaInvite } from './actions'

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const session = await auth()

  const group = await prisma.group.findUnique({
    where: { inviteCode: code },
    include: { _count: { select: { members: true } } },
  })

  // State 1: invalid code
  if (!group) {
    return (
      <div className="max-w-sm mx-auto text-center space-y-4 py-16">
        <div className="text-4xl">🔗</div>
        <h1 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
          Link inválido
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Este link de invitación no es válido o ya no está disponible.
        </p>
        <Link
          href="/torneo"
          className="inline-block text-sm font-medium"
          style={{ color: 'var(--accent)' }}
        >
          Ver el torneo →
        </Link>
      </div>
    )
  }

  // State 2: already a member → redirect silently
  if (session?.user?.id) {
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: session.user.id } },
    })
    if (membership) redirect(`/grupos/${group.id}`)
  }

  const memberCount = group._count.members

  return (
    <div className="max-w-sm mx-auto text-center space-y-6 py-16">
      <div className="text-4xl">🏆</div>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {group.name}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {memberCount} {memberCount === 1 ? 'participante' : 'participantes'}
        </p>
      </div>

      <div
        className="rounded-2xl p-5 space-y-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {session
            ? 'Uniéndote a este grupo podrás competir con sus miembros.'
            : 'Iniciá sesión para unirte a este grupo y competir.'}
        </p>

        {/* State 4: logged in, not yet a member */}
        {session && (
          <form action={joinViaInvite.bind(null, code)}>
            <SubmitButton
              className="w-full rounded-xl px-4 py-3 text-sm font-bold transition-colors"
              style={{ background: 'var(--accent)', color: '#000' } as React.CSSProperties}
            >
              Unirse al grupo
            </SubmitButton>
          </form>
        )}

        {/* State 3: not logged in */}
        {!session && (
          <Link
            href={`/login?callbackUrl=/invite/${code}`}
            className="block w-full rounded-xl px-4 py-3 text-sm font-bold text-center transition-colors"
            style={{ background: 'var(--accent)', color: '#000' }}
          >
            Iniciar sesión para unirte
          </Link>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "invite"
```

Expected: no output.

- [ ] **Step 3: Smoke-test the 4 states manually**

Run `npm run dev`. Then test:

1. **Invalid code**: Go to `/invite/codigo-inventado` → should see "Link inválido" with link to torneo.
2. **Not logged in**: Go to `/invite/[a real code from DB]` → should see group name + "Iniciar sesión para unirte".
3. **Logged in, not member**: Log in as a user who isn't in the group → should see group name + "Unirse al grupo" button. Click it → should redirect to `/grupos/[id]` and show the group.
4. **Already a member**: Log in as a user already in the group, visit the link → should redirect directly to `/grupos/[id]`.

To get a real invite code: `npx prisma studio` or check the `Group` table.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(shell)/invite/[code]/page.tsx"
git commit -m "feat: add /invite/[code] public landing page"
```

---

## Task 5: Show invite URL in group detail page

**Files:**
- Modify: `src/app/(protected)/grupos/[id]/page.tsx`

Currently only the owner sees a box with the raw `inviteCode`. Replace it with `InviteCopyButton` visible to **all members**.

- [ ] **Step 1: Add the import**

In `src/app/(protected)/grupos/[id]/page.tsx`, add to the imports at the top:

```tsx
import { InviteCopyButton } from '@/components/invite-copy-button'
```

- [ ] **Step 2: Replace the invite code box**

Find this block (lines ~66–76):

```tsx
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
```

Replace with:

```tsx
<InviteCopyButton inviteCode={group.inviteCode} />
```

The `isOwner` guard is removed — every member can now share the link.

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "grupos"
```

Expected: no output.

- [ ] **Step 4: Smoke-test**

Run `npm run dev`. Go to `/grupos/[id]` as a non-owner member. The "Invitar amigos" box should appear with the URL and a "Copiar" button. Click "Copiar" and paste to verify the full URL is in the clipboard.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(protected)/grupos/[id]/page.tsx"
git commit -m "feat: show invite link to all group members"
```

---

## Self-Review

**Spec coverage:**
- ✅ `/invite/[code]` public landing page in `(shell)` — Task 4
- ✅ State 1: invalid code — Task 4
- ✅ State 2: already a member → redirect — Task 4
- ✅ State 3: not logged in → "Iniciar sesión" → `/login?callbackUrl=...` — Tasks 2 + 4
- ✅ State 4: logged in, not member → "Unirse al grupo" — Tasks 3 + 4
- ✅ `joinViaInvite` server action with same guards as `joinGroup` — Task 3
- ✅ `InviteCopyButton` visible to all members, full URL, 2s feedback — Tasks 1 + 5
- ✅ `callbackUrl` validation (relative URLs only) — Task 2

**Placeholder scan:** None found.

**Type consistency:** `inviteCode: string` passed to `InviteCopyButton` in Task 1 and Task 5. `code: string` used in `joinViaInvite` (Task 3) and bound in Task 4 via `.bind(null, code)`. Consistent throughout.
