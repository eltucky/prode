# Match Detail Page

**Date:** 2026-06-10
**Status:** Approved

## Overview

Make match cards clickable from the tournament list, navigating to a dedicated match detail page. The page shows the match header and — once the match is locked — the list of participants from the user's social groups with prediction status and points.

## Route

`/torneo/[matchId]` under the `(shell)` route group (publicly accessible, no login required).

## MatchCard Changes

The header row (teams + score/vs + status badge + date) is wrapped in a `<Link href="/torneo/{match.id}">` with a small chevron (`›`) on the right to signal it's tappable. The prediction area below remains a separate section with its own interactive elements, unaffected.

## Page Layout

1. **Back link** → `/torneo` (same pattern as `/grupos/[id]`)
2. **Match header** — expanded version: team flags + names, result (`2 - 1`) or `vs`, status badge, scheduled date
3. **Participants section** — conditional on lock state and auth (see below)

## Participants Section

### Visibility rules

| Match state | Logged out | Logged in |
|---|---|---|
| Not locked yet | Hidden | Hidden |
| Locked + SCHEDULED | Login prompt | ✓/— per participant |
| IN_PROGRESS | Login prompt | Prediction scores |
| FINISHED | Login prompt | Prediction scores + points |
| POSTPONED | Login prompt | ✓/— per participant |
| CANCELLED | Hidden | Hidden |

"Login prompt" = short message with link to `/login`.

Locked = `Date.now() >= scheduledAt - LOCK_THRESHOLD_MS` (1 minute before kickoff).

### Prediction display per state

- **Locked + SCHEDULED / POSTPONED:** `✓` or `—` (loaded or not). Scores hidden.
- **IN_PROGRESS:** prediction score (e.g. `2 - 1`). For knockout matches, also show predicted winner in parentheses (e.g. `(ganador: Argentina)`). No points badge yet.
- **FINISHED:** prediction score + optional winner + points badge (e.g. `+3 pts`). If no prediction: `—`.
- **CANCELLED:** participants section not shown.

### Group selector

- **0 groups:** section not shown.
- **1 group:** participant list shown directly, no selector.
- **2+ groups:** tab/button selector (same style as stage filter in `/torneo`) using `?grupo=[groupId]` search param. Defaults to first group alphabetically. Invalid or missing param → defaults silently.

The selected `groupId` is validated against the user's own groups before querying — prevents peeking at groups the user doesn't belong to.

### Participant rows

- Avatar (image or initial fallback) + name
- Current user highlighted with green tint background (same as `/grupos/[id]` table)
- Order: alphabetical by name
- Shows all members of the selected group

## Data fetching

All server-side in the page component:

1. **Match** — `findUnique` with `homeTeam` + `awayTeam` includes. `notFound()` if missing.
2. **User's groups** (if locked + session) — `GroupMembership.findMany` for current user, including each group's members and their user records.
3. **Predictions** (if locked + session + valid group) — `Prediction.findMany` where `matchId = match.id` and `userId IN [member ids of selected group]`.

Queries 2 and 3 are skipped entirely if the match is not locked, avoiding unnecessary DB load.

## i18n

New keys needed in both `es.json` and `en.json` under a `matchDetail` namespace:

- `back` — back link label
- `loginToSeePrompt` — login prompt message
- `noPrediction` — "—" label or "Sin pronóstico"
- `groupSelectorLabel` — accessible label for group selector
- `loadedPrediction` — "Cargó" / "Loaded"
- `didNotLoad` — "No cargó" / "Didn't load"

## What this does NOT include

- Editing predictions from the detail page (done from `/torneo`)
- Admin actions
- Match statistics beyond score
