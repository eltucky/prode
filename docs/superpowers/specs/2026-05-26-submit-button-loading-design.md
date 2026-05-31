# SubmitButton Loading Feedback Design

**Date:** 2026-05-26
**Stack:** Next.js 16.2.6, React 19, Tailwind CSS v4

---

## Overview

Add loading feedback to all server-action forms that currently have none. When a user submits a form, the submit button immediately disables and shows a spinner so the app feels responsive even when the server takes time.

---

## Approach

Use React 19's `useFormStatus` (from `react-dom`) inside a shared `SubmitButton` client component. `useFormStatus` reads the pending state of the nearest parent `<form>` without requiring the page itself to become a client component. This is the idiomatic Next.js App Router pattern for this use case.

---

## Component: `SubmitButton`

**File:** `src/components/submit-button.tsx`

- `'use client'` directive
- Calls `useFormStatus()` — returns `{ pending: boolean }`
- When `pending`:
  - `disabled` attribute set
  - `opacity-60 cursor-not-allowed` classes added
  - Children replaced by a small animated SVG spinner (inline, no external dependency)
- When not pending: renders children normally
- Accepts all standard `<button>` HTML attributes + `className` (forwarded as-is)
- Always renders `type="submit"` — callers must not pass `type`

**Spinner:** A 12×12px SVG circle with `animate-spin` (Tailwind). Uses `currentColor` so it inherits the button's text color automatically.

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
            cx="12" cy="12" r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : children}
    </button>
  )
}
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/submit-button.tsx` | **New** — `SubmitButton` component |
| `src/app/(protected)/grupos/page.tsx` | Replace 2× `<button type="submit">` with `<SubmitButton>` |
| `src/app/(protected)/perfil/page.tsx` | Replace 1× `<button type="submit">` with `<SubmitButton>` |
| `src/app/(protected)/admin/partidos/page.tsx` | Replace 1× `<button type="submit">` (sync) with `<SubmitButton>` |
| `src/app/(protected)/admin/grupos/page.tsx` | Replace 3× `<button type="submit">` (Transferir, Sí eliminar, Sacar) with `<SubmitButton>` |
| `src/app/(protected)/admin/usuarios/page.tsx` | Replace 3× `<button type="submit">` per user with `<SubmitButton>` |
| `src/components/navbar.tsx` | Replace `<button type="submit">` (Salir) with `<SubmitButton>` |
| `src/components/bottom-nav.tsx` | Replace `<button type="submit">` (Salir) with `<SubmitButton>` |

---

## Out of Scope

- `PredictionForm` — already has `useTransition` + `isPending` with dirty-state and delete-confirm logic; leave untouched
- `AdminPredictionRow` — same reason
- `AdminMatchResultRow` — same reason
- Success/error toasts — not in scope for this iteration
- `admin/grupos` delete confirmation link (`<a href="?confirmar=...">`) — not a form submit, no change needed
