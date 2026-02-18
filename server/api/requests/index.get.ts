import { prisma } from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const dateFrom = query.dateFrom ? String(query.dateFrom) : null
  const dateTo = query.dateTo ? String(query.dateTo) : null
  const originAirport = query.originAirport ? String(query.originAirport).trim() : null
  const destAirport = query.destAirport ? String(query.destAirport).trim() : null
  const species = query.species ? String(query.species) : null

  const where: Record<string, unknown> = {
    status: 'OPEN',
    organization: { status: 'APPROVED' },
  }

  if (dateFrom) where.latestDate = { gte: new Date(dateFrom) }
  if (dateTo) where.earliestDate = { lte: new Date(dateTo) }
  if (originAirport) where.originAirport = { contains: originAirport, mode: 'insensitive' }
  if (destAirport) where.destAirport = { contains: destAirport, mode: 'insensitive' }
  if (species && species !== 'all') {
    if (species === 'cat' || species === 'dog') {
      where.animal = { species }
    }
  }

  const requests = await prisma.transportRequest.findMany({
    where,
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      animal: { select: { id: true, name: true, species: true, imageUrl: true } },
    },
    orderBy: { earliestDate: 'asc' },
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
      originLat: r.originLat,
      originLng: r.originLng,
      destLat: r.destLat,
      destLng: r.destLng,
      organization: r.organization,
      animal: r.animal,
    })),
  }
})
