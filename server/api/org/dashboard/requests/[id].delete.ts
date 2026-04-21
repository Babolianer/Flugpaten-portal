import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'
import { ensureOrgAccess } from '~~/server/utils/orgAccess'
import { fireEmailTrigger } from '~~/server/utils/emailTriggerEngine'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ORG_USER', 'ADMIN'])
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 404 })

  const req = await prisma.transportRequest.findFirst({
    where: { id },
    include: {
      organization: true,
      applications: { select: { userId: true, status: true } },
    },
  })
  if (!req) throw createError({ statusCode: 404 })

  await ensureOrgAccess(event, req.organizationId)

  if (req.status === 'CANCELLED') {
    return { ok: true }
  }

  await prisma.transportRequest.update({
    where: { id },
    data: { status: 'CANCELLED' },
  })

  const notifiedUserIds = new Set<string>()
  for (const app of req.applications) {
    if (app.status === 'REJECTED') continue
    if (notifiedUserIds.has(app.userId)) continue
    notifiedUserIds.add(app.userId)
    fireEmailTrigger('TRANSPORT_CANCELLED_USER', {
      organizationId: req.organizationId,
      requestId: req.id,
      userId: app.userId,
    })
  }

  return { ok: true }
})
