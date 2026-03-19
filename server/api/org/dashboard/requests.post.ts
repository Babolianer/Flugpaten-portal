import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'
import { ensureOrgAccess } from '~~/server/utils/orgAccess'

const schema = z.object({
  organizationId: z.string(),
  animalId: z.string().optional(),
  groupId: z.string().optional().nullable(),
  groupTitle: z.string().optional().nullable(),
  title: z.string().min(1),
  details: z.string().optional(),
  waitingListEnabled: z.boolean().optional(),
  animalCanFlyInCargo: z.boolean().optional(),
  animalCanFlyInCabin: z.boolean().optional(),
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

  let resolvedGroupId: string | null = null
  if (parsed.data.groupTitle && parsed.data.groupTitle.trim().length > 0) {
    const g = await prisma.transportRequestGroup.create({
      data: {
        organizationId: parsed.data.organizationId,
        title: parsed.data.groupTitle.trim(),
      },
      select: { id: true },
    })
    resolvedGroupId = g.id
  } else if (parsed.data.groupId) {
    const g = await prisma.transportRequestGroup.findFirst({
      where: { id: parsed.data.groupId, organizationId: parsed.data.organizationId },
      select: { id: true },
    })
    if (!g) {
      throw createError({ statusCode: 400, message: 'Ungültige Gruppen-ID' })
    }
    resolvedGroupId = g.id
  }

  // Ensure mutually exclusive animal transport location (cargo XOR cabin).
  const cargo = parsed.data.animalCanFlyInCargo ?? false
  const cabin = parsed.data.animalCanFlyInCabin ?? false
  const animalCanFlyInCargo = cargo
  const animalCanFlyInCabin = cargo ? false : cabin

  const request = await prisma.transportRequest.create({
    data: {
      organizationId: parsed.data.organizationId,
      animalId: parsed.data.animalId || null,
      groupId: resolvedGroupId,
      title: parsed.data.title,
      details: parsed.data.details || null,
      status: 'OPEN',
      waitingListEnabled: parsed.data.waitingListEnabled ?? false,
      animalCanFlyInCargo,
      animalCanFlyInCabin,
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
