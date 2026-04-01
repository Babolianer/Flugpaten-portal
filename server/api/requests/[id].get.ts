import { prisma } from '~~/server/utils/prisma'
import { getRequestLocale } from '~~/server/utils/locale'
import { translateStrings } from '~~/server/utils/translateContent'
import { getUserFromEvent } from '~~/server/utils/auth'
import sanitizeHtml from 'sanitize-html'

function sanitizeLandingContent(input: string | null | undefined): string | null {
  if (!input) return null
  const cleaned = sanitizeHtml(input, {
    allowedTags: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'h3', 'h4', 'blockquote'],
    allowedAttributes: { a: ['href', 'target', 'rel'] },
    allowedSchemes: ['https', 'mailto', 'tel'],
    transformTags: {
      a: (_tagName, attrs) => ({
        tagName: 'a',
        attribs: {
          ...attrs,
          rel: 'noopener noreferrer',
        },
      }),
    },
  }).trim()
  return cleaned || null
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 404, message: 'Not found' })

  const locale = getRequestLocale(event)

  const request = await prisma.transportRequest.findFirst({
    where: {
      id,
      organization: { status: 'APPROVED' },
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          landingContent: true,
          website: true,
          contactEmail: true,
        },
      },
      animal: true,
      group: { select: { id: true, title: true } },
    },
  })

  if (!request) throw createError({ statusCode: 404, message: 'Request not found' })

  let contactPhone: string | null = null
  let contactInstagram: string | null = null
  let contactFacebook: string | null = null
  try {
    const rows = await prisma.$queryRaw<[{ contact_phone: string | null; contact_instagram: string | null; contact_facebook: string | null }]>`
      SELECT contact_phone, contact_instagram, contact_facebook FROM "Organization" WHERE id = ${request.organizationId}
    `
    if (rows?.[0]) {
      contactPhone = rows[0].contact_phone
      contactInstagram = rows[0].contact_instagram
      contactFacebook = rows[0].contact_facebook
    }
  } catch {
    // Spalten evtl. noch nicht vorhanden
  }

  let orgName = request.organization?.name
  let orgDescription = request.organization?.description
  let orgLandingContent = sanitizeLandingContent(request.organization?.landingContent)
  let reqTitle = request.title
  let reqDetails = request.details

  if (locale !== 'de') {
    const allTexts = [
      request.title,
      request.details,
      request.organization?.name,
      request.organization?.description,
      request.organization?.landingContent,
    ]
    const translated = await translateStrings(allTexts, locale)
    reqTitle = translated[0] ?? request.title
    reqDetails = translated[1] ?? request.details
    orgName = translated[2] ?? request.organization?.name
    orgDescription = translated[3] ?? request.organization?.description
    orgLandingContent = sanitizeLandingContent(translated[4] ?? request.organization?.landingContent)
  }

  // Bewertungen der Organisation (von Flugpaten nach abgeschlossenen Transporten)
  const orgReviews =
    request.organizationId
      ? await prisma.review.findMany({
          where: { revieweeOrgId: request.organizationId },
          include: {
            reviewer: { select: { displayName: true } },
            request: { select: { title: true, originAirport: true, destAirport: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        })
      : []
  const orgReviewsFormatted = orgReviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    orgResponse: r.orgResponse,
    orgResponseAt: r.orgResponseAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    reviewerName: r.reviewer.displayName,
    route: r.request ? `${r.request.originAirport} → ${r.request.destAirport}` : null,
  }))
  let orgReviewsCount = 0
  let orgReviewsAvg: number | null = null
  if (request.organizationId) {
    const agg = await prisma.review.aggregate({
      where: { revieweeOrgId: request.organizationId },
      _avg: { rating: true },
      _count: true,
    })
    orgReviewsCount = agg._count
    orgReviewsAvg = agg._avg.rating != null ? Math.round(agg._avg.rating * 10) / 10 : null
  }

  const organization = request.organization
    ? {
        ...request.organization,
        name: orgName ?? request.organization.name,
        description: orgDescription ?? request.organization.description,
        landingContent: orgLandingContent ?? request.organization.landingContent,
        contactPhone,
        contactInstagram,
        contactFacebook,
        reviews: orgReviewsFormatted,
        reviewsCount: orgReviewsCount,
        averageRating: orgReviewsAvg ? Math.round(orgReviewsAvg * 10) / 10 : null,
      }
    : undefined

  // Warteliste-Info für MATCHED Requests
  let waitingListInfo: { count: number; isOnWaitingList: boolean; canJoin: boolean } | null = null
  if (request.status === 'MATCHED' && (request as { waitingListEnabled?: boolean }).waitingListEnabled) {
    try {
      const waitingCount = await prisma.requestApplication.count({
        where: { requestId: id!, status: 'WAITING_LIST' },
      })
      let isOnWaitingList = false
      let canJoin = waitingCount < 2

      try {
        const user = await getUserFromEvent(event)
        if (user?.role === 'USER' || user?.role === 'ADMIN') {
          const myApp = await prisma.requestApplication.findUnique({
            where: { requestId_userId: { requestId: id!, userId: user.id } },
            select: { status: true },
          })
          if (myApp) {
            isOnWaitingList = myApp.status === 'WAITING_LIST'
            canJoin = false
          }
        }
      } catch {
        canJoin = false
      }

      waitingListInfo = { count: waitingCount, isOnWaitingList, canJoin }
    } catch (e) {
      // Wenn der DB-Enum-Wert 'WAITING_LIST' noch nicht existiert (Migration ausstehend),
      // soll die Request-Seite trotzdem funktionieren.
      waitingListInfo = null
    }
  }

  // Für eingeloggte Flugpaten: Prüfen ob sie der zugewiesene Teilnehmer bei abgeschlossenem Transport sind
  let participantInfo: { isCompletedParticipant: boolean; canRateOrg: boolean; orgId: string; orgName: string } | null = null
  if (request.status === 'COMPLETED' && request.organizationId && organization) {
    const user = await getUserFromEvent(event)
    const acceptedApp = await prisma.requestApplication.findFirst({
      where: { requestId: id!, status: 'ACCEPTED' },
      select: { userId: true },
    })
    if (user?.role === 'USER' && acceptedApp && user.id === acceptedApp.userId) {
      const userHasRatedOrg = await prisma.review.findFirst({
        where: {
          requestId: id!,
          revieweeOrgId: request.organizationId,
        },
      })
      participantInfo = {
        isCompletedParticipant: true,
        canRateOrg: !userHasRatedOrg,
        orgId: request.organizationId,
        orgName: organization.name,
      }
    }
  }

  let groupInfo:
    | {
        id: string
        title: string
        requests: Array<{
          id: string
          title: string
          status: string
          earliestDate: Date
          latestDate: Date
          originAirport: string
          destAirport: string
          animalCanFlyInCargo: boolean
          animalCanFlyInCabin: boolean
          animal: { name: string; species: string; imageUrl: string | null } | null
        }>
      }
    | null = null
  if (request.groupId && request.group) {
    const groupRequests = await prisma.transportRequest.findMany({
      where: { groupId: request.groupId, organization: { status: 'APPROVED' } },
      select: {
        id: true,
        title: true,
        status: true,
        earliestDate: true,
        latestDate: true,
        originAirport: true,
        destAirport: true,
          animalCanFlyInCargo: true,
          animalCanFlyInCabin: true,
        animal: { select: { name: true, species: true, imageUrl: true } },
      },
      orderBy: { earliestDate: 'asc' },
    })
    groupInfo = {
      id: request.group.id,
      title: request.group.title,
      requests: groupRequests,
    }
  }

  return {
    request: {
      ...request,
      title: reqTitle,
      details: reqDetails,
      organization,
      group: groupInfo,
    },
    participantInfo,
    waitingListInfo,
  }
})
