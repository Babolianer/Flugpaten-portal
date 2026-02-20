import { requireAuth } from '~~/server/utils/auth'
import { prisma } from '~~/server/utils/prisma'
import { uploadProfileImage } from '~~/server/utils/supabaseStorage'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  if (user.role !== 'USER') {
    throw createError({ statusCode: 403, message: 'Nur Flugpaten haben ein Profil.' })
  }

  const formData = await readMultipartFormData(event)
  const file = formData?.find((f) => f.name === 'file')
  if (!file?.data || !file.filename) {
    throw createError({ statusCode: 400, message: 'Keine Datei hochgeladen.' })
  }

  const avatarUrl = await uploadProfileImage(user.id, file.filename, file.data, file.type || 'image/jpeg')

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, avatarUrl },
    update: { avatarUrl },
  })

  return { avatarUrl }
})
