import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MatchCard } from '@/components/match-card'

const baseMatch = {
  id: 'match-1',
  stage: 'GROUP' as const,
  status: 'SCHEDULED' as const,
  scheduledAt: new Date('2026-06-15T18:00:00Z'),
  homeScore: null,
  awayScore: null,
  homeTeamId: 'team-a',
  awayTeamId: 'team-b',
  groupName: 'A',
  homeTeam: { flag: '🇦🇷', name: 'Argentina' },
  awayTeam: { flag: '🇧🇷', name: 'Brasil' },
}

const baseDict = {
  match: {
    statusScheduled: 'Programado',
    statusInProgress: 'En juego',
    statusFinished: 'Finalizado',
    statusPostponed: 'Postergado',
    statusCancelled: 'Cancelado',
    yourPrediction: 'Tu pronóstico:',
    noPrediction: 'Sin pronóstico',
    winner: 'ganador: {name}',
    loginToPredict: 'Iniciá sesión para hacer tu pronóstico →',
  },
  torneo: { groupLabel: 'Grupo {name}' },
} as any

describe('MatchCard', () => {
  it('renders a link to the match detail page in the header', () => {
    render(
      <MatchCard
        match={baseMatch}
        prediction={null}
        hasSession={false}
        showGroupLabel={false}
        locked={false}
        isKnockout={false}
        dict={baseDict}
      />
    )
    const link = screen.getByRole('link', { name: /argentina/i })
    expect(link).toHaveAttribute('href', '/torneo/match-1')
  })
})
