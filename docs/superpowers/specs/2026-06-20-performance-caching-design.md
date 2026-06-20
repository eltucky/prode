# Performance & Caching — Design Spec
**Date:** 2026-06-20  
**Goal:** Reduce TTFB from 4s+ to under 1s on all main screens via request deduplication, Next.js data caching, and removing the DB write from the torneo hot path.

---

## Problem Summary

Every page load currently hits Postgres for:
1. `auth()` — called in layout **and** page (2 DB round trips per request)
2. `getDictionary()` — called in layout **and** page (2 async imports per request)
3. Match queries — no caching, full re-fetch every visit
4. Prediction queries — no caching, full re-fetch every visit
5. `updateMany(SCHEDULED→IN_PROGRESS)` — a DB write that blocks every `/torneo` render even when nothing changes

---

## Design

### 1. Deduplicate `getDictionary()` with React `cache()`

**File:** `src/lib/i18n.ts`

Wrap `getDictionary` in React's `cache()`. Within a single request, any Server Component that calls it with the same locale gets the same promise — no second import.

```ts
import { cache } from 'react'
export const getDictionary = cache(async (locale: Locale): Promise<Dictionary> => {
  return dictionaries[locale]()
})
```

`auth()` from NextAuth v5 is already request-deduplicated internally, so no change needed there.

---

### 2. Cache match data with `unstable_cache` (60s TTL)

**File:** `src/lib/matches-cache.ts` (new)

Two cached fetchers, both tagged `'matches'`:

- `getCachedMatches(stageFilter?)` — returns matches with home/away teams
- `getCachedFilterableStages()` — returns distinct stages that have defined matches

Tag `'matches'` is revalidated by the `sync-results` cron via `revalidateTag('matches')`.

60s TTL means at most one DB hit per minute per unique query shape, regardless of traffic.

---

### 3. Cache per-user predictions with `unstable_cache` (60s TTL)

**File:** `src/lib/predictions-cache.ts` (new)

```ts
getCachedUserPredictions(userId: string, matchIds: string[])
```

Tagged `['predictions', userId]`. Revalidated in the prediction submit Server Action (`src/app/(protected)/torneo/actions.ts`) via `revalidateTag(\`predictions-${userId}\`)`.

60s TTL is a backstop; in practice the tag revalidation fires immediately on submit.

---

### 4. Move `updateMany` out of the torneo render path

**File:** `src/app/(shell)/torneo/page.tsx`

Replace the `await prisma.match.updateMany(...)` call with `after()` from Next.js:

```ts
import { after } from 'next/server'

after(async () => {
  await prisma.match.updateMany({
    where: { status: 'SCHEDULED', scheduledAt: { lt: new Date() } },
    data: { status: 'IN_PROGRESS' },
  })
  revalidateTag('matches') // invalidate cache so next visitor gets fresh status
})
```

This runs after the response is sent — zero TTFB impact. Because match data is cached 60s, this fires at most once per minute. No new cron jobs required; existing two crons are untouched.

---

### 5. Parallelize remaining sequential DB queries

**Torneo page:** `getCachedFilterableStages()` and `getCachedMatches()` can run in `Promise.all` since neither depends on the other's result.

**Grupos page (`grupos/page.tsx`):** Already uses `Promise.all` — no change needed.

**Grupos todos page (`grupos/todos/page.tsx`):** The three prediction queries already use `Promise.all` — no change needed. Add `unstable_cache` wrapper for the full standings data (60s, tag `'standings-todos'`), revalidated on prediction submit alongside the user predictions tag.

**Grupo [id] page (`grupos/[id]/page.tsx`):** The two initial queries already use `Promise.all`. Add caching for the predictions query (uses `['predictions', userId]` tag, same as torneo).

---

## Revalidation Map

| Tag | Revalidated when | Used by |
|-----|-----------------|---------|
| `'matches'` | `sync-results` cron runs; `after()` in torneo page | torneo page match queries |
| `'predictions-{userId}'` | User submits a prediction | torneo, grupo [id] prediction queries |
| `'standings-todos'` | User submits a prediction | grupos/todos standings |

---

## Files Changed

| File | Change |
|------|--------|
| `src/lib/i18n.ts` | Wrap `getDictionary` in `cache()` |
| `src/lib/matches-cache.ts` | New — `unstable_cache` match fetchers |
| `src/lib/predictions-cache.ts` | New — `unstable_cache` prediction fetcher |
| `src/app/(shell)/torneo/page.tsx` | Use cached fetchers; move `updateMany` into `after()` |
| `src/app/(protected)/grupos/todos/page.tsx` | Use cached standings fetcher |
| `src/app/(protected)/grupos/[id]/page.tsx` | Use cached prediction fetcher |
| `src/app/(protected)/torneo/actions.ts` | Add `revalidateTag` calls on prediction submit |
| `src/app/api/cron/sync-results/route.ts` | Add `revalidateTag('matches')` after sync |

---

## What We're NOT Doing

- No new cron jobs (Vercel Hobby tier constraint)
- No Streaming/Suspense changes (doesn't improve TTFB metrics)
- No changes to auth layer (NextAuth v5 already deduplicates `auth()`)
- No schema changes
- No changes to admin pages (low traffic)
