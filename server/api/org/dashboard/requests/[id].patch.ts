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
  waitingListEnabled: z.boolean().optional(),
  animalCanFlyInCargo: z.boolean().optional(),
  animalCanFlyInCabin: z.boolean().optional(),
  groupId: z.string().optional().nullable(),
  groupTitle: z.string().optional().nullable(),
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

  // Determine final animal transport flags including mutual exclusivity.
  const existingCargo = !!req.animalCanFlyInCargo
  const existingCabin = !!req.animalCanFlyInCabin
  let finalCargo = existingCargo
  let finalCabin = existingCabin

  if (parsed.data.animalCanFlyInCargo !== undefined) finalCargo = parsed.data.animalCanFlyInCargo
  if (parsed.data.animalCanFlyInCabin !== undefined) finalCabin = parsed.data.animalCanFlyInCabin

  // Mutually exclusive: cargo XOR cabin (prefer cargo if both were set).
  if (finalCargo) finalCabin = false
  else if (finalCabin) finalCargo = false

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
  if (parsed.data.waitingListEnabled !== undefined) data.waitingListEnabled = parsed.data.waitingListEnabled
  if (parsed.data.animalCanFlyInCargo !== undefined || parsed.data.animalCanFlyInCabin !== undefined) {
    // Only write if one of the fields was present in the payload (or normalization changed it).
    data.animalCanFlyInCargo = finalCargo
    data.animalCanFlyInCabin = finalCabin
  }

  if (parsed.data.groupTitle !== undefined || parsed.data.groupId !== undefined) {
    if (parsed.data.groupTitle && parsed.data.groupTitle.trim().length > 0) {
      const g = await prisma.transportRequestGroup.create({
        data: { organizationId: req.organizationId, title: parsed.data.groupTitle.trim() },
        select: { id: true },
      })
      data.groupId = g.id
    } else if (parsed.data.groupId) {
      const g = await prisma.transportRequestGroup.findFirst({
        where: { id: parsed.data.groupId, organizationId: req.organizationId },
        select: { id: true },
      })
      if (!g) throw createError({ statusCode: 400, message: 'Ungültige Gruppen-ID' })
      data.groupId = g.id
    } else {
      data.groupId = null
    }
  }

  const updated = await prisma.transportRequest.update({
    where: { id },
    data,
  })
  return { request: updated }
})
