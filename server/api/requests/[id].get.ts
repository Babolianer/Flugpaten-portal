import { prisma } from '~~/server/utils/prisma'
import { getRequestLocale } from '~~/server/utils/locale'
import { translateStrings } from '~~/server/utils/translateContent'

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
  let orgLandingContent = request.organization?.landingContent
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
    orgLandingContent = translated[4] ?? request.organization?.landingContent
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
      }
    : undefined

  return {
    request: {
      ...request,
      title: reqTitle,
      details: reqDetails,
      organization,
    },
  }
})
