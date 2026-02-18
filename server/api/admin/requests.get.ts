import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const requests = await prisma.transportRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      organization: {
        select: { id: true, name: true, slug: true },
      },
      animal: { select: { id: true, name: true, species: true } },
    },
  })

  return {
    requests: requests.map((r) => ({
      id: r.id,
      title: r.title,
      details: r.details,
      status: r.status,
      earliestDate: r.earliestDate,
      latestDate: r.latestDate,
      originAirport: r.originAirport,
      destAirport: r.destAirport,
      organizationId: r.organizationId,
      organizationName: r.organization.name,
      organizationSlug: r.organization.slug,
      animal: r.animal,
      createdAt: r.createdAt,
    })),
  }
})
