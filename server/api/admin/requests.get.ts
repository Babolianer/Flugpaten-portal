import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'
import type { RequestStatus } from '@prisma/client'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const query = getQuery(event)
  const page = Math.max(1, parseInt(String(query.page), 10) || 1)
  const pageSize = Math.min(100, Math.max(10, parseInt(String(query.pageSize), 10) || 25))
  const search = String(query.search || '').trim()
  const statusFilter = query.status as string
  const skip = (page - 1) * pageSize

  const where: {
    status?: RequestStatus
    OR?: Array<
      | { title: { contains: string; mode: 'insensitive' } }
      | { originAirport: { contains: string; mode: 'insensitive' } }
      | { destAirport: { contains: string; mode: 'insensitive' } }
      | { organization: { name: { contains: string; mode: 'insensitive' } } }
    >
  } = {}
  const validStatuses = ['OPEN', 'MATCHED', 'COMPLETED', 'CANCELLED'] as RequestStatus[]
  if (statusFilter && validStatuses.includes(statusFilter as RequestStatus)) {
    where.status = statusFilter as RequestStatus
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { originAirport: { contains: search, mode: 'insensitive' } },
      { destAirport: { contains: search, mode: 'insensitive' } },
      { organization: { name: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const [reqs, total] = await Promise.all([
    prisma.transportRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        organization: {
          select: { id: true, name: true, slug: true },
        },
        animal: { select: { id: true, name: true, species: true } },
      },
    }),
    prisma.transportRequest.count({ where }),
  ])

  return {
    requests: reqs.map((r) => ({
      id: r.id,
      title: r.title,
      details: r.details,
      status: r.status,
      earliestDate: r.earliestDate,
      latestDate: r.latestDate,
      originAirport: r.originAirport,
      destAirport: r.destAirport,
      organizationId: r.organizationId,
      organizationName: r.organization.name,
      organizationSlug: r.organization.slug,
      animal: r.animal,
      createdAt: r.createdAt,
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  }
})
