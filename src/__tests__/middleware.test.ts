import { describe, it, expect } from 'vitest'

function resolveRedirect(
  isLoggedIn: boolean,
  pathname: string
): 'login' | 'grupos' | null {
  const isPublic = pathname === '/' || pathname === '/login' || pathname === '/reglas' || pathname === '/torneo' || pathname.startsWith('/torneo?') || pathname.startsWith('/api/auth')
  if (!isLoggedIn && !isPublic) return 'login'
  if (isLoggedIn && pathname === '/login') return 'grupos'
  return null
}

describe('lógica de redirección del middleware', () => {
  it('redirige usuario no autenticado al login', () => {
    expect(resolveRedirect(false, '/grupos')).toBe('login')
  })

  it('redirige usuario no autenticado en ruta protegida cualquiera', () => {
    expect(resolveRedirect(false, '/grupos/abc')).toBe('login')
  })

  it('permite usuario no autenticado en /login', () => {
    expect(resolveRedirect(false, '/login')).toBeNull()
  })

  it('permite usuario no autenticado en rutas /api/auth', () => {
    expect(resolveRedirect(false, '/api/auth/signin')).toBeNull()
  })

  it('permite usuario no autenticado en /', () => {
    expect(resolveRedirect(false, '/')).toBeNull()
  })

  it('permite usuario no autenticado en /torneo', () => {
    expect(resolveRedirect(false, '/torneo')).toBeNull()
  })

  it('permite usuario no autenticado en /reglas', () => {
    expect(resolveRedirect(false, '/reglas')).toBeNull()
  })

  it('redirige usuario autenticado en /login a grupos', () => {
    expect(resolveRedirect(true, '/login')).toBe('grupos')
  })

  it('permite usuario autenticado en ruta protegida', () => {
    expect(resolveRedirect(true, '/grupos')).toBeNull()
  })
})
