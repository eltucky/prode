export function assertNotBlocked(isBlocked: boolean): void {
  if (isBlocked) throw new Error('Tu cuenta está bloqueada')
}

export function assertNotSelf(actingUserId: string, targetUserId: string, action: string): void {
  if (actingUserId === targetUserId) throw new Error(`No podés ${action} en tu propia cuenta`)
}
