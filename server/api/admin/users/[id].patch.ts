import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

const schema = z.object({
  adminNotes: z.string().max(2000).optional().nullable(),
})

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 404 })

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Invalid input' })
  }

  const user = await prisma.user.update({
    where: { id },
    data: { adminNotes: parsed.data.adminNotes ?? undefined },
  })

  return { user: { id: user.id, adminNotes: user.adminNotes } }
})
