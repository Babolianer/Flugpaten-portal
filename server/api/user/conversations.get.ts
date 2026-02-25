import { prisma } from '~~/server/utils/prisma'
import { requireRole } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['USER', 'ADMIN'])

  const conversations = await prisma.conversation.findMany({
    where: { userId: user.id },
    include: {
      request: { select: { id: true, title: true } },
      organization: { select: { id: true, name: true, slug: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { body: true, createdAt: true, senderUserId: true, readAt: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return {
    conversations: conversations.map((c) => ({
      id: c.id,
      requestId: c.requestId,
      requestTitle: c.request?.title ?? null,
      orgName: c.organization?.name ?? null,
      orgSlug: c.organization?.slug ?? null,
      lastMessage: c.messages[0]
        ? {
            body: c.messages[0].body,
            createdAt: c.messages[0].createdAt.toISOString(),
            senderUserId: c.messages[0].senderUserId,
            readAt: c.messages[0].readAt?.toISOString() ?? null,
          }
        : null,
      updatedAt: c.updatedAt.toISOString(),
    })),
  }
})
