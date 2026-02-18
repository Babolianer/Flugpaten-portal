import { prisma } from '~~/server/utils/prisma'
import { getAccessibleOrgIds } from '~~/server/utils/orgAccess'

export default defineEventHandler(async (event) => {
  const orgIds = await getAccessibleOrgIds(event)
  if (orgIds.length === 0) {
    return { conversations: [] }
  }

  const conversations = await prisma.conversation.findMany({
    where: { organizationId: { in: orgIds } },
    include: {
      request: { select: { id: true, title: true } },
      user: { select: { id: true, displayName: true, email: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { body: true, createdAt: true, senderUserId: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return {
    conversations: conversations.map((c) => ({
      id: c.id,
      requestId: c.requestId,
      requestTitle: c.request?.title,
      userId: c.userId,
      userDisplayName: c.user?.displayName,
      userEmail: c.user?.email,
      lastMessage: c.messages[0]
        ? { body: c.messages[0].body, createdAt: c.messages[0].createdAt }
        : null,
      updatedAt: c.updatedAt,
    })),
  }
})
