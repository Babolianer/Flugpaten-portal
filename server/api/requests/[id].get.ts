import { prisma } from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 404, message: 'Not found' })

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

  const organization = request.organization
    ? {
        ...request.organization,
        contactPhone,
        contactInstagram,
        contactFacebook,
      }
    : undefined

  return {
    request: {
      ...request,
      organization,
    },
  }
})
