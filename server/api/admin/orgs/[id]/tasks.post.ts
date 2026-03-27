import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

const bodySchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
})

export default defineEventHandler(async (event) => {
  const admin = await requireRole(event, ['ADMIN'])
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing organization id' })

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, message: 'Ungültige Eingabe' })

  let task
  try {
    task = await prisma.adminOrganizationTask.create({
      data: {
        organizationId: id,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        status: 'offen',
        createdByAdminId: admin.id,
      },
    })
  } catch (error: unknown) {
    const err = error as { code?: string }
    if (err?.code === 'P2021' || err?.code === 'P2022') {
      throw createError({ statusCode: 503, message: 'CRM-Aufgaben sind noch nicht verfuegbar. Bitte Datenbank-Migration ausfuehren.' })
    }
    throw error
  }

  return { task }
})
