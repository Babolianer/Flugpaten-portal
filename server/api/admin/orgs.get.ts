import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const query = getQuery(event)
  const page = Math.max(1, parseInt(String(query.page), 10) || 1)
  const pageSize = Math.min(100, Math.max(10, parseInt(String(query.pageSize), 10) || 25))
  const search = String(query.search || '').trim()
  const skip = (page - 1) * pageSize

  const where: { status: 'PENDING'; OR?: Array<{ name?: { contains: string; mode: 'insensitive' }; contactEmail?: { contains: string; mode: 'insensitive' } }> } = { status: 'PENDING' }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { contactEmail: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [orgs, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        createdByUser: {
          select: { id: true, email: true, displayName: true },
        },
        locations: true,
      },
    }),
    prisma.organization.count({ where }),
  ])

  return {
    organizations: orgs,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  }
})
