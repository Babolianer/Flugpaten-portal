import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { ensureOrgAccess } from '~~/server/utils/orgAccess'

const schema = z.object({
  orgResponse: z.string().min(1).max(2000),
})

export default defineEventHandler(async (event) => {
  const reviewId = getRouterParam(event, 'id')
  if (!reviewId) throw createError({ statusCode: 400 })

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Ungültige Eingabe', data: parsed.error.flatten() })
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { revieweeOrgId: true },
  })

  if (!review?.revieweeOrgId) {
    throw createError({ statusCode: 404, message: 'Bewertung nicht gefunden' })
  }

  await ensureOrgAccess(event, review.revieweeOrgId)

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: {
      orgResponse: parsed.data.orgResponse,
      orgResponseAt: new Date(),
    },
  })

  return { review: updated }
})
