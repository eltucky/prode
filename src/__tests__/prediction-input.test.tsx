// src/__tests__/prediction-input.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PredictionInput } from '@/components/prediction-input'

vi.mock('@/app/(protected)/torneo/actions', () => ({
  savePrediction: vi.fn().mockResolvedValue(undefined),
  deletePrediction: vi.fn().mockResolvedValue(undefined),
}))

const homeTeam = { flag: '🇦🇷', name: 'Argentina' }
const awayTeam = { flag: '🇧🇷', name: 'Brasil' }

const baseProps = {
  matchId: 'match-1',
  prediction: null,
  homeTeam,
  awayTeam,
  homeTeamId: 'home-1',
  awayTeamId: 'away-1',
  isKnockout: false,
  scheduledAt: new Date(Date.now() + 3600 * 1000).toISOString(),
}

describe('PredictionInput', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('muestra — cuando no hay pronóstico', () => {
    render(<PredictionInput {...baseProps} />)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(2)
  })

  it('muestra hint cuando no hay pronóstico ni scores', () => {
    render(<PredictionInput {...baseProps} />)
    expect(screen.getByText('Tocá ▲ para empezar')).toBeDefined()
  })

  it('incrementa el score local al hacer click en ▲ del equipo local', () => {
    render(<PredictionInput {...baseProps} />)
    const upButtons = screen.getAllByLabelText('Aumentar')
    fireEvent.click(upButtons[0])
    expect(screen.getByText('0')).toBeDefined()
  })

  it('segundo click en ▲ va a 1', () => {
    render(<PredictionInput {...baseProps} />)
    const upButtons = screen.getAllByLabelText('Aumentar')
    fireEvent.click(upButtons[0])
    fireEvent.click(upButtons[0])
    expect(screen.getByText('1')).toBeDefined()
  })

  it('▼ no hace nada cuando el score es null', () => {
    render(<PredictionInput {...baseProps} />)
    const downButtons = screen.getAllByLabelText('Disminuir')
    fireEvent.click(downButtons[0])
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(2)
  })

  it('▼ no baja de 0', () => {
    render(<PredictionInput {...baseProps} />)
    const upButtons = screen.getAllByLabelText('Aumentar')
    const downButtons = screen.getAllByLabelText('Disminuir')
    fireEvent.click(upButtons[0]) // → 0
    fireEvent.click(downButtons[0]) // intenta bajar de 0
    expect(screen.getByText('0')).toBeDefined()
  })

  it('muestra "Completá el otro score" cuando solo un equipo tiene score', () => {
    render(<PredictionInput {...baseProps} />)
    const upButtons = screen.getAllByLabelText('Aumentar')
    fireEvent.click(upButtons[0]) // home = 0, away = null
    expect(screen.getByText('Completá el otro score')).toBeDefined()
  })

  it('no muestra el ícono de borrar cuando no hay predicción guardada', () => {
    render(<PredictionInput {...baseProps} />)
    expect(screen.queryByLabelText('Borrar pronóstico')).toBeNull()
  })

  it('muestra el ícono de borrar cuando hay predicción guardada', () => {
    render(<PredictionInput
      {...baseProps}
      prediction={{ homeScore: 2, awayScore: 1, predictedWinnerId: null }}
    />)
    expect(screen.getByLabelText('Borrar pronóstico')).toBeDefined()
  })

  it('al clickear el ícono de borrar, muestra confirmación', () => {
    render(<PredictionInput
      {...baseProps}
      prediction={{ homeScore: 2, awayScore: 1, predictedWinnerId: null }}
    />)
    fireEvent.click(screen.getByLabelText('Borrar pronóstico'))
    expect(screen.getByText('¿Borrar pronóstico?')).toBeDefined()
    expect(screen.getByText('Sí')).toBeDefined()
    expect(screen.getByText('No')).toBeDefined()
  })

  it('al confirmar borrar con "No", cierra la confirmación', () => {
    render(<PredictionInput
      {...baseProps}
      prediction={{ homeScore: 2, awayScore: 1, predictedWinnerId: null }}
    />)
    fireEvent.click(screen.getByLabelText('Borrar pronóstico'))
    fireEvent.click(screen.getByText('No'))
    expect(screen.queryByText('¿Borrar pronóstico?')).toBeNull()
  })

  it('inicializa con los scores del pronóstico existente', () => {
    render(<PredictionInput
      {...baseProps}
      prediction={{ homeScore: 3, awayScore: 0, predictedWinnerId: null }}
    />)
    expect(screen.getByText('3')).toBeDefined()
    expect(screen.getByText('0')).toBeDefined()
  })
})
