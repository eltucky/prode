import { describe, it, expect } from 'vitest'

function resolveRedirect(
  isLoggedIn: boolean,
  pathname: string
): 'login' | 'dashboard' | null {
  const isPublic = pathname === '/login' || pathname.startsWith('/api/auth')
  if (!isLoggedIn && !isPublic) return 'login'
  if (isLoggedIn && pathname === '/login') return 'dashboard'
  return null
}

describe('lógica de redirección del middleware', () => {
  it('redirige usuario no autenticado al login', () => {
    expect(resolveRedirect(false, '/dashboard')).toBe('login')
  })

  it('redirige usuario no autenticado en ruta protegida cualquiera', () => {
    expect(resolveRedirect(false, '/groups/abc')).toBe('login')
  })

  it('permite usuario no autenticado en /login', () => {
    expect(resolveRedirect(false, '/login')).toBeNull()
  })

  it('permite usuario no autenticado en rutas /api/auth', () => {
    expect(resolveRedirect(false, '/api/auth/signin')).toBeNull()
  })

  it('redirige usuario autenticado en /login al dashboard', () => {
    expect(resolveRedirect(true, '/login')).toBe('dashboard')
  })

  it('permite usuario autenticado en ruta protegida', () => {
    expect(resolveRedirect(true, '/dashboard')).toBeNull()
  })
})
