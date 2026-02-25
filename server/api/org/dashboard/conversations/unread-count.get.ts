import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'
import { getAccessibleOrgIds } from '~~/server/utils/orgAccess'

export default defineEventHandler(async (event) => {
  const orgIds = await getAccessibleOrgIds(event)
  if (orgIds.length === 0) {
    return { unreadCount: 0 }
  }

  const user = await requireRole(event, ['ORG_USER', 'ADMIN'])

  const conversations = await prisma.conversation.findMany({
    where: { organizationId: { in: orgIds } },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { senderUserId: true, readAt: true },
      },
    },
  })

  const unreadCount = conversations.filter(
    (c) =>
      c.messages[0] &&
      c.messages[0].senderUserId !== user.id &&
      c.messages[0].readAt === null
  ).length

  return { unreadCount }
})
