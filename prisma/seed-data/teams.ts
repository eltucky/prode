// prisma/seed-data/teams.ts
export type TeamSeed = {
  code: string
  name: string
  flag: string
  group: string
}

export const teams: TeamSeed[] = [
  // ── Grupo A ──────────────────────────────────────────────────
  { code: 'MEX', name: 'México',         flag: '🇲🇽', group: 'A' },
  { code: 'RSA', name: 'Sudáfrica',      flag: '🇿🇦', group: 'A' },
  { code: 'KOR', name: 'Corea del Sur',  flag: '🇰🇷', group: 'A' },
  // ── Grupo B ──────────────────────────────────────────────────
  { code: 'CAN', name: 'Canadá',         flag: '🇨🇦', group: 'B' },
  { code: 'QAT', name: 'Qatar',          flag: '🇶🇦', group: 'B' },
  { code: 'SUI', name: 'Suiza',          flag: '🇨🇭', group: 'B' },
  // ── Grupo C ──────────────────────────────────────────────────
  { code: 'BRA', name: 'Brasil',         flag: '🇧🇷', group: 'C' },
  { code: 'MAR', name: 'Marruecos',      flag: '🇲🇦', group: 'C' },
  { code: 'HAI', name: 'Haití',          flag: '🇭🇹', group: 'C' },
  { code: 'SCO', name: 'Escocia',        flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', group: 'C' },
  // ── Grupo D ──────────────────────────────────────────────────
  { code: 'USA', name: 'Estados Unidos', flag: '🇺🇸', group: 'D' },
  { code: 'PAR', name: 'Paraguay',       flag: '🇵🇾', group: 'D' },
  { code: 'AUS', name: 'Australia',      flag: '🇦🇺', group: 'D' },
  // ── Grupo E ──────────────────────────────────────────────────
  { code: 'GER', name: 'Alemania',       flag: '🇩🇪', group: 'E' },
  { code: 'CUW', name: 'Curazao',        flag: '🇨🇼', group: 'E' },
  { code: 'CIV', name: 'Costa de Marfil',flag: '🇨🇮', group: 'E' },
  { code: 'ECU', name: 'Ecuador',        flag: '🇪🇨', group: 'E' },
  // ── Grupo F ──────────────────────────────────────────────────
  { code: 'NED', name: 'Países Bajos',   flag: '🇳🇱', group: 'F' },
  { code: 'JPN', name: 'Japón',          flag: '🇯🇵', group: 'F' },
  { code: 'TUN', name: 'Túnez',          flag: '🇹🇳', group: 'F' },
  // ── Grupo G ──────────────────────────────────────────────────
  { code: 'BEL', name: 'Bélgica',        flag: '🇧🇪', group: 'G' },
  { code: 'EGY', name: 'Egipto',         flag: '🇪🇬', group: 'G' },
  { code: 'IRN', name: 'Irán',           flag: '🇮🇷', group: 'G' },
  { code: 'NZL', name: 'Nueva Zelanda',  flag: '🇳🇿', group: 'G' },
  // ── Grupo H ──────────────────────────────────────────────────
  { code: 'ESP', name: 'España',         flag: '🇪🇸', group: 'H' },
  { code: 'CPV', name: 'Cabo Verde',     flag: '🇨🇻', group: 'H' },
  { code: 'SAU', name: 'Arabia Saudita', flag: '🇸🇦', group: 'H' },
  { code: 'URU', name: 'Uruguay',        flag: '🇺🇾', group: 'H' },
  // ── Grupo I ──────────────────────────────────────────────────
  { code: 'FRA', name: 'Francia',        flag: '🇫🇷', group: 'I' },
  { code: 'SEN', name: 'Senegal',        flag: '🇸🇳', group: 'I' },
  { code: 'NOR', name: 'Noruega',        flag: '🇳🇴', group: 'I' },
  // ── Grupo J ──────────────────────────────────────────────────
  { code: 'ARG', name: 'Argentina',      flag: '🇦🇷', group: 'J' },
  { code: 'ALG', name: 'Argelia',        flag: '🇩🇿', group: 'J' },
  { code: 'AUT', name: 'Austria',        flag: '🇦🇹', group: 'J' },
  { code: 'JOR', name: 'Jordania',       flag: '🇯🇴', group: 'J' },
  // ── Grupo K ──────────────────────────────────────────────────
  { code: 'POR', name: 'Portugal',       flag: '🇵🇹', group: 'K' },
  { code: 'UZB', name: 'Uzbekistán',     flag: '🇺🇿', group: 'K' },
  { code: 'COL', name: 'Colombia',       flag: '🇨🇴', group: 'K' },
  // ── Grupo L ──────────────────────────────────────────────────
  { code: 'ENG', name: 'Inglaterra',     flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'L' },
  { code: 'CRO', name: 'Croacia',        flag: '🇭🇷', group: 'L' },
  { code: 'GHA', name: 'Ghana',          flag: '🇬🇭', group: 'L' },
  { code: 'PAN', name: 'Panamá',         flag: '🇵🇦', group: 'L' },
]
