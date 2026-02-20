import { prisma } from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const token = typeof query.token === 'string' ? query.token.trim() : null
  if (!token) {
    throw createError({ statusCode: 400, message: 'Token fehlt.' })
  }

  const user = await prisma.user.findFirst({
    where: {
      emailVerifyToken: token,
      emailVerifyTokenExpires: { gt: new Date() },
    },
  })
  if (!user) {
    throw createError({ statusCode: 400, message: 'Link abgelaufen oder ungültig. Bitte registriere dich erneut oder fordere einen neuen Link an.' })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerifyToken: null,
      emailVerifyTokenExpires: null,
    },
  })

  return { ok: true, verified: true }
})
