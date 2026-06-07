# Skeleton Screens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add shimmer skeleton screens to all app pages so navigation gives immediate visual feedback while server components fetch data.

**Architecture:** Next.js App Router's `loading.tsx` convention — each file placed next to its `page.tsx` is automatically shown as a Suspense fallback. A shared `Skeleton` component renders a `div` with the `.shimmer` CSS class. No changes to existing pages or layouts.

**Tech Stack:** Next.js App Router `loading.tsx`, Tailwind CSS, CSS custom properties (existing `--surface-raised`, `--border` vars)

---

## Task 1: Shared infrastructure — shimmer CSS + Skeleton component

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/components/skeleton.tsx`

- [ ] **Step 1: Add shimmer keyframe and class to globals.css**

Append to `src/app/globals.css`:

```css
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}

.shimmer {
  background: linear-gradient(
    90deg,
    var(--surface-raised) 25%,
    var(--border)         50%,
    var(--surface-raised) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite linear;
}
```

- [ ] **Step 2: Create Skeleton component**

Create `src/components/skeleton.tsx`:

```tsx
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`shimmer rounded-md ${className}`} />
}
```

- [ ] **Step 3: Verify shimmer works**

Run `npm run dev`, open any page and temporarily add `<Skeleton className="h-8 w-40" />` to any component. Confirm the shimmer gradient animates left-to-right. Remove after verifying.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/components/skeleton.tsx
git commit -m "feat: add shimmer CSS and Skeleton component"
```

---

## Task 2: /torneo loading

**Files:**
- Create: `src/app/(shell)/torneo/loading.tsx`

The torneo page renders: group filter pills → section heading → match cards. The match card has two layouts (mobile: arrows + emoji flag + score numbers; desktop: emoji flag + team name + score input boxes).

- [ ] **Step 1: Create the file**

Create `src/app/(shell)/torneo/loading.tsx`:

```tsx
import { Skeleton } from '@/components/skeleton'

export default function TorneoLoading() {
  return (
    <div className="space-y-6">
      {/* Group filter pills */}
      <div className="flex gap-2 flex-wrap items-center pb-2">
        <Skeleton className="h-4 w-10" />
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-10 rounded-full" />
        ))}
      </div>

      {/* Section heading */}
      <Skeleton className="h-4 w-36" />

      {/* Match cards */}
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <MatchCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

function MatchCardSkeleton() {
  return (
    <div
      className="rounded-xl px-4 py-3 space-y-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {/* Header: team names + status badge */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>

      {/* Mobile: arrows + emoji + scores */}
      <div className="flex items-center justify-between md:hidden py-1">
        <div className="flex flex-col items-center gap-1">
          <Skeleton className="w-7 h-5" />
          <Skeleton className="w-9 h-9 rounded-full" />
          <Skeleton className="w-7 h-5" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-10" />
          <Skeleton className="w-3 h-3 rounded-full" />
          <Skeleton className="w-8 h-10" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <Skeleton className="w-7 h-5" />
          <Skeleton className="w-9 h-9 rounded-full" />
          <Skeleton className="w-7 h-5" />
        </div>
      </div>

      {/* Desktop: emoji + name + score inputs */}
      <div className="hidden md:flex items-center">
        <div className="flex-1 flex flex-col items-center gap-2">
          <Skeleton className="w-9 h-9 rounded-full" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Skeleton className="w-14 h-12 rounded-lg" />
          <Skeleton className="w-3 h-3 rounded-full" />
          <Skeleton className="w-14 h-12 rounded-lg" />
        </div>
        <div className="flex-1 flex flex-col items-center gap-2">
          <Skeleton className="w-9 h-9 rounded-full" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify**

Run `npm run dev`, navigate to `/torneo`. Confirm the skeleton appears instantly before the match list loads. Check both mobile (DevTools responsive mode) and desktop layouts match the real card proportions.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(shell\)/torneo/loading.tsx
git commit -m "feat: add skeleton screen for /torneo"
```

---

## Task 3: /grupos loading

**Files:**
- Create: `src/app/(protected)/grupos/loading.tsx`

The grupos page renders: title + subtitle → grid of group cards (lg:3-col) → two action cards (crear / unirse).

- [ ] **Step 1: Create the file**

Create `src/app/(protected)/grupos/loading.tsx`:

```tsx
import { Skeleton } from '@/components/skeleton'

export default function GruposLoading() {
  return (
    <div className="space-y-6">
      {/* Title + subtitle */}
      <div className="space-y-1">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Group cards grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl px-5 py-4 space-y-2"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Action cards: crear + unirse */}
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-5 space-y-3"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <Skeleton className="h-4 w-28" />
            <div className="flex gap-2">
              <Skeleton className="h-9 flex-1 rounded-lg" />
              <Skeleton className="h-9 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify**

Navigate to `/grupos`. Confirm skeleton matches the real page layout (3-col grid on desktop, stacked on mobile).

- [ ] **Step 3: Commit**

```bash
git add src/app/\(protected\)/grupos/loading.tsx
git commit -m "feat: add skeleton screen for /grupos"
```

---

## Task 4: /grupos/[id] loading

**Files:**
- Create: `src/app/(protected)/grupos/[id]/loading.tsx`

The page renders: header (back link + title + invite code box) → standings table → members list.

- [ ] **Step 1: Create the file**

Create `src/app/(protected)/grupos/[id]/loading.tsx`:

```tsx
import { Skeleton } from '@/components/skeleton'

export default function GrupoLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-40 mt-1" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div
          className="rounded-xl px-4 py-3 space-y-1"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      {/* Standings table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-2">
              <Skeleton className="h-4 w-4" />
              <div className="flex items-center gap-2 flex-1">
                <Skeleton className="w-6 h-6 rounded-full shrink-0" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-8 hidden sm:block" />
            </div>
          ))}
        </div>
      </div>

      {/* Members list */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3"
            style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}
          >
            <Skeleton className="w-9 h-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify**

Navigate to any `/grupos/[id]`. Confirm header, table, and members list skeleton proportions match.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(protected)/grupos/[id]/loading.tsx"
git commit -m "feat: add skeleton screen for /grupos/[id]"
```

---

## Task 5: /perfil loading

**Files:**
- Create: `src/app/(protected)/perfil/loading.tsx`

The page renders inside `max-w-lg mx-auto`: title → user card (avatar + name + email) → notifications card (title + toggle row + button).

- [ ] **Step 1: Create the file**

Create `src/app/(protected)/perfil/loading.tsx`:

```tsx
import { Skeleton } from '@/components/skeleton'

export default function PerfilLoading() {
  return (
    <div className="max-w-lg mx-auto space-y-4">
      <Skeleton className="h-6 w-24" />

      {/* User card */}
      <div
        className="rounded-2xl p-5 flex items-center gap-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <Skeleton className="w-12 h-12 rounded-full shrink-0" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-44" />
        </div>
      </div>

      {/* Notifications card */}
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <Skeleton className="h-4 w-36" />
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
          <Skeleton className="w-5 h-5 rounded shrink-0 mt-1" />
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify**

Navigate to `/perfil`. Check avatar circle, name/email bars, and notification toggle proportions.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(protected\)/perfil/loading.tsx
git commit -m "feat: add skeleton screen for /perfil"
```

---

## Task 6: /reglas loading

**Files:**
- Create: `src/app/(shell)/reglas/loading.tsx`

The page renders inside `max-w-2xl mx-auto`: title + subtitle → 3 × section card (each with title + 4 score rows) → summary table section.

- [ ] **Step 1: Create the file**

Create `src/app/(shell)/reglas/loading.tsx`:

```tsx
import { Skeleton } from '@/components/skeleton'

export default function ReglasLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-6 w-52" />
        <Skeleton className="h-4 w-64" />
      </div>

      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl p-5 space-y-3"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <Skeleton className="h-5 w-40" />
          {Array.from({ length: 4 }).map((_, j) => (
            <div
              key={j}
              className="flex gap-4 items-start rounded-lg p-3"
              style={{ background: 'var(--surface-raised)' }}
            >
              <Skeleton className="w-8 h-8 shrink-0 rounded" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Verify**

Navigate to `/reglas`. Confirm 3 section cards with 4 score rows each appear.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(shell\)/reglas/loading.tsx
git commit -m "feat: add skeleton screen for /reglas"
```

---

## Task 7: /admin dashboard loading

**Files:**
- Create: `src/app/(protected)/admin/loading.tsx`

The page renders: title → grid of 5 stat cards (label + large number + optional sub-label).

- [ ] **Step 1: Create the file**

Create `src/app/(protected)/admin/loading.tsx`:

```tsx
import { Skeleton } from '@/components/skeleton'

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-20" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white border rounded-xl px-4 py-4 space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-3 w-14" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify**

Navigate to `/admin`. Confirm 5 stat cards in a grid skeleton.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(protected\)/admin/loading.tsx
git commit -m "feat: add skeleton screen for /admin dashboard"
```

---

## Task 8: /admin/partidos and /admin/usuarios loading

**Files:**
- Create: `src/app/(protected)/admin/partidos/loading.tsx`
- Create: `src/app/(protected)/admin/usuarios/loading.tsx`

Both pages are table-based. Partidos has 6 columns and an action button in the header; usuarios has 4 columns and an avatar in the first cell.

- [ ] **Step 1: Create admin/partidos/loading.tsx**

```tsx
import { Skeleton } from '@/components/skeleton'

export default function AdminPartidosLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {Array.from({ length: 6 }).map((_, i) => (
                <th key={i} className="px-4 py-3 text-left">
                  <Skeleton className="h-3 w-14" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-2"><Skeleton className="h-4 w-6" /></td>
                <td className="px-4 py-2">
                  <Skeleton className="h-3 w-20 mb-1" />
                  <Skeleton className="h-4 w-36" />
                </td>
                <td className="px-4 py-2"><Skeleton className="h-4 w-24" /></td>
                <td className="px-4 py-2"><Skeleton className="h-4 w-12" /></td>
                <td className="px-4 py-2"><Skeleton className="h-5 w-16 rounded-full" /></td>
                <td className="px-4 py-2"><Skeleton className="h-7 w-20 rounded" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create admin/usuarios/loading.tsx**

```tsx
import { Skeleton } from '@/components/skeleton'

export default function AdminUsuariosLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-28" />
      <Skeleton className="h-4 w-44" />
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {Array.from({ length: 4 }).map((_, i) => (
                <th key={i} className="px-4 py-3 text-left">
                  <Skeleton className="h-3 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <Skeleton className="h-4 w-6" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-5 w-14 rounded-full" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16 rounded" />
                    <Skeleton className="h-6 w-16 rounded" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify**

Navigate to `/admin/partidos` and `/admin/usuarios`. Confirm table header + 6 data rows with correct column shapes.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(protected\)/admin/partidos/loading.tsx src/app/\(protected\)/admin/usuarios/loading.tsx
git commit -m "feat: add skeleton screens for /admin/partidos and /admin/usuarios"
```

---

## Task 9: /admin/grupos and /admin/pronosticos loading

**Files:**
- Create: `src/app/(protected)/admin/grupos/loading.tsx`
- Create: `src/app/(protected)/admin/pronosticos/loading.tsx`

Admin/grupos renders cards (not a table) — each group card has a header with name + action buttons, and a list of member rows. Admin/pronosticos renders a select + table.

- [ ] **Step 1: Create admin/grupos/loading.tsx**

```tsx
import { Skeleton } from '@/components/skeleton'

export default function AdminGruposLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-24" />
      <Skeleton className="h-4 w-40" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded" />
              <Skeleton className="h-6 w-16 rounded" />
            </div>
          </div>
          <div>
            {Array.from({ length: 3 }).map((_, j) => (
              <div
                key={j}
                className="flex items-center justify-between px-4 py-2"
                style={{ borderTop: j > 0 ? '1px solid #f3f4f6' : 'none' }}
              >
                <div className="flex items-center gap-2">
                  <Skeleton className="w-6 h-6 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-5 w-14 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create admin/pronosticos/loading.tsx**

```tsx
import { Skeleton } from '@/components/skeleton'

export default function AdminPronosticosLoading() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-7 w-36" />
      <div className="bg-white border rounded-xl p-4 space-y-3">
        <Skeleton className="h-4 w-44" />
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1 max-w-lg rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify**

Navigate to `/admin/grupos` and `/admin/pronosticos`. Confirm card structure and select+button skeleton match real pages.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(protected\)/admin/grupos/loading.tsx src/app/\(protected\)/admin/pronosticos/loading.tsx
git commit -m "feat: add skeleton screens for /admin/grupos and /admin/pronosticos"
```

---

## Self-Review Checklist

- [x] Spec coverage: all 10 loading.tsx files + shared infrastructure covered
- [x] No placeholders: every step has complete code
- [x] Skeleton component import path consistent: `@/components/skeleton` throughout
- [x] CSS variables used: `--surface`, `--surface-raised`, `--border` match existing globals.css
- [x] Admin pages use `bg-white/border/bg-gray-50` to match existing admin page styles (admin pages use raw Tailwind colors, not CSS vars)
- [x] Mobile/desktop responsive classes in MatchCardSkeleton match real match card breakpoints (`md:hidden`, `hidden md:flex`)
