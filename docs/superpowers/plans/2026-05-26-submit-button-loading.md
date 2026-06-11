# SubmitButton Loading Feedback — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared `SubmitButton` component that shows a spinner while pending and replace every plain `<button type="submit">` in the app that currently has no loading feedback.

**Architecture:** A single `'use client'` component using React 19's `useFormStatus` reads the pending state of the nearest parent `<form>` — no changes needed to the server-component pages. All existing pages stay as server components; only the button itself becomes a client component.

**Tech Stack:** Next.js 16.2.6 App Router, React 19, `react-dom` (`useFormStatus`), Tailwind CSS v4, Vitest + @testing-library/react

---

## File Map

| File | Action |
|------|--------|
| `src/components/submit-button.tsx` | **Create** — `SubmitButton` client component |
| `src/__tests__/submit-button.test.tsx` | **Create** — unit tests |
| `src/app/(protected)/grupos/page.tsx` | Modify — replace 2× `<button type="submit">` |
| `src/app/(protected)/perfil/page.tsx` | Modify — replace 1× `<button type="submit">` |
| `src/app/(protected)/admin/partidos/page.tsx` | Modify — replace 1× `<button type="submit">` |
| `src/app/(protected)/admin/grupos/page.tsx` | Modify — replace 3× `<button type="submit">` |
| `src/app/(protected)/admin/usuarios/page.tsx` | Modify — replace 3× `<button type="submit">` (per user row) |
| `src/components/navbar.tsx` | Modify — replace 1× `<button type="submit">` (Salir) |
| `src/components/bottom-nav.tsx` | Modify — replace 1× `<button type="submit">` (Salir) |

---

## Task 1: Create branch

- [ ] **Step 1: Create the feature branch**

```bash
git checkout -b feat/submit-button-loading
```

- [ ] **Step 2: Verify clean state**

```bash
git status
```
Expected: `nothing to commit, working tree clean`

---

## Task 2: Create `SubmitButton` component with tests

**Files:**
- Create: `src/components/submit-button.tsx`
- Create: `src/__tests__/submit-button.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/submit-button.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SubmitButton } from '@/components/submit-button'

// useFormStatus mock — controlled per test
vi.mock('react-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dom')>()
  return { ...actual, useFormStatus: vi.fn() }
})

import { useFormStatus } from 'react-dom'

describe('SubmitButton', () => {
  it('renders children when not pending', () => {
    vi.mocked(useFormStatus).mockReturnValue({ pending: false, data: null, method: null, action: null })
    render(<SubmitButton>Guardar</SubmitButton>)
    expect(screen.getByRole('button')).toHaveTextContent('Guardar')
  })

  it('shows spinner and hides children when pending', () => {
    vi.mocked(useFormStatus).mockReturnValue({ pending: true, data: null, method: null, action: null })
    render(<SubmitButton>Guardar</SubmitButton>)
    expect(screen.queryByText('Guardar')).toBeNull()
    expect(document.querySelector('svg')).toBeTruthy()
  })

  it('disables button when pending', () => {
    vi.mocked(useFormStatus).mockReturnValue({ pending: true, data: null, method: null, action: null })
    render(<SubmitButton>Guardar</SubmitButton>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('disables button when props.disabled is true, regardless of pending', () => {
    vi.mocked(useFormStatus).mockReturnValue({ pending: false, data: null, method: null, action: null })
    render(<SubmitButton disabled>Guardar</SubmitButton>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('always renders type="submit"', () => {
    vi.mocked(useFormStatus).mockReturnValue({ pending: false, data: null, method: null, action: null })
    render(<SubmitButton>Guardar</SubmitButton>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('forwards className to button element', () => {
    vi.mocked(useFormStatus).mockReturnValue({ pending: false, data: null, method: null, action: null })
    render(<SubmitButton className="bg-gray-900 text-white">Guardar</SubmitButton>)
    expect(screen.getByRole('button').className).toContain('bg-gray-900')
    expect(screen.getByRole('button').className).toContain('text-white')
  })

  it('adds opacity-60 and cursor-not-allowed classes when pending', () => {
    vi.mocked(useFormStatus).mockReturnValue({ pending: true, data: null, method: null, action: null })
    render(<SubmitButton className="bg-gray-900">Guardar</SubmitButton>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('opacity-60')
    expect(btn.className).toContain('cursor-not-allowed')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/__tests__/submit-button.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/submit-button'`

- [ ] **Step 3: Create the component**

Create `src/components/submit-button.tsx`:

```tsx
'use client'

import { useFormStatus } from 'react-dom'

export function SubmitButton({
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus()

  return (
    <button
      {...props}
      type="submit"
      disabled={pending || props.disabled}
      className={`${className} ${pending ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      {pending ? (
        <svg
          className="animate-spin h-3 w-3 mx-auto"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : (
        children
      )}
    </button>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/__tests__/submit-button.test.tsx
```

Expected: 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/submit-button.tsx src/__tests__/submit-button.test.tsx
git commit -m "feat: add SubmitButton component with useFormStatus loading spinner"
```

---

## Task 3: Apply to `grupos/page.tsx`

**Files:**
- Modify: `src/app/(protected)/grupos/page.tsx`

There are 2 submit buttons: "Crear" (createGroup form) and "Unirse" (joinGroup form).

- [ ] **Step 1: Replace buttons**

In `src/app/(protected)/grupos/page.tsx`:

1. Add import at the top (after existing imports):
```tsx
import { SubmitButton } from '@/components/submit-button'
```

2. Replace the "Crear" button (line 66–70):
```tsx
// Before:
<button
  type="submit"
  className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 shrink-0"
>
  Crear
</button>

// After:
<SubmitButton className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 shrink-0">
  Crear
</SubmitButton>
```

3. Replace the "Unirse" button (line 85–89):
```tsx
// Before:
<button
  type="submit"
  className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 shrink-0"
>
  Unirse
</button>

// After:
<SubmitButton className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 shrink-0">
  Unirse
</SubmitButton>
```

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass

- [ ] **Step 3: Commit**

```bash
git add src/app/\(protected\)/grupos/page.tsx
git commit -m "feat: use SubmitButton in grupos page"
```

---

## Task 4: Apply to `perfil/page.tsx`

**Files:**
- Modify: `src/app/(protected)/perfil/page.tsx`

One submit button: "Guardar" (updateEmailNotifications form).

- [ ] **Step 1: Replace button**

In `src/app/(protected)/perfil/page.tsx`:

1. Add import after existing imports:
```tsx
import { SubmitButton } from '@/components/submit-button'
```

2. Replace the "Guardar" button (line 42–46):
```tsx
// Before:
<button
  type="submit"
  className="w-full bg-gray-900 text-white rounded-lg py-2 text-sm hover:bg-gray-700"
>
  Guardar
</button>

// After:
<SubmitButton className="w-full bg-gray-900 text-white rounded-lg py-2 text-sm hover:bg-gray-700">
  Guardar
</SubmitButton>
```

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass

- [ ] **Step 3: Commit**

```bash
git add src/app/\(protected\)/perfil/page.tsx
git commit -m "feat: use SubmitButton in perfil page"
```

---

## Task 5: Apply to `admin/partidos/page.tsx`

**Files:**
- Modify: `src/app/(protected)/admin/partidos/page.tsx`

One submit button: "🔄 Sincronizar resultados" (triggerSyncAction form).

- [ ] **Step 1: Replace button**

In `src/app/(protected)/admin/partidos/page.tsx`:

1. Add import after existing imports:
```tsx
import { SubmitButton } from '@/components/submit-button'
```

2. Replace the sync button (line 33):
```tsx
// Before:
<button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
  🔄 Sincronizar resultados
</button>

// After:
<SubmitButton className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
  🔄 Sincronizar resultados
</SubmitButton>
```

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass

- [ ] **Step 3: Commit**

```bash
git add src/app/\(protected\)/admin/partidos/page.tsx
git commit -m "feat: use SubmitButton in admin partidos page"
```

---

## Task 6: Apply to `admin/grupos/page.tsx`

**Files:**
- Modify: `src/app/(protected)/admin/grupos/page.tsx`

Three submit buttons: "Transferir" (transferOwnership form), "Sí, eliminar" (deleteGroup form), "Sacar" (removeUserFromGroup form).

- [ ] **Step 1: Replace buttons**

In `src/app/(protected)/admin/grupos/page.tsx`:

1. Add import after existing imports:
```tsx
import { SubmitButton } from '@/components/submit-button'
```

2. Replace "Transferir" button (line 50):
```tsx
// Before:
<button type="submit" className="text-xs bg-gray-700 text-white px-2 py-1 rounded hover:bg-gray-900">
  Transferir
</button>

// After:
<SubmitButton className="text-xs bg-gray-700 text-white px-2 py-1 rounded hover:bg-gray-900">
  Transferir
</SubmitButton>
```

3. Replace "Sí, eliminar" button (line 59):
```tsx
// Before:
<button type="submit" className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700">
  Sí, eliminar
</button>

// After:
<SubmitButton className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700">
  Sí, eliminar
</SubmitButton>
```

4. Replace "Sacar" button (line 87):
```tsx
// Before:
<button type="submit" className="text-xs text-red-500 hover:text-red-700">
  Sacar
</button>

// After:
<SubmitButton className="text-xs text-red-500 hover:text-red-700">
  Sacar
</SubmitButton>
```

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass

- [ ] **Step 3: Commit**

```bash
git add src/app/\(protected\)/admin/grupos/page.tsx
git commit -m "feat: use SubmitButton in admin grupos page"
```

---

## Task 7: Apply to `admin/usuarios/page.tsx`

**Files:**
- Modify: `src/app/(protected)/admin/usuarios/page.tsx`

Three submit buttons per user row (but rendered conditionally): "Desbloquear" or "Bloquear" (one of each depending on `user.isBlocked`), and "Quitar admin" / "Hacer admin" (toggleSuperAdmin form).

- [ ] **Step 1: Replace buttons**

In `src/app/(protected)/admin/usuarios/page.tsx`:

1. Add import after existing imports:
```tsx
import { SubmitButton } from '@/components/submit-button'
```

2. Replace "Desbloquear" button (inside the `user.isBlocked ? (...)` branch, line 72):
```tsx
// Before:
<button type="submit" className="text-xs text-green-600 hover:text-green-800">
  Desbloquear
</button>

// After:
<SubmitButton className="text-xs text-green-600 hover:text-green-800">
  Desbloquear
</SubmitButton>
```

3. Replace "Bloquear" button (else branch, line 79):
```tsx
// Before:
<button type="submit" className="text-xs text-red-500 hover:text-red-700">
  Bloquear
</button>

// After:
<SubmitButton className="text-xs text-red-500 hover:text-red-700">
  Bloquear
</SubmitButton>
```

4. Replace "Quitar admin" / "Hacer admin" button (line 87):
```tsx
// Before:
<button type="submit" className="text-xs text-blue-500 hover:text-blue-700">
  {user.isSuperAdmin ? 'Quitar admin' : 'Hacer admin'}
</button>

// After:
<SubmitButton className="text-xs text-blue-500 hover:text-blue-700">
  {user.isSuperAdmin ? 'Quitar admin' : 'Hacer admin'}
</SubmitButton>
```

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass

- [ ] **Step 3: Commit**

```bash
git add src/app/\(protected\)/admin/usuarios/page.tsx
git commit -m "feat: use SubmitButton in admin usuarios page"
```

---

## Task 8: Apply to `navbar.tsx` and `bottom-nav.tsx`

**Files:**
- Modify: `src/components/navbar.tsx`
- Modify: `src/components/bottom-nav.tsx`

`navbar.tsx` is a server component — `SubmitButton` can be imported and used directly because it's a client component being used inside JSX.

`bottom-nav.tsx` is already `'use client'` — `SubmitButton` can be imported directly.

- [ ] **Step 1: Update `navbar.tsx`**

In `src/components/navbar.tsx`:

1. Add import after existing imports:
```tsx
import { SubmitButton } from '@/components/submit-button'
```

2. Replace the Salir button (line 49–53):
```tsx
// Before:
<button
  type="submit"
  className="hidden md:block text-sm text-gray-500 hover:text-gray-900 transition-colors"
>
  Salir
</button>

// After:
<SubmitButton className="hidden md:block text-sm text-gray-500 hover:text-gray-900 transition-colors">
  Salir
</SubmitButton>
```

- [ ] **Step 2: Update `bottom-nav.tsx`**

In `src/components/bottom-nav.tsx`:

1. Add import after existing imports:
```tsx
import { SubmitButton } from '@/components/submit-button'
```

2. Replace the Salir button (line 41–44):
```tsx
// Before:
<button
  type="submit"
  className="flex items-center gap-2 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 w-full text-left"
>
  Salir
</button>

// After:
<SubmitButton className="flex items-center gap-2 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 w-full text-left">
  Salir
</SubmitButton>
```

- [ ] **Step 3: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
git add src/components/navbar.tsx src/components/bottom-nav.tsx
git commit -m "feat: use SubmitButton in navbar and bottom-nav"
```

---

## Task 9: Push and finish

- [ ] **Step 1: Run full test suite one last time**

```bash
npx vitest run
```

Expected: all tests pass (≥ 65 total — 58 previous + 7 new)

- [ ] **Step 2: Push branch**

```bash
git push -u origin feat/submit-button-loading
```
