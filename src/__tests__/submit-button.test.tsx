import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SubmitButton } from '@/components/submit-button'

// useFormStatus mock — controlled per test
vi.mock('react-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dom')>()
  return { ...actual, useFormStatus: vi.fn() }
})

import { useFormStatus } from 'react-dom'

describe('SubmitButton', () => {
  it('renders children when not pending', () => {
    vi.mocked(useFormStatus).mockReturnValue({ pending: false, data: null, method: null, action: null })
    render(<SubmitButton>Guardar</SubmitButton>)
    expect(screen.getByRole('button')).toHaveTextContent('Guardar')
  })

  it('shows spinner and hides children when pending', () => {
    vi.mocked(useFormStatus).mockReturnValue({ pending: true, data: null, method: null, action: null })
    render(<SubmitButton>Guardar</SubmitButton>)
    expect(screen.queryByText('Guardar')).toBeNull()
    expect(document.querySelector('svg')).toBeTruthy()
  })

  it('disables button when pending', () => {
    vi.mocked(useFormStatus).mockReturnValue({ pending: true, data: null, method: null, action: null })
    render(<SubmitButton>Guardar</SubmitButton>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('disables button when props.disabled is true, regardless of pending', () => {
    vi.mocked(useFormStatus).mockReturnValue({ pending: false, data: null, method: null, action: null })
    render(<SubmitButton disabled>Guardar</SubmitButton>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('always renders type="submit"', () => {
    vi.mocked(useFormStatus).mockReturnValue({ pending: false, data: null, method: null, action: null })
    render(<SubmitButton>Guardar</SubmitButton>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('forwards className to button element', () => {
    vi.mocked(useFormStatus).mockReturnValue({ pending: false, data: null, method: null, action: null })
    render(<SubmitButton className="bg-gray-900 text-white">Guardar</SubmitButton>)
    expect(screen.getByRole('button').className).toContain('bg-gray-900')
    expect(screen.getByRole('button').className).toContain('text-white')
  })

  it('adds opacity-60 and cursor-not-allowed classes when pending', () => {
    vi.mocked(useFormStatus).mockReturnValue({ pending: true, data: null, method: null, action: null })
    render(<SubmitButton className="bg-gray-900">Guardar</SubmitButton>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('opacity-60')
    expect(btn.className).toContain('cursor-not-allowed')
  })
})
