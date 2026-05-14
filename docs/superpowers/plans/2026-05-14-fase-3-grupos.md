# Prode Mundial 2026 — Plan Fase 3: Grupos

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir crear grupos con nombre, compartir un código de invitación, unirse a grupos con ese código, y ver los participantes de cada grupo desde una página de detalle.

**Architecture:** Validación pura en `src/lib/grupos.ts` (testeable), Server Actions en `src/app/(protected)/grupos/actions.ts`, dashboard rediseñado con lista de grupos y formularios inline, página de detalle `/grupos/[id]` para ver miembros y el código de invitación. Todo Server Components — sin estado cliente.

**Tech Stack:** Next.js 16 Server Components + Server Actions, Prisma 6, Tailwind CSS v4

---

## Mapa de archivos

```
src/
├── lib/
│   └── grupos.ts                           — validateGroupName, validateInviteCode (puras, testeables)
├── __tests__/
│   └── grupos.test.ts                      — tests de las funciones de validación
└── app/
    └── (protected)/
        ├── dashboard/
        │   └── page.tsx                    — Modify: lista de grupos + formularios crear/unirse
        └── grupos/
            ├── actions.ts                  — createGroup, joinGroup (Server Actions)
            └── [id]/
                └── page.tsx               — Detalle del grupo: miembros + código de invitación
```

---

## Task 1: Validación pura + tests

**Files:**
- Create: `src/lib/grupos.ts`
- Create: `src/__tests__/grupos.test.ts`

- [ ] **Paso 1: Escribir el test**

```ts
// src/__tests__/grupos.test.ts
import { describe, it, expect } from 'vitest'
import { validateGroupName, validateInviteCode } from '@/lib/grupos'

describe('validateGroupName', () => {
  it('retorna el nombre trimmeado si es válido', () => {
    expect(validateGroupName('  Los Pibes  ')).toBe('Los Pibes')
  })

  it('lanza error si está vacío', () => {
    expect(() => validateGroupName('')).toThrow('El nombre no puede estar vacío')
    expect(() => validateGroupName('   ')).toThrow('El nombre no puede estar vacío')
  })

  it('lanza error si supera 50 caracteres', () => {
    expect(() => validateGroupName('a'.repeat(51))).toThrow('superar 50 caracteres')
  })

  it('acepta exactamente 50 caracteres', () => {
    expect(validateGroupName('a'.repeat(50))).toBe('a'.repeat(50))
  })
})

describe('validateInviteCode', () => {
  it('retorna el código trimmeado si no está vacío', () => {
    expect(validateInviteCode('  abc123  ')).toBe('abc123')
  })

  it('lanza error si está vacío', () => {
    expect(() => validateInviteCode('')).toThrow('Ingresá un código de invitación')
    expect(() => validateInviteCode('   ')).toThrow('Ingresá un código de invitación')
  })
})
```

- [ ] **Paso 2: Correr el test — debe fallar**

```bash
cd /Users/mariano/Work/prode && npm test -- src/__tests__/grupos.test.ts 2>&1 | tail -10
```

Esperado: FAIL (cannot find module '@/lib/grupos')

- [ ] **Paso 3: Crear `src/lib/grupos.ts`**

```ts
export function validateGroupName(name: unknown): string {
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('El nombre no puede estar vacío')
  }
  if (name.trim().length > 50) {
    throw new Error('El nombre no puede superar 50 caracteres')
  }
  return name.trim()
}

export function validateInviteCode(code: unknown): string {
  if (typeof code !== 'string' || code.trim().length === 0) {
    throw new Error('Ingresá un código de invitación')
  }
  return code.trim()
}
```

- [ ] **Paso 4: Correr el test — debe pasar**

```bash
cd /Users/mariano/Work/prode && npm test -- src/__tests__/grupos.test.ts 2>&1 | tail -10
```

Esperado: PASS (6 tests)

- [ ] **Paso 5: Commit**

```bash
cd /Users/mariano/Work/prode && git add src/lib/grupos.ts src/__tests__/grupos.test.ts && git commit -m "feat: add group name and invite code validation helpers"
```

---

## Task 2: Server Actions (`src/app/(protected)/grupos/actions.ts`)

**Files:**
- Create: `src/app/(protected)/grupos/actions.ts`

- [ ] **Paso 1: Crear el directorio y el archivo**

```bash
mkdir -p /Users/mariano/Work/prode/src/app/\(protected\)/grupos
```

Crear `src/app/(protected)/grupos/actions.ts`:

```ts
'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { validateGroupName, validateInviteCode } from '@/lib/grupos'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createGroup(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

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

- [ ] **Paso 2: Run TypeScript check**

```bash
cd /Users/mariano/Work/prode && npx tsc --noEmit 2>&1 | head -20
```

Esperado: 0 errores.

- [ ] **Paso 3: Run todos los tests**

```bash
cd /Users/mariano/Work/prode && npm test 2>&1 | tail -5
```

Esperado: todos los tests pasan.

- [ ] **Paso 4: Commit**

```bash
cd /Users/mariano/Work/prode && git add 'src/app/(protected)/grupos/actions.ts' && git commit -m "feat: add createGroup and joinGroup server actions"
```

---

## Task 3: Dashboard rediseñado

**Files:**
- Modify: `src/app/(protected)/dashboard/page.tsx`

- [ ] **Paso 1: Reemplazar `src/app/(protected)/dashboard/page.tsx`**

```tsx
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { createGroup, joinGroup } from '../grupos/actions'

export default async function DashboardPage() {
  const session = await auth()

  const memberships = await prisma.groupMember.findMany({
    where: { userId: session!.user!.id },
    include: {
      group: {
        include: {
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Mis grupos</h1>
        <p className="text-gray-500 text-sm mt-1">Bienvenido, {session?.user?.name}</p>
      </div>

      {memberships.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {memberships.map(({ group }) => (
            <Link
              key={group.id}
              href={`/grupos/${group.id}`}
              className="bg-white border rounded-xl px-5 py-4 hover:shadow-sm transition-shadow"
            >
              <div className="font-semibold text-gray-900 truncate">{group.name}</div>
              <div className="text-sm text-gray-400 mt-1">
                {group._count.members}{' '}
                {group._count.members === 1 ? 'participante' : 'participantes'}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white border rounded-xl p-10 text-center">
          <div className="text-4xl mb-3">🏆</div>
          <p className="text-gray-600 font-medium">Todavía no pertenecés a ningún grupo</p>
          <p className="text-gray-400 text-sm mt-1">
            Creá uno o pedile a alguien el código de invitación
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold mb-3">Crear grupo</h2>
          <form action={createGroup} className="flex gap-2">
            <input
              name="name"
              type="text"
              placeholder="Nombre del grupo"
              required
              maxLength={50}
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
            <button
              type="submit"
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 shrink-0"
            >
              Crear
            </button>
          </form>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold mb-3">Unirse con código</h2>
          <form action={joinGroup} className="flex gap-2">
            <input
              name="inviteCode"
              type="text"
              placeholder="Código de invitación"
              required
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
            <button
              type="submit"
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 shrink-0"
            >
              Unirse
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Paso 2: Run TypeScript check**

```bash
cd /Users/mariano/Work/prode && npx tsc --noEmit 2>&1 | head -20
```

Esperado: 0 errores.

- [ ] **Paso 3: Commit**

```bash
cd /Users/mariano/Work/prode && git add 'src/app/(protected)/dashboard/page.tsx' && git commit -m "feat: redesign dashboard with groups list and create/join forms"
```

---

## Task 4: Página de detalle del grupo

**Files:**
- Create: `src/app/(protected)/grupos/[id]/page.tsx`

- [ ] **Paso 1: Crear `src/app/(protected)/grupos/[id]/page.tsx`**

```tsx
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default async function GrupoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: true },
        orderBy: { joinedAt: 'asc' },
      },
    },
  })

  if (!group) notFound()

  const isMember = group.members.some(m => m.userId === session?.user?.id)
  if (!isMember) redirect('/dashboard')

  const isOwner = group.ownerId === session?.user?.id

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600">
            ← Mis grupos
          </Link>
          <h1 className="text-2xl font-bold mt-1">{group.name}</h1>
          <p className="text-sm text-gray-400">
            {group.members.length}{' '}
            {group.members.length === 1 ? 'participante' : 'participantes'}
          </p>
        </div>

        {isOwner && (
          <div className="bg-gray-50 border rounded-xl px-4 py-3">
            <p className="text-xs text-gray-400 mb-1">Código de invitación</p>
            <p className="font-mono text-sm font-medium text-gray-800 select-all">
              {group.inviteCode}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white border rounded-xl divide-y">
        {group.members.map(member => (
          <div key={member.id} className="flex items-center gap-3 px-4 py-3">
            {member.user.image ? (
              <Image
                src={member.user.image}
                alt={member.user.name ?? ''}
                width={36}
                height={36}
                className="rounded-full shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0 flex items-center justify-center text-sm font-medium text-gray-500">
                {member.user.name?.[0] ?? '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{member.user.name}</div>
              <div className="text-xs text-gray-400 truncate">{member.user.email}</div>
            </div>
            {group.ownerId === member.userId && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
                Admin
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Paso 2: Run lint y todos los tests**

```bash
cd /Users/mariano/Work/prode && npm run lint 2>&1 | tail -5
cd /Users/mariano/Work/prode && npm test 2>&1 | tail -5
```

Esperado: 0 errores, todos los tests pasan.

- [ ] **Paso 3: Build de producción**

```bash
cd /Users/mariano/Work/prode && npm run build 2>&1 | tail -20
```

Esperado: build limpio, sin errores TypeScript.

- [ ] **Paso 4: Commit**

```bash
cd /Users/mariano/Work/prode && git add 'src/app/(protected)/grupos/' && git commit -m "feat: add group detail page with members list and invite code"
```

---

## Resultado de la Fase 3

Al completar esta fase:

- ✅ Usuarios pueden crear grupos — pasan a ser admin y miembro automáticamente
- ✅ El código de invitación se muestra en la página del grupo (solo visible para el admin)
- ✅ Usuarios pueden unirse a grupos ingresando el código de invitación
- ✅ Unirse dos veces al mismo grupo no genera error (idempotente)
- ✅ El dashboard muestra todos los grupos del usuario con conteo de participantes
- ✅ La página del grupo muestra todos los participantes con avatar y badge de admin

## Pendiente para Fase 4

- Pronósticos: cargar y editar hasta 1 minuto antes del partido
- Motor de puntuación: calcular puntos por pronóstico al registrar resultado
- Tabla de posiciones dentro del grupo (puntos + cantidad de aciertos para desempate)
- Visibilidad de pronósticos de otros participantes solo después del cierre del partido
