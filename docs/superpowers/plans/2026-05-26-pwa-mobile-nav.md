# PWA + Mobile Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the app to a PWA (installable, basic cache) and replace the cramped mobile navbar with a native-style bottom tab bar.

**Architecture:** `@serwist/next` wraps `next.config.ts` to compile a service worker at build time and register it client-side. A new `BottomNav` client component (fixed bottom, `md:hidden`) renders 4 tabs + a "Más" sheet for admin/logout. The existing top navbar keeps all links hidden on mobile with `hidden md:block`. The protected layout composes both.

**Tech Stack:** Next.js 16.2.6, React 19, @serwist/next, serwist, sharp (devDep, icon generation), Vitest + @testing-library/react, Tailwind CSS v4

> **⚠️ Turbopack note:** `next dev` uses Turbopack — the service worker is **only generated during `next build`**. PWA features must be tested with `npm run build && npm start`, not `npm run dev`.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/app/sw.ts` | Create | Service worker source — precache + runtime cache strategy |
| `src/app/actions.ts` | Create | `signOutAction` server action (wraps NextAuth `signOut`) |
| `src/components/bottom-nav.tsx` | Create | Mobile tab bar + "Más" sheet |
| `src/__tests__/bottom-nav.test.tsx` | Create | Component tests for BottomNav |
| `public/manifest.json` | Create | Web App Manifest |
| `public/icons/icon-192.png` | Create (generated) | PWA icon 192×192 |
| `public/icons/icon-512.png` | Create (generated) | PWA icon 512×512 |
| `scripts/generate-icons.mjs` | Create | One-time icon generator (Node + sharp) |
| `next.config.ts` | Modify | Wrap with `withSerwist()` |
| `src/app/layout.tsx` | Modify | Add `manifest` + `themeColor` to metadata |
| `src/components/navbar.tsx` | Modify | Hide nav links on mobile (`hidden md:block`) |
| `src/app/(protected)/layout.tsx` | Modify | Add `<BottomNav>`, add `pb-20 md:pb-8` to `<main>` |

---

## Task 1: Create branch and install dependencies

**Files:** `package.json`, `package-lock.json`

- [ ] **Step 1: Create branch**

```bash
git checkout -b feat/pwa-mobile-nav
```

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install @serwist/next serwist
```

- [ ] **Step 3: Install dev dependency for icon generation**

Check first if sharp is already available:
```bash
npm ls sharp
```

If not listed, install it:
```bash
npm install --save-dev sharp
```

- [ ] **Step 4: Verify installation**

```bash
npm ls @serwist/next serwist
```

Expected: both packages listed without errors.

---

## Task 2: Generate PWA icons

**Files:** `scripts/generate-icons.mjs`, `public/icons/icon-192.png`, `public/icons/icon-512.png`

- [ ] **Step 1: Create the icon generator script**

Create `scripts/generate-icons.mjs`:

```js
import sharp from 'sharp'
import { mkdirSync } from 'fs'

mkdirSync('public/icons', { recursive: true })

async function generate(size) {
  const r = Math.round(size * 0.2)
  const center = size / 2
  const ballR = Math.round(size * 0.33)
  const svg = Buffer.from(`<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${r}" fill="#2563eb"/>
  <circle cx="${center}" cy="${center}" r="${ballR}" fill="white"/>
  <circle cx="${center}" cy="${center}" r="${ballR}" fill="none" stroke="#1d4ed8" stroke-width="${Math.round(size * 0.02)}"/>
  <line x1="${center}" y1="${center - ballR}" x2="${center}" y2="${center + ballR}" stroke="#1d4ed8" stroke-width="${Math.round(size * 0.02)}"/>
  <line x1="${center - ballR}" y1="${center}" x2="${center + ballR}" y2="${center}" stroke="#1d4ed8" stroke-width="${Math.round(size * 0.02)}"/>
</svg>`)
  await sharp(svg).png().toFile(`public/icons/icon-${size}.png`)
  console.log(`✓ public/icons/icon-${size}.png`)
}

await generate(192)
await generate(512)
```

- [ ] **Step 2: Run the generator**

```bash
node scripts/generate-icons.mjs
```

Expected output:
```
✓ public/icons/icon-192.png
✓ public/icons/icon-512.png
```

- [ ] **Step 3: Verify the files exist**

```bash
ls -lh public/icons/
```

Expected: two PNG files, each a few KB.

- [ ] **Step 4: Commit**

```bash
git add public/icons/ scripts/generate-icons.mjs
git commit -m "feat: add PWA app icons"
```

---

## Task 3: Web App Manifest + layout metadata

**Files:** `public/manifest.json`, `src/app/layout.tsx`

- [ ] **Step 1: Create the manifest**

Create `public/manifest.json`:

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
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

- [ ] **Step 2: Update root layout metadata**

Current `src/app/layout.tsx`:
```ts
export const metadata: Metadata = {
  title: 'Prode Mundial 2026',
  description: 'Jugá al prode del Mundial FIFA 2026 con tus amigos',
}
```

Replace with:
```ts
export const metadata: Metadata = {
  title: 'Prode Mundial 2026',
  description: 'Jugá al prode del Mundial FIFA 2026 con tus amigos',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Prode 2026',
  },
}
```

Also add a `<meta name="theme-color">` tag to the `<head>`. In the `RootLayout` function, update the html element:

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add public/manifest.json src/app/layout.tsx
git commit -m "feat: add PWA manifest and metadata"
```

---

## Task 4: Service worker + @serwist/next config

**Files:** `src/app/sw.ts`, `next.config.ts`

- [ ] **Step 1: Create the service worker source**

Create `src/app/sw.ts`:

```ts
import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { NetworkOnly, Serwist } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // API routes must never be cached — data must always come from the server
    {
      matcher: ({ url }) => url.pathname.startsWith('/api/'),
      handler: new NetworkOnly(),
    },
    // All other requests use the default Next.js cache strategy
    ...defaultCache,
  ],
})

serwist.addEventListeners()
```

- [ ] **Step 2: Update next.config.ts**

Current content:
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { hostname: 'lh3.googleusercontent.com' },
    ],
  },
};

export default nextConfig;
```

Replace with:
```ts
import type { NextConfig } from "next"
import withSerwist from "@serwist/next"

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { hostname: 'lh3.googleusercontent.com' },
    ],
  },
}

export default withSerwist({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
})(nextConfig)
```

- [ ] **Step 3: Add sw.js to .gitignore**

The service worker is generated at build time and should not be committed:

```bash
echo "public/sw.js" >> .gitignore
echo "public/sw.js.map" >> .gitignore
```

- [ ] **Step 4: Verify build succeeds**

```bash
npm run build
```

Expected: build completes without errors. `public/sw.js` should be generated.

- [ ] **Step 5: Commit**

```bash
git add src/app/sw.ts next.config.ts .gitignore
git commit -m "feat: configure service worker with @serwist/next"
```

---

## Task 5: signOutAction server action

**Files:** `src/app/actions.ts`

- [ ] **Step 1: Create the server action file**

Create `src/app/actions.ts`:

```ts
'use server'

import { signOut } from '@/auth'

export async function signOutAction() {
  await signOut({ redirectTo: '/login' })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/actions.ts
git commit -m "feat: add signOutAction server action"
```

---

## Task 6: BottomNav component

**Files:** `src/components/bottom-nav.tsx`, `src/__tests__/bottom-nav.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/bottom-nav.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BottomNav from '@/components/bottom-nav'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/torneo'),
}))

vi.mock('@/app/actions', () => ({
  signOutAction: vi.fn(),
}))

describe('BottomNav', () => {
  it('renderiza los 4 tabs principales', () => {
    render(<BottomNav isSuperAdmin={false} />)
    expect(screen.getByText('Torneo')).toBeDefined()
    expect(screen.getByText('Grupos')).toBeDefined()
    expect(screen.getByText('Reglas')).toBeDefined()
    expect(screen.getByText('Perfil')).toBeDefined()
  })

  it('renderiza el botón Más', () => {
    render(<BottomNav isSuperAdmin={false} />)
    expect(screen.getByText('Más')).toBeDefined()
  })

  it('al hacer click en Más, muestra el sheet con Salir', () => {
    render(<BottomNav isSuperAdmin={false} />)
    fireEvent.click(screen.getByText('Más'))
    expect(screen.getByText('Salir')).toBeDefined()
  })

  it('no muestra Admin si isSuperAdmin es false', () => {
    render(<BottomNav isSuperAdmin={false} />)
    fireEvent.click(screen.getByText('Más'))
    expect(screen.queryByText('Admin')).toBeNull()
  })

  it('muestra Admin si isSuperAdmin es true', () => {
    render(<BottomNav isSuperAdmin={true} />)
    fireEvent.click(screen.getByText('Más'))
    expect(screen.getByText('Admin')).toBeDefined()
  })

  it('cierra el sheet al hacer click en el overlay', () => {
    render(<BottomNav isSuperAdmin={false} />)
    fireEvent.click(screen.getByText('Más'))
    expect(screen.getByText('Salir')).toBeDefined()
    const overlay = document.querySelector('[data-testid="more-overlay"]')!
    fireEvent.click(overlay)
    expect(screen.queryByText('Salir')).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test -- bottom-nav
```

Expected: fails with "Cannot find module '@/components/bottom-nav'"

- [ ] **Step 3: Implement the component**

Create `src/components/bottom-nav.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { signOutAction } from '@/app/actions'

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
          className="fixed inset-0 z-40"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {moreOpen && (
        <div className="fixed bottom-16 right-0 z-50 bg-white border border-gray-200 rounded-tl-xl shadow-lg min-w-40 md:hidden">
          {isSuperAdmin && (
            <Link
              href="/admin/partidos"
              className="flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-gray-50 border-b border-gray-100"
              onClick={() => setMoreOpen(false)}
            >
              Admin
            </Link>
          )}
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 w-full text-left"
            >
              Salir
            </button>
          </form>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
        <div className="flex justify-around items-center py-1 pb-2">
          {TABS.map((tab) => {
            const isActive = pathname.startsWith(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 min-w-14 text-xs ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <span className="text-xl leading-none">{tab.icon}</span>
                <span className={isActive ? 'font-semibold' : ''}>{tab.label}</span>
              </Link>
            )
          })}

          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 min-w-14 text-xs ${
              moreOpen ? 'text-blue-600' : 'text-gray-500'
            }`}
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

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- bottom-nav
```

Expected: all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/bottom-nav.tsx src/__tests__/bottom-nav.test.tsx
git commit -m "feat: add BottomNav mobile tab bar component"
```

---

## Task 7: Update Navbar for mobile

**Files:** `src/components/navbar.tsx`

- [ ] **Step 1: Update the authenticated nav links to be desktop-only**

Current `src/components/navbar.tsx` authenticated section (lines 15–55):
```tsx
{session?.user ? (
  <div className="flex items-center gap-4">
    <Link href="/torneo" className="text-sm text-gray-600 hover:text-gray-900">
      Torneo
    </Link>
    <Link href="/grupos" className="text-sm text-gray-600 hover:text-gray-900">
      Grupos
    </Link>
    <Link href="/reglas" className="text-sm text-gray-600 hover:text-gray-900">
      Reglas
    </Link>
    {session.user.isSuperAdmin && (
      <Link href="/admin/partidos" className="text-sm text-red-600 hover:text-red-800">
        Admin
      </Link>
    )}
    {session.user.image && (
      <Image ... />
    )}
    <Link href="/perfil" className="text-sm text-gray-600 hover:text-gray-900 hidden sm:block">
      {session.user.name}
    </Link>
    <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }) }}>
      <button type="submit" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
        Salir
      </button>
    </form>
  </div>
```

Replace the authenticated section with:
```tsx
{session?.user ? (
  <div className="flex items-center gap-2 md:gap-4">
    <Link href="/torneo" className="hidden md:block text-sm text-gray-600 hover:text-gray-900">
      Torneo
    </Link>
    <Link href="/grupos" className="hidden md:block text-sm text-gray-600 hover:text-gray-900">
      Grupos
    </Link>
    <Link href="/reglas" className="hidden md:block text-sm text-gray-600 hover:text-gray-900">
      Reglas
    </Link>
    {session.user.isSuperAdmin && (
      <Link href="/admin/partidos" className="hidden md:block text-sm text-red-600 hover:text-red-800">
        Admin
      </Link>
    )}
    {session.user.image && (
      <Image
        src={session.user.image}
        alt={session.user.name ?? ''}
        width={32}
        height={32}
        className="rounded-full"
      />
    )}
    <Link href="/perfil" className="hidden md:block text-sm text-gray-600 hover:text-gray-900">
      {session.user.name}
    </Link>
    <form
      action={async () => {
        'use server'
        await signOut({ redirectTo: '/login' })
      }}
    >
      <button
        type="submit"
        className="hidden md:block text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        Salir
      </button>
    </form>
  </div>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/navbar.tsx
git commit -m "feat: hide navbar links on mobile (moved to BottomNav)"
```

---

## Task 8: Update Protected Layout

**Files:** `src/app/(protected)/layout.tsx`

- [ ] **Step 1: Update the layout**

Current `src/app/(protected)/layout.tsx`:
```tsx
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Navbar from '@/components/navbar'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
```

Replace with:
```tsx
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 pb-20 md:pb-8">{children}</main>
      <BottomNav isSuperAdmin={session.user.isSuperAdmin ?? false} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(protected\)/layout.tsx
git commit -m "feat: add BottomNav to protected layout"
```

---

## Task 9: Run all tests and verify

- [ ] **Step 1: Run the full test suite**

```bash
npm test
```

Expected: all tests pass (including the new bottom-nav tests).

- [ ] **Step 2: Build the app**

```bash
npm run build
```

Expected: build succeeds. `public/sw.js` is generated.

- [ ] **Step 3: Start production server and verify PWA**

```bash
npm start
```

Open `http://localhost:3000` in Chrome. Open DevTools → Application tab → Manifest. Expected:
- Manifest is loaded with name "Prode Mundial 2026"
- Icons show correctly
- Service Worker is registered under "Service Workers"

- [ ] **Step 4: Verify mobile nav in browser**

Open DevTools → toggle mobile device toolbar (any phone size < 768px). Expected:
- Top navbar shows only logo + avatar (no text links)
- Bottom tab bar appears with Torneo, Grupos, Reglas, Perfil, Más
- Tapping a tab navigates correctly and highlights the active tab
- Tapping "Más" shows the sheet; tapping outside closes it

- [ ] **Step 5: Push the branch**

```bash
git push -u origin feat/pwa-mobile-nav
```
