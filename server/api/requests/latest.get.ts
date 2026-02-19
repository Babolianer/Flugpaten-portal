import { prisma } from '~~/server/utils/prisma'
import { getRequestLocale } from '~~/server/utils/locale'
import { translateStrings } from '~~/server/utils/translateContent'

export default defineEventHandler(async (event) => {
  const locale = getRequestLocale(event)
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

  let result = requests.map((r) => ({
    id: r.id,
    title: r.title,
    originAirport: r.originAirport,
    destAirport: r.destAirport,
    earliestDate: r.earliestDate.toISOString(),
    latestDate: r.latestDate.toISOString(),
    organization: r.organization,
    animal: r.animal,
  }))

  if (locale !== 'de') {
    const allTexts = requests.flatMap((r) => [r.title, r.organization?.name].filter(Boolean))
    const translated = await translateStrings(allTexts, locale)
    let i = 0
    result = result.map((req, idx) => {
      const r = requests[idx]
      const title = r.title ? (translated[i++] ?? r.title) : r.title
      const orgName = r.organization?.name ? (translated[i++] ?? r.organization.name) : r.organization?.name
      return {
        ...req,
        title,
        organization: req.organization ? { ...req.organization, name: orgName ?? req.organization.name } : undefined,
      }
    })
  }

  return { requests: result }
})
