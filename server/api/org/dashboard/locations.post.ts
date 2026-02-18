import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'
import { ensureOrgAccess } from '~~/server/utils/orgAccess'

const schema = z.object({
  organizationId: z.string(),
  title: z.string().min(1),
  countryCode: z.string().length(2),
  city: z.string().min(1),
  address: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
})

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ORG_USER', 'ADMIN'])

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Invalid input', data: parsed.error.flatten() })
  }

  await ensureOrgAccess(event, parsed.data.organizationId)

  const location = await prisma.orgLocation.create({
    data: {
      organizationId: parsed.data.organizationId,
      title: parsed.data.title,
      countryCode: parsed.data.countryCode,
      city: parsed.data.city,
      address: parsed.data.address || null,
      lat: parsed.data.lat,
      lng: parsed.data.lng,
    },
  })

  return { location }
})
