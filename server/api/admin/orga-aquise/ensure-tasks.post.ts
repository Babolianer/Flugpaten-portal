import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'
import { syncOrgaAquiseRegisteredStatus } from '~~/server/utils/syncOrgaAquiseRegisteredStatus'

/**
 * Erstellt fehlende Tasks für alle Orgas mit naechste_kontaktaufnahme <= heute.
 * Keine doppelten Tasks (unique auf orgaId + dueDate).
 */
export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  await syncOrgaAquiseRegisteredStatus()

  const today = new Date()
  today.setHours(23, 59, 59, 999)

  const orgas = await prisma.orgaAquise.findMany({
    where: {
      naechsteKontaktaufnahme: { lte: today, not: null },
    },
    select: { id: true, name: true, naechsteKontaktaufnahme: true },
  })

  let created = 0
  for (const orga of orgas) {
    const due = orga.naechsteKontaktaufnahme!
    try {
      await prisma.orgaAquiseTask.upsert({
        where: {
          orgaId_dueDate: { orgaId: orga.id, dueDate: due },
        },
        create: {
          orgaId: orga.id,
          titel: `Follow-Up: ${orga.name}`,
          beschreibung: null,
          dueDate: due,
          status: 'offen',
        },
        update: {},
      })
      created++
    } catch {
      // unique violation = Task existiert schon, ignorieren
    }
  }

  return { created }
})
