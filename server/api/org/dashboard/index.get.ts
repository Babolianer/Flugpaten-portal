import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

const orgSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  website: true,
  contactEmail: true,
  status: true,
  logoUrl: true,
  automatedMessageTemplate1: true,
  automatedMessageTemplate2: true,
  automatedMessageTemplate3: true,
  createdByUserId: true,
  createdAt: true,
  updatedAt: true,
  locations: true,
  _count: { select: { reviews: true } },
  animals: { where: { isActive: true }, select: { id: true, name: true, species: true, sex: true, sizeClass: true, notes: true, imageUrl: true } },
  requests: {
    select: {
      id: true,
      title: true,
      details: true,
      status: true,
      earliestDate: true,
      latestDate: true,
      originAirport: true,
      destAirport: true,
      originLat: true,
      originLng: true,
      destLat: true,
      destLng: true,
      animalId: true,
      animal: { select: { id: true, name: true, species: true } },
      applications: {
        where: { status: 'ACCEPTED' },
        select: { userId: true, user: { select: { id: true, displayName: true } } },
        take: 1,
      },
    },
  },
} as const

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ORG_USER', 'ADMIN'])

  const query = getQuery(event)
  const asOrgId = typeof query.orgId === 'string' ? query.orgId.trim() : null

  if (user.role === 'ADMIN' && asOrgId) {
    const org = await prisma.organization.findFirst({
      where: { id: asOrgId, status: 'APPROVED' },
      select: orgSelect,
    })
    if (!org) throw createError({ statusCode: 404, message: 'Organisation nicht gefunden' })
    return { organizations: [org] }
  }

  const memberships = await prisma.organizationMember.findMany({
    where: {
      userId: user.id,
      organization: {
        OR: [
          { status: 'APPROVED' },
          { status: 'PENDING' },
        ],
      },
    },
    include: {
      organization: { select: orgSelect },
    },
  })

  const orgs = memberships.map((m) => m.organization).filter(Boolean)
  return { organizations: orgs }
})
