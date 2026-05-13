# Prode Mundial 2026 — Plan Fase 1: Fundación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Desplegar en Vercel una app Next.js con autenticación Google funcional, el esquema completo de la base de datos, rutas protegidas y un dashboard vacío — la base sobre la que se construyen todas las demás fases.

**Architecture:** Next.js 15 App Router con Server Components y Server Actions. Auth.js v5 (next-auth@beta) maneja el OAuth con Google y las sesiones via Prisma Adapter. Los datos viven en PostgreSQL (Neon). Las rutas protegidas se controlan con middleware.

**Tech Stack:** Next.js 15, TypeScript, Auth.js v5, Prisma 5, Neon PostgreSQL, Tailwind CSS, shadcn/ui, Vitest

---

## Mapa de archivos

```
src/
├── app/
│   ├── layout.tsx                      — root layout (providers, metadata)
│   ├── page.tsx                        — redirect a /dashboard o /login según sesión
│   ├── login/
│   │   └── page.tsx                    — pantalla de login con Google
│   ├── (protected)/
│   │   ├── layout.tsx                  — layout protegido (verifica sesión, incluye Navbar)
│   │   └── dashboard/
│   │       └── page.tsx                — shell del dashboard (estado vacío)
│   └── api/
│       └── auth/
│           └── [...nextauth]/
│               └── route.ts            — handler de Auth.js
├── auth.ts                             — configuración Auth.js (providers, callbacks)
├── middleware.ts                       — protección de rutas
├── lib/
│   └── db.ts                          — singleton de Prisma client
├── components/
│   └── navbar.tsx                      — navegación principal (server component)
└── types/
    └── next-auth.d.ts                  — extensión de tipos de sesión
prisma/
└── schema.prisma                       — esquema completo de la DB
.env.example                            — variables de entorno documentadas
vitest.config.ts                        — configuración de tests
```

---

## Task 1: Inicializar el proyecto Next.js

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `vitest.config.ts`, `.env.example`

- [ ] **Paso 1: Crear la app Next.js**

```bash
npx create-next-app@latest prode \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-npm
cd prode
```

- [ ] **Paso 2: Instalar dependencias de producción**

```bash
npm install next-auth@beta @auth/prisma-adapter prisma @prisma/client
```

- [ ] **Paso 3: Instalar dependencias de desarrollo y testing**

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/dom jsdom
```

- [ ] **Paso 4: Crear `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Paso 5: Agregar script de test en `package.json`**

Dentro de `"scripts"`, agregar:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Paso 6: Crear `.env.example`**

```env
# Base de datos (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Auth.js — generar con: npx auth secret
AUTH_SECRET="reemplazar-con-secreto-generado"

# Google OAuth — obtener en https://console.cloud.google.com/
GOOGLE_CLIENT_ID="tu-google-client-id"
GOOGLE_CLIENT_SECRET="tu-google-client-secret"

# URL base de la app
AUTH_URL="http://localhost:3000"
```

- [ ] **Paso 7: Copiar `.env.example` a `.env.local` y completar los valores reales**

```bash
cp .env.example .env.local
```

- [ ] **Paso 8: Verificar que la app levanta**

```bash
npm run dev
```

Esperado: app corriendo en http://localhost:3000

---

## Task 2: Configurar Prisma + Neon

**Files:**
- Create: `prisma/schema.prisma`, `src/lib/db.ts`
- Create: `src/__tests__/db.test.ts`

- [ ] **Paso 1: Inicializar Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

Esto crea `prisma/schema.prisma` y agrega `DATABASE_URL` a `.env`. Verificar que el `DATABASE_URL` en `.env.local` apunte a la base de datos Neon.

- [ ] **Paso 2: Escribir el test**

```ts
// src/__tests__/db.test.ts
import { describe, it, expect } from 'vitest'
import { prisma } from '@/lib/db'
import { PrismaClient } from '@prisma/client'

describe('prisma client singleton', () => {
  it('exporta una instancia de PrismaClient', () => {
    expect(prisma).toBeInstanceOf(PrismaClient)
  })

  it('en desarrollo, guarda la instancia en globalThis para evitar múltiples conexiones', () => {
    const g = globalThis as { prisma?: PrismaClient }
    if (process.env.NODE_ENV !== 'production') {
      expect(g.prisma).toBe(prisma)
    }
  })
})
```

- [ ] **Paso 3: Ejecutar el test — debe fallar**

```bash
npm test src/__tests__/db.test.ts
```

Esperado: FAIL — `Cannot find module '@/lib/db'`

- [ ] **Paso 4: Crear `src/lib/db.ts`**

```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

- [ ] **Paso 5: Ejecutar el test — debe pasar**

```bash
npm test src/__tests__/db.test.ts
```

Esperado: PASS

- [ ] **Paso 6: Commit**

```bash
git add src/lib/db.ts src/__tests__/db.test.ts vitest.config.ts package.json .env.example
git commit -m "feat: add Prisma client singleton and test setup"
```

---

## Task 3: Esquema completo de la base de datos

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/__tests__/schema.test.ts`

- [ ] **Paso 1: Escribir el test de los enums**

```ts
// src/__tests__/schema.test.ts
import { describe, it, expect } from 'vitest'
import { MatchStage, MatchStatus } from '@prisma/client'

describe('MatchStage enum', () => {
  it('contiene todas las etapas del torneo', () => {
    const stages = Object.values(MatchStage)
    expect(stages).toContain('GROUP')
    expect(stages).toContain('ROUND_OF_32')
    expect(stages).toContain('ROUND_OF_16')
    expect(stages).toContain('QUARTER_FINAL')
    expect(stages).toContain('SEMI_FINAL')
    expect(stages).toContain('THIRD_PLACE')
    expect(stages).toContain('FINAL')
    expect(stages).toHaveLength(7)
  })
})

describe('MatchStatus enum', () => {
  it('contiene todos los estados de un partido', () => {
    const statuses = Object.values(MatchStatus)
    expect(statuses).toContain('SCHEDULED')
    expect(statuses).toContain('IN_PROGRESS')
    expect(statuses).toContain('FINISHED')
    expect(statuses).toContain('POSTPONED')
    expect(statuses).toContain('CANCELLED')
    expect(statuses).toHaveLength(5)
  })
})
```

- [ ] **Paso 2: Ejecutar el test — debe fallar**

```bash
npm test src/__tests__/schema.test.ts
```

Esperado: FAIL — los enums no existen todavía

- [ ] **Paso 3: Reemplazar el contenido de `prisma/schema.prisma` con el esquema completo**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── NextAuth / Auth.js required models ─────────────────────────────────────

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String?
  image        String?
  isSuperAdmin Boolean  @default(false)
  createdAt    DateTime @default(now())

  accounts    Account[]
  sessions    Session[]
  ownedGroups Group[]       @relation("GroupOwner")
  memberships GroupMember[]
  predictions Prediction[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ─── Dominio del torneo ──────────────────────────────────────────────────────

model Team {
  id    String  @id @default(cuid())
  name  String          // "Argentina"
  code  String  @unique // "ARG"
  flag  String          // "🇦🇷"
  group String?         // "A"–"L" para la fase de grupos

  homeMatches Match[] @relation("HomeTeam")
  awayMatches Match[] @relation("AwayTeam")
  wonMatches  Match[] @relation("MatchWinner")
}

enum MatchStage {
  GROUP
  ROUND_OF_32
  ROUND_OF_16
  QUARTER_FINAL
  SEMI_FINAL
  THIRD_PLACE
  FINAL
}

enum MatchStatus {
  SCHEDULED
  IN_PROGRESS
  FINISHED
  POSTPONED
  CANCELLED
}

model Match {
  id          String      @id @default(cuid())
  homeTeamId  String?     // null en fases eliminatorias hasta que se definan los equipos
  awayTeamId  String?
  stage       MatchStage
  groupName   String?     // "A"–"L", solo para etapa GROUP
  matchNumber Int         // número secuencial del partido (1–104)
  scheduledAt DateTime
  venue       String?
  status      MatchStatus @default(SCHEDULED)
  homeScore   Int?        // goles al cierre de los 90 min
  awayScore   Int?        // goles al cierre de los 90 min
  winnerId    String?     // equipo que avanza (incluyendo definición por penales)
  externalId  String?     @unique // ID del partido en la API externa

  homeTeam    Team?        @relation("HomeTeam", fields: [homeTeamId], references: [id])
  awayTeam    Team?        @relation("AwayTeam", fields: [awayTeamId], references: [id])
  winner      Team?        @relation("MatchWinner", fields: [winnerId], references: [id])
  predictions Prediction[]
}

// ─── Grupos ──────────────────────────────────────────────────────────────────

model Group {
  id         String   @id @default(cuid())
  name       String
  inviteCode String   @unique @default(cuid())
  createdAt  DateTime @default(now())
  ownerId    String

  owner   User          @relation("GroupOwner", fields: [ownerId], references: [id])
  members GroupMember[]
}

model GroupMember {
  id       String   @id @default(cuid())
  groupId  String
  userId   String
  joinedAt DateTime @default(now())

  group Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([groupId, userId])
}

// ─── Pronósticos ─────────────────────────────────────────────────────────────

model Prediction {
  id                String   @id @default(cuid())
  userId            String
  matchId           String
  homeScore         Int
  awayScore         Int
  predictedWinnerId String?  // obligatorio en partidos eliminatorios
  points            Int?     // null hasta que el partido sea puntuado
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  match Match @relation(fields: [matchId], references: [id])

  @@unique([userId, matchId])
}
```

- [ ] **Paso 4: Generar el cliente Prisma**

```bash
npx prisma generate
```

- [ ] **Paso 5: Ejecutar el test — debe pasar**

```bash
npm test src/__tests__/schema.test.ts
```

Esperado: PASS

- [ ] **Paso 6: Aplicar el esquema a la base de datos**

```bash
npx prisma db push
```

Esperado: las tablas se crean en Neon sin errores

- [ ] **Paso 7: Commit**

```bash
git add prisma/schema.prisma src/__tests__/schema.test.ts
git commit -m "feat: add complete database schema with all tournament, group and prediction models"
```

---

## Task 4: Auth.js v5 con Google

**Files:**
- Create: `src/auth.ts`
- Create: `src/types/next-auth.d.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/__tests__/auth.test.ts`

- [ ] **Paso 1: Escribir el test**

```ts
// src/__tests__/auth.test.ts
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/db', () => ({ prisma: {} }))

describe('configuración de Auth.js', () => {
  it('exporta handlers GET y POST', async () => {
    const mod = await import('@/auth')
    expect(typeof mod.handlers.GET).toBe('function')
    expect(typeof mod.handlers.POST).toBe('function')
  })

  it('exporta auth, signIn y signOut', async () => {
    const mod = await import('@/auth')
    expect(mod.auth).toBeDefined()
    expect(mod.signIn).toBeDefined()
    expect(mod.signOut).toBeDefined()
  })
})
```

- [ ] **Paso 2: Ejecutar el test — debe fallar**

```bash
npm test src/__tests__/auth.test.ts
```

Esperado: FAIL — `Cannot find module '@/auth'`

- [ ] **Paso 3: Crear `src/types/next-auth.d.ts`**

```ts
import type { DefaultSession, DefaultUser } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      isSuperAdmin: boolean
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    isSuperAdmin: boolean
  }
}
```

- [ ] **Paso 4: Crear `src/auth.ts`**

```ts
import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/db'
import type { User } from 'next-auth'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  callbacks: {
    session({ session, user }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
          isSuperAdmin: (user as User).isSuperAdmin ?? false,
        },
      }
    },
  },
})
```

- [ ] **Paso 5: Crear `src/app/api/auth/[...nextauth]/route.ts`**

```ts
import { handlers } from '@/auth'

export const { GET, POST } = handlers
```

- [ ] **Paso 6: Ejecutar el test — debe pasar**

```bash
npm test src/__tests__/auth.test.ts
```

Esperado: PASS

- [ ] **Paso 7: Configurar Google OAuth**

En https://console.cloud.google.com:
1. Crear proyecto (o usar uno existente)
2. Habilitar Google+ API / Google Identity
3. Crear credenciales OAuth 2.0 (tipo: Web application)
4. Agregar Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Copiar Client ID y Client Secret al `.env.local`

- [ ] **Paso 8: Generar AUTH_SECRET**

```bash
npx auth secret
```

Copiar el valor generado a `AUTH_SECRET` en `.env.local`

- [ ] **Paso 9: Verificar el login manualmente**

```bash
npm run dev
```

Ir a http://localhost:3000/api/auth/signin — debe aparecer el botón de Google y completar el flujo

- [ ] **Paso 10: Commit**

```bash
git add src/auth.ts src/types/next-auth.d.ts src/app/api/auth/ src/__tests__/auth.test.ts
git commit -m "feat: add Auth.js v5 with Google provider and Prisma adapter"
```

---

## Task 5: Middleware de protección de rutas

**Files:**
- Create: `src/middleware.ts`
- Create: `src/__tests__/middleware.test.ts`

- [ ] **Paso 1: Escribir el test de la lógica de redirección**

```ts
// src/__tests__/middleware.test.ts
import { describe, it, expect } from 'vitest'

function resolveRedirect(
  isLoggedIn: boolean,
  pathname: string
): 'login' | 'dashboard' | null {
  const isPublic = pathname === '/login' || pathname.startsWith('/api/auth')
  if (!isLoggedIn && !isPublic) return 'login'
  if (isLoggedIn && pathname === '/login') return 'dashboard'
  return null
}

describe('lógica de redirección del middleware', () => {
  it('redirige usuario no autenticado al login', () => {
    expect(resolveRedirect(false, '/dashboard')).toBe('login')
  })

  it('redirige usuario no autenticado en ruta protegida cualquiera', () => {
    expect(resolveRedirect(false, '/groups/abc')).toBe('login')
  })

  it('permite usuario no autenticado en /login', () => {
    expect(resolveRedirect(false, '/login')).toBeNull()
  })

  it('permite usuario no autenticado en rutas /api/auth', () => {
    expect(resolveRedirect(false, '/api/auth/signin')).toBeNull()
  })

  it('redirige usuario autenticado en /login al dashboard', () => {
    expect(resolveRedirect(true, '/login')).toBe('dashboard')
  })

  it('permite usuario autenticado en ruta protegida', () => {
    expect(resolveRedirect(true, '/dashboard')).toBeNull()
  })
})
```

- [ ] **Paso 2: Ejecutar el test**

```bash
npm test src/__tests__/middleware.test.ts
```

Esperado: PASS — la lógica es pura, no depende de Next.js

- [ ] **Paso 3: Crear `src/middleware.ts`**

```ts
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl
  const isPublic = pathname === '/login' || pathname.startsWith('/api/auth')

  if (!isLoggedIn && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isLoggedIn && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Paso 4: Verificar manualmente**

Con `npm run dev`, intentar acceder a http://localhost:3000/dashboard sin sesión — debe redirigir a `/login`.

- [ ] **Paso 5: Commit**

```bash
git add src/middleware.ts src/__tests__/middleware.test.ts
git commit -m "feat: add route protection middleware"
```

---

## Task 6: Layout raíz y layout protegido

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/app/(protected)/layout.tsx`

- [ ] **Paso 1: Reemplazar `src/app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Prode Mundial 2026',
  description: 'Jugá al prode del Mundial FIFA 2026 con tus amigos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Paso 2: Crear `src/app/(protected)/layout.tsx`**

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

- [ ] **Paso 3: Commit**

```bash
git add src/app/layout.tsx src/app/'(protected)'/layout.tsx
git commit -m "feat: add root layout and protected layout with session guard"
```

---

## Task 7: Navbar

**Files:**
- Create: `src/components/navbar.tsx`

- [ ] **Paso 1: Crear `src/components/navbar.tsx`**

```tsx
import Link from 'next/link'
import { auth, signOut } from '@/auth'

export default async function Navbar() {
  const session = await auth()

  return (
    <nav className="border-b bg-white px-4 py-3 flex items-center justify-between">
      <Link href="/dashboard" className="font-bold text-lg flex items-center gap-2">
        <span>⚽</span>
        <span>Prode 2026</span>
      </Link>

      {session?.user && (
        <div className="flex items-center gap-4">
          {session.user.image && (
            <img
              src={session.user.image}
              alt={session.user.name ?? ''}
              className="w-8 h-8 rounded-full"
            />
          )}
          <span className="text-sm text-gray-600 hidden sm:block">
            {session.user.name}
          </span>
          <form
            action={async () => {
              'use server'
              await signOut({ redirectTo: '/login' })
            }}
          >
            <button
              type="submit"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Salir
            </button>
          </form>
        </div>
      )}
    </nav>
  )
}
```

- [ ] **Paso 2: Verificar visualmente**

Con sesión activa, visitar http://localhost:3000/dashboard — debe verse la navbar con nombre y foto del usuario de Google.

- [ ] **Paso 3: Commit**

```bash
git add src/components/navbar.tsx
git commit -m "feat: add Navbar server component with user info and sign out"
```

---

## Task 8: Página de login

**Files:**
- Create: `src/app/login/page.tsx`

- [ ] **Paso 1: Crear `src/app/login/page.tsx`**

```tsx
import { auth, signIn } from '@/auth'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect('/dashboard')

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-sm border text-center space-y-6 w-full max-w-sm">
        <div>
          <div className="text-5xl mb-3">⚽</div>
          <h1 className="text-2xl font-bold">Prode Mundial 2026</h1>
          <p className="text-gray-500 text-sm mt-1">Jugá con tus amigos</p>
        </div>

        <form
          action={async () => {
            'use server'
            await signIn('google', { redirectTo: '/dashboard' })
          }}
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Iniciar sesión con Google
          </button>
        </form>
      </div>
    </main>
  )
}
```

- [ ] **Paso 2: Verificar visualmente**

Visitar http://localhost:3000/login — debe verse la pantalla de login. Completar el flujo de Google — debe redirigir al dashboard.

- [ ] **Paso 3: Commit**

```bash
git add src/app/login/page.tsx
git commit -m "feat: add login page with Google sign-in"
```

---

## Task 9: Dashboard shell y redirección raíz

**Files:**
- Create: `src/app/(protected)/dashboard/page.tsx`
- Create: `src/app/page.tsx`

- [ ] **Paso 1: Crear `src/app/(protected)/dashboard/page.tsx`**

```tsx
import { auth } from '@/auth'

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mis grupos</h1>
        <p className="text-gray-500 text-sm mt-1">
          Bienvenido, {session?.user?.name}
        </p>
      </div>

      <div className="bg-white border rounded-xl p-10 text-center">
        <div className="text-4xl mb-3">🏆</div>
        <p className="text-gray-600 font-medium">Todavía no pertenecés a ningún grupo</p>
        <p className="text-gray-400 text-sm mt-1">
          Creá uno o pedile a alguien el código de invitación
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Paso 2: Crear `src/app/page.tsx`**

```tsx
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function RootPage() {
  const session = await auth()
  redirect(session ? '/dashboard' : '/login')
}
```

- [ ] **Paso 3: Verificar el flujo completo**

1. Sin sesión: `http://localhost:3000` → redirige a `/login`
2. Hacer login con Google → redirige a `/dashboard`
3. En `/dashboard`: se ve el estado vacío con el nombre del usuario
4. Click en "Salir" → redirige a `/login`

- [ ] **Paso 4: Correr todos los tests**

```bash
npm test
```

Esperado: todos en PASS

- [ ] **Paso 5: Commit**

```bash
git add src/app/'(protected)'/dashboard/page.tsx src/app/page.tsx
git commit -m "feat: add dashboard shell and root redirect"
```

---

## Task 10: Deploy a Vercel

**Files:**
- No se modifican archivos de código

- [ ] **Paso 1: Crear repositorio en GitHub y subir el código**

```bash
git remote add origin https://github.com/TU_USUARIO/prode.git
git push -u origin main
```

- [ ] **Paso 2: Importar el proyecto en Vercel**

1. Ir a https://vercel.com/new
2. Seleccionar el repositorio `prode`
3. Framework: Next.js (autodetectado)
4. Click en "Deploy" sin configurar variables todavía (va a fallar — es esperado)

- [ ] **Paso 3: Configurar variables de entorno en Vercel**

En el dashboard del proyecto → Settings → Environment Variables, agregar:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | URL de Neon (production) |
| `AUTH_SECRET` | Mismo valor que en `.env.local` |
| `GOOGLE_CLIENT_ID` | Client ID de Google |
| `GOOGLE_CLIENT_SECRET` | Client Secret de Google |
| `AUTH_URL` | `https://tu-dominio.vercel.app` |

- [ ] **Paso 4: Agregar la URL de producción en Google Cloud Console**

En las credenciales OAuth del proyecto de Google, agregar como Authorized redirect URI:
`https://tu-dominio.vercel.app/api/auth/callback/google`

- [ ] **Paso 5: Re-deployar**

En el dashboard de Vercel → Deployments → click en los tres puntos del último deploy → "Redeploy"

- [ ] **Paso 6: Verificar en producción**

1. Visitar `https://tu-dominio.vercel.app` → redirige a `/login`
2. Completar login con Google → redirige a `/dashboard`
3. El dashboard muestra el estado vacío correctamente

---

## Resultado de la Fase 1

Al completar esta fase, existe una app desplegada en Vercel con:

- ✅ Login con Google funcionando en local y producción
- ✅ Rutas protegidas por middleware
- ✅ Esquema completo de la DB (User, Team, Match, Group, GroupMember, Prediction)
- ✅ Dashboard shell con estado vacío
- ✅ Tests unitarios pasando

## Fases siguientes

- **Fase 2:** Seed de los 48 equipos y 104 partidos, integración con API de resultados, vista del torneo
- **Fase 3:** Creación de grupos, sistema de invitación por código, unirse a un grupo
- **Fase 4:** Carga y bloqueo de pronósticos, motor de puntuación, tabla de posiciones con desempate
- **Fase 5:** Notificaciones por email (Resend + Vercel Cron), panel del super admin
