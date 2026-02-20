import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { requireAuth } from '~~/server/utils/auth'
import { ensureOrgAccess } from '~~/server/utils/orgAccess'

const schema = z.object({
  requestId: z.string().min(1),
  revieweeUserId: z.string().optional().nullable(),
  revieweeOrgId: z.string().optional().nullable(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().nullable(),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Invalid input', data: parsed.error.flatten() })
  }

  const { requestId, revieweeUserId, revieweeOrgId, rating, comment } = parsed.data

  if ((revieweeUserId && revieweeOrgId) || (!revieweeUserId && !revieweeOrgId)) {
    throw createError({ statusCode: 400, message: 'Genau einer von revieweeUserId oder revieweeOrgId muss gesetzt sein.' })
  }

  const request = await prisma.transportRequest.findUnique({
    where: { id: requestId },
    include: {
      organization: true,
      applications: { where: { status: 'ACCEPTED' }, include: { user: true } },
    },
  })
  if (!request) throw createError({ statusCode: 404 })
  if (request.status !== 'COMPLETED') {
    throw createError({ statusCode: 400, message: 'Bewertung nur für abgeschlossene Transporte möglich.' })
  }

  const acceptedApp = request.applications[0]
  if (!acceptedApp) throw createError({ statusCode: 400, message: 'Kein zugewiesener Flugpate für diese Anfrage.' })

  if (revieweeUserId) {
    if (user.role !== 'ORG_USER' && user.role !== 'ADMIN') {
      throw createError({ statusCode: 403, message: 'Nur Organisationen können Flugpaten bewerten.' })
    }
    await ensureOrgAccess(event, request.organizationId)
    if (revieweeUserId !== acceptedApp.userId) {
      throw createError({ statusCode: 400, message: 'Ungültiger Flugpate.' })
    }
  } else if (revieweeOrgId) {
    if (user.role !== 'USER') {
      throw createError({ statusCode: 403, message: 'Nur Flugpaten können Organisationen bewerten.' })
    }
    if (user.id !== acceptedApp.userId) {
      throw createError({ statusCode: 403, message: 'Nur der zugewiesene Flugpate kann bewerten.' })
    }
    if (revieweeOrgId !== request.organizationId) {
      throw createError({ statusCode: 400, message: 'Ungültige Organisation.' })
    }
  }

  const existing = await prisma.review.findFirst({
    where: {
      requestId,
      reviewerUserId: user.id,
      revieweeUserId: revieweeUserId || null,
      revieweeOrgId: revieweeOrgId || null,
    },
  })
  if (existing) {
    throw createError({ statusCode: 409, message: 'Du hast bereits bewertet.' })
  }

  const review = await prisma.review.create({
    data: {
      requestId,
      reviewerUserId: user.id,
      revieweeUserId: revieweeUserId || null,
      revieweeOrgId: revieweeOrgId || null,
      rating,
      comment: comment || null,
    },
  })

  return { review }
})
