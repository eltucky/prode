import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InviteCopyButton } from '@/components/invite-copy-button'
import { MockDictProvider } from '@/test-utils/dict-provider'

const mockWriteText = vi.fn().mockResolvedValue(undefined)

beforeEach(() => {
  vi.stubGlobal('navigator', { clipboard: { writeText: mockWriteText } })
  vi.stubGlobal('window', { location: { origin: 'https://prode.app' } })
  mockWriteText.mockClear()
})

function renderButton() {
  return render(
    <MockDictProvider>
      <InviteCopyButton inviteCode="abc123" />
    </MockDictProvider>
  )
}

describe('InviteCopyButton', () => {
  it('renders copy button', () => {
    renderButton()
    expect(screen.getByRole('button', { name: 'Copiar' })).toBeInTheDocument()
  })

  it('calls clipboard with full URL on click', async () => {
    renderButton()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copiar' }))
    })
    expect(mockWriteText).toHaveBeenCalledWith('https://prode.app/invite/abc123')
  })

  it('shows ¡Copiado! after copy', async () => {
    vi.useFakeTimers()
    renderButton()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copiar' }))
    })
    expect(screen.getByRole('button', { name: '¡Copiado!' })).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('resets button to Copiar after 2 seconds', async () => {
    vi.useFakeTimers()
    renderButton()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copiar' }))
    })
    expect(screen.getByRole('button', { name: '¡Copiado!' })).toBeInTheDocument()
    await act(async () => {
      vi.advanceTimersByTime(2001)
    })
    expect(screen.getByRole('button', { name: 'Copiar' })).toBeInTheDocument()
    vi.useRealTimers()
  })
})
