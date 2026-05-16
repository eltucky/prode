# Super Admin Panel — Design Spec

**Date:** 2026-05-16  
**Status:** Approved

## Goal

Extend the existing `/admin` area with a full super admin panel: dashboard con métricas globales, gestión de grupos (eliminar, transferir ownership, sacar miembros), gestión de usuarios (bloquear, hacer super admin), y auditoría de pronósticos por partido con ranking global.

## Architecture

Layout compartido `/admin/layout.tsx` agrega navegación secundaria entre las secciones. Cada sección tiene su propio `page.tsx` (Server Component) y `actions.ts` (Server Actions). El bloqueo de usuario se enforcea en las actions existentes de los usuarios (`createGroup`, `joinGroup`, `savePrediction`).

## Schema Change

`User` model: agregar `isBlocked Boolean @default(false)`.

## File Map

```
prisma/
└── schema.prisma                              — Modify: add isBlocked to User

src/app/(protected)/admin/
├── layout.tsx                                 — Create: nav secundaria (Partidos | Grupos | Usuarios | Pronósticos)
├── page.tsx                                   — Create: dashboard con 5 métricas
├── grupos/
│   ├── page.tsx                               — Create: tabla de todos los grupos
│   └── actions.ts                             — Create: deleteGroup, removeUserFromGroup, transferOwnership
├── usuarios/
│   ├── page.tsx                               — Create: tabla de todos los usuarios
│   └── actions.ts                             — Create: blockUser, unblockUser, makeSuperAdmin
└── pronosticos/
    ├── page.tsx                               — Create: selector de partido + tabla de pronósticos + ranking global
    └── actions.ts                             — Create: editPrediction, deletePrediction

src/app/(protected)/grupos/
└── actions.ts                                 — Modify: createGroup y joinGroup verifican isBlocked

src/app/(protected)/torneo/
└── actions.ts                                 — Modify: savePrediction verifica isBlocked
```

## Section Details

### `/admin` — Dashboard de métricas

5 métricas en cards:
- Usuarios totales / bloqueados
- Grupos activos
- Partidos finalizados / total
- Pronósticos cargados
- Puntos promedio por usuario (sum de todos los points / count de users con al menos 1 punto)

Links de navegación a cada sub-sección.

### `/admin/grupos` — Gestión de grupos

Tabla: nombre del grupo, owner (nombre), cantidad de miembros, fecha de creación.

Acciones por grupo:
- **Transferir ownership**: select con miembros actuales → actualiza `group.ownerId`. Bloqueado si el nuevo owner no es miembro.
- **Eliminar grupo**: confirmación de dos pasos (botón "Eliminar" → segundo botón "¿Confirmar?"). Borra el grupo; cascade elimina GroupMember records. Las predicciones de los miembros NO se borran (son del usuario, no del grupo).

Acciones por miembro (dentro de cada grupo):
- **Sacar del grupo**: elimina el GroupMember. Bloqueado si ese miembro es el owner actual (debe transferirse primero).

### `/admin/usuarios` — Gestión de usuarios

Tabla: avatar, nombre, email, cantidad de grupos, fecha de registro, estado (activo / bloqueado).

Acciones por usuario:
- **Bloquear / Desbloquear**: toggle de `user.isBlocked`. No borra nada existente.
- **Hacer super admin / Quitar super admin**: toggle de `user.isSuperAdmin`. Un super admin no puede quitarse el super admin a sí mismo.
- **Ver grupos**: link filtrado a `/admin/grupos` (nice-to-have, puede ser un simple count con tooltip).

### `/admin/pronosticos` — Auditoría de pronósticos

**Selector de partido**: dropdown con todos los partidos ordenados por `matchNumber`. Al seleccionar, muestra tabla de pronósticos.

**Tabla de pronósticos** (del partido seleccionado):
- Avatar + nombre del usuario, pronóstico (homeScore-awayScore), predictedWinnerId (nombre del equipo si aplica), puntos asignados.
- **Editar**: formulario inline — cambiar homeScore, awayScore, predictedWinnerId. Al guardar, llama a `scoreMatch(matchId)` si el partido está FINISHED para recalcular.
- **Eliminar**: borra el Prediction record.

**Ranking global** (debajo del selector):
- Tabla: posición, avatar + nombre, puntos totales, cantidad de aciertos.
- Agrega predicciones con puntos asignados de todos los usuarios, sin filtrar por grupo.
- Ordena por puntos desc, desempate por aciertos desc.

### Enforcement de bloqueo

Cuando `user.isBlocked === true`, las siguientes actions lanzan error antes de hacer cualquier DB write:
- `createGroup` en `grupos/actions.ts`
- `joinGroup` en `grupos/actions.ts`
- `savePrediction` en `torneo/actions.ts`

El check se hace consultando el user desde DB (no desde session, para que un bloqueo reciente tome efecto sin re-login).

## Constraints

- Todas las páginas admin verifican `session.user.isSuperAdmin` y redirigen a `/dashboard` si no.
- Un super admin no puede bloquearse a sí mismo.
- Un super admin no puede quitarse el super admin a sí mismo.
- No se puede sacar del grupo al owner actual — hay que transferir primero.
- Las predicciones de usuarios bloqueados o removidos de grupos siguen existiendo en DB (datos históricos).
