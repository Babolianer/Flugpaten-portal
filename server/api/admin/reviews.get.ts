import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const query = getQuery(event)
  const page = Math.max(1, parseInt(String(query.page), 10) || 1)
  const pageSize = Math.min(100, Math.max(10, parseInt(String(query.pageSize), 10) || 25))
  const search = String(query.search || '').trim()
  const hasReports = query.hasReports === 'true' || query.hasReports === '1'
  const skip = (page - 1) * pageSize

  const where: {
    OR?: Array<
      | { comment: { contains: string; mode: 'insensitive' } }
      | { reviewer: { displayName: { contains: string; mode: 'insensitive' } | { equals: string } } }
      | { reviewer: { email: { contains: string; mode: 'insensitive' } } }
      | { revieweeOrg: { name: { contains: string; mode: 'insensitive' } } }
    >
    reports?: { some: Record<string, never> }
  } = {}
  if (search) {
    where.OR = [
      { comment: { contains: search, mode: 'insensitive' } },
      { reviewer: { displayName: { contains: search, mode: 'insensitive' } } },
      { reviewer: { email: { contains: search, mode: 'insensitive' } } },
      { revieweeOrg: { name: { contains: search, mode: 'insensitive' } } },
    ]
  }
  if (hasReports) {
    where.reports = { some: {} }
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: Object.keys(where).length ? where : undefined,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        reviewer: { select: { displayName: true, email: true } },
        revieweeOrg: { select: { name: true, slug: true } },
        request: { select: { id: true, title: true } },
        reports: { select: { id: true, reason: true, createdAt: true } },
      },
    }),
    prisma.review.count({ where: Object.keys(where).length ? where : undefined }),
  ])

  return {
    reviews: reviews.map((r) => ({
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
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  }
})
