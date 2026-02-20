import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 404 })

  await prisma.user.update({
    where: { id },
    data: {
      emailVerified: true,
      emailVerifyToken: null,
      emailVerifyTokenExpires: null,
    },
  })

  return { ok: true }
})
