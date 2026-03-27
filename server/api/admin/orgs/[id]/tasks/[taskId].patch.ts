import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

const bodySchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(5000).optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  status: z.enum(['offen', 'erledigt']).optional(),
})

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const orgId = getRouterParam(event, 'id')
  const taskId = getRouterParam(event, 'taskId')
  if (!orgId || !taskId) throw createError({ statusCode: 400, message: 'Missing ids' })

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, message: 'Ungültige Eingabe' })

  const data: Record<string, unknown> = {}
  if (parsed.data.title !== undefined) data.title = parsed.data.title
  if (parsed.data.description !== undefined) data.description = parsed.data.description ?? null
  if (parsed.data.dueDate !== undefined) data.dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null
  if (parsed.data.status !== undefined) {
    data.status = parsed.data.status
    data.completedAt = parsed.data.status === 'erledigt' ? new Date() : null
  }

  let result
  try {
    result = await prisma.adminOrganizationTask.updateMany({
      where: { id: taskId, organizationId: orgId },
      data,
    })
  } catch (error: unknown) {
    const err = error as { code?: string }
    if (err?.code === 'P2021' || err?.code === 'P2022') {
      throw createError({ statusCode: 503, message: 'CRM-Aufgaben sind noch nicht verfuegbar. Bitte Datenbank-Migration ausfuehren.' })
    }
    throw error
  }
  if (result.count === 0) throw createError({ statusCode: 404, message: 'Aufgabe nicht gefunden' })
  const task = await prisma.adminOrganizationTask.findUnique({ where: { id: taskId } })

  return { task }
})
