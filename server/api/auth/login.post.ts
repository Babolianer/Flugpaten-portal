import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { verifyPassword, signJwt } from '~~/server/utils/auth'

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

  if (user.role === 'ORG_USER') {
    const hasBlockedOrg = user.memberships?.some((m) => m.organization.status === 'CANCELLED')
    if (hasBlockedOrg) {
      throw createError({
        statusCode: 403,
        message: 'Ihr Zugang wurde gesperrt. Eine Ihrer Organisationen wurde durch den Administrator gesperrt.',
      })
    }
  }

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

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      phone: user.phone,
    },
  }
})
