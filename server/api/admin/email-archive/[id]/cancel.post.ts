import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'id fehlt.' })
  const row = await prisma.outboundEmail.findUnique({ where: { id } })
  if (!row) throw createError({ statusCode: 404, message: 'Nicht gefunden.' })
  if (row.status !== 'QUEUED') {
    throw createError({ statusCode: 400, message: 'Nur ausstehende E-Mails können storniert werden.' })
  }
  const updated = await prisma.outboundEmail.update({
    where: { id },
    data: { status: 'CANCELLED' },
  })
  return { email: updated }
})
