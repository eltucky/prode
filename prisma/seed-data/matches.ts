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
