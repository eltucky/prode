# Email Notifications — Design Spec

**Date:** 2026-05-17  
**Status:** Approved

## Goal

Enviar dos tipos de notificaciones por email a usuarios que hayan optado por recibirlas: un recordatorio antes del cierre de cada partido (si aún no cargaron pronóstico) y un resumen diario con puntos ganados y posición en grupos.

## Architecture

Un único cron job horario (`/api/cron/notifications`) maneja ambos tipos de email, respetando el límite de 2 cron jobs del plan Hobby de Vercel (ya se usa uno para `sync-results`). El proveedor de email es Resend. Los usuarios optan por recibir notificaciones desde su página de perfil (`/perfil`).

## Schema Change

`User` model: agregar `emailNotifications Boolean @default(false)`.

## File Map

```
prisma/
└── schema.prisma                              — Modify: add emailNotifications to User

src/
├── lib/
│   └── email.ts                               — Create: Resend client + sendReminderEmail + sendDailySummaryEmail
└── app/
    └── (protected)/
        └── perfil/
            ├── page.tsx                       — Create: página de perfil con toggle de notificaciones
            └── actions.ts                     — Create: updateEmailNotifications server action

src/app/api/cron/
└── notifications/
    └── route.ts                               — Create: cron horario de notificaciones

vercel.json                                    — Modify: add notifications cron entry
```

## Section Details

### Schema

```prisma
model User {
  // ... campos existentes ...
  emailNotifications Boolean @default(false)
}
```

### `/perfil` — Página de perfil

Server Component que muestra nombre, email y un toggle para activar/desactivar notificaciones. Un solo Server Action `updateEmailNotifications(formData)` que actualiza `user.emailNotifications` en DB.

No requiere middleware adicional — usa el guard existente de la ruta `(protected)`.

### `src/lib/email.ts` — Cliente y funciones de envío

Inicializa el cliente Resend con `RESEND_API_KEY`. Exporta dos funciones:

**`sendReminderEmail(to: string, userName: string, matches: ReminderMatch[])`**

`ReminderMatch`: `{ matchNumber: number, homeTeam: string, awayTeam: string, scheduledAt: Date }`

Envía un email con la lista de partidos que cierran en ~2 horas y para los cuales el usuario aún no cargó pronóstico. Si hay múltiples partidos en la ventana, van todos en un solo email.

**`sendDailySummaryEmail(to: string, userName: string, data: SummaryData)`**

`SummaryData`: `{ predictionsToday: { homeTeam: string, awayTeam: string, homeScore: number, awayScore: number, points: number }[], groups: { name: string, position: number, totalMembers: number }[] }`

Envía un resumen con los pronósticos del día (resultado real, puntos obtenidos) y la posición actual del usuario en cada grupo donde participa. La posición se calcula igual que la tabla de posiciones del grupo: suma total de `points` de todas las predicciones scored del usuario en ese grupo, ordenada desc, desempate por cantidad de predicciones con `points > 0`.

Los templates son HTML plano embebido en strings de TypeScript. Sin dependencias adicionales (no React Email).

### `/api/cron/notifications` — Cron horario

Misma autenticación que `sync-results`: header `Authorization: Bearer CRON_SECRET`.

**Schedule:** `0 * * * *` (cada hora en punto UTC)

**Lógica en cada corrida:**

1. **Recordatorios:** Busca partidos con `status = SCHEDULED` y `scheduledAt` en la ventana `[now + 90min, now + 150min]`. Para cada partido, busca usuarios con `emailNotifications: true` y sin `Prediction` para ese partido. Agrupa los partidos por usuario y envía un único email por usuario con todos sus partidos pendientes en la ventana.

2. **Resumen diario:** Solo ejecuta si la hora UTC actual es 22. Busca partidos con `status = FINISHED` y `scheduledAt` dentro del día UTC actual. Para cada usuario con `emailNotifications: true` que tenga al menos una predicción con `points` asignados en esos partidos: arma el resumen con sus predicciones del día + posición actual en cada grupo. Envía un email por usuario.

### `vercel.json`

```json
{
  "crons": [
    { "path": "/api/cron/sync-results", "schedule": "0 4 * * *" },
    { "path": "/api/cron/notifications", "schedule": "0 * * * *" }
  ]
}
```

## Env Vars

- `RESEND_API_KEY` — clave de API de Resend (agregar en Vercel dashboard)
- `RESEND_FROM` — dirección remitente, e.g. `prode@tudominio.com` (configurar dominio en Resend)

## Constraints

- Usuarios con `emailNotifications: false` (default) nunca reciben emails.
- Un usuario bloqueado (`isBlocked: true`) sigue recibiendo emails si tiene `emailNotifications: true` — el bloqueo solo afecta acciones de escritura, no notificaciones.
- Si el envío de un email falla, se loguea el error y se continúa con los demás usuarios (no falla el cron entero).
- No se persiste el estado de "ya se mandó el recordatorio para este partido" — el cron puede correr dos veces en la ventana si hay un retraso, pero la ventana de 60 minutos y el schedule horario hacen que en la práctica cada partido caiga en una sola corrida.
