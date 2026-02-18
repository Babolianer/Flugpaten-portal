import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'
import { ensureOrgAccess } from '~~/server/utils/orgAccess'

const schema = z.object({
  organizationId: z.string(),
  animalId: z.string().optional(),
  title: z.string().min(1),
  details: z.string().optional(),
  earliestDate: z.union([z.string(), z.date()]),
  latestDate: z.union([z.string(), z.date()]),
  originAirport: z.string().min(1),
  destAirport: z.string().min(1),
  originLat: z.number().optional(),
  originLng: z.number().optional(),
  destLat: z.number().optional(),
  destLng: z.number().optional(),
})

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ORG_USER', 'ADMIN'])

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Invalid input', data: parsed.error.flatten() })
  }

  await ensureOrgAccess(event, parsed.data.organizationId)

  const request = await prisma.transportRequest.create({
    data: {
      organizationId: parsed.data.organizationId,
      animalId: parsed.data.animalId || null,
      title: parsed.data.title,
      details: parsed.data.details || null,
      status: 'OPEN',
      earliestDate: new Date(parsed.data.earliestDate),
      latestDate: new Date(parsed.data.latestDate),
      originAirport: parsed.data.originAirport,
      destAirport: parsed.data.destAirport,
      originLat: parsed.data.originLat ?? null,
      originLng: parsed.data.originLng ?? null,
      destLat: parsed.data.destLat ?? null,
      destLng: parsed.data.destLng ?? null,
    },
  })

  return { request }
})
