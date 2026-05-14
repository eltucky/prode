export function validateGroupName(name: unknown): string {
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('El nombre no puede estar vacío')
  }
  if (name.trim().length > 50) {
    throw new Error('El nombre no puede superar 50 caracteres')
  }
  return name.trim()
}

export function validateInviteCode(code: unknown): string {
  if (typeof code !== 'string' || code.trim().length === 0) {
    throw new Error('Ingresá un código de invitación')
  }
  return code.trim()
}
