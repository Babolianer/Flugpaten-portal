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
  if (org.status !== 'CANCELLED') {
    throw createError({ statusCode: 400, message: 'Nur gesperrte Organisationen können entsperrt werden.' })
  }

  await prisma.organization.update({
    where: { id },
    data: { status: 'APPROVED' },
  })

  return { ok: true, message: 'Organisation entsperrt.' }
})