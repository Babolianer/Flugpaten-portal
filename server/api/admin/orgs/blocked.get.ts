import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'
import type { OrgStatus } from '@prisma/client'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const query = getQuery(event)
  const page = Math.max(1, parseInt(String(query.page), 10) || 1)
  const pageSize = Math.min(100, Math.max(10, parseInt(String(query.pageSize), 10) || 25))
  const search = String(query.search || '').trim()
  const statusFilter = query.status as string
  const skip = (page - 1) * pageSize

  const where: {
    status: { in: OrgStatus[] }
    OR?: Array<{ name?: { contains: string; mode: 'insensitive' }; contactEmail?: { contains: string; mode: 'insensitive' } }>
  } = { status: { in: ['CANCELLED', 'REJECTED'] } }
  if (statusFilter === 'CANCELLED' || statusFilter === 'REJECTED') {
    where.status = { in: [statusFilter] }
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { contactEmail: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [orgs, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        contactEmail: true,
        status: true,
      },
      orderBy: { name: 'asc' },
      skip,
      take: pageSize,
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
