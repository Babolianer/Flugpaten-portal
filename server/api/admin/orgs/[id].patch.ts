import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

const schema = z.object({
  preferredLanguage: z.enum(['de', 'en', 'fr', 'es', 'it', 'pl']).optional(),
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

  if (!parsed.data.preferredLanguage) {
    throw createError({ statusCode: 400, message: 'Keine Änderungen angegeben.' })
  }

  const organization = await prisma.organization.update({
    where: { id },
    data: { preferredLanguage: parsed.data.preferredLanguage },
    select: { id: true, preferredLanguage: true },
  })

  return { organization }
})
