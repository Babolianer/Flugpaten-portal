import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'
import { ensureOrgAccess } from '~~/server/utils/orgAccess'
import { geocode } from '~~/server/utils/geocode'

const schema = z.object({
  organizationId: z.string(),
  title: z.string().min(1),
  countryCode: z.string().length(2),
  city: z.string().min(1),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
})

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ORG_USER', 'ADMIN'])

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Invalid input', data: parsed.error.flatten() })
  }

  await ensureOrgAccess(event, parsed.data.organizationId)

  let lat = parsed.data.lat
  let lng = parsed.data.lng
  if (lat == null || lng == null) {
    const coords = await geocode({
      address: parsed.data.address,
      postalCode: parsed.data.postalCode,
      city: parsed.data.city,
      countryCode: parsed.data.countryCode,
    })
    if (!coords) {
      throw createError({ statusCode: 400, message: 'Could not geocode address' })
    }
    lat = coords.lat
    lng = coords.lng
  }

  const location = await prisma.orgLocation.create({
    data: {
      organizationId: parsed.data.organizationId,
      title: parsed.data.title,
      countryCode: parsed.data.countryCode,
      city: parsed.data.city,
      address: parsed.data.address || null,
      postalCode: parsed.data.postalCode || null,
      lat,
      lng,
    },
  })

  return { location }
})
