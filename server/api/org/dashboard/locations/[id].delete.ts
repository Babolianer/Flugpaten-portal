import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'
import { ensureOrgAccess } from '~~/server/utils/orgAccess'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ORG_USER', 'ADMIN'])
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 404 })

  const loc = await prisma.orgLocation.findFirst({
    where: { id },
    include: { organization: true },
  })
  if (!loc) throw createError({ statusCode: 404 })

  await ensureOrgAccess(event, loc.organizationId)

  await prisma.orgLocation.delete({ where: { id } })
  return { ok: true }
})
