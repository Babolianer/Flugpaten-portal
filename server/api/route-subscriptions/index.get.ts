import { requireRole } from '~~/server/utils/auth'
import { prisma } from '~~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['USER'])
  const originAirport = getQuery(event).originAirport
  const destAirport = getQuery(event).destAirport

  const filters: {
    userId: string
    originAirport?: string
    destAirport?: string
  } = { userId: user.id }

  if (typeof originAirport === 'string' && originAirport.trim()) {
    filters.originAirport = originAirport.trim().toUpperCase()
  }
  if (typeof destAirport === 'string' && destAirport.trim()) {
    filters.destAirport = destAirport.trim().toUpperCase()
  }

  const subscriptions = await prisma.routeSubscription.findMany({
    where: filters,
    orderBy: [{ updatedAt: 'desc' }],
  })

  return { subscriptions }
})
