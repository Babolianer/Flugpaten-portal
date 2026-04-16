import { prisma } from '~~/server/utils/prisma'
import { FLUGPATE_TOPICS } from '~/content/flugpate/types'

const SETTING_KEY = 'disabledKnowledgeSlugs'

export default defineEventHandler(async () => {
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { key: SETTING_KEY },
    })
    const raw = row?.value?.trim()
    if (!raw) return { disabledSlugs: [] as string[] }

    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return { disabledSlugs: [] as string[] }

    const validSlugs = new Set(FLUGPATE_TOPICS.map(topic => topic.slug))
    const disabledSlugs = parsed.filter((entry): entry is string => typeof entry === 'string' && validSlugs.has(entry))

    return { disabledSlugs }
  } catch {
    return { disabledSlugs: [] as string[] }
  }
})
