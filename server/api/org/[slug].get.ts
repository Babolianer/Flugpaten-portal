import { prisma } from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 404, message: 'Not found' })

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

  return {
    organization: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      description: org.description,
      landingContent: org.landingContent,
      website: org.website,
      contactEmail: org.contactEmail,
      contactPhone,
      contactInstagram,
      contactFacebook,
      logoUrl: org.logoUrl,
      locations: org.locations,
      requests: org.requests,
    },
  }
})
