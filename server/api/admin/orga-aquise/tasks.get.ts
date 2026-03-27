import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const query = getQuery(event)
  const statusFilter = String(query.status || '').trim()
  const limit = Math.min(100, Math.max(10, parseInt(String(query.limit), 10) || 50))

  const where: { status?: string } = {}
  if (statusFilter === 'offen' || statusFilter === 'erledigt') {
    where.status = statusFilter
  }

  const tasks = await prisma.orgaAquiseTask.findMany({
    where: Object.keys(where).length ? where : undefined,
    orderBy: { dueDate: 'asc' },
    take: limit,
    include: {
      orga: { select: { id: true, name: true, instagramHandle: true } },
    },
  })

  return {
    tasks: tasks.map((t) => ({
      id: t.id,
      orgaId: t.orgaId,
      titel: t.titel,
      beschreibung: t.beschreibung,
      dueDate: t.dueDate,
      status: t.status,
      createdAt: t.createdAt,
      orga: t.orga,
    })),
  }
})
