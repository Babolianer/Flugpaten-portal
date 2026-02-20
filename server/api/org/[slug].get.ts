import { prisma } from '~~/server/utils/prisma'
import { getRequestLocale } from '~~/server/utils/locale'
import { translateStrings } from '~~/server/utils/translateContent'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 404, message: 'Not found' })

  const locale = getRequestLocale(event)

  const org = await prisma.organization.findFirst({
    where: { slug, status: 'APPROVED' },
    include: {
      locations: true,
      requests: {
        where: { status: 'OPEN' },
        include: { animal: true },
      },
    },
  })

  if (!org) throw createError({ statusCode: 404, message: 'Organization not found' })

  let contactPhone: string | null = null
  let contactInstagram: string | null = null
  let contactFacebook: string | null = null
  try {
    const rows = await prisma.$queryRaw<[{ contact_phone: string | null; contact_instagram: string | null; contact_facebook: string | null }]>`
      SELECT contact_phone, contact_instagram, contact_facebook FROM "Organization" WHERE id = ${org.id}
    `
    if (rows?.[0]) {
      contactPhone = rows[0].contact_phone
      contactInstagram = rows[0].contact_instagram
      contactFacebook = rows[0].contact_facebook
    }
  } catch {
    // Spalten evtl. noch nicht vorhanden
  }

  let name = org.name
  let description = org.description
  let landingContent = org.landingContent
  let locationTitles: string[] = []
  let requestTitles: string[] = []

  if (locale !== 'de') {
    const allTexts = [
      org.name,
      org.description,
      org.landingContent,
      ...org.locations.map((l) => l.title),
      ...org.requests.map((r) => r.title),
    ]
    const translated = await translateStrings(allTexts, locale)
    let i = 0
    name = translated[i++] ?? org.name
    description = translated[i++] ?? org.description
    landingContent = translated[i++] ?? org.landingContent
    locationTitles = org.locations.map(() => translated[i++] ?? '')
    requestTitles = org.requests.map(() => translated[i++] ?? '')
  }

  const locations = org.locations.map((loc, idx) => ({
    ...loc,
    title: locale === 'de' ? loc.title : (locationTitles[idx] ?? loc.title),
  }))
  const requests = org.requests.map((req, idx) => ({
    ...req,
    title: locale === 'de' ? req.title : (requestTitles[idx] ?? req.title),
  }))

  // Bewertungen der Organisation
  const reviews = await prisma.review.findMany({
    where: { revieweeOrgId: org.id },
    include: {
      reviewer: { select: { displayName: true } },
      request: { select: { title: true, originAirport: true, destAirport: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 15,
  })
  const reviewsFormatted = reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    orgResponse: r.orgResponse,
    orgResponseAt: r.orgResponseAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    reviewerName: r.reviewer.displayName,
    route: r.request ? `${r.request.originAirport} → ${r.request.destAirport}` : null,
  }))
  const reviewsCount = await prisma.review.count({ where: { revieweeOrgId: org.id } })
  const averageRating =
    reviewsCount > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviewsCount : null

  return {
    organization: {
      id: org.id,
      name,
      slug: org.slug,
      description,
      landingContent,
      website: org.website,
      contactEmail: org.contactEmail,
      contactPhone,
      contactInstagram,
      contactFacebook,
      logoUrl: org.logoUrl,
      locations,
      requests,
      reviews: reviewsFormatted,
      reviewsCount,
      averageRating: averageRating ? Math.round(averageRating * 10) / 10 : null,
    },
  }
})
