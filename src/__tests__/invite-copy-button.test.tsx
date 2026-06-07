import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InviteCopyButton } from '@/components/invite-copy-button'

const mockWriteText = vi.fn().mockResolvedValue(undefined)

beforeEach(() => {
  vi.stubGlobal('navigator', { clipboard: { writeText: mockWriteText } })
  vi.stubGlobal('window', { location: { origin: 'https://prode.app' } })
  mockWriteText.mockClear()
})

describe('InviteCopyButton', () => {
  it('renders copy button', () => {
    render(<InviteCopyButton inviteCode="abc123" />)
    expect(screen.getByRole('button', { name: 'Copiar' })).toBeInTheDocument()
  })

  it('calls clipboard with full URL on click', async () => {
    render(<InviteCopyButton inviteCode="abc123" />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copiar' }))
    })
    expect(mockWriteText).toHaveBeenCalledWith('https://prode.app/invite/abc123')
  })

  it('shows ¡Copiado! after copy', async () => {
    vi.useFakeTimers()
    render(<InviteCopyButton inviteCode="abc123" />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copiar' }))
    })
    expect(screen.getByRole('button', { name: '¡Copiado!' })).toBeInTheDocument()
    vi.useRealTimers()
  })
})
