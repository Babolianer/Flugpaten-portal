import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const query = getQuery(event)
  const page = Math.max(1, parseInt(String(query.page || 1), 10))
  const pageSize = Math.min(100, Math.max(10, parseInt(String(query.pageSize || 50), 10)))
  const filterNew = query.filterNew === 'true' || query.filterNew === '1'
  const filterUnverified = query.filterUnverified === 'true' || query.filterUnverified === '1'
  const filterActive = query.filterActive === 'true' || query.filterActive === '1'
  const filterProfileComplete = query.filterProfileComplete === 'true' || query.filterProfileComplete === '1'
  const lastLoginFromRaw = query.lastLoginFrom ? String(query.lastLoginFrom) : ''
  const lastLoginToRaw = query.lastLoginTo ? String(query.lastLoginTo) : ''
  const lastLoginFrom = lastLoginFromRaw ? new Date(lastLoginFromRaw) : null
  const lastLoginTo = lastLoginToRaw ? new Date(lastLoginToRaw) : null
  const validLastLoginFrom = lastLoginFrom && !Number.isNaN(lastLoginFrom.getTime()) ? lastLoginFrom : null
  const validLastLoginTo = lastLoginTo && !Number.isNaN(lastLoginTo.getTime()) ? lastLoginTo : null
  const search = String(query.search || '').trim()
  const listBlocked = query.list === 'blocked' || query.blockedOnly === 'true' || query.blockedOnly === '1'

  const where: Record<string, unknown> = { role: 'USER' }

  if (listBlocked) {
    where.blockedAt = { not: null }
  } else {
    where.blockedAt = null
  }

  if (search) {
    where.OR = [
      { displayName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (filterNew) {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    where.createdAt = { gte: thirtyDaysAgo }
  }

  if (filterUnverified) {
    where.emailVerified = false
  }

  if (filterActive) {
    where.applications = {
      some: {
        status: 'ACCEPTED',
        request: { status: 'COMPLETED' },
      },
    }
  }

  if (filterProfileComplete) {
    where.profile = {
      OR: [
        { city: { not: null } },
        { countryCode: { not: null } },
        { aboutMe: { not: null } },
      ],
    }
  }

  if (validLastLoginFrom || validLastLoginTo) {
    where.lastLoginAt = {
      ...(validLastLoginFrom ? { gte: validLastLoginFrom } : {}),
      ...(validLastLoginTo ? { lte: validLastLoginTo } : {}),
    }
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      displayName: true,
      preferredLanguage: true,
      emailVerified: true,
      isApproved: true,
      blockedAt: true,
      createdAt: true,
      lastLoginAt: true,
      adminNotes: true,
      profile: true,
      _count: {
        select: {
          applications: {
            where: {
              status: 'ACCEPTED',
              request: { status: 'COMPLETED' },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  })

  const total = await prisma.user.count({ where })

  return {
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      preferredLanguage: u.preferredLanguage,
      emailVerified: u.emailVerified,
      isApproved: u.isApproved,
      createdAt: u.createdAt.toISOString(),
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
      adminNotes: u.adminNotes,
      blockedAt: u.blockedAt?.toISOString() ?? null,
      profileComplete: !!(
        u.profile &&
        (u.profile.city || u.profile.countryCode || u.profile.aboutMe)
      ),
      completedFlightsCount: u._count?.applications ?? 0,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
})
