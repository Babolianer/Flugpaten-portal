import { prisma } from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, 'id')
  if (!userId) throw createError({ statusCode: 404 })

  const user = await prisma.user.findUnique({
    where: { id: userId, role: 'USER' },
    select: {
      id: true,
      displayName: true,
      profile: true,
      emailVerified: true,
      phoneVerified: true,
      phone: true,
    },
  })
  if (!user) throw createError({ statusCode: 404 })

  const acceptedApplications = await prisma.requestApplication.findMany({
    where: { userId, status: 'ACCEPTED', request: { status: 'COMPLETED' } },
    include: { request: { select: { id: true, animalId: true } } },
  })

  const completedFlightsCount = acceptedApplications.length
  const transportedAnimalsCount = acceptedApplications.filter((a) => a.request.animalId).length

  const reviewsReceived = await prisma.review.findMany({
    where: { revieweeUserId: userId },
    include: {
      reviewer: { select: { displayName: true } },
      request: { select: { title: true, originAirport: true, destAirport: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const avgRating =
    reviewsReceived.length > 0
      ? reviewsReceived.reduce((sum, r) => sum + r.rating, 0) / reviewsReceived.length
      : null

  return {
    user: {
      id: user.id,
      displayName: user.displayName,
      profile: user.profile,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
    },
    stats: {
      completedFlightsCount,
      transportedAnimalsCount,
      averageRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
      reviewsCount: reviewsReceived.length,
    },
    reviews: reviewsReceived.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      reviewerName: r.reviewer.displayName,
      requestTitle: r.request?.title,
      route: r.request
        ? `${r.request.originAirport} → ${r.request.destAirport}`
        : null,
    })),
  }
})
