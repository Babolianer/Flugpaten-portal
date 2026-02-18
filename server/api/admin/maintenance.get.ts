import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { key: 'maintenanceMode' },
    })
    const maintenance = row?.value === 'true'
    return { maintenance }
  } catch (e: unknown) {
    const err = e as { message?: string }
    if (err?.message?.includes('findUnique') || err?.message?.includes('siteSetting')) {
      throw createError({
        statusCode: 503,
        message: 'Wartungsmodus nicht verfügbar. Bitte "npx prisma generate" ausführen und Migration anwenden (z. B. npx prisma migrate deploy oder SQL aus prisma/scripts/supabase-site-setting.sql in Supabase ausführen).',
      })
    }
    throw e
  }
})
