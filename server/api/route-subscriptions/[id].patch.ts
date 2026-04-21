import { z } from 'zod'
import { requireRole } from '~~/server/utils/auth'
import { prisma } from '~~/server/utils/prisma'

const schema = z.object({
  enabled: z.boolean(),
})

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['USER'])
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID fehlt' })

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Ungueltige Eingabe', data: parsed.error.flatten() })
  }

  const existing = await prisma.routeSubscription.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  })
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Abo nicht gefunden' })
  }

  const subscription = await prisma.routeSubscription.update({
    where: { id },
    data: { enabled: parsed.data.enabled },
  })

  return { subscription }
})
