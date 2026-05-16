# Prode Mundial 2026 — Plan Fase 5a: Panel Super Admin

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar un panel super admin completo con dashboard de métricas, gestión de grupos (eliminar, transferir ownership, remover miembros), gestión de usuarios (bloquear, hacer super admin), y auditoría de pronósticos por partido con ranking global.

**Architecture:** Layout compartido `/admin/layout.tsx` agrega nav secundaria y verifica `isSuperAdmin`. Helpers puros en `src/lib/admin.ts` (testeables). Server Actions por sección con validación Zod. El bloqueo se enforcea consultando la DB en `createGroup`, `joinGroup` y `savePrediction`.

**Tech Stack:** Next.js 16 Server Components + Server Actions, Prisma 6, Zod, Vitest, Tailwind CSS v4

---

## Mapa de archivos

```
prisma/
└── schema.prisma                              — Modify: add isBlocked to User

src/
├── lib/
│   └── admin.ts                               — Create: assertNotBlocked, assertNotSelf (puras, testeables)
├── __tests__/
│   └── admin.test.ts                          — Create: tests de los helpers
└── app/
    └── (protected)/
        ├── admin/
        │   ├── layout.tsx                     — Create: nav secundaria + superAdmin guard
        │   ├── page.tsx                       — Create: dashboard con 5 métricas
        │   ├── grupos/
        │   │   ├── page.tsx                   — Create: gestión de grupos y miembros
        │   │   └── actions.ts                 — Create: deleteGroup, removeUserFromGroup, transferOwnership
        │   ├── usuarios/
        │   │   ├── page.tsx                   — Create: gestión de usuarios
        │   │   └── actions.ts                 — Create: blockUser, unblockUser, toggleSuperAdmin
        │   └── pronosticos/
        │       ├── page.tsx                   — Create: selector partido + pronósticos + ranking global
        │       └── actions.ts                 — Create: editPrediction, deletePrediction
        ├── grupos/
        │   └── actions.ts                     — Modify: createGroup y joinGroup verifican isBlocked
        └── torneo/
            └── actions.ts                     — Modify: savePrediction verifica isBlocked
```

---

## Task 1: Schema — agregar `isBlocked` al modelo User

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Paso 1: Agregar el campo al modelo User**

En `prisma/schema.prisma`, dentro del modelo `User`, agregar `isBlocked` después de `isSuperAdmin`:

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  image         String?
  isSuperAdmin  Boolean   @default(false)
  isBlocked     Boolean   @default(false)
  createdAt     DateTime  @default(now())

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
cd /Users/mariano/Work/prode && git add prisma/schema.prisma && git commit -m "feat: add isBlocked field to User model"
```

---

## Task 2: Helpers puros + tests

**Files:**
- Create: `src/lib/admin.ts`
- Create: `src/__tests__/admin.test.ts`

- [ ] **Paso 1: Escribir el test**

```ts
// src/__tests__/admin.test.ts
import { describe, it, expect } from 'vitest'
import { assertNotBlocked, assertNotSelf } from '@/lib/admin'

describe('assertNotBlocked', () => {
  it('lanza error si el usuario está bloqueado', () => {
    expect(() => assertNotBlocked(true)).toThrow('bloqueada')
  })

  it('no lanza error si el usuario no está bloqueado', () => {
    expect(() => assertNotBlocked(false)).not.toThrow()
  })
})

describe('assertNotSelf', () => {
  it('lanza error si el actor y el target son el mismo usuario', () => {
    expect(() => assertNotSelf('user-1', 'user-1', 'bloquearte')).toThrow('propia cuenta')
  })

  it('no lanza error si son usuarios distintos', () => {
    expect(() => assertNotSelf('user-1', 'user-2', 'bloquear')).not.toThrow()
  })
})
```

- [ ] **Paso 2: Correr el test — debe fallar**

```bash
cd /Users/mariano/Work/prode && npm test -- src/__tests__/admin.test.ts 2>&1 | tail -10
```

Esperado: FAIL (cannot find module '@/lib/admin')

- [ ] **Paso 3: Crear `src/lib/admin.ts`**

```ts
export function assertNotBlocked(isBlocked: boolean): void {
  if (isBlocked) throw new Error('Tu cuenta está bloqueada')
}

export function assertNotSelf(actingUserId: string, targetUserId: string, action: string): void {
  if (actingUserId === targetUserId) throw new Error(`No podés ${action} en tu propia cuenta`)
}
```

- [ ] **Paso 4: Correr el test — debe pasar**

```bash
cd /Users/mariano/Work/prode && npm test -- src/__tests__/admin.test.ts 2>&1 | tail -10
```

Esperado: PASS (4 tests)

- [ ] **Paso 5: Correr toda la suite**

```bash
cd /Users/mariano/Work/prode && npm test 2>&1 | tail -5
```

- [ ] **Paso 6: Commit**

```bash
cd /Users/mariano/Work/prode && git add src/lib/admin.ts src/__tests__/admin.test.ts && git commit -m "feat: add admin helper functions with tests"
```

---

## Task 3: Admin layout + dashboard

**Files:**
- Create: `src/app/(protected)/admin/layout.tsx`
- Create: `src/app/(protected)/admin/page.tsx`

- [ ] **Paso 1: Crear `src/app/(protected)/admin/layout.tsx`**

```tsx
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const NAV = [
  { href: '/admin/partidos', label: 'Partidos' },
  { href: '/admin/grupos', label: 'Grupos' },
  { href: '/admin/usuarios', label: 'Usuarios' },
  { href: '/admin/pronosticos', label: 'Pronósticos' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) redirect('/dashboard')

  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b pb-0">
        {NAV.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-400 -mb-px"
          >
            {item.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  )
}
```

- [ ] **Paso 2: Crear `src/app/(protected)/admin/page.tsx`**

```tsx
import { prisma } from '@/lib/db'

export default async function AdminPage() {
  const [
    totalUsers,
    blockedUsers,
    totalGroups,
    finishedMatches,
    totalMatches,
    totalPredictions,
    pointsAgg,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isBlocked: true } }),
    prisma.group.count(),
    prisma.match.count({ where: { status: 'FINISHED' } }),
    prisma.match.count(),
    prisma.prediction.count(),
    prisma.prediction.aggregate({
      where: { points: { not: null } },
      _avg: { points: true },
    }),
  ])

  const metrics = [
    { label: 'Usuarios', value: `${totalUsers}`, sub: `${blockedUsers} bloqueados` },
    { label: 'Grupos', value: `${totalGroups}` },
    { label: 'Partidos', value: `${finishedMatches} / ${totalMatches}`, sub: 'finalizados' },
    { label: 'Pronósticos', value: `${totalPredictions}` },
    {
      label: 'Pts promedio',
      value: pointsAgg._avg.points != null
        ? pointsAgg._avg.points.toFixed(1)
        : '—',
      sub: 'por pronóstico',
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {metrics.map(m => (
          <div key={m.label} className="bg-white border rounded-xl px-4 py-4">
            <div className="text-xs text-gray-400 mb-1">{m.label}</div>
            <div className="text-2xl font-bold text-gray-900">{m.value}</div>
            {m.sub && <div className="text-xs text-gray-400 mt-0.5">{m.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Paso 3: TypeScript check + tests**

```bash
cd /Users/mariano/Work/prode && npx tsc --noEmit 2>&1 | head -10
cd /Users/mariano/Work/prode && npm test 2>&1 | tail -5
```

Esperado: 0 errores, todos los tests pasan.

- [ ] **Paso 4: Commit**

```bash
cd /Users/mariano/Work/prode && git add 'src/app/(protected)/admin/layout.tsx' 'src/app/(protected)/admin/page.tsx' && git commit -m "feat: add admin layout with nav and metrics dashboard"
```

---

## Task 4: Admin grupos

**Files:**
- Create: `src/app/(protected)/admin/grupos/page.tsx`
- Create: `src/app/(protected)/admin/grupos/actions.ts`

- [ ] **Paso 1: Crear `src/app/(protected)/admin/grupos/actions.ts`**

```ts
'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

async function requireSuperAdmin() {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) throw new Error('Acceso denegado')
}

export async function deleteGroup(formData: FormData) {
  await requireSuperAdmin()
  const groupId = z.string().cuid().parse(formData.get('groupId'))
  await prisma.group.delete({ where: { id: groupId } })
  revalidatePath('/admin/grupos')
}

export async function removeUserFromGroup(formData: FormData) {
  await requireSuperAdmin()
  const groupId = z.string().cuid().parse(formData.get('groupId'))
  const userId = z.string().cuid().parse(formData.get('userId'))

  const group = await prisma.group.findUnique({ where: { id: groupId }, select: { ownerId: true } })
  if (!group) throw new Error('Grupo no encontrado')
  if (group.ownerId === userId) throw new Error('No podés sacar al owner del grupo. Transferí el ownership primero.')

  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId } },
  })
  revalidatePath('/admin/grupos')
}

export async function transferOwnership(formData: FormData) {
  await requireSuperAdmin()
  const groupId = z.string().cuid().parse(formData.get('groupId'))
  const newOwnerId = z.string().cuid().parse(formData.get('newOwnerId'))

  const isMember = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: newOwnerId } },
  })
  if (!isMember) throw new Error('El nuevo owner debe ser miembro del grupo')

  await prisma.group.update({ where: { id: groupId }, data: { ownerId: newOwnerId } })
  revalidatePath('/admin/grupos')
}
```

- [ ] **Paso 2: Crear `src/app/(protected)/admin/grupos/page.tsx`**

```tsx
import { prisma } from '@/lib/db'
import { deleteGroup, removeUserFromGroup, transferOwnership } from './actions'

export default async function AdminGruposPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmar?: string }>
}) {
  const { confirmar } = await searchParams

  const groups = await prisma.group.findMany({
    include: {
      members: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { joinedAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Grupos</h1>
      <p className="text-sm text-gray-500">{groups.length} grupos en total</p>

      {groups.map(group => {
        const nonOwnerMembers = group.members.filter(m => m.userId !== group.ownerId)
        const owner = group.members.find(m => m.userId === group.ownerId)

        return (
          <div key={group.id} className="bg-white border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="font-semibold">{group.name}</div>
                <div className="text-xs text-gray-400">
                  {group.members.length} {group.members.length === 1 ? 'miembro' : 'miembros'} ·
                  owner: {owner?.user.name ?? '?'} ·
                  {group.createdAt.toLocaleDateString('es-AR')}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {nonOwnerMembers.length > 0 && (
                  <form action={transferOwnership} className="flex items-center gap-1">
                    <input type="hidden" name="groupId" value={group.id} />
                    <select name="newOwnerId" className="border rounded px-2 py-1 text-xs">
                      {nonOwnerMembers.map(m => (
                        <option key={m.userId} value={m.userId}>{m.user.name}</option>
                      ))}
                    </select>
                    <button type="submit" className="text-xs bg-gray-700 text-white px-2 py-1 rounded hover:bg-gray-900">
                      Transferir
                    </button>
                  </form>
                )}
                {confirmar === group.id ? (
                  <form action={deleteGroup} className="flex items-center gap-1">
                    <input type="hidden" name="groupId" value={group.id} />
                    <span className="text-xs text-red-600 font-medium">¿Confirmar?</span>
                    <button type="submit" className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700">
                      Sí, eliminar
                    </button>
                    <a href="/admin/grupos" className="text-xs text-gray-500 hover:text-gray-700 ml-1">No</a>
                  </form>
                ) : (
                  <a
                    href={`/admin/grupos?confirmar=${group.id}`}
                    className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-2 py-1 rounded"
                  >
                    Eliminar
                  </a>
                )}
              </div>
            </div>
            <div className="divide-y">
              {group.members.map(member => (
                <div key={member.id} className="flex items-center justify-between px-4 py-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span>{member.user.name}</span>
                    {member.userId === group.ownerId && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Admin</span>
                    )}
                  </div>
                  {member.userId !== group.ownerId && (
                    <form action={removeUserFromGroup}>
                      <input type="hidden" name="groupId" value={group.id} />
                      <input type="hidden" name="userId" value={member.userId} />
                      <button type="submit" className="text-xs text-red-500 hover:text-red-700">
                        Sacar
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Paso 3: TypeScript check + tests**

```bash
cd /Users/mariano/Work/prode && npx tsc --noEmit 2>&1 | head -10
cd /Users/mariano/Work/prode && npm test 2>&1 | tail -5
```

- [ ] **Paso 4: Commit**

```bash
cd /Users/mariano/Work/prode && git add 'src/app/(protected)/admin/grupos/' && git commit -m "feat: add admin groups management page"
```

---

## Task 5: Admin usuarios

**Files:**
- Create: `src/app/(protected)/admin/usuarios/page.tsx`
- Create: `src/app/(protected)/admin/usuarios/actions.ts`

- [ ] **Paso 1: Crear `src/app/(protected)/admin/usuarios/actions.ts`**

```ts
'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { assertNotSelf } from '@/lib/admin'

async function requireSuperAdmin() {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) throw new Error('Acceso denegado')
  return session.user.id
}

export async function blockUser(formData: FormData) {
  const actingId = await requireSuperAdmin()
  const userId = z.string().cuid().parse(formData.get('userId'))
  assertNotSelf(actingId, userId, 'bloquearte')
  await prisma.user.update({ where: { id: userId }, data: { isBlocked: true } })
  revalidatePath('/admin/usuarios')
}

export async function unblockUser(formData: FormData) {
  await requireSuperAdmin()
  const userId = z.string().cuid().parse(formData.get('userId'))
  await prisma.user.update({ where: { id: userId }, data: { isBlocked: false } })
  revalidatePath('/admin/usuarios')
}

export async function toggleSuperAdmin(formData: FormData) {
  const actingId = await requireSuperAdmin()
  const userId = z.string().cuid().parse(formData.get('userId'))
  const currentValue = formData.get('currentValue') === 'true'
  assertNotSelf(actingId, userId, 'quitarte el super admin')
  await prisma.user.update({ where: { id: userId }, data: { isSuperAdmin: !currentValue } })
  revalidatePath('/admin/usuarios')
}
```

- [ ] **Paso 2: Crear `src/app/(protected)/admin/usuarios/page.tsx`**

```tsx
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import Image from 'next/image'
import { blockUser, unblockUser, toggleSuperAdmin } from './actions'

export default async function AdminUsuariosPage() {
  const session = await auth()

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      _count: { select: { memberships: true } },
    },
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Usuarios</h1>
      <p className="text-sm text-gray-500">{users.length} usuarios registrados</p>

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Grupos</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map(user => {
              const isSelf = user.id === session?.user?.id
              return (
                <tr key={user.id} className={user.isBlocked ? 'bg-red-50' : ''}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {user.image ? (
                        <Image src={user.image} alt={user.name ?? ''} width={28} height={28} className="rounded-full shrink-0" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gray-200 shrink-0 flex items-center justify-center text-xs text-gray-500">
                          {user.name?.[0] ?? '?'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium truncate">{user.name}</div>
                        <div className="text-xs text-gray-400 truncate">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{user._count.memberships}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {user.isBlocked && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Bloqueado</span>
                      )}
                      {user.isSuperAdmin && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Super Admin</span>
                      )}
                      {!user.isBlocked && !user.isSuperAdmin && (
                        <span className="text-xs text-gray-400">Activo</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {!isSelf && (
                        <>
                          {user.isBlocked ? (
                            <form action={unblockUser}>
                              <input type="hidden" name="userId" value={user.id} />
                              <button type="submit" className="text-xs text-green-600 hover:text-green-800">
                                Desbloquear
                              </button>
                            </form>
                          ) : (
                            <form action={blockUser}>
                              <input type="hidden" name="userId" value={user.id} />
                              <button type="submit" className="text-xs text-red-500 hover:text-red-700">
                                Bloquear
                              </button>
                            </form>
                          )}
                          <form action={toggleSuperAdmin}>
                            <input type="hidden" name="userId" value={user.id} />
                            <input type="hidden" name="currentValue" value={String(user.isSuperAdmin)} />
                            <button type="submit" className="text-xs text-blue-500 hover:text-blue-700">
                              {user.isSuperAdmin ? 'Quitar admin' : 'Hacer admin'}
                            </button>
                          </form>
                        </>
                      )}
                      {isSelf && <span className="text-xs text-gray-300">Vos</span>}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Paso 3: TypeScript check + tests**

```bash
cd /Users/mariano/Work/prode && npx tsc --noEmit 2>&1 | head -10
cd /Users/mariano/Work/prode && npm test 2>&1 | tail -5
```

- [ ] **Paso 4: Commit**

```bash
cd /Users/mariano/Work/prode && git add 'src/app/(protected)/admin/usuarios/' && git commit -m "feat: add admin users management page"
```

---

## Task 6: Admin pronósticos + ranking global

**Files:**
- Create: `src/app/(protected)/admin/pronosticos/page.tsx`
- Create: `src/app/(protected)/admin/pronosticos/actions.ts`

- [ ] **Paso 1: Crear `src/app/(protected)/admin/pronosticos/actions.ts`**

```ts
'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { scoreMatch } from '@/lib/scoring'

async function requireSuperAdmin() {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) throw new Error('Acceso denegado')
}

const editSchema = z.object({
  predictionId: z.string().cuid(),
  homeScore: z.coerce.number().int().min(0).max(99),
  awayScore: z.coerce.number().int().min(0).max(99),
  predictedWinnerId: z.string().cuid().optional().nullable(),
})

export async function editPrediction(formData: FormData) {
  await requireSuperAdmin()

  const parsed = editSchema.safeParse({
    predictionId: formData.get('predictionId'),
    homeScore: formData.get('homeScore'),
    awayScore: formData.get('awayScore'),
    predictedWinnerId: formData.get('predictedWinnerId') || null,
  })
  if (!parsed.success) throw new Error('Datos inválidos')

  const { predictionId, homeScore, awayScore, predictedWinnerId } = parsed.data

  const prediction = await prisma.prediction.update({
    where: { id: predictionId },
    data: { homeScore, awayScore, predictedWinnerId: predictedWinnerId ?? null, points: null },
    select: { matchId: true },
  })

  const match = await prisma.match.findUnique({
    where: { id: prediction.matchId },
    select: { status: true },
  })
  if (match?.status === 'FINISHED') {
    await scoreMatch(prediction.matchId)
  }

  revalidatePath('/admin/pronosticos')
}

export async function deletePrediction(formData: FormData) {
  await requireSuperAdmin()
  const predictionId = z.string().cuid().parse(formData.get('predictionId'))
  await prisma.prediction.delete({ where: { id: predictionId } })
  revalidatePath('/admin/pronosticos')
}
```

- [ ] **Paso 2: Crear `src/app/(protected)/admin/pronosticos/page.tsx`**

```tsx
import { prisma } from '@/lib/db'
import Image from 'next/image'
import { editPrediction, deletePrediction } from './actions'
import { MatchStage } from '@prisma/client'

const STAGE_LABELS: Record<MatchStage, string> = {
  GROUP: 'Grupos',
  ROUND_OF_32: 'R32',
  ROUND_OF_16: 'Octavos',
  QUARTER_FINAL: 'Cuartos',
  SEMI_FINAL: 'Semi',
  THIRD_PLACE: '3er Puesto',
  FINAL: 'Final',
}

export default async function AdminPronosticosPage({
  searchParams,
}: {
  searchParams: Promise<{ partido?: string }>
}) {
  const { partido } = await searchParams

  const matches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true },
    orderBy: { matchNumber: 'asc' },
  })

  const selectedMatch = partido ? matches.find(m => m.id === partido) ?? null : null

  const predictions = selectedMatch
    ? await prisma.prediction.findMany({
        where: { matchId: selectedMatch.id },
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: 'asc' },
      })
    : []

  // Global ranking
  const scoredPredictions = await prisma.prediction.findMany({
    where: { points: { not: null } },
    select: {
      userId: true,
      points: true,
      user: { select: { id: true, name: true, image: true } },
    },
  })

  const rankMap = new Map<string, { user: { id: string; name: string | null; image: string | null }; points: number; correctCount: number }>()
  for (const p of scoredPredictions) {
    const entry = rankMap.get(p.userId) ?? { user: p.user, points: 0, correctCount: 0 }
    entry.points += p.points ?? 0
    entry.correctCount += (p.points ?? 0) > 0 ? 1 : 0
    rankMap.set(p.userId, entry)
  }
  const ranking = Array.from(rankMap.values()).sort((a, b) => b.points - a.points || b.correctCount - a.correctCount)

  const isKnockout = selectedMatch && !['GROUP'].includes(selectedMatch.stage)

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Pronósticos</h1>

      {/* Match selector */}
      <div className="bg-white border rounded-xl p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Seleccioná un partido</label>
        <form method="GET">
          <select
            name="partido"
            defaultValue={partido ?? ''}
            className="border rounded-lg px-3 py-2 text-sm w-full max-w-lg"
          >
            <option value="">— Elegí un partido —</option>
            {matches.map(m => (
              <option key={m.id} value={m.id}>
                #{m.matchNumber} [{STAGE_LABELS[m.stage]}] {m.homeTeam?.name ?? 'TBD'} vs {m.awayTeam?.name ?? 'TBD'} ({m.status})
              </option>
            ))}
          </select>
          <button type="submit" className="ml-2 text-sm bg-gray-900 text-white px-3 py-2 rounded-lg hover:bg-gray-700">
            Ver
          </button>
        </form>
      </div>

      {/* Predictions for selected match */}
      {selectedMatch && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-700">
            #{selectedMatch.matchNumber} — {selectedMatch.homeTeam?.name ?? 'TBD'} vs {selectedMatch.awayTeam?.name ?? 'TBD'}
            {selectedMatch.homeScore !== null && ` (${selectedMatch.homeScore}-${selectedMatch.awayScore})`}
          </h2>
          {predictions.length === 0 ? (
            <p className="text-sm text-gray-400">Sin pronósticos para este partido.</p>
          ) : (
            <div className="bg-white border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pronóstico</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pts</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Editar / Eliminar</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {predictions.map(p => (
                    <tr key={p.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {p.user.image ? (
                            <Image src={p.user.image} alt={p.user.name ?? ''} width={24} height={24} className="rounded-full shrink-0" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-200 shrink-0 flex items-center justify-center text-xs text-gray-500">
                              {p.user.name?.[0] ?? '?'}
                            </div>
                          )}
                          <span className="truncate">{p.user.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono">{p.homeScore} - {p.awayScore}</td>
                      <td className="px-4 py-3">
                        {p.points !== null ? (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.points > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {p.points} pts
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <form action={editPrediction} className="flex items-center gap-1">
                            <input type="hidden" name="predictionId" value={p.id} />
                            <input type="number" name="homeScore" defaultValue={p.homeScore} min="0" max="99" className="w-10 border rounded px-1 py-0.5 text-center text-xs" />
                            <span className="text-gray-400 text-xs">-</span>
                            <input type="number" name="awayScore" defaultValue={p.awayScore} min="0" max="99" className="w-10 border rounded px-1 py-0.5 text-center text-xs" />
                            {isKnockout && (
                              <select name="predictedWinnerId" defaultValue={p.predictedWinnerId ?? ''} className="border rounded px-1 py-0.5 text-xs">
                                <option value="">Sin ganador</option>
                                {selectedMatch.homeTeam && <option value={selectedMatch.homeTeamId!}>{selectedMatch.homeTeam.name}</option>}
                                {selectedMatch.awayTeam && <option value={selectedMatch.awayTeamId!}>{selectedMatch.awayTeam.name}</option>}
                              </select>
                            )}
                            <button type="submit" className="text-xs bg-gray-800 text-white px-2 py-0.5 rounded hover:bg-gray-600">
                              ✓
                            </button>
                          </form>
                          <form action={deletePrediction}>
                            <input type="hidden" name="predictionId" value={p.id} />
                            <button type="submit" className="text-xs text-red-500 hover:text-red-700">
                              ✕
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Global ranking */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-700">Ranking global</h2>
        {ranking.length === 0 ? (
          <p className="text-sm text-gray-400">Aún no hay puntos asignados.</p>
        ) : (
          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-8">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participante</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pts</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Aciertos</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {ranking.map((entry, idx) => (
                  <tr key={entry.user.id}>
                    <td className="px-4 py-2 text-gray-400 font-medium">{idx + 1}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        {entry.user.image ? (
                          <Image src={entry.user.image} alt={entry.user.name ?? ''} width={24} height={24} className="rounded-full shrink-0" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-200 shrink-0 flex items-center justify-center text-xs text-gray-500">
                            {entry.user.name?.[0] ?? '?'}
                          </div>
                        )}
                        <span className="truncate">{entry.user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right font-bold tabular-nums">{entry.points}</td>
                    <td className="px-4 py-2 text-right text-gray-500 tabular-nums hidden sm:table-cell">{entry.correctCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Paso 3: TypeScript check**

```bash
cd /Users/mariano/Work/prode && npx tsc --noEmit 2>&1 | head -20
```

Esperado: 0 errores.

- [ ] **Paso 4: Tests**

```bash
cd /Users/mariano/Work/prode && npm test 2>&1 | tail -5
```

- [ ] **Paso 5: Commit**

```bash
cd /Users/mariano/Work/prode && git add 'src/app/(protected)/admin/pronosticos/' && git commit -m "feat: add admin predictions audit page with global ranking"
```

---

## Task 7: Enforcement de isBlocked en acciones existentes

**Files:**
- Modify: `src/app/(protected)/grupos/actions.ts`
- Modify: `src/app/(protected)/torneo/actions.ts`

- [ ] **Paso 1: Leer los archivos actuales**

```bash
cat '/Users/mariano/Work/prode/src/app/(protected)/grupos/actions.ts'
cat '/Users/mariano/Work/prode/src/app/(protected)/torneo/actions.ts'
```

- [ ] **Paso 2: Modificar `src/app/(protected)/grupos/actions.ts`**

Agregar import de `assertNotBlocked` y el check al inicio de `createGroup` y `joinGroup`, después del check de autenticación:

```ts
'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { validateGroupName, validateInviteCode } from '@/lib/grupos'
import { assertNotBlocked } from '@/lib/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createGroup(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isBlocked: true } })
  assertNotBlocked(user?.isBlocked ?? false)

  const name = validateGroupName(formData.get('name'))

  const group = await prisma.group.create({
    data: {
      name,
      ownerId: session.user.id,
      members: {
        create: { userId: session.user.id },
      },
    },
  })

  revalidatePath('/dashboard')
  redirect(`/grupos/${group.id}`)
}

export async function joinGroup(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isBlocked: true } })
  assertNotBlocked(user?.isBlocked ?? false)

  const code = validateInviteCode(formData.get('inviteCode'))

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

  revalidatePath('/dashboard')
  redirect(`/grupos/${group.id}`)
}
```

- [ ] **Paso 3: Modificar `src/app/(protected)/torneo/actions.ts`**

Agregar import de `assertNotBlocked` y el check después del auth check, antes del parse del schema:

```ts
'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { assertNotBlocked } from '@/lib/admin'

const predictionSchema = z.object({
  matchId: z.string().cuid(),
  homeScore: z.coerce.number().int().min(0).max(99),
  awayScore: z.coerce.number().int().min(0).max(99),
  predictedWinnerId: z.string().cuid().optional().nullable(),
})

export async function savePrediction(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isBlocked: true } })
  assertNotBlocked(user?.isBlocked ?? false)

  const parsed = predictionSchema.safeParse({
    matchId: formData.get('matchId'),
    homeScore: formData.get('homeScore'),
    awayScore: formData.get('awayScore'),
    predictedWinnerId: formData.get('predictedWinnerId') || null,
  })
  if (!parsed.success) throw new Error('Datos inválidos')

  const { matchId, homeScore, awayScore, predictedWinnerId } = parsed.data

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { scheduledAt: true, status: true },
  })
  if (!match) throw new Error('Partido no encontrado')
  if (match.status !== 'SCHEDULED') throw new Error('El pronóstico ya está cerrado')

  const lockTime = new Date(match.scheduledAt.getTime() - 60 * 1000)
  if (new Date() >= lockTime) throw new Error('El pronóstico ya está cerrado')

  await prisma.prediction.upsert({
    where: { userId_matchId: { userId: session.user.id, matchId } },
    update: { homeScore, awayScore, predictedWinnerId: predictedWinnerId ?? null, points: null },
    create: { userId: session.user.id, matchId, homeScore, awayScore, predictedWinnerId: predictedWinnerId ?? null },
  })

  revalidatePath('/torneo')
}
```

- [ ] **Paso 4: TypeScript check + lint + tests + build**

```bash
cd /Users/mariano/Work/prode && npx tsc --noEmit 2>&1 | head -10
cd /Users/mariano/Work/prode && npm run lint 2>&1 | tail -5
cd /Users/mariano/Work/prode && npm test 2>&1 | tail -5
cd /Users/mariano/Work/prode && npm run build 2>&1 | tail -15
```

Esperado: 0 errores, todos los tests pasan, build limpio.

- [ ] **Paso 5: Commit**

```bash
cd /Users/mariano/Work/prode && git add 'src/app/(protected)/grupos/actions.ts' 'src/app/(protected)/torneo/actions.ts' && git commit -m "feat: enforce isBlocked check in createGroup, joinGroup, savePrediction"
```

---

## Resultado de la Fase 5a

Al completar esta fase:

- ✅ Campo `isBlocked` en el schema, aplicado a Neon
- ✅ Helpers puros testeados (`assertNotBlocked`, `assertNotSelf`)
- ✅ Layout admin con nav secundaria (Partidos | Grupos | Usuarios | Pronósticos)
- ✅ Dashboard `/admin` con 5 métricas globales
- ✅ `/admin/grupos`: ver todos los grupos, eliminar (2 pasos), transferir ownership, sacar miembros
- ✅ `/admin/usuarios`: bloquear/desbloquear, hacer/quitar super admin, protección de self-action
- ✅ `/admin/pronosticos`: auditoría por partido, editar/eliminar pronósticos, ranking global
- ✅ Usuarios bloqueados no pueden crear grupos, unirse, ni cargar pronósticos

## Pendiente para Fase 5b

- Notificaciones email: recordatorio 1h antes del cierre + resumen diario (Resend + Vercel Cron)
- Visibilidad de pronósticos de otros participantes en la vista del grupo (después del cierre del partido)
