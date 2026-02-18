import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'
import { ensureOrgAccess } from '~~/server/utils/orgAccess'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ORG_USER', 'ADMIN'])
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 404 })

  const req = await prisma.transportRequest.findFirst({
    where: { id },
    include: { organization: true },
  })
  if (!req) throw createError({ statusCode: 404 })

  await ensureOrgAccess(event, req.organizationId)

  await prisma.transportRequest.delete({ where: { id } })
  return { ok: true }
})
