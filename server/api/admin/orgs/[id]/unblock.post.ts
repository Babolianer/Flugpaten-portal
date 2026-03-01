import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 404 })

  const org = await prisma.organization.findUnique({
    where: { id },
    select: { status: true },
  })
  if (!org) throw createError({ statusCode: 404, message: 'Organisation nicht gefunden' })
  if (org.status !== 'CANCELLED' && org.status !== 'REJECTED') {
    throw createError({ statusCode: 400, message: 'Nur gesperrte oder abgelehnte Organisationen können entsperrt werden.' })
  }

  // CANCELLED (war genehmigt, wurde gesperrt) → zurück zu APPROVED
  // REJECTED (war ausstehend, wurde abgelehnt) → zurück zu PENDING für erneute Prüfung
  const newStatus = org.status === 'CANCELLED' ? 'APPROVED' : 'PENDING'
  await prisma.organization.update({
    where: { id },
    data: { status: newStatus },
  })

  return { ok: true, message: org.status === 'CANCELLED' ? 'Organisation entsperrt.' : 'Organisation zur erneuten Prüfung freigegeben.' }
})