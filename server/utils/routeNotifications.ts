import { prisma } from '~~/server/utils/prisma'
import { processEmailTrigger } from '~~/server/utils/emailTriggerEngine'

const DIGEST_COOLDOWN_MINUTES = 60 * 24

function normalizeAirport(code: string): string {
  return code.trim().toUpperCase()
}

export async function enqueueRouteNotificationEventsForRequest(input: {
  requestId: string
  originAirport: string
  destinationAirports: string[]
}): Promise<void> {
  const originAirport = normalizeAirport(input.originAirport)
  const destAirports = Array.from(
    new Set(
      input.destinationAirports
        .map((code) => normalizeAirport(code))
        .filter((code) => code.length > 0),
    ),
  )

  if (!originAirport || destAirports.length === 0) return

  const subs = await prisma.routeSubscription.findMany({
    where: {
      enabled: true,
      originAirport,
      destAirport: { in: destAirports },
    },
    select: { id: true },
  })

  if (subs.length === 0) return

  await prisma.routeNotificationEvent.createMany({
    data: subs.map((sub) => ({
      subscriptionId: sub.id,
      requestId: input.requestId,
    })),
    skipDuplicates: true,
  })
}

export async function processDueRouteDigestBatches(now = new Date()): Promise<{ processedUsers: number }> {
  const cutoff = new Date(now.getTime() - DIGEST_COOLDOWN_MINUTES * 60 * 1000)

  const dueEvents = await prisma.routeNotificationEvent.findMany({
    where: { sentAt: null, createdAt: { lte: cutoff } },
    include: {
      subscription: true,
    },
    orderBy: [{ createdAt: 'asc' }],
    take: 2000,
  })
  if (dueEvents.length === 0) return { processedUsers: 0 }

  const byUser = new Map<string, typeof dueEvents>()
  for (const evt of dueEvents) {
    const list = byUser.get(evt.subscription.userId) ?? []
    list.push(evt)
    byUser.set(evt.subscription.userId, list)
  }

  let processedUsers = 0
  for (const [userId, userEvents] of byUser.entries()) {
    const requestIds = Array.from(new Set(userEvents.map((evt) => evt.requestId)))
    const requests = await prisma.transportRequest.findMany({
      where: { id: { in: requestIds } },
      select: { id: true, title: true, originAirport: true, destAirport: true },
    })
    if (requests.length === 0) continue

    const routeSet = new Set(
      userEvents.map((evt) => `${evt.subscription.originAirport}→${evt.subscription.destAirport}`),
    )
    const routeSummary = Array.from(routeSet).sort().join(', ')
    const requestLines = requests
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((r) => `- ${r.title} (${r.originAirport} -> ${r.destAirport})`)
      .join('\n')

    try {
      await processEmailTrigger('ROUTE_MATCH_DIGEST_USER', {
        userId,
        routeSummary,
        requestCount: String(requests.length),
        requestLines,
      })

      await prisma.routeNotificationEvent.updateMany({
        where: { id: { in: userEvents.map((evt) => evt.id) } },
        data: { sentAt: now },
      })
      processedUsers += 1
    } catch (err) {
      console.error('[route-digest] send failed', err)
    }
  }

  return { processedUsers }
}
