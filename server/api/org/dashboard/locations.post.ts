import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'
import { ensureOrgAccess } from '~~/server/utils/orgAccess'
import { geocode } from '~~/server/utils/geocode'

const schema = z.object({
  organizationId: z.string().min(1),
  title: z.string().min(1, 'Title is required'),
  countryCode: z.string().transform((s) => s.trim().toUpperCase().slice(0, 2)).pipe(z.string().length(2, 'Country code must be 2 characters (e.g. DE)')),
  city: z.string().min(1, 'City is required'),
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
    const first = parsed.error.errors[0]
    const msg = first ? `${first.path.join('.')}: ${first.message}` : 'Invalid input'
    throw createError({ statusCode: 400, message: msg, data: parsed.error.flatten() })
  }

  await ensureOrgAccess(event, parsed.data.organizationId)

  let lat: number | null = parsed.data.lat ?? null
  let lng: number | null = parsed.data.lng ?? null
  if (lat == null || lng == null) {
    const coords = await geocode({
      address: parsed.data.address,
      postalCode: parsed.data.postalCode,
      city: parsed.data.city,
      countryCode: parsed.data.countryCode,
    })
    if (coords) {
      lat = coords.lat
      lng = coords.lng
    }
  }

  const location = await prisma.orgLocation.create({
    data: {
      organizationId: parsed.data.organizationId,
      title: parsed.data.title,
      countryCode: parsed.data.countryCode,
      city: parsed.data.city,
      address: parsed.data.address || null,
      postalCode: parsed.data.postalCode || null,
      ...(lat != null && lng != null ? { lat, lng } : { lat: null, lng: null }),
    },
  })

  return { location }
})
