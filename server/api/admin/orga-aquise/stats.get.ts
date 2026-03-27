import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'
import { syncOrgaAquiseRegisteredStatus } from '~~/server/utils/syncOrgaAquiseRegisteredStatus'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  await syncOrgaAquiseRegisteredStatus()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  try {
    const [total, nichtKontaktiert, keineAntwort, interessiert, overdueFollowUps] = await Promise.all([
      prisma.orgaAquise.count(),
      prisma.orgaAquise.count({ where: { kontaktStatus: 'nicht kontaktiert' } }),
      prisma.orgaAquise.count({ where: { kontaktStatus: 'keine antwort' } }),
      prisma.orgaAquise.count({ where: { kontaktStatus: { in: ['registriert', 'interessiert'] } } }),
      prisma.orgaAquise.count({
        where: {
          naechsteKontaktaufnahme: { lte: new Date(), not: null },
        },
      }),
    ])

    const conversionPct = total > 0 ? Math.round((interessiert / total) * 100) : 0

    return {
      total,
      nichtKontaktiert,
      keineAntwort,
      interessiert,
      overdueFollowUps,
      conversionPct,
    }
  } catch (e) {
    const err = e as Error
    console.error('[admin/orga-aquise/stats]', err.message, err.stack)
    throw createError({
      statusCode: 500,
      message: process.env.NODE_ENV === 'development' ? err.message : 'Fehler beim Laden der Statistik',
    })
  }
})
