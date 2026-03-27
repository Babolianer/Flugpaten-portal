import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'
import { sendOutboundEmailById } from '~~/server/utils/emailTriggerEngine'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'id fehlt.' })
  const row = await prisma.outboundEmail.findUnique({ where: { id } })
  if (!row) throw createError({ statusCode: 404, message: 'Nicht gefunden.' })
  if (row.status !== 'QUEUED') {
    throw createError({ statusCode: 400, message: 'Nur E-Mails mit Status „Warteschlange“ können gesendet werden.' })
  }
  await sendOutboundEmailById(id)
  const updated = await prisma.outboundEmail.findUnique({ where: { id } })
  return { email: updated }
})
