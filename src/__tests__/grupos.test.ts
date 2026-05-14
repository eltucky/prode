import { describe, it, expect } from 'vitest'
import { validateGroupName, validateInviteCode } from '@/lib/grupos'

describe('validateGroupName', () => {
  it('retorna el nombre trimmeado si es válido', () => {
    expect(validateGroupName('  Los Pibes  ')).toBe('Los Pibes')
  })

  it('lanza error si está vacío', () => {
    expect(() => validateGroupName('')).toThrow('El nombre no puede estar vacío')
    expect(() => validateGroupName('   ')).toThrow('El nombre no puede estar vacío')
  })

  it('lanza error si supera 50 caracteres', () => {
    expect(() => validateGroupName('a'.repeat(51))).toThrow('superar 50 caracteres')
  })

  it('acepta exactamente 50 caracteres', () => {
    expect(validateGroupName('a'.repeat(50))).toBe('a'.repeat(50))
  })
})

describe('validateInviteCode', () => {
  it('retorna el código trimmeado si no está vacío', () => {
    expect(validateInviteCode('  abc123  ')).toBe('abc123')
  })

  it('lanza error si está vacío', () => {
    expect(() => validateInviteCode('')).toThrow('Ingresá un código de invitación')
    expect(() => validateInviteCode('   ')).toThrow('Ingresá un código de invitación')
  })
})
