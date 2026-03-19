import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'
import { ensureOrgAccess } from '~~/server/utils/orgAccess'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ORG_USER', 'ADMIN'])
  const requestId = getRouterParam(event, 'id')
  if (!requestId) throw createError({ statusCode: 404 })

  const transportRequest = await prisma.transportRequest.findFirst({
    where: { id: requestId },
    select: { id: true, organizationId: true },
  })
  if (!transportRequest) throw createError({ statusCode: 404, message: 'Anfrage nicht gefunden' })

  await ensureOrgAccess(event, transportRequest.organizationId)

  const result = await prisma.requestApplication.updateMany({
    where: {
      requestId,
      status: { in: ['PENDING', 'WAITING_LIST'] },
    },
    data: { status: 'REJECTED' },
  })

  return { ok: true, updated: result.count }
})
