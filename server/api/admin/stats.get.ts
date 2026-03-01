import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const [orgsCount, transportsCount, usersCount] = await Promise.all([
    prisma.organization.count({ where: { status: 'APPROVED' } }),
    prisma.transportRequest.count(),
    prisma.user.count(),
  ])

  return {
    orgsCount,
    transportsCount,
    usersCount,
  }
})
