# Design: Group Filter Completion Badge

**Date:** 2026-06-06
**File affected:** `src/app/(shell)/torneo/page.tsx`

## Summary

Add a small status dot badge to each group filter pill (A, B, C…) in the torneo page. The badge overlaps the bottom-right corner of the pill and communicates at a glance whether the user has completed their predictions for that group, missed some, or still has action to take.

## States

| State | Color | Condition |
|---|---|---|
| `complete` | Green `#22c55e` (`--accent`) | Every match in the group has a prediction |
| `actionRequired` | Red `#ef4444` | At least one unlocked match has no prediction |
| `missed` | Amber `#f59e0b` | Missing predictions exist, but all unpredicted matches are already locked |

Only shown for authenticated users. Without a session, no badge is rendered.

The "Todos" pill does not receive a badge.

## Data

Computed server-side in `torneo/page.tsx` from existing data — no new queries needed.

```
groupStatusMap: Map<groupName, 'complete' | 'actionRequired' | 'missed'>
```

For each group:
1. Collect all group matches from the already-fetched `matches` array.
2. For each match, check if `predMap` has a prediction.
3. For each unpredicted match, check `isLocked(match.scheduledAt)`.
4. Derive state:
   - All predicted → `complete`
   - Any unpredicted + unlocked → `actionRequired`
   - Unpredicted but all locked → `missed`

## Visual

The pill `<a>` tag gains `relative` positioning. Inside it, a `<span>` badge is rendered absolutely at `-bottom-1 -right-1`:

```tsx
<span
  className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2"
  style={{ background: badgeColor, borderColor: 'var(--bg)' }}
/>
```

- Size: `w-2.5 h-2.5` (10px)
- Border color: `var(--bg)` (`#0d0d0d`) — provides visual separation on both active (green) and inactive (dark) pill backgrounds
- No badge rendered when there is no session

## Scope

Single file change: `src/app/(shell)/torneo/page.tsx`.
