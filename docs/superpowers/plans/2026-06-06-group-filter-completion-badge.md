# Group Filter Completion Badge — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a small three-state color dot badge to each group filter pill in `/torneo`, showing whether the user's predictions for that group are complete, incomplete-but-actionable, or incomplete-but-locked.

**Architecture:** Pure helper function (`src/lib/group-status.ts`) computes a `Map<groupName, GroupStatus>` from existing in-memory data (no extra DB queries). The torneo server component calls it and injects a badge `<span>` inside each group pill `<a>` tag.

**Tech Stack:** Next.js 15 server component, Tailwind CSS, Prisma types, Vitest + Testing Library.

---

## File Map

| Action | File | Purpose |
|---|---|---|
| Create | `src/lib/group-status.ts` | Pure function: compute group status map |
| Create | `src/__tests__/group-status.test.ts` | Unit tests for the helper |
| Modify | `src/app/(shell)/torneo/page.tsx` | Import helper, compute map, render badges |

---

## Task 1: Group status helper + tests

**Files:**
- Create: `src/lib/group-status.ts`
- Create: `src/__tests__/group-status.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/group-status.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { computeGroupStatusMap } from '@/lib/group-status'

const future = (ms: number) => new Date(Date.now() + ms)
const past   = (ms: number) => new Date(Date.now() - ms)
const HOUR   = 60 * 60 * 1000

describe('computeGroupStatusMap', () => {
  it('returns complete when all group matches have predictions', () => {
    const matches = [
      { id: 'm1', stage: 'GROUP' as const, groupName: 'A', scheduledAt: future(HOUR) },
      { id: 'm2', stage: 'GROUP' as const, groupName: 'A', scheduledAt: future(HOUR) },
    ]
    const map = computeGroupStatusMap(matches, new Set(['m1', 'm2']))
    expect(map.get('A')).toBe('complete')
  })

  it('returns actionRequired when an unlocked match has no prediction', () => {
    const matches = [
      { id: 'm1', stage: 'GROUP' as const, groupName: 'A', scheduledAt: future(HOUR) },
      { id: 'm2', stage: 'GROUP' as const, groupName: 'A', scheduledAt: future(HOUR) },
    ]
    const map = computeGroupStatusMap(matches, new Set(['m1']))
    expect(map.get('A')).toBe('actionRequired')
  })

  it('returns missed when all unpredicted matches are locked', () => {
    const matches = [
      { id: 'm1', stage: 'GROUP' as const, groupName: 'A', scheduledAt: past(HOUR) },
      { id: 'm2', stage: 'GROUP' as const, groupName: 'A', scheduledAt: future(HOUR) },
    ]
    // m1 is locked + unpredicted, m2 is predicted → missed
    const map = computeGroupStatusMap(matches, new Set(['m2']))
    expect(map.get('A')).toBe('missed')
  })

  it('actionRequired wins over missed when group has both', () => {
    const matches = [
      { id: 'm1', stage: 'GROUP' as const, groupName: 'A', scheduledAt: past(HOUR) },  // locked, no pred
      { id: 'm2', stage: 'GROUP' as const, groupName: 'A', scheduledAt: future(HOUR) }, // unlocked, no pred
    ]
    const map = computeGroupStatusMap(matches, new Set())
    expect(map.get('A')).toBe('actionRequired')
  })

  it('handles multiple groups independently', () => {
    const matches = [
      { id: 'm1', stage: 'GROUP' as const, groupName: 'A', scheduledAt: future(HOUR) },
      { id: 'm2', stage: 'GROUP' as const, groupName: 'B', scheduledAt: future(HOUR) },
    ]
    const map = computeGroupStatusMap(matches, new Set(['m1']))
    expect(map.get('A')).toBe('complete')
    expect(map.get('B')).toBe('actionRequired')
  })

  it('ignores non-GROUP stage matches', () => {
    const matches = [
      { id: 'm1', stage: 'ROUND_OF_16' as const, groupName: null, scheduledAt: future(HOUR) },
    ]
    const map = computeGroupStatusMap(matches, new Set())
    expect(map.size).toBe(0)
  })

  it('ignores GROUP matches with null groupName', () => {
    const matches = [
      { id: 'm1', stage: 'GROUP' as const, groupName: null, scheduledAt: future(HOUR) },
    ]
    const map = computeGroupStatusMap(matches, new Set())
    expect(map.size).toBe(0)
  })

  it('returns empty map for empty input', () => {
    const map = computeGroupStatusMap([], new Set())
    expect(map.size).toBe(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/group-status.test.ts
```

Expected: all tests FAIL with "Cannot find module '@/lib/group-status'".

- [ ] **Step 3: Implement `src/lib/group-status.ts`**

```ts
import { MatchStage } from '@prisma/client'

export type GroupStatus = 'complete' | 'actionRequired' | 'missed'

const LOCK_THRESHOLD_MS = 60 * 1000

export function computeGroupStatusMap(
  matches: Array<{ id: string; stage: MatchStage; groupName: string | null; scheduledAt: Date }>,
  predMatchIds: Set<string>,
  now = Date.now()
): Map<string, GroupStatus> {
  const byGroup = new Map<string, typeof matches>()

  for (const match of matches) {
    if (match.stage !== 'GROUP' || !match.groupName) continue
    const list = byGroup.get(match.groupName) ?? []
    list.push(match)
    byGroup.set(match.groupName, list)
  }

  const result = new Map<string, GroupStatus>()

  for (const [groupName, groupMatches] of byGroup) {
    let hasActionRequired = false
    let hasMissedLocked = false

    for (const match of groupMatches) {
      if (predMatchIds.has(match.id)) continue
      const locked = now >= match.scheduledAt.getTime() - LOCK_THRESHOLD_MS
      if (locked) hasMissedLocked = true
      else hasActionRequired = true
    }

    if (!hasActionRequired && !hasMissedLocked) result.set(groupName, 'complete')
    else if (hasActionRequired) result.set(groupName, 'actionRequired')
    else result.set(groupName, 'missed')
  }

  return result
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/__tests__/group-status.test.ts
```

Expected: all 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/group-status.ts src/__tests__/group-status.test.ts
git commit -m "feat: add computeGroupStatusMap helper for group prediction completion"
```

---

## Task 2: Integrate badge into the torneo page

**Files:**
- Modify: `src/app/(shell)/torneo/page.tsx`

- [ ] **Step 1: Add import and badge color map at the top of the file**

After the existing imports (after line `import { MatchCard } from '@/components/match-card'`), add:

```ts
import { computeGroupStatusMap, type GroupStatus } from '@/lib/group-status'

const BADGE_COLORS: Record<GroupStatus, string> = {
  complete:      '#22c55e',
  actionRequired: '#ef4444',
  missed:        '#f59e0b',
}
```

- [ ] **Step 2: Compute `groupStatusMap` after `predMap`**

Find this line in the server component body (after `const predMap = new Map(...)`):

```ts
  const predMap = new Map(predictions.map(p => [p.matchId, p]))
```

Add immediately after:

```ts
  const groupStatusMap = session?.user?.id
    ? computeGroupStatusMap(matches, new Set(predMap.keys()))
    : new Map<string, GroupStatus>()
```

- [ ] **Step 3: Update the group filter pills to add badge**

Find the existing group pill map (around line 139):

```tsx
          {availableGroups.map(g => (
            <a
              key={g}
              href={groupFilterHref(stageFilter, grupo, g)}
              className={pillClass(grupoFilter === g)}
              style={{
                background: grupoFilter === g ? 'var(--accent)' : 'var(--surface-raised)',
                color: grupoFilter === g ? '#000' : 'var(--text-muted)',
              }}
            >
              {g}
            </a>
          ))}
```

Replace with:

```tsx
          {availableGroups.map(g => {
            const status = groupStatusMap.get(g)
            const badgeColor = status ? BADGE_COLORS[status] : undefined
            return (
              <a
                key={g}
                href={groupFilterHref(stageFilter, grupo, g)}
                className={`relative ${pillClass(grupoFilter === g)}`}
                style={{
                  background: grupoFilter === g ? 'var(--accent)' : 'var(--surface-raised)',
                  color: grupoFilter === g ? '#000' : 'var(--text-muted)',
                }}
              >
                {g}
                {badgeColor && (
                  <span
                    className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2"
                    style={{ background: badgeColor, borderColor: 'var(--bg)' }}
                  />
                )}
              </a>
            )
          })}
```

- [ ] **Step 4: Run the full test suite to check for regressions**

```bash
npx vitest run
```

Expected: all tests PASS (no regressions).

- [ ] **Step 5: Commit**

```bash
git add src/app/(shell)/torneo/page.tsx
git commit -m "feat: add group completion badge to group filter pills"
```
