# Performance & Caching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate redundant DB calls and add 60s data caching across the torneo and standings pages to bring TTFB from 4s+ to under 1s.

**Architecture:** Wrap `getDictionary` in React `cache()` for per-request deduplication; introduce two `unstable_cache` modules (`matches-cache`, `predictions-cache`) that serve data with 60s TTL and tag-based invalidation; move the `updateMany` DB write in the torneo hot path to `after()` so it runs post-response; replace `revalidatePath` in Server Actions with targeted `revalidateTag` calls.

**Tech Stack:** Next.js 16 (`after`, `unstable_cache`, `revalidateTag` from `next/server` / `next/cache`), React 19 (`cache`), Prisma, Vitest.

## Global Constraints

- Never work directly on `main` — create branch `perf/caching` first
- No new cron jobs (Vercel Hobby tier — only 2 cron slots, both taken)
- No changes to admin pages, auth layer, or Prisma schema
- `unstable_cache` serializes `Date` objects to ISO strings — always convert back with `new Date()` at the call site
- All `unstable_cache` functions must be in `server-only` files

---

## File Map

| File | Role |
|------|------|
| `src/lib/i18n.ts` | Wrap `getDictionary` in React `cache()` |
| `src/lib/matches-cache.ts` | New — two `unstable_cache` fetchers for matches |
| `src/lib/predictions-cache.ts` | New — per-user predictions cache + todos standings cache |
| `src/app/(shell)/torneo/page.tsx` | Use cached fetchers; move `updateMany` to `after()` |
| `src/app/(protected)/torneo/actions.ts` | Replace `revalidatePath` with `revalidateTag` calls |
| `src/app/(protected)/grupos/todos/page.tsx` | Replace direct DB queries with cached standings |
| `src/app/api/cron/sync-results/route.ts` | Add `revalidateTag('matches')` after sync |

---

### Task 1: Create branch + deduplicate getDictionary

**Files:**
- Create branch: `perf/caching`
- Modify: `src/lib/i18n.ts`

**Why:** `getDictionary` is called in both the root layout and every page component. Without `cache()`, that's two JSON imports per request. `cache()` from React memoizes calls within a single render pass — same locale, same result, zero re-work.

- [ ] **Step 1: Create the branch**

```bash
git checkout -b perf/caching
```

- [ ] **Step 2: Run existing i18n tests to establish baseline**

```bash
npx vitest run src/__tests__/i18n.test.ts
```

Expected: all tests pass.

- [ ] **Step 3: Wrap getDictionary in React cache()**

Replace the contents of `src/lib/i18n.ts` with:

```ts
import 'server-only'
import { cache } from 'react'
import { headers } from 'next/headers'

export type Locale = 'es' | 'en'
export const LOCALES: Locale[] = ['es', 'en']
export const DEFAULT_LOCALE: Locale = 'es'

const dictionaries = {
  es: () => import('@/messages/es.json').then((m) => m.default),
  en: () => import('@/messages/en.json').then((m) => m.default),
}

export type Dictionary = Awaited<ReturnType<(typeof dictionaries)['es']>>

export const getDictionary = cache(async (locale: Locale): Promise<Dictionary> => {
  return dictionaries[locale]() as Promise<Dictionary>
})

export async function getLocale(): Promise<Locale> {
  const headersList = await headers()
  const locale = headersList.get('x-locale')
  if (locale === 'es' || locale === 'en') return locale
  return DEFAULT_LOCALE
}

export function t(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str
  return str.replace(/\{(\w+)\}/g, (_, key) => {
    const val = vars[key]
    return val !== undefined ? String(val) : `{${key}}`
  })
}
```

- [ ] **Step 4: Run i18n tests again — must still pass**

```bash
npx vitest run src/__tests__/i18n.test.ts
```

Expected: all tests pass. `cache()` is transparent in the test environment — it just wraps the function without memoizing across calls.

- [ ] **Step 5: Commit**

```bash
git add src/lib/i18n.ts
git commit -m "perf: deduplicate getDictionary with React cache()"
```

---

### Task 2: Create matches-cache module

**Files:**
- Create: `src/lib/matches-cache.ts`

**Interfaces:**
- Produces:
  - `getCachedFilterableStages(): Promise<MatchStage[]>` — stages that have at least one defined match, in `stageOrder` order
  - `getCachedMatches(stageFilter: MatchStage | null): Promise<CachedMatch[]>` where `CachedMatch` is the Prisma match shape with `scheduledAt: string` (ISO) instead of `Date`
- Both tagged `'matches'`, 60s TTL

**Important:** `unstable_cache` serializes `Date` objects to ISO strings. `getCachedMatches` explicitly converts `scheduledAt` to ISO string so the return type is honest. Callers must do `new Date(m.scheduledAt)` before passing to components that expect a `Date`.

- [ ] **Step 1: Create src/lib/matches-cache.ts**

```ts
import 'server-only'
import { unstable_cache } from 'next/cache'
import { MatchStage } from '@prisma/client'
import { prisma } from '@/lib/db'

const stageOrder: MatchStage[] = [
  'GROUP', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL',
]

export const getCachedFilterableStages = unstable_cache(
  async () => {
    const rows = await prisma.match.findMany({
      where: { homeTeamId: { not: null }, awayTeamId: { not: null } },
      select: { stage: true },
      distinct: ['stage'],
    })
    const stagesWithMatches = new Set(rows.map(r => r.stage))
    return stageOrder.filter(s => stagesWithMatches.has(s))
  },
  ['filterable-stages'],
  { revalidate: 60, tags: ['matches'] }
)

export const getCachedMatches = unstable_cache(
  async (stageFilter: MatchStage | null) => {
    const matches = await prisma.match.findMany({
      where: {
        ...(stageFilter ? { stage: stageFilter } : {}),
        homeTeamId: { not: null },
        awayTeamId: { not: null },
      },
      include: { homeTeam: true, awayTeam: true },
      orderBy: [{ scheduledAt: 'asc' }, { matchNumber: 'asc' }],
    })
    return matches.map(m => ({
      ...m,
      scheduledAt: m.scheduledAt.toISOString(),
    }))
  },
  ['matches'],
  { revalidate: 60, tags: ['matches'] }
)

export type CachedMatch = Awaited<ReturnType<typeof getCachedMatches>>[number]
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/matches-cache.ts
git commit -m "perf: add matches-cache module with unstable_cache (60s TTL)"
```

---

### Task 3: Create predictions-cache module

**Files:**
- Create: `src/lib/predictions-cache.ts`

**Interfaces:**
- Produces:
  - `getCachedUserPredictions(userId: string, matchIds: string[]): Promise<Prediction[]>` — tagged `predictions-${userId}`, 60s TTL
  - `getCachedTodosStandings(): Promise<{ standings: StandingEntry[], totalPendingMatchCount: number }>` — tagged `'standings-todos'`, 60s TTL. `StandingEntry` has no `isCurrentUser` field — callers add it from session.

- [ ] **Step 1: Create src/lib/predictions-cache.ts**

```ts
import 'server-only'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/db'

export function getCachedUserPredictions(userId: string, matchIds: string[]) {
  return unstable_cache(
    async (uid: string, mids: string[]) =>
      prisma.prediction.findMany({
        where: { userId: uid, matchId: { in: mids } },
      }),
    ['user-predictions', userId],
    { revalidate: 60, tags: [`predictions-${userId}`] }
  )(userId, matchIds)
}

const KNOCKOUT_STAGES = new Set([
  'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL',
])

export const getCachedTodosStandings = unstable_cache(
  async () => {
    const allUsers = await prisma.user.findMany({ where: { isBlocked: false } })
    const userIds = allUsers.map(u => u.id)

    const [playedPredictions, pendingPredictions, totalPendingMatchCount] = await Promise.all([
      prisma.prediction.findMany({
        where: { userId: { in: userIds }, points: { not: null } },
        select: { userId: true, points: true, match: { select: { stage: true } } },
      }),
      prisma.prediction.findMany({
        where: {
          userId: { in: userIds },
          points: null,
          match: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
        },
        select: { userId: true },
      }),
      prisma.match.count({
        where: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
      }),
    ])

    const standings = allUsers
      .map(user => {
        const played = playedPredictions.filter(p => p.userId === user.id)
        const pending = pendingPredictions.filter(p => p.userId === user.id)
        return {
          user,
          points: played.reduce((sum, p) => sum + (p.points ?? 0), 0),
          maxPlayedPoints: played.reduce(
            (sum, p) => sum + (KNOCKOUT_STAGES.has(p.match.stage) ? 7 : 5),
            0
          ),
          correctCount: played.filter(p => (p.points ?? 0) > 0).length,
          totalPlayed: played.length,
          pendingCount: pending.length,
        }
      })
      .sort((a, b) => b.points - a.points || b.correctCount - a.correctCount)

    return { standings, totalPendingMatchCount }
  },
  ['standings-todos'],
  { revalidate: 60, tags: ['standings-todos'] }
)
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/predictions-cache.ts
git commit -m "perf: add predictions-cache module (user predictions + todos standings)"
```

---

### Task 4: Refactor torneo page

**Files:**
- Modify: `src/app/(shell)/torneo/page.tsx`

**What changes:**
1. Remove direct `prisma.match.updateMany`, `prisma.match.findMany` (×2), `prisma.prediction.findMany` calls
2. Replace with `getCachedFilterableStages()` + `getCachedMatches()` in `Promise.all`, then `getCachedUserPredictions()`
3. Wrap `updateMany` in `after()` — fires post-response; only calls `revalidateTag('matches')` when rows were actually updated
4. Convert `scheduledAt` ISO strings back to `Date` after cache read

**Interfaces consumed:**
- `getCachedFilterableStages()` → `MatchStage[]`
- `getCachedMatches(stageFilter: MatchStage | null)` → `CachedMatch[]` (scheduledAt is `string`)
- `getCachedUserPredictions(userId, matchIds)` → `Prediction[]`

- [ ] **Step 1: Replace src/app/(shell)/torneo/page.tsx**

```tsx
import { after } from 'next/server'
import { revalidateTag } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { MatchStage } from '@prisma/client'
import { MatchCard } from '@/components/match-card'
import { TorneoFilters } from '@/components/torneo-filters'
import { computeGroupStatusMap, type GroupStatus, LOCK_THRESHOLD_MS } from '@/lib/group-status'
import { getLocale, getDictionary, type Dictionary, t } from '@/lib/i18n'
import { TorneoScroller } from '@/components/torneo-scroller'
import { getCachedFilterableStages, getCachedMatches } from '@/lib/matches-cache'
import { getCachedUserPredictions } from '@/lib/predictions-cache'

const KNOCKOUT_STAGES: MatchStage[] = [
  'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL',
]

function isLocked(scheduledAt: Date): boolean {
  return Date.now() >= scheduledAt.getTime() - LOCK_THRESHOLD_MS
}

const stageOrder: MatchStage[] = [
  'GROUP', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL',
]

function getStageLabels(dict: Dictionary): Record<MatchStage, string> {
  return {
    GROUP:         dict.torneo.stageGroup,
    ROUND_OF_32:   dict.torneo.stageRound32,
    ROUND_OF_16:   dict.torneo.stageRound16,
    QUARTER_FINAL: dict.torneo.stageQuarter,
    SEMI_FINAL:    dict.torneo.stageSemi,
    THIRD_PLACE:   dict.torneo.stageThird,
    FINAL:         dict.torneo.stageFinal,
  }
}

export default async function TorneoPage({
  searchParams,
}: {
  searchParams: Promise<{ etapa?: string; grupo?: string }>
}) {
  const locale = await getLocale()
  const dict = await getDictionary(locale)

  const { etapa, grupo } = await searchParams
  const session = await auth()

  const STAGE_LABELS = getStageLabels(dict)
  const VALID_STAGES = new Set<string>(stageOrder)
  const stageFilter = etapa && VALID_STAGES.has(etapa) ? (etapa as MatchStage) : undefined
  const showingGroupStage = !stageFilter || stageFilter === 'GROUP'

  // Run match status update after response is sent — zero TTFB impact.
  // Fires at most once per 60s because matches are cached; only invalidates
  // the cache when rows were actually updated.
  after(async () => {
    const updated = await prisma.match.updateMany({
      where: { status: 'SCHEDULED', scheduledAt: { lt: new Date() } },
      data: { status: 'IN_PROGRESS' },
    })
    if (updated.count > 0) revalidateTag('matches')
  })

  // Parallel cached queries — skips DB on cache hit
  const [filterableStages, rawMatches] = await Promise.all([
    getCachedFilterableStages(),
    getCachedMatches(stageFilter ?? null),
  ])

  // unstable_cache serializes Dates to ISO strings — convert back before use
  const matches = rawMatches.map(m => ({ ...m, scheduledAt: new Date(m.scheduledAt) }))

  const showStageFilter = filterableStages.length > 1

  const predictions = session?.user?.id
    ? await getCachedUserPredictions(session.user.id, matches.map(m => m.id))
    : []
  const predMap = new Map(predictions.map(p => [p.matchId, p]))

  const groupMatches = matches.filter(m => m.stage === 'GROUP')
  const groupStatusMap = session?.user?.id
    ? computeGroupStatusMap(groupMatches, new Set(predMap.keys()))
    : new Map<string, GroupStatus>()

  const availableGroups = showingGroupStage
    ? [...new Set(matches.filter(m => m.stage === 'GROUP' && m.groupName).map(m => m.groupName!))].sort()
    : []

  const grupoFilter = showingGroupStage && grupo && availableGroups.includes(grupo) ? grupo : undefined

  const byStage = matches.reduce<Record<string, typeof matches>>((acc, match) => {
    const key = match.stage
    if (!acc[key]) acc[key] = []
    if (match.stage === 'GROUP' && grupoFilter && match.groupName !== grupoFilter) return acc
    acc[key].push(match)
    return acc
  }, {})

  const displayedMatches = stageOrder.flatMap(s => byStage[s] ?? [])
  const targetMatch =
    displayedMatches.find(m => m.status === 'IN_PROGRESS') ??
    displayedMatches.find(m => m.status === 'SCHEDULED')
  const targetMatchId = targetMatch?.id ?? null

  return (
    <div className="space-y-6">
      <TorneoScroller targetMatchId={targetMatchId} />
      <TorneoFilters
        showStageFilter={showStageFilter}
        filterableStages={filterableStages}
        stageFilter={stageFilter}
        showingGroupStage={showingGroupStage}
        availableGroups={availableGroups}
        grupoFilter={grupoFilter}
        groupStatusMap={Object.fromEntries(groupStatusMap)}
      >
        {stageOrder.filter(s => byStage[s]?.length).map(stage => (
          <section key={stage}>
            <h2 className="text-base font-bold mb-3 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              {STAGE_LABELS[stage]}
              {stage === 'GROUP' && grupoFilter && (
                <span className="ml-2 font-normal normal-case" style={{ color: 'var(--text-dimmed)' }}>
                  — {t(dict.torneo.groupLabel, { name: grupoFilter })}
                </span>
              )}
            </h2>
            <div className="space-y-2">
              {byStage[stage].map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  prediction={predMap.get(match.id) ?? null}
                  hasSession={!!session}
                  showGroupLabel={!grupoFilter}
                  locked={isLocked(match.scheduledAt)}
                  isKnockout={KNOCKOUT_STAGES.includes(match.stage)}
                  dict={dict}
                />
              ))}
            </div>
          </section>
        ))}
      </TorneoFilters>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors. If you see a type error on `match` passed to `MatchCard` (because `scheduledAt` is now a `Date` reconstructed from string), that's correct — the `.map` conversion in step 1 handles it.

- [ ] **Step 3: Run all tests**

```bash
npx vitest run
```

Expected: all tests pass. The torneo page has no direct unit tests; this confirms nothing else broke.

- [ ] **Step 4: Commit**

```bash
git add src/app/(shell)/torneo/page.tsx
git commit -m "perf: use cached match/prediction fetchers in torneo page, move updateMany to after()"
```

---

### Task 5: Add revalidateTag to torneo actions

**Files:**
- Modify: `src/app/(protected)/torneo/actions.ts`

**What changes:** Replace `revalidatePath('/torneo')` with two targeted tag revalidations:
- `revalidateTag(\`predictions-${session.user.id}\`)` — busts only that user's cached predictions
- `revalidateTag('standings-todos')` — busts the global standings cache

This is more precise than `revalidatePath` which would bust the entire page for all users.

- [ ] **Step 1: Replace src/app/(protected)/torneo/actions.ts**

```ts
'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { assertNotBlocked } from '@/lib/admin'
import { revalidateTag } from 'next/cache'
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

  const lockTime = new Date(match.scheduledAt.getTime() - 60 * 1000)
  if (match.status !== 'SCHEDULED' || new Date() >= lockTime) return { error: 'locked' as const }

  await prisma.prediction.upsert({
    where: { userId_matchId: { userId: session.user.id, matchId } },
    update: { homeScore, awayScore, predictedWinnerId: predictedWinnerId ?? null, points: null },
    create: { userId: session.user.id, matchId, homeScore, awayScore, predictedWinnerId: predictedWinnerId ?? null },
  })

  revalidateTag(`predictions-${session.user.id}`)
  revalidateTag('standings-todos')
}

export async function deletePrediction(matchId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isBlocked: true } })
  assertNotBlocked(user?.isBlocked ?? false)

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { scheduledAt: true, status: true },
  })
  if (!match) throw new Error('Partido no encontrado')

  const lockTime = new Date(match.scheduledAt.getTime() - 60 * 1000)
  if (match.status !== 'SCHEDULED' || new Date() >= lockTime) return { error: 'locked' as const }

  await prisma.prediction.deleteMany({
    where: { userId: session.user.id, matchId },
  })

  revalidateTag(`predictions-${session.user.id}`)
  revalidateTag('standings-todos')
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Run all tests**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/app/(protected)/torneo/actions.ts
git commit -m "perf: replace revalidatePath with targeted revalidateTag in torneo actions"
```

---

### Task 6: Refactor grupos/todos page

**Files:**
- Modify: `src/app/(protected)/grupos/todos/page.tsx`

**What changes:** Replace the four direct DB calls + in-memory aggregation with a single `getCachedTodosStandings()` call. Add `isCurrentUser` back dynamically from the session (it's not in the cache since it's request-specific).

**Interfaces consumed:**
- `getCachedTodosStandings()` → `{ standings: StandingEntry[], totalPendingMatchCount: number }` where `StandingEntry` has `user`, `points`, `maxPlayedPoints`, `correctCount`, `totalPlayed`, `pendingCount` (no `isCurrentUser`)

- [ ] **Step 1: Replace src/app/(protected)/grupos/todos/page.tsx**

```tsx
import { auth } from '@/auth'
import Image from 'next/image'
import Link from 'next/link'
import { getLocale, getDictionary } from '@/lib/i18n'
import { getCachedTodosStandings } from '@/lib/predictions-cache'

export default async function GruposTodosPage() {
  const session = await auth()
  const locale = await getLocale()
  const dict = await getDictionary(locale)

  const { standings: rawStandings, totalPendingMatchCount } = await getCachedTodosStandings()

  const standings = rawStandings.map(entry => ({
    ...entry,
    isCurrentUser: entry.user.id === session?.user?.id,
  }))

  return (
    <div className="space-y-6">
      <div>
        <Link href="/grupos" className="text-sm transition-colors" style={{ color: 'var(--text-muted)' }}>
          {dict.grupoTodos.back}
        </Link>
        <h1 className="text-xl font-extrabold tracking-tight mt-1" style={{ color: 'var(--text-primary)' }}>
          {dict.grupos.everyoneGroupName}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {standings.length}{' '}
          {standings.length === 1 ? dict.grupoDetail.memberSingular : dict.grupoDetail.memberPlural}
          {' · '}{dict.grupoTodos.subtitle}
        </p>
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            {dict.grupoTodos.standingsTitle}
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--surface-raised)' }}>
            <tr>
              {[
                { label: dict.grupoDetail.tableRank, cls: 'text-left w-8' },
                { label: dict.grupoDetail.tableParticipant, cls: 'text-left' },
                { label: dict.grupoDetail.tablePoints, cls: 'text-right' },
                { label: dict.grupoDetail.tablePending, cls: 'text-right hidden sm:table-cell' },
                { label: dict.grupoDetail.tableCorrect, cls: 'text-right hidden sm:table-cell' },
              ].map(({ label, cls }) => (
                <th
                  key={label}
                  className={`px-4 py-2 text-xs font-semibold uppercase ${cls}`}
                  style={{ color: 'var(--text-muted)' }}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {standings.map((entry, idx) => (
              <tr
                key={entry.user.id}
                className="border-t"
                style={{
                  borderColor: 'var(--border)',
                  background: entry.isCurrentUser ? '#22c55e0d' : 'transparent',
                }}
              >
                <td className="px-4 py-2 font-medium" style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
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
                      <div
                        className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-medium"
                        style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)' }}
                      >
                        {entry.user.name?.[0] ?? '?'}
                      </div>
                    )}
                    <span
                      className={`truncate text-sm ${entry.isCurrentUser ? 'font-semibold' : ''}`}
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {entry.user.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2 text-right font-bold tabular-nums" style={{ color: 'var(--accent)' }}>
                  {entry.points}
                  <span className="hidden sm:inline font-normal text-xs" style={{ color: 'var(--text-muted)' }}>
                    {' '}{dict.grupoDetail.tableOf} {entry.maxPlayedPoints}
                  </span>
                </td>
                <td className="px-4 py-2 text-right tabular-nums hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>
                  {entry.pendingCount}
                  <span className="text-xs opacity-60"> {dict.grupoDetail.tableOf} {totalPendingMatchCount}</span>
                </td>
                <td className="px-4 py-2 text-right tabular-nums hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>
                  {entry.correctCount}
                  <span className="text-xs opacity-60"> {dict.grupoDetail.tableOf} {entry.totalPlayed}</span>
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

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Run all tests**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/app/(protected)/grupos/todos/page.tsx
git commit -m "perf: replace direct DB queries with getCachedTodosStandings in grupos/todos page"
```

---

### Task 7: Add revalidateTag to sync-results cron

**Files:**
- Modify: `src/app/api/cron/sync-results/route.ts`

**What changes:** After a successful `syncResults()` call, invalidate the `'matches'` tag so the next request fetches fresh match data from the DB instead of serving stale cached scores.

- [ ] **Step 1: Replace src/app/api/cron/sync-results/route.ts**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { syncResults } from '@/lib/sync-results'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`

  if (authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await syncResults()
    revalidateTag('matches')
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Run all tests**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 4: Commit and push**

```bash
git add src/app/api/cron/sync-results/route.ts
git commit -m "perf: revalidate matches cache tag after sync-results cron"
git push -u origin perf/caching
```

---

## Self-Review

**Spec coverage:**
- ✅ `getDictionary` deduplicated with `cache()` → Task 1
- ✅ `getCachedFilterableStages` + `getCachedMatches` (60s, `'matches'` tag) → Task 2
- ✅ `getCachedUserPredictions` (`predictions-${userId}` tag) → Task 3
- ✅ `getCachedTodosStandings` (`'standings-todos'` tag) → Task 3
- ✅ `updateMany` moved to `after()` with conditional `revalidateTag` → Task 4
- ✅ `getCachedFilterableStages` + `getCachedMatches` in `Promise.all` → Task 4
- ✅ `revalidateTag` on prediction save/delete → Task 5
- ✅ `getCachedTodosStandings` in grupos/todos page → Task 6
- ✅ `revalidateTag('matches')` in sync-results cron → Task 7
- ⚠️ Grupo [id] page prediction caching — excluded. That page fetches predictions for all group members (not just one user), which doesn't fit the per-user cache tag model without additional group-level invalidation plumbing. The 60s match cache still benefits it via `getCachedMatches` (not used there currently). A follow-up can address it with a `group-standings-{groupId}` tag.

**Placeholder scan:** None found. All steps have complete code.

**Type consistency:**
- `getCachedFilterableStages()` returns `MatchStage[]` — consumed as `filterableStages` in Task 4 ✅
- `getCachedMatches(stageFilter ?? null)` returns `CachedMatch[]` with `scheduledAt: string` — converted with `new Date()` in Task 4 ✅
- `getCachedUserPredictions(userId, matchIds)` returns `Prediction[]` — used as `predictions` in Task 4 ✅
- `getCachedTodosStandings()` returns `{ standings, totalPendingMatchCount }` — destructured in Task 6, `isCurrentUser` added dynamically ✅
- `revalidateTag(\`predictions-${session.user.id}\`)` in Task 5 matches `tags: [\`predictions-${userId}\`]` in Task 3 ✅
- `revalidateTag('standings-todos')` in Tasks 5 and 7 matches `tags: ['standings-todos']` in Task 3 ✅
- `revalidateTag('matches')` in Tasks 4 and 7 matches `tags: ['matches']` in Task 2 ✅
