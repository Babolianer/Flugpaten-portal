import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'
import { ensureOrgAccess } from '~~/server/utils/orgAccess'
import { geocode } from '~~/server/utils/geocode'

const schema = z.object({
  title: z.string().min(1).optional(),
  countryCode: z.string().length(2).optional(),
  city: z.string().min(1).optional(),
  address: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  lat: z.number().optional(),
  lng: z.number().optional(),
})

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ORG_USER', 'ADMIN'])
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 404 })

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Invalid input', data: parsed.error.flatten() })
  }

  const loc = await prisma.orgLocation.findFirst({
    where: { id },
    include: { organization: true },
  })
  if (!loc) throw createError({ statusCode: 404 })

  await ensureOrgAccess(event, loc.organizationId)

  let lat: number | null = parsed.data.lat ?? null
  let lng: number | null = parsed.data.lng ?? null
  if (lat == null || lng == null) {
    const address = parsed.data.address ?? loc.address ?? ''
    const postalCode = parsed.data.postalCode ?? loc.postalCode ?? ''
    const city = parsed.data.city ?? loc.city
    const countryCode = parsed.data.countryCode ?? loc.countryCode
    const coords = await geocode({
      address: address || undefined,
      postalCode: postalCode || undefined,
      city,
      countryCode,
    })
    if (coords) {
      lat = coords.lat
      lng = coords.lng
    } else {
      lat = null
      lng = null
    }
  }

  const updated = await prisma.orgLocation.update({
    where: { id },
    data: {
      ...(parsed.data.title != null && { title: parsed.data.title }),
      ...(parsed.data.countryCode != null && { countryCode: parsed.data.countryCode }),
      ...(parsed.data.city != null && { city: parsed.data.city }),
      ...(parsed.data.address !== undefined && { address: parsed.data.address }),
      ...(parsed.data.postalCode !== undefined && { postalCode: parsed.data.postalCode }),
      lat,
      lng,
    },
  })
  return { location: updated }
})
