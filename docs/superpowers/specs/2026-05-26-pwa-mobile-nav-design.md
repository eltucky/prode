# PWA + Mobile Navigation Design

**Date:** 2026-05-26
**Stack:** Next.js 16.2.6, React 19, NextAuth v5, Tailwind CSS

---

## Overview

Two improvements in one branch:

1. **PWA support** — the app becomes installable on mobile and caches static assets for faster loads.
2. **Mobile bottom navigation** — on small screens, a native-style bottom tab bar replaces the cramped horizontal links in the top navbar.

---

## PWA

### Library

Use `@serwist/next` — the only actively maintained option with full Next.js 15+/App Router support.

### Manifest

Add `public/manifest.json`:

```json
{
  "name": "Prode Mundial 2026",
  "short_name": "Prode 2026",
  "description": "Jugá al prode del Mundial FIFA 2026 con tus amigos",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

Link it from the root layout via Next.js metadata:

```ts
export const metadata: Metadata = {
  manifest: '/manifest.json',
}
```

### Icons

Generate two PNG icons using a Node script (`scripts/generate-icons.mjs`) that uses the `canvas` npm package to render an ⚽ emoji on a blue (`#2563eb`) background. Output: `public/icons/icon-192.png` and `public/icons/icon-512.png`. `canvas` is a dev-only dependency. Run the script once during setup and commit the generated PNG files.

### Service Worker

Create `src/app/sw.ts` as the service worker source. `@serwist/next` compiles it and registers it automatically.

Cache strategy:
- **Static assets** (JS, CSS, fonts, images under `/_next/static/`): *CacheFirst* — served from cache, updated in background on next visit.
- **HTML pages**: *NetworkFirst* — always tries the network; falls back to cache if offline.
- **API routes** (`/api/*`): **not cached** — data must always come from the server.

### next.config changes

Wrap the existing config with `withSerwist()`:

```ts
import withSerwist from '@serwist/next'

const withSerwistConfig = withSerwist({ swSrc: 'src/app/sw.ts', swDest: 'public/sw.js' })
export default withSerwistConfig(nextConfig)
```

---

## Mobile Bottom Navigation

### Breakpoint

- **≥ md (768px):** top navbar shows as today, bottom nav hidden.
- **< md:** top navbar shows only logo + avatar; bottom nav shows at the bottom.

### Component: `BottomNav`

New file: `src/components/bottom-nav.tsx`

- `'use client'` — needs `usePathname()` for active tab highlighting and local state for the "Más" sheet.
- Props: `isSuperAdmin: boolean`
- Tabs (always visible): Torneo → `/torneo`, Grupos → `/grupos`, Reglas → `/reglas`, Perfil → `/perfil`
- 5th tab: **Más** — opens a small sheet above the bar with:
  - Admin → `/admin/partidos` (only rendered if `isSuperAdmin === true`)
  - Salir (a `<form>` whose `action` prop is a server action defined in `src/app/actions.ts` — `'use client'` components can't call `signOut` directly, so it's wrapped in a `'use server'` function there and passed via the form's action)
- Active tab: highlighted in blue (`text-blue-600`) when `pathname.startsWith(tab.href)`.
- The "Más" sheet closes when the user taps outside (click-away overlay).

### Changes to `Navbar`

The nav links are hidden on mobile since they move to the bottom bar:

```tsx
// Links container: show on desktop only
<div className="hidden md:flex items-center gap-4">
  {/* all existing links */}
</div>
```

The logo and avatar remain visible on all screen sizes (no change needed there).

### Changes to Protected Layout

```tsx
<div className="min-h-screen bg-gray-50">
  <Navbar />
  <main className="max-w-5xl mx-auto px-4 py-8 pb-20 md:pb-8">
    {children}
  </main>
  <BottomNav isSuperAdmin={session.user.isSuperAdmin ?? false} />
</div>
```

`pb-20 md:pb-8` ensures page content is never hidden behind the 64px bottom bar on mobile.

---

## File Changelist

| File | Action |
|------|--------|
| `package.json` | add `@serwist/next`; add `canvas` as devDependency |
| `next.config.ts` | wrap with `withSerwist()` |
| `src/app/sw.ts` | new — service worker source |
| `src/app/layout.tsx` | add `manifest` to metadata, add `<meta name="theme-color">` |
| `public/manifest.json` | new |
| `public/icons/icon-192.png` | new (generated) |
| `public/icons/icon-512.png` | new (generated) |
| `scripts/generate-icons.mjs` | new — one-time icon generator |
| `src/app/actions.ts` | new — `signOutAction` server action (wraps NextAuth `signOut`) |
| `src/components/bottom-nav.tsx` | new — mobile tab bar |
| `src/components/navbar.tsx` | hide nav links on mobile |
| `src/app/(protected)/layout.tsx` | add BottomNav, add bottom padding |

---

## Out of Scope

- Push notifications
- Background sync
- Offline-first data (API responses are never cached)
- Changes to the public (unauthenticated) pages — the bottom nav only renders inside the protected layout
