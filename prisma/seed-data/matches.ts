// prisma/seed-data/matches.ts
// Horarios en UTC (fuente: partidos.csv en hora Argentina ART = UTC-3)
// Horarios en UTC (fuente: partidos.csv en hora Argentina ART = UTC-3)
import { MatchStage } from '@prisma/client'

export type MatchSeed = {
  matchNumber: number
  stage: MatchStage
  groupName?: string
  homeTeamCode?: string
  awayTeamCode?: string
  scheduledAt: Date
  venue: string
}

export const matches: MatchSeed[] = [
  // ── GRUPO A ──────────────────────────────────────────────────────────────
  { matchNumber:  1, stage: 'GROUP', groupName: 'A', homeTeamCode: 'MEX', awayTeamCode: 'RSA', scheduledAt: new Date('2026-06-11T19:00:00Z'), venue: 'Estadio Ciudad de México' },
  { matchNumber:  2, stage: 'GROUP', groupName: 'A', homeTeamCode: 'KOR', awayTeamCode: 'CZE', scheduledAt: new Date('2026-06-12T02:00:00Z'), venue: 'Estadio Guadalajara' },
  { matchNumber:  3, stage: 'GROUP', groupName: 'A', homeTeamCode: 'CZE', awayTeamCode: 'RSA', scheduledAt: new Date('2026-06-18T16:00:00Z'), venue: 'Atlanta Stadium' },
  { matchNumber:  4, stage: 'GROUP', groupName: 'A', homeTeamCode: 'MEX', awayTeamCode: 'KOR', scheduledAt: new Date('2026-06-19T01:00:00Z'), venue: 'Estadio Guadalajara' },
  { matchNumber:  5, stage: 'GROUP', groupName: 'A', homeTeamCode: 'CZE', awayTeamCode: 'MEX', scheduledAt: new Date('2026-06-25T01:00:00Z'), venue: 'Estadio Ciudad de México' },
  { matchNumber:  6, stage: 'GROUP', groupName: 'A', homeTeamCode: 'RSA', awayTeamCode: 'KOR', scheduledAt: new Date('2026-06-25T01:00:00Z'), venue: 'Estadio Monterrey' },

  // ── GRUPO B ──────────────────────────────────────────────────────────────
  { matchNumber:  7, stage: 'GROUP', groupName: 'B', homeTeamCode: 'CAN', awayTeamCode: 'BIH', scheduledAt: new Date('2026-06-12T19:00:00Z'), venue: 'Toronto Stadium' },
  { matchNumber:  8, stage: 'GROUP', groupName: 'B', homeTeamCode: 'QAT', awayTeamCode: 'SUI', scheduledAt: new Date('2026-06-13T19:00:00Z'), venue: 'San Francisco Bay Area Stadium' },
  { matchNumber:  9, stage: 'GROUP', groupName: 'B', homeTeamCode: 'SUI', awayTeamCode: 'BIH', scheduledAt: new Date('2026-06-18T19:00:00Z'), venue: 'Los Angeles Stadium' },
  { matchNumber: 10, stage: 'GROUP', groupName: 'B', homeTeamCode: 'CAN', awayTeamCode: 'QAT', scheduledAt: new Date('2026-06-18T22:00:00Z'), venue: 'BC Place Vancouver' },
  { matchNumber: 11, stage: 'GROUP', groupName: 'B', homeTeamCode: 'SUI', awayTeamCode: 'CAN', scheduledAt: new Date('2026-06-24T19:00:00Z'), venue: 'BC Place Vancouver' },
  { matchNumber: 12, stage: 'GROUP', groupName: 'B', homeTeamCode: 'BIH', awayTeamCode: 'QAT', scheduledAt: new Date('2026-06-24T19:00:00Z'), venue: 'Seattle Stadium' },

  // ── GRUPO C ──────────────────────────────────────────────────────────────
  { matchNumber: 13, stage: 'GROUP', groupName: 'C', homeTeamCode: 'BRA', awayTeamCode: 'MAR', scheduledAt: new Date('2026-06-13T22:00:00Z'), venue: 'Boston Stadium' },
  { matchNumber: 14, stage: 'GROUP', groupName: 'C', homeTeamCode: 'HAI', awayTeamCode: 'SCO', scheduledAt: new Date('2026-06-14T01:00:00Z'), venue: 'New York/New Jersey Stadium' },
  { matchNumber: 15, stage: 'GROUP', groupName: 'C', homeTeamCode: 'BRA', awayTeamCode: 'HAI', scheduledAt: new Date('2026-06-19T22:00:00Z'), venue: 'Philadelphia Stadium' },
  { matchNumber: 16, stage: 'GROUP', groupName: 'C', homeTeamCode: 'SCO', awayTeamCode: 'MAR', scheduledAt: new Date('2026-06-20T01:00:00Z'), venue: 'Boston Stadium' },
  { matchNumber: 17, stage: 'GROUP', groupName: 'C', homeTeamCode: 'SCO', awayTeamCode: 'BRA', scheduledAt: new Date('2026-06-24T22:00:00Z'), venue: 'Miami Stadium' },
  { matchNumber: 18, stage: 'GROUP', groupName: 'C', homeTeamCode: 'MAR', awayTeamCode: 'HAI', scheduledAt: new Date('2026-06-24T22:00:00Z'), venue: 'Atlanta Stadium' },

  // ── GRUPO D ──────────────────────────────────────────────────────────────
  { matchNumber: 19, stage: 'GROUP', groupName: 'D', homeTeamCode: 'USA', awayTeamCode: 'PAR', scheduledAt: new Date('2026-06-13T01:00:00Z'), venue: 'Los Angeles Stadium' },
  { matchNumber: 20, stage: 'GROUP', groupName: 'D', homeTeamCode: 'AUS', awayTeamCode: 'TUR', scheduledAt: new Date('2026-06-14T04:00:00Z'), venue: 'BC Place Vancouver' },
  { matchNumber: 21, stage: 'GROUP', groupName: 'D', homeTeamCode: 'TUR', awayTeamCode: 'PAR', scheduledAt: new Date('2026-06-19T19:00:00Z'), venue: 'San Francisco Bay Area Stadium' },
  { matchNumber: 22, stage: 'GROUP', groupName: 'D', homeTeamCode: 'USA', awayTeamCode: 'AUS', scheduledAt: new Date('2026-06-19T04:00:00Z'), venue: 'Seattle Stadium' },
  { matchNumber: 23, stage: 'GROUP', groupName: 'D', homeTeamCode: 'TUR', awayTeamCode: 'USA', scheduledAt: new Date('2026-06-26T02:00:00Z'), venue: 'Los Angeles Stadium' },
  { matchNumber: 24, stage: 'GROUP', groupName: 'D', homeTeamCode: 'PAR', awayTeamCode: 'AUS', scheduledAt: new Date('2026-06-26T02:00:00Z'), venue: 'San Francisco Bay Area Stadium' },

  // ── GRUPO E ──────────────────────────────────────────────────────────────
  { matchNumber: 25, stage: 'GROUP', groupName: 'E', homeTeamCode: 'GER', awayTeamCode: 'CUW', scheduledAt: new Date('2026-06-14T17:00:00Z'), venue: 'Philadelphia Stadium' },
  { matchNumber: 26, stage: 'GROUP', groupName: 'E', homeTeamCode: 'CIV', awayTeamCode: 'ECU', scheduledAt: new Date('2026-06-14T23:00:00Z'), venue: 'Houston Stadium' },
  { matchNumber: 27, stage: 'GROUP', groupName: 'E', homeTeamCode: 'GER', awayTeamCode: 'CIV', scheduledAt: new Date('2026-06-20T20:00:00Z'), venue: 'Toronto Stadium' },
  { matchNumber: 28, stage: 'GROUP', groupName: 'E', homeTeamCode: 'CUW', awayTeamCode: 'ECU', scheduledAt: new Date('2026-06-21T00:00:00Z'), venue: 'Kansas City Stadium' },
  { matchNumber: 29, stage: 'GROUP', groupName: 'E', homeTeamCode: 'ECU', awayTeamCode: 'GER', scheduledAt: new Date('2026-06-25T20:00:00Z'), venue: 'Philadelphia Stadium' },
  { matchNumber: 30, stage: 'GROUP', groupName: 'E', homeTeamCode: 'CUW', awayTeamCode: 'CIV', scheduledAt: new Date('2026-06-25T20:00:00Z'), venue: 'New York/New Jersey Stadium' },

  // ── GRUPO F ──────────────────────────────────────────────────────────────
  { matchNumber: 31, stage: 'GROUP', groupName: 'F', homeTeamCode: 'NED', awayTeamCode: 'JPN', scheduledAt: new Date('2026-06-14T20:00:00Z'), venue: 'Dallas Stadium' },
  { matchNumber: 32, stage: 'GROUP', groupName: 'F', homeTeamCode: 'SWE', awayTeamCode: 'TUN', scheduledAt: new Date('2026-06-15T02:00:00Z'), venue: 'Estadio Monterrey' },
  { matchNumber: 33, stage: 'GROUP', groupName: 'F', homeTeamCode: 'NED', awayTeamCode: 'SWE', scheduledAt: new Date('2026-06-20T17:00:00Z'), venue: 'Houston Stadium' },
  { matchNumber: 34, stage: 'GROUP', groupName: 'F', homeTeamCode: 'JPN', awayTeamCode: 'TUN', scheduledAt: new Date('2026-06-20T04:00:00Z'), venue: 'Estadio Monterrey' },
  { matchNumber: 35, stage: 'GROUP', groupName: 'F', homeTeamCode: 'TUN', awayTeamCode: 'NED', scheduledAt: new Date('2026-06-25T23:00:00Z'), venue: 'Dallas Stadium' },
  { matchNumber: 36, stage: 'GROUP', groupName: 'F', homeTeamCode: 'JPN', awayTeamCode: 'SWE', scheduledAt: new Date('2026-06-25T23:00:00Z'), venue: 'Kansas City Stadium' },

  // ── GRUPO G ──────────────────────────────────────────────────────────────
  // Bélgica vs Egipto: hora "A confirmar" en el CSV → se usa mediodía ART (15:00 UTC)
  { matchNumber: 37, stage: 'GROUP', groupName: 'G', homeTeamCode: 'BEL', awayTeamCode: 'EGY', scheduledAt: new Date('2026-06-15T15:00:00Z'), venue: 'Los Angeles Stadium' },
  { matchNumber: 38, stage: 'GROUP', groupName: 'G', homeTeamCode: 'IRN', awayTeamCode: 'NZL', scheduledAt: new Date('2026-06-16T01:00:00Z'), venue: 'Seattle Stadium' },
  { matchNumber: 39, stage: 'GROUP', groupName: 'G', homeTeamCode: 'BEL', awayTeamCode: 'IRN', scheduledAt: new Date('2026-06-21T19:00:00Z'), venue: 'Los Angeles Stadium' },
  { matchNumber: 40, stage: 'GROUP', groupName: 'G', homeTeamCode: 'EGY', awayTeamCode: 'NZL', scheduledAt: new Date('2026-06-22T01:00:00Z'), venue: 'BC Place Vancouver' },
  { matchNumber: 41, stage: 'GROUP', groupName: 'G', homeTeamCode: 'NZL', awayTeamCode: 'BEL', scheduledAt: new Date('2026-06-26T03:00:00Z'), venue: 'Seattle Stadium' },
  { matchNumber: 42, stage: 'GROUP', groupName: 'G', homeTeamCode: 'EGY', awayTeamCode: 'IRN', scheduledAt: new Date('2026-06-26T03:00:00Z'), venue: 'BC Place Vancouver' },

  // ── GRUPO H ──────────────────────────────────────────────────────────────
  { matchNumber: 43, stage: 'GROUP', groupName: 'H', homeTeamCode: 'ESP', awayTeamCode: 'CPV', scheduledAt: new Date('2026-06-15T16:00:00Z'), venue: 'Miami Stadium' },
  { matchNumber: 44, stage: 'GROUP', groupName: 'H', homeTeamCode: 'SAU', awayTeamCode: 'URU', scheduledAt: new Date('2026-06-15T22:00:00Z'), venue: 'Atlanta Stadium' },
  { matchNumber: 45, stage: 'GROUP', groupName: 'H', homeTeamCode: 'ESP', awayTeamCode: 'SAU', scheduledAt: new Date('2026-06-21T16:00:00Z'), venue: 'Miami Stadium' },
  { matchNumber: 46, stage: 'GROUP', groupName: 'H', homeTeamCode: 'CPV', awayTeamCode: 'URU', scheduledAt: new Date('2026-06-21T22:00:00Z'), venue: 'Atlanta Stadium' },
  { matchNumber: 47, stage: 'GROUP', groupName: 'H', homeTeamCode: 'URU', awayTeamCode: 'ESP', scheduledAt: new Date('2026-06-27T00:00:00Z'), venue: 'Houston Stadium' },
  { matchNumber: 48, stage: 'GROUP', groupName: 'H', homeTeamCode: 'CPV', awayTeamCode: 'SAU', scheduledAt: new Date('2026-06-27T00:00:00Z'), venue: 'Estadio Guadalajara' },

  // ── GRUPO I ──────────────────────────────────────────────────────────────
  { matchNumber: 49, stage: 'GROUP', groupName: 'I', homeTeamCode: 'FRA', awayTeamCode: 'SEN', scheduledAt: new Date('2026-06-16T19:00:00Z'), venue: 'New York/New Jersey Stadium' },
  { matchNumber: 50, stage: 'GROUP', groupName: 'I', homeTeamCode: 'IRQ', awayTeamCode: 'NOR', scheduledAt: new Date('2026-06-16T22:00:00Z'), venue: 'Boston Stadium' },
  { matchNumber: 51, stage: 'GROUP', groupName: 'I', homeTeamCode: 'FRA', awayTeamCode: 'IRQ', scheduledAt: new Date('2026-06-22T21:00:00Z'), venue: 'New York/New Jersey Stadium' },
  { matchNumber: 52, stage: 'GROUP', groupName: 'I', homeTeamCode: 'NOR', awayTeamCode: 'SEN', scheduledAt: new Date('2026-06-23T00:00:00Z'), venue: 'Philadelphia Stadium' },
  { matchNumber: 53, stage: 'GROUP', groupName: 'I', homeTeamCode: 'NOR', awayTeamCode: 'FRA', scheduledAt: new Date('2026-06-26T19:00:00Z'), venue: 'Boston Stadium' },
  { matchNumber: 54, stage: 'GROUP', groupName: 'I', homeTeamCode: 'SEN', awayTeamCode: 'IRQ', scheduledAt: new Date('2026-06-26T19:00:00Z'), venue: 'Toronto Stadium' },

  // ── GRUPO J ──────────────────────────────────────────────────────────────
  { matchNumber: 55, stage: 'GROUP', groupName: 'J', homeTeamCode: 'ARG', awayTeamCode: 'ALG', scheduledAt: new Date('2026-06-17T01:00:00Z'), venue: 'Kansas City Stadium' },
  { matchNumber: 56, stage: 'GROUP', groupName: 'J', homeTeamCode: 'AUT', awayTeamCode: 'JOR', scheduledAt: new Date('2026-06-17T04:00:00Z'), venue: 'San Francisco Bay Area Stadium' },
  { matchNumber: 57, stage: 'GROUP', groupName: 'J', homeTeamCode: 'ARG', awayTeamCode: 'AUT', scheduledAt: new Date('2026-06-22T17:00:00Z'), venue: 'Dallas Stadium' },
  { matchNumber: 58, stage: 'GROUP', groupName: 'J', homeTeamCode: 'JOR', awayTeamCode: 'ALG', scheduledAt: new Date('2026-06-22T03:00:00Z'), venue: 'San Francisco Bay Area Stadium' },
  { matchNumber: 59, stage: 'GROUP', groupName: 'J', homeTeamCode: 'JOR', awayTeamCode: 'ARG', scheduledAt: new Date('2026-06-28T02:00:00Z'), venue: 'Dallas Stadium' },
  { matchNumber: 60, stage: 'GROUP', groupName: 'J', homeTeamCode: 'ALG', awayTeamCode: 'AUT', scheduledAt: new Date('2026-06-28T02:00:00Z'), venue: 'Kansas City Stadium' },

  // ── GRUPO K ──────────────────────────────────────────────────────────────
  { matchNumber: 61, stage: 'GROUP', groupName: 'K', homeTeamCode: 'POR', awayTeamCode: 'COD', scheduledAt: new Date('2026-06-17T17:00:00Z'), venue: 'Houston Stadium' },
  { matchNumber: 62, stage: 'GROUP', groupName: 'K', homeTeamCode: 'UZB', awayTeamCode: 'COL', scheduledAt: new Date('2026-06-18T02:00:00Z'), venue: 'Estadio Ciudad de México' },
  { matchNumber: 63, stage: 'GROUP', groupName: 'K', homeTeamCode: 'POR', awayTeamCode: 'UZB', scheduledAt: new Date('2026-06-23T17:00:00Z'), venue: 'Houston Stadium' },
  { matchNumber: 64, stage: 'GROUP', groupName: 'K', homeTeamCode: 'COD', awayTeamCode: 'COL', scheduledAt: new Date('2026-06-24T02:00:00Z'), venue: 'Estadio Guadalajara' },
  { matchNumber: 65, stage: 'GROUP', groupName: 'K', homeTeamCode: 'COL', awayTeamCode: 'POR', scheduledAt: new Date('2026-06-27T23:30:00Z'), venue: 'Miami Stadium' },
  { matchNumber: 66, stage: 'GROUP', groupName: 'K', homeTeamCode: 'COD', awayTeamCode: 'UZB', scheduledAt: new Date('2026-06-27T23:30:00Z'), venue: 'Atlanta Stadium' },

  // ── GRUPO L ──────────────────────────────────────────────────────────────
  { matchNumber: 67, stage: 'GROUP', groupName: 'L', homeTeamCode: 'ENG', awayTeamCode: 'CRO', scheduledAt: new Date('2026-06-17T20:00:00Z'), venue: 'Toronto Stadium' },
  { matchNumber: 68, stage: 'GROUP', groupName: 'L', homeTeamCode: 'GHA', awayTeamCode: 'PAN', scheduledAt: new Date('2026-06-17T23:00:00Z'), venue: 'Dallas Stadium' },
  { matchNumber: 69, stage: 'GROUP', groupName: 'L', homeTeamCode: 'ENG', awayTeamCode: 'GHA', scheduledAt: new Date('2026-06-23T20:00:00Z'), venue: 'Boston Stadium' },
  { matchNumber: 70, stage: 'GROUP', groupName: 'L', homeTeamCode: 'CRO', awayTeamCode: 'PAN', scheduledAt: new Date('2026-06-23T23:00:00Z'), venue: 'Toronto Stadium' },
  { matchNumber: 71, stage: 'GROUP', groupName: 'L', homeTeamCode: 'PAN', awayTeamCode: 'ENG', scheduledAt: new Date('2026-06-27T21:00:00Z'), venue: 'New York/New Jersey Stadium' },
  { matchNumber: 72, stage: 'GROUP', groupName: 'L', homeTeamCode: 'CRO', awayTeamCode: 'GHA', scheduledAt: new Date('2026-06-27T21:00:00Z'), venue: 'Philadelphia Stadium' },

  // ── 16AVOS (RONDA DE 32) ──────────────────────────────────────────────────
  { matchNumber: 73, stage: 'ROUND_OF_32', homeTeamCode: 'RSA', awayTeamCode: 'CAN', scheduledAt: new Date('2026-06-28T19:00:00Z'), venue: 'Los Angeles Stadium' },
  { matchNumber: 74, stage: 'ROUND_OF_32', homeTeamCode: 'GER', awayTeamCode: 'PAR', scheduledAt: new Date('2026-06-29T20:30:00Z'), venue: 'Boston Stadium' },
  { matchNumber: 75, stage: 'ROUND_OF_32', homeTeamCode: 'NED', awayTeamCode: 'MAR', scheduledAt: new Date('2026-06-30T01:00:00Z'), venue: 'Estadio Monterrey' },
  { matchNumber: 76, stage: 'ROUND_OF_32', homeTeamCode: 'BRA', awayTeamCode: 'JPN', scheduledAt: new Date('2026-06-29T17:00:00Z'), venue: 'Houston Stadium' },
  { matchNumber: 77, stage: 'ROUND_OF_32', homeTeamCode: 'FRA', awayTeamCode: 'SWE', scheduledAt: new Date('2026-06-30T21:00:00Z'), venue: 'New York/New Jersey Stadium' },
  { matchNumber: 78, stage: 'ROUND_OF_32', homeTeamCode: 'CIV', awayTeamCode: 'NOR', scheduledAt: new Date('2026-06-30T17:00:00Z'), venue: 'Dallas Stadium' },
  { matchNumber: 79, stage: 'ROUND_OF_32', homeTeamCode: 'MEX', awayTeamCode: 'ECU', scheduledAt: new Date('2026-07-01T01:00:00Z'), venue: 'Estadio Ciudad de México' },
  { matchNumber: 80, stage: 'ROUND_OF_32', homeTeamCode: 'ENG', awayTeamCode: 'COD', scheduledAt: new Date('2026-07-01T16:00:00Z'), venue: 'Atlanta Stadium' },
  { matchNumber: 81, stage: 'ROUND_OF_32', homeTeamCode: 'USA', awayTeamCode: 'BIH', scheduledAt: new Date('2026-07-02T00:00:00Z'), venue: 'San Francisco Bay Area Stadium' },
  { matchNumber: 82, stage: 'ROUND_OF_32', homeTeamCode: 'BEL', awayTeamCode: 'SEN', scheduledAt: new Date('2026-07-01T20:00:00Z'), venue: 'Seattle Stadium' },
  { matchNumber: 83, stage: 'ROUND_OF_32', homeTeamCode: 'POR', awayTeamCode: 'CRO', scheduledAt: new Date('2026-07-02T23:00:00Z'), venue: 'Toronto Stadium' },
  { matchNumber: 84, stage: 'ROUND_OF_32', homeTeamCode: 'ESP', awayTeamCode: 'ALG', scheduledAt: new Date('2026-07-02T19:00:00Z'), venue: 'Los Angeles Stadium' },
  { matchNumber: 85, stage: 'ROUND_OF_32', homeTeamCode: 'SUI', awayTeamCode: 'AUT', scheduledAt: new Date('2026-07-03T03:00:00Z'), venue: 'BC Place Vancouver' },
  { matchNumber: 86, stage: 'ROUND_OF_32', homeTeamCode: 'ARG', awayTeamCode: 'CPV', scheduledAt: new Date('2026-07-03T22:00:00Z'), venue: 'Miami Stadium' },
  { matchNumber: 87, stage: 'ROUND_OF_32', homeTeamCode: 'COL', awayTeamCode: 'GHA', scheduledAt: new Date('2026-07-04T01:30:00Z'), venue: 'Kansas City Stadium' },
  { matchNumber: 88, stage: 'ROUND_OF_32', homeTeamCode: 'AUS', awayTeamCode: 'EGY', scheduledAt: new Date('2026-07-03T18:00:00Z'), venue: 'Dallas Stadium' },

  // ── OCTAVOS (RONDA DE 16) ─────────────────────────────────────────────────
  { matchNumber: 89, stage: 'ROUND_OF_16', scheduledAt: new Date('2026-07-04T21:00:00Z'), venue: 'Philadelphia Stadium' },
  { matchNumber: 90, stage: 'ROUND_OF_16', scheduledAt: new Date('2026-07-04T17:00:00Z'), venue: 'Houston Stadium' },
  { matchNumber: 91, stage: 'ROUND_OF_16', scheduledAt: new Date('2026-07-05T20:00:00Z'), venue: 'New York/New Jersey Stadium' },
  { matchNumber: 92, stage: 'ROUND_OF_16', scheduledAt: new Date('2026-07-06T00:00:00Z'), venue: 'Estadio Azteca, Ciudad de México' },
  { matchNumber: 93, stage: 'ROUND_OF_16', scheduledAt: new Date('2026-07-06T19:00:00Z'), venue: 'Dallas Stadium' },
  { matchNumber: 94, stage: 'ROUND_OF_16', scheduledAt: new Date('2026-07-07T00:00:00Z'), venue: 'Seattle Stadium' },
  { matchNumber: 95, stage: 'ROUND_OF_16', scheduledAt: new Date('2026-07-07T16:00:00Z'), venue: 'Atlanta Stadium' },
  { matchNumber: 96, stage: 'ROUND_OF_16', scheduledAt: new Date('2026-07-07T20:00:00Z'), venue: 'BC Place Vancouver' },

  // ── CUARTOS ──────────────────────────────────────────────────────────────
  { matchNumber:  97, stage: 'QUARTER_FINAL', scheduledAt: new Date('2026-07-09T20:00:00Z'), venue: 'Boston Stadium' },
  { matchNumber:  98, stage: 'QUARTER_FINAL', scheduledAt: new Date('2026-07-10T19:00:00Z'), venue: 'Los Angeles Stadium' },
  { matchNumber:  99, stage: 'QUARTER_FINAL', scheduledAt: new Date('2026-07-11T21:00:00Z'), venue: 'Miami Stadium' },
  { matchNumber: 100, stage: 'QUARTER_FINAL', scheduledAt: new Date('2026-07-12T01:00:00Z'), venue: 'Kansas City Stadium' },

  // ── SEMIFINALES ───────────────────────────────────────────────────────────
  { matchNumber: 101, stage: 'SEMI_FINAL', scheduledAt: new Date('2026-07-14T19:00:00Z'), venue: 'Dallas Stadium' },
  { matchNumber: 102, stage: 'SEMI_FINAL', scheduledAt: new Date('2026-07-15T19:00:00Z'), venue: 'Atlanta Stadium' },

  // ── TERCER PUESTO ─────────────────────────────────────────────────────────
  { matchNumber: 103, stage: 'THIRD_PLACE', scheduledAt: new Date('2026-07-18T21:00:00Z'), venue: 'Miami Stadium' },

  // ── FINAL ─────────────────────────────────────────────────────────────────
  { matchNumber: 104, stage: 'FINAL', scheduledAt: new Date('2026-07-19T19:00:00Z'), venue: 'MetLife Stadium, New Jersey' },
]
