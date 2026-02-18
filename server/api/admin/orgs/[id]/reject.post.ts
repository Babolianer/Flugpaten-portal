import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 404, message: 'Not found' })

  const org = await prisma.organization.update({
    where: { id },
    data: { status: 'REJECTED' },
  })

  if (!org) throw createError({ statusCode: 404, message: 'Organization not found' })

  return { organization: org }
})
