import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

const schema = z.object({
  adminNotes: z.string().max(2000).optional().nullable(),
  blocked: z.boolean().optional(),
  isApproved: z.boolean().optional(),
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

  const existing = await prisma.user.findUnique({ where: { id }, select: { role: true } })
  if (!existing) throw createError({ statusCode: 404 })

  if (parsed.data.blocked !== undefined) {
    if (existing.role !== 'USER') {
      throw createError({ statusCode: 400, message: 'Nur Flugpaten-Konten können gesperrt werden.' })
    }
  }

  const data: { adminNotes?: string | null; blockedAt?: Date | null; preferredLanguage?: string; isApproved?: boolean } = {}
  if (parsed.data.adminNotes !== undefined) data.adminNotes = parsed.data.adminNotes
  if (parsed.data.blocked === true) data.blockedAt = new Date()
  if (parsed.data.blocked === false) data.blockedAt = null
  if (parsed.data.isApproved !== undefined) data.isApproved = parsed.data.isApproved
  if (parsed.data.preferredLanguage !== undefined) data.preferredLanguage = parsed.data.preferredLanguage

  if (Object.keys(data).length === 0) {
    throw createError({ statusCode: 400, message: 'Keine Änderungen angegeben.' })
  }

  const user = await prisma.user.update({
    where: { id },
    data,
  })

  return {
    user: {
      id: user.id,
      adminNotes: user.adminNotes,
      blockedAt: user.blockedAt?.toISOString() ?? null,
      isApproved: user.isApproved,
      preferredLanguage: user.preferredLanguage,
    },
  }
})
