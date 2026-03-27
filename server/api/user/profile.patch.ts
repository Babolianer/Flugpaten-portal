import { z } from 'zod'
import { requireAuth } from '~~/server/utils/auth'
import { prisma } from '~~/server/utils/prisma'

const schema = z.object({
  firstName: z.string().max(100).optional().nullable(),
  lastName: z.string().max(100).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  city: z.string().max(200).optional().nullable(),
  countryCode: z.string().max(10).optional().nullable(),
  aboutMe: z.string().max(2000).optional().nullable(),
  languages: z.array(z.string().max(100)).max(20).optional(),
  preferredRoutes: z.array(z.string().max(200)).max(50).optional(),
  frequentAirports: z.array(z.string().max(50)).max(30).optional(),
  preferredLanguage: z.enum(['de', 'en', 'fr', 'es', 'it', 'pl']).optional(),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  if (user.role !== 'USER') {
    throw createError({ statusCode: 403, message: 'Nur Flugpaten haben ein Profil.' })
  }

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Invalid input', data: parsed.error.flatten() })
  }

  const { firstName, lastName, phone, preferredLanguage, ...profileData } = parsed.data

  const userUpdate: {
    displayName?: string
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
    preferredLanguage?: string
  } = {}
  if (phone !== undefined) userUpdate.phone = phone?.trim() || null
  if (firstName !== undefined) userUpdate.firstName = firstName?.trim() || null
  if (lastName !== undefined) userUpdate.lastName = lastName?.trim() || null
  if (preferredLanguage !== undefined) userUpdate.preferredLanguage = preferredLanguage
  if (firstName !== undefined || lastName !== undefined) {
    const existing = await prisma.user.findUnique({ where: { id: user.id }, select: { firstName: true, lastName: true } })
    const first = (firstName ?? existing?.firstName ?? null)?.trim() || ''
    const last = (lastName ?? existing?.lastName ?? null)?.trim() || ''
    const combined = [first, last].filter(Boolean).join(' ').trim()
    if (combined) userUpdate.displayName = combined
  }
  if (Object.keys(userUpdate).length) {
    await prisma.user.update({
      where: { id: user.id },
      data: userUpdate,
    })
    if (preferredLanguage) {
      setCookie(event, 'pawbridge_locale', preferredLanguage, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
      })
    }
  }

  const cleanProfileData = Object.fromEntries(
    Object.entries(profileData).filter(([, v]) => v !== undefined)
  ) as Record<string, unknown>

  const profile = await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      ...(cleanProfileData as Record<string, unknown>),
    },
    update: cleanProfileData,
  })

  return { profile }
})
