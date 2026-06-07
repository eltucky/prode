# Skeleton Screens — Design Spec

**Date:** 2026-06-07
**Status:** Approved

## Goal

Replace the current zero-feedback page transitions with skeleton screens that appear immediately on navigation, while the server component fetches data. The feedback must be instant and visually coherent with the app's design system.

## Mechanism

Next.js App Router's `loading.tsx` convention. Each `loading.tsx` placed next to its `page.tsx` is automatically rendered as a React Suspense fallback while the page's async server component resolves. The Navbar and BottomNav remain visible throughout — only the `<main>` content area is replaced by the skeleton.

No changes needed to routing, layouts, or existing pages.

## Shared Infrastructure

### `globals.css` — shimmer keyframe

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

Uses existing CSS variables so it automatically respects dark/light mode.

### `src/components/skeleton.tsx`

```tsx
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`shimmer rounded-md ${className}`} />
}
```

All `loading.tsx` files import only this component. No other dependencies.

## Per-Page Skeletons

Each file is a default export, no `'use client'` needed — pure JSX with no interactivity.

### `/torneo` — `src/app/(shell)/torneo/loading.tsx`

Mirrors: group filter pills row + stage label + 4 match cards.

- Pills row: 6 × `rounded-full h-7 w-12`
- Section label: `h-4 w-32`
- 4 match cards (`rounded-xl p-4`), each:
  - Mobile layout (visible on `md:hidden`): two columns with a circle (flag) + arrow stubs, two score squares in the center
  - Desktop layout (`hidden md:flex`): flag + team name bars on each side, two score input boxes in the center

### `/grupos` — `src/app/(protected)/grupos/loading.tsx`

Mirrors: title + grid of group cards + two action cards.

- Title bar: `h-6 w-40` + subtitle `h-4 w-56`
- Grid `grid gap-3 sm:grid-cols-2 lg:grid-cols-3`: 3 × card `rounded-xl h-20`
- Two side-by-side action cards (`grid gap-4 sm:grid-cols-2`), each: title bar + input bar + button bar

### `/grupos/[id]` — `src/app/(protected)/grupos/[id]/loading.tsx`

Mirrors: header area + invite code box + leaderboard table + members list.

- Back link stub + title `h-6 w-48` + subtitle `h-4 w-32`
- Invite code box: `rounded-xl h-16`
- Leaderboard card `rounded-xl overflow-hidden`:
  - Header row
  - 4 data rows: position number + avatar circle `w-7 h-7 rounded-full` + name bar `h-4 w-32` + score bar `h-4 w-10`
- Members section: 3 rows with avatar circle + name bar + role pill

### `/perfil` — `src/app/(protected)/perfil/loading.tsx`

Mirrors: `max-w-lg` container with user card + settings card.

- User card `rounded-2xl p-5`: avatar circle `w-12 h-12 rounded-full` + name bar `h-4 w-32` + email bar `h-3 w-48`
- Settings card `rounded-2xl p-5`: title bar + 2 × setting row (label bars + toggle stub) + button `h-10 w-full rounded-xl`

### `/reglas` — `src/app/(shell)/reglas/loading.tsx`

Mirrors: title + prose content.

- Title: `h-6 w-48`
- 5 × paragraph block: 3 bars of varying width (`w-full`, `w-5/6`, `w-3/4`) with `gap-2` between lines, `mt-4` between paragraphs

### `/admin` — `src/app/(protected)/admin/loading.tsx`

Mirrors: title + 5 stat cards grid.

- Title: `h-7 w-32`
- Grid `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4`: 5 × card `rounded-xl p-4` with label bar `h-3 w-16` + value bar `h-7 w-20 mt-1`

### Admin table pages (partidos / usuarios / grupos / pronosticos)

All four share the same table skeleton shape. Each gets its own `loading.tsx` that renders:

- Title bar `h-7 w-48` + optional action button stub
- Table card `rounded-xl overflow-hidden`:
  - Header row: 4–5 column header bars
  - 6 × data row: cells with bars of varying width, first cell with avatar circle where applicable

Files:
- `src/app/(protected)/admin/partidos/loading.tsx`
- `src/app/(protected)/admin/usuarios/loading.tsx`
- `src/app/(protected)/admin/grupos/loading.tsx`
- `src/app/(protected)/admin/pronosticos/loading.tsx`

## File List

| File | New |
|------|-----|
| `src/components/skeleton.tsx` | ✅ |
| `globals.css` (shimmer keyframe) | ✅ |
| `src/app/(shell)/torneo/loading.tsx` | ✅ |
| `src/app/(shell)/reglas/loading.tsx` | ✅ |
| `src/app/(protected)/grupos/loading.tsx` | ✅ |
| `src/app/(protected)/grupos/[id]/loading.tsx` | ✅ |
| `src/app/(protected)/perfil/loading.tsx` | ✅ |
| `src/app/(protected)/admin/loading.tsx` | ✅ |
| `src/app/(protected)/admin/partidos/loading.tsx` | ✅ |
| `src/app/(protected)/admin/usuarios/loading.tsx` | ✅ |
| `src/app/(protected)/admin/grupos/loading.tsx` | ✅ |
| `src/app/(protected)/admin/pronosticos/loading.tsx` | ✅ |

## Out of Scope

- Login page (`/login`) — no async data, renders instantly
- Root page (`/`) — redirect, no content
- Skeleton for the Navbar or BottomNav themselves
- Animated transitions between skeleton and real content (CSS fade-in)
