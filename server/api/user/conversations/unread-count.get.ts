import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['USER', 'ADMIN'])

  const conversations = await prisma.conversation.findMany({
    where: { userId: user.id },
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
