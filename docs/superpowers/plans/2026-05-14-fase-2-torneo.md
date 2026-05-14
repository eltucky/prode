# Prode Mundial 2026 — Plan Fase 2: Datos del Torneo

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Poblar la DB con los 48 equipos y 104 partidos del Mundial 2026, integrar la API de resultados con sincronización automática diaria, y construir la vista del torneo (resultados pasados + próximos partidos) y el panel de administración de resultados.

**Architecture:** Los datos se insertan via Prisma seed desde TypeScript estático. Un cliente liviano para `api-football.com` sincroniza resultados y horarios exactos; un endpoint de cron en Vercel lo llama una vez por día (límite del plan gratuito) y también puede dispararse manualmente desde el panel admin. La vista del torneo y el admin son Server Components con Server Actions.

**Tech Stack:** Prisma 6 seed, api-football.com (api-sports.io, 100 req/día free), Vercel Cron Jobs, Next.js 16 Server Components, Server Actions, Tailwind CSS v4

---

## Mapa de archivos

```
prisma/
├── seed.ts                             — script principal de seed
└── seed-data/
    ├── teams.ts                        — 48 equipos (code, name, flag, group)
    └── matches.ts                      — 104 partidos (homeTeamCode, awayTeamCode, stage, scheduledAt, venue)
src/
├── lib/
│   ├── football-api.ts                 — cliente HTTP para api-football.com
│   └── sync-results.ts                 — lógica: buscar resultados → actualizar DB
├── app/
│   ├── (protected)/
│   │   ├── torneo/
│   │   │   └── page.tsx                — vista pública del torneo (todos los partidos)
│   │   └── admin/
│   │       └── partidos/
│   │           ├── page.tsx            — admin: listado de partidos con edición inline
│   │           └── actions.ts          — Server Actions para actualizar resultados
│   └── api/
│       └── cron/
│           └── sync-results/
│               └── route.ts            — endpoint GET para cron de Vercel + trigger manual
vercel.json                             — configuración de crons
```

---

## Task 1: Datos de equipos (`prisma/seed-data/teams.ts`)

**Files:**
- Create: `prisma/seed-data/teams.ts`

- [ ] **Paso 1: Crear `prisma/seed-data/teams.ts`**

> ⚠️ Los grupos son PROVISIONALES basados en el sorteo de diciembre 2025.
> Verificar contra https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026 antes de correr el seed en producción.

```ts
// prisma/seed-data/teams.ts
export type TeamSeed = {
  code: string
  name: string
  flag: string
  group: string
}

export const teams: TeamSeed[] = [
  // ── Grupo A ──────────────────────────────────────────────────
  { code: 'USA', name: 'Estados Unidos', flag: '🇺🇸', group: 'A' },
  { code: 'POR', name: 'Portugal',       flag: '🇵🇹', group: 'A' },
  { code: 'PAR', name: 'Paraguay',       flag: '🇵🇾', group: 'A' },
  { code: 'CIV', name: 'Costa de Marfil',flag: '🇨🇮', group: 'A' },
  // ── Grupo B ──────────────────────────────────────────────────
  { code: 'MEX', name: 'México',         flag: '🇲🇽', group: 'B' },
  { code: 'BRA', name: 'Brasil',         flag: '🇧🇷', group: 'B' },
  { code: 'CMR', name: 'Camerún',        flag: '🇨🇲', group: 'B' },
  { code: 'SRB', name: 'Serbia',         flag: '🇷🇸', group: 'B' },
  // ── Grupo C ──────────────────────────────────────────────────
  { code: 'CAN', name: 'Canadá',         flag: '🇨🇦', group: 'C' },
  { code: 'FRA', name: 'Francia',        flag: '🇫🇷', group: 'C' },
  { code: 'JPN', name: 'Japón',          flag: '🇯🇵', group: 'C' },
  { code: 'MAR', name: 'Marruecos',      flag: '🇲🇦', group: 'C' },
  // ── Grupo D ──────────────────────────────────────────────────
  { code: 'ARG', name: 'Argentina',      flag: '🇦🇷', group: 'D' },
  { code: 'BEL', name: 'Bélgica',        flag: '🇧🇪', group: 'D' },
  { code: 'AUS', name: 'Australia',      flag: '🇦🇺', group: 'D' },
  { code: 'NZL', name: 'Nueva Zelanda',  flag: '🇳🇿', group: 'D' },
  // ── Grupo E ──────────────────────────────────────────────────
  { code: 'ENG', name: 'Inglaterra',     flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'E' },
  { code: 'COL', name: 'Colombia',       flag: '🇨🇴', group: 'E' },
  { code: 'RSA', name: 'Sudáfrica',      flag: '🇿🇦', group: 'E' },
  { code: 'IRQ', name: 'Irak',           flag: '🇮🇶', group: 'E' },
  // ── Grupo F ──────────────────────────────────────────────────
  { code: 'ESP', name: 'España',         flag: '🇪🇸', group: 'F' },
  { code: 'URU', name: 'Uruguay',        flag: '🇺🇾', group: 'F' },
  { code: 'COD', name: 'DR Congo',       flag: '🇨🇩', group: 'F' },
  { code: 'CRC', name: 'Costa Rica',     flag: '🇨🇷', group: 'F' },
  // ── Grupo G ──────────────────────────────────────────────────
  { code: 'GER', name: 'Alemania',       flag: '🇩🇪', group: 'G' },
  { code: 'NED', name: 'Países Bajos',   flag: '🇳🇱', group: 'G' },
  { code: 'ECU', name: 'Ecuador',        flag: '🇪🇨', group: 'G' },
  { code: 'JOR', name: 'Jordania',       flag: '🇯🇴', group: 'G' },
  // ── Grupo H ──────────────────────────────────────────────────
  { code: 'ITA', name: 'Italia',         flag: '🇮🇹', group: 'H' },
  { code: 'CRO', name: 'Croacia',        flag: '🇭🇷', group: 'H' },
  { code: 'ALG', name: 'Argelia',        flag: '🇩🇿', group: 'H' },
  { code: 'UZB', name: 'Uzbekistán',     flag: '🇺🇿', group: 'H' },
  // ── Grupo I ──────────────────────────────────────────────────
  { code: 'AUT', name: 'Austria',        flag: '🇦🇹', group: 'I' },
  { code: 'DEN', name: 'Dinamarca',      flag: '🇩🇰', group: 'I' },
  { code: 'NGA', name: 'Nigeria',        flag: '🇳🇬', group: 'I' },
  { code: 'HON', name: 'Honduras',       flag: '🇭🇳', group: 'I' },
  // ── Grupo J ──────────────────────────────────────────────────
  { code: 'SUI', name: 'Suiza',          flag: '🇨🇭', group: 'J' },
  { code: 'TUR', name: 'Turquía',        flag: '🇹🇷', group: 'J' },
  { code: 'KOR', name: 'Corea del Sur',  flag: '🇰🇷', group: 'J' },
  { code: 'GHA', name: 'Ghana',          flag: '🇬🇭', group: 'J' },
  // ── Grupo K ──────────────────────────────────────────────────
  { code: 'SCO', name: 'Escocia',        flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', group: 'K' },
  { code: 'SVK', name: 'Eslovaquia',     flag: '🇸🇰', group: 'K' },
  { code: 'IRN', name: 'Irán',           flag: '🇮🇷', group: 'K' },
  { code: 'VEN', name: 'Venezuela',      flag: '🇻🇪', group: 'K' },
  // ── Grupo L ──────────────────────────────────────────────────
  { code: 'PAN', name: 'Panamá',         flag: '🇵🇦', group: 'L' },
  { code: 'SAU', name: 'Arabia Saudita', flag: '🇸🇦', group: 'L' },
  { code: 'SEN', name: 'Senegal',        flag: '🇸🇳', group: 'L' },
  { code: 'EGY', name: 'Egipto',         flag: '🇪🇬', group: 'L' },
]
```

- [ ] **Paso 2: Commit**

```bash
git add prisma/seed-data/teams.ts
git commit -m "feat: add World Cup 2026 team seed data (48 teams)"
```

---

## Task 2: Datos de partidos (`prisma/seed-data/matches.ts`)

**Files:**
- Create: `prisma/seed-data/matches.ts`

- [ ] **Paso 1: Crear `prisma/seed-data/matches.ts`**

> ⚠️ Las fechas y horarios son APROXIMADOS. El sync con la API actualizará los horarios exactos.
> Las asignaciones de equipos en eliminatorias son TBD (null en DB) hasta que avancen equipos reales.

```ts
// prisma/seed-data/matches.ts
import { MatchStage } from '@prisma/client'

export type MatchSeed = {
  matchNumber: number
  stage: MatchStage
  groupName?: string
  homeTeamCode?: string  // undefined = TBD (fases eliminatorias)
  awayTeamCode?: string
  scheduledAt: Date
  venue: string
}

// ── Fase de grupos ─────────────────────────────────────────────────────────
// Cada grupo juega 3 fechas. Cada pareja de equipos se enfrenta una vez.
// Matchday 1: junio 11-15 | Matchday 2: junio 16-20 | Matchday 3: junio 21-26

export const matches: MatchSeed[] = [
  // ── GRUPO A ──────────────────────────────────────────────────────────────
  // Matchday 1
  { matchNumber:  1, stage: 'GROUP', groupName: 'A', homeTeamCode: 'USA', awayTeamCode: 'PAR', scheduledAt: new Date('2026-06-11T21:00:00Z'), venue: 'SoFi Stadium, Los Ángeles' },
  { matchNumber:  2, stage: 'GROUP', groupName: 'A', homeTeamCode: 'POR', awayTeamCode: 'CIV', scheduledAt: new Date('2026-06-12T00:00:00Z'), venue: 'MetLife Stadium, Nueva York' },
  // Matchday 2
  { matchNumber:  3, stage: 'GROUP', groupName: 'A', homeTeamCode: 'USA', awayTeamCode: 'CIV', scheduledAt: new Date('2026-06-16T21:00:00Z'), venue: 'SoFi Stadium, Los Ángeles' },
  { matchNumber:  4, stage: 'GROUP', groupName: 'A', homeTeamCode: 'POR', awayTeamCode: 'PAR', scheduledAt: new Date('2026-06-17T00:00:00Z'), venue: 'MetLife Stadium, Nueva York' },
  // Matchday 3 (simultáneos)
  { matchNumber:  5, stage: 'GROUP', groupName: 'A', homeTeamCode: 'USA', awayTeamCode: 'POR', scheduledAt: new Date('2026-06-22T00:00:00Z'), venue: 'MetLife Stadium, Nueva York' },
  { matchNumber:  6, stage: 'GROUP', groupName: 'A', homeTeamCode: 'PAR', awayTeamCode: 'CIV', scheduledAt: new Date('2026-06-22T00:00:00Z'), venue: 'AT&T Stadium, Dallas' },

  // ── GRUPO B ──────────────────────────────────────────────────────────────
  { matchNumber:  7, stage: 'GROUP', groupName: 'B', homeTeamCode: 'MEX', awayTeamCode: 'CMR', scheduledAt: new Date('2026-06-11T18:00:00Z'), venue: 'Estadio Azteca, Ciudad de México' },
  { matchNumber:  8, stage: 'GROUP', groupName: 'B', homeTeamCode: 'BRA', awayTeamCode: 'SRB', scheduledAt: new Date('2026-06-12T21:00:00Z'), venue: 'AT&T Stadium, Dallas' },
  { matchNumber:  9, stage: 'GROUP', groupName: 'B', homeTeamCode: 'MEX', awayTeamCode: 'SRB', scheduledAt: new Date('2026-06-16T18:00:00Z'), venue: 'Estadio Azteca, Ciudad de México' },
  { matchNumber: 10, stage: 'GROUP', groupName: 'B', homeTeamCode: 'BRA', awayTeamCode: 'CMR', scheduledAt: new Date('2026-06-17T21:00:00Z'), venue: 'Rose Bowl, Los Ángeles' },
  { matchNumber: 11, stage: 'GROUP', groupName: 'B', homeTeamCode: 'MEX', awayTeamCode: 'BRA', scheduledAt: new Date('2026-06-22T21:00:00Z'), venue: 'Estadio Azteca, Ciudad de México' },
  { matchNumber: 12, stage: 'GROUP', groupName: 'B', homeTeamCode: 'CMR', awayTeamCode: 'SRB', scheduledAt: new Date('2026-06-22T21:00:00Z'), venue: 'Mercedes-Benz Stadium, Atlanta' },

  // ── GRUPO C ──────────────────────────────────────────────────────────────
  { matchNumber: 13, stage: 'GROUP', groupName: 'C', homeTeamCode: 'CAN', awayTeamCode: 'MAR', scheduledAt: new Date('2026-06-12T18:00:00Z'), venue: 'BC Place, Vancouver' },
  { matchNumber: 14, stage: 'GROUP', groupName: 'C', homeTeamCode: 'FRA', awayTeamCode: 'JPN', scheduledAt: new Date('2026-06-13T00:00:00Z'), venue: 'MetLife Stadium, Nueva York' },
  { matchNumber: 15, stage: 'GROUP', groupName: 'C', homeTeamCode: 'CAN', awayTeamCode: 'JPN', scheduledAt: new Date('2026-06-17T18:00:00Z'), venue: 'BMO Field, Toronto' },
  { matchNumber: 16, stage: 'GROUP', groupName: 'C', homeTeamCode: 'FRA', awayTeamCode: 'MAR', scheduledAt: new Date('2026-06-18T00:00:00Z'), venue: 'Mercedes-Benz Stadium, Atlanta' },
  { matchNumber: 17, stage: 'GROUP', groupName: 'C', homeTeamCode: 'CAN', awayTeamCode: 'FRA', scheduledAt: new Date('2026-06-23T00:00:00Z'), venue: 'BC Place, Vancouver' },
  { matchNumber: 18, stage: 'GROUP', groupName: 'C', homeTeamCode: 'MAR', awayTeamCode: 'JPN', scheduledAt: new Date('2026-06-23T00:00:00Z'), venue: 'Rose Bowl, Los Ángeles' },

  // ── GRUPO D ──────────────────────────────────────────────────────────────
  { matchNumber: 19, stage: 'GROUP', groupName: 'D', homeTeamCode: 'ARG', awayTeamCode: 'NZL', scheduledAt: new Date('2026-06-12T21:00:00Z'), venue: 'Rose Bowl, Los Ángeles' },
  { matchNumber: 20, stage: 'GROUP', groupName: 'D', homeTeamCode: 'BEL', awayTeamCode: 'AUS', scheduledAt: new Date('2026-06-13T18:00:00Z'), venue: 'Levi\'s Stadium, San Francisco' },
  { matchNumber: 21, stage: 'GROUP', groupName: 'D', homeTeamCode: 'ARG', awayTeamCode: 'AUS', scheduledAt: new Date('2026-06-17T21:00:00Z'), venue: 'SoFi Stadium, Los Ángeles' },
  { matchNumber: 22, stage: 'GROUP', groupName: 'D', homeTeamCode: 'BEL', awayTeamCode: 'NZL', scheduledAt: new Date('2026-06-18T18:00:00Z'), venue: 'Hard Rock Stadium, Miami' },
  { matchNumber: 23, stage: 'GROUP', groupName: 'D', homeTeamCode: 'ARG', awayTeamCode: 'BEL', scheduledAt: new Date('2026-06-23T21:00:00Z'), venue: 'MetLife Stadium, Nueva York' },
  { matchNumber: 24, stage: 'GROUP', groupName: 'D', homeTeamCode: 'NZL', awayTeamCode: 'AUS', scheduledAt: new Date('2026-06-23T21:00:00Z'), venue: 'Levi\'s Stadium, San Francisco' },

  // ── GRUPO E ──────────────────────────────────────────────────────────────
  { matchNumber: 25, stage: 'GROUP', groupName: 'E', homeTeamCode: 'ENG', awayTeamCode: 'IRQ', scheduledAt: new Date('2026-06-13T21:00:00Z'), venue: 'Hard Rock Stadium, Miami' },
  { matchNumber: 26, stage: 'GROUP', groupName: 'E', homeTeamCode: 'COL', awayTeamCode: 'RSA', scheduledAt: new Date('2026-06-14T00:00:00Z'), venue: 'AT&T Stadium, Dallas' },
  { matchNumber: 27, stage: 'GROUP', groupName: 'E', homeTeamCode: 'ENG', awayTeamCode: 'RSA', scheduledAt: new Date('2026-06-18T21:00:00Z'), venue: 'Lincoln Financial Field, Filadelfia' },
  { matchNumber: 28, stage: 'GROUP', groupName: 'E', homeTeamCode: 'COL', awayTeamCode: 'IRQ', scheduledAt: new Date('2026-06-19T00:00:00Z'), venue: 'SoFi Stadium, Los Ángeles' },
  { matchNumber: 29, stage: 'GROUP', groupName: 'E', homeTeamCode: 'ENG', awayTeamCode: 'COL', scheduledAt: new Date('2026-06-24T00:00:00Z'), venue: 'MetLife Stadium, Nueva York' },
  { matchNumber: 30, stage: 'GROUP', groupName: 'E', homeTeamCode: 'IRQ', awayTeamCode: 'RSA', scheduledAt: new Date('2026-06-24T00:00:00Z'), venue: 'AT&T Stadium, Dallas' },

  // ── GRUPO F ──────────────────────────────────────────────────────────────
  { matchNumber: 31, stage: 'GROUP', groupName: 'F', homeTeamCode: 'ESP', awayTeamCode: 'CRC', scheduledAt: new Date('2026-06-13T18:00:00Z'), venue: 'AT&T Stadium, Dallas' },
  { matchNumber: 32, stage: 'GROUP', groupName: 'F', homeTeamCode: 'URU', awayTeamCode: 'COD', scheduledAt: new Date('2026-06-14T21:00:00Z'), venue: 'Hard Rock Stadium, Miami' },
  { matchNumber: 33, stage: 'GROUP', groupName: 'F', homeTeamCode: 'ESP', awayTeamCode: 'COD', scheduledAt: new Date('2026-06-18T18:00:00Z'), venue: 'Rose Bowl, Los Ángeles' },
  { matchNumber: 34, stage: 'GROUP', groupName: 'F', homeTeamCode: 'URU', awayTeamCode: 'CRC', scheduledAt: new Date('2026-06-19T21:00:00Z'), venue: 'Levi\'s Stadium, San Francisco' },
  { matchNumber: 35, stage: 'GROUP', groupName: 'F', homeTeamCode: 'ESP', awayTeamCode: 'URU', scheduledAt: new Date('2026-06-24T21:00:00Z'), venue: 'MetLife Stadium, Nueva York' },
  { matchNumber: 36, stage: 'GROUP', groupName: 'F', homeTeamCode: 'CRC', awayTeamCode: 'COD', scheduledAt: new Date('2026-06-24T21:00:00Z'), venue: 'Mercedes-Benz Stadium, Atlanta' },

  // ── GRUPO G ──────────────────────────────────────────────────────────────
  { matchNumber: 37, stage: 'GROUP', groupName: 'G', homeTeamCode: 'GER', awayTeamCode: 'JOR', scheduledAt: new Date('2026-06-14T18:00:00Z'), venue: 'Mercedes-Benz Stadium, Atlanta' },
  { matchNumber: 38, stage: 'GROUP', groupName: 'G', homeTeamCode: 'NED', awayTeamCode: 'ECU', scheduledAt: new Date('2026-06-15T00:00:00Z'), venue: 'Lincoln Financial Field, Filadelfia' },
  { matchNumber: 39, stage: 'GROUP', groupName: 'G', homeTeamCode: 'GER', awayTeamCode: 'ECU', scheduledAt: new Date('2026-06-19T18:00:00Z'), venue: 'MetLife Stadium, Nueva York' },
  { matchNumber: 40, stage: 'GROUP', groupName: 'G', homeTeamCode: 'NED', awayTeamCode: 'JOR', scheduledAt: new Date('2026-06-20T00:00:00Z'), venue: 'AT&T Stadium, Dallas' },
  { matchNumber: 41, stage: 'GROUP', groupName: 'G', homeTeamCode: 'GER', awayTeamCode: 'NED', scheduledAt: new Date('2026-06-25T00:00:00Z'), venue: 'Mercedes-Benz Stadium, Atlanta' },
  { matchNumber: 42, stage: 'GROUP', groupName: 'G', homeTeamCode: 'ECU', awayTeamCode: 'JOR', scheduledAt: new Date('2026-06-25T00:00:00Z'), venue: 'Hard Rock Stadium, Miami' },

  // ── GRUPO H ──────────────────────────────────────────────────────────────
  { matchNumber: 43, stage: 'GROUP', groupName: 'H', homeTeamCode: 'ITA', awayTeamCode: 'UZB', scheduledAt: new Date('2026-06-14T21:00:00Z'), venue: 'Levi\'s Stadium, San Francisco' },
  { matchNumber: 44, stage: 'GROUP', groupName: 'H', homeTeamCode: 'CRO', awayTeamCode: 'ALG', scheduledAt: new Date('2026-06-15T18:00:00Z'), venue: 'Rose Bowl, Los Ángeles' },
  { matchNumber: 45, stage: 'GROUP', groupName: 'H', homeTeamCode: 'ITA', awayTeamCode: 'ALG', scheduledAt: new Date('2026-06-19T21:00:00Z'), venue: 'Hard Rock Stadium, Miami' },
  { matchNumber: 46, stage: 'GROUP', groupName: 'H', homeTeamCode: 'CRO', awayTeamCode: 'UZB', scheduledAt: new Date('2026-06-20T18:00:00Z'), venue: 'Lincoln Financial Field, Filadelfia' },
  { matchNumber: 47, stage: 'GROUP', groupName: 'H', homeTeamCode: 'ITA', awayTeamCode: 'CRO', scheduledAt: new Date('2026-06-25T21:00:00Z'), venue: 'MetLife Stadium, Nueva York' },
  { matchNumber: 48, stage: 'GROUP', groupName: 'H', homeTeamCode: 'UZB', awayTeamCode: 'ALG', scheduledAt: new Date('2026-06-25T21:00:00Z'), venue: 'SoFi Stadium, Los Ángeles' },

  // ── GRUPO I ──────────────────────────────────────────────────────────────
  { matchNumber: 49, stage: 'GROUP', groupName: 'I', homeTeamCode: 'AUT', awayTeamCode: 'HON', scheduledAt: new Date('2026-06-15T21:00:00Z'), venue: 'AT&T Stadium, Dallas' },
  { matchNumber: 50, stage: 'GROUP', groupName: 'I', homeTeamCode: 'DEN', awayTeamCode: 'NGA', scheduledAt: new Date('2026-06-16T00:00:00Z'), venue: 'Rose Bowl, Los Ángeles' },
  { matchNumber: 51, stage: 'GROUP', groupName: 'I', homeTeamCode: 'AUT', awayTeamCode: 'NGA', scheduledAt: new Date('2026-06-20T21:00:00Z'), venue: 'Levi\'s Stadium, San Francisco' },
  { matchNumber: 52, stage: 'GROUP', groupName: 'I', homeTeamCode: 'DEN', awayTeamCode: 'HON', scheduledAt: new Date('2026-06-21T00:00:00Z'), venue: 'Mercedes-Benz Stadium, Atlanta' },
  { matchNumber: 53, stage: 'GROUP', groupName: 'I', homeTeamCode: 'AUT', awayTeamCode: 'DEN', scheduledAt: new Date('2026-06-26T00:00:00Z'), venue: 'Hard Rock Stadium, Miami' },
  { matchNumber: 54, stage: 'GROUP', groupName: 'I', homeTeamCode: 'HON', awayTeamCode: 'NGA', scheduledAt: new Date('2026-06-26T00:00:00Z'), venue: 'BC Place, Vancouver' },

  // ── GRUPO J ──────────────────────────────────────────────────────────────
  { matchNumber: 55, stage: 'GROUP', groupName: 'J', homeTeamCode: 'SUI', awayTeamCode: 'GHA', scheduledAt: new Date('2026-06-15T18:00:00Z'), venue: 'MetLife Stadium, Nueva York' },
  { matchNumber: 56, stage: 'GROUP', groupName: 'J', homeTeamCode: 'TUR', awayTeamCode: 'KOR', scheduledAt: new Date('2026-06-16T21:00:00Z'), venue: 'Hard Rock Stadium, Miami' },
  { matchNumber: 57, stage: 'GROUP', groupName: 'J', homeTeamCode: 'SUI', awayTeamCode: 'KOR', scheduledAt: new Date('2026-06-21T18:00:00Z'), venue: 'Rose Bowl, Los Ángeles' },
  { matchNumber: 58, stage: 'GROUP', groupName: 'J', homeTeamCode: 'TUR', awayTeamCode: 'GHA', scheduledAt: new Date('2026-06-21T21:00:00Z'), venue: 'AT&T Stadium, Dallas' },
  { matchNumber: 59, stage: 'GROUP', groupName: 'J', homeTeamCode: 'SUI', awayTeamCode: 'TUR', scheduledAt: new Date('2026-06-26T21:00:00Z'), venue: 'MetLife Stadium, Nueva York' },
  { matchNumber: 60, stage: 'GROUP', groupName: 'J', homeTeamCode: 'GHA', awayTeamCode: 'KOR', scheduledAt: new Date('2026-06-26T21:00:00Z'), venue: 'Lincoln Financial Field, Filadelfia' },

  // ── GRUPO K ──────────────────────────────────────────────────────────────
  { matchNumber: 61, stage: 'GROUP', groupName: 'K', homeTeamCode: 'SCO', awayTeamCode: 'VEN', scheduledAt: new Date('2026-06-15T00:00:00Z'), venue: 'Mercedes-Benz Stadium, Atlanta' },
  { matchNumber: 62, stage: 'GROUP', groupName: 'K', homeTeamCode: 'IRN', awayTeamCode: 'SVK', scheduledAt: new Date('2026-06-16T18:00:00Z'), venue: 'BMO Field, Toronto' },
  { matchNumber: 63, stage: 'GROUP', groupName: 'K', homeTeamCode: 'SCO', awayTeamCode: 'SVK', scheduledAt: new Date('2026-06-20T00:00:00Z'), venue: 'Levi\'s Stadium, San Francisco' },
  { matchNumber: 64, stage: 'GROUP', groupName: 'K', homeTeamCode: 'IRN', awayTeamCode: 'VEN', scheduledAt: new Date('2026-06-21T21:00:00Z'), venue: 'Hard Rock Stadium, Miami' },
  { matchNumber: 65, stage: 'GROUP', groupName: 'K', homeTeamCode: 'SCO', awayTeamCode: 'IRN', scheduledAt: new Date('2026-06-26T18:00:00Z'), venue: 'Rose Bowl, Los Ángeles' },
  { matchNumber: 66, stage: 'GROUP', groupName: 'K', homeTeamCode: 'VEN', awayTeamCode: 'SVK', scheduledAt: new Date('2026-06-26T18:00:00Z'), venue: 'AT&T Stadium, Dallas' },

  // ── GRUPO L ──────────────────────────────────────────────────────────────
  { matchNumber: 67, stage: 'GROUP', groupName: 'L', homeTeamCode: 'PAN', awayTeamCode: 'EGY', scheduledAt: new Date('2026-06-16T00:00:00Z'), venue: 'Estadio Akron, Guadalajara' },
  { matchNumber: 68, stage: 'GROUP', groupName: 'L', homeTeamCode: 'SAU', awayTeamCode: 'SEN', scheduledAt: new Date('2026-06-17T18:00:00Z'), venue: 'Estadio BBVA, Monterrey' },
  { matchNumber: 69, stage: 'GROUP', groupName: 'L', homeTeamCode: 'PAN', awayTeamCode: 'SEN', scheduledAt: new Date('2026-06-21T00:00:00Z'), venue: 'Estadio Azteca, Ciudad de México' },
  { matchNumber: 70, stage: 'GROUP', groupName: 'L', homeTeamCode: 'SAU', awayTeamCode: 'EGY', scheduledAt: new Date('2026-06-22T18:00:00Z'), venue: 'Estadio BBVA, Monterrey' },
  { matchNumber: 71, stage: 'GROUP', groupName: 'L', homeTeamCode: 'PAN', awayTeamCode: 'SAU', scheduledAt: new Date('2026-06-26T21:00:00Z'), venue: 'Estadio Azteca, Ciudad de México' },
  { matchNumber: 72, stage: 'GROUP', groupName: 'L', homeTeamCode: 'EGY', awayTeamCode: 'SEN', scheduledAt: new Date('2026-06-26T21:00:00Z'), venue: 'Estadio Akron, Guadalajara' },

  // ── RONDA DE 32 (16 partidos, equipos TBD) ────────────────────────────────
  { matchNumber: 73, stage: 'ROUND_OF_32', scheduledAt: new Date('2026-06-29T21:00:00Z'), venue: 'MetLife Stadium, Nueva York' },
  { matchNumber: 74, stage: 'ROUND_OF_32', scheduledAt: new Date('2026-06-29T01:00:00Z'), venue: 'AT&T Stadium, Dallas' },
  { matchNumber: 75, stage: 'ROUND_OF_32', scheduledAt: new Date('2026-06-30T21:00:00Z'), venue: 'Rose Bowl, Los Ángeles' },
  { matchNumber: 76, stage: 'ROUND_OF_32', scheduledAt: new Date('2026-06-30T01:00:00Z'), venue: 'Mercedes-Benz Stadium, Atlanta' },
  { matchNumber: 77, stage: 'ROUND_OF_32', scheduledAt: new Date('2026-07-01T21:00:00Z'), venue: 'SoFi Stadium, Los Ángeles' },
  { matchNumber: 78, stage: 'ROUND_OF_32', scheduledAt: new Date('2026-07-01T01:00:00Z'), venue: 'Levi\'s Stadium, San Francisco' },
  { matchNumber: 79, stage: 'ROUND_OF_32', scheduledAt: new Date('2026-07-02T21:00:00Z'), venue: 'Hard Rock Stadium, Miami' },
  { matchNumber: 80, stage: 'ROUND_OF_32', scheduledAt: new Date('2026-07-02T01:00:00Z'), venue: 'Lincoln Financial Field, Filadelfia' },
  { matchNumber: 81, stage: 'ROUND_OF_32', scheduledAt: new Date('2026-07-03T21:00:00Z'), venue: 'BC Place, Vancouver' },
  { matchNumber: 82, stage: 'ROUND_OF_32', scheduledAt: new Date('2026-07-03T01:00:00Z'), venue: 'BMO Field, Toronto' },
  { matchNumber: 83, stage: 'ROUND_OF_32', scheduledAt: new Date('2026-07-03T21:00:00Z'), venue: 'Estadio Azteca, Ciudad de México' },
  { matchNumber: 84, stage: 'ROUND_OF_32', scheduledAt: new Date('2026-07-03T01:00:00Z'), venue: 'Estadio BBVA, Monterrey' },
  { matchNumber: 85, stage: 'ROUND_OF_32', scheduledAt: new Date('2026-07-04T21:00:00Z'), venue: 'AT&T Stadium, Dallas' },
  { matchNumber: 86, stage: 'ROUND_OF_32', scheduledAt: new Date('2026-07-04T01:00:00Z'), venue: 'MetLife Stadium, Nueva York' },
  { matchNumber: 87, stage: 'ROUND_OF_32', scheduledAt: new Date('2026-07-04T21:00:00Z'), venue: 'Rose Bowl, Los Ángeles' },
  { matchNumber: 88, stage: 'ROUND_OF_32', scheduledAt: new Date('2026-07-04T01:00:00Z'), venue: 'Mercedes-Benz Stadium, Atlanta' },

  // ── OCTAVOS (8 partidos) ──────────────────────────────────────────────────
  { matchNumber: 89, stage: 'ROUND_OF_16', scheduledAt: new Date('2026-07-05T21:00:00Z'), venue: 'MetLife Stadium, Nueva York' },
  { matchNumber: 90, stage: 'ROUND_OF_16', scheduledAt: new Date('2026-07-06T01:00:00Z'), venue: 'SoFi Stadium, Los Ángeles' },
  { matchNumber: 91, stage: 'ROUND_OF_16', scheduledAt: new Date('2026-07-06T21:00:00Z'), venue: 'AT&T Stadium, Dallas' },
  { matchNumber: 92, stage: 'ROUND_OF_16', scheduledAt: new Date('2026-07-07T01:00:00Z'), venue: 'Rose Bowl, Los Ángeles' },
  { matchNumber: 93, stage: 'ROUND_OF_16', scheduledAt: new Date('2026-07-07T21:00:00Z'), venue: 'Mercedes-Benz Stadium, Atlanta' },
  { matchNumber: 94, stage: 'ROUND_OF_16', scheduledAt: new Date('2026-07-08T01:00:00Z'), venue: 'Levi\'s Stadium, San Francisco' },
  { matchNumber: 95, stage: 'ROUND_OF_16', scheduledAt: new Date('2026-07-08T21:00:00Z'), venue: 'Hard Rock Stadium, Miami' },
  { matchNumber: 96, stage: 'ROUND_OF_16', scheduledAt: new Date('2026-07-09T01:00:00Z'), venue: 'MetLife Stadium, Nueva York' },

  // ── CUARTOS (4 partidos) ──────────────────────────────────────────────────
  { matchNumber:  97, stage: 'QUARTER_FINAL', scheduledAt: new Date('2026-07-11T21:00:00Z'), venue: 'MetLife Stadium, Nueva York' },
  { matchNumber:  98, stage: 'QUARTER_FINAL', scheduledAt: new Date('2026-07-12T01:00:00Z'), venue: 'AT&T Stadium, Dallas' },
  { matchNumber:  99, stage: 'QUARTER_FINAL', scheduledAt: new Date('2026-07-12T21:00:00Z'), venue: 'Rose Bowl, Los Ángeles' },
  { matchNumber: 100, stage: 'QUARTER_FINAL', scheduledAt: new Date('2026-07-13T01:00:00Z'), venue: 'SoFi Stadium, Los Ángeles' },

  // ── SEMIFINALES (2 partidos) ──────────────────────────────────────────────
  { matchNumber: 101, stage: 'SEMI_FINAL', scheduledAt: new Date('2026-07-15T01:00:00Z'), venue: 'MetLife Stadium, Nueva York' },
  { matchNumber: 102, stage: 'SEMI_FINAL', scheduledAt: new Date('2026-07-16T01:00:00Z'), venue: 'Rose Bowl, Los Ángeles' },

  // ── TERCER PUESTO ─────────────────────────────────────────────────────────
  { matchNumber: 103, stage: 'THIRD_PLACE', scheduledAt: new Date('2026-07-18T21:00:00Z'), venue: 'AT&T Stadium, Dallas' },

  // ── FINAL ─────────────────────────────────────────────────────────────────
  { matchNumber: 104, stage: 'FINAL', scheduledAt: new Date('2026-07-19T21:00:00Z'), venue: 'MetLife Stadium, Nueva York' },
]
```

- [ ] **Paso 2: Commit**

```bash
git add prisma/seed-data/matches.ts
git commit -m "feat: add World Cup 2026 match schedule seed data (104 matches)"
```

---

## Task 3: Script de seed (`prisma/seed.ts`)

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json` (agregar script `prisma.seed`)

- [ ] **Paso 1: Agregar configuración del seed en `package.json`**

Dentro del objeto raíz de `package.json`, agregar la clave `prisma`:

```json
"prisma": {
  "seed": "ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts"
}
```

También instalar `ts-node` si no está:

```bash
npm install -D ts-node
```

- [ ] **Paso 2: Crear `prisma/seed.ts`**

```ts
import { PrismaClient } from '@prisma/client'
import { teams } from './seed-data/teams'
import { matches } from './seed-data/matches'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding teams...')

  // Upsert teams (safe to re-run)
  for (const team of teams) {
    await prisma.team.upsert({
      where: { code: team.code },
      update: { name: team.name, flag: team.flag, group: team.group },
      create: team,
    })
  }
  console.log(`✓ ${teams.length} teams upserted`)

  // Build code → id map for matches
  const teamMap = await prisma.team.findMany({ select: { id: true, code: true } })
  const codeToId = Object.fromEntries(teamMap.map(t => [t.code, t.id]))

  console.log('🌱 Seeding matches...')
  for (const match of matches) {
    const homeTeamId = match.homeTeamCode ? codeToId[match.homeTeamCode] : undefined
    const awayTeamId = match.awayTeamCode ? codeToId[match.awayTeamCode] : undefined

    if (match.homeTeamCode && !homeTeamId) {
      throw new Error(`Team not found: ${match.homeTeamCode}`)
    }
    if (match.awayTeamCode && !awayTeamId) {
      throw new Error(`Team not found: ${match.awayTeamCode}`)
    }

    await prisma.match.upsert({
      where: { matchNumber: match.matchNumber },
      update: {
        scheduledAt: match.scheduledAt,
        venue: match.venue,
        ...(homeTeamId && { homeTeamId }),
        ...(awayTeamId && { awayTeamId }),
      },
      create: {
        matchNumber: match.matchNumber,
        stage: match.stage,
        groupName: match.groupName ?? null,
        scheduledAt: match.scheduledAt,
        venue: match.venue,
        homeTeamId: homeTeamId ?? null,
        awayTeamId: awayTeamId ?? null,
        status: 'SCHEDULED',
      },
    })
  }
  console.log(`✓ ${matches.length} matches upserted`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
```

- [ ] **Paso 3: Verificar que `DATABASE_URL` real está en `.env.local` (o `.env`)**

```bash
grep DATABASE_URL .env.local 2>/dev/null || grep DATABASE_URL .env
```

Si sigue siendo placeholder, agregar la URL real de Neon antes de continuar.

- [ ] **Paso 4: Aplicar schema a la DB (si no se hizo en Fase 1)**

```bash
npx prisma db push
```

- [ ] **Paso 5: Correr el seed**

```bash
npx prisma db seed
```

Esperado:
```
🌱 Seeding teams...
✓ 48 teams upserted
🌱 Seeding matches...
✓ 104 matches upserted
```

- [ ] **Paso 6: Verificar en Prisma Studio**

```bash
npx prisma studio
```

Abrir `http://localhost:5555`, verificar que `Team` tiene 48 filas y `Match` tiene 104 filas.

- [ ] **Paso 7: Commit**

```bash
git add prisma/seed.ts package.json package-lock.json
git commit -m "feat: add Prisma seed script for teams and matches"
```

---

## Task 4: Cliente de API de resultados (`src/lib/football-api.ts`)

**Files:**
- Create: `src/lib/football-api.ts`
- Create: `src/__tests__/football-api.test.ts`
- Modify: `.env.example` (agregar `FOOTBALL_API_KEY`)

API usada: **api-football.com** (api-sports.io). Free tier: 100 req/día.
Registrarse en https://dashboard.api-football.com → copiar API key a `.env.local`.

- [ ] **Paso 1: Agregar variable de entorno**

En `.env.example`, agregar:
```env
# API de resultados — registrarse en https://dashboard.api-football.com
FOOTBALL_API_KEY="tu-api-key-de-api-football"
```

En `.env.local`, agregar el valor real.

- [ ] **Paso 2: Escribir el test**

```ts
// src/__tests__/football-api.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchWorldCupFixtures, type ApiFixture } from '@/lib/football-api'

const mockFixture: ApiFixture = {
  fixture: {
    id: 12345,
    date: '2026-06-11T21:00:00+00:00',
    status: { short: 'FT' },
  },
  teams: {
    home: { name: 'Estados Unidos', id: 1 },
    away: { name: 'Paraguay', id: 2 },
  },
  goals: { home: 2, away: 0 },
  score: { fulltime: { home: 2, away: 0 } },
}

describe('fetchWorldCupFixtures', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('devuelve fixtures cuando la API responde ok', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: [mockFixture] }),
    } as Response)

    const result = await fetchWorldCupFixtures()

    expect(result).toHaveLength(1)
    expect(result[0].fixture.id).toBe(12345)
    expect(result[0].goals.home).toBe(2)
  })

  it('lanza error si la API falla', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 429,
    } as Response)

    await expect(fetchWorldCupFixtures()).rejects.toThrow('API-Football error: 429')
  })
})
```

- [ ] **Paso 3: Ejecutar el test — debe fallar**

```bash
npm test src/__tests__/football-api.test.ts
```

Esperado: FAIL

- [ ] **Paso 4: Crear `src/lib/football-api.ts`**

```ts
const BASE_URL = 'https://v3.football.api-sports.io'
const LEAGUE_ID = 1    // FIFA World Cup
const SEASON = 2026

export type ApiFixture = {
  fixture: {
    id: number
    date: string
    status: { short: string }  // 'NS' | '1H' | 'HT' | '2H' | 'FT' | 'AET' | 'PEN' | 'PST' | 'CANC'
  }
  teams: {
    home: { id: number; name: string }
    away: { id: number; name: string }
  }
  goals: { home: number | null; away: number | null }
  score: { fulltime: { home: number | null; away: number | null } }
}

async function apiFetch(path: string): Promise<unknown> {
  const apiKey = process.env.FOOTBALL_API_KEY
  if (!apiKey) throw new Error('FOOTBALL_API_KEY is not set')

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'x-apisports-key': apiKey },
    next: { revalidate: 0 },  // no cache — always fresh
  })

  if (!res.ok) throw new Error(`API-Football error: ${res.status}`)
  return res.json()
}

export async function fetchWorldCupFixtures(): Promise<ApiFixture[]> {
  const data = await apiFetch(`/fixtures?league=${LEAGUE_ID}&season=${SEASON}`) as { response: ApiFixture[] }
  return data.response
}
```

- [ ] **Paso 5: Ejecutar el test — debe pasar**

```bash
npm test src/__tests__/football-api.test.ts
```

Esperado: PASS (2 tests)

- [ ] **Paso 6: Commit**

```bash
git add src/lib/football-api.ts src/__tests__/football-api.test.ts .env.example
git commit -m "feat: add API-Football client with tests"
```

---

## Task 5: Lógica de sincronización de resultados (`src/lib/sync-results.ts`)

**Files:**
- Create: `src/lib/sync-results.ts`
- Create: `src/__tests__/sync-results.test.ts`

Esta función:
1. Obtiene todos los fixtures de la API
2. Para cada fixture con resultado (status FT/AET/PEN): actualiza `homeScore`, `awayScore`, `status`, `winnerId`, `scheduledAt` y `externalId` en la DB.
3. Para fixtures postergados (PST): actualiza `scheduledAt` y `status`.
4. Hace match entre API fixture y local Match via `externalId` (si ya existe) o via team names + fecha aproximada (primer sync).

- [ ] **Paso 1: Escribir el test**

```ts
// src/__tests__/sync-results.test.ts
import { describe, it, expect, vi } from 'vitest'
import { determineWinnerId, mapApiStatusToMatchStatus } from '@/lib/sync-results'
import { MatchStatus } from '@prisma/client'

describe('mapApiStatusToMatchStatus', () => {
  it('mapea FT a FINISHED', () => {
    expect(mapApiStatusToMatchStatus('FT')).toBe('FINISHED')
  })

  it('mapea AET a FINISHED', () => {
    expect(mapApiStatusToMatchStatus('AET')).toBe('FINISHED')
  })

  it('mapea PEN a FINISHED', () => {
    expect(mapApiStatusToMatchStatus('PEN')).toBe('FINISHED')
  })

  it('mapea PST a POSTPONED', () => {
    expect(mapApiStatusToMatchStatus('PST')).toBe('POSTPONED')
  })

  it('mapea 1H y 2H a IN_PROGRESS', () => {
    expect(mapApiStatusToMatchStatus('1H')).toBe('IN_PROGRESS')
    expect(mapApiStatusToMatchStatus('2H')).toBe('IN_PROGRESS')
  })

  it('mapea NS a SCHEDULED', () => {
    expect(mapApiStatusToMatchStatus('NS')).toBe('SCHEDULED')
  })
})

describe('determineWinnerId', () => {
  it('retorna homeTeamId cuando home score es mayor', () => {
    expect(determineWinnerId(2, 1, 'home-id', 'away-id')).toBe('home-id')
  })

  it('retorna awayTeamId cuando away score es mayor', () => {
    expect(determineWinnerId(1, 2, 'home-id', 'away-id')).toBe('away-id')
  })

  it('retorna null cuando es empate (solo para fase de grupos)', () => {
    expect(determineWinnerId(1, 1, 'home-id', 'away-id')).toBeNull()
  })

  it('retorna null si algún score es null', () => {
    expect(determineWinnerId(null, null, 'home-id', 'away-id')).toBeNull()
  })
})
```

- [ ] **Paso 2: Ejecutar el test — debe fallar**

```bash
npm test src/__tests__/sync-results.test.ts
```

Esperado: FAIL

- [ ] **Paso 3: Crear `src/lib/sync-results.ts`**

```ts
import { prisma } from '@/lib/db'
import { fetchWorldCupFixtures, type ApiFixture } from '@/lib/football-api'
import { MatchStatus } from '@prisma/client'

export function mapApiStatusToMatchStatus(apiStatus: string): MatchStatus {
  if (['FT', 'AET', 'PEN'].includes(apiStatus)) return 'FINISHED'
  if (apiStatus === 'PST') return 'POSTPONED'
  if (apiStatus === 'CANC') return 'CANCELLED'
  if (['1H', 'HT', '2H', 'ET', 'BT', 'P'].includes(apiStatus)) return 'IN_PROGRESS'
  return 'SCHEDULED'
}

export function determineWinnerId(
  homeScore: number | null,
  awayScore: number | null,
  homeTeamId: string | null,
  awayTeamId: string | null
): string | null {
  if (homeScore === null || awayScore === null) return null
  if (homeScore > awayScore) return homeTeamId
  if (awayScore > homeScore) return awayTeamId
  return null
}

export async function syncResults(): Promise<{ updated: number; linked: number }> {
  const fixtures = await fetchWorldCupFixtures()
  let updated = 0
  let linked = 0

  // Pre-fetch all matches with teams for linking by name+date
  const localMatches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true },
  })

  for (const fixture of fixtures) {
    const apiStatus = fixture.fixture.status.short
    const matchStatus = mapApiStatusToMatchStatus(apiStatus)
    const fixtureDate = new Date(fixture.fixture.date)

    // Find matching local match
    let localMatch = localMatches.find(m => m.externalId === String(fixture.fixture.id))

    // If no externalId match yet, try to link by team names + approximate date
    if (!localMatch) {
      const homeName = fixture.teams.home.name
      const awayName = fixture.teams.away.name
      const dayStart = new Date(fixtureDate)
      dayStart.setUTCHours(0, 0, 0, 0)
      const dayEnd = new Date(fixtureDate)
      dayEnd.setUTCHours(23, 59, 59, 999)

      localMatch = localMatches.find(m =>
        m.scheduledAt >= dayStart &&
        m.scheduledAt <= dayEnd &&
        (m.homeTeam?.name === homeName || m.homeTeam?.name.includes(homeName.split(' ')[0])) &&
        (m.awayTeam?.name === awayName || m.awayTeam?.name.includes(awayName.split(' ')[0]))
      )

      if (localMatch) {
        await prisma.match.update({
          where: { id: localMatch.id },
          data: { externalId: String(fixture.fixture.id) },
        })
        linked++
      }
    }

    if (!localMatch) continue

    // Update schedule if match was postponed
    if (matchStatus === 'POSTPONED') {
      await prisma.match.update({
        where: { id: localMatch.id },
        data: { status: 'POSTPONED', scheduledAt: fixtureDate },
      })
      updated++
      continue
    }

    // Update result if match is finished
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
      updated++
    }
  }

  return { updated, linked }
}
```

- [ ] **Paso 4: Ejecutar el test — debe pasar**

```bash
npm test src/__tests__/sync-results.test.ts
```

Esperado: PASS (8 tests)

- [ ] **Paso 5: Commit**

```bash
git add src/lib/sync-results.ts src/__tests__/sync-results.test.ts
git commit -m "feat: add result sync logic with API-Football integration"
```

---

## Task 6: Endpoint de cron + `vercel.json`

**Files:**
- Create: `src/app/api/cron/sync-results/route.ts`
- Create: `vercel.json`
- Modify: `.env.example`

El cron corre una vez por día (límite del plan gratuito de Vercel). También puede dispararse manualmente desde el admin.

- [ ] **Paso 1: Agregar CRON_SECRET a `.env.example` y `.env.local`**

En `.env.example`:
```env
# Secret para proteger el endpoint de cron (generar con: openssl rand -hex 32)
CRON_SECRET="tu-cron-secret"
```

Generar y agregar a `.env.local`:
```bash
openssl rand -hex 32
```

- [ ] **Paso 2: Crear `src/app/api/cron/sync-results/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
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
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
```

- [ ] **Paso 3: Crear `vercel.json`**

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-results",
      "schedule": "0 4 * * *"
    }
  ]
}
```

Nota: `0 4 * * *` = todos los días a las 04:00 UTC (durante el torneo, coincide con después de los partidos nocturnos americanos). En el plan gratuito de Vercel solo se puede configurar una cron por día como mínimo. El endpoint también acepta llamadas manuales desde el admin (Task 7).

Para que Vercel envíe el header de autorización automáticamente, agregar en las variables de entorno de Vercel: `CRON_SECRET` con el mismo valor.

- [ ] **Paso 4: Agregar CRON_SECRET a Vercel**

En el dashboard de Vercel → Settings → Environment Variables:
- Nombre: `CRON_SECRET`
- Valor: el mismo que en `.env.local`

- [ ] **Paso 5: Commit**

```bash
git add src/app/api/cron/sync-results/route.ts vercel.json .env.example
git commit -m "feat: add cron endpoint for daily result sync"
```

---

## Task 7: Admin — gestión de resultados

**Files:**
- Create: `src/app/(protected)/admin/partidos/page.tsx`
- Create: `src/app/(protected)/admin/partidos/actions.ts`

Solo el super admin puede acceder. Permite actualizar manualmente el resultado de cualquier partido y disparar el sync con la API.

- [ ] **Paso 1: Crear `src/app/(protected)/admin/partidos/actions.ts`**

```ts
'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { MatchStatus } from '@prisma/client'
import { z } from 'zod'

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
```

Nota: requiere `zod`. Si no está instalado:
```bash
npm install zod
```

- [ ] **Paso 2: Crear `src/app/(protected)/admin/partidos/page.tsx`**

```tsx
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { updateMatchResult, triggerSync } from './actions'
import { MatchStage } from '@prisma/client'

const STAGE_LABELS: Record<MatchStage, string> = {
  GROUP: 'Fase de Grupos',
  ROUND_OF_32: 'Ronda de 32',
  ROUND_OF_16: 'Octavos',
  QUARTER_FINAL: 'Cuartos',
  SEMI_FINAL: 'Semifinales',
  THIRD_PLACE: 'Tercer Puesto',
  FINAL: 'Final',
}

export default async function AdminPartidosPage() {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) redirect('/dashboard')

  const matches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true },
    orderBy: { matchNumber: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin — Partidos</h1>
        <form action={async () => {
          'use server'
          const { triggerSync } = await import('./actions')
          const result = await triggerSync()
          console.log('Sync result:', result)
        }}>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            🔄 Sincronizar resultados
          </button>
        </form>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partido</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resultado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {matches.map(match => (
              <tr key={match.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-500">{match.matchNumber}</td>
                <td className="px-4 py-2 font-medium">
                  <div className="text-xs text-gray-400">{STAGE_LABELS[match.stage]}{match.groupName ? ` · Grupo ${match.groupName}` : ''}</div>
                  <div>
                    {match.homeTeam ? `${match.homeTeam.flag} ${match.homeTeam.name}` : 'TBD'} vs {match.awayTeam ? `${match.awayTeam.flag} ${match.awayTeam.name}` : 'TBD'}
                  </div>
                </td>
                <td className="px-4 py-2 text-gray-500 text-xs">
                  {match.scheduledAt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-2">
                  {match.homeScore !== null ? `${match.homeScore} - ${match.awayScore}` : '—'}
                </td>
                <td className="px-4 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    match.status === 'FINISHED' ? 'bg-green-100 text-green-700' :
                    match.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-700' :
                    match.status === 'POSTPONED' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{match.status}</span>
                </td>
                <td className="px-4 py-2">
                  <form action={updateMatchResult}>
                    <input type="hidden" name="matchId" value={match.id} />
                    <div className="flex items-center gap-1">
                      <input type="number" name="homeScore" defaultValue={match.homeScore ?? ''} min="0" className="w-12 border rounded px-1 py-0.5 text-center text-sm" placeholder="L" />
                      <span>-</span>
                      <input type="number" name="awayScore" defaultValue={match.awayScore ?? ''} min="0" className="w-12 border rounded px-1 py-0.5 text-center text-sm" placeholder="V" />
                      <select name="status" defaultValue={match.status} className="border rounded px-1 py-0.5 text-xs">
                        <option value="SCHEDULED">SCHED</option>
                        <option value="IN_PROGRESS">LIVE</option>
                        <option value="FINISHED">FIN</option>
                        <option value="POSTPONED">POST</option>
                        <option value="CANCELLED">CANC</option>
                      </select>
                      <button type="submit" className="bg-gray-800 text-white px-2 py-0.5 rounded text-xs hover:bg-gray-700">
                        ✓
                      </button>
                    </div>
                  </form>
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

- [ ] **Paso 3: Agregar "Admin" a la navbar para super admins**

Modificar `src/components/navbar.tsx`. Después de la línea del link a `/dashboard`, agregar link condicional al admin:

```tsx
// Después del Link href="/dashboard", dentro del nav, agregar:
{session?.user?.isSuperAdmin && (
  <Link href="/admin/partidos" className="text-sm text-red-600 hover:text-red-800">
    Admin
  </Link>
)}
```

- [ ] **Paso 4: Run lint y tests**

```bash
npm run lint
npm test
```

Esperado: lint limpio, todos los tests pasan

- [ ] **Paso 5: Commit**

```bash
git add src/app/'(protected)'/admin/ src/components/navbar.tsx
git commit -m "feat: add admin match results management page with manual sync trigger"
```

---

## Task 8: Vista del torneo

**Files:**
- Create: `src/app/(protected)/torneo/page.tsx`

Vista accesible para todos los usuarios. Muestra resultados pasados y partidos programados, filtrable por etapa. Sin formulario de pronóstico por ahora (se agrega en Fase 4).

- [ ] **Paso 1: Crear `src/app/(protected)/torneo/page.tsx`**

```tsx
import { prisma } from '@/lib/db'
import { MatchStage, MatchStatus } from '@prisma/client'

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

export default async function TorneoPage({
  searchParams,
}: {
  searchParams: Promise<{ etapa?: string }>
}) {
  const { etapa } = await searchParams
  const stageFilter = etapa as MatchStage | undefined

  const matches = await prisma.match.findMany({
    where: stageFilter ? { stage: stageFilter } : undefined,
    include: { homeTeam: true, awayTeam: true },
    orderBy: [{ scheduledAt: 'asc' }, { matchNumber: 'asc' }],
  })

  // Group by stage
  const byStage = matches.reduce<Record<string, typeof matches>>((acc, match) => {
    const key = match.stage
    if (!acc[key]) acc[key] = []
    acc[key].push(match)
    return acc
  }, {})

  const stageOrder: MatchStage[] = ['GROUP', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL']

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
              return (
                <div key={match.id} className="bg-white border rounded-xl px-4 py-3 flex items-center justify-between gap-4">
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
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
```

- [ ] **Paso 2: Agregar link "Torneo" en la navbar**

En `src/components/navbar.tsx`, agregar link a `/torneo` junto al link del dashboard:

```tsx
// Dentro del <nav>, junto al Link de "Prode 2026", agregar en la zona central o izquierda:
<Link href="/torneo" className="text-sm text-gray-600 hover:text-gray-900">
  Torneo
</Link>
```

- [ ] **Paso 3: Run lint y todos los tests**

```bash
npm run lint
npm test
```

Esperado: lint limpio, todos los tests pasan (no hay nuevos tests unitarios para esta tarea — es UI pura sobre Server Components)

- [ ] **Paso 4: Commit**

```bash
git add src/app/'(protected)'/torneo/ src/components/navbar.tsx
git commit -m "feat: add tournament view with match results and schedule"
```

---

## Resultado de la Fase 2

Al completar esta fase:

- ✅ 48 equipos y 104 partidos en la DB
- ✅ Vista del torneo con resultados pasados y próximos partidos
- ✅ Sincronización automática diaria de resultados (API-Football + Vercel Cron)
- ✅ Admin puede actualizar resultados manualmente y disparar sync
- ✅ Partidos postergados actualizan su horario automáticamente

## Pendiente para Fase 3

- Creación de grupos (nombre, código de invitación)
- Unirse a un grupo via link/código
- Vista de grupo (participantes, tabla, pronósticos)
