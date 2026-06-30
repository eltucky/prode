// Bracket structure for FIFA 2026 World Cup

export type BracketSlot = { matchNumber: number; slot: 'home' | 'away' }
export type MatchOutcome = { winner?: BracketSlot; loser?: BracketSlot }

// Maps each knockout match number → where winner (and loser for semis) advance
export const knockoutAdvancement: Record<number, MatchOutcome> = {
  // Round of 32 → Round of 16
  // Match 89 (Philadelphia): Winner(74) vs Winner(77)
  // Match 90 (Houston):      Winner(73) vs Winner(75)
  // Match 91 (New York NJ):  Winner(76) vs Winner(78)
  // Match 92 (Mexico City):  Winner(79) vs Winner(80)
  // Match 93 (Dallas):       Winner(83) vs Winner(84)
  // Match 94 (Seattle):      Winner(81) vs Winner(82)
  // Match 95 (Atlanta):      Winner(86) vs Winner(88)
  // Match 96 (Vancouver):    Winner(85) vs Winner(87)
  73: { winner: { matchNumber: 90, slot: 'home' } },
  74: { winner: { matchNumber: 89, slot: 'home' } },
  75: { winner: { matchNumber: 90, slot: 'away' } },
  76: { winner: { matchNumber: 91, slot: 'home' } },
  77: { winner: { matchNumber: 89, slot: 'away' } },
  78: { winner: { matchNumber: 91, slot: 'away' } },
  79: { winner: { matchNumber: 92, slot: 'home' } },
  80: { winner: { matchNumber: 92, slot: 'away' } },
  81: { winner: { matchNumber: 94, slot: 'home' } },
  82: { winner: { matchNumber: 94, slot: 'away' } },
  83: { winner: { matchNumber: 93, slot: 'home' } },
  84: { winner: { matchNumber: 93, slot: 'away' } },
  85: { winner: { matchNumber: 96, slot: 'home' } },
  86: { winner: { matchNumber: 95, slot: 'home' } },
  87: { winner: { matchNumber: 96, slot: 'away' } },
  88: { winner: { matchNumber: 95, slot: 'away' } },

  // Round of 16 → Quarter Finals
  // Match 97 (QF): Winner(89) vs Winner(90)
  // Match 98 (QF): Winner(93) vs Winner(94)
  // Match 99 (QF): Winner(91) vs Winner(92)
  // Match 100 (QF): Winner(95) vs Winner(96)
  89: { winner: { matchNumber: 97, slot: 'home' } },
  90: { winner: { matchNumber: 97, slot: 'away' } },
  91: { winner: { matchNumber: 99, slot: 'home' } },
  92: { winner: { matchNumber: 99, slot: 'away' } },
  93: { winner: { matchNumber: 98, slot: 'home' } },
  94: { winner: { matchNumber: 98, slot: 'away' } },
  95: { winner: { matchNumber: 100, slot: 'home' } },
  96: { winner: { matchNumber: 100, slot: 'away' } },

  // Quarter Finals → Semi Finals
  97: { winner: { matchNumber: 101, slot: 'home' } },
  98: { winner: { matchNumber: 101, slot: 'away' } },
  99: { winner: { matchNumber: 102, slot: 'home' } },
  100: { winner: { matchNumber: 102, slot: 'away' } },

  // Semi Finals → Final + 3rd Place
  101: { winner: { matchNumber: 104, slot: 'home' }, loser: { matchNumber: 103, slot: 'home' } },
  102: { winner: { matchNumber: 104, slot: 'away' }, loser: { matchNumber: 103, slot: 'away' } },
}

// Maps group winner (pos 1) and runner-up (pos 2) → their R32 slot
// Based on FIFA 2026 World Cup official bracket structure.
// Matches 79, 80, 86, 87 host the 8 best 3rd-place teams (assigned separately).
export type GroupR32Mapping = {
  group: string
  position: 1 | 2
  matchNumber: number
  slot: 'home' | 'away'
}

export const groupToR32: GroupR32Mapping[] = [
  // Match 73: 1A vs 2B
  { group: 'A', position: 1, matchNumber: 73, slot: 'home' },
  { group: 'B', position: 2, matchNumber: 73, slot: 'away' },

  // Match 74: 1C vs 2D
  { group: 'C', position: 1, matchNumber: 74, slot: 'home' },
  { group: 'D', position: 2, matchNumber: 74, slot: 'away' },

  // Match 75: 1I vs 2J
  { group: 'I', position: 1, matchNumber: 75, slot: 'home' },
  { group: 'J', position: 2, matchNumber: 75, slot: 'away' },

  // Match 76: 1G vs 2H
  { group: 'G', position: 1, matchNumber: 76, slot: 'home' },
  { group: 'H', position: 2, matchNumber: 76, slot: 'away' },

  // Match 77: 1K vs 2L
  { group: 'K', position: 1, matchNumber: 77, slot: 'home' },
  { group: 'L', position: 2, matchNumber: 77, slot: 'away' },

  // Match 78: 1E vs 2F
  { group: 'E', position: 1, matchNumber: 78, slot: 'home' },
  { group: 'F', position: 2, matchNumber: 78, slot: 'away' },

  // Match 81: 1B vs 2A
  { group: 'B', position: 1, matchNumber: 81, slot: 'home' },
  { group: 'A', position: 2, matchNumber: 81, slot: 'away' },

  // Match 82: 1D vs 2C
  { group: 'D', position: 1, matchNumber: 82, slot: 'home' },
  { group: 'C', position: 2, matchNumber: 82, slot: 'away' },

  // Match 83: 1F vs 2E
  { group: 'F', position: 1, matchNumber: 83, slot: 'home' },
  { group: 'E', position: 2, matchNumber: 83, slot: 'away' },

  // Match 84: 1H vs 2G
  { group: 'H', position: 1, matchNumber: 84, slot: 'home' },
  { group: 'G', position: 2, matchNumber: 84, slot: 'away' },

  // Match 85: 1L vs 2K
  { group: 'L', position: 1, matchNumber: 85, slot: 'home' },
  { group: 'K', position: 2, matchNumber: 85, slot: 'away' },

  // Match 88: 1J vs 2I
  { group: 'J', position: 1, matchNumber: 88, slot: 'home' },
  { group: 'I', position: 2, matchNumber: 88, slot: 'away' },
]
