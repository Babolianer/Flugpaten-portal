import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['USER', 'ADMIN'])

  const applications = await prisma.requestApplication.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      request: {
        select: {
          id: true,
          title: true,
          status: true,
          originAirport: true,
          destAirport: true,
          earliestDate: true,
          latestDate: true,
          organization: { select: { id: true, name: true, slug: true } },
          animal: { select: { id: true, name: true, species: true, imageUrl: true } },
        },
      },
    },
  })

  return {
    applications: applications.map((a) => ({
      id: a.id,
      status: a.status,
      message: a.message,
      createdAt: a.createdAt.toISOString(),
      requestId: a.requestId,
      request: a.request
        ? {
            id: a.request.id,
            title: a.request.title,
            status: a.request.status,
            originAirport: a.request.originAirport,
            destAirport: a.request.destAirport,
            earliestDate: a.request.earliestDate.toISOString(),
            latestDate: a.request.latestDate.toISOString(),
            orgId: a.request.organization?.id,
            orgName: a.request.organization?.name,
            orgSlug: a.request.organization?.slug,
            animal: a.request.animal,
          }
        : null,
    })),
  }
})
