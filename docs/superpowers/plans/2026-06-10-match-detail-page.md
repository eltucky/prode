# Match Detail Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make match cards clickable, navigating to `/torneo/[matchId]` — a new detail page showing the match header and, once locked, participants from the user's social groups with prediction status and points.

**Architecture:** New server component page under `(shell)/torneo/[matchId]/page.tsx` (public — no login required). MatchCard header row wraps in a `<Link>`. Participants fetched server-side from the user's `GroupMember` records; group selection uses `?grupo=[id]` validated against the user's own groups so nobody can peek at groups they don't belong to.

**Tech Stack:** Next.js App Router (server components), Prisma ORM (`GroupMember`, `Prediction`), Auth.js, Tailwind CSS, Vitest + React Testing Library

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/messages/es.json` | Modify | Add `matchDetail` i18n namespace (ES) |
| `src/messages/en.json` | Modify | Add `matchDetail` i18n namespace (EN) |
| `src/components/match-card.tsx` | Modify | Wrap header row in `<Link>` to detail page + chevron |
| `src/__tests__/match-card.test.tsx` | Create | Test the new link in the header |
| `src/app/(shell)/torneo/[matchId]/page.tsx` | Create | Match detail server page |
| `src/app/(shell)/torneo/[matchId]/loading.tsx` | Create | Skeleton while page loads |

---

### Pre-task: Create branch

- [ ] **Create and switch to feature branch**

```bash
git checkout -b feat/match-detail-page
```

---

### Task 1: i18n — Add `matchDetail` keys

**Files:**
- Modify: `src/messages/es.json`
- Modify: `src/messages/en.json`

- [ ] **Step 1: Add `matchDetail` to `src/messages/es.json`**

Add the following object after the `"match"` entry (before `"prediction"`):

```json
"matchDetail": {
  "back": "← Volver al torneo",
  "loginToSeePrompt": "Iniciá sesión para ver los pronósticos →",
  "loadedPrediction": "Cargó",
  "didNotLoad": "No cargó",
  "noPrediction": "—"
},
```

- [ ] **Step 2: Add `matchDetail` to `src/messages/en.json`**

Add after the `"match"` entry (before `"prediction"`):

```json
"matchDetail": {
  "back": "← Back to tournament",
  "loginToSeePrompt": "Log in to see predictions →",
  "loadedPrediction": "Submitted",
  "didNotLoad": "No prediction",
  "noPrediction": "—"
},
```

- [ ] **Step 3: Commit**

```bash
git add src/messages/es.json src/messages/en.json
git commit -m "feat: add matchDetail i18n keys"
```

---

### Task 2: MatchCard — clickable header

**Files:**
- Modify: `src/components/match-card.tsx`
- Create: `src/__tests__/match-card.test.tsx`

The header row (`div.flex.items-center.justify-between.gap-4`) becomes a `<Link>` pointing to `/torneo/{match.id}`. A small `›` chevron is added below the date to signal the card is tappable. The prediction area below is unaffected.

**Note on `next/link` in tests:** The vitest config (see `vitest.config.ts`) already runs in jsdom. `next/link` renders as a standard `<a>` tag in this environment. No extra mocking needed. If for any reason Link throws about a missing router context, add a mock at `src/__mocks__/next-link.tsx` and register it in `vitest.config.ts` resolve aliases.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/match-card.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MatchCard } from '@/components/match-card'

const baseMatch = {
  id: 'match-1',
  stage: 'GROUP' as const,
  status: 'SCHEDULED' as const,
  scheduledAt: new Date('2026-06-15T18:00:00Z'),
  homeScore: null,
  awayScore: null,
  homeTeamId: 'team-a',
  awayTeamId: 'team-b',
  groupName: 'A',
  homeTeam: { flag: '🇦🇷', name: 'Argentina' },
  awayTeam: { flag: '🇧🇷', name: 'Brasil' },
}

const baseDict = {
  match: {
    statusScheduled: 'Programado',
    statusInProgress: 'En juego',
    statusFinished: 'Finalizado',
    statusPostponed: 'Postergado',
    statusCancelled: 'Cancelado',
    yourPrediction: 'Tu pronóstico:',
    noPrediction: 'Sin pronóstico',
    winner: 'ganador: {name}',
    loginToPredict: 'Iniciá sesión para hacer tu pronóstico →',
  },
  torneo: { groupLabel: 'Grupo {name}' },
} as any

describe('MatchCard', () => {
  it('renders a link to the match detail page in the header', () => {
    render(
      <MatchCard
        match={baseMatch}
        prediction={null}
        hasSession={false}
        showGroupLabel={false}
        locked={false}
        isKnockout={false}
        dict={baseDict}
      />
    )
    const link = screen.getByRole('link', { name: /argentina/i })
    expect(link).toHaveAttribute('href', '/torneo/match-1')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd /Users/mariano/Work/prode && npx vitest run src/__tests__/match-card.test.tsx 2>&1 | tail -20
```

Expected: FAIL — no link with `href="/torneo/match-1"` found.

- [ ] **Step 3: Modify `match-card.tsx` — replace the header div with a Link**

In `src/components/match-card.tsx`, replace the `{/* Header row */}` block (the outer `<div className="flex items-center justify-between gap-4">` and its closing `</div>`) with:

```tsx
{/* Header row — links to match detail */}
<Link
  href={`/torneo/${match.id}`}
  className="flex items-center justify-between gap-4"
>
  <div className="flex flex-col min-w-0">
    {showGroupLabel && match.groupName && (
      <span className="text-[10px] mb-0.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
        {dict.torneo.groupLabel.replace('{name}', match.groupName)}
      </span>
    )}
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
        {match.homeTeam ? `${match.homeTeam.flag} ${match.homeTeam.name}` : 'TBD'}
      </span>
      <span className="text-sm font-bold tabular-nums shrink-0" style={{ color: 'var(--text-muted)' }}>
        {match.status === 'FINISHED'
          ? `${match.homeScore} - ${match.awayScore}`
          : 'vs'}
      </span>
      <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
        {match.awayTeam ? `${match.awayTeam.flag} ${match.awayTeam.name}` : 'TBD'}
      </span>
    </div>
  </div>
  <div className="flex flex-col items-end shrink-0 gap-1">
    <span
      className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
      style={{ background: badge.bg, color: badge.color }}
    >
      {badge.label}
    </span>
    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
      <ClientDate iso={match.scheduledAt.toISOString()} />
    </span>
    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>›</span>
  </div>
</Link>
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd /Users/mariano/Work/prode && npx vitest run src/__tests__/match-card.test.tsx 2>&1 | tail -20
```

Expected: PASS

- [ ] **Step 5: Run all tests to check for regressions**

```bash
cd /Users/mariano/Work/prode && npx vitest run 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/match-card.tsx src/__tests__/match-card.test.tsx
git commit -m "feat: make match card header a link to detail page"
```

---

### Task 3: Match detail page — shell (header + back link)

**Files:**
- Create: `src/app/(shell)/torneo/[matchId]/page.tsx`

This task gets the route working with just the match header. Participants come in Task 5.

- [ ] **Step 1: Create the directory**

```bash
mkdir -p "src/app/(shell)/torneo/[matchId]"
```

- [ ] **Step 2: Create the page**

Create `src/app/(shell)/torneo/[matchId]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { ClientDate } from '@/components/client-date'
import { getLocale, getDictionary, t } from '@/lib/i18n'

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ matchId: string }>
  searchParams: Promise<{ grupo?: string }>
}) {
  const { matchId } = await params

  const locale = await getLocale()
  const dict = await getDictionary(locale)

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { homeTeam: true, awayTeam: true },
  })

  if (!match) notFound()

  const badge = {
    SCHEDULED:   { label: dict.match.statusScheduled,  bg: 'var(--surface-raised)', color: 'var(--text-muted)' },
    IN_PROGRESS: { label: dict.match.statusInProgress, bg: '#fbbf2422',             color: '#fbbf24' },
    FINISHED:    { label: dict.match.statusFinished,   bg: '#22c55e1a',             color: 'var(--accent)' },
    POSTPONED:   { label: dict.match.statusPostponed,  bg: '#ef44441a',             color: '#ef4444' },
    CANCELLED:   { label: dict.match.statusCancelled,  bg: '#ef44441a',             color: '#ef4444' },
  }[match.status]

  return (
    <div className="space-y-6">
      <Link href="/torneo" className="text-sm transition-colors" style={{ color: 'var(--text-muted)' }}>
        {dict.matchDetail.back}
      </Link>

      <div
        className="rounded-xl px-4 py-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {match.groupName && (
          <p className="text-[10px] uppercase tracking-wide mb-3 text-center" style={{ color: 'var(--text-muted)' }}>
            {t(dict.torneo.groupLabel, { name: match.groupName })}
          </p>
        )}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-3xl">{match.homeTeam?.flag ?? '🏴'}</span>
            <span className="text-sm font-semibold text-center" style={{ color: 'var(--text-primary)' }}>
              {match.homeTeam?.name ?? 'TBD'}
            </span>
          </div>
          <div className="flex flex-col items-center shrink-0 gap-1">
            <span className="text-xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
              {match.status === 'FINISHED' || match.status === 'IN_PROGRESS'
                ? `${match.homeScore} - ${match.awayScore}`
                : 'vs'}
            </span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background: badge.bg, color: badge.color }}
            >
              {badge.label}
            </span>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              <ClientDate iso={match.scheduledAt.toISOString()} />
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-3xl">{match.awayTeam?.flag ?? '🏴'}</span>
            <span className="text-sm font-semibold text-center" style={{ color: 'var(--text-primary)' }}>
              {match.awayTeam?.name ?? 'TBD'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles cleanly**

```bash
cd /Users/mariano/Work/prode && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(shell)/torneo/[matchId]/page.tsx"
git commit -m "feat: add match detail page shell with header"
```

---

### Task 4: Loading skeleton

**Files:**
- Create: `src/app/(shell)/torneo/[matchId]/loading.tsx`

- [ ] **Step 1: Create `loading.tsx`**

Create `src/app/(shell)/torneo/[matchId]/loading.tsx`:

```tsx
import { Skeleton } from '@/components/skeleton'

export default function MatchDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-28" />
      <div
        className="rounded-xl px-4 py-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex flex-col items-center gap-2">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex flex-col items-center gap-2 shrink-0">
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex-1 flex flex-col items-center gap-2">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(shell)/torneo/[matchId]/loading.tsx"
git commit -m "feat: add match detail loading skeleton"
```

---

### Task 5: Participants section — complete the page

**Files:**
- Modify: `src/app/(shell)/torneo/[matchId]/page.tsx`

Replace the entire file with the full version that includes the participants section. Visibility rules:

| Match state | Logged out | Logged in |
|---|---|---|
| Not locked + SCHEDULED | hidden | hidden |
| Locked + SCHEDULED | login prompt | ✓/— per member |
| IN_PROGRESS | login prompt | prediction score (+ knockout winner) |
| FINISHED | login prompt | prediction score + points badge |
| POSTPONED | login prompt | ✓/— per member |
| CANCELLED | hidden | hidden |

Group selector appears as pill tabs (same style as stage filter in `/torneo`) only when the user belongs to 2+ groups. Selected group comes from `?grupo=[id]`, validated against the user's own groups — defaults to the first group alphabetically if missing or invalid.

- [ ] **Step 1: Replace `src/app/(shell)/torneo/[matchId]/page.tsx` with the full version**

```tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { MatchStage } from '@prisma/client'
import { ClientDate } from '@/components/client-date'
import { LOCK_THRESHOLD_MS } from '@/lib/group-status'
import { getLocale, getDictionary, t } from '@/lib/i18n'

const KNOCKOUT_STAGES: MatchStage[] = [
  'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL',
]

function isLocked(scheduledAt: Date): boolean {
  return Date.now() >= scheduledAt.getTime() - LOCK_THRESHOLD_MS
}

export default async function MatchDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ matchId: string }>
  searchParams: Promise<{ grupo?: string }>
}) {
  const { matchId } = await params
  const { grupo } = await searchParams

  const locale = await getLocale()
  const dict = await getDictionary(locale)

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { homeTeam: true, awayTeam: true },
  })

  if (!match) notFound()

  const session = await auth()
  const locked = isLocked(match.scheduledAt)
  const showParticipants = locked && match.status !== 'CANCELLED'
  const isKnockout = KNOCKOUT_STAGES.includes(match.stage)

  const badge = {
    SCHEDULED:   { label: dict.match.statusScheduled,  bg: 'var(--surface-raised)', color: 'var(--text-muted)' },
    IN_PROGRESS: { label: dict.match.statusInProgress, bg: '#fbbf2422',             color: '#fbbf24' },
    FINISHED:    { label: dict.match.statusFinished,   bg: '#22c55e1a',             color: 'var(--accent)' },
    POSTPONED:   { label: dict.match.statusPostponed,  bg: '#ef44441a',             color: '#ef4444' },
    CANCELLED:   { label: dict.match.statusCancelled,  bg: '#ef44441a',             color: '#ef4444' },
  }[match.status]

  // Fetch user's groups only when the section will be shown
  type GroupWithMembers = {
    id: string
    name: string
    members: Array<{ userId: string; user: { id: string; name: string | null; image: string | null } }>
  }

  let userGroups: GroupWithMembers[] = []

  if (showParticipants && session?.user?.id) {
    const memberships = await prisma.groupMember.findMany({
      where: { userId: session.user.id },
      include: {
        group: {
          include: {
            members: { include: { user: true } },
          },
        },
      },
      orderBy: { group: { name: 'asc' } },
    })
    userGroups = memberships.map(m => m.group)
  }

  // Validate selected group — default to first alphabetically
  const validGroupId = userGroups.find(g => g.id === grupo)?.id ?? userGroups[0]?.id
  const selectedGroup = userGroups.find(g => g.id === validGroupId)

  // Fetch predictions for the selected group's members
  type PredictionRow = {
    homeScore: number
    awayScore: number
    predictedWinnerId: string | null
    points: number | null
  }
  let predMap = new Map<string, PredictionRow>()

  if (selectedGroup) {
    const memberIds = selectedGroup.members.map(m => m.userId)
    const preds = await prisma.prediction.findMany({
      where: { matchId: match.id, userId: { in: memberIds } },
    })
    predMap = new Map(preds.map(p => [p.userId, p]))
  }

  const sortedMembers = selectedGroup
    ? [...selectedGroup.members].sort((a, b) =>
        (a.user.name ?? '').localeCompare(b.user.name ?? '')
      )
    : []

  const showPredictionScore = match.status === 'IN_PROGRESS' || match.status === 'FINISHED'
  const showPoints = match.status === 'FINISHED'

  return (
    <div className="space-y-6">
      <Link href="/torneo" className="text-sm transition-colors" style={{ color: 'var(--text-muted)' }}>
        {dict.matchDetail.back}
      </Link>

      {/* Match header */}
      <div
        className="rounded-xl px-4 py-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {match.groupName && (
          <p className="text-[10px] uppercase tracking-wide mb-3 text-center" style={{ color: 'var(--text-muted)' }}>
            {t(dict.torneo.groupLabel, { name: match.groupName })}
          </p>
        )}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-3xl">{match.homeTeam?.flag ?? '🏴'}</span>
            <span className="text-sm font-semibold text-center" style={{ color: 'var(--text-primary)' }}>
              {match.homeTeam?.name ?? 'TBD'}
            </span>
          </div>
          <div className="flex flex-col items-center shrink-0 gap-1">
            <span className="text-xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
              {match.status === 'FINISHED' || match.status === 'IN_PROGRESS'
                ? `${match.homeScore} - ${match.awayScore}`
                : 'vs'}
            </span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background: badge.bg, color: badge.color }}
            >
              {badge.label}
            </span>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              <ClientDate iso={match.scheduledAt.toISOString()} />
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-3xl">{match.awayTeam?.flag ?? '🏴'}</span>
            <span className="text-sm font-semibold text-center" style={{ color: 'var(--text-primary)' }}>
              {match.awayTeam?.name ?? 'TBD'}
            </span>
          </div>
        </div>
      </div>

      {/* Participants section */}
      {showParticipants && (
        !session ? (
          <Link href="/login" className="text-sm" style={{ color: '#3b82f6' }}>
            {dict.matchDetail.loginToSeePrompt}
          </Link>
        ) : userGroups.length > 0 ? (
          <div className="space-y-3">
            {/* Group selector — only when user belongs to 2+ groups */}
            {userGroups.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {userGroups.map(g => {
                  const isActive = g.id === validGroupId
                  return (
                    <Link
                      key={g.id}
                      href={`/torneo/${match.id}?grupo=${g.id}`}
                      className="text-xs px-3 py-1.5 rounded-full font-medium"
                      style={{
                        background: isActive ? 'var(--accent)' : 'var(--surface-raised)',
                        color: isActive ? '#000' : 'var(--text-muted)',
                      }}
                    >
                      {g.name}
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Participant list */}
            {selectedGroup && (
              <div
                className="rounded-xl overflow-hidden"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                {sortedMembers.map((member, idx) => {
                  const isCurrentUser = member.userId === session.user!.id
                  const prediction = predMap.get(member.userId) ?? null

                  return (
                    <div
                      key={member.userId}
                      className="flex items-center gap-3 px-4 py-3"
                      style={{
                        borderTop: idx > 0 ? '1px solid var(--border)' : 'none',
                        background: isCurrentUser ? '#22c55e0d' : 'transparent',
                      }}
                    >
                      {member.user.image ? (
                        <Image
                          src={member.user.image}
                          alt={member.user.name ?? ''}
                          width={32}
                          height={32}
                          className="rounded-full shrink-0"
                        />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-medium"
                          style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)' }}
                        >
                          {member.user.name?.[0] ?? '?'}
                        </div>
                      )}

                      <span
                        className={`flex-1 text-sm truncate ${isCurrentUser ? 'font-semibold' : ''}`}
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {member.user.name}
                      </span>

                      <div className="flex items-center gap-2 shrink-0">
                        {!showPredictionScore ? (
                          prediction ? (
                            <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                              {dict.matchDetail.loadedPrediction}
                            </span>
                          ) : (
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {dict.matchDetail.didNotLoad}
                            </span>
                          )
                        ) : prediction ? (
                          <>
                            <span className="text-sm font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                              {prediction.homeScore} - {prediction.awayScore}
                            </span>
                            {isKnockout && prediction.predictedWinnerId && (
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {'('}
                                {t(dict.match.winner, {
                                  name: prediction.predictedWinnerId === match.homeTeamId
                                    ? (match.homeTeam?.name ?? '')
                                    : (match.awayTeam?.name ?? ''),
                                })}
                                {')'}
                              </span>
                            )}
                            {showPoints && prediction.points !== null && (
                              <span
                                className="text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{
                                  background: prediction.points > 0 ? '#22c55e1a' : 'var(--surface-raised)',
                                  color: prediction.points > 0 ? 'var(--accent)' : 'var(--text-muted)',
                                }}
                              >
                                {prediction.points > 0 ? '+' : ''}{prediction.points} pts
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {dict.matchDetail.noPrediction}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : null
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
cd /Users/mariano/Work/prode && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Run all tests**

```bash
cd /Users/mariano/Work/prode && npx vitest run 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(shell)/torneo/[matchId]/page.tsx"
git commit -m "feat: add participants section to match detail page"
```

- [ ] **Step 5: Push branch**

```bash
git push -u origin feat/match-detail-page
```

---

## Done

After all tasks complete:
- Match card headers are tappable links (with `›` chevron) pointing to `/torneo/[matchId]`
- The detail page shows an expanded match header (flags, score/vs, status badge, date)
- Once locked, logged-in users see participants from their social groups
- Users with 2+ groups get a tab selector; `?grupo=[id]` controls which group is shown
- Prediction visibility escalates: locked→✓/— · in-progress→scores · finished→scores+points
- Knockout winner shown inline when relevant
- Logged-out users see a login prompt instead of participant data
