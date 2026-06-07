# Invite Link — Design Spec

**Date:** 2026-06-07
**Status:** Approved

## Goal

Allow any user (registered or not) to join a group via a shareable link. The link is visible to all group members with a one-click copy button.

## Architecture

Three new files, one modified file. The `inviteCode` field already exists on the `Group` model (`String @unique @default(cuid())`), so no schema migration is needed.

| File | Status |
|---|---|
| `src/app/(shell)/invite/[code]/page.tsx` | New — public invite landing page |
| `src/app/(shell)/invite/[code]/actions.ts` | New — `joinViaInvite(code)` server action |
| `src/components/invite-copy-button.tsx` | New — client component for copy-to-clipboard |
| `src/app/(protected)/grupos/[id]/page.tsx` | Modified — replace raw code box with full invite URL + copy button, visible to all members |

The invite page lives in the `(shell)` route group (same as `/torneo` and `/reglas`) so it is accessible without authentication. The `(protected)/grupos` routes are unchanged except for the display update.

## Invite Page — `/invite/[code]`

The page is an async Server Component. It fetches the group by `inviteCode` and reads the current session, then renders one of four states:

### State 1: Invalid code
`inviteCode` does not match any group in the DB.

Renders an error message ("Este link de invitación no es válido") with a link back to `/torneo`. Does **not** call `notFound()` — avoids a generic 404 and gives the user somewhere to go.

### State 2: Already a member
User is authenticated and already has a `GroupMember` record for this group.

Server-side `redirect('/grupos/[id]')` — no page rendered.

### State 3: Not logged in
No active session.

Renders:
- Group name (large heading)
- Member count ("N participantes")
- Button: "Iniciar sesión para unirte" → `/login?callbackUrl=/invite/[code]`

After login, the user returns to `/invite/[code]` and sees State 4.

### State 4: Logged in, not yet a member
Active session + not a member.

Renders:
- Group name (large heading)
- Member count ("N participantes")
- Form with hidden `code` input + `SubmitButton`: "Unirse al grupo" → calls `joinViaInvite(code)` → redirect to `/grupos/[id]`

States 3 and 4 share the same visual layout. Only the CTA differs.

## Server Action — `joinViaInvite(code)`

```
'use server'
1. auth() — throws if no session
2. assertNotBlocked(user.isBlocked)
3. prisma.group.findUnique({ where: { inviteCode: code } }) — throws if not found
4. prisma.groupMember.upsert (or findUnique + create if not exists)
5. revalidatePath('/grupos')
6. redirect(`/grupos/${group.id}`)
```

Reuses the same guards as the existing `joinGroup` action.

## Invite Link Display in `/grupos/[id]`

Replaces the current owner-only `inviteCode` raw text box. The new box is visible to **all members**.

```
┌─────────────────────────────────────┐
│ Invitar amigos                      │
│ prode.app/invite/abc123xyz...       │
│                          [Copiar]   │
└─────────────────────────────────────┘
```

### `InviteCopyButton` (Client Component)

- Props: `inviteCode: string`
- Constructs the full URL on the client: `${window.location.origin}/invite/${inviteCode}`
- On click: `navigator.clipboard.writeText(url)`, then shows "¡Copiado!" label for 2 seconds before resetting to "Copiar"
- The URL is also rendered as visible text (truncated with `truncate`) so users on devices without clipboard access can copy manually

## Out of Scope

- Invite link expiry or single-use codes
- Ability to revoke/regenerate the invite code
- Showing a preview of the group (standings, members) on the invite page
- Admin controls over invite links
