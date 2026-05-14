# Prode Mundial 2026 — Plan Fase 4: Pronósticos y Puntuación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir cargar pronósticos en la vista del torneo, calcular puntos automáticamente al registrar resultados, y mostrar la tabla de posiciones dentro de cada grupo.

**Architecture:** Motor de puntuación puro en `src/lib/scoring.ts` (testeable, sin DB). `scoreMatch` aplica el motor a todos los pronósticos de un partido en la DB. `savePrediction` Server Action valida el cierre (1 min antes del partido). La vista del torneo muestra formularios inline para partidos no cerrados y el pronóstico propio para los cerrados. La tabla de posiciones en el grupo agrega puntos en tiempo real desde las predicciones almacenadas. El scoring se dispara desde el admin action y desde el cron sync.

**Tech Stack:** Next.js 16 Server Components + Server Actions, Prisma 6, Vitest, Tailwind CSS v4

---

## Mapa de archivos

```
src/
├── lib/
│   └── scoring.ts                           — calculatePoints (pura), scoreMatch (DB)
├── __tests__/
│   └── scoring.test.ts                      — 10 tests del motor de puntuación
└── app/
    └── (protected)/
        ├── torneo/
        │   ├── page.tsx                     — Modify: formularios de pronóstico inline
        │   └── actions.ts                   — Create: savePrediction Server Action
        ├── grupos/
        │   └── [id]/
        │       └── page.tsx                — Modify: agregar tabla de posiciones
        └── admin/
            └── partidos/
                └── actions.ts             — Modify: updateMatchResult dispara scoreMatch
src/
└── lib/
    └── sync-results.ts                      — Modify: syncResults dispara scoreMatch
```

---

## Task 1: Motor de puntuación + tests

**Files:**
- Create: `src/lib/scoring.ts`
- Create: `src/__tests__/scoring.test.ts`

**Esquema de puntos (del spec):**

| Situación | Puntos |
|---|---|
| Resultado incorrecto | 0 |
| Resultado correcto, no exacto | 2 |
| + Marcador local coincide (requiere outcome correcto) | +1 |
| + Marcador visitante coincide (requiere outcome correcto) | +1 |
| Resultado exacto (ambos marcadores) | **3+1+1=5** |
| + Ganador eliminatoria acertado | +2 |

Nota clave: el resultado exacto da base **3** (no 2) + 1 + 1 = 5 total.

- [ ] **Paso 1: Escribir el test**

```ts
// src/__tests__/scoring.test.ts
import { describe, it, expect } from 'vitest'
import { calculatePoints } from '@/lib/scoring'
import { MatchStage } from '@prisma/client'

const baseMatch = {
  homeScore: 2,
  awayScore: 1,
  winnerId: 'home-id',
  stage: 'GROUP' as MatchStage,
  homeTeamId: 'home-id',
  awayTeamId: 'away-id',
}

describe('calculatePoints — fase de grupos', () => {
  it('retorna null si el partido no tiene resultado', () => {
    expect(calculatePoints(
      { homeScore: 2, awayScore: 1, predictedWinnerId: null },
      { ...baseMatch, homeScore: null, awayScore: null, winnerId: null }
    )).toBeNull()
  })

  it('retorna 0 si el resultado es incorrecto (ganador equivocado)', () => {
    expect(calculatePoints(
      { homeScore: 2, awayScore: 0, predictedWinnerId: null },
      { ...baseMatch, homeScore: 1, awayScore: 2, winnerId: 'away-id' }
    )).toBe(0)
  })

  it('retorna 0 si predijo empate pero ganó alguien', () => {
    expect(calculatePoints(
      { homeScore: 1, awayScore: 1, predictedWinnerId: null },
      { ...baseMatch, homeScore: 2, awayScore: 1, winnerId: 'home-id' }
    )).toBe(0)
  })

  it('retorna 2 si el resultado es correcto pero no exacto', () => {
    expect(calculatePoints(
      { homeScore: 1, awayScore: 0, predictedWinnerId: null },
      { ...baseMatch, homeScore: 2, awayScore: 0, winnerId: 'home-id' }
    )).toBe(2)
  })

  it('retorna 3 si el resultado es correcto y un marcador coincide', () => {
    // Predicted: 2-0, Actual: 2-1 — home score matches
    expect(calculatePoints(
      { homeScore: 2, awayScore: 0, predictedWinnerId: null },
      { ...baseMatch, homeScore: 2, awayScore: 1, winnerId: 'home-id' }
    )).toBe(3)
  })

  it('retorna 5 si el resultado es exacto', () => {
    expect(calculatePoints(
      { homeScore: 2, awayScore: 1, predictedWinnerId: null },
      { ...baseMatch, homeScore: 2, awayScore: 1, winnerId: 'home-id' }
    )).toBe(5)
  })

  it('retorna 5 si el empate es exacto', () => {
    expect(calculatePoints(
      { homeScore: 1, awayScore: 1, predictedWinnerId: null },
      { ...baseMatch, homeScore: 1, awayScore: 1, winnerId: null }
    )).toBe(5)
  })
})

describe('calculatePoints — rondas eliminatorias', () => {
  const knockoutMatch = {
    ...baseMatch,
    stage: 'ROUND_OF_16' as MatchStage,
    homeScore: 1,
    awayScore: 1,
    winnerId: 'home-id',
  }

  it('agrega +2 si acertó el ganador final (total: 7 pts con resultado exacto)', () => {
    expect(calculatePoints(
      { homeScore: 1, awayScore: 1, predictedWinnerId: 'home-id' },
      knockoutMatch
    )).toBe(7)
  })

  it('no agrega +2 si no acertó el ganador final', () => {
    expect(calculatePoints(
      { homeScore: 1, awayScore: 1, predictedWinnerId: 'away-id' },
      knockoutMatch
    )).toBe(5)
  })

  it('no agrega +2 si predictedWinnerId es null en eliminatoria', () => {
    expect(calculatePoints(
      { homeScore: 1, awayScore: 1, predictedWinnerId: null },
      knockoutMatch
    )).toBe(5)
  })
})
```

- [ ] **Paso 2: Correr el test — debe fallar**

```bash
cd /Users/mariano/Work/prode && npm test -- src/__tests__/scoring.test.ts 2>&1 | tail -10
```

Esperado: FAIL (cannot find module '@/lib/scoring')

- [ ] **Paso 3: Crear `src/lib/scoring.ts`**

```ts
import { prisma } from '@/lib/db'
import { MatchStage } from '@prisma/client'

type Outcome = 'home' | 'away' | 'draw'

function getOutcome(home: number, away: number): Outcome {
  if (home > away) return 'home'
  if (away > home) return 'away'
  return 'draw'
}

const KNOCKOUT_STAGES: MatchStage[] = [
  'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL',
]

export function calculatePoints(
  prediction: { homeScore: number; awayScore: number; predictedWinnerId: string | null },
  match: {
    homeScore: number | null
    awayScore: number | null
    winnerId: string | null
    stage: MatchStage
    homeTeamId: string | null
    awayTeamId: string | null
  }
): number | null {
  if (match.homeScore === null || match.awayScore === null) return null

  const actualOutcome = getOutcome(match.homeScore, match.awayScore)
  const predictedOutcome = getOutcome(prediction.homeScore, prediction.awayScore)

  if (actualOutcome !== predictedOutcome) return 0

  const isExact = prediction.homeScore === match.homeScore && prediction.awayScore === match.awayScore
  const base = isExact ? 3 : 2
  const homeBonus = prediction.homeScore === match.homeScore ? 1 : 0
  const awayBonus = prediction.awayScore === match.awayScore ? 1 : 0

  let points = base + homeBonus + awayBonus

  if (
    KNOCKOUT_STAGES.includes(match.stage) &&
    prediction.predictedWinnerId &&
    prediction.predictedWinnerId === match.winnerId
  ) {
    points += 2
  }

  return points
}

export async function scoreMatch(matchId: string): Promise<void> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      homeScore: true,
      awayScore: true,
      winnerId: true,
      stage: true,
      homeTeamId: true,
      awayTeamId: true,
      status: true,
    },
  })

  if (!match || match.status !== 'FINISHED') return

  const predictions = await prisma.prediction.findMany({ where: { matchId } })

  for (const prediction of predictions) {
    const points = calculatePoints(prediction, match)
    if (points !== null) {
      await prisma.prediction.update({
        where: { id: prediction.id },
        data: { points },
      })
    }
  }
}
```

- [ ] **Paso 4: Correr el test — debe pasar**

```bash
cd /Users/mariano/Work/prode && npm test -- src/__tests__/scoring.test.ts 2>&1 | tail -10
```

Esperado: PASS (10 tests)

- [ ] **Paso 5: Correr toda la suite**

```bash
cd /Users/mariano/Work/prode && npm test 2>&1 | tail -5
```

- [ ] **Paso 6: Commit**

```bash
cd /Users/mariano/Work/prode && git add src/lib/scoring.ts src/__tests__/scoring.test.ts && git commit -m "feat: add scoring engine with calculatePoints and scoreMatch"
```

---

## Task 2: Server Action para guardar pronósticos

**Files:**
- Create: `src/app/(protected)/torneo/actions.ts`

- [ ] **Paso 1: Crear `src/app/(protected)/torneo/actions.ts`**

```ts
'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const predictionSchema = z.object({
  matchId: z.string().cuid(),
  homeScore: z.coerce.number().int().min(0).max(99),
  awayScore: z.coerce.number().int().min(0).max(99),
  predictedWinnerId: z.string().cuid().optional().nullable(),
})

export async function savePrediction(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

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

- [ ] **Paso 2: TypeScript check**

```bash
cd /Users/mariano/Work/prode && npx tsc --noEmit 2>&1 | head -10
```

Esperado: 0 errores.

- [ ] **Paso 3: Correr toda la suite**

```bash
cd /Users/mariano/Work/prode && npm test 2>&1 | tail -5
```

- [ ] **Paso 4: Commit**

```bash
cd /Users/mariano/Work/prode && git add 'src/app/(protected)/torneo/actions.ts' && git commit -m "feat: add savePrediction server action with lock time enforcement"
```

---

## Task 3: Vista del torneo con formularios de pronóstico

**Files:**
- Modify: `src/app/(protected)/torneo/page.tsx`

La página carga las predicciones del usuario actual y las muestra inline junto a cada partido. Para partidos no cerrados: formulario editable. Para partidos cerrados: predicción read-only + puntos si ya se calcularon.

- [ ] **Paso 1: Leer el archivo actual**

```bash
cat '/Users/mariano/Work/prode/src/app/(protected)/torneo/page.tsx'
```

- [ ] **Paso 2: Reemplazar `src/app/(protected)/torneo/page.tsx`**

```tsx
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { MatchStage, MatchStatus } from '@prisma/client'
import { savePrediction } from './actions'

const STAGE_LABELS: Record<MatchStage, string> = {
  GROUP: 'Fase de Grupos',
  ROUND_OF_32: 'Ronda de 32',
  ROUND_OF_16: 'Octavos',
  QUARTER_FINAL: 'Cuartos',
  SEMI_FINAL: 'Semifinales',
  THIRD_PLACE: 'Tercer Puesto',
  FINAL: 'Final',
}

const STATUS_BADGE: Record<MatchStatus, { label: string; class: string }> = {
  SCHEDULED:   { label: 'Programado', class: 'bg-gray-100 text-gray-600' },
  IN_PROGRESS: { label: 'En juego',   class: 'bg-yellow-100 text-yellow-700' },
  FINISHED:    { label: 'Finalizado', class: 'bg-green-100 text-green-700' },
  POSTPONED:   { label: 'Postergado', class: 'bg-red-100 text-red-700' },
  CANCELLED:   { label: 'Cancelado',  class: 'bg-red-200 text-red-800' },
}

const KNOCKOUT_STAGES: MatchStage[] = [
  'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL',
]

function isLocked(scheduledAt: Date): boolean {
  return Date.now() >= scheduledAt.getTime() - 60 * 1000
}

export default async function TorneoPage({
  searchParams,
}: {
  searchParams: Promise<{ etapa?: string }>
}) {
  const { etapa } = await searchParams
  const session = await auth()
  const stageFilter = etapa as MatchStage | undefined

  const matches = await prisma.match.findMany({
    where: stageFilter ? { stage: stageFilter } : undefined,
    include: { homeTeam: true, awayTeam: true },
    orderBy: [{ scheduledAt: 'asc' }, { matchNumber: 'asc' }],
  })

  const predictions = await prisma.prediction.findMany({
    where: {
      userId: session!.user!.id,
      matchId: { in: matches.map(m => m.id) },
    },
  })
  const predMap = new Map(predictions.map(p => [p.matchId, p]))

  const byStage = matches.reduce<Record<string, typeof matches>>((acc, match) => {
    const key = match.stage
    if (!acc[key]) acc[key] = []
    acc[key].push(match)
    return acc
  }, {})

  const stageOrder: MatchStage[] = [
    'GROUP', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL',
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Torneo</h1>
        <div className="flex gap-2 flex-wrap">
          <a href="/torneo" className={`text-sm px-3 py-1 rounded-full border ${!stageFilter ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 hover:bg-gray-50'}`}>
            Todos
          </a>
          {stageOrder.map(stage => (
            <a
              key={stage}
              href={`/torneo?etapa=${stage}`}
              className={`text-sm px-3 py-1 rounded-full border ${stageFilter === stage ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 hover:bg-gray-50'}`}
            >
              {STAGE_LABELS[stage]}
            </a>
          ))}
        </div>
      </div>

      {stageOrder.filter(s => byStage[s]?.length).map(stage => (
        <section key={stage}>
          <h2 className="text-lg font-semibold mb-3 text-gray-700">{STAGE_LABELS[stage]}</h2>
          <div className="space-y-2">
            {byStage[stage].map(match => {
              const badge = STATUS_BADGE[match.status]
              const locked = isLocked(match.scheduledAt)
              const prediction = predMap.get(match.id)
              const isKnockout = KNOCKOUT_STAGES.includes(match.stage)

              return (
                <div key={match.id} className="bg-white border rounded-xl px-4 py-3 space-y-2">
                  {/* Match header */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col min-w-0">
                      {match.groupName && (
                        <span className="text-xs text-gray-400 mb-0.5">Grupo {match.groupName}</span>
                      )}
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium truncate">
                          {match.homeTeam ? `${match.homeTeam.flag} ${match.homeTeam.name}` : 'TBD'}
                        </span>
                        <span className="text-sm font-bold tabular-nums text-gray-700 shrink-0">
                          {match.status === 'FINISHED'
                            ? `${match.homeScore} - ${match.awayScore}`
                            : 'vs'}
                        </span>
                        <span className="text-sm font-medium truncate">
                          {match.awayTeam ? `${match.awayTeam.flag} ${match.awayTeam.name}` : 'TBD'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0 gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${badge.class}`}>
                        {badge.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {match.scheduledAt.toLocaleDateString('es-AR', {
                          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Prediction area */}
                  {match.status === 'CANCELLED' ? null : locked ? (
                    prediction ? (
                      <div className="flex items-center gap-2 text-sm border-t pt-2 flex-wrap">
                        <span className="text-gray-400 text-xs">Tu pronóstico:</span>
                        <span className="font-mono font-medium">
                          {prediction.homeScore} - {prediction.awayScore}
                        </span>
                        {isKnockout && prediction.predictedWinnerId && (
                          <span className="text-xs text-gray-500">
                            {'(ganador: '}
                            {prediction.predictedWinnerId === match.homeTeamId
                              ? match.homeTeam?.name
                              : match.awayTeam?.name}
                            {')'}
                          </span>
                        )}
                        {prediction.points !== null && (
                          <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${prediction.points > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {prediction.points} pts
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 border-t pt-2">Sin pronóstico</div>
                    )
                  ) : (
                    <form action={savePrediction} className="flex items-center gap-2 border-t pt-2 flex-wrap">
                      <input type="hidden" name="matchId" value={match.id} />
                      <span className="text-xs text-gray-400 shrink-0">Tu pronóstico:</span>
                      <input
                        type="number"
                        name="homeScore"
                        defaultValue={prediction?.homeScore ?? ''}
                        min="0"
                        max="99"
                        required
                        placeholder="L"
                        className="w-12 border rounded px-1 py-0.5 text-center text-sm"
                      />
                      <span className="text-gray-400">-</span>
                      <input
                        type="number"
                        name="awayScore"
                        defaultValue={prediction?.awayScore ?? ''}
                        min="0"
                        max="99"
                        required
                        placeholder="V"
                        className="w-12 border rounded px-1 py-0.5 text-center text-sm"
                      />
                      {isKnockout && match.homeTeam && match.awayTeam && (
                        <select
                          name="predictedWinnerId"
                          defaultValue={prediction?.predictedWinnerId ?? ''}
                          className="border rounded px-1 py-0.5 text-xs"
                        >
                          <option value="">Ganador...</option>
                          <option value={match.homeTeamId ?? ''}>{match.homeTeam.flag} {match.homeTeam.name}</option>
                          <option value={match.awayTeamId ?? ''}>{match.awayTeam.flag} {match.awayTeam.name}</option>
                        </select>
                      )}
                      <button
                        type="submit"
                        className="bg-gray-900 text-white px-3 py-0.5 rounded text-xs hover:bg-gray-700 shrink-0"
                      >
                        {prediction ? 'Actualizar' : 'Guardar'}
                      </button>
                    </form>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
```

- [ ] **Paso 3: TypeScript check**

```bash
cd /Users/mariano/Work/prode && npx tsc --noEmit 2>&1 | head -20
```

Esperado: 0 errores. Si hay error con `match.homeTeamId ?? ''` en el value del select (TypeScript puede quejarse de `string | null` en un value que espera string), cambiar esa línea a:

```tsx
<option value={match.homeTeamId!}>{match.homeTeam.flag} {match.homeTeam.name}</option>
<option value={match.awayTeamId!}>{match.awayTeam.flag} {match.awayTeam.name}</option>
```

(La guarda `match.homeTeam && match.awayTeam` garantiza que los IDs no son null.)

- [ ] **Paso 4: Correr lint y tests**

```bash
cd /Users/mariano/Work/prode && npm run lint 2>&1 | tail -5
cd /Users/mariano/Work/prode && npm test 2>&1 | tail -5
```

- [ ] **Paso 5: Commit**

```bash
cd /Users/mariano/Work/prode && git add 'src/app/(protected)/torneo/' && git commit -m "feat: add prediction forms to tournament view"
```

---

## Task 4: Tabla de posiciones en la página del grupo

**Files:**
- Modify: `src/app/(protected)/grupos/[id]/page.tsx`

Agregar tabla de standings calculada server-side sobre las predicciones con puntos ya asignados. El ranking ordena por puntos desc, desempate por cantidad de aciertos (partidos donde `points > 0`).

- [ ] **Paso 1: Leer el archivo actual**

```bash
cat '/Users/mariano/Work/prode/src/app/(protected)/grupos/[id]/page.tsx'
```

- [ ] **Paso 2: Reemplazar con versión con standings**

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

  // Standings: aggregate predictions with assigned points
  const memberIds = group.members.map(m => m.userId)
  const predictions = await prisma.prediction.findMany({
    where: { userId: { in: memberIds }, points: { not: null } },
    select: { userId: true, points: true },
  })

  const standings = group.members
    .map(m => {
      const memberPreds = predictions.filter(p => p.userId === m.userId)
      return {
        user: m.user,
        points: memberPreds.reduce((sum, p) => sum + (p.points ?? 0), 0),
        correctCount: memberPreds.filter(p => (p.points ?? 0) > 0).length,
        isCurrentUser: m.userId === session?.user?.id,
      }
    })
    .sort((a, b) => b.points - a.points || b.correctCount - a.correctCount)

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

      {/* Standings table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b">
          <h2 className="font-semibold text-sm text-gray-700">Tabla de posiciones</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-8">#</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Participante</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Pts</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Aciertos</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {standings.map((entry, idx) => (
              <tr key={entry.user.id} className={entry.isCurrentUser ? 'bg-blue-50' : ''}>
                <td className="px-4 py-2 text-gray-400 font-medium">{idx + 1}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    {entry.user.image ? (
                      <Image
                        src={entry.user.image}
                        alt={entry.user.name ?? ''}
                        width={24}
                        height={24}
                        className="rounded-full shrink-0"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-200 shrink-0 flex items-center justify-center text-xs font-medium text-gray-500">
                        {entry.user.name?.[0] ?? '?'}
                      </div>
                    )}
                    <span className={`truncate ${entry.isCurrentUser ? 'font-semibold' : ''}`}>
                      {entry.user.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2 text-right font-bold tabular-nums">{entry.points}</td>
                <td className="px-4 py-2 text-right text-gray-500 tabular-nums hidden sm:table-cell">
                  {entry.correctCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Members list */}
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

- [ ] **Paso 3: TypeScript check + lint + tests**

```bash
cd /Users/mariano/Work/prode && npx tsc --noEmit 2>&1 | head -10
cd /Users/mariano/Work/prode && npm run lint 2>&1 | tail -5
cd /Users/mariano/Work/prode && npm test 2>&1 | tail -5
```

- [ ] **Paso 4: Commit**

```bash
cd /Users/mariano/Work/prode && git add 'src/app/(protected)/grupos/[id]/page.tsx' && git commit -m "feat: add standings leaderboard to group detail page"
```

---

## Task 5: Conectar scoring a actualizaciones de resultados

**Files:**
- Modify: `src/app/(protected)/admin/partidos/actions.ts`
- Modify: `src/lib/sync-results.ts`

Cuando un partido se marca como FINISHED (manual o vía cron), llamar `scoreMatch` para calcular y persistir los puntos de todos los pronósticos de ese partido.

- [ ] **Paso 1: Leer los archivos actuales**

```bash
cat '/Users/mariano/Work/prode/src/app/(protected)/admin/partidos/actions.ts'
cat '/Users/mariano/Work/prode/src/lib/sync-results.ts'
```

- [ ] **Paso 2: Modificar `src/app/(protected)/admin/partidos/actions.ts`**

Agregar el import y la llamada a `scoreMatch` dentro de `updateMatchResult`. El archivo completo debe quedar así:

```ts
'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { MatchStatus } from '@prisma/client'
import { z } from 'zod'
import { scoreMatch } from '@/lib/scoring'

async function requireSuperAdmin() {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    throw new Error('Acceso denegado')
  }
}

const updateResultSchema = z.object({
  matchId: z.string().cuid(),
  homeScore: z.coerce.number().int().min(0),
  awayScore: z.coerce.number().int().min(0),
  status: z.enum(['FINISHED', 'SCHEDULED', 'POSTPONED', 'CANCELLED', 'IN_PROGRESS']),
  winnerId: z.string().cuid().optional().nullable(),
})

export async function updateMatchResult(formData: FormData) {
  await requireSuperAdmin()

  const parsed = updateResultSchema.safeParse({
    matchId: formData.get('matchId'),
    homeScore: formData.get('homeScore'),
    awayScore: formData.get('awayScore'),
    status: formData.get('status'),
    winnerId: formData.get('winnerId') || null,
  })

  if (!parsed.success) {
    throw new Error('Datos inválidos: ' + parsed.error.message)
  }

  const { matchId, homeScore, awayScore, status, winnerId } = parsed.data

  await prisma.match.update({
    where: { id: matchId },
    data: { homeScore, awayScore, status: status as MatchStatus, winnerId },
  })

  if (status === 'FINISHED') {
    await scoreMatch(matchId)
  }

  revalidatePath('/admin/partidos')
  revalidatePath('/torneo')
}

export async function triggerSync(): Promise<{ updated: number; linked: number }> {
  await requireSuperAdmin()
  const { syncResults } = await import('@/lib/sync-results')
  const result = await syncResults()
  revalidatePath('/admin/partidos')
  revalidatePath('/torneo')
  return result
}

export async function triggerSyncAction(_formData: FormData): Promise<void> {
  await triggerSync()
}
```

- [ ] **Paso 3: Modificar `src/lib/sync-results.ts`**

Leer el archivo actual primero. Agregar `import { scoreMatch } from '@/lib/scoring'` al inicio (después de los imports existentes) y llamar `await scoreMatch(localMatch.id)` dentro del bloque `if (matchStatus === 'FINISHED')`, inmediatamente después del `prisma.match.update`:

```ts
if (matchStatus === 'FINISHED') {
  const homeScore = fixture.score.fulltime.home
  const awayScore = fixture.score.fulltime.away
  const winnerId = determineWinnerId(
    homeScore,
    awayScore,
    localMatch.homeTeamId,
    localMatch.awayTeamId
  )

  await prisma.match.update({
    where: { id: localMatch.id },
    data: {
      status: 'FINISHED',
      homeScore: homeScore ?? undefined,
      awayScore: awayScore ?? undefined,
      winnerId: winnerId ?? undefined,
      scheduledAt: fixtureDate,
    },
  })
  await scoreMatch(localMatch.id)  // ← agregar esta línea
  updated++
}
```

- [ ] **Paso 4: TypeScript check + lint**

```bash
cd /Users/mariano/Work/prode && npx tsc --noEmit 2>&1 | head -10
cd /Users/mariano/Work/prode && npm run lint 2>&1 | tail -5
```

Esperado: 0 errores.

- [ ] **Paso 5: Correr toda la suite + build**

```bash
cd /Users/mariano/Work/prode && npm test 2>&1 | tail -5
cd /Users/mariano/Work/prode && npm run build 2>&1 | tail -15
```

Esperado: todos los tests pasan, build limpio.

- [ ] **Paso 6: Commit**

```bash
cd /Users/mariano/Work/prode && git add 'src/app/(protected)/admin/partidos/actions.ts' src/lib/sync-results.ts && git commit -m "feat: trigger score calculation on match result updates"
```

---

## Resultado de la Fase 4

Al completar esta fase:

- ✅ Motor de puntuación con 10 tests: 0/2/3/5 pts en grupos, +2 en eliminatorias, desempate por aciertos
- ✅ Usuarios pueden cargar y modificar pronósticos hasta 1 min antes del partido
- ✅ Vista del torneo: formularios inline para partidos no cerrados, pronóstico propio + puntos para los cerrados
- ✅ Tabla de posiciones en cada grupo: ranking por puntos con desempate por cantidad de aciertos
- ✅ Puntos calculados automáticamente al marcar resultado como FINISHED (admin manual y cron)

## Pendiente para Fase 5

- Notificaciones email: recordatorio 1h antes del cierre + resumen diario (Resend + Vercel Cron)
- Panel super admin: ver todos los grupos, eliminar usuarios de grupos, eliminar grupos, métricas
- Visibilidad de pronósticos de otros participantes en la vista del grupo (después del cierre)
