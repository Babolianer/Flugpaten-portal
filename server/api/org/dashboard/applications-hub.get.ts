import { prisma } from '~~/server/utils/prisma'
import { getAccessibleOrgIds } from '~~/server/utils/orgAccess'

export default defineEventHandler(async (event) => {
  const orgIds = await getAccessibleOrgIds(event)
  if (orgIds.length === 0) {
    return { requests: [] as unknown[] }
  }

  const query = getQuery(event)
  const qOrg = typeof query.orgId === 'string' ? query.orgId.trim() : ''
  const organizationId = qOrg && orgIds.includes(qOrg) ? qOrg : orgIds[0]

  const requests = await prisma.transportRequest.findMany({
    where: { organizationId },
    orderBy: { updatedAt: 'desc' },
    include: {
      animal: { select: { id: true, name: true, species: true } },
      destinations: { orderBy: { sortOrder: 'asc' }, select: { id: true, airportCode: true, lat: true, lng: true, sortOrder: true } },
      applications: {
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              email: true,
              profile: {
                select: { city: true, countryCode: true, aboutMe: true, languages: true, frequentAirports: true },
              },
            },
          },
        },
      },
    },
  })

  const requestIds = requests.map((r) => r.id)
  const conversations =
    requestIds.length > 0
      ? await prisma.conversation.findMany({
          where: { organizationId, requestId: { in: requestIds } },
          select: { id: true, requestId: true, userId: true },
        })
      : []

  const convKey = (requestId: string | null, userId: string | null) =>
    requestId && userId ? `${requestId}:${userId}` : ''
  const convMap = new Map<string, string>()
  for (const c of conversations) {
    const k = convKey(c.requestId, c.userId)
    if (k) convMap.set(k, c.id)
  }

  return {
    requests: requests.map((r) => ({
      id: r.id,
      title: r.title,
      details: r.details,
      status: r.status,
      waitingListEnabled: r.waitingListEnabled,
      earliestDate: r.earliestDate.toISOString(),
      latestDate: r.latestDate.toISOString(),
      originAirport: r.originAirport,
      destAirport: r.destAirport,
      originLat: r.originLat,
      originLng: r.originLng,
      destLat: r.destLat,
      destLng: r.destLng,
      destinations: r.destinations,
      animalCanFlyInCargo: r.animalCanFlyInCargo,
      animalCanFlyInCabin: r.animalCanFlyInCabin,
      animal: r.animal,
      groupId: r.groupId,
      applications: r.applications.map((a) => ({
        id: a.id,
        status: a.status,
        message: a.message,
        applicationData: a.applicationData as Record<string, unknown> | null,
        attachmentPath: a.attachmentPath,
        createdAt: a.createdAt.toISOString(),
        user: a.user
          ? {
              id: a.user.id,
              displayName: a.user.displayName,
              email: a.user.email,
              profile: a.user.profile,
            }
          : null,
        conversationId: convMap.get(convKey(r.id, a.userId)) ?? null,
      })),
    })),
  }
})
