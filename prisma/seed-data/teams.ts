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
