import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

const validStatuses = ['nicht kontaktiert', 'kontaktiert', 'keine antwort', 'registriert', 'interessiert']

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing id' })

  const body = await readBody<{ kontaktStatus?: string; notizen?: string | null }>(event)

  const data: { kontaktStatus?: string; notizen?: string | null } = {}
  if (body?.kontaktStatus && validStatuses.includes(body.kontaktStatus)) {
    data.kontaktStatus = body.kontaktStatus === 'interessiert' ? 'registriert' : body.kontaktStatus
  }
  if (body && 'notizen' in body) {
    data.notizen = body.notizen ?? null
  }

  if (Object.keys(data).length === 0) {
    throw createError({ statusCode: 400, message: 'No valid data to update' })
  }

  const orga = await prisma.orgaAquise.update({
    where: { id },
    data,
  })

  return {
    id: orga.id,
    kontaktStatus: orga.kontaktStatus,
    notizen: orga.notizen,
  }
})
