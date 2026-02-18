import bcrypt from 'bcrypt'
import { SignJWT, jwtVerify } from 'jose'
import type { H3Event } from 'h3'
import { prisma } from './prisma'
import type { User } from '@prisma/client'

const SALT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function signJwt(payload: { sub: string; role: string }): Promise<string> {
  const config = useRuntimeConfig()
  const secret = new TextEncoder().encode(config.jwtSecret)
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(secret)
}

export async function verifyJwt(token: string): Promise<{ sub: string; role: string } | null> {
  try {
    const config = useRuntimeConfig()
    const secret = new TextEncoder().encode(config.jwtSecret)
    const { payload } = await jwtVerify(token, secret)
    if (payload.sub && payload.role) {
      return { sub: payload.sub as string, role: payload.role as string }
    }
    return null
  } catch {
    return null
  }
}

/** Token für Wartungsmodus-Bypass: Wer das Passwort kennt, darf die normale Seite sehen (ohne eingeloggt zu sein). */
export async function signMaintenanceBypass(): Promise<string> {
  const config = useRuntimeConfig()
  const secret = new TextEncoder().encode(config.jwtSecret)
  return new SignJWT({ type: 'maintenance_bypass' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .setIssuedAt()
    .sign(secret)
}

export async function verifyMaintenanceBypass(token: string): Promise<boolean> {
  try {
    const config = useRuntimeConfig()
    const secret = new TextEncoder().encode(config.jwtSecret)
    const { payload } = await jwtVerify(token, secret)
    return payload?.type === 'maintenance_bypass'
  } catch {
    return false
  }
}

export async function getUserFromEvent(event: H3Event): Promise<(User & { memberships?: { organization: { id: string; name: string; slug: string } }[] }) | null> {
  const config = useRuntimeConfig()
  const cookieName = config.cookieName || 'tierschutz_session'
  const token = getCookie(event, cookieName)
  if (!token) return null

  const payload = await verifyJwt(token)
  if (!payload) return null

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: {
      memberships: {
        include: { organization: { select: { id: true, name: true, slug: true, status: true } } },
      },
    },
  })

  if (!user || user.role !== payload.role) return null
  return user as User & { memberships?: { organization: { id: string; name: string; slug: string } }[] }
}

export async function requireAuth(event: H3Event): Promise<User & { memberships?: { organization: { id: string; name: string; slug: string } }[] }> {
  const user = await getUserFromEvent(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
  return user
}

export async function requireRole(
  event: H3Event,
  allowedRoles: string[]
): Promise<User & { memberships?: { organization: { id: string; name: string; slug: string } }[] }> {
  const user = await requireAuth(event)
  if (!allowedRoles.includes(user.role)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }
  return user
}
