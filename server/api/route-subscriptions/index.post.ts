import { z } from 'zod'
import { requireRole } from '~~/server/utils/auth'
import { prisma } from '~~/server/utils/prisma'

const schema = z.object({
  originAirport: z.string().min(3).max(8),
  destAirport: z.string().min(3).max(8),
  enabled: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['USER'])
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Ungueltige Eingabe', data: parsed.error.flatten() })
  }

  const originAirport = parsed.data.originAirport.trim().toUpperCase()
  const destAirport = parsed.data.destAirport.trim().toUpperCase()
  const enabled = parsed.data.enabled ?? true

  const subscription = await prisma.routeSubscription.upsert({
    where: {
      userId_originAirport_destAirport: {
        userId: user.id,
        originAirport,
        destAirport,
      },
    },
    update: { enabled },
    create: {
      userId: user.id,
      originAirport,
      destAirport,
      enabled,
    },
  })

  return { subscription }
})
