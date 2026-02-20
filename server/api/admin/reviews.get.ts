import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const reportedReviews = await prisma.review.findMany({
    where: { reports: { some: {} } },
    orderBy: { createdAt: 'desc' },
    include: {
      reviewer: { select: { displayName: true, email: true } },
      revieweeOrg: { select: { name: true, slug: true } },
      request: { select: { id: true, title: true } },
      reports: { select: { id: true, reason: true, createdAt: true } },
    },
  })

  return {
    reviews: reportedReviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      orgResponse: r.orgResponse,
      createdAt: r.createdAt,
      reviewerName: r.reviewer.displayName,
      reviewerEmail: r.reviewer.email,
      orgName: r.revieweeOrg?.name,
      orgSlug: r.revieweeOrg?.slug,
      requestTitle: r.request.title,
      reportsCount: r.reports.length,
      reportReasons: r.reports.map((rep) => rep.reason).filter(Boolean),
    })),
  }
})
