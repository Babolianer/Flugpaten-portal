import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { hashPassword, signJwt } from '~~/server/utils/auth'
import { fireEmailTrigger } from '~~/server/utils/emailTriggerEngine'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['USER', 'ORG_USER']),
  displayName: z.string().min(1),
  phone: z.string().optional(),
  termsAccepted: z.boolean().optional(),
  privacyAccepted: z.boolean().optional(),
  newsletterOptIn: z.boolean().optional(),
  preferredLanguage: z.enum(['de', 'en', 'fr', 'es', 'it', 'pl']),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Invalid input', data: parsed.error.flatten() })
  }

  const { email, password, role, displayName, phone, termsAccepted, privacyAccepted, newsletterOptIn, preferredLanguage } = parsed.data

  if (role === 'USER') {
    if (termsAccepted !== true || privacyAccepted !== true) {
      throw createError({ statusCode: 400, message: 'Bitte akzeptiere die Nutzungsbedingungen und die Datenschutzerklärung.' })
    }
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw createError({ statusCode: 409, message: 'Email already registered' })
  }

  const passwordHash = await hashPassword(password)

  if (role === 'USER') {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        displayName,
        phone,
        emailVerified: false,
        newsletterOptIn: !!newsletterOptIn,
        preferredLanguage,
      },
      select: {
        id: true,
        email: true,
        role: true,
        displayName: true,
      },
    })

    const config = useRuntimeConfig()
    const cookieName = config.cookieName || 'tierschutz_session'
    const token = await signJwt({ sub: user.id, role: user.role })
    setCookie(event, cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    setCookie(event, 'pawbridge_locale', preferredLanguage, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    })

    if (newsletterOptIn) {
      fireEmailTrigger('NEWSLETTER_OPT_IN_USER', { userId: user.id })
    }
    fireEmailTrigger('FLUGPATE_REGISTRATION_WELCOME_USER', { userId: user.id })

    return { user }
  }

  const user = await prisma.user.create({
    data: { email, passwordHash, role, displayName, phone, newsletterOptIn: !!newsletterOptIn, preferredLanguage },
    select: {
      id: true,
      email: true,
      role: true,
      displayName: true,
      phone: true,
      createdAt: true,
    },
  })

  if (newsletterOptIn) {
    fireEmailTrigger('NEWSLETTER_OPT_IN_ORG_USER', { userId: user.id })
  }

  return { user }
})
