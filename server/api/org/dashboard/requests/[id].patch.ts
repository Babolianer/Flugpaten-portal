import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'
import { ensureOrgAccess } from '~~/server/utils/orgAccess'

const schema = z.object({
  title: z.string().min(1).optional(),
  details: z.string().optional().nullable(),
  earliestDate: z.union([z.string(), z.date()]).optional(),
  latestDate: z.union([z.string(), z.date()]).optional(),
  originAirport: z.string().min(1).optional(),
  destAirport: z.string().min(1).optional(),
  originLat: z.number().optional().nullable(),
  originLng: z.number().optional().nullable(),
  destLat: z.number().optional().nullable(),
  destLng: z.number().optional().nullable(),
  status: z.enum(['OPEN', 'MATCHED', 'COMPLETED', 'CANCELLED']).optional(),
  animalId: z.string().optional().nullable(),
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

  const req = await prisma.transportRequest.findFirst({
    where: { id },
    include: { organization: true },
  })
  if (!req) throw createError({ statusCode: 404 })

  await ensureOrgAccess(event, req.organizationId)

  const data: Record<string, unknown> = {}
  if (parsed.data.title != null) data.title = parsed.data.title
  if (parsed.data.details !== undefined) data.details = parsed.data.details
  if (parsed.data.earliestDate != null) data.earliestDate = new Date(parsed.data.earliestDate)
  if (parsed.data.latestDate != null) data.latestDate = new Date(parsed.data.latestDate)
  if (parsed.data.originAirport != null) data.originAirport = parsed.data.originAirport
  if (parsed.data.destAirport != null) data.destAirport = parsed.data.destAirport
  if (parsed.data.originLat !== undefined) data.originLat = parsed.data.originLat
  if (parsed.data.originLng !== undefined) data.originLng = parsed.data.originLng
  if (parsed.data.destLat !== undefined) data.destLat = parsed.data.destLat
  if (parsed.data.destLng !== undefined) data.destLng = parsed.data.destLng
  if (parsed.data.status != null) data.status = parsed.data.status
  if (parsed.data.animalId !== undefined) data.animalId = parsed.data.animalId

  const updated = await prisma.transportRequest.update({
    where: { id },
    data,
  })
  return { request: updated }
})
