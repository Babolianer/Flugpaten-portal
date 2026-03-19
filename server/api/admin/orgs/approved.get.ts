import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const query = getQuery(event)
  const page = Math.max(1, parseInt(String(query.page), 10) || 1)
  const pageSize = Math.min(100, Math.max(10, parseInt(String(query.pageSize), 10) || 25))
  const search = String(query.search || '').trim()
  const skip = (page - 1) * pageSize

  const where: { status: 'APPROVED'; OR?: Array<{ name?: { contains: string; mode: 'insensitive' }; contactEmail?: { contains: string; mode: 'insensitive' }; slug?: { contains: string; mode: 'insensitive' } }> } = { status: 'APPROVED' }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { contactEmail: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
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
        description: true,
        createdAt: true,
        createdByUser: {
          select: {
            id: true,
            email: true,
            displayName: true,
            emailVerified: true,
            lastLoginAt: true,
            adminNotes: true,
          },
        },
        _count: { select: { requests: true, locations: true } },
      },
      orderBy: { name: 'asc' },
      skip,
      take: pageSize,
    }),
    prisma.organization.count({ where }),
  ])

  return {
    organizations: orgs.map((o) => ({
      id: o.id,
      name: o.name,
      slug: o.slug,
      contactEmail: o.contactEmail,
      createdAt: o.createdAt.toISOString(),
      createdByUser: o.createdByUser
        ? {
            id: o.createdByUser.id,
            email: o.createdByUser.email,
            displayName: o.createdByUser.displayName,
            emailVerified: o.createdByUser.emailVerified,
            lastLoginAt: o.createdByUser.lastLoginAt?.toISOString() ?? null,
            adminNotes: o.createdByUser.adminNotes,
          }
        : null,
      profileComplete: !!(o.description?.trim() && (o._count?.locations ?? 0) > 0),
      transportsCount: o._count?.requests ?? 0,
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  }
})
