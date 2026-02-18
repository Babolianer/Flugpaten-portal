import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const orgs = await prisma.organization.findMany({
    where: { status: 'CANCELLED' },
    select: {
      id: true,
      name: true,
      slug: true,
      contactEmail: true,
    },
    orderBy: { name: 'asc' },
  })

  return { organizations: orgs }
})
