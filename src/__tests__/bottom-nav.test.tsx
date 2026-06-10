import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BottomNav from '@/components/bottom-nav'
import { MockDictProvider } from '@/test-utils/dict-provider'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/torneo'),
}))

vi.mock('@/app/actions', () => ({
  signOutAction: vi.fn(),
}))

function renderBottomNav(isSuperAdmin = false) {
  return render(
    <MockDictProvider>
      <BottomNav isSuperAdmin={isSuperAdmin} />
    </MockDictProvider>
  )
}

describe('BottomNav', () => {
  it('renderiza los 4 tabs principales', () => {
    renderBottomNav()
    expect(screen.getByText('Torneo')).toBeDefined()
    expect(screen.getByText('Grupos')).toBeDefined()
    expect(screen.getByText('Reglas')).toBeDefined()
    expect(screen.getByText('Perfil')).toBeDefined()
  })

  it('renderiza el botón Más', () => {
    renderBottomNav()
    expect(screen.getByText('Más')).toBeDefined()
  })

  it('al hacer click en Más, muestra el sheet con Salir', () => {
    renderBottomNav()
    fireEvent.click(screen.getByText('Más'))
    expect(screen.getByText('Salir')).toBeDefined()
  })

  it('no muestra Admin si isSuperAdmin es false', () => {
    renderBottomNav()
    fireEvent.click(screen.getByText('Más'))
    expect(screen.queryByText('Admin')).toBeNull()
  })

  it('muestra Admin si isSuperAdmin es true', () => {
    renderBottomNav(true)
    fireEvent.click(screen.getByText('Más'))
    expect(screen.getByText('Admin')).toBeDefined()
  })

  it('cierra el sheet al hacer click en el overlay', () => {
    renderBottomNav()
    fireEvent.click(screen.getByText('Más'))
    expect(screen.getByText('Salir')).toBeDefined()
    const overlay = document.querySelector('[data-testid="more-overlay"]')!
    fireEvent.click(overlay)
    expect(screen.queryByText('Salir')).toBeNull()
  })
})
