import { requireRole } from '~~/server/utils/auth'
import { prisma } from '~~/server/utils/prisma'

/**
 * Profil-Zusammenfassung für das eigene Dashboard: Profil + Stats + letzte Bewertungen
 */
export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['USER', 'ADMIN'])
  if (user.role !== 'USER') {
    return { profile: null, stats: null, recentReviews: [] }
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
  })

  const acceptedApplications = await prisma.requestApplication.findMany({
    where: { userId: user.id, status: 'ACCEPTED', request: { status: 'COMPLETED' } },
    include: { request: { select: { id: true, animalId: true } } },
  })
  const completedFlightsCount = acceptedApplications.length
  const transportedAnimalsCount = acceptedApplications.filter((a) => a.request.animalId).length

  const [reviewsReceived, reviewAgg] = await Promise.all([
    prisma.review.findMany({
      where: { revieweeUserId: user.id },
      include: {
        reviewer: { select: { displayName: true } },
        request: { select: { title: true, originAirport: true, destAirport: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.review.aggregate({
      where: { revieweeUserId: user.id },
      _avg: { rating: true },
      _count: true,
    }),
  ])
  const avgRating = reviewAgg._avg.rating != null ? Math.round(reviewAgg._avg.rating * 10) / 10 : null

  return {
    profile,
    stats: {
      completedFlightsCount,
      transportedAnimalsCount,
      averageRating: avgRating,
      reviewsCount: reviewAgg._count,
    },
    recentReviews: reviewsReceived.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      reviewerName: r.reviewer.displayName,
      requestTitle: r.request?.title,
      route: r.request ? `${r.request.originAirport} → ${r.request.destAirport}` : null,
    })),
  }
})
