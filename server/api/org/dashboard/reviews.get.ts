import { prisma } from '~~/server/utils/prisma'
import { getAccessibleOrgIds } from '~~/server/utils/orgAccess'

export default defineEventHandler(async (event) => {
  const orgIds = await getAccessibleOrgIds(event)
  const query = getQuery(event)
  const orgId = typeof query.organizationId === 'string' ? query.organizationId.trim() : null

  if (!orgId || !orgIds.includes(orgId)) {
    throw createError({ statusCode: 403, message: 'Kein Zugriff auf diese Organisation' })
  }

  const reviews = await prisma.review.findMany({
    where: { revieweeOrgId: orgId },
    orderBy: { createdAt: 'desc' },
    include: {
      reviewer: { select: { displayName: true } },
      request: { select: { id: true, title: true } },
    },
  })

  const count = reviews.length

  return {
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      orgResponse: r.orgResponse,
      orgResponseAt: r.orgResponseAt,
      createdAt: r.createdAt,
      reviewerName: r.reviewer.displayName,
      requestTitle: r.request.title,
    })),
    count,
  }
})
