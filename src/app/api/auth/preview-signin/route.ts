import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { randomBytes } from 'crypto'

const PREVIEW_EMAIL = 'mtucat@gmail.com'
// NextAuth v5 uses __Secure- prefix on HTTPS (all Vercel envs)
const SESSION_COOKIE = '__Secure-authjs.session-token'

export async function GET(request: Request) {
  if (process.env.VERCEL_ENV !== 'preview') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const user = await prisma.user.findUnique({ where: { email: PREVIEW_EMAIL } })
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const sessionToken = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  await prisma.session.create({
    data: { sessionToken, userId: user.id, expires },
  })

  const response = NextResponse.redirect(new URL('/dashboard', request.url))
  response.cookies.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: true,
    expires,
    path: '/',
    sameSite: 'lax',
  })
  return response
}
