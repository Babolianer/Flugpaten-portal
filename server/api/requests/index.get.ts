import { prisma } from '~~/server/utils/prisma'
import { getRequestLocale } from '~~/server/utils/locale'
import { translateStrings } from '~~/server/utils/translateContent'

export default defineEventHandler(async (event) => {
  const locale = getRequestLocale(event)
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

  let result = requests.map((r) => ({
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
  }))

  if (locale !== 'de') {
    const allTexts = requests.flatMap((r) => [r.title, r.details, r.organization?.name].filter(Boolean))
    const translated = await translateStrings(allTexts, locale)
    let i = 0
    result = result.map((req, idx) => {
      const r = requests[idx]
      const title = r.title ? (translated[i++] ?? r.title) : r.title
      const details = r.details ? (translated[i++] ?? r.details) : r.details
      const orgName = r.organization?.name ? (translated[i++] ?? r.organization.name) : r.organization?.name
      return {
        ...req,
        title,
        details,
        organization: req.organization ? { ...req.organization, name: orgName ?? req.organization.name } : undefined,
      }
    })
  }

  return { requests: result }
})
