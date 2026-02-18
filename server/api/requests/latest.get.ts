import { prisma } from '~~/server/utils/prisma'

export default defineEventHandler(async () => {
  const requests = await prisma.transportRequest.findMany({
    where: {
      status: 'OPEN',
      organization: { status: 'APPROVED' },
    },
    take: 3,
    orderBy: { createdAt: 'desc' },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      animal: { select: { id: true, name: true, species: true, imageUrl: true } },
    },
  })

  return {
    requests: requests.map((r) => ({
      id: r.id,
      title: r.title,
      originAirport: r.originAirport,
      destAirport: r.destAirport,
      earliestDate: r.earliestDate.toISOString(),
      latestDate: r.latestDate.toISOString(),
      organization: r.organization,
      animal: r.animal,
    })),
  }
})
