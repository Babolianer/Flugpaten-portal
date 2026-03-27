import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { verifyPassword, signJwt } from '~~/server/utils/auth'
import { fireEmailTrigger } from '~~/server/utils/emailTriggerEngine'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Invalid input' })
  }

  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      memberships: {
        include: { organization: { select: { status: true } } },
      },
    },
  })
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw createError({ statusCode: 401, message: 'Invalid email or password' })
  }

  if (user.role === 'USER' && user.blockedAt) {
    throw createError({
      statusCode: 403,
      message: 'Ihr Zugang wurde gesperrt. Bei Fragen wenden Sie sich an den Support.',
    })
  }

  if (user.role === 'ORG_USER') {
    const hasBlockedOrg = user.memberships?.some((m) => m.organization.status === 'CANCELLED')
    if (hasBlockedOrg) {
      throw createError({
        statusCode: 403,
        message: 'Ihr Zugang wurde gesperrt. Eine Ihrer Organisationen wurde durch den Administrator gesperrt.',
      })
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  const token = await signJwt({ sub: user.id, role: user.role })
  const config = useRuntimeConfig()
  const cookieName = config.cookieName || 'tierschutz_session'

  setCookie(event, cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  const preferredLanguage = ['de', 'en', 'fr', 'es', 'it', 'pl'].includes(user.preferredLanguage)
    ? user.preferredLanguage
    : 'de'
  setCookie(event, 'pawbridge_locale', preferredLanguage, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })

  fireEmailTrigger('USER_LOGIN_SECURITY_ADMIN', {
    userId: user.id,
    loginAtIso: new Date().toISOString(),
  })

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      phone: user.phone,
      preferredLanguage: user.preferredLanguage,
    },
  }
})
