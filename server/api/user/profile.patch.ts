import { z } from 'zod'
import { requireAuth } from '~~/server/utils/auth'
import { prisma } from '~~/server/utils/prisma'

const schema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  city: z.string().max(200).optional().nullable(),
  countryCode: z.string().max(10).optional().nullable(),
  aboutMe: z.string().max(2000).optional().nullable(),
  languages: z.array(z.string().max(10)).max(20).optional(),
  preferredRoutes: z.array(z.string().max(50)).max(50).optional(),
  frequentAirports: z.array(z.string().max(10)).max(30).optional(),
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

  const { displayName, ...profileData } = parsed.data

  if (displayName) {
    await prisma.user.update({
      where: { id: user.id },
      data: { displayName: displayName.trim() },
    })
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
