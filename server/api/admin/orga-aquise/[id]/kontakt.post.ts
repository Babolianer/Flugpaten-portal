import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

const validStatuses = ['nicht kontaktiert', 'kontaktiert', 'keine antwort', 'registriert', 'interessiert']

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing id' })

  const body = await readBody<{ kontaktStatus?: string }>(event)
  const newStatusRaw = body?.kontaktStatus && validStatuses.includes(body.kontaktStatus)
    ? body.kontaktStatus
    : null
  const newStatus = newStatusRaw === 'interessiert' ? 'registriert' : newStatusRaw

  const now = new Date()
  let naechsteKontaktaufnahme: Date | null = null

  if (newStatus === 'keine antwort') {
    naechsteKontaktaufnahme = addDays(now, 3)
  } else if (newStatus === 'registriert') {
    naechsteKontaktaufnahme = addDays(now, 7)
  }
  // sonst: null

  const orga = await prisma.orgaAquise.update({
    where: { id },
    data: {
      letzteKontaktaufnahme: now,
      naechsteKontaktaufnahme,
      ...(newStatus ? { kontaktStatus: newStatus } : {}),
    },
  })

  return {
    id: orga.id,
    letzteKontaktaufnahme: orga.letzteKontaktaufnahme,
    naechsteKontaktaufnahme: orga.naechsteKontaktaufnahme,
    kontaktStatus: orga.kontaktStatus,
  }
})
