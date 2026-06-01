// Maps FIFA 3-letter codes → ISO 3166-1 alpha-2
// Covers all 48 World Cup 2026 teams plus common others.
// Add new entries here when importing tournaments with unknown teams.
const FIFA_TO_ALPHA2: Record<string, string> = {
  // Americas
  MEX: 'MX', RSA: 'ZA', CAN: 'CA', BRA: 'BR', USA: 'US',
  PAR: 'PY', AUS: 'AU', ECU: 'EC', COL: 'CO', URU: 'UY',
  ARG: 'AR', ALG: 'DZ', HAI: 'HT', PAN: 'PA', CHI: 'CL',
  BOL: 'BO', VEN: 'VE', PER: 'PE', CRC: 'CR', HON: 'HN',
  // Europe
  CZE: 'CZ', BIH: 'BA', SUI: 'CH', GER: 'DE', NED: 'NL',
  SWE: 'SE', BEL: 'BE', ESP: 'ES', FRA: 'FR', NOR: 'NO',
  AUT: 'AT', POR: 'PT', CRO: 'HR', TUR: 'TR', SRB: 'RS',
  SVK: 'SK', SVN: 'SI', GRE: 'GR', ROU: 'RO', HUN: 'HU',
  // Africa
  MAR: 'MA', TUN: 'TN', EGY: 'EG', CPV: 'CV', SAU: 'SA',
  SEN: 'SN', COD: 'CD', GHA: 'GH', CIV: 'CI', CMR: 'CM',
  NGA: 'NG', MLI: 'ML', BFA: 'BF',
  // Asia
  KOR: 'KR', QAT: 'QA', IRN: 'IR', IRQ: 'IQ', JOR: 'JO',
  JPN: 'JP', UZB: 'UZ', KSA: 'SA', UAE: 'AE', CHN: 'CN',
  IND: 'IN', THA: 'TH', VIE: 'VN',
  // Oceania / Caribbean
  NZL: 'NZ', CUW: 'CW', JAM: 'JM', TRI: 'TT',
  // Other common
  ITA: 'IT', RUS: 'RU', DEN: 'DK', FIN: 'FI', ISL: 'IS',
  SCG: 'RS', MNE: 'ME',
}

// UK constituent nations use Unicode subdivision tag sequences (no ISO alpha-2)
const SUBDIVISION_FLAGS: Record<string, string> = {
  ENG: '🏴󠁧󁢥󁮧󀠫',
  SCO: '🏴󠁧󁢳󁣴󠁿',
  WAL: '🏴󠁧󁢷󁬳󠁿',
}

function alpha2ToEmoji(alpha2: string): string {
  return [...alpha2.toUpperCase()]
    .map(c => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0)))
    .join('')
}

export function getFlagEmoji(fifaCode: string): string {
  const code = fifaCode.toUpperCase()

  if (code in SUBDIVISION_FLAGS) return SUBDIVISION_FLAGS[code]

  const alpha2 = FIFA_TO_ALPHA2[code]
  if (alpha2) return alpha2ToEmoji(alpha2)

  return '🏳️'
}
