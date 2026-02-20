import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ORG_USER', 'ADMIN'])
  const requestId = getRouterParam(event, 'id')
  if (!requestId) throw createError({ statusCode: 404, message: 'Not found' })

  const transportRequest = await prisma.transportRequest.findFirst({
    where: { id: requestId },
    select: { organizationId: true, organization: { select: { status: true } } },
  })
  if (!transportRequest) throw createError({ statusCode: 404, message: 'Request not found' })

  if (user.role !== 'ADMIN') {
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: transportRequest.organizationId,
          userId: user.id,
        },
      },
    })
    if (!membership || transportRequest.organization.status !== 'APPROVED') {
      throw createError({ statusCode: 403, message: 'Kein Zugriff auf diese Anfrage' })
    }
  }

  const applications = await prisma.requestApplication.findMany({
    where: { requestId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          email: true,
          profile: { select: { avatarUrl: true, city: true, countryCode: true, aboutMe: true, languages: true, frequentAirports: true } },
        },
      },
    },
  })

  // Bewertungs-Statistiken pro User
  const userIds = applications.map((a) => a.user?.id).filter(Boolean) as string[]
  const reviewsByUser =
    userIds.length > 0
      ? await prisma.review.groupBy({
          by: ['revieweeUserId'],
          where: { revieweeUserId: { in: userIds } },
          _avg: { rating: true },
          _count: true,
        })
      : []
  const reviewMap = new Map(reviewsByUser.map((r) => [r.revieweeUserId!, { avg: r._avg.rating ?? 0, count: r._count }]))

  const completedByUser =
    userIds.length > 0
      ? await prisma.requestApplication.groupBy({
          by: ['userId'],
          where: { userId: { in: userIds }, status: 'ACCEPTED', request: { status: 'COMPLETED' } },
          _count: true,
        })
      : []
  const completedMap = new Map(completedByUser.map((c) => [c.userId, c._count]))

  return {
    applications: applications.map((a) => {
      const rev = a.user ? reviewMap.get(a.user.id) : null
      const completed = a.user ? completedMap.get(a.user.id) ?? 0 : 0
      return {
        id: a.id,
        status: a.status,
        message: a.message,
        applicationData: a.applicationData as Record<string, unknown> | null,
        attachmentPath: a.attachmentPath,
        createdAt: a.createdAt.toISOString(),
        user: a.user
          ? {
              id: a.user.id,
              displayName: a.user.displayName,
              email: a.user.email,
              profile: a.user.profile,
              stats: {
                averageRating: rev ? Math.round((rev.avg as number) * 10) / 10 : null,
                reviewsCount: rev?.count ?? 0,
                completedFlightsCount: completed,
              },
            }
          : null,
      }
    }),
  }
})
