import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'
import { ensureOrgAccess } from '~~/server/utils/orgAccess'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ORG_USER', 'ADMIN'])
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 404 })

  const animal = await prisma.animal.findFirst({
    where: { id },
    include: { organization: true },
  })
  if (!animal) throw createError({ statusCode: 404 })

  await ensureOrgAccess(event, animal.organizationId)

  await prisma.animal.delete({ where: { id } })
  return { ok: true }
})
