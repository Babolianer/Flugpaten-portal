import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { requireAuth } from '~~/server/utils/auth'
import { ensureOrgAccess } from '~~/server/utils/orgAccess'

const schema = z.object({
  reason: z.string().max(500).optional().nullable(),
  organizationId: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
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

  if (!review?.revieweeOrgId || review.revieweeOrgId !== parsed.data.organizationId) {
    throw createError({ statusCode: 404, message: 'Bewertung nicht gefunden' })
  }

  await ensureOrgAccess(event, parsed.data.organizationId)

  const existing = await prisma.reviewReport.findFirst({
    where: { reviewId },
  })

  if (existing) {
    throw createError({ statusCode: 409, message: 'Diese Bewertung wurde bereits gemeldet.' })
  }

  await prisma.reviewReport.create({
    data: {
      reviewId,
      reporterUserId: user.id,
      reason: parsed.data.reason ?? null,
    },
  })

  return { ok: true }
})
