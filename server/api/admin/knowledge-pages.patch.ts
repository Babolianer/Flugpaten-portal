import { z } from 'zod'
import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'
import { FLUGPATE_TOPICS } from '~/content/flugpate/types'

const SETTING_KEY = 'disabledKnowledgeSlugs'

const schema = z.object({
  disabledSlugs: z.array(z.string()).default([]),
})

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Invalid input' })
  }

  const validSlugs = new Set(FLUGPATE_TOPICS.map(topic => topic.slug))
  const disabledSlugs = parsed.data.disabledSlugs.filter(slug => validSlugs.has(slug))

  try {
    await prisma.siteSetting.upsert({
      where: { key: SETTING_KEY },
      update: { value: JSON.stringify(disabledSlugs) },
      create: { key: SETTING_KEY, value: JSON.stringify(disabledSlugs) },
    })
    return { disabledSlugs }
  } catch (e: unknown) {
    const err = e as { message?: string }
    if (err?.message?.includes('upsert') || err?.message?.includes('siteSetting') || (err && String(err).includes('undefined'))) {
      throw createError({
        statusCode: 503,
        message: 'Wissensseiten konnten nicht gespeichert werden. Bitte "npx prisma generate" ausführen und die Tabelle SiteSetting anlegen.',
      })
    }
    throw e
  }
})
