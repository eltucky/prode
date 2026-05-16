import { describe, it, expect } from 'vitest'
import { assertNotBlocked, assertNotSelf } from '@/lib/admin'

describe('assertNotBlocked', () => {
  it('lanza error si el usuario está bloqueado', () => {
    expect(() => assertNotBlocked(true)).toThrow('bloqueada')
  })

  it('no lanza error si el usuario no está bloqueado', () => {
    expect(() => assertNotBlocked(false)).not.toThrow()
  })
})

describe('assertNotSelf', () => {
  it('lanza error si el actor y el target son el mismo usuario', () => {
    expect(() => assertNotSelf('user-1', 'user-1', 'bloquearte')).toThrow('propia cuenta')
  })

  it('no lanza error si son usuarios distintos', () => {
    expect(() => assertNotSelf('user-1', 'user-2', 'bloquear')).not.toThrow()
  })
})
