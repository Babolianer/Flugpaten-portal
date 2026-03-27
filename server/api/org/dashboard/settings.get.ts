import { Prisma } from '@prisma/client'
import { prisma } from '~~/server/utils/prisma'
import { ensureOrgAccess } from '~~/server/utils/orgAccess'

export default defineEventHandler(async (event) => {
  const organizationId = getQuery(event).organizationId
  if (typeof organizationId !== 'string') {
    throw createError({ statusCode: 400, message: 'organizationId required' })
  }
  await ensureOrgAccess(event, organizationId)

  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: {
      id: true,
      description: true,
      website: true,
      preferredLanguage: true,
      contactEmail: true,
      status: true,
      logoUrl: true,
      automatedMessageTemplate1: true,
      automatedMessageTemplate2: true,
      automatedMessageTemplate3: true,
    },
  })
  let landingContent: string | null = null
  let contactPhone: string | null = null
  let contactInstagram: string | null = null
  let contactFacebook: string | null = null
  try {
    const rows = await prisma.$queryRaw<
      [{ landing_content: string | null; contact_phone: string | null; contact_instagram: string | null; contact_facebook: string | null }]
    >(Prisma.sql`SELECT landing_content, contact_phone, contact_instagram, contact_facebook FROM "Organization" WHERE id = ${organizationId}`)
    if (rows?.[0]) {
      landingContent = rows[0].landing_content
      contactPhone = rows[0].contact_phone
      contactInstagram = rows[0].contact_instagram
      contactFacebook = rows[0].contact_facebook
    }
  } catch {
    try {
      const rows = await prisma.$queryRaw<[{ landing_content: string | null }]>(
        Prisma.sql`SELECT landing_content FROM "Organization" WHERE id = ${organizationId}`,
      )
      if (rows?.[0]) landingContent = rows[0].landing_content
    } catch {
      // Spalten evtl. noch nicht vorhanden
    }
  }

  return {
    description: org.description ?? null,
    landingContent,
    website: org.website ?? null,
    preferredLanguage: org.preferredLanguage ?? 'de',
    contactEmail: org.contactEmail,
    contactPhone,
    contactInstagram,
    contactFacebook,
    logoUrl: org.logoUrl ?? null,
    automatedMessageTemplate1: org.automatedMessageTemplate1 ?? null,
    automatedMessageTemplate2: org.automatedMessageTemplate2 ?? null,
    automatedMessageTemplate3: org.automatedMessageTemplate3 ?? null,
  }
})
