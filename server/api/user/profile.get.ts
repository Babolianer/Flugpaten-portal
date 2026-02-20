import { requireAuth } from '~~/server/utils/auth'
import { prisma } from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  if (user.role !== 'USER') {
    throw createError({ statusCode: 403, message: 'Nur Flugpaten haben ein Profil.' })
  }

  const [profile, dbUser] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId: user.id } }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { displayName: true },
    }),
  ])

  return {
    profile: profile || null,
    displayName: dbUser?.displayName ?? user.displayName,
  }
})
