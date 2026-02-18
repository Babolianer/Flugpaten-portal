import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 404 })

  const org = await prisma.organization.findUnique({
    where: { id },
    select: { id: true, status: true },
  })
  if (!org) throw createError({ statusCode: 404, message: 'Organisation nicht gefunden' })
  if (org.status !== 'APPROVED') {
    throw createError({ statusCode: 400, message: 'Nur genehmigte Organisationen können gesperrt werden.' })
  }

  await prisma.$transaction([
    prisma.transportRequest.updateMany({
      where: { organizationId: id },
      data: { status: 'CANCELLED' },
    }),
    prisma.organization.update({
      where: { id },
      data: { status: 'CANCELLED' },
    }),
  ])

  return { ok: true, message: 'Organisation gesperrt. Alle Transporte wurden storniert.' }
})
