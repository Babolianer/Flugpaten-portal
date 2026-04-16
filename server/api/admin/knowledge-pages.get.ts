import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'
import { parseDisabledKnowledgeSlugs } from '~~/server/utils/disabledKnowledgeSlugs'

const SETTING_KEY = 'disabledKnowledgeSlugs'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  setResponseHeader(event, 'Cache-Control', 'private, no-store, max-age=0, must-revalidate')
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { key: SETTING_KEY },
    })
    const disabledSlugs = parseDisabledKnowledgeSlugs(row?.value ?? null)
    return { disabledSlugs }
  } catch {
    return { disabledSlugs: [] as string[] }
  }
})
