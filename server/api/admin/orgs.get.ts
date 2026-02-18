import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const orgs = await prisma.organization.findMany({
    where: { status: 'PENDING' },
    include: {
      createdByUser: {
        select: { id: true, email: true, displayName: true },
      },
      locations: true,
    },
  })

  return { organizations: orgs }
})
