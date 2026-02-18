import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

const schema = z.object({ maintenance: z.boolean() })

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Invalid input' })
  }
  try {
    await prisma.siteSetting.upsert({
      where: { key: 'maintenanceMode' },
      update: { value: parsed.data.maintenance ? 'true' : 'false' },
      create: { key: 'maintenanceMode', value: parsed.data.maintenance ? 'true' : 'false' },
    })
    return { maintenance: parsed.data.maintenance }
  } catch (e: unknown) {
    const err = e as { message?: string }
    if (err?.message?.includes('upsert') || err?.message?.includes('siteSetting') || (err && String(err).includes('undefined'))) {
      throw createError({
        statusCode: 503,
        message: 'Wartungsmodus konnte nicht gespeichert werden. Bitte "npx prisma generate" ausführen und die Tabelle SiteSetting anlegen (Migration oder prisma/scripts/supabase-site-setting.sql in Supabase).',
      })
    }
    throw e
  }
})
