import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'
import { ensureEmailNotificationRules } from '~~/server/utils/emailTriggerEngine'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])
  await ensureEmailNotificationRules()
  const rules = await prisma.emailNotificationRule.findMany({
    orderBy: [{ sortOrder: 'asc' }, { triggerKey: 'asc' }],
  })
  return { rules }
})
