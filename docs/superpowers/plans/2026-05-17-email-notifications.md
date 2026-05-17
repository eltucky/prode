# Email Notifications — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enviar recordatorios 2 horas antes del cierre de cada partido (solo si el usuario no cargó pronóstico) y resúmenes diarios de puntos + posición en grupos, a los usuarios que optaron por recibir notificaciones.

**Architecture:** Un cron horario (`/api/cron/notifications`) maneja ambos tipos de email. La preferencia del usuario se guarda en `User.emailNotifications` y se activa desde `/perfil`. Las funciones de construcción de HTML son puras y testeables; las funciones de envío llaman a Resend.

**Tech Stack:** Next.js 16 Server Components + Server Actions, Prisma 6, Resend SDK, Vitest

---

## Mapa de archivos

```
prisma/
└── schema.prisma                              — Modify: add emailNotifications to User

src/
├── lib/
│   └── email.ts                               — Create: tipos, buildReminderHtml, buildSummaryHtml, sendReminderEmail, sendDailySummaryEmail
├── __tests__/
│   └── email.test.ts                          — Create: tests de los HTML builders
└── app/
    ├── (protected)/
    │   └── perfil/
    │       ├── page.tsx                       — Create: toggle de notificaciones
    │       └── actions.ts                     — Create: updateEmailNotifications
    └── api/cron/
        └── notifications/
            └── route.ts                       — Create: cron horario

src/components/
└── navbar.tsx                                 — Modify: link en el nombre del usuario → /perfil

vercel.json                                    — Modify: add notifications cron
```

---

## Task 1: Schema — agregar `emailNotifications` al modelo User

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Paso 1: Agregar el campo al modelo User**

En `prisma/schema.prisma`, dentro del modelo `User`, agregar `emailNotifications` después de `isBlocked`:

```prisma
model User {
  id                 String    @id @default(cuid())
  email              String    @unique
  emailVerified      DateTime?
  name               String?
  image              String?
  isSuperAdmin       Boolean   @default(false)
  isBlocked          Boolean   @default(false)
  emailNotifications Boolean   @default(false)
  createdAt          DateTime  @default(now())

  accounts    Account[]
  sessions    Session[]
  ownedGroups Group[]       @relation("GroupOwner")
  memberships GroupMember[]
  predictions Prediction[]
}
```

- [ ] **Paso 2: Aplicar el cambio a Neon**

```bash
cd /Users/mariano/Work/prode && npx prisma db push 2>&1 | tail -5
```

Esperado: `🚀 Your database is now in sync with your Prisma schema.`

- [ ] **Paso 3: TypeScript check**

```bash
cd /Users/mariano/Work/prode && npx tsc --noEmit 2>&1 | head -5
```

Esperado: 0 errores.

- [ ] **Paso 4: Commit**

```bash
cd /Users/mariano/Work/prode && git add prisma/schema.prisma && git commit -m "feat: add emailNotifications field to User model"
```

---

## Task 2: Email library — tipos, HTML builders y send functions

**Files:**
- Create: `src/lib/email.ts`
- Create: `src/__tests__/email.test.ts`

- [ ] **Paso 1: Instalar Resend**

```bash
cd /Users/mariano/Work/prode && npm install resend 2>&1 | tail -3
```

Esperado: `added 1 package` (o similar).

- [ ] **Paso 2: Escribir los tests**

```ts
// src/__tests__/email.test.ts
import { describe, it, expect } from 'vitest'
import { buildReminderHtml, buildSummaryHtml } from '@/lib/email'
import type { ReminderMatch, SummaryData } from '@/lib/email'

describe('buildReminderHtml', () => {
  it('incluye los equipos y número de partido', () => {
    const matches: ReminderMatch[] = [
      { matchNumber: 1, homeTeam: 'Argentina', awayTeam: 'Brasil', scheduledAt: new Date('2026-06-15T18:00:00Z') },
    ]
    const html = buildReminderHtml('Mariano', matches)
    expect(html).toContain('Argentina')
    expect(html).toContain('Brasil')
    expect(html).toContain('#1')
    expect(html).toContain('Mariano')
  })

  it('incluye todos los partidos cuando hay varios', () => {
    const matches: ReminderMatch[] = [
      { matchNumber: 1, homeTeam: 'Argentina', awayTeam: 'Brasil', scheduledAt: new Date() },
      { matchNumber: 2, homeTeam: 'Francia', awayTeam: 'Alemania', scheduledAt: new Date() },
    ]
    const html = buildReminderHtml('Mariano', matches)
    expect(html).toContain('Argentina')
    expect(html).toContain('Francia')
    expect(html).toContain('Alemania')
  })
})

describe('buildSummaryHtml', () => {
  it('incluye pronósticos, puntos y posición en grupo', () => {
    const data: SummaryData = {
      predictionsToday: [
        { homeTeam: 'Argentina', awayTeam: 'Brasil', homeScore: 2, awayScore: 1, points: 5 },
      ],
      groups: [{ name: 'Los pibes', position: 1, totalMembers: 5 }],
    }
    const html = buildSummaryHtml('Mariano', data)
    expect(html).toContain('Argentina')
    expect(html).toContain('5 pts')
    expect(html).toContain('Los pibes')
    expect(html).toContain('posición 1 de 5')
    expect(html).toContain('Mariano')
  })

  it('muestra la suma total de puntos del día', () => {
    const data: SummaryData = {
      predictionsToday: [
        { homeTeam: 'A', awayTeam: 'B', homeScore: 1, awayScore: 0, points: 3 },
        { homeTeam: 'C', awayTeam: 'D', homeScore: 0, awayScore: 0, points: 2 },
      ],
      groups: [],
    }
    const html = buildSummaryHtml('Mariano', data)
    expect(html).toContain('5 puntos')
  })
})
```

- [ ] **Paso 3: Correr los tests — deben fallar**

```bash
cd /Users/mariano/Work/prode && npm test -- src/__tests__/email.test.ts 2>&1 | tail -5
```

Esperado: FAIL (cannot find module '@/lib/email')

- [ ] **Paso 4: Crear `src/lib/email.ts`**

```ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM ?? 'onboarding@resend.dev'
const APP_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

export interface ReminderMatch {
  matchNumber: number
  homeTeam: string
  awayTeam: string
  scheduledAt: Date
}

export interface PredictionToday {
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  points: number
}

export interface GroupStanding {
  name: string
  position: number
  totalMembers: number
}

export interface SummaryData {
  predictionsToday: PredictionToday[]
  groups: GroupStanding[]
}

export function buildReminderHtml(userName: string, matches: ReminderMatch[]): string {
  const rows = matches
    .map(m => {
      const time = m.scheduledAt.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Argentina/Buenos_Aires',
      })
      return `<li>${m.homeTeam} vs ${m.awayTeam} — Partido #${m.matchNumber} (${time} hs)</li>`
    })
    .join('')

  return `
<p>Hola ${userName},</p>
<p>Estos partidos cierran en menos de 2 horas y todavía no cargaste tu pronóstico:</p>
<ul>${rows}</ul>
<p><a href="${APP_URL}/torneo">Cargar pronósticos →</a></p>
`
}

export function buildSummaryHtml(userName: string, data: SummaryData): string {
  const totalPoints = data.predictionsToday.reduce((s, p) => s + p.points, 0)
  const predRows = data.predictionsToday
    .map(p => `<tr><td>${p.homeTeam} vs ${p.awayTeam}</td><td>${p.homeScore}-${p.awayScore}</td><td>${p.points} pts</td></tr>`)
    .join('')
  const groupItems = data.groups
    .map(g => `<li>${g.name}: posición ${g.position} de ${g.totalMembers}</li>`)
    .join('')

  return `
<p>Hola ${userName},</p>
<h2>Tus pronósticos de hoy — ${totalPoints} puntos</h2>
<table>
  <thead><tr><th>Partido</th><th>Resultado</th><th>Pts</th></tr></thead>
  <tbody>${predRows}</tbody>
</table>
<h2>Tu posición en los grupos</h2>
<ul>${groupItems}</ul>
<p><a href="${APP_URL}/dashboard">Ver dashboard →</a></p>
`
}

export async function sendReminderEmail(
  to: string,
  userName: string,
  matches: ReminderMatch[]
): Promise<void> {
  const count = matches.length
  await resend.emails.send({
    from: FROM,
    to,
    subject: `⏰ ${count === 1 ? '1 partido cierra' : `${count} partidos cierran`} en 2 horas — Prode 2026`,
    html: buildReminderHtml(userName, matches),
  })
}

export async function sendDailySummaryEmail(
  to: string,
  userName: string,
  data: SummaryData
): Promise<void> {
  const totalPoints = data.predictionsToday.reduce((s, p) => s + p.points, 0)
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Prode 2026 — Resumen del día: ${totalPoints} pts`,
    html: buildSummaryHtml(userName, data),
  })
}
```

- [ ] **Paso 5: Correr los tests — deben pasar**

```bash
cd /Users/mariano/Work/prode && npm test -- src/__tests__/email.test.ts 2>&1 | tail -5
```

Esperado: PASS (4 tests)

- [ ] **Paso 6: Correr toda la suite**

```bash
cd /Users/mariano/Work/prode && npm test 2>&1 | tail -5
```

Esperado: todos los tests pasan.

- [ ] **Paso 7: Commit**

```bash
cd /Users/mariano/Work/prode && git add src/lib/email.ts src/__tests__/email.test.ts package.json package-lock.json && git commit -m "feat: add email library with Resend and HTML builders"
```

---

## Task 3: Página de perfil + link en navbar

**Files:**
- Create: `src/app/(protected)/perfil/actions.ts`
- Create: `src/app/(protected)/perfil/page.tsx`
- Modify: `src/components/navbar.tsx`

- [ ] **Paso 1: Crear `src/app/(protected)/perfil/actions.ts`**

```ts
'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function updateEmailNotifications(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  const enabled = formData.get('emailNotifications') === 'on'
  await prisma.user.update({
    where: { id: session.user.id },
    data: { emailNotifications: enabled },
  })
  revalidatePath('/perfil')
}
```

- [ ] **Paso 2: Crear `src/app/(protected)/perfil/page.tsx`**

```tsx
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { updateEmailNotifications } from './actions'

export default async function PerfilPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, emailNotifications: true },
  })
  if (!user) redirect('/login')

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Perfil</h1>

      <div className="bg-white border rounded-xl p-6 space-y-1">
        <div className="font-medium">{user.name}</div>
        <div className="text-sm text-gray-500">{user.email}</div>
      </div>

      <div className="bg-white border rounded-xl p-6">
        <h2 className="font-semibold mb-4">Notificaciones</h2>
        <form action={updateEmailNotifications} className="space-y-4">
          <label className="flex items-start justify-between gap-4 cursor-pointer">
            <div>
              <div className="font-medium text-sm">Recordatorios y resumen diario</div>
              <div className="text-xs text-gray-500 mt-0.5">
                Te avisamos 2 horas antes de cada partido si todavía no cargaste pronóstico, y te mandamos un resumen de puntos al final del día.
              </div>
            </div>
            <input
              type="checkbox"
              name="emailNotifications"
              defaultChecked={user.emailNotifications}
              className="mt-1 w-5 h-5 accent-gray-900 shrink-0"
            />
          </label>
          <button
            type="submit"
            className="w-full bg-gray-900 text-white rounded-lg py-2 text-sm hover:bg-gray-700"
          >
            Guardar
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Paso 3: Modificar `src/components/navbar.tsx` — agregar link al perfil**

En el navbar actual hay un `<span>` con el nombre del usuario. Reemplazarlo con un `<Link>` que apunte a `/perfil`:

Reemplazar:
```tsx
<span className="text-sm text-gray-600 hidden sm:block">
  {session.user.name}
</span>
```

Con:
```tsx
<Link href="/perfil" className="text-sm text-gray-600 hover:text-gray-900 hidden sm:block">
  {session.user.name}
</Link>
```

`Link` ya está importado al inicio del archivo (`import Link from 'next/link'`), no hace falta agregar el import.

- [ ] **Paso 4: TypeScript check + tests**

```bash
cd /Users/mariano/Work/prode && npx tsc --noEmit 2>&1 | head -10
cd /Users/mariano/Work/prode && npm test 2>&1 | tail -5
```

Esperado: 0 errores, todos los tests pasan.

- [ ] **Paso 5: Commit**

```bash
cd /Users/mariano/Work/prode && git add 'src/app/(protected)/perfil/' src/components/navbar.tsx && git commit -m "feat: add profile page with email notifications toggle"
```

---

## Task 4: Cron de notificaciones + vercel.json

**Files:**
- Create: `src/app/api/cron/notifications/route.ts`
- Modify: `vercel.json`

- [ ] **Paso 1: Crear `src/app/api/cron/notifications/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendReminderEmail, sendDailySummaryEmail } from '@/lib/email'
import type { ReminderMatch, SummaryData } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  const tournamentStarted = await prisma.match.findFirst({
    where: { scheduledAt: { lte: now } },
    select: { id: true },
  })
  if (!tournamentStarted) {
    return NextResponse.json({ ok: true, skipped: 'tournament not started' })
  }

  let remindersSent = 0
  let summariesSent = 0
  const errors: string[] = []

  // ── Recordatorios ────────────────────────────────────────────────────────

  const windowStart = new Date(now.getTime() + 90 * 60 * 1000)
  const windowEnd = new Date(now.getTime() + 150 * 60 * 1000)

  const upcomingMatches = await prisma.match.findMany({
    where: { status: 'SCHEDULED', scheduledAt: { gte: windowStart, lte: windowEnd } },
    include: { homeTeam: true, awayTeam: true },
  })

  if (upcomingMatches.length > 0) {
    const matchIds = upcomingMatches.map(m => m.id)

    const eligibleUsers = await prisma.user.findMany({
      where: { emailNotifications: true },
      select: { id: true, name: true, email: true },
    })

    for (const user of eligibleUsers) {
      const predicted = await prisma.prediction.findMany({
        where: { userId: user.id, matchId: { in: matchIds } },
        select: { matchId: true },
      })
      const predictedIds = new Set(predicted.map(p => p.matchId))
      const unpredicted = upcomingMatches.filter(m => !predictedIds.has(m.id))
      if (unpredicted.length === 0) continue

      const reminderMatches: ReminderMatch[] = unpredicted.map(m => ({
        matchNumber: m.matchNumber,
        homeTeam: m.homeTeam?.name ?? 'TBD',
        awayTeam: m.awayTeam?.name ?? 'TBD',
        scheduledAt: m.scheduledAt,
      }))

      try {
        await sendReminderEmail(user.email, user.name ?? 'Jugador', reminderMatches)
        remindersSent++
      } catch (e) {
        errors.push(`reminder:${user.email}: ${String(e)}`)
      }
    }
  }

  // ── Resumen diario (solo a las 22:00 UTC) ────────────────────────────────

  if (now.getUTCHours() === 22) {
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

    const finishedToday = await prisma.match.findMany({
      where: { status: 'FINISHED', scheduledAt: { gte: todayStart, lt: todayEnd } },
      include: { homeTeam: true, awayTeam: true },
    })

    if (finishedToday.length > 0) {
      const matchIds = finishedToday.map(m => m.id)

      const usersToSummarize = await prisma.user.findMany({
        where: {
          emailNotifications: true,
          predictions: { some: { matchId: { in: matchIds }, points: { not: null } } },
        },
        select: {
          id: true,
          name: true,
          email: true,
          predictions: {
            where: { matchId: { in: matchIds }, points: { not: null } },
            select: { matchId: true, homeScore: true, awayScore: true, points: true },
          },
          memberships: {
            select: {
              group: {
                select: {
                  id: true,
                  name: true,
                  members: { select: { userId: true } },
                },
              },
            },
          },
        },
      })

      for (const user of usersToSummarize) {
        const predictionsToday = user.predictions.map(p => {
          const match = finishedToday.find(m => m.id === p.matchId)!
          return {
            homeTeam: match.homeTeam?.name ?? 'TBD',
            awayTeam: match.awayTeam?.name ?? 'TBD',
            homeScore: p.homeScore,
            awayScore: p.awayScore,
            points: p.points ?? 0,
          }
        })

        const groups: SummaryData['groups'] = []
        for (const { group } of user.memberships) {
          const memberIds = group.members.map(m => m.userId)
          const allPredictions = await prisma.prediction.findMany({
            where: { userId: { in: memberIds }, points: { not: null } },
            select: { userId: true, points: true },
          })
          const totals = new Map<string, { total: number; correctCount: number }>()
          for (const p of allPredictions) {
            const entry = totals.get(p.userId) ?? { total: 0, correctCount: 0 }
            entry.total += p.points ?? 0
            entry.correctCount += (p.points ?? 0) > 0 ? 1 : 0
            totals.set(p.userId, entry)
          }
          const sorted = Array.from(totals.entries())
            .sort(([, a], [, b]) => b.total - a.total || b.correctCount - a.correctCount)
          const position = sorted.findIndex(([uid]) => uid === user.id) + 1
          groups.push({
            name: group.name,
            position: position > 0 ? position : memberIds.length,
            totalMembers: memberIds.length,
          })
        }

        try {
          await sendDailySummaryEmail(user.email, user.name ?? 'Jugador', { predictionsToday, groups })
          summariesSent++
        } catch (e) {
          errors.push(`summary:${user.email}: ${String(e)}`)
        }
      }
    }
  }

  return NextResponse.json({ ok: true, remindersSent, summariesSent, errors })
}
```

- [ ] **Paso 2: Modificar `vercel.json`**

```json
{
  "crons": [
    { "path": "/api/cron/sync-results", "schedule": "0 4 * * *" },
    { "path": "/api/cron/notifications", "schedule": "0 * * * *" }
  ]
}
```

- [ ] **Paso 3: TypeScript check + tests + build**

```bash
cd /Users/mariano/Work/prode && npx tsc --noEmit 2>&1 | head -10
cd /Users/mariano/Work/prode && npm test 2>&1 | tail -5
cd /Users/mariano/Work/prode && npm run build 2>&1 | tail -15
```

Esperado: 0 errores, todos los tests pasan, build limpio.

- [ ] **Paso 4: Commit**

```bash
cd /Users/mariano/Work/prode && git add 'src/app/api/cron/notifications/' vercel.json && git commit -m "feat: add hourly notifications cron for reminders and daily summary"
```

---

## Env vars a agregar en Vercel

Después de hacer el deploy, agregar en el dashboard de Vercel (Settings → Environment Variables):

- `RESEND_API_KEY` — clave de API de Resend (resend.com → API Keys)
- `RESEND_FROM` — dirección verificada en Resend (e.g. `prode@tudominio.com`). Para testing inicial podés usar `onboarding@resend.dev` (solo permite enviar al email del owner de la cuenta Resend).

## Resultado al completar la fase

- ✅ Usuarios pueden activar/desactivar notificaciones desde `/perfil` (opt-in)
- ✅ Recordatorio 2h antes del cierre si no cargaron pronóstico, un solo email con todos los partidos pendientes en la ventana
- ✅ Resumen diario a las 22:00 UTC con puntos del día y posición en cada grupo
- ✅ El cron no hace nada hasta que arranque el torneo
- ✅ Errores de envío individuales no detienen el cron — se loguean y continúa
