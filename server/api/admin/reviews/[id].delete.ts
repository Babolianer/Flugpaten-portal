import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const reviewId = getRouterParam(event, 'id')
  if (!reviewId) throw createError({ statusCode: 400 })

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  })

  if (!review) {
    throw createError({ statusCode: 404, message: 'Bewertung nicht gefunden' })
  }

  await prisma.review.delete({
    where: { id: reviewId },
  })

  return { ok: true }
})
